#!/usr/bin/env node

"use strict";

var util = require("util");
var path = require("path");
var fs = require("fs");

var sqlite3 = require("sqlite3");
// require("console.table");


// ************************************

const DB_PATH = path.join(__dirname, "my.db");
const DB_SQL_PATH = path.join(__dirname, "mydb.sql");

var args = require("minimist")(process.argv.slice(2), {
	string: ["other", "table"],
});

main().catch(console.error);


// ************************************

var SQL3;



async function main() {
	if (!args.other) {
		error("Missing '--other=..'");
		return;
	}
	else if (!args.table) {
		error("Missing '--table=..'");
		return;
	}

	// define some SQLite3 database helpers
	var myDB = new sqlite3.Database(DB_PATH);
	SQL3 = {
		run(...args) {
			return new Promise(function c(resolve, reject) {
				myDB.run(...args, function onResult(err) {
					if (err) reject(err);
					else resolve(this);
				});
			});
		},
		get: util.promisify(myDB.get.bind(myDB)),
		all: util.promisify(myDB.all.bind(myDB)),
		exec: util.promisify(myDB.exec.bind(myDB)),
	};

	var initSQL = fs.readFileSync(DB_SQL_PATH, "utf-8");
	// TODO: initialize the DB structure

	await SQL3.exec(initSQL)

	var table = args.table
	var other = args.other;
	var something = Math.trunc(Math.random() * 1E9);

	// ***********

	// await deleteTable('Other')

	console.table("TABLE", await getTable(table))

	var otherID = await insertOrLookupOther(other)

	if (otherID) {
		let result = await insertSomething(otherID, something)
		if (result) {
			var records = await getAllRecords();
			if (records && records.length > 0) {
				console.table(records)
				return
			}
		}
	}
	error("Oops!");
}

async function insertSomething(otherID, something) {
	var result = await SQL3.run(
		`
		INSERT INTO 
			Something (otherID, data)
		VALUES
		  	(?, ?)
		`,
		otherID,
		something
	)

	if (result && result.changes > 0) {
		return true;
	}
	return false;
}

async function getTable(table) {
	var result = await SQL3.all(
		`
		SELECT
				id, data
		FROM
				${table}
		`
	);

	if (result && result.length > 0) {
		return result;
	}
}


async function getAllRecords() {
	var result = await SQL3.all(
		`
		 SELECT
				Other.data AS 'other',
				Something.data AS 'something'
			FROM
				Something JOIN Other
				ON (Something.otherID = Other.id)
			ORDER BY
			  Other.id DESC, Something.data ASC
				`
	);

	if (result && result.length > 0) {
		return result;
	}
}

async function deleteTable(table) {
	var result = await SQL3.run(
		`
			DELETE 
			FROM
				${table}	
		`
	)
	if (result && result.length > 0) {
		return result
	}
}

async function insertOrLookupOther(other) {
	var result = await SQL3.get(
		`
		SELECT
				id, data
		FROM	
				Other
		WHERE 
				data = ?
		`,
		other
	)
	if (result && result.id) {
		console.table(result)
		return result.id;
	}
	else {
		result = await SQL3.run(
			`
			INSERT INTO
					Other (data)
			VALUES
					(?)
			`,
			other
		);
		if (result && result.lastID) {
			return result.lastID;
		}
	}
}

function error(err) {
	if (err) {
		console.error(err.toString());
		console.log("");
	}
}

var os = require("os");
var path = require("path");
var fs = require("fs");
var cmdShim = require("cmd-shim");

var binPath = path.join(__dirname,"bin");
var [,,...args] = process.argv;
var [cmdFile = "index.js"] = args;

var cmdFilePath = path.resolve(cmdFile);
var localBinCmd = path.join(
	binPath,
	path.basename(cmdFilePath).replace(/\.[^\.\s]+$/,"")
);

try {
	fs.statSync(cmdFilePath);
}
catch (err) {
	console.log(`Command file not found: ${cmdFilePath}`);
	return;
}

// ensure ./bin directory exists
try {
	fs.statSync(binPath);
}
catch (err) {
	fs.mkdirSync(binPath);
}

cmdShim(cmdFilePath,localBinCmd,function onShim(err){
	if (err) throw err;
	console.log(`Mapped ${cmdFilePath} to ${localBinCmd}`);
});


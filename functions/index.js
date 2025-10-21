const functions = require("firebase-functions");
const admin = require("firebase-admin");
const glob = require("glob");
const path = require("path");

admin.initializeApp();

const files = glob.sync("./src/*.js", { cwd: __dirname });

const functionMap = {};

for (let i = 0, len = files.length; i < len; i++) {
    const file = files[i];
    const functionName = path.basename(file, ".js");
    functionMap[functionName] = require(file);
}

// Export all functions from the 'bots' file
if (functionMap.bots) {
    for (const key in functionMap.bots) {
        if (functionMap.bots.hasOwnProperty(key)) {
            exports[key] = functionMap.bots[key];
        }
    }
}

// Export all functions from the 'search' file
if (functionMap.search) {
    for (const key in functionMap.search) {
        if (functionMap.search.hasOwnProperty(key)) {
            exports[key] = functionMap.search[key];
        }
    }
}

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const glob = require("glob");
const path = require("path");

admin.initializeApp();

const files = glob.sync("./src/*.js", { cwd: __dirname });

for (let i = 0, len = files.length; i < len; i++) {
  const file = files[i];
  const functionName = path.basename(file, ".js");
  if (!process.env.FUNCTION_NAME || process.env.FUNCTION_NAME === functionName) {
    exports[functionName] = require(file);
  }
}

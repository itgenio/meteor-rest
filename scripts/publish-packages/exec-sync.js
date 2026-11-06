var child_process = require("child_process");

// Calls a command synchronously, returning an object with {stdout:
// ..., stderr: ...} or throwing an error on failure. `options` match
// the ones on `child_process.exec`.
//
function execSync(command, options) {
  console.log("running command: ", command);

  return {
    stdout: child_process.execSync(command, {
      ...(options || {}),
      encoding: "utf8",
    }),
    stderr: "",
  };
}

module.exports = execSync;

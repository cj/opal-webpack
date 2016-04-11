const execSync = require('child_process').execSync

module.exports = function (command) {
  return execSync(command)
}

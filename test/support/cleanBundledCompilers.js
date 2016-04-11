const execSync = require('child_process').execSync
const path = require('path')

module.exports = function() {
  const vendorPath = path.resolve(__dirname, '../../vendor')
  execSync(`rm -rf ${vendorPath}/opal-compiler-v*.js`)
}

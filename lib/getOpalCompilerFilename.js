const path = require('path')

if (process.env.OPAL_COMPILER_PATH) {
  module.exports = path.resolve(process.env.OPAL_COMPILER_PATH)
}
else {
  module.exports = path.resolve(__dirname, '../vendor/opal-compiler.js')
}

// allow watch unit testing more easily
if (typeof Opal === 'undefined') {
  const compilerPath = process.env.OPAL_COMPILER_PATH || '../vendor/opal-compiler.js'
  require(compilerPath)
}

module.exports = Opal

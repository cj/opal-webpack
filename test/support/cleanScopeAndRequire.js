const path = require('path')

module.exports = function () {
  // Opal touches these globals
  const opalBridges = [String, Number, Boolean, Date, Array, Error, RegExp, Function]
  opalBridges.forEach(function (bridge) { delete bridge.$$bridge })

  // fresh requires
  const clean = [
    'getOpalCompilerFilename',
    'getCompiler',
    'opal',
    'bundlerCheck',
    'getLoadPaths',
    'getStub',
    'resolveFilename',
    'transpile'
  ]
  const fullPaths = clean.map(function(p) { return path.resolve(__dirname, `../../lib/${p}.js`) })
  fullPaths.forEach(function(p) {
    delete require.cache[p]
  })

  delete require.cache[path.resolve(__dirname, '../../vendor/opal-compiler.js')]

  const env = process.env

  // back to original state
  env.OPAL_USE_BUNDLER = 'false'
  delete env.OPAL_COMPILER_PATH

  if (env.BUNDLE_BIN_ORIG) {
    env.BUNDLE_BIN = env.BUNDLE_BIN_ORIG
  }
  else {
    env.BUNDLE_BIN_ORIG = env.BUNDLE_BIN
  }

  delete env.RAILS_ENV
}

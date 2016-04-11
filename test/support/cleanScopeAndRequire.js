const path = require('path')

module.exports = function () {
  // Opal touches these globals
  delete String.$$bridged
  delete Number.$$bridged
  delete Boolean.$$bridged
  delete Date.$$bridged
  delete Array.$$bridged

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

  // back to original state
  process.env.OPAL_USE_BUNDLER = 'false'

  if (process.env.BUNDLE_BIN_ORIG) {
    process.env.BUNDLE_BIN = process.env.BUNDLE_BIN_ORIG
  }
  else {
    process.env.BUNDLE_BIN_ORIG = process.env.BUNDLE_BIN
  }

  delete process.env.RAILS_ENV
}

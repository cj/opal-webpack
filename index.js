'use strict'

const loaderUtils = require('loader-utils')
const pkg = require('./package.json')
const cache = require('./lib/fs-cache')
const resolveFilename = require('./lib/resolveFilename')
const Opal = require('./lib/opal')
const opalVersion = Opal.get('RUBY_ENGINE_VERSION')
const transpile = require('./lib/transpile')

function getCurrentLoader(loaderContext) {
  return loaderContext.loaders[loaderContext.loaderIndex]
}

module.exports = function(source) {
  var result = {}

  const webpackRemainingChain = loaderUtils.getRemainingRequest(this).split('!')
  const filename = webpackRemainingChain[webpackRemainingChain.length - 1]
  const globalOptions = this.options.opal || {}
  const loaderOptions = loaderUtils.parseQuery(this.query)
  const userOptions = Object.assign({}, globalOptions, loaderOptions)
  const relativeFileName = resolveFilename(filename).relative
  const defaultOptions = {
    sourceRoot: process.cwd(),
    filename: filename,
    relativeFileName: relativeFileName,
    // expire cache when this package or Opal changes
    cacheIdentifier: JSON.stringify({
      'opal-loader': pkg.version,
      'opal-compiler': opalVersion,
      env: process.env.OPAL_ENV || process.env.NODE_ENV
    })
  }
  const options = Object.assign({}, defaultOptions, userOptions)

  if (userOptions.sourceMap === undefined) {
    options.sourceMap = this.sourceMap
  }

  const cacheDirectory = options.cacheDirectory
  const cacheIdentifier = options.cacheIdentifier

  this.cacheable()

  const currentLoader = getCurrentLoader(this)
  const transpileInContext = function(source, opt) { return transpile(source, opt, currentLoader) }

  if (cacheDirectory) {
    var callback = this.async()
    return cache({
      directory: cacheDirectory,
      identifier: cacheIdentifier,
      source: source,
      options: options,
      transform: transpileInContext
    }, function(err, result) {
      if (err) {
        return callback(err)
      }
      return callback(null, result.code, result.map)
    })
  }
  result = transpileInContext(source, options)
  this.callback(null, result.code, result.map)
}

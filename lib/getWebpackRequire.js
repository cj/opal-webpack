'use strict'

const queryString = require('querystring')

function filterNonQueryPassOptions(options) {
  const passOnOptions = Object.assign({}, options)
  delete passOnOptions.sourceRoot
  delete passOnOptions.filename
  delete passOnOptions.sourceMap
  delete passOnOptions.relativeFileName
  // stubs are global, do not want to locally override these
  delete passOnOptions.stubs
  delete passOnOptions.externalOpal
  return passOnOptions
}

const noRequireable = require('./getOpalRequiresForStubbing')

module.exports = function(context, options, relativePath, absolutePath) {
  const passOnOptions = filterNonQueryPassOptions(options)
  const requirable = noRequireable.indexOf(relativePath) == -1
  Object.assign(passOnOptions, {
    file: relativePath,
    requirable: requirable
  })
  const flat = queryString.stringify(passOnOptions)
  return `require('!!${context.path}?${flat}!${absolutePath}');`
}

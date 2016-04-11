'use strict'

const getCompiler = require('./getCompiler')

module.exports = function(relativePath) {
  const compilerOptions = {
    relativeFileName: relativePath,
    requirable: true
  }
  const compiler = getCompiler('', compilerOptions)
  compiler.$compile()
  return compiler.$result()
}

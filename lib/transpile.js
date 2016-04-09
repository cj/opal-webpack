'use strict'

const path = require('path')
const fs = require('fs')

const resolveFilename = require('./resolveFilename')
const processSourceMaps = require('./processSourceMaps')
const getCompiler = require('./getCompiler')
const getOpalStub = require('./getOpalStub')
const getWebpackRequire = require('./getWebpackRequire')
const getJsRequire = require('./getJsRequire')
const compilerFilename = require('./getOpalCompilerFilename')
const opalRequiresForStubbing = require('./getOpalRequiresForStubbing')

function withoutLeadingRelative (filename) {
  const relativePath = /\.\/(.*)/.exec(filename)
  return relativePath ? relativePath[1] : filename
}

function getStubFilename(stubs, filename) {
  const relativePath = withoutLeadingRelative(filename)
  return stubs.indexOf(relativePath) != -1 ? relativePath : null
}

function prependCode(code, prepends) {
  return prepends.join(' ') + '\n' + code
}

function isBundledOpal(filename) {
  return filename === compilerFilename
}

module.exports = function transpile(source, options, context) {
  /*
    Workaround to make IO work,
    webpack polyfill global "process" module by default,
    while Opal::IO rely on it to deterimine in node environment or not
  */
  let prepend = ['process = undefined;']

  // bundled opal is already JS but will still be vulnerable to the process/webpack issue
  if (isBundledOpal(options.filename)) {
    return {
      code: prependCode(source, prepend)
    }
  }
  const compiler = getCompiler(source, options)

  compiler.$compile()

  const result = compiler.$result()
  const stubs = options.stubs

  const addRequires = files => {
    files.forEach(filename => {
      var stubFilename = stubs && getStubFilename(stubs, filename)
      var filePathInfo = stubFilename ? null : resolveFilename(filename)
      var absolutePath = filePathInfo ? filePathInfo.absolute : null
      var isBundledOpal = filePathInfo ? (opalRequiresForStubbing.indexOf(filePathInfo.relative) != -1) : false
      // bundled opal needs to route through webpack requires so we can deal with the webpack/process issue (see above)
      if (absolutePath && !isBundledOpal && absolutePath.match(/\.js$/)) {
        prepend = prepend.concat(getJsRequire(filename, absolutePath))
      }
      else if (!options.externalOpal || opalRequiresForStubbing.indexOf(filename) == -1) {
        var statement = stubFilename ? getOpalStub(stubFilename) : getWebpackRequire(context, options, filename, absolutePath)
        prepend.push(statement)
      }
    })
  }

  addRequires(compiler.$requires())

  compiler.$required_trees().forEach(function(dirname) {
    // path will only be relative to the file we're processing
    let resolved = path.resolve(options.filename, '..', dirname)
      // TODO: Look into making this async
    let files = fs.readdirSync(resolved)
    let withPath = []
      // fs.readdir only returns the filenames, not the base directory
    files.forEach(function(filename) {
      withPath.push(path.join(dirname, filename))
    })
    addRequires(withPath)
  })

  let response = {
    code: prependCode(result, prepend)
  }
  if (options.sourceMap) {
    response.map = processSourceMaps(compiler, source, options.filename, result, prepend)
  }
  return response
}

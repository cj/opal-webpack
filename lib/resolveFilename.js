'use strict'

const path = require('path')
const fs = require('fs')

const opalRequiresForStubbing = require('./getOpalRequiresForStubbing')
const opalCompilerFilename = require('./getOpalCompilerFilename')()
const useBundler = require('./bundlerCheck')()
const LOAD_PATH = require('./getLoadPaths')()

function checkPath(filename) {
  // opal only looks  @ the load path, so that's what we'll do
  for (var dir of LOAD_PATH) {
    let fullPath = path.resolve(dir, filename)
    if (fs.existsSync(fullPath)) {
      return {
        absolute: fullPath,
        relative: path.relative(dir, filename)
      }
    }
  }
  return null
}

module.exports = function resolveFilename(filename) {
  // in bundler mode, we'll use granular assets
  if (!useBundler && opalRequiresForStubbing.indexOf(filename) != -1) {
    return {
      absolute: opalCompilerFilename,
      relative: filename
    }
  }

  // Workaround to make "require 'opal'" work, original opal will try to concate raw js
  if (filename == 'corelib/runtime') {
    filename = 'corelib/runtime.js'
  }

  let result = null
  if (path.extname(filename) !== '') {
    result = checkPath(filename)
  }
  else {
    result = checkPath(filename + '.rb')
    if (!result) {
      result = checkPath(filename + '.js')
    }
  }

  if (result) {
    return result
  } else {
    throw new Error(`Cannot find file - ${filename} in load path ${LOAD_PATH}`)
  }
}

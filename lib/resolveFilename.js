'use strict'

const path = require('path')
const fs = require('fs')

const opalRequiresForStubbing = require('./getOpalRequiresForStubbing')

const LOAD_PATH = process.env.OPAL_LOAD_PATH ? process.env.OPAL_LOAD_PATH.split(':') : [process.cwd()]

if (LOAD_PATH.length === 0) {
  console.warn('OPAL_LOAD_PATH environment variable is not set')
  console.warn('By default, loader will only load from path relative to current source')
}

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
  if (opalRequiresForStubbing.indexOf(filename) != -1) {
    return {
      absolute: path.resolve(__dirname, '../vendor/opal-compiler.js'),
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
    throw new Error(`Cannot load file - ${filename}`)
  }
}

'use strict'

const execSync = require('child_process').execSync

const useBundler = require('./bundlerCheck')()
const bundlerExecute = require('./bundlerExecute')

module.exports = function() {
  const env = process.env

  var loadPath = env.OPAL_LOAD_PATH ? env.OPAL_LOAD_PATH.split(':') : [process.cwd()]
  const mriRequires = env.OPAL_MRI_REQUIRES ? env.OPAL_MRI_REQUIRES.split(':') : []
  const flatRequires = mriRequires.map(req => {return `require '${req}'`}).join(';')
  let rubyOutput = null

  if (useBundler) {
    if (env.RAILS_ENV) {
      // using rails runner to try and take advantage of spring
      rubyOutput = bundlerExecute(`rails runner '${flatRequires}; puts Opal.paths'`)
    }
    else {
      rubyOutput = bundlerExecute(`ruby -e "Bundler.require; ${flatRequires}; puts Opal.paths"`)
    }
  }
  else if (mriRequires.length > 0) {
    rubyOutput = execSync(`ruby -e "${flatRequires}; puts Opal.paths"`)
  }

  if (rubyOutput) {
    loadPath = rubyOutput.toString().trim().split('\n').concat(loadPath)
  }

  if (loadPath.length === 0) {
    console.warn('OPAL_LOAD_PATH environment variable is not set')
    console.warn('By default, loader will only load from path relative to current source')
  }
  return loadPath
}

'use strict'

const useBundler = require('./bundlerCheck')()
const bundlerExecute = require('./bundlerExecute')

module.exports = function() {
  var loadPath = process.env.OPAL_LOAD_PATH ? process.env.OPAL_LOAD_PATH.split(':') : [process.cwd()]

  if (useBundler) {
    let rubyOutput = null
    if (process.env.RAILS_ENV) {
      // using rails runner to try and take advantage of spring
      rubyOutput = bundlerExecute('rails runner \'puts Opal.paths\'')
    }
    else {
      // these quotes are fine
      // eslint-disable-next-line
      rubyOutput = bundlerExecute('ruby -e "Bundler.require; puts Opal.paths"')
    }
    loadPath = rubyOutput.toString().trim().split("\n").concat(loadPath)
  }

  if (loadPath.length === 0) {
    console.warn('OPAL_LOAD_PATH environment variable is not set')
    console.warn('By default, loader will only load from path relative to current source')
  }
  return loadPath;
}

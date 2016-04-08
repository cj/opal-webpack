'use strict'

const path = require('path')

const Opal = require('./opal')

// TODO: spend some time looking at the exact convention of 'file' as it goes into here
// with different load paths and relative vs. not
// Make sure we match that so we can depend on opal compiler code for exact path resolution
module.exports = function(source, options) {
  // it's important to not give an absolute path to Opal (only relative to load path)
  // otherwise absolute paths end up in the compiled code
  // don't want Opal.modules to have an extension
  var fileToUse = options.file || options.relativeFileName
  fileToUse = fileToUse.replace(path.extname(fileToUse), '')

  const compilerOptions = Object.assign({}, options, {
    file: fileToUse // opal calls it file
  })
  delete compilerOptions.filename
  // work with opal 0.9 or 0.10
  const compilerClass = Opal.Opal.Compiler || Opal.Opal.$$scope.Compiler
  return compilerClass.$new(source, Opal.hash(compilerOptions))
}

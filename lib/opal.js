// allow watch unit testing more easily
if (typeof Opal === 'undefined') {
  const compilerPath = require('./getOpalCompilerFilename')
  require(compilerPath)
}

module.exports = Opal

const compilerPath = require('./getOpalCompilerFilename')()
require(compilerPath)

module.exports = Opal

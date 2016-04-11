const compilerPath = require('./getOpalCompilerFilename')()
require(compilerPath)
console.log(`loaded Opal version ${Opal.get('RUBY_ENGINE_VERSION')} from path ${compilerPath}`)

module.exports = Opal

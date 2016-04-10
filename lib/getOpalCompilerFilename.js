const path = require('path')
const execSync = require('child_process').execSync
const fs = require('fs')

function getBundlerFilename() {
  const versionString = execSync('opal -v').toString().trim() // faster than running opal itself
  const versionOnly = /Opal (.*)/.exec(versionString)[1]
  return path.resolve(__dirname, `../vendor/opal-compiler-${versionOnly}.js`)
}

function bundledFileExists(filename) {
  try {
    const stats = fs.statSync(filename)
    return stats.isFile()
  }
  catch (err) {
    return false
  }
}

function createBundledCompiler(filename) {
  console.log(`Bundle derived compiler ${filename} doesn't exist. Creating!`)
  const compilerPath = path.resolve(__dirname, 'compiler.rb')
  execSync(`opal --no-exit -c ${compilerPath} > ${filename}`)
}

if (process.env.OPAL_USE_BUNDLER) {
  const filename = getBundlerFilename()

  if (!bundledFileExists(filename)) {
    createBundledCompiler(filename)
  }

  module.exports = filename
}
else if (process.env.OPAL_COMPILER_PATH) {
  module.exports = path.resolve(process.env.OPAL_COMPILER_PATH)
}
else {
  module.exports = path.resolve(__dirname, '../vendor/opal-compiler.js')
}

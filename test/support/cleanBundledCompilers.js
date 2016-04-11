const path = require('path')
const glob = require('glob')
const fs = require('fs')

module.exports = function(done) {
  const vendorPath = path.resolve(__dirname, '../../vendor')

  glob(path.join(vendorPath, '**/opal-compiler-v*.js'), {}, function(err, files) {
    if (err) { return done(err) }
    files.forEach(function(file) {
      // recreating this messes up mocha watch
      //fs.unlinkSync(file)
      delete require.cache[file]
    })
    return done()
  })
}

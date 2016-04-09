// TODO: this will need to be dynamic now

// allow watch unit testing more easily
if (typeof Opal === 'undefined') {
  require('../vendor/opal-compiler.js')
}

module.exports = Opal

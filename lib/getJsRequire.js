'use strict'

module.exports = function(relativePath, absolutePath) {
  return [
    `require('${absolutePath}');`,
    `Opal.loaded('${relativePath}');`
  ]
}

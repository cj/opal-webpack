const useBundler = (typeof process.env.BUNDLE_BIN !== 'undefined') && process.env.OPAL_USE_BUNDLER !== 'false'

module.exports = function() {
  return useBundler
}

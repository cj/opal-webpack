const execSync = require('child_process').execSync

module.exports = function (command) {
  // in case already in Bundler
  const base = process.env.BUNDLE_BIN ? '' : 'bundle exec '
  return execSync(`${base}${command}`)
}

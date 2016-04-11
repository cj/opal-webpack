const tmp = require('tmp')
const fs = require('fs')
const exec = require('child_process').exec
const path = require('path')

function runTestAgainstOtherFile(code, callback, omitBundlerSetting, envOverrides, hideBundler) {
  tmp.file({
    dir: process.env.TMP
  },
  function (err, tmpPath, fd, cleanup) {
    fs.writeFile(tmpPath, code, function (err) {
      if (err) {
        cleanup()
        return callback(err)
      }

      const nodePaths = [
        path.resolve(__dirname, '../..'), // we'll assume we're at the root level
        path.resolve(__dirname, '../../node_modules')
      ]

      const environment = Object.assign({}, process.env)
      Object.assign(environment, {
        OPAL_USE_BUNDLER: true,
        NODE_PATH: nodePaths.join(':')
      })

      if (omitBundlerSetting) {
        delete environment.OPAL_USE_BUNDLER
      }
      if (hideBundler) {
        delete environment.BUNDLE_BIN
      }

      Object.assign(environment, envOverrides)

      // console.log('node env')
      // console.dir(environment)

      const nodeBinary = path.join(process.env.NVM_BIN, 'node')
      exec(`${nodeBinary} ${tmpPath}`, {
        env: environment
      },
      function (err, stdout) {
        if (err) {
          cleanup()
          return callback(err)
        }

        try {
          const result = stdout.trim()
          return callback(null, result)
        }
        finally {
          cleanup()
        }
      })
    })
  })
}

module.exports = {
  execute: runTestAgainstOtherFile
}

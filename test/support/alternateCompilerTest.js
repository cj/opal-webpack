const tmp = require('tmp')
const fs = require('fs')
const exec = require('child_process').exec
const path = require('path')

const compilerAbsolutePath = path.resolve(__dirname, '../support/tweakedOpalCompiler.js')

function runTestAgainstOtherFile(code, callback) {
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

      const environment = Object.assign(process.env, {
        OPAL_COMPILER_PATH: compilerAbsolutePath,
        NODE_PATH: nodePaths.join(':')
      })

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
  execute: runTestAgainstOtherFile,
  relativePath: './test/support/tweakedOpalCompiler.js',
  absolutePath: compilerAbsolutePath
}

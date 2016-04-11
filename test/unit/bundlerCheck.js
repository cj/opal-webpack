'use strict'

const expect = require('chai').expect
const bundlerCompilerTest = require('../support/bundlerCompilerTest')

describe('bundlerCheck', function(){
  function doCheck(done, expectedResult, omitBundlerSetting, envOverrides, hideBundler) {
    const code = `const bundlerCheck = require('lib/bundlerCheck')\nconsole.log(bundlerCheck())`
    bundlerCompilerTest.execute(code, function(err, result) {
      if (err) { return done(err) }

      expect(result).to.eq(expectedResult)
      return done()
    },omitBundlerSetting, envOverrides, hideBundler)
  }

  it('is on if bundler is there with no OPAL_USE_BUNDLER supplied', function (done) {
    doCheck(done, 'true', true)
  })

  it('is on if bundler is there with OPAL_USE_BUNDLER supplied as true', function (done) {
    // bundlerCompilerTest will include the env variable
    doCheck(done, 'true', false)
  })

  it('is off if bundler is there with OPAL_USE_BUNDLER supplied as false', function(done) {
    doCheck(done, 'false', true, {OPAL_USE_BUNDLER: false})
  })

  it('is off if bundler is not there', function (done) {
    doCheck(done, 'false', true, {}, true)
  })
})

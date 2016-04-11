'use strict'

const expect = require('chai').expect
const cleanScopeAndRequire = require('../support/cleanScopeAndRequire')

describe('bundlerCheck', function(){
  beforeEach(cleanScopeAndRequire)

  function bundlerCheck() {
    return require('../../lib/bundlerCheck')()
  }

  it('is on if bundler is there with no OPAL_USE_BUNDLER supplied', function () {
    delete process.env.OPAL_USE_BUNDLER
    process.env.BUNDLE_BIN = 'foo'

    expect(bundlerCheck()).to.eq(true)
  })

  it('is on if bundler is there with OPAL_USE_BUNDLER supplied as true', function () {
    process.env.OPAL_USE_BUNDLER = 'true'
    process.env.BUNDLE_BIN = 'foo'

    expect(bundlerCheck()).to.eq(true)
  })

  it('is off if bundler is there with OPAL_USE_BUNDLER supplied as false', function() {
    process.env.OPAL_USE_BUNDLER = 'false'
    process.env.BUNDLE_BIN = 'foo'

    expect(bundlerCheck()).to.eq(false)
  })

  it('is off if bundler is not there', function () {
    delete process.env.OPAL_USE_BUNDLER
    delete process.env.BUNDLE_BIN

    expect(bundlerCheck()).to.eq(false)
  })
})

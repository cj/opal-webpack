'use strict'

const expect = require('chai').expect
const path = require('path')

const cleanScopeAndRequire = require('../support/cleanScopeAndRequire')

describe('resolveFilename', function(){
  beforeEach(cleanScopeAndRequire)

  function resolveFilename(filename) {
    const func = require('../../lib/resolveFilename')
    return func(filename)
  }

  function bundlerResolve(filename) {
    process.env.OPAL_USE_BUNDLER = 'true'
    return resolveFilename(filename)
  }

  it('uses Bundler load paths if Bundler is running', function() {
    this.timeout(12000)

    const result = bundlerResolve('opal-browser')

    expect(result.absolute).to.match(/gems\/opal-browser-.*\/opal\/opal-browser\.rb/)
    expect(result.relative).to.match(/.*opal-browser.rb/)
  })

  it('resolves corelib/runtime as a JS file in Bundler mode', function() {
    const result = bundlerResolve('corelib/runtime')

    expect(result.absolute).to.match(/gems\/opal.*corelib\/runtime.js/)
    expect(result.relative).to.match(/.*corelib\/runtime.js/)
  })

  it('resolves the Opal compiler in non bundler mode', function() {
    const result = resolveFilename('opal')

    expect(result.absolute).to.eq(path.resolve(__dirname, '../../vendor/opal-compiler.js'))
    expect(result.relative).to.eq('opal')
  })

  it('resolves a test fixture', function() {
    const result = resolveFilename('arity_1')

    expect(result.absolute).to.eq(path.resolve(__dirname, '../fixtures/arity_1.rb'))
    expect(result.relative).to.eq('../../arity_1.rb')
  })

  it('throws error if not found', function() {
    expect(function() { resolveFilename('not_found.rb')}).to.throw('Cannot find file - not_found.rb in load path ./test/fixtures,./test/fixtures/load_path')
  })
})

'use strict'

const expect = require('chai').expect
const path = require('path')

const cleanScopeAndRequire = require('../support/cleanScopeAndRequire')

describe.only('resolveFilename', function(){
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
    this.timeout(6000)

    const result = bundlerResolve('opal-browser')

    expect(result.absolute).to.match(/gems\/opal-browser-.*\/opal\/opal-browser\.rb/)
    expect(result.relative).to.match(/.*opal-browser.rb/)
  })

  it('allows additional MRI requires', function() {
    process.env.OPAL_MRI_REQUIRES = 'opal-browser'

    const result = resolveFilename('opal-browser')

    expect(result.absolute).to.match(/gems\/opal-browser-.*\/opal\/opal-browser\.rb/)
    expect(result.relative).to.match(/.*opal-browser.rb/)
  })

  it('allows additional MRI requires with bundler', function() {
    process.env.OPAL_MRI_REQUIRES = 'opal-builder'

    const result = bundlerResolve('builder')

    expect(result.absolute).to.match(/gems\/opal-builder-.*\/opal\/builder\.rb/)
    expect(result.relative).to.match(/.*builder.rb/)
  })

  it('passes bundled copy of opal through in non bundler mode', function() {
    const result = resolveFilename('opal')

    expect(result.absolute).to.eq(path.resolve(__dirname, '../../vendor/opal-compiler.js'))
    expect(result.relative).to.eq('opal')
  })

  it('Rails hook is listening', function() {
    process.env.RAILS_ENV = 'unexpected_env'

    expect(function() { bundlerResolve('opal-browser')}).to.throw(/Command failed: rails runner/)
  })

  it('uses Rails load paths if Rails is running', function() {
    process.env.RAILS_ENV = 'foobar'

    const result = bundlerResolve('opal-browser')

    expect(result.absolute).to.match(/gems\/opal-browser-.*\/opal\/opal-browser\.rb/)
    expect(result.relative).to.match(/.*opal-browser.rb/)
  })

  it('allows additional MRI requires with Rails', function() {
    process.env.RAILS_ENV = 'foobar'
    process.env.OPAL_MRI_REQUIRES = 'opal-builder'

    const result = resolveFilename('builder')

    expect(result.absolute).to.match(/gems\/opal-builder-.*\/opal\/builder\.rb/)
    expect(result.relative).to.match(/.*builder.rb/)
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

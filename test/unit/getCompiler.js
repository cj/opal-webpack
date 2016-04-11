'use strict'

const expect = require('chai').expect
const path = require('path')

const cleanScopeAndRequire = require('../support/cleanScopeAndRequire')
const cleanBundledCompilers = require('../support/cleanBundledCompilers')
const execSync = require('child_process').execSync

describe('compiler', function(){
  beforeEach(cleanScopeAndRequire)
  beforeEach(function (done) {
    cleanBundledCompilers(done)
  })

  function getCompiler(source, targetOptions) {
    return require('../../lib/getCompiler')(source, targetOptions)
  }

  function doCompile(relativeFileName, source, options) {
    const targetOptions = {
      relativeFileName: relativeFileName
    }
    Object.assign(targetOptions, options)
    const compiler = getCompiler(source, targetOptions)
    compiler.$compile()
    return compiler.$result()
  }

  it('loads an Opal compiler from a configurable file', function() {
    process.env.OPAL_COMPILER_PATH = path.resolve(__dirname, '../support/tweakedOpalCompiler.js')

    const result = doCompile('foo', 'puts "Howdy #{1+2}"')
    expect(result).to.include('0.10.0.beta2.webpacktest')
  })

  it('can fetch an Opal compiler from Bundler', function() {
    this.timeout(6000)

    process.env.OPAL_USE_BUNDLER = 'true'

    const result = doCompile('foo', 'puts "Howdy #{1+2}"')
    expect(result).to.include('0.10.0.beta2')
  })

  it('raw compiler works', function(){
    var result = doCompile('foo', 'puts "Howdy #{1+2}"')

    expect(result).to.include('self.$puts("Howdy " + ($rb_plus(1, 2)))')
  })

  it('handles syntax errors', function(done) {
    // was having problems with chai expect throw assertions
    let error = null
    try {
      doCompile('foo', 'def problem')
    }
    catch (e) {
      error = e
    }
    if (error) {
      if (error.name === 'SyntaxError' && /An error occurred while compiling: foo[\S\s]*false/.test(error.message)) {
        return done()
      }
      else {
        return done(new Error(`Unexpected error ${error}`))
      }
    }
    return done(new Error('expected error, got none'))
  })

  it('passes on compiler options', function() {
    var result = doCompile('foo', 'def abc(hi); end;', {arity_check: true})

    expect(result).to.include('Opal.ac')
  })

  it('does not erase filename from options since follow on code in transpile needs it', function() {
    var options = {
      filename: '/stuff/junk.rb',
      relativeFileName: 'junk.rb'
    }
    getCompiler('HELLO=123', options)

    expect(options.filename).to.eq('/stuff/junk.rb')
  })

  describe('Opal module declarations', function () {
    function doModuleCompile(filename) {
      return doCompile(filename, 'HELLO=123', {
        requirable: true,
        file: filename
      })
    }

    it('standard', function() {
      var result = doModuleCompile('dependency')

      expect(result).to.include('Opal.modules["dependency"]')
    })

    it('allows file directive from parent file/path to override', function() {
      var result = doCompile('foo/dependency', 'HELLO=123', {
        requirable: true,
        file: 'dependency'
      })

      expect(result).to.include('Opal.modules["dependency"]')
    })

    it('require_relative', function() {
      var result = doModuleCompile('dependency/foo')

      expect(result).to.match(/Opal.modules\["dependency\/foo"\]/)
    })

    it('node conventions', function() {
      var result = doModuleCompile('./dependency')

      expect(result).to.include('Opal.modules["./dependency"]')
    })
  })

  describe('Opal requires', function() {
    function doRequireCompile(statement) {
      return doCompile('foo.rb', statement, {
        stubs: ['a_file']
      })
    }

    it('node conventions', function () {
      var result = doRequireCompile('require "./a_file"')

      expect(result).to.include('self.$require("./a_file")')
    })

    it('standard require', function () {
      var result = doRequireCompile('require "a_file"')

      expect(result).to.include('self.$require("a_file")')
    })

    it('require relative', function () {
      var result = doRequireCompile('require_relative "a_file"')

      expect(result).to.include('self.$require("foo"+ \'/../\' + "a_file")')
    })

    it('require relative with leading dot', function () {
      var result = doRequireCompile('require_relative "./a_file"')

      expect(result).to.include('self.$require("foo"+ \'/../\' + "./a_file")')
    })
  })
})

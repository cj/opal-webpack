'use strict'

const expect = require('chai').expect

const getCompiler = require('../../lib/getCompiler')
const alternateCompilerTest = require('../support/alternateCompilerTest')
const bundlerCompilerTest = require('../support/bundlerCompilerTest')
const cleanBundledCompilers = require('../support/cleanBundledCompilers')
const execSync = require('child_process').execSync

describe('compiler', function(){
  function doCompile(relativeFileName, source, options) {
    const targetOptions = {
      relativeFileName: relativeFileName
    }
    Object.assign(targetOptions, options)
    const compiler = getCompiler(source, targetOptions)
    compiler.$compile()
    return compiler.$result()
  }

  beforeEach(cleanBundledCompilers)
  afterEach(function() {
    // was causing some state issues between tests
    delete process.env.OPAL_USE_BUNDLER
  })

  it('loads an Opal compiler from a configurable file', function(done) {
    const code = `const getCompiler = require('lib/opal')\nconsole.log(Opal.get('RUBY_ENGINE_VERSION'))`
    alternateCompilerTest.execute(code, function(err, result) {
      if (err) { return done(err) }

      expect(result).to.eq('0.10.0.beta2.webpacktest')
      return done()
    })
  })

  it('can fetch an Opal compiler from Bundler', function(done) {
    this.timeout(6000)

    const code = `const getCompiler = require('lib/opal')\nconsole.log(Opal.get('RUBY_ENGINE_VERSION'))`

    bundlerCompilerTest.execute(code, function(err, result) {
      if (err) { return done(err) }

      if (execSync('opal -v').toString().trim().indexOf('0.9') != -1) {
        expect(result).to.match(/exist. Creating[\S\s]+0.9.2/)
      }
      else{
        expect(result).to.match(/exist. Creating[\S\s]+0.10.0.beta2/)
      }
      return done()
    })
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

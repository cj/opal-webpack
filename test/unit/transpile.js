'use strict'

const expect = require('chai').expect
const transpile = require('../../lib/transpile')
const path = require('path')

describe('transpile', function(){
  const wpContext = {
    path: 'the_loader_path'
  }

  function doTranspile(code, options, filename, relativeFileName) {
    const targetOptions = {
      sourceRoot: process.cwd(),
      filename: filename || 'foo.rb',
      relativeFileName: relativeFileName || 'foo.rb'
    }
    Object.assign(targetOptions, options)
    return transpile(code, targetOptions, wpContext).code
  }

  it('compiles an endpoint', function() {
    var result = doTranspile('HELLO=123')

    expect(result).to.include('Opal.cdecl($scope, \'HELLO\', 123)')
    expect(result).to.not.include('Opal.modules')
  })

  it('passes bundled opal through', function() {
    var result = doTranspile('the code',
                             {},
                             path.resolve(__dirname, '../../vendor/opal-compiler.js'),
                             'opal-compiler.js')
    expect(result).to.eq('process = undefined;\nthe code')
  })

  describe('webpack requires', function() {
    it('standard', function() {
      var result = doTranspile('require "another_dependency"')

      expect(result).to.match(/require\('!!the_loader_path\?file=another_dependency&requirable=true!.*\/test\/fixtures\/another_dependency\.rb'\);/)
    })

    it('bundled opal', function() {
      var result = doTranspile('require "opal"')

      expect(result).to.match(/require\('!!the_loader_path\?file=opal&requirable=true!.*\/vendor\/opal-compiler.js'\);/)
    })

    it('node convention', function() {
      var result = doTranspile('require "./another_dependency"')

      expect(result).to.match(/require\('!!the_loader_path\?file=\.%2Fanother_dependency&requirable=true!.*\/test\/fixtures\/another_dependency\.rb'\);/)
    })

    it('JS require', function() {
      var result = doTranspile('require "pure_js"')

      expect(result).to.match(/require\('imports!.*test\/fixtures\/pure_js.js'\);/)
    })
  })

  describe('stubbed module declarations', function() {
    it('via require', function() {
      const options = {
        stubs: ['stubbed']
      }
      var result = doTranspile('require "stubbed"; HELLO=123', options)

      expect(result).to.include('Opal.cdecl($scope, \'HELLO\', 123)')
      expect(result).to.include('Opal.modules["stubbed"]')
    })

    it('via require_relative', function() {
      const options = {
        stubs: ['stubbed']
      }
      var result = doTranspile('require_relative "stubbed"; HELLO=123', options)

      expect(result).to.include('Opal.cdecl($scope, \'HELLO\', 123)')
      expect(result).to.include('Opal.modules["stubbed"]')
    })

    it('via node conventions', function() {
      const options = {
        stubs: ['stubbed']
      }

      var result = doTranspile('require "./stubbed"; HELLO=123', options)

      expect(result).to.include('Opal.cdecl($scope, \'HELLO\', 123)')
      expect(result).to.include('Opal.modules["stubbed"]')
    })
  })

  it('Opal require statements', function() {
    var result = doTranspile('require "another_dependency"')

    expect(result).to.include('self.$require("another_dependency")')
  })

  it('passes on requirable', function() {
    var result = doTranspile('HELLO=123', {requirable: true}, '/stuff/foo.rb', 'foo.rb')

    expect(result).to.include('Opal.cdecl($scope, \'HELLO\', 123)')
    expect(result).to.include('Opal.modules["foo"]')
  })

  it('passes on compile options', function() {
    var result = doTranspile('def abc(hi); end;', {arity_check: true})

    expect(result).to.include('Opal.ac')
  })
})

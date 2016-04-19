'use strict'

const expect = require('chai').expect
const execSync = require('child_process').execSync
const path = require('path')

const cleanScopeAndRequire = require('../support/cleanScopeAndRequire')

describe('transpile', function(){
  const env = process.env

  beforeEach(cleanScopeAndRequire)

  const wpContext = {
    path: 'the_loader_path'
  }

  function getOpalCompilerFilename() {
    return require('../../lib/getOpalCompilerFilename')()
  }

  function transpile(code, targetOptions, context) {
    return require('../../lib/transpile')(code, targetOptions, context)
  }

  function useTweakedCompiler() {
    env.OPAL_COMPILER_PATH = path.resolve(__dirname, '../support/tweakedOpalCompiler.js')
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
                             getOpalCompilerFilename(),
                             'opal-compiler.js')
    expect(result).to.eq('process = undefined;\nthe code')
  })

  // simple stub "template"
  it('allows stubbing opal requires so they can be provided outside webpack', function() {
    const options = {
      externalOpal: true
    }

    var result = doTranspile('require "opal"; HELLO=123', options)

    expect(result).to.include('Opal.cdecl($scope, \'HELLO\', 123)')
    expect(result).to.not.include("require('!!the_loader_path?file=opal")
    expect(result).to.not.include('Opal.modules["opal"]')
  })

  it('loads an Opal compiler from a configurable file', function() {
    useTweakedCompiler()

    var result = doTranspile('HELLO=123')

    expect(result).to.include('Generated by Opal 0.10.0.beta2.webpacktest')
  })

  it('passes custom configured Opal through', function() {
    useTweakedCompiler()

    var result = doTranspile('the code',
                             {},
                             getOpalCompilerFilename(),
                             'opal-compiler.js')
    expect(result).to.eq('process = undefined;\nthe code')
  })

  it('can use a Bundler provided version of Opal', function () {
    this.timeout(6000)

    env.OPAL_USE_BUNDLER = 'true'

    var result = doTranspile('HELLO=123')
    expect(getOpalCompilerFilename()).to.match(/vendor.*opal-compiler-v.*/)

    if (execSync('opal -v').toString().trim().indexOf('0.9') != -1) {
      expect(result).to.include('Generated by Opal 0.9.2')
    }
    else{
      expect(result).to.include('Generated by Opal 0.10.0')
    }
  })

  it('uses stubs from Opal gems', function() {
    this.timeout(6000)

    env.OPAL_USE_BUNDLER = 'true'
    env.OPAL_MRI_REQUIRES = 'additional_require'
    env.RUBYLIB = env.RUBYLIB + ':test/support'

    var result = doTranspile("require 'addtl_stub'")
    expect(result).to.include('Opal.modules["addtl_stub"]')
  })

  describe('webpack requires', function() {
    it('standard', function() {
      var result = doTranspile('require "another_dependency"')

      expect(result).to.match(/require\('!!the_loader_path\?file=another_dependency&requirable=true!.*\/test\/fixtures\/another_dependency\.rb'\);/)
    })

    context('for compiler js file', function () {
      context('using bundled redirects requires for', function() {
        it('opal', function() {
          var result = doTranspile('require "opal"')

          expect(result).to.match(/require\('!!the_loader_path\?file=opal&requirable=false!.*\/vendor\/opal-compiler.js'\);/)
        })
        it('opal/full', function() {
          var result = doTranspile('require "opal/full"')

          expect(result).to.match(/require\('!!the_loader_path\?file=opal%2Ffull&requirable=false!.*\/vendor\/opal-compiler.js'\);/)
        })
        it('opal/mini', function() {
          var result = doTranspile('require "opal/mini"')

          expect(result).to.match(/require\('!!the_loader_path\?file=opal%2Fmini&requirable=false!.*\/vendor\/opal-compiler.js'\);/)
        })
      })

      function runOpalRequireTest(ruby) {
        useTweakedCompiler()

        return doTranspile(ruby)
      }

      context('using custom file redirects requires for', function() {
        it('opal', function() {
          var result = runOpalRequireTest('require "opal"')

          expect(result).to.match(/require\('!!the_loader_path\?file=opal&requirable=false!.*tweakedOpalCompiler.js'\);/)
        })
        it('opal/full', function() {
          var result = runOpalRequireTest('require "opal/full"')

          expect(result).to.match(/require\('!!the_loader_path\?file=opal%2Ffull&requirable=false!.*tweakedOpalCompiler.js'\);/)
        })
        it('opal/mini', function() {
          var result = runOpalRequireTest('require "opal/mini"')

          expect(result).to.match(/require\('!!the_loader_path\?file=opal%2Fmini&requirable=false!.*tweakedOpalCompiler.js'\);/)
        })
      })
    })

    context('for bundler provided opal', function() {
      this.timeout(10000)

      function runOpalRequireTest(ruby) {
        env.OPAL_USE_BUNDLER = 'true'

        return doTranspile(ruby)
      }

      describe('does not redirect', function() {
        it('opal', function() {
          var result = runOpalRequireTest('require "opal"')

          expect(result).to.match(/require\('!!the_loader_path\?file=opal&requirable=false!.*gems.*opal\/opal\.rb'\)/)
        })
        it('opal/full', function() {
          if (execSync('opal -v').toString().trim().indexOf('0.9') != -1) {
            // 0.10 feature
            this.skip()
          }
          else {
            var result = runOpalRequireTest('require "opal/full"')

            expect(result).to.match(/require\('!!the_loader_path\?file=opal%2Ffull&requirable=false!.*gems.*opal\/opal\/full\.rb'\)/)
          }
        })
        it('opal/mini', function() {
          var result = runOpalRequireTest('require "opal/mini"')

          expect(result).to.match(/require\('!!the_loader_path\?file=opal%2Fmini&requirable=false!.*gems.*opal\/opal\/mini\.rb'\)/)
        })
      })
    })

    it('node convention', function() {
      var result = doTranspile('require "./another_dependency"')

      expect(result).to.match(/require\('!!the_loader_path\?file=\.%2Fanother_dependency&requirable=true!.*\/test\/fixtures\/another_dependency\.rb'\);/)
    })

    it('JS require', function() {
      var result = doTranspile('require "pure_js"')

      expect(result).to.match(/require\('.*test\/fixtures\/pure_js.js'\);/)
    })

    it('require_tree', function() {
      var result = doTranspile('require_tree "tree"', {}, path.resolve(__dirname, '../fixtures/tree.rb'), 'tree.rb')

      expect(result).to.match(/require\('!!the_loader_path\?file=tree%2Ffile1\.rb&requirable=true!.*tree\/file1\.rb'\)/)
      expect(result).to.match(/require\('!!the_loader_path\?file=tree%2Ffile2\.rb&requirable=true!.*tree\/file2\.rb'\)/)
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

  describe('Opal require statements', function() {
    it('standard', function() {
      var result = doTranspile('require "another_dependency"')

      expect(result).to.include('self.$require("another_dependency")')
    })

    it('relative', function() {
      var result = doTranspile('require_relative "another_dependency"')

      expect(result).to.include('self.$require("foo"+ \'/../\' + "another_dependency")')
    })

    it('tree', function() {
      var result = doTranspile('require_tree "tree"', {}, path.resolve(__dirname, '../fixtures/tree.rb'), 'tree.rb')

      expect(result).to.include('self.$require_tree("tree")')
    })

    it('tree with relative path', function() {
      var result = doTranspile('require_tree "./tree"', {}, path.resolve(__dirname, '../fixtures/tree.rb'), 'tree.rb')

      expect(result).to.include('self.$require_tree("tree")')
    })
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

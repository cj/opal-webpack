'use strict'

const rimraf = require('rimraf')
const assign = require('object-assign')
const expect = require('chai').expect
const mkdirp = require('mkdirp')
const fs = require('fs')
const path = require('path')
const webpack = require('webpack')
const execSync = require('child_process').execSync
const fsExtra = require('fs-extra')
const Opal = require('../../lib/opal')
const opalVersion = Opal.get('RUBY_ENGINE_VERSION')

RegExp.escape = function(s) {
  return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
}

describe('integration', function(){
  const tmpDir = path.resolve(__dirname, '../../tmp')
  const opalCompilerPath = path.resolve(__dirname, '../../vendor/opal-compiler.js')
  const outputBaseDir = path.resolve(tmpDir, 'output')
  const cacheDir = path.join(outputBaseDir, 'cache')
  const fixturesDir = path.resolve(__dirname, '../fixtures')
  const currentDirectoryExp = new RegExp(RegExp.escape(process.cwd()))
  function aFixture(file) { return path.join(fixturesDir, file) }

  const dependencyMain = aFixture('dependency.rb')
  const dependencyBackup = aFixture('dependency.rb.backup')
  const opalLoader = path.resolve(__dirname, '../../')
  const outputDir = path.resolve(outputBaseDir, 'loader')
  const globalConfig = {
    output: {
      path: outputDir,
      filename: '[id].loader.js'
    },
    module: {
      loaders: [{ test: /\.rb$/, loader: opalLoader }]
    }
  }

  function assertBasic(config, done) {
    webpack(config, (err, stats) => {
      expect(err).to.be.null
      let errors = stats.compilation.errors
      if (errors.length > 0) {
        console.dir(errors[0].stack)
      }
      expect(errors).to.be.empty

      fs.readdir(outputDir, (err, files) => {
        expect(err).to.be.null
        expect(files).to.have.length(1)
        fs.readFile(path.resolve(outputDir, files[0]), (err, data) => {
          var subject = data.toString()

          expect(err).to.be.null
          expect(subject).to.include('Opal.cdecl($scope, \'HELLO\', 123)')
          expect(subject).to.not.match(currentDirectoryExp)
          expect(runCode()).to.eq('123\n')

          return done()
        })
      })
    })
  }

  beforeEach(function(done) {
    fsExtra.mkdirp('./tmp', done)
  })

  function runCode(otherArgs) {
    const args = otherArgs || ''
    return execSync(`node -r ${opalCompilerPath} ${args} ${path.join(outputDir, '0.loader.js')} 2>&1 || true`).toString()
  }

  beforeEach(function (done) {
    fsExtra.copySync(dependencyMain, dependencyBackup, {clobber: true})
    rimraf(outputBaseDir, function(err) {
      if (err) { return done(err) }
      mkdirp(outputDir, done)
    })
  })

  afterEach(function (done) {
    // cleanup
    fsExtra.copy(dependencyBackup, dependencyMain, {clobber: true}, done)
  })

  it('loads basic files', function (done) {
    const config = assign({}, globalConfig, {
      entry: aFixture('entry_basic.js')
    })
    assertBasic(config, done)
  })

  it('loads requires', function (done){
    const config = assign({}, globalConfig, {
      entry: aFixture('entry_another_dep.js')
    })
    webpack(config, (err, stats) => {
      expect(err).to.be.null
      expect(stats.compilation.errors).to.be.empty

      fs.readdir(outputDir, (err, files) => {
        expect(err).to.be.null
        expect(files).to.have.length(1)
        fs.readFile(path.resolve(outputDir, files[0]), (err, data) => {
          var subject = data.toString()

          expect(err).to.be.null
          expect(subject).to.include('Opal.cdecl($scope, \'HELLO\', 123)')
          expect(subject).to.include('Opal.cdecl($scope, \'INSIDE\', 789)')
          expect(subject).to.not.match(currentDirectoryExp)
          expect(runCode()).to.eq('123\nwe made it\n')

          return done()
        })
      })
    })
  })

  it('loads requires with node conventions', function (done){
    const config = assign({}, globalConfig, {
      entry: aFixture('entry_another_dep_node.js')
    })
    webpack(config, (err, stats) => {
      expect(err).to.be.null
      expect(stats.compilation.errors).to.be.empty

      fs.readdir(outputDir, (err, files) => {
        expect(err).to.be.null
        expect(files).to.have.length(1)
        fs.readFile(path.resolve(outputDir, files[0]), (err, data) => {
          var subject = data.toString()

          expect(err).to.be.null
          expect(subject).to.include('Opal.cdecl($scope, \'HELLO\', 123)')
          expect(subject).to.include('Opal.cdecl($scope, \'INSIDE\', 789)')
          expect(subject).to.not.match(currentDirectoryExp)
          expect(runCode()).to.eq('123\nwe made it\n')

          return done()
        })
      })
    })
  })

  it('works with stubs', function (done) {
    const config = assign({}, globalConfig, {
      entry: aFixture('entry_another_dep.js'),
      opal: {
        stubs: ['dependency']
      }
    })
    webpack(config, (err, stats) => {
      expect(err).to.be.null
      expect(stats.compilation.errors).to.be.empty

      fs.readdir(outputDir, (err, files) => {
        expect(err).to.be.null
        expect(files).to.have.length(1)
        fs.readFile(path.resolve(outputDir, files[0]), (err, data) => {
          var subject = data.toString()

          expect(err).to.be.null
          expect(subject).to.not.include('Opal.cdecl($scope, \'HELLO\', 123)')
          expect(subject).to.include('Opal.cdecl($scope, \'INSIDE\', 789)')
          expect(subject).to.not.match(currentDirectoryExp)
          expect(runCode()).to.eq('we made it\n')

          return done()
        })
      })
    })
  })

  it('allows stub inside require', function(done) {
    const config = assign({}, globalConfig, {
      entry: aFixture('entry_nested_stub.js'),
      opal: {
        stubs: ['dependency']
      }
    })
    webpack(config, (err, stats) => {
      expect(err).to.be.null
      expect(stats.compilation.errors).to.be.empty

      fs.readdir(outputDir, (err, files) => {
        expect(err).to.be.null
        expect(files).to.have.length(1)
        fs.readFile(path.resolve(outputDir, files[0]), (err, data) => {
          var subject = data.toString()

          expect(err).to.be.null
          expect(subject).to.not.include('Opal.cdecl($scope, \'HELLO\', 123)')
          expect(subject).to.include('Opal.cdecl($scope, \'INSIDE\', 789)')
          expect(subject).to.not.match(currentDirectoryExp)
          // the stub
          expect(subject).to.include('Opal.modules["dependency"]')
          expect(subject).to.include('Opal.modules["another_dependency"]')
          expect(subject).to.include('Opal.modules["inside_load_path"]')
          expect(runCode()).to.eq('we made it\n')

          return done()
        })
      })
    })
  })

  it('loads JS requires', function (done) {
    const config = assign({}, globalConfig, {
      entry: aFixture('entry_js_require.js')
    })
    webpack(config, (err, stats) => {
      expect(err).to.be.null
      expect(stats.compilation.errors).to.be.empty

      fs.readdir(outputDir, (err, files) => {
        expect(err).to.be.null
        expect(files).to.have.length(1)
        fs.readFile(path.resolve(outputDir, files[0]), (err, data) => {
          var subject = data.toString()

          expect(err).to.be.null
          expect(subject).to.not.match(currentDirectoryExp)
          expect(runCode()).to.eq('howdy\nagain\n')

          return done()
        })
      })
    })
  })

  // TODO: Several opal bugs with File.dirname and Path.join that keep this from working
  xit('loads require_tree', function (done) {
    const config = assign({}, globalConfig, {
      entry: aFixture('entry_tree.js')
    })
    webpack(config, (err, stats) => {
      expect(err).to.be.null
      expect(stats.compilation.errors).to.be.empty

      fs.readdir(outputDir, (err, files) => {
        expect(err).to.be.null
        expect(files).to.have.length(1)
        fs.readFile(path.resolve(outputDir, files[0]), (err, data) => {
          var subject = data.toString()

          expect(err).to.be.null
          expect(subject).to.include('Opal.cdecl($scope, \'HELLO\', 123)')
          expect(subject).to.include('Opal.cdecl($scope, \'THERE\', 456)')
          expect(subject).to.not.match(currentDirectoryExp)
          expect(subject).to.include('$require_tree("tree")')
          expect(subject).to.include('Opal.modules["tree/file1"]')
          expect(subject).to.include('Opal.modules["tree/file2"]')
          expect(runCode()).to.eq('inside the tree\n')

          return done()
        })
      })
    })
  })

  xit('loads require_tree without leading dot', function () {
    // should be same result as loads require_tree
  })

  it('loads require_relative', function (done) {
    const config = assign({}, globalConfig, {
      entry: aFixture('entry_relative.js')
    })
    webpack(config, (err, stats) => {
      expect(err).to.be.null
      expect(stats.compilation.errors).to.be.empty

      fs.readdir(outputDir, (err, files) => {
        expect(err).to.be.null
        expect(files).to.have.length(1)
        fs.readFile(path.resolve(outputDir, files[0]), (err, data) => {
          var subject = data.toString()

          expect(err).to.be.null
          expect(subject).to.include('Opal.cdecl($scope, \'HELLO\', 123)')
          // don't want paths hard coded to machines in here
          expect(subject).to.not.match(currentDirectoryExp)
          expect(subject).to.include('Opal.modules["tree/file1"]')
          expect(runCode()).to.eq('inside the tree\n')

          return done()
        })
      })
    })
  })

  it('outputs correct source maps', function (done) {
    this.timeout(10000)

    const config = assign({}, globalConfig, {
      entry: aFixture('entry_source_maps.js'),
      devtool: 'source-map'
    })
    webpack(config, (err, stats) => {
      expect(err).to.be.null
      expect(stats.compilation.errors).to.be.empty

      fs.readdir(outputDir, (err, files) => {
        expect(err).to.be.null
        expect(files).to.have.length(2)
        var output = runCode('-r '+aFixture('load_source_maps.js'))
        // ruby output, might need some more work since we're 1 line off
        // expecting test/fixtures/source_maps.rb:4:in `hello': source map location (RuntimeError)
        expect(output).to.match(/output\/loader\/webpack:\/test\/fixtures\/source_maps\.rb:3:1\)/)
        expect(output).to.match(/output\/loader\/webpack:\/test\/fixtures\/source_maps.rb:7:1\)/)
        return done()
      })
    })
  })

  it('outputs correct source maps when stubs are used', function (done) {
    this.timeout(10000)

    const config = assign({}, globalConfig, {
      entry: aFixture('entry_source_maps_stubs.js'),
      devtool: 'source-map',
      opal: {
        stubs: ['dependency1', 'dependency2', 'dependency3', 'dependency4']
      }
    })
    webpack(config, (err, stats) => {
      expect(err).to.be.null
      expect(stats.compilation.errors).to.be.empty

      fs.readdir(outputDir, (err, files) => {
        expect(err).to.be.null
        expect(files).to.have.length(2)
        var output = runCode('-r '+aFixture('load_source_maps.js'))
        // ruby output, might need some more work since we're 1 line off
        // expecting test/fixtures/source_maps.rb:4:in `hello': source map location (RuntimeError)
        expect(output).to.match(/output\/loader\/webpack:\/test\/fixtures\/source_maps_stubs\.rb:6:1\)/)
        expect(output).to.match(/output\/loader\/webpack:\/test\/fixtures\/source_maps_stubs.rb:10:1\)/)
        return done()
      })
    })
  })

  it('passes compiler args to all files it compiles', function (done) {
    const config = assign({}, globalConfig, {
      entry: aFixture('entry_arity.js'),
      module: {
        loaders: [
          {
            test: /\.rb$/,
            loader: opalLoader,
            query: {
              arity_check: true
            }
          }
        ]
      }
    })
    webpack(config, (err, stats) => {
      expect(err).to.be.null
      expect(stats.compilation.errors).to.be.empty

      fs.readdir(outputDir, (err, files) => {
        expect(err).to.be.null
        expect(files).to.have.length(1)
        fs.readFile(path.resolve(outputDir, files[0]), (err, data) => {
          var subject = data.toString()

          expect(err).to.be.null
          expect(subject).to.not.match(currentDirectoryExp)
          expect(runCode()).to.eq('[Object#onearg] wrong number of arguments(0 for 1)\n[Object#two_arg] wrong number of arguments(1 for 2)\n')

          return done()
        })
      })
    })
  })

  it('handles errors', function (done) {
    const config = assign({}, globalConfig, {
      entry: aFixture('entry_error.js')
    })
    webpack(config, (err, stats) => {
      let errors = stats.compilation.errors
      expect(errors).to.have.length(1)
      let error = errors[0]
      expect(error).to.be.an.instanceof(Error)
      if (opalVersion.indexOf('0.9') != -1) {
        expect(error.message).to.match(/Module build failed.*An error occurred while compiling:.*error[\s\S]+3:0/)
      }
      else {
        // Opal 0.10 regression - https://github.com/opal/opal/pull/1426
        expect(error.message).to.match(/Module build failed.*false/)
      }
      return done()
    })
  })

  it('allows caching to a specific directory', function (done) {
    const config = assign({}, globalConfig, {
      entry: aFixture('entry_basic.js'),
      module: {
        loaders: [
          {
            test: /\.rb$/,
            loader: opalLoader,
            query: {
              cacheDirectory: cacheDir
            }
          }
        ]
      }
    })
    assertBasic(config, () => {
      // run again and use the cache
      assertBasic(config, () => {
        fs.readdir(cacheDir, (err, files) => {
          expect(err).to.be.null
          expect(files).to.have.length(1)
          return done()
        })
      })
    })
  })

  it('caches multiple modules', function(done) {
    const config = assign({}, globalConfig, {
      entry: aFixture('entry_another_dep.js'),
      module: {
        loaders: [
          {
            test: /\.rb$/,
            loader: opalLoader,
            query: {
              cacheDirectory: cacheDir
            }
          }
        ]
      }
    })
    webpack(config, (err, stats) => {
      expect(err).to.be.null
      expect(stats.compilation.errors).to.be.empty

      fs.readdir(cacheDir, (err, files) => {
        expect(err).to.be.null
        expect(files).to.have.length(3)
        return done()
      })
    })
  })

  it('caches source maps', function (done) {
    const config = assign({}, globalConfig, {
      entry: aFixture('entry_source_maps.js'),
      devtool: 'source-map',
      module: {
        loaders: [
          {
            test: /\.rb$/,
            loader: opalLoader,
            query: {
              cacheDirectory: cacheDir
            }
          }
        ]
      }
    })
    webpack(config, (err, stats) => {
      expect(err).to.be.null
      expect(stats.compilation.errors).to.be.empty

      fs.readdir(outputDir, (err, files) => {
        expect(err).to.be.null
        expect(files).to.have.length(2)
        var output = runCode('-r '+aFixture('load_source_maps.js'))
        // ruby output, might need some more work since we're 1 line off
        // expecting test/fixtures/source_maps.rb:4:in `hello': source map location (RuntimeError)
        expect(output).to.match(/output\/loader\/webpack:\/test\/fixtures\/source_maps\.rb:3:1\)/)
        expect(output).to.match(/output\/loader\/webpack:\/test\/fixtures\/source_maps.rb:7:1\)/)
        return done()
      })
    })
  })
})

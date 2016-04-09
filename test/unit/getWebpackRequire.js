'use strict'

const expect = require('chai').expect
const getWebpackRequire = require('../../lib/getWebpackRequire')

describe('getWebpackRequire', function(){
  const context = {
    path: 'the_loader'
  }

  it('returns require', function() {
    var result = getWebpackRequire(context, {}, 'some/path', '/the/some/path')

    expect(result).to.eq('require(\'!!the_loader?file=some%2Fpath&requirable=true!/the/some/path\');')
  })

  it('does not pass on requireable for "opal"', function() {
    var result = getWebpackRequire(context, {}, 'opal', '/the/path/opal')
    expect(result).to.eq('require(\'!!the_loader?file=opal&requirable=false!/the/path/opal\');')
  })

  it('does not pass on requireable for "opal/mini"', function() {
    var result = getWebpackRequire(context, {}, 'opal/mini', '/the/path/opal/mini')
    expect(result).to.eq('require(\'!!the_loader?file=opal%2Fmini&requirable=false!/the/path/opal/mini\');')
  })

  it('does not pass on requireable for "opal/full"', function() {
    var result = getWebpackRequire(context, {}, 'opal/full', '/the/path/opal/full')
    expect(result).to.eq('require(\'!!the_loader?file=opal%2Ffull&requirable=false!/the/path/opal/full\');')
  })

  it('does not pass everything in the query', function() {
    var options = {
      sourceRoot: 'foo',
      filename: 'foo',
      sourceMap: 'foo',
      relativeFileName: 'bar',
      stubs: 'bar',
      yes: 'yes',
      externalOpal: true
    }

    var result = getWebpackRequire(context, options, 'some/path', '/the/some/path')

    expect(result).to.eq('require(\'!!the_loader?yes=yes&file=some%2Fpath&requirable=true!/the/some/path\');')
  })
})

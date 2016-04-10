'use strict'

const expect = require('chai').expect
const getJsRequire = require('../../lib/getJsRequire')

describe('getJsRequire', function(){
  it('works', function() {
    var result = getJsRequire('foo', 'lib/foo')

    expect(result).to.have.length(2)
    expect(result[0]).to.match(/require\('lib\/foo'\);/)
    expect(result[1]).to.eq('Opal.loaded(\'foo\');')
  })
})

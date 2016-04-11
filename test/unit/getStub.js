'use strict'

const expect = require('chai').expect
const getStub = require('../../lib/getStub')

describe('getStub', function(){
  it('works', function() {
    var result = getStub('some/path')

    expect(result).to.include('Opal.modules["some/path"]')
  })
})

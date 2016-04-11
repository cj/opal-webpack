'use strict'

const expect = require('chai').expect

const cleanScopeAndRequire = require('../support/cleanScopeAndRequire')

describe('getStub', function(){
  beforeEach(cleanScopeAndRequire)

  it('works', function() {
    var result = require('../../lib/getStub')('some/path')

    expect(result).to.include('Opal.modules["some/path"]')
  })
})

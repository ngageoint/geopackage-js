var StringUtils = require('../../../lib/db/stringUtils').StringUtils;
var should = require('chai').should();

describe('StringUtils tests', function () {
  it('should wrap a plain name', function () {
    StringUtils.quoteWrap('poly').should.be.equal('"poly"');
  });

  it('should double an embedded quote', function () {
    StringUtils.quoteWrap('po"ly').should.be.equal('"po""ly"');
  });

  it('should leave an already quoted name alone', function () {
    StringUtils.quoteWrap('"poly"').should.be.equal('"poly"');
  });

  it('should return null for null', function () {
    should.equal(StringUtils.quoteWrap(null), null);
  });

  it('should round trip through quoteUnwrap', function () {
    var name = 'po"ly';
    StringUtils.quoteUnwrap(StringUtils.quoteWrap(name)).should.be.equal(name);
  });
});


var Paint = require('../../../../lib/tiles/features/paint').Paint
, should = require('chai').should();

describe('Paint Tests', function() {
  it('should test Paint', function() {
    var paint = new Paint();
    paint.color.should.be.equal('#000000FF');
    paint.strokeWidth.should.be.equal(1.0);
    paint.colorRGBA.should.be.equal('rgba(0,0,0,1)');
    paint.color = '#FFFFFF00';
    paint.colorRGBA.should.be.equal('rgba(255,255,255,0)');
    paint.color = '#FFFFFF';
    paint.colorRGBA.should.be.equal('rgba(255,255,255,1)');
  });
});

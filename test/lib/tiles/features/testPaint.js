var Paint = require('../../../../lib/tiles/features/paint').Paint;

describe('Paint Tests', function () {
  it('should test Paint', function () {
    var paint = new Paint();
    paint.getColor().should.be.equal('#000000FF');
    paint.getStrokeWidth().should.be.equal(1.0);
    paint.getColorRGBA().should.be.equal('rgba(0,0,0,1)');
    paint.setColor('#FFFFFF00');
    paint.getColorRGBA().should.be.equal('rgba(255,255,255,0)');
    paint.setColor('#FFFFFF');
    paint.getColorRGBA().should.be.equal('rgba(255,255,255,1)');
  });
});

var TileGrid = require('../../../lib/tiles/tileGrid.js');

describe('TileGrid tests', function() {

  it('should count the tiles', function() {
    var tg = new TileGrid(0, 1, 0, 1);
    tg.count().should.be.equal(4);
  });

  it('should be equal', function() {
    var tg = new TileGrid(0, 1, 0, 1);
    var tg2 = new TileGrid(0, 1, 0, 1);
    tg.equals(tg2).should.be.equal(true);
  });

  it('should not be equal', function() {
    var tg = new TileGrid(0, 1, 0, 1);
    var tg2 = new TileGrid(0, 2, 0, 1);
    tg.equals(tg2).should.be.equal(false);
  });

  it('should not be equal to undefined', function() {
    var tg = new TileGrid(0, 1, 0, 1);
    tg.equals().should.be.equal(false);
  });

});

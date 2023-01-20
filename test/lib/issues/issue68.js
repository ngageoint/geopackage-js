var GeoPackage = require('../../../lib/geoPackage').GeoPackage
  , GeoPackageManager = require('../../../lib/geoPackageManager').GeoPackageManager
  , GeoPackageTileRetriever = require('../../../lib/tiles/geoPackageTileRetriever').GeoPackageTileRetriever
  , path = require('path')
  , should = require('chai').should();

describe('Tests for issue 68', function() {

  it('should get a tile', function() {
    this.timeout(5000);
    return GeoPackageManager.connect(path.join(__dirname, '..', '..', 'fixtures', 'issue_68.gpkg'))
    .then(function(geoPackageConnection) {
      var connection = geoPackageConnection;
      should.exist(connection);
      var geoPackage = new GeoPackage('', '', connection);
      var tables = geoPackage.getTileTables();
      tables[0].should.be.equal('package_tiles');
      var tileDao = geoPackage.getTileDao('package_tiles');
      should.exist(tileDao);
      var info = geoPackage.getInfoForTable(tileDao);
      should.exist(info);
      var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
      return gpr.getTile(192,401,10)
        .then((tile) => {
          should.exist(tile);
          geoPackage.close();
        });
    });
  });

});

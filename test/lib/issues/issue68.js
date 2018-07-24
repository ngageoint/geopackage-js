var GeoPackage = require('../../../lib/geoPackage')
  , GeoPackageConnection = require('../../../lib/db/geoPackageConnection')
  , GeoPackageTileRetriever = require('../../../lib/tiles/retriever');

var path = require('path')
  , should = require('chai').should();

describe('Tests for issue 68', function() {

  it('should get a tile', function() {
    this.timeout(5000);
    return GeoPackageConnection.connect(path.join(__dirname, '..', '..', 'fixtures', 'issue_68.gpkg'))
    .then(function(geoPackageConnection) {
      connection = geoPackageConnection;
      should.exist(connection);
      var geoPackage = new GeoPackage('', '', connection);
      var tables = geoPackage.getTileTables();
      tables[0].should.be.equal('package_tiles');
      geoPackage.getTileDaoWithTableName('package_tiles')
      .then(function(tileDao) {
        should.exist(tileDao);
        return geoPackage.getInfoForTable(tileDao)
        .then(function(info) {
          return {info: info, tileDao: tileDao};
        });
      })
      .then(function(previousResults){
        should.exist(previousResults.info);
        var gpr = new GeoPackageTileRetriever(previousResults.tileDao, 256, 256);
        return gpr.getTile(192,401,10)
        .then(function(tile) {
          should.exist(tile);
          geoPackage.close();
        });
      });
    });
  });

});

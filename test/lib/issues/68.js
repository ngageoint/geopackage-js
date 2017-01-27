var GeoPackage = require('../../../lib/geoPackage')
  , GeoPackageConnection = require('../../../lib/db/geoPackageConnection')
  , GeoPackageTileRetriever = require('../../../lib/tiles/retriever');

var path = require('path')
, should = require('chai').should()
, proj4 = require('proj4');

describe('Tests for issue 68', function() {

  it('should get a tile', function(done) {
    this.timeout(0);
    GeoPackageConnection.connect(path.join(__dirname, '..', '..', 'fixtures', 'issue_68.gpkg'), function(err, connection) {
      var geoPackage = new GeoPackage('', '', connection);
      geoPackage.getTileTables(function(err, tables) {
        tables[0].should.be.equal('package_tiles');
        geoPackage.getTileDaoWithTableName('package_tiles', function(err, tileDao) {
          if (err) return done(err);
          should.exist(tileDao);
          geoPackage.getInfoForTable(tileDao, function(err, info) {
            if (err) return done(err);
            should.exist(info);
            var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
            gpr.getTile(192,401,10,function(err, tile) {
              if (err) return done(err);
              should.exist(tile);
              done();
            });
          });
        });
      });
    });
  });

});

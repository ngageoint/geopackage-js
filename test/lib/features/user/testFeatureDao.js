var FeatureDao = require('../../../../lib/features/user/featureDao.js')
  , GeoPackageManager = require('../../../../lib/geoPackageManager.js')
  , path = require('path')
  , should = require('chai').should();

describe('FeatureDao tests', function() {

  var geoPackage;
  beforeEach('create the GeoPackage connection', function(done) {
    var filename = path.join(__dirname, '..', '..', '..', 'fixtures', 'rivers.gpkg');
    GeoPackageManager.open(filename, function(err, gp) {
      geoPackage = gp;
      done();
    });
  });

  afterEach('close the geopackage connection', function() {
    geoPackage.close();
  });

  it('should read the geometry', function(done) {
    geoPackage.getFeatureDaoWithTableName('FEATURESriversds', function(err, featureDao) {
      featureDao.getSrs(function(err, srs) {
        featureDao.queryForEach(function(err, row, rowDone) {
          var currentRow = featureDao.getFeatureRow(row);
          var geometry = currentRow.getGeometry();
          should.exist(geometry);
          rowDone();
        }, done);
      });
    });
  });

});

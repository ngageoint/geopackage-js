var FeatureDao = require('../../../../lib/features/user/featureDao.js')
  , GeoPackageManager = require('../../../../lib/geoPackageManager.js')
  , BoundingBox = require('../../../../lib/boundingBox.js')
  , fs = require('fs')
  , path = require('path')
  , should = require('chai').should();

describe('FeatureDao tests', function() {

  describe('Non indexed test', function() {
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

    it('should query for a row with property_1 equal to Gila', function(done) {
      geoPackage.getFeatureDaoWithTableName('FEATURESriversds', function(err, featureDao) {
        featureDao.queryForEqWithFieldAndValue('property_1', 'Gila', function(err, row, rowDone) {
          row.property_1.should.be.equal('Gila');
          rowDone();
        }, done);
      });
    });
  });

  describe('Indexed test', function() {
    var geoPackage;
    var featureDao;

    var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'rivers_indexed.gpkg');
    var filename = path.join(__dirname, '..', '..', '..', 'fixtures', 'tmp', 'rivers_indexed.gpkg');

    function copyGeopackage(orignal, copy, callback) {
      if (typeof(process) !== 'undefined' && process.version) {
        var fsExtra = require('fs-extra');
        fsExtra.copy(originalFilename, filename, callback);
      } else {
        filename = originalFilename;
        callback();
      }
    }

    beforeEach('should open the geopackage', function(done) {
      copyGeopackage(originalFilename, filename, function(err) {
        GeoPackageManager.open(filename, function(err, gp) {
          geoPackage = gp;
          should.not.exist(err);
          should.exist(gp);
          should.exist(gp.getDatabase().getDBConnection());
          gp.getPath().should.be.equal(filename);
          geoPackage.getFeatureDaoWithTableName('rivers', function(err, riverFeatureDao) {
            featureDao = riverFeatureDao;
            done();
          });
        });
      });
    });

    afterEach('should close the geopackage', function(done) {
      geoPackage.close();
      if (typeof(process) !== 'undefined' && process.version) {
        fs.unlink(filename, done);
      } else {
        done();
      }
    });

    it('should query for indexed geometries', function(done) {
      var count = 0;
      var bbox = new BoundingBox(-12863648.645994272, -12865751.85860068, 6655573.571054254, 6651886.678768059);
      featureDao.queryIndexedFeaturesWithWebMercatorBoundingBox(bbox, function(err, featureRow, rowCallback) {
        should.exist(featureRow.getValueWithColumnName('geom'));
        should.exist(featureRow.getValueWithColumnName('id'));
        should.exist(featureRow.getValueWithColumnName('property_0'));
        should.exist(featureRow.getValueWithColumnName('property_1'));
        should.exist(featureRow.getValueWithColumnName('property_2'));
        count++;
        rowCallback();
      }, function(err) {
        console.log('count', count);
        done();
      });
    });
  });

});

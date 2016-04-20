var GeoPackage = require('../../lib/geoPackage')
  , GeoPackageConnection = require('../../lib/db/geoPackageConnection')
  , GeoPackageTileRetriever = require('../../lib/tiles/retriever')
  , proj4 = require('proj4')
  , reproject = require('reproject')
  , should = require('chai').should()
  , path = require('path')
  , async = require('async')
  , fs = require('fs');

describe('GeoPackage tests', function() {

  it('should get the feature table names', function(done) {
    GeoPackageConnection.connect(path.join(__dirname, '..', 'fixtures', 'gdal_sample.gpkg'), function(err, connection) {
      var geoPackage = new GeoPackage('', '', connection);
      geoPackage.getFeatureTables(function(err, tables) {
        should.not.exist(err);
        should.exist(tables);
        tables.length.should.be.equal(16);
        tables.should.have.members([
           'point2d',
           'linestring2d',
           'polygon2d',
           'multipoint2d',
           'multilinestring2d',
           'multipolygon2d',
           'geomcollection2d',
           'geometry2d',
           'point3d',
           'linestring3d',
           'polygon3d',
           'multipoint3d',
           'multilinestring3d',
           'multipolygon3d',
           'geomcollection3d',
           'geometry3d'
        ]);
        done();
      });
    });
  });

  it('should get the features', function(done) {
    GeoPackageConnection.connect(path.join(__dirname, '..', 'fixtures', 'gdal_sample.gpkg'), function(err, connection) {
      var geoPackage = new GeoPackage('', '', connection);
      geoPackage.getFeatureDaoWithTableName('point2d', function(err, featureDao) {
        featureDao.queryForEach(function(err, row) {
          var currentRow = featureDao.getFeatureRow(row);
          var geometry = currentRow.getGeometry();
        }, function(err) {
          done();
        });
      });
    });
  });

  it('should get the features from all tables', function(done) {
    GeoPackageConnection.connect(path.join(__dirname, '..', 'fixtures', 'gdal_sample.gpkg'), function(err, connection) {
      var geoPackage = new GeoPackage('', '', connection);
      geoPackage.getFeatureTables(function(err, tables) {
        async.eachSeries(tables, function(table, callback) {
          geoPackage.getFeatureDaoWithTableName(table, function(err, featureDao) {
            if (err) {
              return callback(err);
            }
            featureDao.getSrs(function(err, srs) {
              featureDao.queryForEach(function(err, row) {
                var currentRow = featureDao.getFeatureRow(row);
                var geometry = currentRow.getGeometry();
                if (!geometry) {
                  return;
                }
                var geom = geometry.geometry;
                var geoJson = projectedJson = geom.toGeoJSON();
                if (srs.definition && srs.definition !== 'undefined') {
                  projectedJson = reproject.reproject(geoJson, srs.definition, 'EPSG:4326');
                }
              }, function(err) {
                callback();
              });
            });
          });
        }, function(err) {
          done(err);
        });
      });
    });
  });

  it('should get the tile table names', function(done) {
    GeoPackageConnection.connect(path.join(__dirname, '..', 'fixtures', 'rivers.gpkg'), function(err, connection) {
      var geoPackage = new GeoPackage('', '', connection);
      geoPackage.getTileTables(function(err, tables) {
        should.not.exist(err);
        should.exist(tables);
        tables.length.should.be.equal(1);
        tables.should.have.members([
           'TILESosmds'
        ]);
        done();
      });
    });
  });

  it('should get the tiles', function(done) {
    GeoPackageConnection.connect(path.join(__dirname, '..', 'fixtures', 'rivers.gpkg'), function(err, connection) {
      var geoPackage = new GeoPackage('', '', connection);
      geoPackage.getTileTables(function(err, tables) {
        async.eachSeries(tables, function(table, callback) {
          geoPackage.getTileDaoWithTableName(table, function(err, tileDao) {

            var maxZoom = tileDao.maxZoom;
            var minZoom = tileDao.minZoom;

            var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
            gpr.getTile(0, 0, 1, function(err, tileData) {
              fs.writeFileSync('/tmp/gptile.png', tileData);
              callback();
            });
          });
        }, function(err) {
          done(err);
        });
      });
    });
  });

});

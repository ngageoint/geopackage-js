var GeoPackage = require('../../lib/geoPackage')
  , GeoPackageConnection = require('../../lib/db/geoPackageConnection')
  , proj4 = require('proj4')
  , reproject = require('reproject')
  , should = require('chai').should()
  , path = require('path')
  , async = require('async');

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
        console.log('featureDao', featureDao);

        featureDao.queryForEach(function(err, row) {
          var currentRow = featureDao.getFeatureRow(row);
          var geometry = currentRow.getGeometry();
          console.log('geometry', geometry);
        }, function(err) {
          done();
        });
      });
    });
  });

  it.only('should get the features from all tables', function(done) {
    GeoPackageConnection.connect(path.join(__dirname, '..', 'fixtures', 'gdal_sample.gpkg'), function(err, connection) {
      var geoPackage = new GeoPackage('', '', connection);
      geoPackage.getFeatureTables(function(err, tables) {
        // console.log('tables', tables);
        async.eachSeries(tables, function(table, callback) {
          // console.log('table', table);
          geoPackage.getFeatureDaoWithTableName(table, function(err, featureDao) {
            // console.log('featureDao', featureDao);
            if (err) {
              console.log('err', err);
              return callback();
            }
            featureDao.getSrs(function(err, srs) {
              console.log('srs.definition', srs.definition);
              // callback();
              // console.log('projection', featureDao.getProjection());
              featureDao.queryForEach(function(err, row) {
                var currentRow = featureDao.getFeatureRow(row);
                var geometry = currentRow.getGeometry();
                if (!geometry) {
                  return;
                }
                // console.log('geometry', geometry);
                var geom = geometry.geometry;
                console.log('geom', geom);
                var geoJson = projectedJson = geom.toGeoJSON();
                if (srs.definition && srs.definition !== 'undefined') {
                  projectedJson = reproject.reproject(geoJson, srs.definition, 'EPSG:4326');
                }
                console.log('projected', projectedJson);

              }, function(err) {
                console.log('err', err);
                callback();
              });
            });
          });
        }, function(err) {
          console.log('err', err);
          done(err);
        });
      });
    });
  });

});

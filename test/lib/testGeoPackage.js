var GeoPackage = require('../../lib/geoPackage')
  , GeoPackageConnection = require('../../lib/db/geoPackageConnection')
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
    GeoPackageConnection.connect(path.join(__dirname, '..', 'fixtures', 'rivers.gpkg'), function(err, connection) {
      var geoPackage = new GeoPackage('', '', connection);
      geoPackage.getFeatureTables(function(err, tables) {
        console.log('tables', tables);
        async.eachSeries(tables, function(table, callback) {
          console.log('table', table);
          geoPackage.getFeatureDaoWithTableName(table, function(err, featureDao) {
            console.log('featureDao', featureDao);
            if (err) {
              return callback();
            }
            console.log('projection', featureDao.getProjection());
            featureDao.queryForEach(function(err, row) {
              var currentRow = featureDao.getFeatureRow(row);
              var geometry = currentRow.getGeometry();
              // console.log('geometry', geometry);
              var geom = geometry.geometry;
              if (geom.points) {
                for (var i = 0; i < geom.points.length; i++) {
                  // console.log('geom.points[i]', geom.points[i]);

                  geom.points[i] = {x:0,y:0};
                }
              }
            }, function(err) {
              callback();
            });
          });
        }, function(err) {
          done();
        });
      });
    });
  });

});

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

  it('should get the features from all tables', function(done) {
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
        console.log('tables', tables);
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

  it.only('should get the tiles', function(done) {
    GeoPackageConnection.connect(path.join(__dirname, '..', 'fixtures', 'rivers.gpkg'), function(err, connection) {
      var geoPackage = new GeoPackage('', '', connection);
      geoPackage.getTileTables(function(err, tables) {
        console.log('tables', tables);
        async.eachSeries(tables, function(table, callback) {
          geoPackage.getTileDaoWithTableName(table, function(err, tileDao) {
            console.log('tileDao', tileDao);

            var maxZoom = tileDao.maxZoom;
            var minZoom = tileDao.minZoom;

            console.log('min zoom', minZoom);
            console.log('max zoom', maxZoom);

            var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
            gpr.getTile(0, 0, 0, function(err, tile) {
              console.log('err', err);
              console.log('tile', tile);
              callback();
            });

            // tileDao.queryForTilesWithZoomLevel(0, function(err, tile) {
            //   console.log('err', err);
            //   console.log('tile', tile);
            //   fs.writeFileSync('/tmp/gptile.png', tile.tile_data);
            // }, function(err) {
            //   console.log('done');
            //   callback(err);
            // });

          });
        }, function(err) {
          done(err);
        });
      });
    });
  });

});

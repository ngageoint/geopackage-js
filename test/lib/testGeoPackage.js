var GeoPackage = require('../../lib/geoPackage')
  , GeoPackageConnection = require('../../lib/db/geoPackageConnection')
  , GeoPackageTileRetriever = require('../../lib/tiles/retriever')
  , proj4 = require('proj4')
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
        connection.close();
        done();
      });
    });
  });

  it('should get the features', function(done) {
    GeoPackageConnection.connect(path.join(__dirname, '..', 'fixtures', 'gdal_sample.gpkg'), function(err, connection) {
      var geoPackage = new GeoPackage('', '', connection);
      geoPackage.getFeatureDaoWithTableName('point2d', function(err, featureDao) {
        featureDao.queryForEach(function(err, row, rowDone) {
          var currentRow = featureDao.getFeatureRow(row);
          var geometry = currentRow.getGeometry();
          rowDone();
        }, function(err) {
          connection.close();
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
              featureDao.queryForEach(function(err, row, rowDone) {
                var currentRow = featureDao.getFeatureRow(row);
                var geometry = currentRow.getGeometry();
                if (!geometry) {
                  return rowDone();
                }
                var geom = geometry.geometry;
                var geoJson = projectedJson = geom.toGeoJSON();
                rowDone();
              }, function(err) {
                callback();
              });
            });
          });
        }, function(err) {
          connection.close();
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
        connection.close();
        done();
      });
    });
  });

  it('should get the srs 3857', function(done) {
    GeoPackageConnection.connect(path.join(__dirname, '..', 'fixtures', 'rivers.gpkg'), function(err, connection) {
      var geoPackage = new GeoPackage('', '', connection);
      geoPackage.getSrs(3857, function(err, srs) {
        should.not.exist(err);
        should.exist(srs);
        srs.srs_id.should.be.equal(3857);
        connection.close();
        done();
      });
    });
  });

  it('should get the feature dao from the contents', function(done) {
    GeoPackageConnection.connect(path.join(__dirname, '..', 'fixtures', 'rivers.gpkg'), function(err, connection) {
      var geoPackage = new GeoPackage('', '', connection);
      var dao = geoPackage.getContentsDao();
      dao.queryForIdObject('FEATURESriversds', function(err, contents) {
        geoPackage.getFeatureDaoWithContents(contents, function(err, featureDao) {
          should.not.exist(err);
          should.exist(featureDao);
          featureDao.getGeometryType().should.be.equal('GEOMETRY');
          featureDao.table_name.should.be.equal('FEATURESriversds');
          connection.close();
          done();
        });
      });
    });
  });

  it('should get the TILE dao from the contents', function(done) {
    GeoPackageConnection.connect(path.join(__dirname, '..', 'fixtures', 'rivers.gpkg'), function(err, connection) {
      var geoPackage = new GeoPackage('', '', connection);
      var dao = geoPackage.getContentsDao();
      dao.queryForIdObject('TILESosmds', function(err, contents) {
        geoPackage.getTileDaoWithContents(contents, function(err, tileDao) {
          should.not.exist(err);
          should.exist(tileDao);
          tileDao.table_name.should.be.equal('TILESosmds');
          connection.close();
          done();
        });
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
              should.exist(tileData);
              callback();
            });
          });
        }, function(err) {
          connection.close();
          done(err);
        });
      });
    });
  });

  it('should get the info for the table', function(done) {
    this.timeout(30000);
    GeoPackageConnection.connect(path.join(__dirname, '..', 'fixtures', 'rivers.gpkg'), function(err, connection) {
      var geoPackage = new GeoPackage('', '', connection);
      geoPackage.getFeatureDaoWithTableName('FEATURESriversds', function(err, dao) {
        geoPackage.getInfoForTable(dao, function(err, info) {
          should.not.exist(err);
          should.exist(info);
          connection.close();
          done(err);
        });
      });
    });
  });

  it('should get the info for the Imagery table', function(done) {
    GeoPackageConnection.connect(path.join(__dirname, '..', 'fixtures', '3857.gpkg'), function(err, connection) {
      var geoPackage = new GeoPackage('', '', connection);
      geoPackage.getTileDaoWithTableName('imagery', function(err, dao) {
        geoPackage.getInfoForTable(dao, function(err, info) {
          should.not.exist(err);
          should.exist(info);
          info.srs.id.should.be.equal(3857);
          connection.close();
          done(err);
        });
      });
    });
  });

});

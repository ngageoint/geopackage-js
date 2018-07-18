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
    GeoPackageConnection.connect(path.join(__dirname, '..', 'fixtures', 'gdal_sample.gpkg')).then(function(geoPackageConnection) {
      connection = geoPackageConnection;
      should.exist(connection);
      var geoPackage = new GeoPackage('', '', connection);
      var tables = geoPackage.getFeatureTables();
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

  it('should get the features', function(done) {
    GeoPackageConnection.connect(path.join(__dirname, '..', 'fixtures', 'gdal_sample.gpkg')).then(function(geoPackageConnection) {
      connection = geoPackageConnection;
      should.exist(connection);
      var geoPackage = new GeoPackage('', '', connection);
      geoPackage.getFeatureDaoWithTableName('point2d')
      .then(function(featureDao) {
        featureDao.queryForEach(function(err, row, rowDone) {
          var currentRow = featureDao.getFeatureRow(row);
          var geometry = currentRow.getGeometry();
          // rowDone();
        }, function(err) {
          connection.close();
          done();
        });
      });
    });
  });

  it('should get the features from all tables', function(done) {
    GeoPackageConnection.connect(path.join(__dirname, '..', 'fixtures', 'gdal_sample.gpkg')).then(function(connection){
      var geoPackage = new GeoPackage('', '', connection);
      var tables = geoPackage.getFeatureTables();
      async.eachSeries(tables, function(table, callback) {
        geoPackage.getFeatureDaoWithTableName(table)
        .then(function(featureDao) {
          if (!featureDao) {
            return callback(err);
          }
          var srs = featureDao.getSrs();
          featureDao.queryForEach(function(err, row, rowDone) {
            var currentRow = featureDao.getFeatureRow(row);
            var geometry = currentRow.getGeometry();
            if (!geometry) {
              return;
            }
            var geom = geometry.geometry;
            var geoJson = projectedJson = geom.toGeoJSON();
            // rowDone();
          }, function(err) {
            callback();
          });
        });
      }, function(err) {
        connection.close();
        done(err);
      });
    });
  });

  it('should get the tile table names', function(done) {
    GeoPackageConnection.connect(path.join(__dirname, '..', 'fixtures', 'rivers.gpkg'))
    .then(function(connection) {
      var geoPackage = new GeoPackage('', '', connection);
      var tables = geoPackage.getTileTables();
      should.exist(tables);
      tables.length.should.be.equal(1);
      tables.should.have.members([
         'TILESosmds'
      ]);
      connection.close();
      done();
    });
  });

  it('should get the srs 3857', function(done) {
    GeoPackageConnection.connect(path.join(__dirname, '..', 'fixtures', 'rivers.gpkg'))
    .then(function(connection) {
      var geoPackage = new GeoPackage('', '', connection);
      var srs = geoPackage.getSrs(3857);
      should.exist(srs);
      srs.srs_id.should.be.equal(3857);
      connection.close();
      done();
    });
  });

  it('should get the feature dao from the contents', function() {
    return GeoPackageConnection.connect(path.join(__dirname, '..', 'fixtures', 'rivers.gpkg'))
    .then(function(connection) {
      var geoPackage = new GeoPackage('', '', connection);
      var dao = geoPackage.getContentsDao();
      var contents = dao.queryForIdObject('FEATURESriversds');
      return geoPackage.getFeatureDaoWithContents(contents)
      .then(function(featureDao) {
        should.exist(featureDao);
        featureDao.getGeometryType().should.be.equal('GEOMETRY');
        featureDao.table_name.should.be.equal('FEATURESriversds');
        connection.close();
      });
    });
  });

  it('should get the TILE dao from the contents', function(done) {
    GeoPackageConnection.connect(path.join(__dirname, '..', 'fixtures', 'rivers.gpkg'))
    .then(function(connection) {
      var geoPackage = new GeoPackage('', '', connection);
      var dao = geoPackage.getContentsDao();
      var contents = dao.queryForIdObject('TILESosmds');
      geoPackage.getTileDaoWithContents(contents, function(err, tileDao) {
        should.not.exist(err);
        should.exist(tileDao);
        tileDao.table_name.should.be.equal('TILESosmds');
        connection.close();
        done();
      });
    });
  });

  it('should get the tiles', function(done) {
    GeoPackageConnection.connect(path.join(__dirname, '..', 'fixtures', 'rivers.gpkg'))
    .then(function(connection) {
      var geoPackage = new GeoPackage('', '', connection);
      var tables = geoPackage.getTileTables();
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

  it('should get the info for the table', function() {
    this.timeout(30000);
    return GeoPackageConnection.connect(path.join(__dirname, '..', 'fixtures', 'rivers.gpkg'))
    .then(function(connection) {
      var geoPackage = new GeoPackage('', '', connection);
      return geoPackage.getFeatureDaoWithTableName('FEATURESriversds')
      .then(function(dao) {
        var info = geoPackage.getInfoForTable(dao);
        should.exist(info);
        info.tableName.should.be.equal('FEATURESriversds');
        connection.close();
      });
    });
  });

  it('should get the info for the Imagery table', function(done) {
    GeoPackageConnection.connect(path.join(__dirname, '..', 'fixtures', '3857.gpkg'))
    .then(function(connection) {
      var geoPackage = new GeoPackage('', '', connection);
      geoPackage.getTileDaoWithTableName('imagery', function(err, dao) {
        var info = geoPackage.getInfoForTable(dao);
        should.exist(info);
        info.tableName.should.be.equal('imagery');
        info.srs.id.should.be.equal(3857);
        connection.close();
        done(err);
      });
    });
  });

  it('should exists default projection', function() {
    var result = GeoPackage.hasProjection('EPSG:4326');
    should.exist(result);
  });

  it('should throw error on invalid load projections argument', function() {
    (function() {
      GeoPackage.loadProjections(null);
    }).should.throw('Invalid array of projections');
  });

  it('should throw error on unknown projection item', function() {
    (function() {
      GeoPackage.loadProjections([null]);
    }).should.throw('Projection not found');
  });

  it('should load projections', function() {
    GeoPackage.loadProjections(['EPSG:4326']);
    var result = GeoPackage.hasProjection('EPSG:4326');
    should.exist(result);
  });

  it('should throw error on empty add projection args', function() {
    (function() {
      GeoPackage.addProjection(null, null);
    }).should.throw('Invalid projection name/definition');
  });

  it('should add projection', function() {
    GeoPackage.addProjection('EPSG:4001', '+proj=longlat +ellps=airy +no_defs');
    var result = GeoPackage.hasProjection('EPSG:4001');
    should.exist(result);
  });

});

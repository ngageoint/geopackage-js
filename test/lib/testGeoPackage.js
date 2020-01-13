import {GeoPackage} from '../../lib/geoPackage'
import {GeoPackageConnection} from '../../lib/db/geoPackageConnection';

var GeoPackageTileRetriever = require('../../lib/tiles/retriever').GeoPackageTileRetriever
  , proj4 = require('proj4')
  , should = require('chai').should()
  , path = require('path')
  , fs = require('fs-extra');

describe('GeoPackage tests', function() {
  it('should get the feature table names', function(done) {
    GeoPackageConnection.connect(path.join(__dirname, '..', 'fixtures', 'gdal_sample.gpkg')).then(function(geoPackageConnection) {
      var connection = geoPackageConnection;
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

  it('should get the features', function() {
    return GeoPackageConnection.connect(path.join(__dirname, '..', 'fixtures', 'gdal_sample.gpkg'))
    .then(function(geoPackageConnection) {
      var connection = geoPackageConnection;
      should.exist(connection);
      var geoPackage = new GeoPackage('', '', connection);
      var featureDao = geoPackage.getFeatureDao('point2d');
      var each = featureDao.queryForEach();
      for (var row of each) {
        var currentRow = featureDao.getRow(row);
        var geometry = currentRow.getGeometry();
      }
      connection.close();
    });
  });

  it('should get the features from all tables', function() {
    return GeoPackageConnection.connect(path.join(__dirname, '..', 'fixtures', 'gdal_sample.gpkg'))
    .then(function(connection){
      var geoPackage = new GeoPackage('', '', connection);
      var tables = geoPackage.getFeatureTables();
      tables.forEach(function(table) {
        var featureDao = geoPackage.getFeatureDao(table);
        if (!featureDao) {
          throw new Error('No feature table exists');
        }
        var srs = featureDao.getSrs();
        var each = featureDao.queryForEach();
        for (var row of each) {
          var currentRow = featureDao.getRow(row);
          var geometry = currentRow.getGeometry();
          if (!geometry) {
            continue;
          }
          var geom = geometry.geometry;
          var geoJson = geom.toGeoJSON();
        }
      });
      connection.close();
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
      var contents = dao.queryForId('FEATURESriversds');
      var featureDao = geoPackage.getFeatureDaoWithContents(contents);
      should.exist(featureDao);
      featureDao.getGeometryType().should.be.equal('GEOMETRY');
      featureDao.table_name.should.be.equal('FEATURESriversds');
      connection.close();
    });
  });

  it('should get the TILE dao from the contents', function() {
    return GeoPackageConnection.connect(path.join(__dirname, '..', 'fixtures', 'rivers.gpkg'))
    .then(function(connection) {
      var geoPackage = new GeoPackage('', '', connection);
      var dao = geoPackage.getContentsDao();
      var contents = dao.queryForId('TILESosmds');
      return geoPackage.getTileDaoWithContents(contents);
    });
  });

  it('should get the tiles', function() {
    return GeoPackageConnection.connect(path.join(__dirname, '..', 'fixtures', 'rivers.gpkg'))
    .then(function(connection) {
      var geoPackage = new GeoPackage('', '', connection);
      var tables = geoPackage.getTileTables();

      return tables.reduce(function(sequence, table) {
        return sequence.then(function() {
          var tileDao = geoPackage.getTileDao(table);
          var maxZoom = tileDao.maxZoom;
          var minZoom = tileDao.minZoom;

          var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
          return gpr.getTile(0, 0, 1)
          .then(function(tileData) {
            should.exist(tileData);
          });
        });
      }, Promise.resolve()).then(function() {
        connection.close();
      });
    });
  });

  it('should get the info for the table', function() {
    this.timeout(30000);
    return GeoPackageConnection.connect(path.join(__dirname, '..', 'fixtures', 'rivers.gpkg'))
    .then(function(connection) {
      var geoPackage = new GeoPackage('', '', connection);
      var dao = geoPackage.getFeatureDao('FEATURESriversds');
      var info = geoPackage.getInfoForTable(dao);
      should.exist(info);
      info.tableName.should.be.equal('FEATURESriversds');
      info.columnMap.property_0.displayName.should.be.equal('Scalerank');
      connection.close();
    });
  });

  it('should get the info for the Imagery table', function() {
    return GeoPackageConnection.connect(path.join(__dirname, '..', 'fixtures', '3857.gpkg'))
    .then(function(connection) {
      var geoPackage = new GeoPackage('', '', connection);
      var tileDao = geoPackage.getTileDao('imagery');
      var info = geoPackage.getInfoForTable(tileDao);
      should.exist(info);
      info.tableName.should.be.equal('imagery');
      info.srs.id.should.be.equal(3857);
      connection.close();
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

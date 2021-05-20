var GeoPackageTileRetriever = require('../../lib/tiles/retriever').GeoPackageTileRetriever
  , GeoPackage = require('../../lib/geoPackage').GeoPackage
  , Projection = require('../../lib/projection/projection').Projection
  , GeoPackageConnection = require('../../lib/db/geoPackageConnection').GeoPackageConnection
  , should = require('chai').should()
  , path = require('path');

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
        var geometry = currentRow.geometry;
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
        var srs = featureDao.srs;
        var each = featureDao.queryForEach();
        for (var row of each) {
          var currentRow = featureDao.getRow(row);
          var geometry = currentRow.geometry;
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
      var contents = geoPackage.contentsDao.queryForId('FEATURESriversds');
      var featureDao = geoPackage.getFeatureDao(contents);
      should.exist(featureDao);
      featureDao.geometryType.should.be.equal('GEOMETRY');
      featureDao.table_name.should.be.equal('FEATURESriversds');
      connection.close();
    });
  });

  it('should get the TILE dao from the contents', function() {
    return GeoPackageConnection.connect(path.join(__dirname, '..', 'fixtures', 'rivers.gpkg'))
    .then(function(connection) {
      var geoPackage = new GeoPackage('', '', connection);
      var contents = geoPackage.contentsDao.queryForId('TILESosmds');
      return geoPackage.getTileDao(contents);
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
    var result = Projection.hasProjection('EPSG:4326');
    should.exist(result);
  });

  it('should throw error on invalid load projections argument', function() {
    (function() {
      Projection.loadProjections(null);
    }).should.throw('Invalid array of projections');
  });

  it('should throw error on unknown projection item', function() {
    (function() {
      Projection.loadProjections([null]);
    }).should.throw('Invalid projection in array. Valid projection {name: string, definition: string}.');
  });

  it('should load projections', function() {
    Projection.loadProjections([{name: 'EPSG:3821', definition: '+proj=longlat +ellps=aust_SA +no_defs '}]);
    var result = Projection.hasProjection('EPSG:3821');
    should.exist(result);
  });

  it('should throw error on empty add projection args', function() {
    (function() {
      Projection.loadProjection(null, null);
    }).should.throw('Invalid projection name/definition');
  });

  it('should add projection', function() {
    Projection.loadProjection('EPSG:4001', '+proj=longlat +ellps=airy +no_defs');
    var result = Projection.hasProjection('EPSG:4001');
    should.exist(result);
  });

});

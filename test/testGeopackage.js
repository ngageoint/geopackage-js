var GeoPackage = require('../index.js')
  , BoundingBox = require('../lib/boundingBox.js')
  , testSetup = require('./fixtures/testSetup');

var path = require('path')
  , fs = require('fs')
  , PureImage = require('pureimage')
  , should = require('chai').should();

describe('GeoPackageAPI tests', function() {

  var existingPath = path.join(__dirname, 'fixtures', 'rivers.gpkg');
  var geopackageToCreate = path.join(__dirname, 'tmp', 'tmp.gpkg');
  var tilePath = path.join(__dirname, 'fixtures', 'tiles', '0', '0', '0.png');
  var indexedPath = path.join(__dirname, 'fixtures', 'rivers_indexed.gpkg');


  it('should open the geopackage', function(done) {
    GeoPackage.open(existingPath, function(err, geopackage) {
      should.not.exist(err);
      should.exist(geopackage);
      should.exist(geopackage.getTables);
      done();
    });
  });

  it('should open the geopackage with a promise', function() {
    return GeoPackage.open(existingPath)
    .then(function(geopackage) {
      should.exist(geopackage);
      should.exist(geopackage.getTables);
    });
  });

  it('should not open a file without the minimum tables', function(done) {
    testSetup.createBareGeoPackage(geopackageToCreate, function(err, gp) {
      GeoPackage.open(geopackageToCreate, function(err, geopackage) {
        should.exist(err);
        should.not.exist(geopackage);
        testSetup.deleteGeoPackage(geopackageToCreate, done);
      });
    });
  });

  it('should not open a file without the correct extension', function(done) {
    GeoPackage.open(tilePath, function(err, geopackage) {
      should.exist(err);
      should.not.exist(geopackage);
      done();
    });
  });

  it('should not open a file without the correct extension via promise', function() {
    GeoPackage.open(tilePath)
    .catch(function(error) {
      should.exist(error);
    });
  });

  it('should open the geopackage byte array', function(done) {
    fs.readFile(existingPath, function(err, data) {
      GeoPackage.open(data, function(err, geopackage) {
        should.not.exist(err);
        should.exist(geopackage);
        done();
      });
    });
  });

  it('should not open a byte array that is not a geopackage', function(done) {
    fs.readFile(tilePath, function(err, data) {
      GeoPackage.open(data, function(err, geopackage) {
        should.exist(err);
        should.not.exist(geopackage);
        done();
      });
    });
  });

  it('should not create a geopackage without the correct extension', function(done) {
    GeoPackage.create(tilePath, function(err, geopackage) {
      should.exist(err);
      should.not.exist(geopackage);
      done();
    });
  });

  it('should not create a geopackage without the correct extension return promise', function(done) {
    GeoPackage.create(tilePath)
    .then(function(geopackage) {
      // should not get called
      false.should.be.equal(true);
    })
    .catch(function(error) {
      should.exist(error);
      done();
    });
  });

  it('should create a geopackage', function(done) {
    GeoPackage.create(geopackageToCreate, function(err, gp) {
      should.not.exist(err);
      should.exist(gp);
      should.exist(gp.getTables);
      done();
    });
  });

  it('should create a geopackage with a promise', function() {
    GeoPackage.create(geopackageToCreate)
    .then(function(geopackage) {
      should.exist(geopackage);
      should.exist(geopackage.getTables);
    });
  });

  it('should create a geopackage and export it', function(done) {
    GeoPackage.create(geopackageToCreate, function(err, gp) {
      should.not.exist(err);
      should.exist(gp);
      gp.export(function(err, buffer) {
        should.not.exist(err);
        should.exist(buffer);
        done();
      });
    });
  });

  it('should create a geopackage in memory', function(done) {
    GeoPackage.create(function(err, gp) {
      should.not.exist(err);
      should.exist(gp);
      done();
    });
  });

  describe('should operate on an indexed geopackage', function() {

    var indexedGeopackage;
    var originalFilename = indexedPath;
    var filename;

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
      filename = path.join(__dirname, 'fixtures', 'tmp', testSetup.createTempName());
      copyGeopackage(originalFilename, filename, function(err) {
        GeoPackage.open(filename, function(err, geopackage) {
          should.not.exist(err);
          should.exist(geopackage);
          indexedGeopackage = geopackage;
          done();
        });
      });
    });

    afterEach('should close the geopackage', function(done) {
      indexedGeopackage.close();
      testSetup.deleteGeoPackage(filename, done);
    });

    it('should get the tables', function() {
      var tables = indexedGeopackage.getTables();
      tables.should.be.deep.equal({ features: [ 'rivers' ], tiles: [ 'rivers_tiles' ] });
    });

    it('should get the tile tables', function() {
      var tables = indexedGeopackage.getTileTables();
      tables.should.be.deep.equal([ 'rivers_tiles' ]);
    });

    it('should get the feature tables', function() {
      var tables = indexedGeopackage.getFeatureTables();
      tables.should.be.deep.equal([ 'rivers' ]);
    });

    it('should check if it has feature table', function() {
      var exists = indexedGeopackage.hasFeatureTable('rivers');
      exists.should.be.equal(true);
    });

    it('should check if does not have feature table', function() {
      var exists = indexedGeopackage.hasFeatureTable('rivers_no');
      exists.should.be.equal(false);
    });

    it('should check if it has tile table', function() {
      var exists = indexedGeopackage.hasTileTable('rivers_tiles');
      exists.should.be.equal(true);
    });

    it('should check if does not have tile table', function() {
      var exists = indexedGeopackage.hasTileTable('rivers_tiles_no');
      exists.should.be.equal(false);
    });

    it('should get the 0 0 0 tile', function() {
      return GeoPackage.getTileFromXYZ(indexedGeopackage, 'rivers_tiles', 0, 0, 0, 256, 256)
      .then(function(tile) {
        should.exist(tile);
      });
    });

    it('should get the 0 0 0 tile in a canvas', function() {
      var canvas;
      if (typeof(process) !== 'undefined' && process.version) {
        canvas = PureImage.make(256, 256);
      } else {
        canvas = document.createElement('canvas');
      }
      return GeoPackage.drawXYZTileInCanvas(indexedGeopackage, 'rivers_tiles', 0, 0, 0, 256, 256, canvas);
    });

    it('should get the 0 0 0 vector tile', function() {
      var vectorTile = GeoPackage.getVectorTile(indexedGeopackage, 'rivers', 0, 0, 0);
      should.exist(vectorTile);
    });

    it('should query for the tiles in the bounding box', function() {
      var tiles = GeoPackage.getTilesInBoundingBoxWebZoom(indexedGeopackage, 'rivers_tiles', 0, -180, 180, -80, 80);
      tiles.tiles.length.should.be.equal(1);
    });

    it('should add geojson to the geopackage and keep it indexed', function() {
      var id = GeoPackage.addGeoJSONFeatureToGeoPackageAndIndex(indexedGeopackage, {
        "type": "Feature",
        "properties": {
          'property_0': 'test'
        },
        "geometry": {
          "type": "Point",
          "coordinates": [
            -99.84374999999999,
            40.17887331434696
          ]
        }
      }, 'rivers');
      // ensure the last indexed changed
      var db = indexedGeopackage.getDatabase();
      var index = db.get('SELECT * FROM nga_geometry_index where geom_id = ?', [id]);
      index.geom_id.should.be.equal(id);
    });

    it('should add geojson to the geopackage and keep it indexed and query it', function() {
      var id = GeoPackage.addGeoJSONFeatureToGeoPackageAndIndex(indexedGeopackage, {
        "type": "Feature",
        "properties": {
          'property_0': 'test'
        },
        "geometry": {
          "type": "Point",
          "coordinates": [
            -99.84374999999999,
            40.17887331434696
          ]
        }
      }, 'rivers');
      var features = GeoPackage.queryForGeoJSONFeaturesInTable(indexedGeopackage, 'rivers', new BoundingBox(-99.9, -99.8, 40.16, 40.18));
      features.length.should.be.equal(1);
    });

    it('should add geojson to the geopackage and keep it indexed and iterate it', function() {
      var id = GeoPackage.addGeoJSONFeatureToGeoPackageAndIndex(indexedGeopackage, {
        "type": "Feature",
        "properties": {
          'property_0': 'test'
        },
        "geometry": {
          "type": "Point",
          "coordinates": [
            -99.84374999999999,
            40.17887331434696
          ]
        }
      }, 'rivers')
      var iterator = GeoPackage.iterateGeoJSONFeaturesInTableWithinBoundingBox(indexedGeopackage, 'rivers', new BoundingBox(-99.9, -99.8, 40.16, 40.18))
      for (var geoJson of iterator) {
        geoJson.properties.Scalerank.should.be.equal('test');
      }
    });
  });

  describe('should operate on a new geopackage', function() {
    var geopackage;

    beforeEach(function(done) {
      fs.unlink(geopackageToCreate, function() {
        GeoPackage.create(geopackageToCreate, function(err, gp) {
          geopackage = gp;
          done();
        });
      });
    });

    it('should create a feature table', function() {
      var columns = [];

      var FeatureColumn = GeoPackage.FeatureColumn;
      var GeometryColumns = GeoPackage.GeometryColumns;
      var DataTypes = GeoPackage.DataTypes;

      var tableName = 'features';

      var geometryColumns = new GeometryColumns();
      geometryColumns.table_name = tableName;
      geometryColumns.column_name = 'geometry';
      geometryColumns.geometry_type_name = 'GEOMETRY';
      geometryColumns.z = 0;
      geometryColumns.m = 0;

      columns.push(FeatureColumn.createPrimaryKeyColumnWithIndexAndName(0, 'id'));
      columns.push(FeatureColumn.createColumnWithIndexAndMax(7, 'test_text_limited.test', DataTypes.GPKGDataType.GPKG_DT_TEXT, 5, false, null));
      columns.push(FeatureColumn.createColumnWithIndexAndMax(8, 'test_blob_limited.test', DataTypes.GPKGDataType.GPKG_DT_BLOB, 7, false, null));
      columns.push(FeatureColumn.createGeometryColumn(1, 'geometry', 'GEOMETRY', false, null));
      columns.push(FeatureColumn.createColumnWithIndex(2, 'test_text.test', DataTypes.GPKGDataType.GPKG_DT_TEXT, false, ""));
      columns.push(FeatureColumn.createColumnWithIndex(3, 'test_real.test', DataTypes.GPKGDataType.GPKG_DT_REAL, false, null));
      columns.push(FeatureColumn.createColumnWithIndex(4, 'test_boolean.test', DataTypes.GPKGDataType.GPKG_DT_BOOLEAN, false, null));
      columns.push(FeatureColumn.createColumnWithIndex(5, 'test_blob.test', DataTypes.GPKGDataType.GPKG_DT_BLOB, false, null));
      columns.push(FeatureColumn.createColumnWithIndex(6, 'test_integer.test', DataTypes.GPKGDataType.GPKG_DT_INTEGER, false, ""));

      return GeoPackage.createFeatureTable(geopackage, tableName, geometryColumns, columns)
      .then(function(featureDao) {
        should.exist(featureDao);
        var exists = geopackage.hasFeatureTable(tableName);
        exists.should.be.equal(true);
        var results = geopackage.getFeatureTables();
        results.length.should.be.equal(1);
        results[0].should.be.equal(tableName);
        return GeoPackage.addGeoJSONFeatureToGeoPackage(geopackage, {
          "type": "Feature",
          "properties": {
            'test_text_limited.test': 'test'
          },
          "geometry": {
            "type": "Point",
            "coordinates": [
              -99.84374999999999,
              40.17887331434696
            ]
          }
        }, tableName)
      })
      .then(function(id) {
        id.should.be.equal(1);
        return GeoPackage.addGeoJSONFeatureToGeoPackage(geopackage, {
          "type": "Feature",
          "properties": {
            'test_text_limited.test': 'test'
          },
          "geometry": {
            "type": "Point",
            "coordinates": [
              -99.84374999999999,
              40.17887331434696
            ]
          }
        }, tableName);
      })
      .then(function(id) {
        id.should.be.equal(2);
        return GeoPackage.getFeature(geopackage, tableName, 2);
      })
      .then(function(feature) {
        should.exist(feature);
        feature.id.should.be.equal(2);
        should.exist(feature.geometry);
        return GeoPackage.iterateGeoJSONFeaturesFromTable(geopackage, tableName);
      })
      .then(function(each) {
        var count = 0;
        for (var row of each.results) {
          count++;
        }
        count.should.be.equal(2);
      });
    });

    it('should create a tile table', function() {
      var columns = [];

      var TileColumn = GeoPackage.TileColumn;
      var DataTypes = GeoPackage.DataTypes;
      var BoundingBox = GeoPackage.BoundingBox;

      var tableName = 'tiles';

      var contentsBoundingBox = new BoundingBox(-180, 180, -80, 80);
      var contentsSrsId = 4326;
      var tileMatrixSetBoundingBox = new BoundingBox(-180, 180, -80, 80);
      var tileMatrixSetSrsId = 4326;
      return geopackage.createTileTableWithTableName(tableName, contentsBoundingBox, contentsSrsId, tileMatrixSetBoundingBox, tileMatrixSetSrsId)
      .then(function(tileMatrixSet) {
        should.exist(tileMatrixSet);
        var exists = geopackage.hasTileTable('tiles');
        exists.should.be.equal(true);
        var tables = geopackage.getTileTables();
        tables.length.should.be.equal(1);
        tables[0].should.be.equal('tiles');
      });
    });

    it('should create a standard web mercator tile table', function() {
      var columns = [];

      var TileColumn = GeoPackage.TileColumn;
      var DataTypes = GeoPackage.DataTypes;
      var BoundingBox = GeoPackage.BoundingBox;

      var tableName = 'tiles_web_mercator';

      var contentsBoundingBox = new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.342789244, 20037508.342789244);
      var contentsSrsId = 3857;
      var tileMatrixSetBoundingBox = new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.342789244, 20037508.342789244);
      var tileMatrixSetSrsId = 3857;
      return GeoPackage.createStandardWebMercatorTileTable(geopackage, tableName, contentsBoundingBox, contentsSrsId, tileMatrixSetBoundingBox, tileMatrixSetSrsId, 0, 3)
      .then(function(tileMatrixSet) {
        should.exist(tileMatrixSet);
      });
    });

    it('should add a tile to the tile table', function(done) {
      var columns = [];

      var TileColumn = GeoPackage.TileColumn;
      var DataTypes = GeoPackage.DataTypes;
      var BoundingBox = GeoPackage.BoundingBox;

      var tableName = 'tiles_web_mercator_2';

      var contentsBoundingBox = new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.342789244, 20037508.342789244);
      var contentsSrsId = 3857;
      var tileMatrixSetBoundingBox = new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.342789244, 20037508.342789244);
      var tileMatrixSetSrsId = 3857;

      GeoPackage.createStandardWebMercatorTileTable(geopackage, tableName, contentsBoundingBox, contentsSrsId, tileMatrixSetBoundingBox, tileMatrixSetSrsId, 0, 0)
      .then(function(tileMatrixSet) {
        should.exist(tileMatrixSet);
        testSetup.loadTile(tilePath, function(err, tileData) {
          var result = geopackage.addTile(tileData, tableName, 0, 0, 0);
          result.should.be.equal(1);
          var tileRow = GeoPackage.getTileFromTable(geopackage, tableName, 0, 0, 0);
          testSetup.diffImages(tileRow.getTileData(), tilePath, function(err, equal) {
            equal.should.be.equal(true);
            done();
          });
        });
      });
    });

    it('should add a tile to the tile table and get it via xyz', function(done) {
      var columns = [];

      var TileColumn = GeoPackage.TileColumn;
      var DataTypes = GeoPackage.DataTypes;
      var BoundingBox = GeoPackage.BoundingBox;

      var tableName = 'tiles_web_mercator_3';

      var contentsBoundingBox = new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.342789244, 20037508.342789244);
      var contentsSrsId = 3857;
      var tileMatrixSetBoundingBox = new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.342789244, 20037508.342789244);
      var tileMatrixSetSrsId = 3857;

      GeoPackage.createStandardWebMercatorTileTable(geopackage, tableName, contentsBoundingBox, contentsSrsId, tileMatrixSetBoundingBox, tileMatrixSetSrsId, 0, 0)
      .then(function(tileMatrixSet) {
        should.exist(tileMatrixSet);
        fs.readFile(tilePath, function(err, tile) {
          var result = geopackage.addTile(tile, tableName, 0, 0, 0);
          result.should.be.equal(1);
          GeoPackage.getTileFromXYZ(geopackage, tableName, 0, 0, 0, 256, 256)
          .then(function(tile) {
            testSetup.diffImages(tile, tilePath, function(err, equal) {
              equal.should.be.equal(true);
              done();
            });
          });
        });
      });
    });

    it('should add a tile to the tile table and get it into a canvas via xyz', function(done) {
      var columns = [];

      var TileColumn = GeoPackage.TileColumn;
      var DataTypes = GeoPackage.DataTypes;
      var BoundingBox = GeoPackage.BoundingBox;

      var tableName = 'tiles_web_mercator_4';

      var contentsBoundingBox = new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.342789244, 20037508.342789244);
      var contentsSrsId = 3857;
      var tileMatrixSetBoundingBox = new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.342789244, 20037508.342789244);
      var tileMatrixSetSrsId = 3857;

      GeoPackage.createStandardWebMercatorTileTable(geopackage, tableName, contentsBoundingBox, contentsSrsId, tileMatrixSetBoundingBox, tileMatrixSetSrsId, 0, 0)
      .then(function(tileMatrixSet) {
        should.exist(tileMatrixSet);
        fs.readFile(tilePath, function(err, tile) {
          var result = geopackage.addTile(tile, tableName, 0, 0, 0);
          result.should.be.equal(1);
          var canvas;
          if (typeof(process) !== 'undefined' && process.version) {
            canvas = PureImage.make(256, 256);
          } else {
            canvas = document.createElement('canvas');
          }
          GeoPackage.drawXYZTileInCanvas(geopackage, tableName, 0, 0, 0, 256, 256, canvas)
          .then(function(tile) {
            testSetup.diffCanvas(canvas, tilePath, function(err, equal) {
              equal.should.be.equal(true);
              done();
            });
          });
        });
      });
    });

  });

});

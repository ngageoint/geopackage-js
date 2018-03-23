var GeoPackage = require('../index.js')
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
    GeoPackage.openGeoPackage(existingPath, function(err, geopackage) {
      should.not.exist(err);
      should.exist(geopackage);
      done();
    });
  });

  it('should open the geopackage byte array', function(done) {
    fs.readFile(existingPath, function(err, data) {
      GeoPackage.openGeoPackageByteArray(data, function(err, geopackage) {
        should.not.exist(err);
        should.exist(geopackage);
        done();
      });
    });
  });

  it('should create a geopackage', function(done) {
    GeoPackage.createGeoPackage(geopackageToCreate, function(err, gp) {
      should.not.exist(err);
      should.exist(gp);
      done();
    });
  });

  it('should create a geopackage and export it', function(done) {
    GeoPackage.createGeoPackage(geopackageToCreate, function(err, gp) {
      should.not.exist(err);
      should.exist(gp);
      gp.export(function(err, buffer) {
        should.not.exist(err);
        should.exist(buffer);
        done();
      });
    });
  });

  describe('should operate on an indexed geopackage', function() {

    var indexedGeopackage;
    var originalFilename = indexedPath;
    var filename = path.join(__dirname, 'fixtures', 'tmp', 'rivers_indexed.gpkg');

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
        GeoPackage.openGeoPackage(filename, function(err, geopackage) {
          should.not.exist(err);
          should.exist(geopackage);
          indexedGeopackage = geopackage;
          done();
        });
      });
    });

    afterEach('should close the geopackage', function(done) {
      indexedGeopackage.close();
      if (typeof(process) !== 'undefined' && process.version) {
        fs.unlink(filename, done);
      } else {
        done();
      }
    });

    it('should add geojson to the geopackage and keep it indexed', function(done) {
      GeoPackage.addGeoJSONFeatureToGeoPackageAndIndex(indexedGeopackage, {
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
      }, 'rivers', function(err, id) {
        // ensure the last indexed changed
        var db = indexedGeopackage.getDatabase();
        db.get('SELECT * FROM nga_geometry_index where geom_id = ?', [id], function(err, index) {
          should.not.exist(err);
          index.geom_id.should.be.equal(id);
          done();
        });
      });
    });
  });

  describe('should operate on a new geopackage', function() {
    var geopackage;

    before(function(done) {
      console.log('delete geopackage');
      fs.unlink(geopackageToCreate, function() {
        console.log('create geopackage');
        GeoPackage.createGeoPackage(geopackageToCreate, function(err, gp) {
          geopackage = gp;
          done();
        });
      });
    });

    beforeEach(function(done) {
      console.log('open geopackage');
      GeoPackage.openGeoPackage(geopackageToCreate, function(err, gp) {
        geopackage = gp;
        done();
      });
    });

    it('should create a feature table', function(done) {
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

      GeoPackage.createFeatureTable(geopackage, tableName, geometryColumns, columns, function(err, featureDao) {
        should.not.exist(err);
        should.exist(featureDao);
        GeoPackage.hasFeatureTable(geopackage, tableName, function(err, exists) {
          exists.should.be.equal(true);
          should.not.exist(err);
          GeoPackage.getFeatureTables(geopackage, function(err, results) {
            results.length.should.be.equal(1);
            results[0].should.be.equal(tableName);
            GeoPackage.addGeoJSONFeatureToGeoPackage(geopackage, {
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
            }, tableName, function(err, id) {
              id.should.be.equal(1);
              GeoPackage.addGeoJSONFeatureToGeoPackage(geopackage, {
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
              }, tableName, function(err, id) {
                id.should.be.equal(2);
                GeoPackage.getFeature(geopackage, tableName, 2, function(err, feature) {
                  should.not.exist(err);
                  should.exist(feature);
                  feature.id.should.be.equal(2);
                  should.exist(feature.geometry);
                  var count = 0;
                  GeoPackage.iterateGeoJSONFeaturesFromTable(geopackage, tableName, function(err, feature, rowCallback) {
                    count++;
                    rowCallback();
                  }, function(err) {
                    count.should.be.equal(2);
                    done();
                  });
                });
              });
            });
          });
        });
      });
    });

    it.skip('should create a tile table', function(done) {
      var columns = [];

      var TileColumn = GeoPackage.TileColumn;
      var DataTypes = GeoPackage.DataTypes;
      var BoundingBox = GeoPackage.BoundingBox;

      var tableName = 'tiles';

      var contentsBoundingBox = new BoundingBox(-180, 180, -80, 80);
      var contentsSrsId = 4326;
      var tileMatrixSetBoundingBox = new BoundingBox(-180, 180, -80, 80);
      var tileMatrixSetSrsId = 4326;
      GeoPackage.createTileTable(geopackage, tableName, contentsBoundingBox, contentsSrsId, tileMatrixSetBoundingBox, tileMatrixSetSrsId, function(err, tileMatrixSet) {
        should.not.exist(err);
        should.exist(tileMatrixSet);
        GeoPackage.hasTileTable(geopackage, 'tiles', function(err, exists) {
          exists.should.be.equal(true);
          GeoPackage.getTileTables(geopackage, function(err, tables) {
            tables.length.should.be.equal(1);
            tables[0].should.be.equal('tiles');
            done();
          });
        });
      });
    });

    it.skip('should create a standard web mercator tile table', function(done) {
      var columns = [];

      var TileColumn = GeoPackage.TileColumn;
      var DataTypes = GeoPackage.DataTypes;
      var BoundingBox = GeoPackage.BoundingBox;

      var tableName = 'tiles_web_mercator';

      var contentsBoundingBox = new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.342789244, 20037508.342789244);
      var contentsSrsId = 3857;
      var tileMatrixSetBoundingBox = new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.342789244, 20037508.342789244);
      var tileMatrixSetSrsId = 3857;

      GeoPackage.createStandardWebMercatorTileTable(geopackage, tableName, contentsBoundingBox, contentsSrsId, tileMatrixSetBoundingBox, tileMatrixSetSrsId, 0, 3, function(err, tileMatrixSet) {
        should.not.exist(err);
        should.exist(tileMatrixSet);
        done();
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

      GeoPackage.createStandardWebMercatorTileTable(geopackage, tableName, contentsBoundingBox, contentsSrsId, tileMatrixSetBoundingBox, tileMatrixSetSrsId, 0, 0, function(err, tileMatrixSet) {
        should.not.exist(err);
        should.exist(tileMatrixSet);
        testSetup.loadTile(tilePath, function(err, tileData) {
          GeoPackage.addTileToGeoPackage(geopackage, tileData, tableName, 0, 0, 0, function(err, result) {
            result.should.be.equal(1);
            GeoPackage.getTileFromTable(geopackage, tableName, 0, 0, 0, function(err, tileRow) {
              testSetup.diffImages(tileRow.getTileData(), tilePath, function(err, equal) {
                equal.should.be.equal(true);
                done();
              });
            });
          });
        });
      });
    });

    it.skip('should add a tile to the tile table and get it via xyz', function(done) {
      var columns = [];

      var TileColumn = GeoPackage.TileColumn;
      var DataTypes = GeoPackage.DataTypes;
      var BoundingBox = GeoPackage.BoundingBox;

      var tableName = 'tiles_web_mercator_3';

      var contentsBoundingBox = new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.342789244, 20037508.342789244);
      var contentsSrsId = 3857;
      var tileMatrixSetBoundingBox = new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.342789244, 20037508.342789244);
      var tileMatrixSetSrsId = 3857;

      GeoPackage.createStandardWebMercatorTileTable(geopackage, tableName, contentsBoundingBox, contentsSrsId, tileMatrixSetBoundingBox, tileMatrixSetSrsId, 0, 0, function(err, tileMatrixSet) {
        should.not.exist(err);
        should.exist(tileMatrixSet);
        fs.readFile(tilePath, function(err, tile) {
          GeoPackage.addTileToGeoPackage(geopackage, tile, tableName, 0, 0, 0, function(err, result) {
            result.should.be.equal(1);
            GeoPackage.getTileFromXYZ(geopackage, tableName, 0, 0, 0, 256, 256, function(err, tile) {
              testSetup.diffImages(tile, tilePath, function(err, equal) {
                equal.should.be.equal(true);
                done();
              });
            });
          });
        });
      });
    });

    it.skip('should add a tile to the tile table and get it into a canvas via xyz', function(done) {
      var columns = [];

      var TileColumn = GeoPackage.TileColumn;
      var DataTypes = GeoPackage.DataTypes;
      var BoundingBox = GeoPackage.BoundingBox;

      var tableName = 'tiles_web_mercator_4';

      var contentsBoundingBox = new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.342789244, 20037508.342789244);
      var contentsSrsId = 3857;
      var tileMatrixSetBoundingBox = new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.342789244, 20037508.342789244);
      var tileMatrixSetSrsId = 3857;

      GeoPackage.createStandardWebMercatorTileTable(geopackage, tableName, contentsBoundingBox, contentsSrsId, tileMatrixSetBoundingBox, tileMatrixSetSrsId, 0, 0, function(err, tileMatrixSet) {
        should.not.exist(err);
        should.exist(tileMatrixSet);
        fs.readFile(tilePath, function(err, tile) {
          GeoPackage.addTileToGeoPackage(geopackage, tile, tableName, 0, 0, 0, function(err, result) {
            result.should.be.equal(1);
            var canvas;
            if (typeof(process) !== 'undefined' && process.version) {
              canvas = PureImage.make(256, 256);
            } else {
              canvas = document.createElement('canvas');
            }
            GeoPackage.drawXYZTileInCanvas(geopackage, tableName, 0, 0, 0, 256, 256, canvas, function(err, tile) {
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

});

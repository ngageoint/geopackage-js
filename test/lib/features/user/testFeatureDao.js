var FeatureDao = require('../../../../lib/features/user/featureDao.js')
  , FeatureColumn = require('../../../../lib/features/user/featureColumn')
  , DataTypes = require('../../../../lib/db/dataTypes')
  , GeoPackageManager = require('../../../../lib/geoPackageManager.js')
  , GeoPackage = require('../../../../index.js')
  , BoundingBox = require('../../../../lib/boundingBox.js')
  , GeometryData = require('../../../../lib/geom/geometryData')
  , testSetup = require('../../../fixtures/testSetup')
  , SetupFeatureTable = require('../../../fixtures/setupFeatureTable')
  , wkx = require('wkx')
  , fs = require('fs')
  , path = require('path')
  , should = require('chai').should();

describe('FeatureDao tests', function() {

  describe('Non indexed test', function() {
    var geoPackage;

    function copyGeopackage(orignal, copy, callback) {
      if (typeof(process) !== 'undefined' && process.version) {
        var fsExtra = require('fs-extra');
        fsExtra.copy(orignal, copy, callback);
      } else {
        filename = orignal;
        callback();
      }
    }

    beforeEach('create the GeoPackage connection', function(done) {
      var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'rivers.gpkg');
      var filename = path.join(__dirname, '..', '..', '..', 'fixtures', 'tmp', 'rivers.gpkg');
      copyGeopackage(originalFilename, filename, function() {
        GeoPackageManager.open(filename, function(err, gp) {
          geoPackage = gp;
          done();
        });
      });
    });

    afterEach('close the geopackage connection', function() {
      geoPackage.close();
    });

    it('should read the geometry', function(done) {
      geoPackage.getFeatureDaoWithTableName('FEATURESriversds', function(err, featureDao) {
        featureDao.getSrs(function(err, srs) {
          featureDao.queryForEach(function(err, row, rowDone) {
            var currentRow = featureDao.getFeatureRow(row);
            var geometry = currentRow.getGeometry();
            should.exist(geometry);
            rowDone();
          }, done);
        });
      });
    });

    it('should query for a row with property_1 equal to Gila', function(done) {
      geoPackage.getFeatureDaoWithTableName('FEATURESriversds', function(err, featureDao) {
        featureDao.queryForEqWithFieldAndValue('property_1', 'Gila', function(err, row, rowDone) {
          row.property_1.should.be.equal('Gila');
          rowDone();
        }, done);
      });
    });
  });

  describe('Indexed test', function() {
    var geoPackage;
    var featureDao;

    var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'rivers_indexed.gpkg');
    var filename = path.join(__dirname, '..', '..', '..', 'fixtures', 'tmp', 'rivers_indexed.gpkg');

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
        GeoPackageManager.open(filename, function(err, gp) {
          geoPackage = gp;
          should.not.exist(err);
          should.exist(gp);
          should.exist(gp.getDatabase().getDBConnection());
          gp.getPath().should.be.equal(filename);
          geoPackage.getFeatureDaoWithTableName('rivers', function(err, riverFeatureDao) {
            featureDao = riverFeatureDao;
            done();
          });
        });
      });
    });

    afterEach('should close the geopackage', function(done) {
      geoPackage.close();
      if (typeof(process) !== 'undefined' && process.version) {
        fs.unlink(filename, done);
      } else {
        done();
      }
    });

    it('should query for indexed geometries', function(done) {
      var count = 0;
      var bbox = new BoundingBox(-12863648.645994272, -12865751.85860068, 6655573.571054254, 6651886.678768059);
      featureDao.queryIndexedFeaturesWithWebMercatorBoundingBox(bbox, function(err, featureRow, rowCallback) {
        should.exist(featureRow.getValueWithColumnName('geom'));
        should.exist(featureRow.getValueWithColumnName('id'));
        should.exist(featureRow.getValueWithColumnName('property_0'));
        should.exist(featureRow.getValueWithColumnName('property_1'));
        should.exist(featureRow.getValueWithColumnName('property_2'));
        count++;
        rowCallback();
      }, function(err) {
        console.log('count', count);
        done();
      });
    });
  });

  describe('rivers 2 test', function() {
    var geoPackage;
    var featureDao;

    var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'rivers2.gpkg');
    var filename = path.join(__dirname, '..', '..', '..', 'fixtures', 'tmp', 'rivers2.gpkg');

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
        GeoPackageManager.open(filename, function(err, gp) {
          geoPackage = gp;
          should.not.exist(err);
          should.exist(gp);
          should.exist(gp.getDatabase().getDBConnection());
          gp.getPath().should.be.equal(filename);
          geoPackage.getFeatureDaoWithTableName('FEATURESriversds', function(err, riverFeatureDao) {
            featureDao = riverFeatureDao;
            done();
          });
        });
      });
    });

    afterEach('should close the geopackage', function(done) {
      geoPackage.close();
      if (typeof(process) !== 'undefined' && process.version) {
        fs.unlink(filename, done);
      } else {
        done();
      }
    });

    it('should query for rivers and calculate distance from a center point', function(done) {
      var pointToLineDistance = require('@turf/point-to-line-distance').default;
      var polygonToLine = require('@turf/polygon-to-line').default;
      var booleanPointInPolygon = require('@turf/boolean-point-in-polygon').default;
      var pointDistance = require('@turf/distance').default;

      // var bb = new BoundingBox(-107.44354248046876, -104.69696044921876, 33.098444531367186, 35.36889537510477);
      // var centerPoint = { type: 'Feature',
      //  properties: {},
      //  geometry:
      //   { type: 'Point',
      //     coordinates: [ -106.07025146484376, 34.233669953235975 ] } };

      var bb = new BoundingBox(-179, 0, 0, 80);
      var centerPoint = { type: 'Feature',
       properties: {},
       geometry:
        { type: 'Point',
          coordinates: [ -105.92193603515625, 34.406906587428736 ] } };

      // var bb = new BoundingBox(.4, .6, 1.4, 1.6);
      // var centerPoint = {
      //   "type": "Feature",
      //   "properties": {},
      //   "geometry": {
      //     "type": "Point",
      //     "coordinates": [
      //       0.5,
      //       1.5
      //     ]
      //   }
      // };
      var foundFeatures = [];
      var closestDistance = 100000000000;
      var closest;

      featureDao.queryForGeoJSONIndexedFeaturesWithBoundingBox(bb, function(err, row, rowCallback) {
        foundFeatures.push(row);
        var geometry = row.geometry;

        if (geometry.type == 'Point') {
          var distance = pointDistance(centerPoint, geometry);
          if (distance < closestDistance) {
            closest = geometry;
            closestDistance = distance;
          } else if (distance == closestDistance && closest.type != 'Point') {
            closest = geometry;
            closestDistance = distance;
          }
        } else if (geometry.type == 'LineString') {
          var distance = pointToLineDistance(centerPoint, geometry);
          if (distance < closestDistance) {
            closest = geometry;
            closestDistance = distance;
          } else if (distance == closestDistance && closest.type != 'Point') {
            closest = geometry;
            closestDistance = distance;
          }
        } else if (geometry.type == 'Polygon') {
          if (booleanPointInPolygon(centerPoint, geometry)) {
            if (closestDistance != 0) {
              closest = geometry;
              closestDistance = 0;
            }
          } else {
            var line = polygonToLine(geometry);
            var distance = pointToLineDistance(centerPoint, line);
            if (distance < closestDistance) {
              closest = geometry;
              closestDistance = distance;
            }
          }
        }
        rowCallback();
      }, function() {
        console.log('closest', closest.properties);
        // console.log('foundFeatures', foundFeatures);
        // foundFeatures.should.be.deep.equal(['box1', 'box2', 'line', 'point']);
        done();
      });
    });
  });

  describe('Query tests', function() {
    var geopackage;
    var queryTestFeatureDao;
    var testGeoPackage = path.join(__dirname, '..', '..', '..', 'fixtures', 'tmp', 'test.gpkg');

    beforeEach('should create the GeoPackage', function(done) {
      testSetup.deleteGeoPackage(testGeoPackage, function() {
        testSetup.createGeoPackage(testGeoPackage, function(err, gp) {
          geopackage = gp;

          var geometryColumns = SetupFeatureTable.buildGeometryColumns('QueryTest', 'geom', wkx.Types.wkt.GeometryCollection);
          var boundingBox = new BoundingBox(-180, 180, -80, 80);

          var columns = [];

          columns.push(FeatureColumn.createPrimaryKeyColumnWithIndexAndName(0, 'id'));
          columns.push(FeatureColumn.createGeometryColumn(1, 'geom', wkx.Types.wkt.Point, false, null));
          columns.push(FeatureColumn.createColumnWithIndex(2, 'name', DataTypes.GPKGDataType.GPKG_DT_TEXT, false, ""));

          var box1 = {
            "type": "Polygon",
            "coordinates": [
              [
                [
                  -1,
                  1
                ],
                [
                  1,
                  1
                ],
                [
                  1,
                  3
                ],
                [
                  -1,
                  3
                ],
                [
                  -1,
                  1
                ]
              ]
            ]
          };

          var box2 = {
            "type": "Polygon",
            "coordinates": [
              [
                [
                  0,
                  0
                ],
                [
                  2,
                  0
                ],
                [
                  2,
                  2
                ],
                [
                  0,
                  2
                ],
                [
                  0,
                  0
                ]
              ]
            ]
          };

          var line = {
            "type": "LineString",
            "coordinates": [
              [
                2,
                3
              ],
              [
                -1,
                0
              ]
            ]
          };

          var line2 = {
            "type": "Feature",
            "properties": {},
            "geometry": {
              "type": "LineString",
              "coordinates": [
                [
                  2.0,
                  2.5
                ],
                [
                  -0.5,
                  0
                ]
              ]
            }
          };

          var point = {
            "type": "Point",
            "coordinates": [
              0.5,
              1.5
            ]
          };

          var point2 = {
            "type": "Point",
            "coordinates": [
              1.5,
              .5
            ]
          };

          var createRow = function(geoJson, name, featureDao, callback) {
            featureDao.getSrs(function(err, srs) {
              var featureRow = featureDao.newRow();
              var geometryData = new GeometryData();
              geometryData.setSrsId(srs.srs_id);
              var geometry = wkx.Geometry.parseGeoJSON(geoJson);
              geometryData.setGeometry(geometry);
              featureRow.setGeometry(geometryData);
              featureRow.setValueWithColumnName('name', name);

              featureDao.create(featureRow, callback);
            });
          }
          // create the features
          // Two intersecting boxes with a line going through the intersection and a point on the line
          // ---------- / 3
          // | 1  ____|/_____
          // |    |  /|  2  |
          // |____|_/_|     |
          //      |/        |
          //      /_________|
          //     /
          geopackage.createFeatureTableWithGeometryColumns(geometryColumns, boundingBox, 4326, columns, function(err, result) {
            geopackage.getFeatureDaoWithTableName('QueryTest', function(err, featureDao) {
              queryTestFeatureDao = featureDao;
              createRow(box1, 'box1', featureDao, function() {
                createRow(box2, 'box2', featureDao, function() {
                  createRow(line, 'line', featureDao, function() {
                    createRow(point, 'point', featureDao, function() {
                      createRow(point2, 'point2', featureDao, function() {
                        featureDao.featureTableIndex.index(function() {
                          console.log('progress', arguments);
                        }, function(err) {
                          should.not.exist(err);
                          done();
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });

    it('should query for the bounding box', function(done) {
      // "1.3681411743164062,2.3545739912722157,1.4780044555664065,2.4643401260581146"
      var bb = new BoundingBox(1.3681411743164062, 1.4780044555664065, 2.3545739912722157, 2.4643401260581146);
      queryTestFeatureDao.queryForGeoJSONIndexedFeaturesWithBoundingBox(bb, function(err, row, rowCallback) {
        console.log('row', row);
        // row.values.name.should.be.equal('box1');
        rowCallback();
      }, function(){
        done();
      });
    });

    it('should query for box 1', function(done) {
      // var bb = new BoundingBox(minLongitudeOrBoundingBox, maxLongitude, minLatitude, maxLatitude)
      var bb = new BoundingBox(-.4, -.6, 2.4, 2.6);
      queryTestFeatureDao.queryIndexedFeaturesWithBoundingBox(bb, function(err, row, rowCallback) {
        row.values.name.should.be.equal('box1');
        rowCallback();
      }, function(){
        done();
      });
    });

    it('should query for box 2', function(done) {
      var bb = new BoundingBox(1.4, 1.6, .4, .6);
      queryTestFeatureDao.queryIndexedFeaturesWithBoundingBox(bb, function(err, row, rowCallback) {
        row.values.name.should.be.equal('box2');
        rowCallback();
      }, function(){
        done();
      });
    });

    it('should query for box1, box 2 and line', function(done) {
      var bb = new BoundingBox(-.1, .1, .9, 1.1);
      var foundFeatures = [];
      queryTestFeatureDao.queryIndexedFeaturesWithBoundingBox(bb, function(err, row, rowCallback) {
        foundFeatures.push(row.values.name);
        rowCallback();
      }, function(){
        foundFeatures.should.be.deep.equal(['box1', 'box2', 'line']);
        done();
      });
    });

    it('should query for box1, box 2, line, and point', function(done) {
      var bb = new BoundingBox(.4, .6, 1.4, 1.6);
      var foundFeatures = [];
      queryTestFeatureDao.queryIndexedFeaturesWithBoundingBox(bb, function(err, row, rowCallback) {
        foundFeatures.push(row.values.name);
        rowCallback();
      }, function() {
        foundFeatures.should.be.deep.equal(['box1', 'box2', 'line', 'point']);
        done();
      });
    });

    it('should query for box1, box 2, line, and point and calculate distance from a center point', function(done) {
      var pointToLineDistance = require('@turf/point-to-line-distance').default;
      var polygonToLine = require('@turf/polygon-to-line').default;
      var booleanPointInPolygon = require('@turf/boolean-point-in-polygon').default;
      var pointDistance = require('@turf/distance').default;

      var bb = new BoundingBox(-107.44354248046876, -104.69696044921876, 33.098444531367186, 35.36889537510477);
      var centerPoint = { type: 'Feature',
       properties: {},
       geometry:
        { type: 'Point',
          coordinates: [ -106.07025146484376, 34.233669953235975 ] } };

      // var bb = new BoundingBox(.4, .6, 1.4, 1.6);
      // var centerPoint = {
      //   "type": "Feature",
      //   "properties": {},
      //   "geometry": {
      //     "type": "Point",
      //     "coordinates": [
      //       0.5,
      //       1.5
      //     ]
      //   }
      // };
      var foundFeatures = [];
      var closestDistance = 100000000000;
      var closest;

      queryTestFeatureDao.queryIndexedFeaturesWithBoundingBox(bb, function(err, row, rowCallback) {
        console.log('row', row);
        foundFeatures.push(row.values);
        var geometry = row.getGeometry().toGeoJSON();

        if (geometry.type == 'Point') {
          var distance = pointDistance(centerPoint, geometry);
          if (distance < closestDistance) {
            closest = geometry;
            closestDistance = distance;
          } else if (distance == closestDistance && closest.type != 'Point') {
            closest = geometry;
            closestDistance = distance;
          }
        } else if (geometry.type == 'LineString') {
          var distance = pointToLineDistance(centerPoint, geometry);
          if (distance < closestDistance) {
            closest = geometry;
            closestDistance = distance;
          } else if (distance == closestDistance && closest.type != 'Point') {
            closest = geometry;
            closestDistance = distance;
          }
        } else if (geometry.type == 'Polygon') {
          if (booleanPointInPolygon(centerPoint, geometry)) {
            if (closestDistance != 0) {
              closest = geometry;
              closestDistance = 0;
            }
          } else {
            var line = polygonToLine(geometry);
            var distance = pointToLineDistance(centerPoint, line);
            if (distance < closestDistance) {
              closest = geometry;
              closestDistance = distance;
            }
          }
        }
        rowCallback();
      }, function() {
        console.log('closest', closest);
        console.log('foundFeatures', foundFeatures);
        // foundFeatures.should.be.deep.equal(['box1', 'box2', 'line', 'point']);
        done();
      });
    });

    it('should get the x: 1029, y: 1013, z: 11 tile from the GeoPackage api in a reasonable amount of time', function(done) {
      this.timeout(3000);
      console.time('generating indexed tile');
      GeoPackage.getFeatureTileFromXYZ(geopackage, 'QueryTest', 1029, 1013, 11, 256, 256, function(err, data) {
        console.timeEnd('generating indexed tile');
        if (!data) return done(err);
        done();
      });
    });

    it('should get the x: 1026, y: 1015, z: 11 tile from the GeoPackage api in a reasonable amount of time', function(done) {
      this.timeout(3000);
      console.time('generating indexed tile');
      GeoPackage.getFeatureTileFromXYZ(geopackage, 'QueryTest', 1026, 1015, 11, 256, 256, function(err, data) {
        console.timeEnd('generating indexed tile');
        if (!data) return done(err);
        fs.writeFileSync('/tmp/1026.png', data);
        done();
      });
    });

    it('should get the x: 64, y: 63, z: 7 features as geojson', function(done) {
      this.timeout(3000);
      console.time('generating indexed tile');
      GeoPackage.getGeoJSONFeaturesInTile(geopackage, 'QueryTest', 64, 63, 7, function(err, geoJSON) {
        console.timeEnd('generating indexed tile');
        if (!geoJSON) return done(err);
        geoJSON.length.should.be.equal(5);
        done();
      });
    });

    it('should get the x: 64, y: 63, z: 7 tile from the GeoPackage api in a reasonable amount of time', function(done) {
      this.timeout(3000);
      console.time('generating indexed tile');
      GeoPackage.getFeatureTileFromXYZ(geopackage, 'QueryTest', 64, 63, 7, 256, 256, function(err, data) {
        console.timeEnd('generating indexed tile');
        if (!data) return done(err);
        fs.writeFileSync('/tmp/64.png', data);
        done();
      });
    });
  });

});

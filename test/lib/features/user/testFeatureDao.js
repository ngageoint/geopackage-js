var FeatureDao = require('../../../../lib/features/user/featureDao.js')
  , FeatureColumn = require('../../../../lib/features/user/featureColumn')
  , DataTypes = require('../../../../lib/db/dataTypes')
  , GeoPackageAPI = require('../../../../index.js')
  , BoundingBox = require('../../../../lib/boundingBox.js')
  , GeometryData = require('../../../../lib/geom/geometryData')
  , testSetup = require('../../../fixtures/testSetup')
  , SetupFeatureTable = require('../../../fixtures/setupFeatureTable')
  , RelatedTablesUtils = require('../../extension/relatedTables/relatedTablesUtils')
  , MediaTable = require('../../../../lib/extension/relatedTables/mediaTable')
  , SimpleAttributesTable = require('../../../../lib/extension/relatedTables/simpleAttributesTable')
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
    var filename;
    beforeEach('create the GeoPackage connection', function(done) {
      var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'rivers.gpkg');
      filename = path.join(__dirname, '..', '..', '..', 'fixtures', 'tmp', testSetup.createTempName());
      copyGeopackage(originalFilename, filename, function() {
        GeoPackageAPI.open(filename, function(err, gp) {
          geoPackage = gp;
          done();
        });
      });
    });

    afterEach('close the geopackage connection', function(done) {
      geoPackage.close();
      testSetup.deleteGeoPackage(filename, done);
    });

    it('should read the geometry', function() {
      var featureDao = geoPackage.getFeatureDaoWithTableName('FEATURESriversds');
      var each = featureDao.queryForEach();
      var srs = featureDao.srs;
      for (var row of each) {
        var currentRow = featureDao.getFeatureRow(row);
        var geometry = currentRow.getGeometry();
        should.exist(geometry);
      }
    });

    it('should query for a row with property_1 equal to Gila', function() {
      var featureDao = geoPackage.getFeatureDaoWithTableName('FEATURESriversds');

      for (var row of featureDao.queryForEachEqWithFieldAndValue('property_1', 'Gila')) {
        row.property_1.should.be.equal('Gila');
      }
    });
  });

  describe('Indexed test', function() {
    var geoPackage;
    var featureDao;

    var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'rivers_indexed.gpkg');
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
      filename = path.join(__dirname, '..', '..', '..', 'fixtures', 'tmp', testSetup.createTempName());
      copyGeopackage(originalFilename, filename, function(err) {
        GeoPackageAPI.open(filename, function(err, gp) {
          geoPackage = gp;
          should.not.exist(err);
          should.exist(gp);
          should.exist(gp.getDatabase().getDBConnection());
          gp.getPath().should.be.equal(filename);
          featureDao = geoPackage.getFeatureDaoWithTableName('rivers');
          done();
        });
      });
    });

    afterEach('should close the geopackage', function(done) {
      geoPackage.close();
      testSetup.deleteGeoPackage(filename, done);
    });

    it('should query for indexed geometries', function() {
      var count = 0;
      var bbox = new BoundingBox(-13189576.119, -13126488.564, 6637372.21, 6607360.178);
      var iterator = featureDao.queryIndexedFeaturesWithWebMercatorBoundingBox(bbox);

      for (var row of iterator) {
        count++;
        row.values.property_1.should.be.equal('Columbia');
        should.exist(row.getValueWithColumnName('geom'));
        should.exist(row.getValueWithColumnName('id'));
        should.exist(row.getValueWithColumnName('property_0'));
        should.exist(row.getValueWithColumnName('property_1'));
        should.exist(row.getValueWithColumnName('property_2'));
      }
      count.should.be.equal(1);
    });
  });

  describe('Query For Shapes', function() {
    var geoPackage;
    var featureDao;

    var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'test_shapes_two_points.gpkg');
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

    beforeEach('should copy the geopackage', function(done) {
      filename = path.join(__dirname, '..', '..', '..', 'fixtures', 'tmp', testSetup.createTempName());
      copyGeopackage(originalFilename, filename, done);
    });

    afterEach('should close the geopackage', function(done) {
      testSetup.deleteGeoPackage(filename, done);
    });

    it('should query for GeoJSON features', function() {
      var bb = new BoundingBox(-.4, -.6, 2.4, 2.6);
      GeoPackageAPI.queryForGeoJSONFeaturesInTableFromPath(filename, 'QueryTest', bb)
      .then(function(features) {
        features[0].properties.name.should.be.equal('box1');
      });
    });

    it('should iterate GeoJSON features', function() {
      var count = 0;
      var bb = new BoundingBox(-.4, -.6, 2.4, 2.6);
      GeoPackageAPI.iterateGeoJSONFeaturesFromPathInTableWithinBoundingBox(filename, 'QueryTest', bb)
      .then(function(iterator) {
        for (var feature of iterator) {
          feature.properties.name.should.be.equal('box1');
          count++;
        }
        count.should.be.equal(1);
      });
    });
  });

  describe('rivers 2 test', function() {
    var geoPackage;
    var featureDao;

    var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'rivers2.gpkg');
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
      filename = path.join(__dirname, '..', '..', '..', 'fixtures', 'tmp', testSetup.createTempName());
      copyGeopackage(originalFilename, filename, function(err) {
        GeoPackageAPI.open(filename, function(err, gp) {
          geoPackage = gp;
          should.not.exist(err);
          should.exist(gp);
          should.exist(gp.getDatabase().getDBConnection());
          gp.getPath().should.be.equal(filename);
          featureDao = geoPackage.getFeatureDaoWithTableName('FEATURESriversds');
          done();
        });
      });
    });

    afterEach('should close the geopackage', function(done) {
      geoPackage.close();
      testSetup.deleteGeoPackage(filename, done);
    });

    it('should query for rivers and calculate distance from a center point', function() {
      var pointToLineDistance = require('@turf/point-to-line-distance').default;
      var polygonToLine = require('@turf/polygon-to-line').default;
      var booleanPointInPolygon = require('@turf/boolean-point-in-polygon').default;
      var pointDistance = require('@turf/distance').default;

      var bb = new BoundingBox(-179, 0, 0, 80);
      var centerPoint = { type: 'Feature',
       properties: {},
       geometry:
        { type: 'Point',
          coordinates: [ -105.92193603515625, 34.406906587428736 ] } };


      var iterator = featureDao.queryForGeoJSONIndexedFeaturesWithBoundingBox(bb);
      var foundFeatures = [];
      var closestDistance = 100000000000;
      var closest;

      for (var row of iterator) {
        foundFeatures.push(row);
        var geometry = row.geometry;

        if (geometry.type == 'Point') {
          var distance = pointDistance(centerPoint, geometry);
          if (distance < closestDistance) {
            closest = row;
            closestDistance = distance;
          } else if (distance == closestDistance && closest.type != 'Point') {
            closest = row;
            closestDistance = distance;
          }
        } else if (geometry.type == 'LineString') {
          var distance = pointToLineDistance(centerPoint, geometry);
          if (distance < closestDistance) {
            closest = row;
            closestDistance = distance;
          } else if (distance == closestDistance && closest.type != 'Point') {
            closest = row;
            closestDistance = distance;
          }
        } else if (geometry.type == 'Polygon') {
          if (booleanPointInPolygon(centerPoint, geometry)) {
            if (closestDistance != 0) {
              closest = row;
              closestDistance = 0;
            }
          } else {
            var line = polygonToLine(geometry);
            var distance = pointToLineDistance(centerPoint, line);
            if (distance < closestDistance) {
              closest = row;
              closestDistance = distance;
            }
          }
        }
      }
      closest.properties.Name.should.be.equal('Rio Grande');
    });
  });

  describe('Query tests', function() {
    var geopackage;
    var queryTestFeatureDao;
    var testPath = path.join(__dirname, '..', '..', '..', 'fixtures', 'tmp');
    var testGeoPackage;
    var tileBuffer;

    afterEach('should delete the geopackage', function(done) {
      testSetup.deleteGeoPackage(testGeoPackage, done);
    });

    beforeEach('get the tile buffer', function(done) {
      testSetup.loadTile(path.join(__dirname, '..', '..', '..', 'fixtures', 'tiles', '0', '0', '0.png'), function(err, buffer) {
        tileBuffer = buffer;
        done();
      });
    });

    beforeEach('should create the GeoPackage', function(done) {
      testGeoPackage = path.join(testPath, testSetup.createTempName());
      testSetup.createGeoPackage(testGeoPackage, function(err, gp) {
        geopackage = gp;

        var geometryColumns = SetupFeatureTable.buildGeometryColumns('QueryTest', 'geom', wkx.Types.wkt.GeometryCollection);
        var boundingBox = new BoundingBox(-180, 180, -80, 80);

        var columns = [];

        columns.push(FeatureColumn.createPrimaryKeyColumnWithIndexAndName(0, 'id'));
        columns.push(FeatureColumn.createGeometryColumn(1, 'geom', wkx.Types.wkt.Point, false, null));
        columns.push(FeatureColumn.createColumnWithIndex(2, 'name', DataTypes.GPKGDataType.GPKG_DT_TEXT, false, ""));
        columns.push(FeatureColumn.createColumnWithIndex(3, '_feature_id', DataTypes.GPKGDataType.GPKG_DT_TEXT, false, ""));
        columns.push(FeatureColumn.createColumnWithIndex(4, '_properties_id', DataTypes.GPKGDataType.GPKG_DT_TEXT, false, ""));

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

        var createRow = function(geoJson, name, featureDao) {
          var srs = featureDao.getSrs();
          var featureRow = featureDao.newRow();
          var geometryData = new GeometryData();
          geometryData.setSrsId(srs.srs_id);
          var geometry = wkx.Geometry.parseGeoJSON(geoJson);
          geometryData.setGeometry(geometry);
          featureRow.setGeometry(geometryData);
          featureRow.setValueWithColumnName('name', name);
          featureRow.setValueWithColumnName('_feature_id', name);
          featureRow.setValueWithColumnName('_properties_id', 'properties' + name);
          return featureDao.create(featureRow);
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
        geopackage.createFeatureTableWithGeometryColumns(geometryColumns, boundingBox, 4326, columns)
        .then(function(result) {
          var featureDao = geopackage.getFeatureDaoWithTableName('QueryTest');
          queryTestFeatureDao = featureDao;
          createRow(box1, 'box1', featureDao);
          createRow(box2, 'box2', featureDao);
          createRow(line, 'line', featureDao);
          createRow(point, 'point', featureDao);
          createRow(point2, 'point2', featureDao);
          featureDao.featureTableIndex.index()
          .then(function() {
            done();
          });
        });
      });
    });

    it('should update a shape', function() {
      var line;
      for (var feature of queryTestFeatureDao.queryForEachEqWithFieldAndValue('_feature_id', 'line')) {
        line = queryTestFeatureDao.getFeatureRow(feature);
      }
      line.setValueWithColumnName('name', 'UpdatedLine');
      var newLine;
      queryTestFeatureDao.update(line);
      for (var feature of queryTestFeatureDao.queryForEachEqWithFieldAndValue('_feature_id', 'line')) {
        newLine = queryTestFeatureDao.getFeatureRow(feature);
      }
      newLine.getValueWithColumnName('name').should.be.equal('UpdatedLine');
    });

    it('should count by a field', function(){
      var count = queryTestFeatureDao.countByEqWithFieldAndValue('name', 'line');
      count.should.be.equal(1);
    });

    it('should query for _feature_id', function() {
      var row = GeoPackageAPI.getFeature(geopackage, 'QueryTest', 'line');
      row.properties.name.should.be.equal('line');
    });

    it('should query for _properties_id', function() {
      var row = GeoPackageAPI.getFeature(geopackage, 'QueryTest', 'propertiesline');
      row.properties.name.should.be.equal('line');
    });

    it('should query for the bounding box', function() {
      var bb = new BoundingBox(-.4, -.6, 2.4, 2.6);
      var iterator = queryTestFeatureDao.queryForGeoJSONIndexedFeaturesWithBoundingBox(bb);
      for (var row of iterator) {
        row.properties.name.should.be.equal('box1');
      }
    });

    it('should get features in the bounding box', function() {
      var bb = new BoundingBox(-.4, -.6, 2.4, 2.6);
      return GeoPackageAPI.getFeaturesInBoundingBox(geopackage, 'QueryTest', -.4, -.6, 2.4, 2.6)
      .then(function(iterator) {
        for (var feature of iterator) {
          feature.values.name.should.be.equal('box1');
        }
      });
    });

    it('should query for box 1', function() {
      // var bb = new BoundingBox(minLongitudeOrBoundingBox, maxLongitude, minLatitude, maxLatitude)
      var bb = new BoundingBox(-.4, -.6, 2.4, 2.6);
      var iterator = queryTestFeatureDao.queryIndexedFeaturesWithBoundingBox(bb)
      for (var row of iterator) {
        row.values.name.should.be.equal('box1');
      }
    });

    it('should query for box 2', function() {
      var bb = new BoundingBox(1.1, 1.3, .4, .6);
      var iterator = queryTestFeatureDao.queryIndexedFeaturesWithBoundingBox(bb);
      for (var row of iterator) {
        row.values.name.should.be.equal('box2');
      };
    });

    it('should query for box1, box 2 and line', function() {
      var bb = new BoundingBox(-.1, .1, .9, 1.1);
      var foundFeatures = [];
      var iterator = queryTestFeatureDao.queryIndexedFeaturesWithBoundingBox(bb);

      for (var row of iterator) {
        foundFeatures.push(row.values.name);
      }
      foundFeatures.should.be.deep.equal(['box1', 'box2', 'line']);
    });

    it('should query for box1, box 2, line, and point', function() {
      var bb = new BoundingBox(.4, .6, 1.4, 1.6);
      var foundFeatures = [];
      var iterator = queryTestFeatureDao.queryIndexedFeaturesWithBoundingBox(bb);
      for (var row of iterator) {
        foundFeatures.push(row.values.name);
      }
      foundFeatures.should.be.deep.equal(['box1', 'box2', 'line', 'point']);
    });

    it('should query for box1, box 2, line, and point and calculate distance from a center point', function() {
      var pointToLineDistance = require('@turf/point-to-line-distance').default;
      var polygonToLine = require('@turf/polygon-to-line').default;
      var booleanPointInPolygon = require('@turf/boolean-point-in-polygon').default;
      var pointDistance = require('@turf/distance').default;

      // var bb = new BoundingBox(-107.44354248046876, -104.69696044921876, 33.098444531367186, 35.36889537510477);
      var centerPoint = { type: 'Feature',
       properties: {},
       geometry:
        { type: 'Point',
          coordinates: [ -106.07025146484376, 34.233669953235975 ] } };

      var bb = new BoundingBox(.4, .6, 1.4, 1.6);
      var centerPoint = {
        "type": "Feature",
        "properties": {},
        "geometry": {
          "type": "Point",
          "coordinates": [
            0.5,
            1.5
          ]
        }
      };
      var foundFeatures = [];
      var closestDistance = 100000000000;
      var closest;

      var iterator = queryTestFeatureDao.queryIndexedFeaturesWithBoundingBox(bb);

      for (var row of iterator) {
        foundFeatures.push(row.values.name);
        var geometry = row.getGeometry().toGeoJSON();

        if (geometry.type == 'Point') {
          var distance = pointDistance(centerPoint, geometry);
          if (distance < closestDistance) {
            closest = row;
            closestDistance = distance;
          } else if (distance == closestDistance && closest.type != 'Point') {
            closest = row;
            closestDistance = distance;
          }
        } else if (geometry.type == 'LineString') {
          var distance = pointToLineDistance(centerPoint, geometry);
          if (distance < closestDistance) {
            closest = row;
            closestDistance = distance;
          } else if (distance == closestDistance && closest.type != 'Point') {
            closest = row;
            closestDistance = distance;
          }
        } else if (geometry.type == 'Polygon') {
          if (booleanPointInPolygon(centerPoint, geometry)) {
            if (closestDistance != 0) {
              closest = row;
              closestDistance = 0;
            }
          } else {
            var line = polygonToLine(geometry);
            var distance = pointToLineDistance(centerPoint, line);
            if (distance < closestDistance) {
              closest = row;
              closestDistance = distance;
            }
          }
        }
      }
      closest.values.name.should.be.equal('point');
      foundFeatures.should.be.deep.equal(['box1', 'box2', 'line', 'point']);
    });

    it('should get the x: 1029, y: 1013, z: 11 tile from the GeoPackage api in a reasonable amount of time', function() {
      this.timeout(5000);
      console.time('generating indexed tile');
      return GeoPackageAPI.getFeatureTileFromXYZ(geopackage, 'QueryTest', 1029, 1013, 11, 256, 256)
      .then(function(data) {
        console.timeEnd('generating indexed tile');
        should.exist(data);
      });
    });

    it('should get the x: 1026, y: 1015, z: 11 tile from the GeoPackage api in a reasonable amount of time', function() {
      this.timeout(5000);
      console.time('generating indexed tile');
      return GeoPackageAPI.getFeatureTileFromXYZ(geopackage, 'QueryTest', 1026, 1015, 11, 256, 256)
      .then(function(data) {
        console.timeEnd('generating indexed tile');
        should.exist(data);
      });
    });

    it('should get the x: 64, y: 63, z: 7 features as geojson', function() {
      this.timeout(3000);
      console.time('generating indexed tile');
      return GeoPackageAPI.getGeoJSONFeaturesInTile(geopackage, 'QueryTest', 64, 63, 7)
      .then(function(geoJSON) {
        console.timeEnd('generating indexed tile');
        should.exist(geoJSON);
        geoJSON.length.should.be.equal(5);
      });
    });

    it('should get the x: 64, y: 63, z: 7 tile from the GeoPackage api in a reasonable amount of time', function() {
      this.timeout(3000);
      console.time('generating indexed tile');
      return GeoPackageAPI.getFeatureTileFromXYZ(geopackage, 'QueryTest', 64, 63, 7, 256, 256)
      .then(function(data) {
        console.timeEnd('generating indexed tile');
        should.exist(data);
      });
    });

    it('should create a media relationship between a feature and a media row', function() {
      var rte = geopackage.getRelatedTablesExtension();
      var additionalMediaColumns = RelatedTablesUtils.createAdditionalUserColumns(MediaTable.numRequiredColumns());
      var mediaTable = MediaTable.create('media_table', additionalMediaColumns);
      rte.createRelatedTable(mediaTable);

      var mediaDao = rte.getMediaDao(mediaTable);
      should.exist(mediaDao);
      mediaTable = mediaDao.mediaTable;
      should.exist(mediaTable);

      // Create media row
      var contentType = 'image/png';
      var mediaRow = mediaDao.newRow();
      mediaRow.setData(tileBuffer);
      mediaRow.setContentType(contentType);
      RelatedTablesUtils.populateRow(mediaTable, mediaRow, MediaTable.requiredColumns());
      mediaRowId = mediaDao.create(mediaRow);
      mediaRowId.should.be.greaterThan(0);
      mediaRow = mediaDao.queryForIdObject(mediaRowId);

      var featureRow = queryTestFeatureDao.getFeatureRow(queryTestFeatureDao.queryForAll()[0]);
      return queryTestFeatureDao.linkMediaRow(featureRow, mediaRow)
      .then(function() {
        var linkedMedia = queryTestFeatureDao.getLinkedMedia(featureRow);
        linkedMedia.length.should.be.equal(1);
        linkedMedia[0].id.should.be.equal(mediaRowId);
      });
    });

    it('should create a simple attributes relationship between a feature and a simple attributes row', function() {
      var rte = geopackage.getRelatedTablesExtension();
      var simpleUserColumns = RelatedTablesUtils.createSimpleUserColumns(SimpleAttributesTable.numRequiredColumns(), true);
      var simpleTable = SimpleAttributesTable.create('simple_table', simpleUserColumns);
      rte.createRelatedTable(simpleTable);

      var simpleDao = rte.getSimpleAttributesDao(simpleTable);
      should.exist(simpleDao);
      simpleTable = simpleDao.simpleAttributesTable;
      should.exist(simpleTable);

      // Create simple attributes row
      var simpleRow = simpleDao.newRow();
      RelatedTablesUtils.populateRow(simpleTable, simpleRow, SimpleAttributesTable.requiredColumns());
      simpleRowId = simpleDao.create(simpleRow);
      simpleRowId.should.be.greaterThan(0);
      simpleRow = simpleDao.queryForIdObject(simpleRowId);

      var featureRow = queryTestFeatureDao.getFeatureRow(queryTestFeatureDao.queryForAll()[0]);
      return queryTestFeatureDao.linkSimpleAttributesRow(featureRow, simpleRow)
      .then(function() {
        var linkedAttributes = queryTestFeatureDao.getLinkedSimpleAttributes(featureRow);
        linkedAttributes.length.should.be.equal(1);
        linkedAttributes[0].id.should.be.equal(simpleRowId);
      });
    });

    it('should create a feature relationship between a feature and another feature row', function() {
      var all = queryTestFeatureDao.queryForAll();
      var featureRow = queryTestFeatureDao.getFeatureRow(all[0]);
      var relatedFeatureRow = queryTestFeatureDao.getFeatureRow(all[1]);

      return queryTestFeatureDao.linkFeatureRow(featureRow, relatedFeatureRow)
      .then(function() {
        var linkedFeatures = queryTestFeatureDao.getLinkedFeatures(featureRow);
        linkedFeatures.length.should.be.equal(1);
        linkedFeatures[0].id.should.be.equal(relatedFeatureRow.getId());
      });
    });
  });

});

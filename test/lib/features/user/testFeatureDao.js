import { default as testSetup } from '../../../testSetup'

var FeatureColumn = require('../../../../lib/features/user/featureColumn').FeatureColumn
  , GeoPackageDataType = require('../../../../lib/db/geoPackageDataType').GeoPackageDataType
  , BoundingBox = require('../../../../lib/boundingBox').BoundingBox
  , GeometryData = require('../../../../lib/geom/geoPackageGeometryData').GeoPackageGeometryData
  , GeometryType = require('@ngageoint/simple-features-js').GeometryType
  , SetupFeatureTable = require('../../../setupFeatureTable')
  , RelatedTablesUtils = require('../../extension/relatedTables/relatedTablesUtils')
  , MediaTable = require('../../../../lib/extension/related/media/mediaTable').MediaTable
  , FeatureConverter = require('@ngageoint/simple-features-geojson-js').FeatureConverter
  , SimpleAttributesTable = require('../../../../lib/extension/related/simple/simpleAttributesTable').SimpleAttributesTable
  , path = require('path')
  , should = require('chai').should();

describe('FeatureDao tests', function() {

  describe('Non indexed test', function() {
    var geoPackage;

    var filename;
    beforeEach('create the GeoPackage connection', async function() {
      var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'rivers.gpkg');
      // @ts-ignore
      let result = await copyAndOpenGeopackage(originalFilename);
      filename = result.path;
      geoPackage = result.geoPackage;
    });

    afterEach('close the geoPackage connection', async function() {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    });

    it('should read the geometry', function() {
      var featureDao = geoPackage.getFeatureDao('FEATURESriversds');
      var each = featureDao.queryForEach();
      // @ts-ignore
      // @ts-ignore
      var srs = featureDao.srs;
      for (var row of each) {
        var currentRow = featureDao.getRow(row);
        var geometry = currentRow.geometry;
        should.exist(geometry);
      }
    });

    it('should query for a row with property_1 equal to Gila', function() {
      var featureDao = geoPackage.getFeatureDao('FEATURESriversds');

      for (var row of featureDao.queryForEach('property_1', 'Gila')) {
        row.property_1.should.be.equal('Gila');
      }
    });
  });

  describe('Indexed test', function() {
    var geoPackage;
    var featureDao;

    var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'rivers_indexed.gpkg');
    var filename;

    beforeEach('should open the geoPackage', async function() {
      // @ts-ignore
      let result = await copyAndOpenGeopackage(originalFilename);
      filename = result.path;
      geoPackage = result.geoPackage;
      featureDao = geoPackage.getFeatureDao('rivers');
    });

    afterEach('should close the geoPackage', async function() {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    });

    it('should query for indexed geometries', function() {
      var count = 0;
      var bbox = new BoundingBox(-13189576.119, -13126488.564, 6637372.21, 6607360.178);
      var iterator = featureDao.queryIndexedFeaturesWithWebMercatorBoundingBox(bbox);
      for (var row of iterator) {
        count++;
        row.values.property_1.should.be.equal('Columbia');
        should.exist(row.getValue('geom'));
        should.exist(row.getValue('id'));
        should.exist(row.getValue('property_0'));
        should.exist(row.getValue('property_1'));
        should.exist(row.getValue('property_2'));
      }
      count.should.be.equal(1);
    });
  });

  describe('Query For Shapes', function() {

    var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'test_shapes_two_points.gpkg');
    var filename;
    var geoPackage;

    beforeEach('should copy the geoPackage', async function() {
      filename = path.join(__dirname, '..', '..', '..', 'fixtures', 'tmp', testSetup.createTempName());
      // @ts-ignore
      let result = await copyAndOpenGeopackage(originalFilename);
      filename = result.path;
      geoPackage = result.geoPackage;
    });

    afterEach('should close the geoPackage', async function() {
      await testSetup.deleteGeoPackage(filename);
    });

    it('should query for GeoJSON features', function() {
      var bb = new BoundingBox(-.4, -.6, 2.4, 2.6);
      const features = geoPackage.queryForGeoJSONFeaturesInTable('QueryTest', bb);
      features[0].properties.name.should.be.equal('box1');
    });

    it('should iterate GeoJSON features', async function() {
      var count = 0;
      var bb = new BoundingBox(-.4, -.6, 2.4, 2.6);
      const iterator = geoPackage.iterateGeoJSONFeatures('QueryTest', bb)
      for (var feature of iterator) {
        feature.properties.name.should.be.equal('box1');
        count++;
      }
      count.should.be.equal(1);
    });
  });

  describe('geometry collection test', function() {
    var geoPackage;
    var featureDao;

    var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'geometrycollection.gpkg');
    var filename;

    beforeEach('should open the geoPackage', async function() {
      // @ts-ignore
      let result = await copyAndOpenGeopackage(originalFilename);
      filename = result.path;
      geoPackage = result.geoPackage;
      featureDao = geoPackage.getFeatureDao('test');
    });

    afterEach('should close the geoPackage', async function() {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    });

    it('should return feature when bounds overlap a feature within geometry collection', function() {
      var bb = new BoundingBox(-34.98046875, -15.1171875, 42.293564192170095, 55.3791104480105);
      var iterator = featureDao.queryForGeoJSONIndexedFeaturesWithBoundingBox(bb);
      const features = [];
      for (const feature of iterator) {
        features.push(feature);
      }
      features.length.should.be.equal(1);
    });

    it('should return no features when bounds do not overlap a feature within geometry collection', function() {
      var bb = new BoundingBox(-70.48828125, -52.3828125, -7.01366792756663, 9.44906182688142);
      var iterator = featureDao.queryForGeoJSONIndexedFeaturesWithBoundingBox(bb);
      const features = [];
      for (const feature of iterator) {
        features.push(feature);
      }
      features.length.should.be.equal(0);
    });
  });

  describe('multi point test', function() {
    var geoPackage;
    var featureDao;

    var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'multipoint.gpkg');
    var filename;

    beforeEach('should open the geoPackage', async function() {
      // @ts-ignore
      let result = await copyAndOpenGeopackage(originalFilename);
      filename = result.path;
      geoPackage = result.geoPackage;
      featureDao = geoPackage.getFeatureDao('multipoint');
    });

    afterEach('should close the geoPackage', async function() {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    });

    it('should return feature when bounds overlap a feature within multipoint', function() {
      var bb = new BoundingBox(45.52734375, 64.3359375, 53.4357192066942, 61.938950426660604);
      var iterator = featureDao.queryForGeoJSONIndexedFeaturesWithBoundingBox(bb);
      const features = [];
      for (const feature of iterator) {
        features.push(feature);
      }
      features.length.should.be.equal(1);
    });

    it('should return no features when bounds do not overlap a feature within multipoint', function() {
      var bb = new BoundingBox(69.9609375, 85.4296875, 31.50362930577303, 40.0);
      var iterator = featureDao.queryForGeoJSONIndexedFeaturesWithBoundingBox(bb);
      const features = [];
      for (const feature of iterator) {
        features.push(feature);
      }
      features.length.should.be.equal(0);
    });
  });

  describe('rivers 2 test', function() {
    var geoPackage;
    var featureDao;

    var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'rivers2.gpkg');
    var filename;

    beforeEach('should open the geoPackage', async function() {
      // @ts-ignore
      let result = await copyAndOpenGeopackage(originalFilename);
      filename = result.path;
      geoPackage = result.geoPackage;
      featureDao = geoPackage.getFeatureDao('FEATURESriversds');
    });

    afterEach('should close the geoPackage', async function() {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    });

    it('should query for rivers and calculate distance from a center point', function() {
      var pointToLineDistance = require('@turf/point-to-line-distance').default;
      var polygonToLine = require('@turf/polygon-to-line').default;
      var booleanPointInPolygon = require('@turf/boolean-point-in-polygon').default;
      // @ts-ignore
      // @ts-ignore
      var pointDistance = require('@turf/distance').default;

      var bb = new BoundingBox(-179, 0, 0, 80);
      var centerPoint = helpers.point([ -105.92193603515625, 34.406906587428736 ]);


      var iterator = featureDao.getIndexManager().queryWithBoundingBox(false, undefined, bb);
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
          distance = pointToLineDistance(centerPoint, geometry);
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
            // @ts-ignore
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
    var geoPackage;
    var queryTestFeatureDao;
    var testPath = path.join(__dirname, '..', '..', '..', 'fixtures', 'tmp');
    var testGeoPackage;
    var tileBuffer;

    afterEach('should delete the geoPackage', async function() {
      try {
        geoPackage.close();
      } catch (e) {}
      await testSetup.deleteGeoPackage(testGeoPackage);
    });

    beforeEach('get the tile buffer', async function() {
      // @ts-ignore
      tileBuffer = await loadTile(path.join(__dirname, '..', '..', '..', 'fixtures', 'tiles', '0', '0', '0.png'));
    });

    beforeEach('should create the GeoPackage', async function() {
      testGeoPackage = path.join(testPath, testSetup.createTempName());
      geoPackage = await testSetup.createGeoPackage(testGeoPackage)

      // @ts-ignore
      var geometryColumns = SetupFeatureTable.buildGeometryColumns('QueryTest', 'geom', GeometryType.GEOMETRY);

      var columns = [];

      columns.push(FeatureColumn.createPrimaryKeyColumn(0, 'id'));
      columns.push(FeatureColumn.createGeometryColumn(1, 'geom', GeometryType.GEOMETRY, false, null));
      columns.push(FeatureColumn.createColumn(2, 'name', GeoPackageDataType.TEXT, false, ""));
      columns.push(FeatureColumn.createColumn(3, '_feature_id', GeoPackageDataType.TEXT, false, ""));
      columns.push(FeatureColumn.createColumn(4, '_properties_id', GeoPackageDataType.TEXT, false, ""));

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
        var srs = featureDao.srs;
        var featureRow = featureDao.newRow();
        var geometryData = new GeometryData();
        geometryData.setSrsId(srs.srs_id);
        var geometry = FeatureConverter.toSimpleFeaturesGeometry(geoJson);
        geometryData.setGeometry(geometry);
        featureRow.geometry = geometryData;
        featureRow.setValue('name', name);
        featureRow.setValue('_feature_id', name);
        featureRow.setValue('_properties_id', 'properties' + name);
        return featureDao.create(featureRow);
      };
      // create the features
      // Two intersecting boxes with a line going through the intersection and a point on the line
      // ---------- / 3
      // | 1  ____|/_____
      // |    |  /|  2  |
      // |____|_/_|     |
      //      |/        |
      //      /_________|
      //     /
      geoPackage.createFeatureTable('QueryTest', geometryColumns, columns);
      var featureDao = geoPackage.getFeatureDao('QueryTest');
      queryTestFeatureDao = featureDao;
      createRow(box1, 'box1', featureDao);
      createRow(box2, 'box2', featureDao);
      createRow(line, 'line', featureDao);
      createRow(point, 'point', featureDao);
      createRow(point2, 'point2', featureDao);
      await featureDao.featureTableIndex.index();
    });

    it('should update a shape', function() {
      var line;
      for (var feature of queryTestFeatureDao.queryForEach('_feature_id', 'line')) {
        line = queryTestFeatureDao.getRow(feature);
      }
      line.setValue('name', 'UpdatedLine');
      var newLine;
      queryTestFeatureDao.update(line);
      for (var feature of queryTestFeatureDao.queryForEach('_feature_id', 'line')) {
        newLine = queryTestFeatureDao.getRow(feature);
      }
      newLine.getValue('name').should.be.equal('UpdatedLine');
    });

    it('should count by a field', function(){
      var count = queryTestFeatureDao.count('name', 'line');
      count.should.be.equal(1);
    });

    it('should query for _feature_id', function() {
      // @ts-ignore
      var row = geoPackage.getFeature('QueryTest', 'line');
      // @ts-ignore
      row.properties.name.should.be.equal('line');
    });

    it('should query for _properties_id', function() {
      // @ts-ignore
      var row = geoPackage.getFeature('QueryTest', 'propertiesline');
      // @ts-ignore
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
      // @ts-ignore
      // @ts-ignore
      var bb = new BoundingBox(-.4, -.6, 2.4, 2.6);
      return geoPackage.getFeaturesInBoundingBox('QueryTest', -.4, -.6, 2.4, 2.6)
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
      // @ts-ignore
      // @ts-ignore
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
        var geometry = row.geometry.toGeoJSON();

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
          // @ts-ignore
          var distance = pointToLineDistance(centerPoint, geometry);
          if (distance < closestDistance) {
            closest = row;
            closestDistance = distance;
          } else if (distance == closestDistance && closest.type != 'Point') {
            closest = row;
            closestDistance = distance;
          }
        } else if (geometry.type == 'Polygon') {
          // @ts-ignore
          if (booleanPointInPolygon(centerPoint, geometry)) {
            if (closestDistance != 0) {
              closest = row;
              closestDistance = 0;
            }
          } else {
            var line = polygonToLine(geometry);
            // @ts-ignore
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
      return geoPackage.getFeatureTileFromXYZ('QueryTest', 1029, 1013, 11, 256, 256)
      .then(function(data) {
        console.timeEnd('generating indexed tile');
        should.exist(data);
      });
    });

    it('should get the x: 1026, y: 1015, z: 11 tile from the GeoPackage api in a reasonable amount of time', function() {
      this.timeout(5000);
      console.time('generating indexed tile');
      return geoPackage.getFeatureTileFromXYZ('QueryTest', 1026, 1015, 11, 256, 256)
      .then(function(data) {
        console.timeEnd('generating indexed tile');
        should.exist(data);
      });
    });

    it('should get the x: 64, y: 63, z: 7 features as geojson', function() {
      this.timeout(3000);
      console.time('generating indexed tile');
      return geoPackage.getGeoJSONFeaturesInTile('QueryTest', 64, 63, 7)
      .then(function(geoJSON) {
        console.timeEnd('generating indexed tile');
        should.exist(geoJSON);
        geoJSON.length.should.be.equal(5);
      });
    });

    it('should get the x: 64, y: 63, z: 7 tile from the GeoPackage api in a reasonable amount of time', function() {
      this.timeout(3000);
      console.time('generating indexed tile');
      return geoPackage.getFeatureTileFromXYZ('QueryTest', 64, 63, 7, 256, 256)
      .then(function(data) {
        console.timeEnd('generating indexed tile');
        should.exist(data);
      });
    });

    it('should create a media relationship between a feature and a media row', function() {
      var rte = geoPackage.relatedTablesExtension;
      var additionalMediaColumns = RelatedTablesUtils.createAdditionalUserColumns(MediaTable.numRequiredColumns());
      var mediaTable = MediaTable.create('media_table', additionalMediaColumns);
      rte.createRelatedTable(mediaTable);

      var mediaDao = rte.getMediaDao(mediaTable);
      should.exist(mediaDao);
      mediaTable = mediaDao.table;
      should.exist(mediaTable);

      // Create media row
      var contentType = 'image/png';
      var mediaRow = mediaDao.newRow();
      mediaRow.data = tileBuffer;
      mediaRow.contentType = contentType;
      RelatedTablesUtils.populateRow(mediaTable, mediaRow, MediaTable.requiredColumns());
      var mediaRowId = mediaDao.create(mediaRow);
      mediaRowId.should.be.greaterThan(0);
      mediaRow = mediaDao.queryForId(mediaRowId);

      var featureRow = queryTestFeatureDao.getRow(queryTestFeatureDao.queryForAll()[0]);
      queryTestFeatureDao.linkMediaRow(featureRow, mediaRow);
      var linkedMedia = queryTestFeatureDao.getLinkedMedia(featureRow);
      linkedMedia.length.should.be.equal(1);
      // @ts-ignore
      linkedMedia[0].id.should.be.equal(mediaRowId);
    });

    it('should create a simple attributes relationship between a feature and a simple attributes row', function() {
      var rte = geoPackage.relatedTablesExtension;
      var simpleUserColumns = RelatedTablesUtils.createSimpleUserColumns(SimpleAttributesTable.numRequiredColumns(), true);
      var simpleTable = SimpleAttributesTable.create('simple_table', simpleUserColumns);
      rte.createRelatedTable(simpleTable);

      var simpleDao = rte.getSimpleAttributesDao(simpleTable);
      should.exist(simpleDao);
      simpleTable = simpleDao.table;
      should.exist(simpleTable);

      // Create simple attributes row
      var simpleRow = simpleDao.newRow();
      RelatedTablesUtils.populateRow(simpleTable, simpleRow, SimpleAttributesTable.requiredColumns());
      var simpleRowId = simpleDao.create(simpleRow);
      simpleRowId.should.be.greaterThan(0);
      simpleRow = simpleDao.queryForId(simpleRowId);

      var featureRow = queryTestFeatureDao.getRow(queryTestFeatureDao.queryForAll()[0]);
      queryTestFeatureDao.linkSimpleAttributesRow(featureRow, simpleRow);
      var linkedAttributes = queryTestFeatureDao.getLinkedSimpleAttributes(featureRow);
      linkedAttributes.length.should.be.equal(1);
      // @ts-ignore
      linkedAttributes[0].id.should.be.equal(simpleRowId);
    });

    it('should create a feature relationship between a feature and another feature row', function() {
      var all = queryTestFeatureDao.queryForAll();
      var featureRow = queryTestFeatureDao.getRow(all[0]);
      var relatedFeatureRow = queryTestFeatureDao.getRow(all[1]);

      queryTestFeatureDao.linkFeatureRow(featureRow, relatedFeatureRow);
      var linkedFeatures = queryTestFeatureDao.getLinkedFeatures(featureRow);
      linkedFeatures.length.should.be.equal(1);
      linkedFeatures[0].id.should.be.equal(relatedFeatureRow.id);
    });
  });

});

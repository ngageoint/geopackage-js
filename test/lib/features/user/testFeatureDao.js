import { default as testSetup } from '../../../testSetup';
import { FeatureIndexManager } from '../../../../lib/features/index/featureIndexManager';
import { TileBoundingBoxUtils } from '../../../../lib/tiles/tileBoundingBoxUtils';
import { FeatureTableMetadata } from '../../../../lib/features/user/featureTableMetadata';
import { FeatureIndexType } from '../../../../lib/features/index/featureIndexType';
import { MediaTableMetadata } from '../../../../lib/extension/related/media/mediaTableMetadata';

var FeatureColumn = require('../../../../lib/features/user/featureColumn').FeatureColumn,
  GeoPackageDataType = require('../../../../lib/db/geoPackageDataType').GeoPackageDataType,
  BoundingBox = require('../../../../lib/boundingBox').BoundingBox,
  GeometryData = require('../../../../lib/geom/geoPackageGeometryData').GeoPackageGeometryData,
  GeometryType = require('@ngageoint/simple-features-js').GeometryType,
  SetupFeatureTable = require('../../../setupFeatureTable'),
  RelatedTablesUtils = require('../../extension/relatedTables/relatedTablesUtils'),
  MediaTable = require('../../../../lib/extension/related/media/mediaTable').MediaTable,
  FeatureConverter = require('@ngageoint/simple-features-geojson-js').FeatureConverter,
  SimpleAttributesTable =
    require('../../../../lib/extension/related/simple/simpleAttributesTable').SimpleAttributesTable,
  path = require('path'),
  should = require('chai').should();

describe('FeatureDao tests', function () {
  describe('Non indexed test', function () {
    var geoPackage;

    var filename;
    beforeEach('create the GeoPackage connection', async function () {
      var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'rivers.gpkg');

      let result = await copyAndOpenGeopackage(originalFilename);
      filename = result.path;
      geoPackage = result.geoPackage;
    });

    afterEach('close the geoPackage connection', async function () {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    });

    it('should read the geometry', function () {
      var featureDao = geoPackage.getFeatureDao('FEATURESriversds');
      var resultSet = featureDao.queryForAll();
      while (resultSet.moveToNext()) {
        var currentRow = resultSet.getRow();
        var geometry = currentRow.getGeometry();
        should.exist(geometry);
      }
      resultSet.close();
    });

    it('should query for a row with property_1 equal to Gila', function () {
      var featureDao = geoPackage.getFeatureDao('FEATURESriversds');
      var resultSet = featureDao.queryForEq('property_1', 'Gila');
      while (resultSet.moveToNext()) {
        resultSet.getValueForColumnName('property_1').should.be.equal('Gila');
      }
    });
  });

  describe('Indexed test', function () {
    var geoPackage;

    var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'rivers_indexed.gpkg');
    var filename;

    beforeEach('should open the geoPackage', async function () {
      let result = await copyAndOpenGeopackage(originalFilename);
      filename = result.path;
      geoPackage = result.geoPackage;
    });

    afterEach('should close the geoPackage', async function () {
      try {
        geoPackage.close();
        await testSetup.deleteGeoPackage(filename);
      } catch (e) {
        console.error(e);
      }
    });

    it('should query for indexed geometries', function () {
      var count = 0;
      // this bounding box only intersects a single feature
      var bbox = TileBoundingBoxUtils.getWebMercatorBoundingBox(42, 89, 8);
      var indexManager = new FeatureIndexManager(geoPackage, 'rivers');
      indexManager.setContinueOnError(true);
      var featureIndexResults = indexManager.queryWithBoundingBox(bbox);
      try {
        for (const row of featureIndexResults) {
          count++;
          row.getValue('property_1').should.be.equal('Columbia');
          should.exist(row.getValue('geom'));
          should.exist(row.getValue('id'));
          should.exist(row.getValue('property_0'));
          should.exist(row.getValue('property_1'));
          should.exist(row.getValue('property_2'));
        }
      } finally {
        featureIndexResults.close();
      }
      count.should.be.equal(1);
    });
  });

  describe('Query For Shapes', function () {
    var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'test_shapes_two_points.gpkg');
    var filename;
    var geoPackage;

    beforeEach('should copy the geoPackage', async function () {
      filename = path.join(__dirname, '..', '..', '..', 'fixtures', 'tmp', testSetup.createTempName());

      let result = await copyAndOpenGeopackage(originalFilename);
      filename = result.path;
      geoPackage = result.geoPackage;
    });

    afterEach('should close the geoPackage', async function () {
      await testSetup.deleteGeoPackage(filename);
    });

    it('should query for GeoJSON features', function () {
      let bb = new BoundingBox(-0.4, 2.4, -0.6, 2.6);
      let geoJSONResultSet = geoPackage.queryForGeoJSONFeatures('QueryTest', bb);
      let features = [];
      for (const feature of geoJSONResultSet) {
        features.push(feature);
      }
      geoJSONResultSet.close();
      features[0].properties.name.should.be.equal('box1');

      bb = new BoundingBox(1.5, 2.5, 2, 2.7);
      geoJSONResultSet = geoPackage.queryForGeoJSONFeatures('QueryTest', bb);
      features = [];
      for (const feature of geoJSONResultSet) {
        features.push(feature);
      }
      geoJSONResultSet.close();
      features[0].properties.name.should.be.equal('line');
    });
  });

  describe('geometry collection test', function () {
    var geoPackage;

    var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'geometrycollection.gpkg');
    var filename;

    beforeEach('should open the geoPackage', async function () {
      let result = await copyAndOpenGeopackage(originalFilename);
      filename = result.path;
      geoPackage = result.geoPackage;
    });

    afterEach('should close the geoPackage', async function () {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    });

    it('should return feature when bounds overlap a feature within geometry collection', function () {
      try {
        var bb = new BoundingBox(-34.98046875, 42.293564192170095, -15.1171875, 55.3791104480105);
        const features = [];
        const geoJSONResultSet = geoPackage.queryForGeoJSONFeatures('test', bb);
        for (const feature of geoJSONResultSet) {
          features.push(feature);
        }
        features.length.should.be.equal(1);
      } catch (e) {
        console.error(e);
      }
    });
  });

  describe('multi point test', function () {
    var geoPackage;

    var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'multipoint.gpkg');
    var filename;

    beforeEach('should open the geoPackage', async function () {
      let result = await copyAndOpenGeopackage(originalFilename);
      filename = result.path;
      geoPackage = result.geoPackage;
    });

    afterEach('should close the geoPackage', async function () {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    });

    it('should return feature when bounds overlap a feature within multipoint', function () {
      var bb = new BoundingBox(45.52734375, 53.4357192066942, 64.3359375, 61.938950426660604);
      const features = [];
      const geoJSONResultSet = geoPackage.queryForGeoJSONFeatures('multipoint', bb);
      for (const feature of geoJSONResultSet) {
        features.push(feature);
      }
      features.length.should.be.equal(1);
    });
  });

  describe('Query tests', function () {
    var geoPackage;
    var queryTestFeatureDao;
    var testPath = path.join(__dirname, '..', '..', '..', 'fixtures', 'tmp');
    var testGeoPackage;
    var tileBuffer;

    afterEach('should delete the geoPackage', async function () {
      try {
        geoPackage.close();
      } catch (e) {}
      await testSetup.deleteGeoPackage(testGeoPackage);
    });

    beforeEach('get the tile buffer', async function () {
      tileBuffer = await loadTile(path.join(__dirname, '..', '..', '..', 'fixtures', 'tiles', '0', '0', '0.png'));
    });

    beforeEach('should create the GeoPackage', async function () {
      try {
        testGeoPackage = path.join(testPath, testSetup.createTempName());
        geoPackage = await testSetup.createGeoPackage(testGeoPackage);

        var geometryColumns = SetupFeatureTable.buildGeometryColumns('QueryTest', 'geom', GeometryType.GEOMETRY);

        var columns = [];
        columns.push(FeatureColumn.createColumn('name', GeoPackageDataType.TEXT, false, ''));
        columns.push(FeatureColumn.createColumn('_feature_id', GeoPackageDataType.TEXT, false, ''));
        columns.push(FeatureColumn.createColumn('_properties_id', GeoPackageDataType.TEXT, false, ''));

        var box1 = {
          type: 'Polygon',
          coordinates: [
            [
              [-1, 1],
              [1, 1],
              [1, 3],
              [-1, 3],
              [-1, 1],
            ],
          ],
        };

        var box2 = {
          type: 'Polygon',
          coordinates: [
            [
              [0, 0],
              [2, 0],
              [2, 2],
              [0, 2],
              [0, 0],
            ],
          ],
        };

        var line = {
          type: 'LineString',
          coordinates: [
            [2, 3],
            [-1, 0],
          ],
        };

        var point = {
          type: 'Point',
          coordinates: [0.5, 1.5],
        };

        var point2 = {
          type: 'Point',
          coordinates: [1.5, 0.5],
        };

        var createRow = function (geoJson, name, featureDao) {
          var srs = featureDao.getSrs();
          var featureRow = featureDao.newRow();
          var geometryData = new GeometryData();
          geometryData.setSrsId(srs.getSrsId());
          var geometry = FeatureConverter.toSimpleFeaturesGeometry({
            type: 'Feature',
            geometry: geoJson,
            properties: {},
          });
          geometryData.setGeometry(geometry);
          featureRow.setGeometry(geometryData);
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
        geoPackage.createFeatureTableWithMetadata(FeatureTableMetadata.create(geometryColumns, columns));
        var featureDao = geoPackage.getFeatureDao('QueryTest');
        queryTestFeatureDao = featureDao;
        createRow(box1, 'box1', featureDao);
        createRow(box2, 'box2', featureDao);
        createRow(line, 'line', featureDao);
        createRow(point, 'point', featureDao);
        createRow(point2, 'point2', featureDao);

        const featureIndexManager = geoPackage.getFeatureIndexManager('QueryTest');
        featureIndexManager.setIndexLocation(FeatureIndexType.RTREE);
        featureIndexManager.index();
      } catch (e) {
        console.error(e);
      }
    });

    it('should update a shape', function () {
      try {
        let resultSet = queryTestFeatureDao.queryForEq('_feature_id', 'line');
        resultSet.moveToNext();
        let line = resultSet.getRow();
        resultSet.close();
        line.setValue('name', 'UpdatedLine');
        queryTestFeatureDao.update(line);
        resultSet = queryTestFeatureDao.queryForEq('_feature_id', 'line');
        resultSet.moveToNext();
        line = resultSet.getRow();
        resultSet.close();
        line.getValue('name').should.be.equal('UpdatedLine');
      } catch (e) {
        console.error(e);
      }
    });

    it('should count by a field', function () {
      var count = queryTestFeatureDao.countForEq('name', 'line');
      count.should.be.equal(1);
    });

    it('should query for _feature_id', function () {
      var row = geoPackage.getFeatureAsGeoJSON('QueryTest', 'line');

      row.properties.name.should.be.equal('line');
    });

    it('should query for _properties_id', function () {
      var row = geoPackage.getFeatureAsGeoJSON('QueryTest', 'propertiesline');

      row.properties.name.should.be.equal('line');
    });

    it('should query for the bounding box', function () {
      var bb = new BoundingBox(-0.4, 2.4, -0.6, 2.6);
      const indexManager = geoPackage.getFeatureIndexManager(queryTestFeatureDao);
      var geoJSONResultSet = indexManager.queryForGeoJSONFeatures(bb);
      for (const feature of geoJSONResultSet) {
        if (feature.geometry.type === 'Polygon') {
          feature.properties.name.should.be.equal('box1');
        } else if (feature.geometry.type === 'LineString') {
          feature.properties.name.should.be.equal('line');
        }
      }
      geoJSONResultSet.close();
    });

    it('should get features in the bounding box', function () {
      const resultSet = geoPackage.getFeaturesInBoundingBox('QueryTest', -0.4, 2.4, -0.6, 2.6);
      for (const feature of resultSet) {
        if (feature.getGeometryType() === GeometryType.POLYGON) {
          feature.getValue('name').should.be.equal('box1');
        } else if (feature.getGeometryType() === GeometryType.LINESTRING) {
          feature.getValue('name').should.be.equal('line');
        }
      }
      resultSet.close();
    });

    it('should get the x: 1029, y: 1013, z: 11 tile from the GeoPackage api in a reasonable amount of time', function () {
      this.timeout(5000);
      console.time('generating indexed tile');
      return geoPackage
        .getFeatureTileFromXYZ('QueryTest', 1029, 1013, 11, 256, 256)
        .then((data) => {
          console.timeEnd('generating indexed tile');
          should.exist(data);
        })
        .catch((e) => console.error(e));
    });

    it('should get the x: 1026, y: 1015, z: 11 tile from the GeoPackage api in a reasonable amount of time', function () {
      this.timeout(5000);
      console.time('generating indexed tile');
      return geoPackage.getFeatureTileFromXYZ('QueryTest', 1026, 1015, 11, 256, 256).then(function (data) {
        console.timeEnd('generating indexed tile');
        should.exist(data);
      });
    });

    it('should get the x: 64, y: 63, z: 7 features as geojson', function () {
      this.timeout(3000);
      console.time('generating indexed tile');
      const geoJSONResultSet = geoPackage.getGeoJSONFeaturesInTile('QueryTest', 64, 63, 7);
      const features = [];
      for (const feature of geoJSONResultSet) {
        features.push(feature);
      }
      geoJSONResultSet.close();
      console.timeEnd('generating indexed tile');
      features.length.should.be.equal(5);
    });

    it('should get the x: 64, y: 63, z: 7 tile from the GeoPackage api in a reasonable amount of time', function () {
      this.timeout(3000);
      console.time('generating indexed tile');
      return geoPackage
        .getFeatureTileFromXYZ('QueryTest', 64, 63, 7, 256, 256)
        .then((data) => {
          console.timeEnd('generating indexed tile');
          should.exist(data);
        })
        .catch((e) => {
          console.error(e);
        });
    });

    it('should create a media relationship between a feature and a media row', function () {
      var rte = geoPackage.getRelatedTablesExtension();
      var additionalMediaColumns = RelatedTablesUtils.createAdditionalUserColumns();
      var mediaTable = MediaTable.create(MediaTableMetadata.create('media_table', additionalMediaColumns));
      rte.createRelatedTable(mediaTable);

      var mediaDao = rte.getMediaDao('media_table');
      should.exist(mediaDao);
      mediaTable = mediaDao.getTable();
      should.exist(mediaTable);

      // Create media row
      const contentType = 'image/png';
      var mediaRow = mediaDao.newRow();
      mediaRow.setData(tileBuffer);
      mediaRow.setContentType(contentType);
      RelatedTablesUtils.populateUserRow(mediaTable, mediaRow, MediaTable.requiredColumns());
      const mediaRowId = mediaDao.create(mediaRow);
      mediaRowId.should.be.greaterThan(0);
      mediaRow = mediaDao.queryForIdRow(mediaRowId);

      const resultSet = queryTestFeatureDao.query();
      const featureRow = resultSet.next().value;
      resultSet.close();

      geoPackage.linkMedia(queryTestFeatureDao.getTableName(), featureRow.getId(), 'media_table', mediaRow.getId());
      const linkedMedia = geoPackage.getLinkedMedia(queryTestFeatureDao.getTableName(), featureRow.getId());
      linkedMedia.length.should.be.equal(1);

      linkedMedia[0].getId().should.be.equal(mediaRowId);
    });

    it('should create a simple attributes relationship between a feature and a simple attributes row', function () {
      var rte = geoPackage.getRelatedTablesExtension();
      var simpleUserColumns = RelatedTablesUtils.createSimpleUserColumns(
        SimpleAttributesTable.numRequiredColumns(),
        true,
      );
      var simpleTable = SimpleAttributesTable.create('simple_table', simpleUserColumns);
      rte.createRelatedTable(simpleTable);

      var simpleDao = rte.getSimpleAttributesDao(simpleTable.getTableName());
      should.exist(simpleDao);
      simpleTable = simpleDao.getTable();
      should.exist(simpleTable);

      // Create simple attributes row
      var simpleRow = simpleDao.newRow();
      RelatedTablesUtils.populateUserRow(simpleTable, simpleRow, SimpleAttributesTable.requiredColumns());
      var simpleRowId = simpleDao.create(simpleRow);
      simpleRowId.should.be.greaterThan(0);
      simpleRow = simpleDao.queryForIdRow(simpleRowId);

      const resultSet = queryTestFeatureDao.query();
      const featureRow = resultSet.next().value;
      resultSet.close();
      geoPackage.linkSimpleAttributes(
        queryTestFeatureDao.getTableName(),
        featureRow.getId(),
        'simple_table',
        simpleRowId,
      );

      var linkedAttributes = geoPackage.getLinkedSimpleAttributes(
        queryTestFeatureDao.getTableName(),
        featureRow.getId(),
      );
      linkedAttributes.length.should.be.equal(1);

      linkedAttributes[0].getId().should.be.equal(simpleRowId);
    });

    it('should create a feature relationship between a feature and another feature row', function () {
      var all = queryTestFeatureDao.query();
      const featureRow = all.next().value;
      const relatedFeatureRow = all.next().value;
      all.close();

      geoPackage.linkFeature(
        queryTestFeatureDao.getTableName(),
        featureRow.getId(),
        queryTestFeatureDao.getTableName(),
        relatedFeatureRow.getId(),
      );
      var linkedFeatures = geoPackage.getLinkedFeatures(queryTestFeatureDao.getTableName(), featureRow.getId());
      linkedFeatures.length.should.be.equal(1);
      linkedFeatures[0].getId().should.be.equal(relatedFeatureRow.getId());
    });
  });
});

import { default as testSetup } from '../../../fixtures/testSetup'
import {RelatedTablesExtension} from '../../../../lib/extension/relatedTables'

var DataType = require('../../../../lib/db/dataTypes').DataTypes
  , Verification = require('../../../fixtures/verification')
  , ContentsDao = require('../../../../lib/core/contents/contentsDao').ContentsDao
  , UserMappingTable = require('../../../../lib/extension/relatedTables/userMappingTable').UserMappingTable
  , MediaTable = require('../../../../lib/extension/relatedTables/mediaTable').MediaTable
  , MediaRow = require('../../../../lib/extension/relatedTables/mediaRow').MediaRow
  // , testSetup = require('../../../fixtures/testSetup')
  , RelatedTablesUtils = require('./relatedTablesUtils')
  , BoundingBox = require('../../../../lib/boundingBox').BoundingBox
  , should = require('chai').should()
  , wkx = require('wkx')
  , path = require('path');

describe('Related Tile tests', function() {

  var testGeoPackage;
  var testPath = path.join(__dirname, '..', '..', '..', 'fixtures', 'tmp');
  var geoPackage;

  var tileBuffer;

  var filename;
  beforeEach('create the GeoPackage connection', async function() {

    var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'gdal_sample.gpkg');
    // @ts-ignore
    let result = await copyAndOpenGeopackage(originalFilename);
    filename = result.path;
    geoPackage = result.geopackage;
    // @ts-ignore
    tileBuffer = await loadTile(path.join(__dirname, '..', '..', '..', 'fixtures', 'tiles', '0', '0', '0.png'));
  });

  afterEach('delete the geopackage', async function() {
    await testSetup.deleteGeoPackage(filename);
  })

  var tileMatrixSet;
  var tileMatrixSetBoundingBox = new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.342789244, 20037508.342789244);
  var tileTableName = 'OSM';

  function validateContents(tileTable, contents) {
    should.exist(contents);
    should.exist(contents.data_type);
    'tiles'.should.be.equal(contents.data_type);
    tileTable.table_name.should.be.equal(contents.table_name);
    should.exist(contents.last_change);
  }

  function createTiles() {
    var contentsBoundingBox = new BoundingBox(-180, 180, -85.0511287798066, 85.0511287798066);
    var contentsSrsId = 4326;
    var tileMatrixSetSrsId = 3857;
    geoPackage.spatialReferenceSystemDao.createWebMercator();
    return geoPackage.createTileTableWithTableName(tileTableName, contentsBoundingBox, contentsSrsId, tileMatrixSetBoundingBox, tileMatrixSetSrsId)
      .then(function(result) {
        tileMatrixSet = result;
        Verification.verifyTileMatrixSet(geoPackage).should.be.equal(true);
        Verification.verifyContentsForTable(geoPackage, tileTableName).should.be.equal(true);
        Verification.verifyTableExists(geoPackage, tileTableName).should.be.equal(true);
        geoPackage.createStandardWebMercatorTileMatrix(tileMatrixSetBoundingBox, tileMatrixSet, 0, 1);

        var zooms = [0, 1];

        return zooms.reduce(function(zoomSequence, zoom) {
          return zoomSequence.then(function() {
            var xtiles = [];
            var tileCount = Math.pow(2,zoom);
            for (var i = 0; i < tileCount; i++) {
              xtiles.push(i);
            }
            return xtiles.reduce(function(xSequence, x) {
              return xSequence.then(function() {
                var ytiles = [];
                var tileCount = Math.pow(2,zoom);
                for (var i = 0; i < tileCount; i++) {
                  ytiles.push(i);
                }
                return ytiles.reduce(function(ySequence, y) {
                  return ySequence.then(function() {
                    return new Promise(async function(resolve, reject) {
                      // @ts-ignore
                      let image = await loadTile(path.join(__dirname, '..', '..', '..', 'fixtures', 'tiles', zoom.toString(), x.toString(), y.toString()+'.png'));
                      console.log('Adding tile z: %s x: %s y: %s to %s', zoom, x, y, tileTableName);
                      resolve(geoPackage.addTile(image, tileTableName, zoom, y, x));
                    });
                  });
                }, Promise.resolve());
              });
            }, Promise.resolve());
          });
        }, Promise.resolve());
      });
  }

  it('should create a tile relationship', function() {
    this.timeout(5000);

    return createTiles()
      .then(function() {
        var rte = geoPackage.relatedTablesExtension;
        rte.has().should.be.equal(false);

        var extendedRelationships = rte.getRelationships();
        extendedRelationships.length.should.be.equal(0);

        var baseTableName = geoPackage.getFeatureTables()[0];

        var tileDao = geoPackage.getTileDao(tileTableName);

        var tileTable = tileDao.table;

        var idColumn = tileTable.idColumn;
        should.exist(idColumn);

        var additionalMappingColumns = RelatedTablesUtils.createAdditionalUserColumns(UserMappingTable.numRequiredColumns());
        var mappingTableName = 'features_tiles';
        var userMappingTable = UserMappingTable.create(mappingTableName, additionalMappingColumns);
        rte.has(userMappingTable.table_name).should.be.equal(false);
        userMappingTable.columnNames.length.should.be.equal(UserMappingTable.numRequiredColumns() + additionalMappingColumns.length);

        var baseIdColumn = userMappingTable.baseIdColumn;
        should.exist(baseIdColumn);
        baseIdColumn.name.should.be.equal(UserMappingTable.COLUMN_BASE_ID);
        baseIdColumn.dataType.should.be.equal(DataType.INTEGER);
        baseIdColumn.notNull.should.be.equal(true);
        baseIdColumn.primaryKey.should.be.equal(false);

        var relatedIdColumn = userMappingTable.relatedIdColumn;
        should.exist(relatedIdColumn);
        relatedIdColumn.name.should.be.equal(UserMappingTable.COLUMN_RELATED_ID);
        relatedIdColumn.dataType.should.be.equal(DataType.INTEGER);
        relatedIdColumn.notNull.should.be.equal(true);
        relatedIdColumn.primaryKey.should.be.equal(false);
        rte.has(userMappingTable.table_name).should.be.equal(false);

        // Create the media table, content row, and relationship between the
  	  // feature table and media table

        var contentsDao = geoPackage.contentsDao;
        var contentsTables = contentsDao.getTables();
        var relationship = RelatedTablesExtension.RelationshipBuilder()
          .setBaseTableName(baseTableName)
          .setRelatedTableName(tileTableName)
          .setUserMappingTable(userMappingTable);

        return rte.addTilesRelationship(relationship)
          .then(function(extendedRelation) {
            validateContents(tileTable, contentsDao.queryForId(tileTableName));
            rte.has().should.be.equal(true);
            rte.has(userMappingTable.table_name).should.be.equal(true);
            should.exist(extendedRelation);
            var relationships = rte.getRelationships();
            relationships.length.should.be.equal(1);
            geoPackage.isTable(mappingTableName).should.be.equal(true);
            geoPackage.isTable(tileTableName).should.be.equal(true);
            contentsDao.getTables().indexOf(tileTableName).should.not.be.equal(-1);
            validateContents(tileTable, contentsDao.queryForId(tileTableName));
            'tiles'.should.be.equal(geoPackage.getTableType(tileTableName));
            geoPackage.isTableType('tiles', tileTableName);

            var featureDao = geoPackage.getFeatureDao(baseTableName);
            var allFeatures = featureDao.queryForAll();
            var featureIds = [];
            for (var i = 0; i < allFeatures.length; i++) {
              var row = featureDao.getRow(allFeatures[i]);
              featureIds.push(row.id);
            }

            var allTiles = tileDao.queryForAll();
            var tileIds = [];
            for (var i = 0; i < allTiles.length; i++) {
              var row = tileDao.getRow(allTiles[i]);
              tileIds.push(row.id);
            }

            // Insert user mapping rows between feature ids and media ids
            var userMappingDao = rte.getMappingDao(mappingTableName);
            for (var i = 0; i < 10; i++) {
              var userMappingRow = userMappingDao.newRow();
              userMappingRow.baseId = featureIds[Math.floor(Math.random() * featureIds.length)];
              userMappingRow.relatedId = tileIds[Math.floor(Math.random() * tileIds.length)];
              RelatedTablesUtils.populateRow(userMappingTable, userMappingRow, UserMappingTable.requiredColumns());
              var created = userMappingDao.create(userMappingRow);
              created.should.be.greaterThan(0);
            }

            userMappingDao.count().should.be.equal(10);

            // Validate the user mapping rows
            userMappingTable = userMappingDao.table;
            var mappingColumns = userMappingTable.columnNames;
            var userMappingRows = userMappingDao.queryForAll();
            var count = userMappingRows.length;
            count.should.be.equal(10);
            var manualCount = 0;

            for (var i = 0; i < count; i++) {
              var userMappingRow = userMappingRows[i];
              var row = userMappingDao.getUserMappingRow(userMappingRow);
              row.hasId().should.be.equal(false);
              featureIds.indexOf(row.baseId).should.be.not.equal(-1);
              tileIds.indexOf(row.relatedId).should.be.not.equal(-1);
              RelatedTablesUtils.validateUserRow(mappingColumns, row);
              RelatedTablesUtils.validateDublinCoreColumns(row);
              manualCount++;
            }

            manualCount.should.be.equal(count);

            var extendedRelationsDao = rte.extendedRelationDao;
            var featureBaseTableRelations = extendedRelationsDao.getBaseTableRelations(featureDao.table_name);
            var featureTableRelations = extendedRelationsDao.getTableRelations(featureDao.table_name);
            featureBaseTableRelations.length.should.be.equal(1);
            featureTableRelations.length.should.be.equal(1);
            featureBaseTableRelations[0].id.should.be.equal(featureTableRelations[0].id);
            extendedRelationsDao.getRelatedTableRelations(featureDao.table_name).length.should.be.equal(0);

            // Test the feature table relations
            for (var i = 0; i < featureBaseTableRelations.length; i++) {

              // Test the relation
              var featureRelation = featureBaseTableRelations[i];
              featureRelation.id.should.be.greaterThan(0);
              featureDao.table_name.should.be.equal(featureRelation.base_table_name);
              featureDao.getFeatureTable().pkColumn.name.should.be.equal(featureRelation.base_primary_column);
              tileDao.table_name.should.be.equal(featureRelation.related_table_name);
              tileDao.table.pkColumn.name.should.be.equal(featureRelation.related_primary_column);
              'tiles'.should.be.equal(featureRelation.relation_name);

              // test the user mappings from the relation
              var userMappingDao = rte.getMappingDao(featureRelation.mapping_table_name);
              var totalMappedCount = userMappingDao.count();
              var mappings = userMappingDao.queryForAll();
              for (var m = 0; m < mappings.length; m++) {
                var userMappingRow = userMappingDao.getUserMappingRow(mappings[i]);
                featureIds.indexOf(userMappingRow.baseId).should.not.be.equal(-1);
                tileIds.indexOf(userMappingRow.relatedId).should.not.be.equal(-1);
                RelatedTablesUtils.validateUserRow(mappingColumns, userMappingRow);
                RelatedTablesUtils.validateDublinCoreColumns(userMappingRow);
              }

              should.exist(tileTable);
              validateContents(tileTable, contentsDao.queryForId(tileTableName));

              var totalMapped = 0;

              // get and test the Media Rows mapped to each Feature Row
              var features = featureDao.queryForAll();
              for (var f = 0; f < features.length; f++) {
                var featureRow = featureDao.getRow(features[f]);
                var mappedIds = rte.getMappingsForBase(featureRelation, featureRow.id);
                var tileRows = tileDao.getRows(mappedIds);
                tileRows.length.should.be.equal(mappedIds.length);

                tileRows.forEach(function(row) {
                  var tileRow = tileDao.getRow(row);
                  tileRow.hasId().should.be.equal(true);
                  tileRow.id.should.be.greaterThan(0);
                  tileIds.indexOf(tileRow.id).should.not.be.equal(-1);
                  tileIds.indexOf(tileRow.id).should.not.be.equal(-1);
                });

                totalMapped += mappedIds.length;
              }
              totalMappedCount.should.be.equal(totalMapped);
            }

            // Get the relations starting from the media table
            var tileRelatedTableRelations = extendedRelationsDao.getRelatedTableRelations(tileTable.table_name);
            var tileTableRelations = extendedRelationsDao.getTableRelations(tileTable.table_name);

            tileRelatedTableRelations.length.should.be.equal(1);
            tileTableRelations.length.should.be.equal(1);
            tileRelatedTableRelations[0].id.should.be.equal(tileTableRelations[0].id);
            extendedRelationsDao.getBaseTableRelations(tileTable.table_name).length.should.be.equal(0);

            // Test the tile table relations
            tileRelatedTableRelations.forEach(function(tileRelation) {

              // Test the relation
              tileRelation.id.should.be.greaterThan(0);
              featureDao.table_name.should.be.equal(tileRelation.base_table_name);
              featureDao.getFeatureTable().pkColumn.name.should.be.equal(tileRelation.base_primary_column);
              tileDao.table_name.should.be.equal(tileRelation.related_table_name);
              tileDao.table.pkColumn.name.should.be.equal(tileRelation.related_primary_column);
              'tiles'.should.be.equal(tileRelation.relation_name);
              mappingTableName.should.be.equal(tileRelation.mapping_table_name);

              // Test the user mappings from the relation
              var userMappingDao = rte.getMappingDao(tileRelation);
              var totalMappedCount = userMappingDao.count();
              var mappings = userMappingDao.queryForAll();
              mappings.forEach(function(row) {
                var userMappingRow = userMappingDao.getUserMappingRow(row);
                featureIds.indexOf(userMappingRow.baseId).should.not.be.equal(-1);
                tileIds.indexOf(userMappingRow.relatedId).should.not.be.equal(-1);
                RelatedTablesUtils.validateUserRow(mappingColumns, userMappingRow);
                RelatedTablesUtils.validateDublinCoreColumns(userMappingRow);
              });

              // Get and test the feature DAO
              featureDao = geoPackage.getFeatureDao(featureDao.table_name);
              should.exist(featureDao);
              var featureTable = featureDao.getFeatureTable();
              should.exist(featureTable);
              var featureContents = featureDao.getContents();
              should.exist(featureContents);
              ContentsDao.GPKG_CDT_FEATURES_NAME.should.be.equal(featureContents.data_type);
              featureTable.table_name.should.be.equal(featureContents.table_name);
              should.exist(featureContents.last_change);

              var tiles = tileDao.queryForAll();
              var totalMapped = 0;
              tiles.forEach(function(row) {
                var tileRow = tileDao.getRow(row);
                var mappedIds = rte.getMappingsForRelated(tileRelation.mapping_table_name, tileRow.id);
                mappedIds.forEach(function(mappedId){
                  var featureRow = featureDao.queryForId(mappedId);
                  should.exist(featureRow);
                  featureRow.hasId().should.be.equal(true);
                  featureRow.id.should.be.greaterThan(0);
                  featureIds.indexOf(featureRow.id).should.not.equal(-1);
                  mappedIds.indexOf(featureRow.id).should.not.equal(-1);
                  if (featureRow.getValueWithColumnName(featureRow.geometryColumn.name)) {
                    var geometryData = featureRow.geometry;
                    should.exist(geometryData);
                    if (!geometryData.empty) {
                      should.exist(geometryData.geometry);
                    }
                  }
                });
                totalMapped += mappedIds.length;
              });

              totalMapped.should.be.equal(totalMappedCount);
            });

            // Delete a single mapping
            var countOfIds = userMappingDao.countByIds(userMappingRow);
            countOfIds.should.be.equal(userMappingDao.deleteByIds(userMappingRow));
            userMappingDao.count().should.be.equal(10-countOfIds);

            // Delete the relationship and user mapping table
            rte.removeRelationship(extendedRelation);
            rte.has(userMappingTable.table_name).should.be.equal(false);
            var relationships = rte.getRelationships();
            relationships.length.should.be.equal(0);
            geoPackage.isTable(mappingTableName).should.be.equal(false);

            // Delete the media table and contents row
            geoPackage.isTable(tileTable.table_name);
            should.exist(contentsDao.queryForId(tileTable.table_name));
            geoPackage.deleteTable(tileTable.table_name);
            geoPackage.isTable(tileTable.table_name).should.be.equal(false);
            should.exist(contentsDao.queryForId(tileTable.table_name));

            // Delete the related tables extension
            rte.removeExtension();
            rte.has().should.be.equal(false);
          });
      });

  });
});

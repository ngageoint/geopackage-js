import { GeoPackage as GeoPackageAPI } from '../../../..'
import { default as testSetup } from '../../../fixtures/testSetup'
import {RelatedTablesExtension} from '../../../../lib/extension/relatedTables'

var Verification = require('../../../fixtures/verification')
  , UserMappingTable = require('../../../../lib/extension/relatedTables/userMappingTable').UserMappingTable
  , SetupFeatureTable = require('../../../fixtures/setupFeatureTable')
  // , testSetup = require('../../../fixtures/testSetup')
  , RelatedTablesUtils = require('./relatedTablesUtils')
  , should = require('chai').should()
  , wkx = require('wkx')
  , path = require('path');

describe('Related Tables tests', function() {

  describe('Related Tables Read Tests', function() {
    var testGeoPackage;
    var testPath = path.join(__dirname, '..', '..', '..', 'fixtures', 'tmp');
    var geopackage;

    var geoPackage;

    var filename;
    beforeEach('create the GeoPackage connection', async function() {

      var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'rte.gpkg');
      // @ts-ignore
      let result = await copyAndOpenGeopackage(originalFilename);
      filename = result.path;
      geoPackage = result.geopackage;
    });

    afterEach('close the geopackage connection', async function() {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    });

    it('should read a relationship', function() {
      var rte = new RelatedTablesExtension(geoPackage);
      rte.has().should.be.equal(true);
      var relationships = rte.getRelationships();
      relationships.length.should.be.equal(1);

      for (var i = 0; i < relationships.length; i++) {
        var relationship = relationships[i];
        var baseDao = geoPackage.getFeatureDao(relationship.base_table_name);
        var features = baseDao.queryForAll();
        var baseIdMappings = {};
        for (var f = 0; f < features.length; f++) {
          var feature = features[f];
          var row = baseDao.getRow(feature);
          var relatedIds = rte.getMappingsForBase(relationship.mapping_table_name, row.getId());
          if (row.getId() === 1) {
            relatedIds.length.should.be.equal(2);
          } else if (row.getId() === 2) {
            relatedIds.length.should.be.equal(1);
          }
          baseIdMappings[row.getId()] = relatedIds;
        }

        var relatedIdMappings = {};
        var relatedDao = geoPackage.getAttributeDaoWithTableName(relationship.related_table_name);
        var attributes = relatedDao.queryForAll();
        for (var a = 0; a < attributes.length; a++) {
          var attribute = attributes[a];
          var row = relatedDao.getRow(attribute);
          var baseIds = rte.getMappingsForRelated(relationship.mapping_table_name, row.getId());
          if (row.getId() === 17) {
            baseIds.length.should.be.equal(2);
          } else if (row.getId() === 18) {
            baseIds.length.should.be.equal(3);
          } else if (row.getId() === 19) {
            baseIds.length.should.be.equal(1);
          }
          relatedIdMappings[row.getId()] = baseIds;
        }

        for (var baseId in baseIdMappings) {
          relatedIds = baseIdMappings[baseId.toString()];
          for (var r = 0; r < relatedIds.length; r++) {
            var relatedId = relatedIds[r];
            relatedIdMappings[relatedId.toString()].indexOf(Number(baseId)).should.not.equal(-1);
          }
        }

        for (var relatedIdMapping in relatedIdMappings) {
          baseIds = relatedIdMappings[relatedIdMapping.toString()];
          for (var b = 0; b < baseIds.length; b++) {
            var baseIdMapping = baseIds[b];
            baseIdMappings[baseIdMapping.toString()].indexOf(Number(relatedIdMapping)).should.not.equal(-1);
          }
        }
      }
    });

    it('should get relationships for the base table name', function() {
      var rte = new RelatedTablesExtension(geoPackage);
      var relationships = rte.getRelationships('cats_feature');
      relationships.length.should.be.equal(1);
      relationships[0].base_table_name.should.be.equal('cats_feature');
      relationships[0].base_primary_column.should.be.equal('id');
      relationships[0].related_table_name.should.be.equal('cats_media');
      relationships[0].related_primary_column.should.be.equal('id');
    });

    it('should get relationships for the base table name and baseId', function() {
      var rte = new RelatedTablesExtension(geoPackage);
      var relationships = rte.getRelatedRows('cats_feature', 1);
      relationships.length.should.be.equal(1);
      relationships[0].related_table_name.should.be.equal('cats_media');
      relationships[0].mappingRows.length.should.be.equal(2);
      relationships[0].mappingRows[0].row.id.should.be.equal(relationships[0].mappingRows[0].related_id);
    });
  });

  describe('Related Tables Write Tests', function() {

    var testGeoPackage;
    var testPath = path.join(__dirname, '..', '..', '..', 'fixtures', 'tmp');
    var geopackage;

    var geoPackage;

    var filename;
    beforeEach('create the GeoPackage connection', async function() {

      var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'gdal_sample.gpkg');
      // @ts-ignore
      let result = await copyAndOpenGeopackage(originalFilename);
      filename = result.path;
      geoPackage = result.geopackage;
    });

    afterEach('close the geopackage connection', async function() {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    });

    it('should write a relationship', function() {

      var rte = new RelatedTablesExtension(geoPackage);
      rte.has().should.be.equal(false);

      var extendedRelationships = rte.getRelationships();
      extendedRelationships.length.should.be.equal(0);

      var baseTableName = 'geometry2d';
      var relatedTableName = 'geometry3d';
      var mappingTableName = 'g2d_3d';

      var additionalColumns = RelatedTablesUtils.createAdditionalUserColumns(UserMappingTable.numRequiredColumns());
      var userMappingTable = UserMappingTable.create(mappingTableName, additionalColumns);
      rte.has(userMappingTable.table_name).should.be.equal(false);

      var numColumns = UserMappingTable.numRequiredColumns() + additionalColumns.length;
      numColumns.should.be.equal(userMappingTable.columns.length);

      var baseIdColumn = userMappingTable.getBaseIdColumn();
      should.exist(baseIdColumn);
      baseIdColumn.name.should.be.equal(UserMappingTable.COLUMN_BASE_ID);
      baseIdColumn.notNull.should.be.equal(true);
      baseIdColumn.primaryKey.should.be.equal(false);

      var featureRelationship = RelatedTablesExtension.RelationshipBuilder()
      .setBaseTableName(baseTableName)
      .setRelatedTableName(relatedTableName)
      .setUserMappingTable(userMappingTable);

      return rte.addFeaturesRelationship(featureRelationship)
      .then(function(extendedRelation){
        rte.has().should.be.equal(true);
        rte.has(userMappingTable.table_name).should.be.equal(true);
        should.exist(extendedRelation);
        var relationships = rte.getRelationships();
        relationships.length.should.be.equal(1);
        geoPackage.isTable(mappingTableName).should.be.equal(true);

        var baseDao = geoPackage.getFeatureDao(baseTableName);
        var relatedDao = geoPackage.getFeatureDao(relatedTableName);
        var baseResults = baseDao.queryForAll();
        var relatedResults = relatedDao.queryForAll();

        var userMappingDao = rte.getMappingDao(mappingTableName);
        var userMappingRow;
        for (var i = 0; i < 10; i++) {
          userMappingRow = userMappingDao.newRow();
          userMappingRow.setBaseId(Math.floor(Math.random() * baseResults.length));
          userMappingRow.setRelatedId(Math.floor(Math.random() * relatedResults.length));
          RelatedTablesUtils.populateRow(userMappingTable, userMappingRow, UserMappingTable.requiredColumns());
          var result = userMappingDao.create(userMappingRow);
        }

        var count = userMappingDao.getCount();
        count.should.be.equal(10);

        userMappingTable = userMappingDao.table;
        var columns = userMappingTable.columnNames;
        var userMappingRows = userMappingDao.queryForAll();
        userMappingRows.length.should.be.equal(10);

        var rowsDeleted = 0;
        for (var i = 0; i < userMappingRows.length; i++) {
          var resultRow = userMappingDao.getUserMappingRow(userMappingRows[i]);
          should.not.exist(resultRow.getId());
          RelatedTablesUtils.validateUserRow(columns, resultRow);
          RelatedTablesUtils.validateDublinCoreColumns(resultRow);
          var deleteResult = userMappingDao.deleteByIds(resultRow.getBaseId(), resultRow.getRelatedId());
          rowsDeleted += deleteResult;
        }
        rowsDeleted.should.be.equal(10);
        rte.removeRelationship(extendedRelation);
        rte.has(userMappingTable.table_name).should.be.equal(false);
        relationships = rte.getRelationships();
        relationships.length.should.be.equal(0);
        geoPackage.isTable(mappingTableName).should.be.equal(false);
        rte.removeExtension();
        rte.has().should.be.equal(false);
      })
      .catch(function(error) {
        console.log('error', error);
        false.should.be.equal(true);
      });
    });
  });
});

import { default as testSetup } from '../../../testSetup'
import { RelatedTablesExtension} from '../../../../lib/extension/related/relatedTablesExtension'

var UserMappingTable = require('../../../../lib/extension/related/userMappingTable').UserMappingTable
  , RelatedTablesUtils = require('./relatedTablesUtils')
  , should = require('chai').should()
  , expect = require('chai').expect
  , path = require('path');

describe('Related Tables tests', function() {

  describe('Related Tables Read Tests', function() {
    var geoPackage;

    var filename;
    beforeEach('create the GeoPackage connection', async function() {

      var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'rte.gpkg');
      // @ts-ignore
      let result = await copyAndOpenGeopackage(originalFilename);
      filename = result.path;
      geoPackage = result.geoPackage;
    });

    afterEach('close the geoPackage connection', async function() {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    });

    it('should read a relationship', function() {
      var rte = new RelatedTablesExtension(geoPackage);
      rte.getOrCreateExtension();
      rte.has().should.be.equal(true);
      var relationships = rte.getRelationships();
      relationships.length.should.be.equal(1);

      for (var i = 0; i < relationships.length; i++) {
        var relationship = relationships[i];
        var baseDao = geoPackage.getFeatureDao(relationship.getBaseTableName());
        var resultSet = baseDao.queryForAll();
        var baseIdMappings = {};
        while (resultSet.moveToNext()) {
          const row = resultSet.getRow();
          var relatedIds = rte.getMappingsForBase(relationship.getMappingTableName(), row.getId());
          if (row.getId() === 1) {
            relatedIds.length.should.be.equal(2);
          } else if (row.getId() === 2) {
            relatedIds.length.should.be.equal(1);
          }
          baseIdMappings[row.getId()] = relatedIds;
        }

        var relatedIdMappings = {};
        var relatedDao = geoPackage.getAttributesDao(relationship.getRelatedTableName());
        var attributeResultSet = relatedDao.queryForAll();
        while (attributeResultSet.moveToNext()) {
          const row = attributeResultSet.getRow();
          var baseIds = rte.getMappingsForRelated(relationship.getMappingTableName(), row.getId());
          if (row.getId() === 17) {
            baseIds.length.should.be.equal(2);
          } else if (row.getId() === 18) {
            baseIds.length.should.be.equal(3);
          } else if (row.getId() === 19) {
            baseIds.length.should.be.equal(1);
          }
          relatedIdMappings[row.getId()] = baseIds;
        }

        for (const baseId in baseIdMappings) {
          relatedIds = baseIdMappings[baseId.toString()];
          for (let r = 0; r < relatedIds.length; r++) {
            const relatedId = relatedIds[r];
            relatedIdMappings[relatedId.toString()].indexOf(Number(baseId)).should.not.equal(-1);
          }
        }

        for (const relatedIdMapping in relatedIdMappings) {
          baseIds = relatedIdMappings[relatedIdMapping.toString()];
          for (let b = 0; b < baseIds.length; b++) {
            const baseIdMapping = baseIds[b];
            baseIdMappings[baseIdMapping.toString()].indexOf(Number(relatedIdMapping)).should.not.equal(-1);
          }
        }
      }
    });

    it('should get relationships for the base table name', function() {
      const rte = new RelatedTablesExtension(geoPackage);
      const relationships = rte.getBaseTableRelations('cats_feature');
      relationships.length.should.be.equal(1);
      relationships[0].getBaseTableName().should.be.equal('cats_feature');
      relationships[0].getBasePrimaryColumn().should.be.equal('id');
      relationships[0].getRelatedTableName().should.be.equal('cats_media');
      relationships[0].getRelatedPrimaryColumn().should.be.equal('id');
    });

    it('should get relationships for the base table name and baseId', function() {
      const rte = new RelatedTablesExtension(geoPackage);
      rte.getOrCreateExtension();
      const relationships = rte.getRelatedRows('cats_feature', 1);
      const keys = Array.from(relationships.keys());
      keys.length.should.be.equal(1);
      const relation = keys[0];
      relation.getRelatedTableName().should.be.equal('cats_media');
      const relationshipMap = relationships.get(keys[0]);
      const mappingRows = Array.from(relationshipMap.keys());
      mappingRows.length.should.be.equal(2);
      const userRow = relationshipMap.get(mappingRows[0]);
      userRow.getId().should.be.equal(mappingRows[0].getRelatedId());
    });
  });

  describe('Related Tables Write Tests', function() {
    var geoPackage;

    var filename;
    beforeEach('create the GeoPackage connection', async function() {

      var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'gdal_sample.gpkg');
      // @ts-ignore
      let result = await copyAndOpenGeopackage(originalFilename);
      filename = result.path;
      geoPackage = result.geoPackage;
    });

    afterEach('close the geoPackage connection', async function() {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    });

    it('should write a relationship', function() {
      const rte = new RelatedTablesExtension(geoPackage);
      rte.has().should.be.equal(false);

      const extendedRelationships = rte.getRelationships();
      extendedRelationships.length.should.be.equal(0);

      var baseTableName = 'geometry2d';
      var relatedTableName = 'geometry3d';
      var mappingTableName = 'g2d_3d';

      var additionalColumns = RelatedTablesUtils.createAdditionalUserColumns();
      var userMappingTable = UserMappingTable.create(mappingTableName, additionalColumns);
      rte.hasExtensionForMappingTable(userMappingTable.getTableName()).should.be.equal(false);

      var numColumns = UserMappingTable.numRequiredColumns() + additionalColumns.length;
      numColumns.should.be.equal(userMappingTable.getUserColumns().getColumns().length);

      var baseIdColumn = userMappingTable.getBaseIdColumn();
      should.exist(baseIdColumn);
      baseIdColumn.getName().should.be.equal(UserMappingTable.COLUMN_BASE_ID);
      baseIdColumn.isNotNull().should.be.equal(true);
      baseIdColumn.isPrimaryKey().should.be.equal(false);

      try {

        let extendedRelation = rte.addFeaturesRelationshipWithMappingTable(baseTableName, relatedTableName, userMappingTable);
        rte.has().should.be.equal(true);
        rte.hasExtensionForMappingTable(userMappingTable.getTableName()).should.be.equal(true);
        should.exist(extendedRelation);
        var relationships = rte.getRelationships();
        relationships.length.should.be.equal(1);
        geoPackage.isTable(mappingTableName).should.be.equal(true);


        var baseDao = geoPackage.getFeatureDao(baseTableName);
        var relatedDao = geoPackage.getFeatureDao(relatedTableName);
        var baseResults = baseDao.count();
        var relatedResults = relatedDao.count();


        var userMappingDao = rte.getMappingDao(mappingTableName);
        var userMappingRow;
        for (var i = 0; i < 10; i++) {
          userMappingRow = userMappingDao.newRow();
          userMappingRow.setBaseId(Math.floor(Math.random() * baseResults));
          userMappingRow.setRelatedId(Math.floor(Math.random() * relatedResults));
          RelatedTablesUtils.populateUserRow(userMappingTable, userMappingRow, UserMappingTable.requiredColumns());
          userMappingDao.create(userMappingRow);
        }


        var count = userMappingDao.getCount();
        count.should.be.equal(10);

        userMappingTable = userMappingDao.getTable();
        var columns = userMappingTable.getUserColumns().getColumnNames();
        var userMappingResultSet = userMappingDao.queryForAll();
        userMappingResultSet.getCount().should.be.equal(10);

        const rows = [];
        while (userMappingResultSet.moveToNext()) {
          rows.push(userMappingDao.getRowWithUserCustomRow(userMappingResultSet.getRow()));
        }
        userMappingResultSet.close();

        var rowsDeleted = 0;
        for (let i = 0; i < rows.length; i++) {
          var resultRow = rows[i];
          resultRow.hasId().should.be.equal(false);
          RelatedTablesUtils.validateUserRow(columns, resultRow);
          RelatedTablesUtils.validateDublinCoreColumns(resultRow);
          var deleteResult = userMappingDao.deleteByIds(resultRow.getBaseId(), resultRow.getRelatedId());
          rowsDeleted += deleteResult;
        }
        rowsDeleted.should.be.equal(10);
        rte.removeRelationshipWithExtendedRelation(extendedRelation);
        rte.hasExtensionForMappingTable(userMappingTable.getTableName()).should.be.equal(false);
        relationships = rte.getRelationships();
        relationships.length.should.be.equal(0);
        geoPackage.isTable(mappingTableName).should.be.equal(false);
        rte.removeExtension();
        rte.has().should.be.equal(false);
      } catch(e) {
        console.log('error', e);
        false.should.be.equal(true);
      }
    });
  });
});

import { default as testSetup } from '../../../testSetup'
import {RelatedTablesExtension} from '../../../../lib/extension/related/relatedTablesExtension'
import {UserMappingTable} from '../../../../lib/extension/related/userMappingTable';
import { GeoPackageDataType } from "../../../../lib/db/geoPackageDataType";
import { RelationType } from "../../../../lib/extension/related/relationType";
import { ContentsDataType } from "../../../../lib/contents/contentsDataType";

var DataType = require('../../../../lib/db/geoPackageDataType').GeoPackageDataType
  , RelatedTablesUtils = require('./relatedTablesUtils')
  , should = require('chai').should()
  , assert = require('chai').assert
  , path = require('path');


/**
 * Verify they equal
 * @param a
 * @param b
 */
function assertEquals(a, b) {
  a.should.equal(b);
}

describe('Related Attributes tests', function() {
  var geoPackage;

  var filename;
  beforeEach('create the GeoPackage connection', async function() {
    var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'import_db.gpkg');
    // @ts-ignore
    let result = await copyAndOpenGeopackage(originalFilename);
    filename = result.path;
    geoPackage = result.geoPackage;
  });

  afterEach('delete the geoPackage', async function() {
    geoPackage.close();
    await testSetup.deleteGeoPackage(filename);
  })

  it('should create an attributes relationship', function() {
    try {
      // Create a related tables extension
      const rte = new RelatedTablesExtension(geoPackage);

      if (rte.has()) {
        rte.removeExtension();
      }

      assert.isFalse(rte.has());
      assert.isTrue(rte.getRelationships().length === 0);

      // Choose a random attributes table
      let attributesTables = geoPackage.getAttributesTables();
      if (attributesTables.length === 0) {
        return; // pass with no testing
      }
      const baseTableName = attributesTables[(Math.floor(Math.random() * attributesTables.length))];
      const relatedTableName = attributesTables[(Math.floor(Math.random() * attributesTables.length))];

      // Create and validate a mapping table
      const additionalMappingColumns = RelatedTablesUtils.createAdditionalUserColumns();
      const mappingTableName = "attributes_attributes";
      let userMappingTable = UserMappingTable.create(mappingTableName, additionalMappingColumns);
      assert.isFalse(rte.hasExtensionForMappingTable(userMappingTable.getTableName()));
      assertEquals(UserMappingTable.numRequiredColumns() + additionalMappingColumns.length, userMappingTable.getColumns().length);
      const baseIdColumn = userMappingTable.getBaseIdColumn();
      assert.isNotNull(baseIdColumn);
      assert.isTrue(baseIdColumn.isNamed(UserMappingTable.COLUMN_BASE_ID));
      assertEquals(GeoPackageDataType.INTEGER, baseIdColumn.getDataType());
      assert.isTrue(baseIdColumn.isNotNull());
      assert.isFalse(baseIdColumn.isPrimaryKey());
      const relatedIdColumn = userMappingTable.getRelatedIdColumn();
      assert.isNotNull(relatedIdColumn);
      assert.isTrue(relatedIdColumn.isNamed(UserMappingTable.COLUMN_RELATED_ID));
      assertEquals(GeoPackageDataType.INTEGER, relatedIdColumn.getDataType());
      assert.isTrue(relatedIdColumn.isNotNull());
      assert.isFalse(relatedIdColumn.isPrimaryKey());
      assert.isFalse(rte.hasExtensionForMappingTable(userMappingTable.getTableName()));

      // Create the relationship between the attributes table and attributes
      // table
      let extendedRelation = rte.addAttributesRelationshipWithMappingTable(baseTableName, relatedTableName, userMappingTable);
      assert.isTrue(rte.has());
      assert.isTrue(rte.hasExtensionForMappingTable(userMappingTable.getTableName()));
      assert.isNotNull(extendedRelation);
      let extendedRelations = rte.getRelationships();
      assertEquals(1, extendedRelations.length);
      assert.isTrue(geoPackage.isTable(mappingTableName));

      // Build the Attributes ids
      let attributesDao = geoPackage.getAttributesDao(baseTableName);
      const attributesResultSet = attributesDao.queryForAll();
      const attributesCount = attributesResultSet.getCount();
      const attributeIds = [];
      while (attributesResultSet.moveToNext()) {
        attributeIds.push(attributesResultSet.getRow().getId());
      }
      attributesResultSet.close();

      // Build the Attribute related ids
      const attributesDao2 = geoPackage.getAttributesDao(relatedTableName);
      let attributesResultSet2 = attributesDao2.queryForAll();
      const attributesCount2 = attributesResultSet2.getCount();
      const attributeIds2 = [];
      while (attributesResultSet2.moveToNext()) {
        attributeIds2.push(attributesResultSet2.getRow().getId());
      }
      attributesResultSet2.close();

      // Insert user mapping rows between attribute ids and attribute ids
      const dao = rte.getMappingDao(mappingTableName);
      let userMappingRow = null;
      for (let i = 0; i < 10; i++) {
        userMappingRow = dao.newRow();
        userMappingRow.setBaseId(attributeIds[(Math.floor(Math.random() * attributesCount))]);
        userMappingRow.setRelatedId(attributeIds2[(Math.floor(Math.random() * attributesCount2))]);
        RelatedTablesUtils.populateUserRow(userMappingTable, userMappingRow, UserMappingTable.requiredColumns());
        assert.isTrue(dao.create(userMappingRow) > 0);
      }
      assertEquals(10, dao.count());

      // Validate the user mapping rows
      userMappingTable = dao.getTable();
      const mappingColumns = userMappingTable.getColumnNames();
      const resultSet = dao.queryForAll();
      const count = resultSet.getCount();
      assertEquals(10, count);
      let manualCount = 0;
      while (resultSet.moveToNext()) {
        const resultRow = dao.getRow(resultSet);
        assert.isFalse(resultRow.hasId());
        assert.isTrue(attributeIds.indexOf(resultRow.getBaseId()) > -1);
        assert.isTrue(attributeIds2.indexOf(resultRow.getRelatedId()) > -1);
        RelatedTablesUtils.validateUserRow(mappingColumns, resultRow);
        RelatedTablesUtils.validateDublinCoreColumns(resultRow);

        manualCount++;
      }
      assertEquals(count, manualCount);
      resultSet.close();

      const extendedRelationsDao = rte.getExtendedRelationsDao();

      // Get the relations starting from the attributes table
      const attributesExtendedRelations = extendedRelationsDao.getBaseTableRelations(attributesDao.getTableName());
      const attributesExtendedRelations2 = extendedRelationsDao.getTableRelations(attributesDao.getTableName());
      assertEquals(1, attributesExtendedRelations.length);
      assertEquals(1, attributesExtendedRelations2.length);
      assertEquals(attributesExtendedRelations[0].getId(), attributesExtendedRelations2[0].getId());

      // Test the attributes table relations
      for (const attributesRelation of attributesExtendedRelations) {
        // Test the relation
        assert.isTrue(attributesRelation.getId() >= 0);
        assertEquals(attributesDao.getTableName(), attributesRelation.getBaseTableName());
        assertEquals(attributesDao.getPkColumnName(), attributesRelation.getBasePrimaryColumn());
        assertEquals(attributesDao2.getTableName(), attributesRelation.getRelatedTableName());
        assertEquals(attributesDao2.getPkColumnName(), attributesRelation.getRelatedPrimaryColumn());
        assertEquals(RelationType.ATTRIBUTES.getName(), attributesRelation.getRelationName());
        assertEquals(mappingTableName, attributesRelation.getMappingTableName());

        // Test the user mappings from the relation
        const userMappingDao = rte.getMappingDaoWithExtendedRelation(attributesRelation);
        const mappingResultSet = userMappingDao.queryForAll();
        while (mappingResultSet.moveToNext()) {
          userMappingRow = userMappingDao.getRow(mappingResultSet);
          assert.isTrue(attributeIds.indexOf(userMappingRow.getBaseId()) > -1);
          assert.isTrue(attributeIds2.indexOf(userMappingRow.getRelatedId()) > -1);
          RelatedTablesUtils.validateUserRow(mappingColumns, userMappingRow);
          RelatedTablesUtils.validateDublinCoreColumns(userMappingRow);
        }
        mappingResultSet.close();
      }

      // Get the relations starting from the attributes table
      const relatedExtendedRelations = extendedRelationsDao.getRelatedTableRelations(relatedTableName);
      const extendedRelations2 = extendedRelationsDao.getTableRelations(relatedTableName);
      assertEquals(1, relatedExtendedRelations.length);
      assertEquals(1, extendedRelations2.length);
      assertEquals(relatedExtendedRelations[0].getId(), extendedRelations2[0].getId());

      // Test the attributes table relations
      for (const relation of relatedExtendedRelations) {
        // Test the relation
        assert.isTrue(relation.getId() >= 0);
        assertEquals(attributesDao.getTableName(), relation.getBaseTableName());
        assertEquals(attributesDao.getPkColumnName(), relation.getBasePrimaryColumn());
        assertEquals(attributesDao2.getTableName(), relation.getRelatedTableName());
        assertEquals(attributesDao2.getPkColumnName(), relation.getRelatedPrimaryColumn());
        assertEquals(RelationType.ATTRIBUTES.getName(), relation.getRelationName());
        assertEquals(mappingTableName, relation.getMappingTableName());

        // Test the user mappings from the relation
        const userMappingDao = rte.getMappingDaoWithExtendedRelation(relation);
        const totalMappedCount = userMappingDao.count();
        const mappingResultSet = userMappingDao.queryForAll();
        while (mappingResultSet.moveToNext()) {
          userMappingRow = userMappingDao.getRow(mappingResultSet);
          assert.isTrue(attributeIds.indexOf(userMappingRow.getBaseId()) > -1);
          assert.isTrue(attributeIds2.indexOf(userMappingRow.getRelatedId()) > -1);
          RelatedTablesUtils.validateUserRow(mappingColumns, userMappingRow);
          RelatedTablesUtils.validateDublinCoreColumns(userMappingRow);
        }
        mappingResultSet.close();

        // Get and test the attributes DAO
        attributesDao = geoPackage.getAttributesDao(attributesDao.getTableName());
        assert.isNotNull(attributesDao);
        const attributesTable = attributesDao.getTable();
        assert.isNotNull(attributesTable);
        const attributesContents = attributesTable.getContents();
        assert.isNotNull(attributesContents);
        assertEquals(ContentsDataType.ATTRIBUTES, attributesContents.getDataType());
        assertEquals(ContentsDataType.nameFromType(ContentsDataType.ATTRIBUTES), attributesContents.getDataTypeName());
        assertEquals(attributesTable.getTableName(), attributesContents.getTableName());
        assert.isNotNull(attributesContents.getLastChange());

        // Get and test the Attributes Rows mapped to each Attributes Row
        attributesResultSet2 = attributesDao2.queryForAll();
        let totalMapped = 0;
        while (attributesResultSet2.moveToNext()) {
          const attributes2Row = attributesResultSet2.getRow();
          const mappedIds = rte.getMappingsForRelatedWithExtendedRelation(relation, attributes2Row.getId());
          for (const mappedId of mappedIds) {
            const attributesRow = attributesDao.queryForIdRow(mappedId);
            assert.isNotNull(attributesRow);

            assert.isTrue(attributesRow.hasId());
            assert.isTrue(attributesRow.getId() >= 0);
            assert.isTrue(attributeIds.indexOf(attributesRow.getId()) > -1);
            assert.isTrue(mappedIds.indexOf(attributesRow.getId()) > -1);
          }

          totalMapped += mappedIds.length;
        }
        attributesResultSet2.close();
        assertEquals(totalMappedCount, totalMapped);
      }

      // Delete a single mapping
      const countOfIds = dao.countByIdsWithUserMappingRow(userMappingRow);
      assertEquals(countOfIds, dao.deleteByIdsWithUserMappingRow(userMappingRow));
      assertEquals(10 - countOfIds, dao.count());

      // Delete the relationship and user mapping table
      rte.removeRelationshipWithExtendedRelation(extendedRelation);
      assert.isFalse(rte.hasExtensionForMappingTable(userMappingTable.getTableName()));
      extendedRelations = rte.getRelationships();
      assert.isFalse(geoPackage.isTable(mappingTableName));
      assertEquals(0, extendedRelations.length);

      // Delete the related tables extension
      rte.removeExtension();
      assert.isFalse(rte.has());
    } catch (e) {
      console.error(e);
    }
  });
});

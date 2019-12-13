import { GeoPackage as GeoPackageAPI } from '../../../..'
import { default as testSetup } from '../../../fixtures/testSetup'
import RelatedTablesExtension from '../../../../lib/extension/relatedTables'
import UserMappingTable from '../../../../lib/extension/relatedTables/userMappingTable';

var DataType = require('../../../../lib/db/dataTypes').default
  // , testSetup = require('../../../fixtures/testSetup')
  , RelatedTablesUtils = require('./relatedTablesUtils')
  , should = require('chai').should()
  , path = require('path');

describe('Related Attributes tests', function() {

  var testGeoPackage;
  var testPath = path.join(__dirname, '..', '..', '..', 'fixtures', 'tmp');
  var geoPackage;

  var filename;
  beforeEach('create the GeoPackage connection', async function() {
    var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'attributes.gpkg');
    // @ts-ignore
    let result = await copyAndOpenGeopackage(originalFilename);
    filename = result.path;
    geoPackage = result.geopackage;
  });

  function validateContents(attributesTable, contents) {
    should.exist(contents);
    should.exist(contents.data_type);
    'attributes'.should.be.equal(contents.data_type);
    attributesTable.table_name.should.be.equal(contents.table_name);
    should.exist(contents.last_change);
  }

  it('should create an attributes relationship', function() {
    var rte = new RelatedTablesExtension(geoPackage);
    rte.has().should.be.equal(false);

    var extendedRelationships = rte.getRelationships();
    extendedRelationships.length.should.be.equal(0);

    var attributesTables = geoPackage.getAttributesTables();

    var baseTableName = geoPackage.getAttributesTables()[0];
    var attributesDao = geoPackage.getAttributeDaoWithTableName(baseTableName);

    var additionalMappingColumns = RelatedTablesUtils.createAdditionalUserColumns(UserMappingTable.numRequiredColumns());
    var mappingTableName = 'attributes_2_attributes';
    var userMappingTable = UserMappingTable.create(mappingTableName, additionalMappingColumns);
    rte.has(userMappingTable.table_name).should.be.equal(false);
    userMappingTable.columnNames.length.should.be.equal(UserMappingTable.numRequiredColumns() + additionalMappingColumns.length);

    var baseIdColumn = userMappingTable.getBaseIdColumn();
    should.exist(baseIdColumn);
    baseIdColumn.name.should.be.equal(UserMappingTable.COLUMN_BASE_ID);
    baseIdColumn.dataType.should.be.equal(DataType.GPKGDataType.GPKG_DT_INTEGER);
    baseIdColumn.notNull.should.be.equal(true);
    baseIdColumn.primaryKey.should.be.equal(false);

    var relatedIdColumn = userMappingTable.getRelatedIdColumn();
    should.exist(relatedIdColumn);
    relatedIdColumn.name.should.be.equal(UserMappingTable.COLUMN_RELATED_ID);
    relatedIdColumn.dataType.should.be.equal(DataType.GPKGDataType.GPKG_DT_INTEGER);
    relatedIdColumn.notNull.should.be.equal(true);
    relatedIdColumn.primaryKey.should.be.equal(false);
    rte.has(userMappingTable.table_name).should.be.equal(false);

    var relationship = RelatedTablesExtension.RelationshipBuilder()
      .setBaseTableName(baseTableName)
      .setRelatedTableName(baseTableName)
      .setUserMappingTable(userMappingTable);

    return rte.addAttributesRelationship(relationship)
      .then(function(extendedRelation) {
        rte.has().should.be.equal(true);
        rte.has(userMappingTable.table_name).should.be.equal(true);
        should.exist(extendedRelation);
        var relationships = rte.getRelationships();
        relationships.length.should.be.equal(1);
        geoPackage.isTable(mappingTableName).should.be.equal(true);
        'attributes'.should.be.equal(geoPackage.getTableType(baseTableName));
        geoPackage.isTableType('attributes', baseTableName);

        // Insert user mapping rows between attributes
        var userMappingDao = rte.getMappingDao(mappingTableName);
        var userMappingRow = userMappingDao.newRow();
        userMappingRow.setBaseId(4);
        userMappingRow.setRelatedId(7);
        RelatedTablesUtils.populateRow(userMappingTable, userMappingRow, UserMappingTable.requiredColumns());
        var createdId = userMappingDao.create(userMappingRow);
        createdId.should.be.equal(1);

        userMappingDao.count().should.be.equal(1);

        userMappingRow = userMappingDao.newRow();
        userMappingRow.setBaseId(5);
        userMappingRow.setRelatedId(5);
        RelatedTablesUtils.populateRow(userMappingTable, userMappingRow, UserMappingTable.requiredColumns());
        createdId = userMappingDao.create(userMappingRow);
        createdId.should.be.equal(2);

        userMappingDao.count().should.be.equal(2);


        // Validate the user mapping rows
        userMappingTable = userMappingDao.getTable();
        var mappingColumns = userMappingTable.columnNames;
        var userMappingRows = userMappingDao.queryForAll();
        var count = userMappingRows.length;
        count.should.be.equal(2);
        var manualCount = 0;

        for (var i = 0; i < count; i++) {
          userMappingRow = userMappingRows[i];
          var row = userMappingDao.getUserMappingRow(userMappingRow);
          row.hasId().should.be.equal(false);
          row.getBaseId().should.be.oneOf([4, 5]);
          if (row.getBaseId() === 4) {
            row.getBaseId().should.be.equal(4);
            row.getRelatedId().should.be.equal(7);
          } else if (row.getBaseId() === 5) {
            row.getBaseId().should.be.equal(5);
            row.getRelatedId().should.be.equal(5);
          }
          RelatedTablesUtils.validateUserRow(mappingColumns, row);
          RelatedTablesUtils.validateDublinCoreColumns(row);
          manualCount++;
        }

        manualCount.should.be.equal(count);

        var extendedRelationsDao = rte.extendedRelationDao;
        var attributeBaseTableRelations = extendedRelationsDao.getBaseTableRelations(attributesDao.table_name);
        var attributeTableRelations = extendedRelationsDao.getTableRelations(attributesDao.table_name);
        attributeBaseTableRelations.length.should.be.equal(1);
        attributeTableRelations.length.should.be.equal(1);
        attributeBaseTableRelations[0].id.should.be.equal(attributeTableRelations[0].id);
        extendedRelationsDao.getRelatedTableRelations(attributesDao.table_name).length.should.be.equal(1);

        // Test the attribute table relations
        for (i = 0; i < attributeBaseTableRelations.length; i++) {

          // Test the relation
          var attributeRelation = attributeBaseTableRelations[i];
          attributeRelation.id.should.be.greaterThan(0);
          attributesDao.table_name.should.be.equal(attributeRelation.base_table_name);
          attributesDao.table.getPkColumn().name.should.be.equal(attributeRelation.base_primary_column);
          baseTableName.should.be.equal(attributeRelation.related_table_name);
          attributesDao.table.getPkColumn().name.should.be.equal(attributeRelation.related_primary_column);
          'attributes'.should.be.equal(attributeRelation.relation_name);
        }

        var baseTables = extendedRelationsDao.getBaseTables();
        baseTables.length.should.be.equal(1);
        baseTables[0].should.be.equal(baseTableName);
        var relatedTables = extendedRelationsDao.getRelatedTables();
        relatedTables.length.should.be.equal(1);
        relatedTables[0].should.be.equal(baseTableName);

        // Delete a single mapping
        var countOfIds = userMappingDao.countByIds(5);
        var queryOfIds = userMappingDao.queryByIds(5);
        var queryCount = 0;
        for (row of queryOfIds) {
          queryCount++;
        }

        queryCount.should.be.equal(countOfIds);
        countOfIds.should.be.equal(userMappingDao.deleteByIds(5));
        var userMappingCount = userMappingDao.count();
        userMappingCount.should.be.equal(2-countOfIds);

        // Delete by base id
        var baseIdQuery = userMappingDao.queryByBaseId(4);
        var countOfBaseIds = baseIdQuery.length;
        var deleted = userMappingDao.deleteByBaseId(4);
        deleted.should.be.equal(countOfBaseIds);

        // Delete the relationship and user mapping table
        rte.removeRelationship(extendedRelation);
        rte.has(userMappingTable.table_name).should.be.equal(false);
        relationships = rte.getRelationships();
        relationships.length.should.be.equal(0);
        geoPackage.isTable(mappingTableName).should.be.equal(false);

        // Delete the related tables extension
        rte.removeExtension();
        rte.has().should.be.equal(false);
      });
  });
});

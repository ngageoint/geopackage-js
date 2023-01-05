import { default as testSetup } from '../../../testSetup'
import {RelatedTablesExtension} from '../../../../lib/extension/related/relatedTablesExtension';
import {ContentsDataType} from "../../../../lib/contents/contentsDataType";

var DataType = require('../../../../lib/db/geoPackageDataType').GeoPackageDataType
  , Verification = require('../../../verification')
  , ContentsDao = require('../../../../lib/contents/contentsDao').ContentsDao
  , UserMappingTable = require('../../../../lib/extension/related/userMappingTable').UserMappingTable
  , SimpleAttributesTable = require('../../../../lib/extension/related/simple/simpleAttributesTable').SimpleAttributesTable
  , RelatedTablesUtils = require('./relatedTablesUtils')
  , should = require('chai').should()
  , path = require('path');

describe('Related Simple Attributes tests', function() {
  var geoPackage;
  var tileBuffer;
  var filename;
  beforeEach('create the GeoPackage connection', async function() {
    var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'attributes.gpkg');
    // @ts-ignore
    let result = await copyAndOpenGeopackage(originalFilename);
    filename = result.path;
    geoPackage = result.geoPackage;
    // @ts-ignore
    tileBuffer = await loadTile(path.join(__dirname, '..', '..', '..', 'fixtures', 'tiles', '0', '0', '0.png'));
  });

  afterEach('delete the geoPackage', async function() {
    geoPackage.close();
    await testSetup.deleteGeoPackage(filename);
  })

  function validateContents(simpleAttributesTable, contents) {
    should.exist(contents);
    should.exist(contents.getDataType());
    SimpleAttributesTable.RELATION_TYPE.dataType.should.be.equal(contents.getDataTypeName());
    simpleAttributesTable.getTableName().should.be.equal(contents.getTableName());
    should.exist(contents.getLastChange());
  }

  it('should create a simple attributes relationship', function() {
    const rte = new RelatedTablesExtension(geoPackage);
    rte.has().should.be.equal(false);

    const extendedRelationships = rte.getRelationships();
    extendedRelationships.length.should.be.equal(0);
    const attributesTables = geoPackage.getAttributesTables();
    const baseTableName = attributesTables[0];

    // Validate nullable non simple columns
    try {
      SimpleAttributesTable.create('simple_table', RelatedTablesUtils.createAdditionalUserColumns(false));
      should.fail('Simple Attributes Table', undefined, 'Simple Attributes Table created with nullable non simple columns');
    } catch (error) {
      // pass
    }

    // Validate non nullable non simple columns
    try {
      SimpleAttributesTable.create('simple_table', RelatedTablesUtils.createAdditionalUserColumns(true));
      should.fail('Simple Attributes Table', undefined, 'Simple Attributes Table created with non nullable non simple columns');
    } catch (error) {
      // pass
    }

    // Validate nullable simple columns
    try {
      SimpleAttributesTable.create('simple_table', RelatedTablesUtils.createSimpleUserColumns(false));
      should.fail('Simple Attributes Table', undefined, 'Simple Attributes Table created with nullable simple columns');
    } catch (error) {
      // pass
    }

    // Populate and validate a simple attribute table
    var simpleUserColumns = RelatedTablesUtils.createSimpleUserColumns(true);
    var simpleTable = SimpleAttributesTable.create('simple_table', simpleUserColumns);
    var simpleColumns = simpleTable.getUserColumns().getColumnNames();
    simpleColumns.length.should.be.equal(SimpleAttributesTable.numRequiredColumns() + simpleUserColumns.length);

    var idColumn = simpleTable.getPkColumn();
    should.exist(idColumn);
    idColumn.getName().should.be.equal(SimpleAttributesTable.COLUMN_ID);
    idColumn.getDataType().should.be.equal(DataType.INTEGER);
    idColumn.isNotNull().should.be.equal(true);
    idColumn.isPrimaryKey().should.be.equal(true);

    var additionalMappingColumns = RelatedTablesUtils.createAdditionalUserColumns(UserMappingTable.numRequiredColumns());
    var mappingTableName = 'attributes_simple_attributes';
    var userMappingTable = UserMappingTable.create(mappingTableName, additionalMappingColumns);
    rte.hasExtensionForMappingTable(userMappingTable.getTableName()).should.be.equal(false);
    userMappingTable.getUserColumns().getColumnNames().length.should.be.equal(UserMappingTable.numRequiredColumns() + additionalMappingColumns.length);

    var baseIdColumn = userMappingTable.getBaseIdColumn();
    should.exist(baseIdColumn);
    baseIdColumn.getName().should.be.equal(UserMappingTable.COLUMN_BASE_ID);
    baseIdColumn.getDataType().should.be.equal(DataType.INTEGER);
    baseIdColumn.isNotNull().should.be.equal(true);
    baseIdColumn.isPrimaryKey().should.be.equal(false);

    var relatedIdColumn = userMappingTable.getRelatedIdColumn();
    should.exist(relatedIdColumn);
    relatedIdColumn.getName().should.be.equal(UserMappingTable.COLUMN_RELATED_ID);
    relatedIdColumn.getDataType().should.be.equal(DataType.INTEGER);
    relatedIdColumn.isNotNull().should.be.equal(true);
    relatedIdColumn.isPrimaryKey().should.be.equal(false);
    rte.hasExtensionForMappingTable(userMappingTable.getTableName()).should.be.equal(false);

    // Create the simple attributes table, content row, and relationship between the
    // attributes table and simple attributes table
    var contentsDao = geoPackage.getContentsDao();
    var contentsTables = contentsDao.getTables();
    contentsTables.indexOf(simpleTable.getTableName()).should.be.equal(-1);

    let extendedRelation = rte.addSimpleAttributesRelationshipWithMappingTable(baseTableName, simpleTable, userMappingTable)
    validateContents(simpleTable, simpleTable.getContents());
    rte.has().should.be.equal(true);
    rte.hasExtensionForMappingTable(userMappingTable.getTableName()).should.be.equal(true);
    should.exist(extendedRelation);
    var relationships = rte.getRelationships();
    relationships.length.should.be.equal(1);
    geoPackage.isTable(mappingTableName).should.be.equal(true);
    geoPackage.isTable(simpleTable.getTableName()).should.be.equal(true);
    contentsDao.getTables().indexOf(simpleTable.getTableName()).should.not.be.equal(-1);
    validateContents(simpleTable, contentsDao.queryForId(simpleTable.getTableName()));
    SimpleAttributesTable.RELATION_TYPE.dataType.should.be.equal(geoPackage.getTableType(simpleTable.getTableName()));
    geoPackage.isTableType(SimpleAttributesTable.RELATION_TYPE.dataType, simpleTable.getTableName());

    // Validate the simple attributes DAO
    var simpleDao = rte.getSimpleAttributesDaoWithSimpleAttributesTable(simpleTable);
    should.exist(simpleDao);
    simpleTable = simpleDao.getTable();
    should.exist(simpleTable);
    validateContents(simpleTable, simpleTable.getContents());

    // Insert simple attributes table rows
    var simpleCount = 2 + Math.floor(Math.random() * 9);
    var simpleRowId = 0;

    for (i = 0; i < simpleCount - 1; i++) {
      var simpleRow = simpleDao.newRow();
      RelatedTablesUtils.populateUserRow(simpleTable, simpleRow, SimpleAttributesTable.requiredColumns());
      simpleRowId = simpleDao.create(simpleRow);
      simpleRowId.should.be.greaterThan(0);
    }

    // copy the last row insert and insert the final simple row
    var simpleRowToCopy = simpleDao.queryForIdRow(simpleRowId);
    simpleRowToCopy.resetId();
    var copiedSimpleId = simpleDao.create(simpleRowToCopy);
    copiedSimpleId.should.be.greaterThan(0);
    copiedSimpleId.should.be.equal(simpleRowId + 1);
    simpleCount.should.be.equal(simpleDao.count());

    // Build the Attributes Ids
    var attributesDao = geoPackage.getAttributesDao(baseTableName);
    var allAttributes = attributesDao.queryForAll();
    var attributeIds = [];
    while (allAttributes.moveToNext()) {
      attributeIds.push(allAttributes.getRow().getId());
    }
    allAttributes.close();

    var allSimpleAttributes = simpleDao.queryForAll();
    var simpleIds = [];
    while (allSimpleAttributes.moveToNext()) {
      simpleIds.push(allSimpleAttributes.getRow().getId());
    }
    allSimpleAttributes.close();

    // Insert user mapping rows between feature ids and attribute ids
    userMappingDao = rte.getMappingDao(mappingTableName);
    for (i = 0; i < 10; i++) {
      var userMappingRow = userMappingDao.newRow();
      userMappingRow.setBaseId(attributeIds[Math.floor(Math.random() * attributeIds.length)]);
      userMappingRow.setRelatedId(simpleIds[Math.floor(Math.random() * simpleIds.length)]);
      RelatedTablesUtils.populateUserRow(userMappingTable, userMappingRow, UserMappingTable.requiredColumns());
      var created = userMappingDao.create(userMappingRow);
      created.should.be.greaterThan(0);
    }

    userMappingDao.count().should.be.equal(10);

    // Validate the user mapping rows
    userMappingTable = userMappingDao.getTable();
    var mappingColumns = userMappingTable.getUserColumns().getColumnNames();
    var userMappingRows = userMappingDao.queryForAll();
    var count = userMappingRows.getCount();
    count.should.be.equal(10);
    var manualCount = 0;
    while (userMappingRows.moveToNext()) {
      var umr = userMappingRows.getRow();
      var row2 = userMappingDao.getRowWithUserCustomRow(umr);
      row2.hasId().should.be.equal(false);
      attributeIds.indexOf(row2.getBaseId().should.be.not.equal(-1));
      simpleIds.indexOf(row2.getRelatedId().should.be.not.equal(-1));
      RelatedTablesUtils.validateUserRow(mappingColumns, row2);
      RelatedTablesUtils.validateDublinCoreColumns(row2);
      manualCount++;
    }
    userMappingRows.close();

    manualCount.should.be.equal(count);

    var extendedRelationsDao = rte.getExtendedRelationsDao();
    var attributeBaseTableRelations = extendedRelationsDao.getBaseTableRelations(attributesDao.getTableName());
    var attributeTableRelations = extendedRelationsDao.getTableRelations(attributesDao.getTableName());
    attributeBaseTableRelations.length.should.be.equal(1);
    attributeTableRelations.length.should.be.equal(1);
    attributeBaseTableRelations[0].getId().should.be.equal(attributeTableRelations[0].getId());
    extendedRelationsDao.getRelatedTableRelations(attributesDao.getTableName()).length.should.be.equal(0);

    // Test the attribute table relations
    for (var i = 0; i < attributeBaseTableRelations.length; i++) {
      // Test the relation
      var attributeRelation = attributeBaseTableRelations[i];
      attributeRelation.getId().should.be.greaterThan(0);
      attributesDao.getTableName().should.be.equal(attributeRelation.getBaseTableName());
      attributesDao.getTable().getPkColumn().getName().should.be.equal(attributeRelation.getBasePrimaryColumn());
      simpleDao.getTableName().should.be.equal(attributeRelation.getRelatedTableName());
      simpleDao.getTable().getPkColumn().getName().should.be.equal(attributeRelation.getRelatedPrimaryColumn());
      SimpleAttributesTable.RELATION_TYPE.name.should.be.equal(attributeRelation.getRelationName());

      // test the user mappings from the relation
      var userMappingDao = rte.getMappingDao(attributeRelation.getMappingTableName());
      var totalMappedCount = userMappingDao.count();
      var mappings = userMappingDao.queryForAll();
      while (mappings.moveToNext()) {
        umr = userMappingDao.getRowWithUserCustomRow(mappings.getRow());
        attributeIds.indexOf(umr.getBaseId().should.not.be.equal(-1));
        simpleIds.indexOf(umr.getRelatedId()).should.not.be.equal(-1);
        RelatedTablesUtils.validateUserRow(mappingColumns, umr);
        RelatedTablesUtils.validateDublinCoreColumns(umr);
      }
      mappings.close();

      // get and test the attributes DAO
      simpleDao = rte.getSimpleAttributesDaoWithExtendedRelation(attributeRelation);
      should.exist(simpleDao);
      simpleTable = simpleDao.getTable();
      should.exist(simpleTable);
      validateContents(simpleTable, simpleTable.getContents());

      var totalMapped = 0;

      // get and test the Attributes Rows mapped to each Simple Attributes Row
      var attributes = attributesDao.queryForAll();
      while (attributes.moveToNext()) {
        var attributeRow = attributes.getRow();
        var mappedIds = rte.getMappingsForBaseWithExtendedRelation(attributeRelation, attributeRow.getId());
        var simpleRows = simpleDao.getRows(mappedIds);
        simpleRows.length.should.be.equal(mappedIds.length);

        simpleRows.forEach((simpleRow) => {
          simpleRow.hasId().should.be.equal(true);
          simpleRow.getId().should.be.greaterThan(0);
          simpleIds.indexOf(simpleRow.getId()).should.not.be.equal(-1);
          mappedIds.indexOf(simpleRow.getId()).should.not.be.equal(-1);
          RelatedTablesUtils.validateUserRow(simpleColumns, simpleRow);
          RelatedTablesUtils.validateSimpleDublinCoreColumns(simpleRow);
        });

        totalMapped += mappedIds.length;
      }
      attributes.close();
      totalMappedCount.should.be.equal(totalMapped);
    }

    // Get the relations starting from the simple attributes table
    var simpleRelatedTableRelations = extendedRelationsDao.getRelatedTableRelations(simpleTable.getTableName());
    var simpleTableRelations = extendedRelationsDao.getTableRelations(simpleTable.getTableName());

    simpleRelatedTableRelations.length.should.be.equal(1);
    simpleTableRelations.length.should.be.equal(1);
    simpleRelatedTableRelations[0].getId().should.be.equal(simpleTableRelations[0].getId());
    extendedRelationsDao.getBaseTableRelations(simpleTable.getTableName()).length.should.be.equal(0);

    // Test the media table relations
    simpleRelatedTableRelations.forEach((simpleRelation) => {
      // Test the relation
      simpleRelation.getId().should.be.greaterThan(0);
      attributesDao.getTableName().should.be.equal(simpleRelation.getBaseTableName());
      attributesDao.getTable().getPkColumn().getName().should.be.equal(simpleRelation.getBasePrimaryColumn());
      simpleDao.getTableName().should.be.equal(simpleRelation.getRelatedTableName());
      simpleDao.getTable().getPkColumn().getName().should.be.equal(simpleRelation.getRelatedPrimaryColumn());
      SimpleAttributesTable.RELATION_TYPE.name.should.be.equal(simpleRelation.getRelationName());
      mappingTableName.should.be.equal(simpleRelation.getMappingTableName());

      // Test the user mappings from the relation
      var userMappingDao = rte.getMappingDaoWithExtendedRelation(simpleRelation);
      var totalMappedCount = userMappingDao.count();
      var mappings = userMappingDao.queryForAll();
      var umr;
      while (mappings.moveToNext()) {
        umr = userMappingDao.getRowWithUserCustomRow(mappings.getRow());
        attributeIds.indexOf(umr.getBaseId()).should.not.be.equal(-1);
        simpleIds.indexOf(umr.getRelatedId()).should.not.be.equal(-1);
        RelatedTablesUtils.validateUserRow(mappingColumns, umr);
        RelatedTablesUtils.validateDublinCoreColumns(umr);
      }
      mappings.close();

      // Get and test the attributes DAO
      attributesDao = geoPackage.getAttributesDao(attributesDao.getTableName());
      should.exist(attributesDao);
      var attributeTable = attributesDao.getTable();
      should.exist(attributeTable);
      var attributeContents = attributesDao.getContents();
      should.exist(attributeContents);
      ContentsDataType.ATTRIBUTES.should.be.equal(attributeContents.getDataType());
      attributeTable.getTableName().should.be.equal(attributeContents.getTableName());
      should.exist(attributeContents.getLastChange());

      var simpleResultSet = simpleDao.queryForAll();
      var totalMapped = 0;

      while (simpleResultSet.moveToNext()) {
        var simpleRow = simpleResultSet.getRow();
        var mappedIds = rte.getMappingsForRelated(simpleRelation.getMappingTableName(), simpleRow.getId());
        mappedIds.forEach((mappedId) =>{
          var attributeRow = attributesDao.queryForIdRow(mappedId);
          should.exist(attributeRow);
          attributeRow.hasId().should.be.equal(true);
          attributeRow.getId().should.be.greaterThan(0);
          attributeIds.indexOf(attributeRow.getId()).should.not.equal(-1);
          mappedIds.indexOf(attributeRow.getId()).should.not.equal(-1);
        });
        totalMapped += mappedIds.length;
      }
      simpleResultSet.close()

      totalMapped.should.be.equal(totalMappedCount);
    });

    const baseTables = extendedRelationsDao.getBaseTables();
    baseTables.length.should.be.equal(1);
    baseTables[0].should.be.equal(baseTableName);
    const relatedTables = extendedRelationsDao.getRelatedTables();
    relatedTables.length.should.be.equal(1);
    relatedTables[0].should.be.equal(simpleTable.getTableName());

    // Delete a single mapping
    var countOfIds = userMappingDao.countByIdsWithUserMappingRow(umr);

    var queryOfIdsResultSet = userMappingDao.queryByIdsWithUserMappingRow(umr);
    var queryCount = 0;
    while (queryOfIdsResultSet.moveToNext()) {
      queryCount++;
    }
    queryOfIdsResultSet.close();

    queryCount.should.be.equal(countOfIds);
    countOfIds.should.be.equal(userMappingDao.deleteByIdsWithUserMappingRow(umr));
    userMappingDao.count().should.be.equal(10-countOfIds);

    // Delete by base id
    var userMappingResultSet = userMappingDao.queryForAll();
    let userMappings = [];
    while (userMappingResultSet.moveToNext()) {
      userMappings.push(userMappingDao.getRowWithUserCustomRow(userMappingResultSet.getRow()));
    }
    userMappingResultSet.close()

    var countOfBaseIds = userMappingDao.countByBaseIdWithUserMappingRow(userMappings[0]);
    var deleted = userMappingDao.deleteByBaseId(userMappings[0].getBaseId());
    deleted.should.be.equal(countOfBaseIds);

    // Delete by related id
    userMappingResultSet = userMappingDao.queryForAll();
    userMappings = [];
    while (userMappingResultSet.moveToNext()) {
      userMappings.push(userMappingDao.getRowWithUserCustomRow(userMappingResultSet.getRow()));
    }
    userMappingResultSet.close();


    var countOfRelatedIds = userMappingDao.countByRelatedIdWithUserMappingRow(userMappings[0]);
    deleted = userMappingDao.deleteByRelatedIdWithUserMappingRow(userMappings[0]);
    deleted.should.be.equal(countOfRelatedIds);

    // Delete the relationship and user mapping table
    rte.removeRelationshipWithExtendedRelation(extendedRelation);
    rte.hasExtensionForMappingTable(userMappingTable.getTableName()).should.be.equal(false);
    relationships = rte.getRelationships();
    relationships.length.should.be.equal(0);
    geoPackage.isTable(mappingTableName).should.be.equal(false);

    // Delete the media table and contents row
    geoPackage.isTable(simpleTable.getTableName());
    should.exist(contentsDao.queryForId(simpleTable.getTableName()));
    geoPackage.deleteTable(simpleTable.getTableName());
    geoPackage.isTable(simpleTable.getTableName()).should.be.equal(false);
    should.not.exist(contentsDao.queryForId(simpleTable.getTableName()));

    // Delete the related tables extension
    rte.removeExtension();
    rte.has().should.be.equal(false);
  });
});

import { GeoPackageAPI } from '../../../..'
import { default as testSetup } from '../../../fixtures/testSetup'
import {RelatedTablesExtension} from '../../../../lib/extension/relatedTables'

var DataType = require('../../../../lib/db/geoPackageDataType').GeoPackageDataType
  , ContentsDao = require('../../../../lib/core/contents/contentsDao').ContentsDao
  , ContentsDataType = require('../../../../lib/core/contents/contentsDataType').ContentsDataType
  , UserMappingTable = require('../../../../lib/extension/relatedTables/userMappingTable').UserMappingTable
  , MediaTable = require('../../../../lib/extension/relatedTables/mediaTable').MediaTable
  , MediaRow = require('../../../../lib/extension/relatedTables/mediaRow').MediaRow
  // , testSetup = require('../../../fixtures/testSetup')
  , RelatedTablesUtils = require('./relatedTablesUtils')
  , should = require('chai').should()
  , wkx = require('wkx')
  , path = require('path');

describe('Related Media tests', function() {

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

  function validateContents(mediaTable, contents) {
    should.exist(contents);
    should.exist(contents.data_type);
    MediaTable.RELATION_TYPE.dataType.should.be.equal(contents.data_type);
    mediaTable.getTableName().should.be.equal(contents.getTableName());
    should.exist(contents.last_change);
  }

  it('should create a media relationship', function() {
    this.timeout(5000);
    var rte = geoPackage.relatedTablesExtension;
    rte.has().should.be.equal(false);

    var extendedRelationships = rte.getRelationships();
    extendedRelationships.length.should.be.equal(0);

    var baseTableName = geoPackage.getFeatureTables()[0];

    var additionalMediaColumns = RelatedTablesUtils.createAdditionalUserColumns(MediaTable.numRequiredColumns());
    var mediaTable = MediaTable.create('media_table', additionalMediaColumns);
    var mediaColumns = mediaTable.getUserColumns().getColumnNames();
    mediaColumns.length.should.be.equal(MediaTable.numRequiredColumns() + additionalMediaColumns.length);

    var idColumn = mediaTable.getIdColumn();
    should.exist(idColumn);
    idColumn.name.should.be.equal(MediaTable.COLUMN_ID);
    idColumn.dataType.should.be.equal(DataType.INTEGER);
    idColumn.notNull.should.be.equal(true);
    idColumn.primaryKey.should.be.equal(true);

    var dataColumn = mediaTable.dataColumn;
    should.exist(dataColumn);
    dataColumn.name.should.be.equal(MediaTable.COLUMN_DATA);
    dataColumn.dataType.should.be.equal(DataType.BLOB);
    dataColumn.notNull.should.be.equal(true);
    dataColumn.primaryKey.should.be.equal(false);

    var contentTypeColumn = mediaTable.contentTypeColumn;
    should.exist(contentTypeColumn);
    contentTypeColumn.name.should.be.equal(MediaTable.COLUMN_CONTENT_TYPE);
    contentTypeColumn.dataType.should.be.equal(DataType.TEXT);
    contentTypeColumn.notNull.should.be.equal(true);
    contentTypeColumn.primaryKey.should.be.equal(false);

    var additionalMappingColumns = RelatedTablesUtils.createAdditionalUserColumns(UserMappingTable.numRequiredColumns());
    var mappingTableName = 'features_media';
    var userMappingTable = UserMappingTable.create(mappingTableName, additionalMappingColumns);
    rte.has(userMappingTable.getTableName()).should.be.equal(false);
    userMappingTable.getUserColumns().getColumnNames().length.should.be.equal(UserMappingTable.numRequiredColumns() + additionalMappingColumns.length);

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
    rte.has(userMappingTable.getTableName()).should.be.equal(false);

    // Create the media table, content row, and relationship between the
	  // feature table and media table
    var contentsDao = geoPackage.contentsDao;
    var contentsTables = contentsDao.getTables();
    contentsTables.indexOf(mediaTable.getTableName()).should.be.equal(-1);
    var relationship = RelatedTablesExtension.RelationshipBuilder()
      .setBaseTableName(baseTableName)
      .setRelatedTable(mediaTable)
      .setUserMappingTable(userMappingTable);

    let extendedRelation = rte.addMediaRelationship(relationship);
    validateContents(mediaTable, mediaTable.contents);
    rte.has().should.be.equal(true);
    rte.has(userMappingTable.getTableName()).should.be.equal(true);
    should.exist(extendedRelation);
    relationships = rte.getRelationships();
    relationships.length.should.be.equal(1);
    geoPackage.isTable(mappingTableName).should.be.equal(true);
    geoPackage.isTable(mediaTable.getTableName()).should.be.equal(true);
    contentsDao.getTables().indexOf(mediaTable.getTableName()).should.not.be.equal(-1);
    validateContents(mediaTable, contentsDao.queryForId(mediaTable.getTableName()));
    MediaTable.RELATION_TYPE.dataType.should.be.equal(geoPackage.getTableType(mediaTable.getTableName()));
    geoPackage.isTableType(MediaTable.RELATION_TYPE.dataType, mediaTable.getTableName());

    var mediaDao = rte.getMediaDao(mediaTable);
    should.exist(mediaDao);
    mediaTable = mediaDao.table;
    should.exist(mediaTable);
    validateContents(mediaTable, mediaTable.contents);

    // Insert media rows

    var contentType = 'image/png';

    var mediaCount = 2 + Math.floor(Math.random() * 9);
    var mediaRowId = 0;

    for (var i = 0; i < mediaCount-1; i++) {
      var mediaRow = mediaDao.newRow();
      mediaRow.data = tileBuffer;
      mediaRow.contentType = contentType;
      RelatedTablesUtils.populateRow(mediaTable, mediaRow, MediaTable.requiredColumns());
      mediaRowId = mediaDao.create(mediaRow);
      mediaRowId.should.be.greaterThan(0);
    }

    // copy the last row insert and insert the final media row
    var mediaRowToCopy = mediaDao.queryForId(mediaRowId);
    mediaRowToCopy.resetId();
    var copiedMediaId = mediaDao.create(mediaRowToCopy);
    copiedMediaId.should.be.greaterThan(0);
    copiedMediaId.should.be.equal(mediaRowId + 1);
    mediaCount.should.be.equal(mediaDao.count());

    var featureDao = geoPackage.getFeatureDao(baseTableName);
    var allFeatures = featureDao.queryForAll();
    var featureIds = [];
    for (var i = 0; i < allFeatures.length; i++) {
      var row = featureDao.getRow(allFeatures[i]);
      featureIds.push(row.id);
    }

    var allMedia = mediaDao.queryForAll();
    var mediaIds = [];
    for (var i = 0; i < allMedia.length; i++) {
      var row = mediaDao.getRow(allMedia[i]);
      mediaIds.push(row.id);
    }

    // Insert user mapping rows between feature ids and media ids
    var userMappingDao = rte.getMappingDao(mappingTableName);
    for (var i = 0; i < 10; i++) {
      var userMappingRow = userMappingDao.newRow();
      userMappingRow.baseId = featureIds[Math.floor(Math.random() * featureIds.length)];
      userMappingRow.relatedId = mediaIds[Math.floor(Math.random() * mediaIds.length)];
      RelatedTablesUtils.populateRow(userMappingTable, userMappingRow, UserMappingTable.requiredColumns());
      var created = userMappingDao.create(userMappingRow);
      created.should.be.greaterThan(0);
    }

    userMappingDao.count().should.be.equal(10);

    // Validate the user mapping rows
    userMappingTable = userMappingDao.table;
    var mappingColumns = userMappingTable.getUserColumns().getColumnNames();
    var userMappingRows = userMappingDao.queryForAll();
    var count = userMappingRows.length;
    count.should.be.equal(10);
    var manualCount = 0;

    for (var i = 0; i < count; i++) {
      var userMappingRow = userMappingRows[i];
      var row = userMappingDao.getUserMappingRow(userMappingRow);
      row.hasId().should.be.equal(false);
      featureIds.indexOf(row.baseId).should.be.not.equal(-1);
      mediaIds.indexOf(row.relatedId).should.be.not.equal(-1);
      RelatedTablesUtils.validateUserRow(mappingColumns, row);
      RelatedTablesUtils.validateDublinCoreColumns(row);
      manualCount++;
    }

    manualCount.should.be.equal(count);

    var extendedRelationsDao = rte.extendedRelationDao;
    var featureBaseTableRelations = extendedRelationsDao.getBaseTableRelations(featureDao.getTableName());
    var featureTableRelations = extendedRelationsDao.getTableRelations(featureDao.getTableName());
    featureBaseTableRelations.length.should.be.equal(1);
    featureTableRelations.length.should.be.equal(1);
    featureBaseTableRelations[0].id.should.be.equal(featureTableRelations[0].id);
    extendedRelationsDao.getRelatedTableRelations(featureDao.getTableName()).length.should.be.equal(0);

    // Test the feature table relations
    for (i = 0; i < featureBaseTableRelations.length; i++) {
      // Test the relation
      var featureRelation = featureBaseTableRelations[i];
      featureRelation.id.should.be.greaterThan(0);
      featureDao.getTableName().should.be.equal(featureRelation.base_table_name);
      featureDao.getFeatureTable().getPkColumnName().should.be.equal(featureRelation.base_primary_column);
      mediaDao.getTableName().should.be.equal(featureRelation.related_table_name);
      mediaDao.table.getPkColumnName().should.be.equal(featureRelation.related_primary_column);
      MediaTable.RELATION_TYPE.name.should.be.equal(featureRelation.relation_name);

      // test the user mappings from the relation
      var userMappingDao = rte.getMappingDao(featureRelation.mapping_table_name);
      var totalMappedCount = userMappingDao.count();
      var mappings = userMappingDao.queryForAll();
      for (var m = 0; m < mappings.length; m++) {
        var userMappingRow = userMappingDao.getUserMappingRow(mappings[i]);
        featureIds.indexOf(userMappingRow.baseId).should.not.be.equal(-1);
        mediaIds.indexOf(userMappingRow.relatedId).should.not.be.equal(-1);
        RelatedTablesUtils.validateUserRow(mappingColumns, userMappingRow);
        RelatedTablesUtils.validateDublinCoreColumns(userMappingRow);
      }

      // get and test the media DAO
      mediaDao = rte.getMediaDao(featureRelation);
      should.exist(mediaDao);
      mediaTable = mediaDao.table;
      should.exist(mediaTable);
      validateContents(mediaTable, mediaTable.contents);

      var totalMapped = 0;

      // get and test the Media Rows mapped to each Feature Row
      var features = featureDao.queryForAll();
      for (var f = 0; f < features.length; f++) {
        var featureRow = featureDao.getRow(features[f]);
        var mappedIds = rte.getMappingsForBase(featureRelation, featureRow.id);
        var mediaRows = mediaDao.getRows(mappedIds);
        mediaRows.length.should.be.equal(mappedIds.length);

        mediaRows.forEach(function(row) {
          var mediaRow = row;
          mediaRow.hasId().should.be.equal(true);
          mediaRow.id.should.be.greaterThan(0);
          mediaIds.indexOf(mediaRow.id).should.not.be.equal(-1);
          mappedIds.indexOf(mediaRow.id).should.not.be.equal(-1);
          mediaRow.data.equals(tileBuffer).should.be.equal(true);
          contentType.should.be.equal(mediaRow.contentType);
          RelatedTablesUtils.validateUserRow(mediaColumns, mediaRow);
          RelatedTablesUtils.validateDublinCoreColumns(mediaRow);
        });

        totalMapped += mappedIds.length;
      }
      totalMappedCount.should.be.equal(totalMapped);
    }

    // Get the relations starting from the media table
    var mediaRelatedTableRelations = extendedRelationsDao.getRelatedTableRelations(mediaTable.getTableName());
    var mediaTableRelations = extendedRelationsDao.getTableRelations(mediaTable.getTableName());

    mediaRelatedTableRelations.length.should.be.equal(1);
    mediaTableRelations.length.should.be.equal(1);
    mediaRelatedTableRelations[0].id.should.be.equal(mediaTableRelations[0].id);
    extendedRelationsDao.getBaseTableRelations(mediaTable.getTableName()).length.should.be.equal(0);

    // Test the media table relations
    mediaRelatedTableRelations.forEach(function(mediaRelation) {

      // Test the relation
      mediaRelation.id.should.be.greaterThan(0);
      featureDao.getTableName().should.be.equal(mediaRelation.base_table_name);
      featureDao.getFeatureTable().getPkColumnName().should.be.equal(mediaRelation.base_primary_column);
      mediaDao.getTableName().should.be.equal(mediaRelation.related_table_name);
      mediaDao.table.getPkColumnName().should.be.equal(mediaRelation.related_primary_column);
      MediaTable.RELATION_TYPE.name.should.be.equal(mediaRelation.relation_name);
      mappingTableName.should.be.equal(mediaRelation.mapping_table_name);

      // Test the user mappings from the relation
      var userMappingDao = rte.getMappingDao(mediaRelation);
      var totalMappedCount = userMappingDao.count();
      var mappings = userMappingDao.queryForAll();
      mappings.forEach(function(row) {
        var userMappingRow = userMappingDao.getUserMappingRow(row);
        featureIds.indexOf(userMappingRow.baseId).should.not.be.equal(-1);
        mediaIds.indexOf(userMappingRow.relatedId).should.not.be.equal(-1);
        RelatedTablesUtils.validateUserRow(mappingColumns, userMappingRow);
        RelatedTablesUtils.validateDublinCoreColumns(userMappingRow);
      });

      // Get and test the feature DAO
      featureDao = geoPackage.getFeatureDao(featureDao.getTableName());
      should.exist(featureDao);
      var featureTable = featureDao.getFeatureTable();
      should.exist(featureTable);
      var featureContents = featureDao.getContents();
      should.exist(featureContents);
      ContentsDataType.FEATURES.should.be.equal(featureContents.data_type);
      featureTable.getTableName().should.be.equal(featureContents.getTableName());
      should.exist(featureContents.last_change);

      var medias = mediaDao.queryForAll();
      var totalMapped = 0;
      medias.forEach(function(row) {
        var mediaRow = mediaDao.getRow(row);
        var mappedIds = rte.getMappingsForRelated(mediaRelation.mapping_table_name, mediaRow.id);
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
    rte.has(userMappingTable.getTableName()).should.be.equal(false);
    var relationships = rte.getRelationships();
    relationships.length.should.be.equal(0);
    geoPackage.isTable(mappingTableName).should.be.equal(false);

    // Delete the media table and contents row
    geoPackage.isTable(mediaTable.getTableName());
    should.exist(contentsDao.queryForId(mediaTable.getTableName()));
    geoPackage.deleteTable(mediaTable.getTableName());
    geoPackage.isTable(mediaTable.getTableName()).should.be.equal(false);
    should.not.exist(contentsDao.queryForId(mediaTable.getTableName()));

    // Delete the related tables extension
    rte.removeExtension();

    rte.has().should.be.equal(false);
  });
});

var GeoPackageAPI = require('../../../../.')
  , DataType = require('../../../../lib/db/dataTypes')
  , ContentsDao = require('../../../../lib/core/contents/contentsDao')
  , RelatedTablesExtension = require('../../../../lib/extension/relatedTables')
  , UserMappingTable = require('../../../../lib/extension/relatedTables/userMappingTable')
  , MediaTable = require('../../../../lib/extension/relatedTables/mediaTable')
  , MediaRow = require('../../../../lib/extension/relatedTables/mediaRow')
  , testSetup = require('../../../fixtures/testSetup')
  , RelatedTablesUtils = require('./relatedTablesUtils')
  , should = require('chai').should()
  , wkx = require('wkx')
  , path = require('path');

describe('Related Media tests', function() {

  var testGeoPackage;
  var testPath = path.join(__dirname, '..', '..', '..', 'fixtures', 'tmp');
  var geopackage;

  var tileBuffer;

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

    var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'gdal_sample.gpkg');
    filename = path.join(__dirname, '..', '..', '..', 'fixtures', 'tmp', testSetup.createTempName());
    copyGeopackage(originalFilename, filename, function() {
      GeoPackageAPI.open(filename, function(err, gp) {
        geoPackage = gp;
        testSetup.loadTile(path.join(__dirname, '..', '..', '..', 'fixtures', 'tiles', '0', '0', '0.png'), function(err, buffer) {
          tileBuffer = buffer;
          done();
        });
      });
    });
  });

  function validateContents(mediaTable, contents) {
    should.exist(contents);
    should.exist(contents.data_type);
    MediaTable.RELATION_TYPE.dataType.should.be.equal(contents.data_type);
    mediaTable.table_name.should.be.equal(contents.table_name);
    should.exist(contents.last_change);
  }

  it('should create a media relationship', function() {
    this.timeout(5000);
    var rte = geoPackage.getRelatedTablesExtension();
    rte.has().should.be.equal(false);

    var extendedRelationships = rte.getRelationships();
    extendedRelationships.length.should.be.equal(0);

    var baseTableName = geoPackage.getFeatureTables()[0];

    var additionalMediaColumns = RelatedTablesUtils.createAdditionalUserColumns(MediaTable.numRequiredColumns());
    var mediaTable = MediaTable.create('media_table', additionalMediaColumns);
    var mediaColumns = mediaTable.columnNames;
    mediaColumns.length.should.be.equal(MediaTable.numRequiredColumns() + additionalMediaColumns.length);

    var idColumn = mediaTable.getIdColumn();
    should.exist(idColumn);
    idColumn.name.should.be.equal(MediaTable.COLUMN_ID);
    idColumn.dataType.should.be.equal(DataType.GPKGDataType.GPKG_DT_INTEGER);
    idColumn.notNull.should.be.equal(true);
    idColumn.primaryKey.should.be.equal(true);

    var dataColumn = mediaTable.getDataColumn();
    should.exist(dataColumn);
    dataColumn.name.should.be.equal(MediaTable.COLUMN_DATA);
    dataColumn.dataType.should.be.equal(DataType.GPKGDataType.GPKG_DT_BLOB);
    dataColumn.notNull.should.be.equal(true);
    dataColumn.primaryKey.should.be.equal(false);

    var contentTypeColumn = mediaTable.getContentTypeColumn();
    should.exist(contentTypeColumn);
    contentTypeColumn.name.should.be.equal(MediaTable.COLUMN_CONTENT_TYPE);
    contentTypeColumn.dataType.should.be.equal(DataType.GPKGDataType.GPKG_DT_TEXT);
    contentTypeColumn.notNull.should.be.equal(true);
    contentTypeColumn.primaryKey.should.be.equal(false);

    var additionalMappingColumns = RelatedTablesUtils.createAdditionalUserColumns(UserMappingTable.numRequiredColumns());
    var mappingTableName = 'features_media';
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

    // Create the media table, content row, and relationship between the
	  // feature table and media table

    var contentsDao = geoPackage.getContentsDao();
    var contentsTables = contentsDao.getTables();
    contentsTables.indexOf(mediaTable.table_name).should.be.equal(-1);
    var relationship = RelatedTablesExtension.RelationshipBuilder()
      .setBaseTableName(baseTableName)
      .setRelatedTable(mediaTable)
      .setUserMappingTable(userMappingTable);

    return rte.addMediaRelationship(relationship)
      .then(function(extendedRelation) {
        validateContents(mediaTable, mediaTable.contents);
        rte.has().should.be.equal(true);
        rte.has(userMappingTable.table_name).should.be.equal(true);
        should.exist(extendedRelation);
        var relationships = rte.getRelationships();
        relationships.length.should.be.equal(1);
        geoPackage.isTable(mappingTableName).should.be.equal(true);
        geoPackage.isTable(mediaTable.table_name).should.be.equal(true);
        contentsDao.getTables().indexOf(mediaTable.table_name).should.not.be.equal(-1);
        validateContents(mediaTable, contentsDao.queryForId(mediaTable.table_name));
        MediaTable.RELATION_TYPE.dataType.should.be.equal(geoPackage.getTableType(mediaTable.table_name));
        geoPackage.isTableType(MediaTable.RELATION_TYPE.dataType, mediaTable.table_name);

        var mediaDao = rte.getMediaDao(mediaTable);
        should.exist(mediaDao);
        mediaTable = mediaDao.mediaTable;
        should.exist(mediaTable);
        validateContents(mediaTable, mediaTable.contents);

        // Insert media rows

        var contentType = 'image/png';

        var mediaCount = 2 + Math.floor(Math.random() * 9);
        var mediaRowId = 0;

        for (var i = 0; i < mediaCount-1; i++) {
          var mediaRow = mediaDao.newRow();
          mediaRow.setData(tileBuffer);
          mediaRow.setContentType(contentType);
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
          featureIds.push(row.getId());
        }

        var allMedia = mediaDao.queryForAll();
        var mediaIds = [];
        for (var i = 0; i < allMedia.length; i++) {
          var row = mediaDao.getRow(allMedia[i]);
          mediaIds.push(row.getId());
        }

        // Insert user mapping rows between feature ids and media ids
        var userMappingDao = rte.getMappingDao(mappingTableName);
        for (var i = 0; i < 10; i++) {
          var userMappingRow = userMappingDao.newRow();
          userMappingRow.setBaseId(featureIds[Math.floor(Math.random() * featureIds.length)]);
          userMappingRow.setRelatedId(mediaIds[Math.floor(Math.random() * mediaIds.length)]);
          RelatedTablesUtils.populateRow(userMappingTable, userMappingRow, UserMappingTable.requiredColumns());
          var created = userMappingDao.create(userMappingRow);
          created.should.be.greaterThan(0);
        }

        userMappingDao.count().should.be.equal(10);

        // Validate the user mapping rows
        userMappingTable = userMappingDao.getTable();
        var mappingColumns = userMappingTable.columnNames;
        var userMappingRows = userMappingDao.queryForAll();
        var count = userMappingRows.length;
        count.should.be.equal(10);
        var manualCount = 0;

        for (var i = 0; i < count; i++) {
          var userMappingRow = userMappingRows[i];
          var row = userMappingDao.getUserMappingRow(userMappingRow);
          row.hasId().should.be.equal(false);
          featureIds.indexOf(row.getBaseId()).should.be.not.equal(-1);
          mediaIds.indexOf(row.getRelatedId()).should.be.not.equal(-1);
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
          featureDao.getFeatureTable().getPkColumn().name.should.be.equal(featureRelation.base_primary_column);
          mediaDao.table_name.should.be.equal(featureRelation.related_table_name);
          mediaDao.getTable().getPkColumn().name.should.be.equal(featureRelation.related_primary_column);
          MediaTable.RELATION_TYPE.name.should.be.equal(featureRelation.relation_name);

          // test the user mappings from the relation
          var userMappingDao = rte.getMappingDao(featureRelation.mapping_table_name);
          var totalMappedCount = userMappingDao.count();
          var mappings = userMappingDao.queryForAll();
          for (var m = 0; m < mappings.length; m++) {
            var userMappingRow = userMappingDao.getUserMappingRow(mappings[i]);
            featureIds.indexOf(userMappingRow.getBaseId()).should.not.be.equal(-1);
            mediaIds.indexOf(userMappingRow.getRelatedId()).should.not.be.equal(-1);
            RelatedTablesUtils.validateUserRow(mappingColumns, userMappingRow);
            RelatedTablesUtils.validateDublinCoreColumns(userMappingRow);
          }

          // get and test the media DAO
          mediaDao = rte.getMediaDao(featureRelation);
          should.exist(mediaDao);
          mediaTable = mediaDao.getTable();
          should.exist(mediaTable);
          validateContents(mediaTable, mediaTable.contents);

          var totalMapped = 0;

          // get and test the Media Rows mapped to each Feature Row
          var features = featureDao.queryForAll();
          for (var f = 0; f < features.length; f++) {
            var featureRow = featureDao.getRow(features[f]);
            var mappedIds = rte.getMappingsForBase(featureRelation, featureRow.getId());
            var mediaRows = mediaDao.getRows(mappedIds);
            mediaRows.length.should.be.equal(mappedIds.length);

            mediaRows.forEach(function(row) {
              var mediaRow = mediaDao.getRow(row);
              mediaRow.hasId().should.be.equal(true);
              mediaRow.getId().should.be.greaterThan(0);
              mediaIds.indexOf(mediaRow.getId()).should.not.be.equal(-1);
              mappedIds.indexOf(mediaRow.getId()).should.not.be.equal(-1);
              mediaRow.getData().equals(tileBuffer).should.be.equal(true);
              contentType.should.be.equal(mediaRow.getContentType());
              RelatedTablesUtils.validateUserRow(mediaColumns, mediaRow);
              RelatedTablesUtils.validateDublinCoreColumns(mediaRow);
            });

            totalMapped += mappedIds.length;
          }
          totalMappedCount.should.be.equal(totalMapped);
        }

        // Get the relations starting from the media table
        var mediaRelatedTableRelations = extendedRelationsDao.getRelatedTableRelations(mediaTable.table_name);
        var mediaTableRelations = extendedRelationsDao.getTableRelations(mediaTable.table_name);

        mediaRelatedTableRelations.length.should.be.equal(1);
        mediaTableRelations.length.should.be.equal(1);
        mediaRelatedTableRelations[0].id.should.be.equal(mediaTableRelations[0].id);
        extendedRelationsDao.getBaseTableRelations(mediaTable.table_name).length.should.be.equal(0);

        // Test the media table relations
        mediaRelatedTableRelations.forEach(function(mediaRelation) {

          // Test the relation
          mediaRelation.id.should.be.greaterThan(0);
          featureDao.table_name.should.be.equal(mediaRelation.base_table_name);
          featureDao.getFeatureTable().getPkColumn().name.should.be.equal(mediaRelation.base_primary_column);
          mediaDao.table_name.should.be.equal(mediaRelation.related_table_name);
          mediaDao.getTable().getPkColumn().name.should.be.equal(mediaRelation.related_primary_column);
          MediaTable.RELATION_TYPE.name.should.be.equal(mediaRelation.relation_name);
          mappingTableName.should.be.equal(mediaRelation.mapping_table_name);

          // Test the user mappings from the relation
          var userMappingDao = rte.getMappingDao(mediaRelation);
          var totalMappedCount = userMappingDao.count();
          var mappings = userMappingDao.queryForAll();
          mappings.forEach(function(row) {
            var userMappingRow = userMappingDao.getUserMappingRow(row);
            featureIds.indexOf(userMappingRow.getBaseId()).should.not.be.equal(-1);
            mediaIds.indexOf(userMappingRow.getRelatedId()).should.not.be.equal(-1);
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

          var medias = mediaDao.queryForAll();
          var totalMapped = 0;
          medias.forEach(function(row) {
            var mediaRow = mediaDao.getRow(row);
            var mappedIds = rte.getMappingsForRelated(mediaRelation.mapping_table_name, mediaRow.getId());
            mappedIds.forEach(function(mappedId){
              var featureRow = featureDao.queryForId(mappedId);
              should.exist(featureRow);
              featureRow.hasId().should.be.equal(true);
              featureRow.getId().should.be.greaterThan(0);
              featureIds.indexOf(featureRow.getId()).should.not.equal(-1);
              mappedIds.indexOf(featureRow.getId()).should.not.equal(-1);
              if (featureRow.getValueWithColumnName(featureRow.getGeometryColumn().name)) {
                var geometryData = featureRow.getGeometry();
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
        geoPackage.isTable(mediaTable.table_name);
        should.exist(contentsDao.queryForId(mediaTable.table_name));
        geoPackage.deleteTable(mediaTable.table_name);
        geoPackage.isTable(mediaTable.table_name).should.be.equal(false);
        should.exist(contentsDao.queryForId(mediaTable.table_name));

        // Delete the related tables extension
        rte.removeExtension();
        rte.has().should.be.equal(false);
      });
  });
});

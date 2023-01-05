import { default as testSetup } from '../../../testSetup'
import {RelatedTablesExtension} from '../../../../lib/extension/related/relatedTablesExtension'
import { MediaTableMetadata } from "../../../../lib/extension/related/media/mediaTableMetadata";
import { UserMappingRow } from "../../../../lib/extension/related/userMappingRow";
import { MediaRow } from "../../../../lib/extension/related/media/mediaRow";
import { UserTableMetadataConstants } from "../../../../lib/user/userTableMetadataConstants";

let DataType = require('../../../../lib/db/geoPackageDataType').GeoPackageDataType
  , ContentsDataType = require('../../../../lib/contents/contentsDataType').ContentsDataType
  , UserMappingTable = require('../../../../lib/extension/related/userMappingTable').UserMappingTable
  , MediaTable = require('../../../../lib/extension/related/media/mediaTable').MediaTable
  , RelatedTablesUtils = require('./relatedTablesUtils')
  , should = require('chai').should()
  , path = require('path');

describe('Related Media tests', function() {

  let testGeoPackage;
  let testPath = path.join(__dirname, '..', '..', '..', 'fixtures', 'tmp');
  let geoPackage;

  let tileBuffer;

  let filename;
  beforeEach('create the GeoPackage connection', async function() {
    let originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'gdal_sample.gpkg');
    // @ts-ignore
    let result = await copyAndOpenGeopackage(originalFilename);
    filename = result.path;
    geoPackage = result.geoPackage;

    // @ts-ignore
    tileBuffer = await loadTile(path.join(__dirname, '..', '..', '..', 'fixtures', 'tiles', '0', '0', '0.png'));
  });

  afterEach('delete the geoPackage', async function() {
    await testSetup.deleteGeoPackage(filename);
  })

  function validateContents(mediaTable, contents) {
    should.exist(contents);
    should.exist(contents.getDataType());
    MediaTable.RELATION_TYPE.dataType.should.be.equal(contents.getDataTypeName());
    mediaTable.getTableName().should.be.equal(contents.getTableName());
    should.exist(contents.getLastChange());
  }

  it('should create a media relationship', function() {
    try {

      this.timeout(5000);
      let rte = geoPackage.getRelatedTablesExtension();
      rte.has().should.be.equal(false);

      let extendedRelationships = rte.getRelationships();
      extendedRelationships.length.should.be.equal(0);

      let baseTableName = geoPackage.getFeatureTables()[0];

      let additionalMediaColumns = RelatedTablesUtils.createAdditionalUserColumns();
      let mediaTable = MediaTable.create(MediaTableMetadata.create('media_table', additionalMediaColumns));
      let mediaColumns = mediaTable.getUserColumns().getColumnNames();
      mediaColumns.length.should.be.equal(MediaTable.numRequiredColumns() + additionalMediaColumns.length);

      let idColumn = mediaTable.getIdColumn();
      should.exist(idColumn);
      idColumn.getName().should.be.equal(UserTableMetadataConstants.DEFAULT_ID_COLUMN_NAME);
      idColumn.getDataType().should.be.equal(DataType.INTEGER);
      idColumn.isNotNull().should.be.equal(true);
      idColumn.isPrimaryKey().should.be.equal(true);

      let dataColumn = mediaTable.getDataColumn();
      should.exist(dataColumn);
      dataColumn.getName().should.be.equal(MediaTable.COLUMN_DATA);
      dataColumn.getDataType().should.be.equal(DataType.BLOB);
      dataColumn.isNotNull().should.be.equal(true);
      dataColumn.isPrimaryKey().should.be.equal(false);

      let contentTypeColumn = mediaTable.getContentTypeColumn();
      should.exist(contentTypeColumn);
      contentTypeColumn.getName().should.be.equal(MediaTable.COLUMN_CONTENT_TYPE);
      contentTypeColumn.getDataType().should.be.equal(DataType.TEXT);
      contentTypeColumn.isNotNull().should.be.equal(true);
      contentTypeColumn.isPrimaryKey().should.be.equal(false);

      let additionalMappingColumns = RelatedTablesUtils.createAdditionalUserColumns();
      let mappingTableName = 'features_media';
      let userMappingTable = UserMappingTable.create(mappingTableName, additionalMappingColumns);
      rte.hasExtensionForMappingTable(userMappingTable.getTableName()).should.be.equal(false);
      userMappingTable.getUserColumns().getColumnNames().length.should.be.equal(UserMappingTable.numRequiredColumns() + additionalMappingColumns.length);

      let baseIdColumn = userMappingTable.getBaseIdColumn();
      should.exist(baseIdColumn);
      baseIdColumn.getName().should.be.equal(UserMappingTable.COLUMN_BASE_ID);
      baseIdColumn.getDataType().should.be.equal(DataType.INTEGER);
      baseIdColumn.isNotNull().should.be.equal(true);
      baseIdColumn.isPrimaryKey().should.be.equal(false);

      let relatedIdColumn = userMappingTable.getRelatedIdColumn();
      should.exist(relatedIdColumn);
      relatedIdColumn.getName().should.be.equal(UserMappingTable.COLUMN_RELATED_ID);
      relatedIdColumn.getDataType().should.be.equal(DataType.INTEGER);
      relatedIdColumn.isNotNull().should.be.equal(true);
      relatedIdColumn.isPrimaryKey().should.be.equal(false);
      rte.hasExtensionForMappingTable(userMappingTable.getTableName()).should.be.equal(false);

      // Create the media table, content row, and relationship between the
      // feature table and media table
      let contentsDao = geoPackage.getContentsDao();
      let contentsTables = contentsDao.getTables();
      contentsTables.indexOf(mediaTable.getTableName()).should.be.equal(-1);

      let extendedRelation = rte.addMediaRelationshipWithMappingTable(baseTableName, mediaTable, userMappingTable);
      validateContents(mediaTable, mediaTable.getContents());
      rte.has().should.be.equal(true);
      rte.hasExtensionForMappingTable(userMappingTable.getTableName()).should.be.equal(true);
      should.exist(extendedRelation);
      let relationships = rte.getRelationships();
      relationships.length.should.be.equal(1);
      geoPackage.isTable(mappingTableName).should.be.equal(true);
      geoPackage.isTable(mediaTable.getTableName()).should.be.equal(true);
      contentsDao.getTables().indexOf(mediaTable.getTableName()).should.not.be.equal(-1);
      validateContents(mediaTable, contentsDao.queryForId(mediaTable.getTableName()));
      MediaTable.RELATION_TYPE.dataType.should.be.equal(geoPackage.getTableType(mediaTable.getTableName()));
      geoPackage.isTableType(MediaTable.RELATION_TYPE.dataType, mediaTable.getTableName());

      let mediaDao = rte.getMediaDao('media_table');
      should.exist(mediaDao);
      mediaTable = mediaDao.getTable();
      should.exist(mediaTable);
      validateContents(mediaTable, mediaTable.getContents());

      // Insert media rows

      const contentType = 'image/png';

      let mediaCount = 2 + Math.floor(Math.random() * 9);
      let mediaRowId = 0;

      for (let i = 0; i < mediaCount - 1; i++) {
        const mediaRow = mediaDao.newRow();
        mediaRow.setData(tileBuffer);
        mediaRow.setContentType(contentType);
        RelatedTablesUtils.populateUserRow(mediaTable, mediaRow, MediaTable.requiredColumns());
        mediaRowId = mediaDao.create(mediaRow);
        mediaRowId.should.be.greaterThan(0);
      }

      // copy the last row insert and insert the final media row
      let mediaRowToCopy = mediaDao.queryForIdRow(mediaRowId);
      mediaRowToCopy.resetId();
      let copiedMediaId = mediaDao.create(mediaRowToCopy);
      copiedMediaId.should.be.greaterThan(0);
      copiedMediaId.should.be.equal(mediaRowId + 1);
      mediaCount.should.be.equal(mediaDao.count());

      let featureDao = geoPackage.getFeatureDao(baseTableName);
      let resultSet = featureDao.queryForAll();
      let featureIds = [];
      while (resultSet.moveToNext()) {
        const row = resultSet.getRow();
        featureIds.push(row.getId());
      }
      resultSet.close();

      resultSet = mediaDao.queryForAll();
      let mediaIds = [];
      while (resultSet.moveToNext()) {
        const row = resultSet.getRow();
        mediaIds.push(row.getId());
      }
      resultSet.close()

      // Insert user mapping rows between feature ids and media ids
      let userMappingDao = rte.getMappingDao(mappingTableName);
      for (let i = 0; i < 10; i++) {
        const userMappingRow = userMappingDao.newRow();
        userMappingRow.setBaseId(featureIds[Math.floor(Math.random() * featureIds.length)]);
        userMappingRow.setRelatedId(mediaIds[Math.floor(Math.random() * mediaIds.length)]);
        RelatedTablesUtils.populateUserRow(userMappingTable, userMappingRow, UserMappingTable.requiredColumns());
        const created = userMappingDao.create(userMappingRow);
        created.should.be.greaterThan(0);
      }

      userMappingDao.count().should.be.equal(10);

      // Validate the user mapping rows
      userMappingTable = userMappingDao.getTable();
      let mappingColumns = userMappingTable.getUserColumns().getColumnNames();
      resultSet = userMappingDao.queryForAll();
      let count = resultSet.getCount();
      count.should.be.equal(10);
      let manualCount = 0;
      while (resultSet.moveToNext()) {
        let row = new UserMappingRow(resultSet.getRow());
        row.hasId().should.be.equal(false);
        featureIds.indexOf(row.getBaseId()).should.be.not.equal(-1);
        mediaIds.indexOf(row.getRelatedId()).should.be.not.equal(-1);
        RelatedTablesUtils.validateUserRow(mappingColumns, row);
        RelatedTablesUtils.validateDublinCoreColumns(row);
        manualCount++;
      }
      resultSet.close()

      manualCount.should.be.equal(count);

      let extendedRelationsDao = rte.getExtendedRelationsDao();
      let featureBaseTableRelations = extendedRelationsDao.getBaseTableRelations(featureDao.getTableName());
      let featureTableRelations = extendedRelationsDao.getTableRelations(featureDao.getTableName());
      featureBaseTableRelations.length.should.be.equal(1);
      featureTableRelations.length.should.be.equal(1);
      featureBaseTableRelations[0].getId().should.be.equal(featureTableRelations[0].getId());
      extendedRelationsDao.getRelatedTableRelations(featureDao.getTableName()).length.should.be.equal(0);

      // Test the feature table relations
      for (let i = 0; i < featureBaseTableRelations.length; i++) {
        // Test the relation
        let featureRelation = featureBaseTableRelations[i];
        featureRelation.getId().should.be.greaterThan(0);
        featureDao.getTableName().should.be.equal(featureRelation.getBaseTableName());
        featureDao.getTable().getPkColumnName().should.be.equal(featureRelation.getBasePrimaryColumn());
        mediaDao.getTableName().should.be.equal(featureRelation.getRelatedTableName());
        mediaDao.getTable().getPkColumnName().should.be.equal(featureRelation.getRelatedPrimaryColumn());
        MediaTable.RELATION_TYPE.name.should.be.equal(featureRelation.getRelationName());

        // test the user mappings from the relation
        userMappingDao = rte.getMappingDaoWithExtendedRelation(featureRelation);
        let totalMappedCount = userMappingDao.count();
        resultSet = userMappingDao.queryForAll();
        while (resultSet.moveToNext()) {
          let userMappingRow = new UserMappingRow(resultSet.getRow());
          featureIds.indexOf(userMappingRow.getBaseId()).should.not.be.equal(-1);
          mediaIds.indexOf(userMappingRow.getRelatedId()).should.not.be.equal(-1);
          RelatedTablesUtils.validateUserRow(mappingColumns, userMappingRow);
          RelatedTablesUtils.validateDublinCoreColumns(userMappingRow);
        }
        resultSet.close()

        // get and test the media DAO
        mediaDao = rte.getMediaDaoWithExtendedRelation(featureRelation);
        should.exist(mediaDao);
        mediaTable = mediaDao.getTable();
        should.exist(mediaTable);
        validateContents(mediaTable, mediaTable.getContents());

        let totalMapped = 0;

        // get and test the Media Rows mapped to each Feature Row
        resultSet = featureDao.queryForAll();
        while (resultSet.moveToNext()) {
          let featureRow = resultSet.getRow();
          let mappedIds = rte.getMappingsForBaseWithExtendedRelation(featureRelation, featureRow.getId());
          let mediaRows = mediaDao.getRows(mappedIds);
          mediaRows.length.should.be.equal(mappedIds.length);

          mediaRows.forEach(function(row) {
            let mediaRow = row;
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
        resultSet.close();
        totalMappedCount.should.be.equal(totalMapped);
      }

      // Get the relations starting from the media table
      let mediaRelatedTableRelations = extendedRelationsDao.getRelatedTableRelations(mediaTable.getTableName());
      let mediaTableRelations = extendedRelationsDao.getTableRelations(mediaTable.getTableName());

      mediaRelatedTableRelations.length.should.be.equal(1);
      mediaTableRelations.length.should.be.equal(1);
      mediaRelatedTableRelations[0].getId().should.be.equal(mediaTableRelations[0].getId());
      extendedRelationsDao.getBaseTableRelations(mediaTable.getTableName()).length.should.be.equal(0);

      // Test the media table relations
      mediaRelatedTableRelations.forEach(function(mediaRelation) {
        // Test the relation
        mediaRelation.getId().should.be.greaterThan(0);
        featureDao.getTableName().should.be.equal(mediaRelation.getBaseTableName());
        featureDao.getTable().getPkColumnName().should.be.equal(mediaRelation.getBasePrimaryColumn());
        mediaDao.getTableName().should.be.equal(mediaRelation.getRelatedTableName());
        mediaDao.getTable().getPkColumnName().should.be.equal(mediaRelation.getRelatedPrimaryColumn());
        MediaTable.RELATION_TYPE.name.should.be.equal(mediaRelation.getRelationName());
        mappingTableName.should.be.equal(mediaRelation.getMappingTableName());

        // Test the user mappings from the relation
        let userMappingDao = rte.getMappingDaoWithExtendedRelation(mediaRelation);
        let totalMappedCount = userMappingDao.count();
        resultSet = userMappingDao.queryForAll();
        while (resultSet.moveToNext()) {
          const userMappingRow = new UserMappingRow(resultSet.getRow());
          featureIds.indexOf(userMappingRow.getBaseId()).should.not.be.equal(-1);
          mediaIds.indexOf(userMappingRow.getRelatedId()).should.not.be.equal(-1);
          RelatedTablesUtils.validateUserRow(mappingColumns, userMappingRow);
          RelatedTablesUtils.validateDublinCoreColumns(userMappingRow);
        }
        resultSet.close();

        // Get and test the feature DAO
        featureDao = geoPackage.getFeatureDao(featureDao.getTableName());
        should.exist(featureDao);
        let featureTable = featureDao.getTable();
        should.exist(featureTable);
        let featureContents = featureDao.getContents();
        should.exist(featureContents);
        ContentsDataType.FEATURES.should.be.equal(featureContents.getDataType());
        featureTable.getTableName().should.be.equal(featureContents.getTableName());
        should.exist(featureContents.getLastChange());

        resultSet = mediaDao.queryForAll();
        let totalMapped = 0;
        while (resultSet.moveToNext()) {
          let mediaRow = new MediaRow(resultSet.getRow());
          let mappedIds = rte.getMappingsForRelated(mediaRelation.getMappingTableName(), mediaRow.getId());
          mappedIds.forEach(function(mappedId){
            let featureRow = featureDao.queryForIdRow(mappedId);
            should.exist(featureRow);
            featureRow.hasId().should.be.equal(true);
            featureRow.getId().should.be.greaterThan(0);
            featureIds.indexOf(featureRow.getId()).should.not.equal(-1);
            mappedIds.indexOf(featureRow.getId()).should.not.equal(-1);
            if (featureRow.getValue(featureRow.getGeometryColumnName())) {
              let geometryData = featureRow.getGeometry();
              should.exist(geometryData);
              if (!geometryData.empty) {
                should.exist(geometryData.getGeometry());
              }
            }
          });
          totalMapped += mappedIds.length;
        }
        resultSet.close()
        totalMapped.should.be.equal(totalMappedCount);
      });

      // get the first row
      let userMappingRow = null
      resultSet = userMappingDao.queryForAll();
      while (resultSet.moveToNext()) {
        userMappingRow = new UserMappingRow(resultSet.getRow());
        break;
      }
      resultSet.close()

      // Delete a single mapping
      let countOfIds = userMappingDao.countByIdsWithUserMappingRow(userMappingRow);
      countOfIds.should.be.equal(userMappingDao.deleteByIdsWithUserMappingRow(userMappingRow));
      userMappingDao.count().should.be.equal(10 - countOfIds);

      // Delete the relationship and user mapping table
      rte.removeRelationshipWithExtendedRelation(extendedRelation);
      rte.hasExtensionForMappingTable(userMappingTable.getTableName()).should.be.equal(false);
      relationships = rte.getRelationships();
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
    } catch (e) {
      console.error(e);
    }
  });
});

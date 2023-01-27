import { default as testSetup } from '../../../testSetup';

var DataType = require('../../../../lib/db/geoPackageDataType').GeoPackageDataType,
  Verification = require('../../../verification'),
  ContentsDataType = require('../../../../lib/contents/contentsDataType').ContentsDataType,
  UserMappingTable = require('../../../../lib/extension/related/userMappingTable').UserMappingTable,
  RelatedTablesUtils = require('./relatedTablesUtils'),
  BoundingBox = require('../../../../lib/boundingBox').BoundingBox,
  should = require('chai').should(),
  path = require('path');

describe('Related Tile tests', function () {
  var geoPackage;
  var filename;
  beforeEach('create the GeoPackage connection', async function () {
    var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'gdal_sample.gpkg');

    let result = await copyAndOpenGeopackage(originalFilename);
    filename = result.path;
    geoPackage = result.geoPackage;
  });

  afterEach('delete the geoPackage', async function () {
    await testSetup.deleteGeoPackage(filename);
  });

  var tileMatrixSet;
  var tileMatrixSetBoundingBox = BoundingBox.worldWebMercator();
  var tileTableName = 'OSM';

  function validateContents(tileTable, contents) {
    should.exist(contents);
    should.exist(contents.getDataType());
    'tiles'.should.be.equal(contents.getDataTypeName());
    tileTable.getTableName().should.be.equal(contents.getTableName());
    should.exist(contents.getLastChange());
  }

  function createTiles() {
    var contentsBoundingBox = new BoundingBox(-180, -85.0511287798066, 180, 85.0511287798066);
    var contentsSrsId = 4326;
    var tileMatrixSetSrsId = 3857;
    geoPackage.getSpatialReferenceSystemDao().createWebMercator();
    tileMatrixSet = geoPackage.createTileTableWithTableName(
      tileTableName,
      contentsBoundingBox,
      contentsSrsId,
      tileMatrixSetBoundingBox,
      tileMatrixSetSrsId,
    );
    Verification.verifyTileMatrixSet(geoPackage).should.be.equal(true);
    Verification.verifyContentsForTable(geoPackage, tileTableName).should.be.equal(true);
    Verification.verifyTableExists(geoPackage, tileTableName).should.be.equal(true);
    geoPackage.createStandardWebMercatorTileMatrix(tileMatrixSetBoundingBox, tileMatrixSet, 0, 1);

    var zooms = [0, 1];

    return zooms.reduce(function (zoomSequence, zoom) {
      return zoomSequence.then(function () {
        var xtiles = [];
        var tileCount = Math.pow(2, zoom);
        for (var i = 0; i < tileCount; i++) {
          xtiles.push(i);
        }
        return xtiles.reduce(function (xSequence, x) {
          return xSequence.then(function () {
            var ytiles = [];
            var tileCount = Math.pow(2, zoom);
            for (var i = 0; i < tileCount; i++) {
              ytiles.push(i);
            }
            return ytiles.reduce(function (ySequence, y) {
              return ySequence.then(function () {
                return new Promise(async function (resolve) {
                  let image = await loadTile(
                    path.join(
                      __dirname,
                      '..',
                      '..',
                      '..',
                      'fixtures',
                      'tiles',
                      zoom.toString(),
                      x.toString(),
                      y.toString() + '.png',
                    ),
                  );
                  resolve(geoPackage.addTile(image, tileTableName, zoom, y, x));
                });
              });
            }, Promise.resolve());
          });
        }, Promise.resolve());
      });
    }, Promise.resolve());
  }

  it('should create a tile relationship', function () {
    this.timeout(5000);
    return createTiles().then(function () {
      var rte = geoPackage.getRelatedTablesExtension();
      rte.has().should.be.equal(false);

      var extendedRelationships = rte.getRelationships();
      extendedRelationships.length.should.be.equal(0);

      var baseTableName = geoPackage.getFeatureTables()[0];

      var tileDao = geoPackage.getTileDao(tileTableName);

      var tileTable = tileDao.getTable();
      var idColumn = tileTable.getPkColumn();
      should.exist(idColumn);

      var additionalMappingColumns = RelatedTablesUtils.createAdditionalUserColumns();
      var mappingTableName = 'features_tiles';
      var userMappingTable = UserMappingTable.create(mappingTableName, additionalMappingColumns);
      rte.hasExtensionForMappingTable(userMappingTable.getTableName()).should.be.equal(false);
      userMappingTable
        .getUserColumns()
        .getColumnNames()
        .length.should.be.equal(UserMappingTable.numRequiredColumns() + additionalMappingColumns.length);

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

      // Create the media table, content row, and relationship between the
      // feature table and media table

      var contentsDao = geoPackage.getContentsDao();
      let extendedRelation = rte.addTilesRelationshipWithMappingTable(baseTableName, tileTableName, userMappingTable);
      validateContents(tileTable, contentsDao.queryForId(tileTableName));
      rte.has().should.be.equal(true);
      rte.hasExtensionForMappingTable(userMappingTable.getTableName()).should.be.equal(true);

      should.exist(extendedRelation);
      relationships = rte.getRelationships();
      relationships.length.should.be.equal(1);
      geoPackage.isTable(mappingTableName).should.be.equal(true);
      geoPackage.isTable(tileTableName).should.be.equal(true);
      contentsDao.getTables().indexOf(tileTableName).should.not.be.equal(-1);
      validateContents(tileTable, contentsDao.queryForId(tileTableName));
      geoPackage.getTableType(tileTableName).should.be.equal('tiles');
      geoPackage.isTableType('tiles', tileTableName);

      var featureDao = geoPackage.getFeatureDao(baseTableName);
      var featureResultSet = featureDao.queryForAll();
      var featureIds = [];
      while (featureResultSet.moveToNext()) {
        const row = featureResultSet.getRow();
        featureIds.push(row.getId());
      }
      featureResultSet.close();

      var tileResultSet = tileDao.queryForAll();
      var tileIds = [];
      while (tileResultSet.moveToNext()) {
        const row = tileResultSet.getRow();
        tileIds.push(row.getId());
      }
      tileResultSet.close();

      // Insert user mapping rows between feature ids and media ids
      var userMappingDao = rte.getMappingDao(userMappingTable.getTableName());
      for (var i = 0; i < 10; i++) {
        var userMappingRow = userMappingDao.newRow();
        userMappingRow.setBaseId(featureIds[Math.floor(Math.random() * featureIds.length)]);
        userMappingRow.setRelatedId(tileIds[Math.floor(Math.random() * tileIds.length)]);
        RelatedTablesUtils.populateUserRow(userMappingTable, userMappingRow, UserMappingTable.requiredColumns());
        var created = userMappingDao.create(userMappingRow);
        created.should.be.greaterThan(0);
      }

      userMappingDao.count().should.be.equal(10);

      // Validate the user mapping rows
      userMappingTable = userMappingDao.getTable();
      var mappingColumns = userMappingTable.getUserColumns().getColumnNames();
      var userMappingResultSet = userMappingDao.queryForAll();
      var count = userMappingResultSet.getCount();
      count.should.be.equal(10);
      var manualCount = 0;

      while (userMappingResultSet.moveToNext()) {
        userMappingRow = userMappingDao.getRowWithUserCustomRow(userMappingResultSet.getRow());
        userMappingRow.hasId().should.be.equal(false);
        featureIds.indexOf(userMappingRow.getBaseId()).should.be.not.equal(-1);
        tileIds.indexOf(userMappingRow.getRelatedId()).should.be.not.equal(-1);
        RelatedTablesUtils.validateUserRow(mappingColumns, userMappingRow);
        RelatedTablesUtils.validateDublinCoreColumns(userMappingRow);
        manualCount++;
      }

      manualCount.should.be.equal(count);

      var extendedRelationsDao = rte.getExtendedRelationsDao();
      var featureBaseTableRelations = extendedRelationsDao.getBaseTableRelations(featureDao.getTableName());
      var featureTableRelations = extendedRelationsDao.getTableRelations(featureDao.getTableName());
      featureBaseTableRelations.length.should.be.equal(1);
      featureTableRelations.length.should.be.equal(1);
      featureBaseTableRelations[0].getId().should.be.equal(featureTableRelations[0].getId());
      extendedRelationsDao.getRelatedTableRelations(featureDao.getTableName()).length.should.be.equal(0);

      // Test the feature table relations
      for (i = 0; i < featureBaseTableRelations.length; i++) {
        // Test the relation
        var featureRelation = featureBaseTableRelations[i];
        featureRelation.getId().should.be.greaterThan(0);
        featureDao.getTableName().should.be.equal(featureRelation.getBaseTableName());
        featureDao.getTable().getPkColumnName().should.be.equal(featureRelation.getBasePrimaryColumn());
        tileDao.getTableName().should.be.equal(featureRelation.getRelatedTableName());
        tileDao.getTable().getPkColumnName().should.be.equal(featureRelation.getRelatedPrimaryColumn());
        'tiles'.should.be.equal(featureRelation.getRelationName());

        // test the user mappings from the relation
        userMappingDao = rte.getMappingDao(featureRelation.getMappingTableName());
        var totalMappedCount = userMappingDao.count();
        var mappings = userMappingDao.queryForAll();
        while (mappings.moveToNext()) {
          userMappingRow = userMappingDao.getRowWithUserCustomRow(mappings.getRow());
          featureIds.indexOf(userMappingRow.getBaseId()).should.not.be.equal(-1);
          tileIds.indexOf(userMappingRow.getRelatedId()).should.not.be.equal(-1);
          RelatedTablesUtils.validateUserRow(mappingColumns, userMappingRow);
          RelatedTablesUtils.validateDublinCoreColumns(userMappingRow);
        }
        should.exist(tileTable);
        validateContents(tileTable, contentsDao.queryForId(tileTableName));

        var totalMapped = 0;

        // get and test the tile rows mapped to each Feature Row
        featureResultSet = featureDao.queryForAll();
        while (featureResultSet.moveToNext()) {
          var featureRow = featureResultSet.getRow();
          var mappedIds = rte.getMappingsForBase(featureRelation.getMappingTableName(), featureRow.getId());
          var tileRows = tileDao.queryForIdRows(mappedIds);
          tileRows.length.should.be.equal(mappedIds.length);

          tileRows.forEach((tileRow) => {
            tileRow.hasId().should.be.equal(true);
            tileRow.getId().should.be.greaterThan(0);
            tileIds.indexOf(tileRow.getId()).should.not.be.equal(-1);
          });

          totalMapped += mappedIds.length;
        }
        totalMappedCount.should.be.equal(totalMapped);
      }

      // Get the relations starting from the media table
      var tileRelatedTableRelations = extendedRelationsDao.getRelatedTableRelations(tileTable.getTableName());
      var tileTableRelations = extendedRelationsDao.getTableRelations(tileTable.getTableName());

      tileRelatedTableRelations.length.should.be.equal(1);
      tileTableRelations.length.should.be.equal(1);
      tileRelatedTableRelations[0].getId().should.be.equal(tileTableRelations[0].getId());
      extendedRelationsDao.getBaseTableRelations(tileTable.getTableName()).length.should.be.equal(0);

      // Test the tile table relations
      tileRelatedTableRelations.forEach(function (tileRelation) {
        // Test the relation
        tileRelation.getId().should.be.greaterThan(0);
        featureDao.getTableName().should.be.equal(tileRelation.getBaseTableName());
        featureDao.getTable().getPkColumnName().should.be.equal(tileRelation.getBasePrimaryColumn());
        tileDao.getTableName().should.be.equal(tileRelation.getRelatedTableName());
        tileDao.getTable().getPkColumnName().should.be.equal(tileRelation.getRelatedPrimaryColumn());
        'tiles'.should.be.equal(tileRelation.getRelationName());
        mappingTableName.should.be.equal(tileRelation.getMappingTableName());

        // Test the user mappings from the relation
        var userMappingDao = rte.getMappingDaoWithExtendedRelation(tileRelation);
        var totalMappedCount = userMappingDao.count();
        var mappings = userMappingDao.queryForAll();
        while (mappings.moveToNext()) {
          var userMappingRow = userMappingDao.getRowWithUserCustomRow(mappings.getRow());
          featureIds.indexOf(userMappingRow.getBaseId()).should.not.be.equal(-1);
          tileIds.indexOf(userMappingRow.getRelatedId()).should.not.be.equal(-1);
          RelatedTablesUtils.validateUserRow(mappingColumns, userMappingRow);
          RelatedTablesUtils.validateDublinCoreColumns(userMappingRow);
        }
        mappings.close();
        // Get and test the feature DAO
        featureDao = geoPackage.getFeatureDao(featureDao.getTableName());
        should.exist(featureDao);
        var featureTable = featureDao.getTable();
        should.exist(featureTable);
        var featureContents = featureDao.getContents();
        should.exist(featureContents);
        ContentsDataType.FEATURES.should.be.equal(featureContents.getDataType());
        featureTable.getTableName().should.be.equal(featureContents.getTableName());
        should.exist(featureContents.getLastChange());

        var tiles = tileDao.queryForAll();
        var totalMapped = 0;
        while (tiles.moveToNext()) {
          var tileRow = tiles.getRow();
          var mappedIds = rte.getMappingsForRelated(tileRelation.getMappingTableName(), tileRow.getId());
          const featureRows = featureDao.queryForIdRows(mappedIds);
          featureRows.forEach((featureRow) => {
            should.exist(featureRow);
            featureRow.hasId().should.be.equal(true);
            featureRow.getId().should.be.greaterThan(0);
            featureIds.indexOf(featureRow.getId()).should.not.equal(-1);
            mappedIds.indexOf(featureRow.getId()).should.not.equal(-1);
            if (featureRow.getGeometry() != null) {
              const geometryData = featureRow.getGeometry();
              if (!geometryData.isEmpty()) {
                should.exist(geometryData.getGeometry());
              }
            }
          });
          totalMapped += mappedIds.length;
        }
        tiles.close();
        totalMapped.should.be.equal(totalMappedCount);
      });

      // Delete a single mapping
      var countOfIds = userMappingDao.countByIdsWithUserMappingRow(userMappingRow);
      countOfIds.should.be.equal(userMappingDao.deleteByIdsWithUserMappingRow(userMappingRow));
      userMappingDao.count().should.be.equal(10 - countOfIds);

      // Delete the relationship and user mapping table
      rte.removeRelationshipWithExtendedRelation(extendedRelation);
      rte.hasExtensionForMappingTable(userMappingTable.getTableName()).should.be.equal(false);
      var relationships = rte.getRelationships();
      relationships.length.should.be.equal(0);
      geoPackage.isTable(mappingTableName).should.be.equal(false);

      // Delete the media table and contents row
      geoPackage.isTable(tileTable.getTableName());
      should.exist(contentsDao.queryForId(tileTable.getTableName()));
      geoPackage.deleteTable(tileTable.getTableName());
      geoPackage.isTable(tileTable.getTableName()).should.be.equal(false);
      should.not.exist(contentsDao.queryForId(tileTable.getTableName()));

      // Delete the related tables extension
      rte.removeExtension();
      rte.has().should.be.equal(false);
    });
  });
});

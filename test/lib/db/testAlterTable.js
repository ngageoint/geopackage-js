import { default as testSetup } from '../../testSetup'
import {TileScaling} from "../../../lib/extension/nga/scale/tileScaling";
import {TileScalingType} from "../../../lib/extension/nga/scale/tileScalingType";
import { FeatureConverter } from "@ngageoint/simple-features-geojson-js";
import { FeatureTableMetadata } from "../../../lib/features/user/featureTableMetadata";
import { FeatureIndexType } from "../../../lib/features/index/featureIndexType";

var FeatureColumn = require('../../../lib/features/user/featureColumn').FeatureColumn
  , FeatureTableStyles = require('../../../lib/extension/nga/style/featureTableStyles').FeatureTableStyles
  , GeometryColumns = require('../../../lib/features/columns/geometryColumns').GeometryColumns
  , AlterTable = require('../../../lib/db/alterTable').AlterTable
  , TableInfo = require('../../../lib/db/table/tableInfo').TableInfo
  , CoreSQLUtils = require('../../../lib/db/sqlUtils').SQLUtils
  , GeoPackageDataType = require('../../../lib/db/geoPackageDataType').GeoPackageDataType
  , GeoPackageGeometryData = require('../../../lib/geom/geoPackageGeometryData').GeoPackageGeometryData
  , GeometryType = require('@ngageoint/simple-features-js').GeometryType
  , TileMatrixDao = require('../../../lib/tiles/matrix/tileMatrixDao').TileMatrixDao
  , TileMatrixSetDao = require('../../../lib/tiles/matrixset/tileMatrixSetDao').TileMatrixSetDao
  , NGAExtensions = require('../../../lib/extension/nga/ngaExtensions').NGAExtensions
  , should = require('chai').should()
  , path = require('path')
  , _ = require('lodash');

describe('AlterTable tests', function() {

  var testGeoPackage = path.join(__dirname, '..', '..', 'fixtures', 'tmp', testSetup.createTempName());
  var geoPackage;
  var tableName = 'AlterTest_FeatureTable';
  var copyTableName = tableName + '_Copy';

  var featureTableStyles;
  var featureStyleExtension;

  beforeEach(async function() {
    geoPackage = await testSetup.createGeoPackage(testGeoPackage);

    var additionalColumns = [];
    additionalColumns.push(FeatureColumn.createColumn('name', GeoPackageDataType.TEXT, false, ""));
    additionalColumns.push(FeatureColumn.createColumn('_feature_id', GeoPackageDataType.TEXT, false, ""));
    additionalColumns.push(FeatureColumn.createColumn('_properties_id', GeoPackageDataType.TEXT, false, ""));
    additionalColumns.push(FeatureColumn.createColumn('test_col', GeoPackageDataType.INTEGER, true, 3));

    const geometryColumns = new GeometryColumns();
    geometryColumns.setTableName(tableName);
    geometryColumns.setColumnName('geom');
    geometryColumns.setGeometryType(GeometryType.GEOMETRY);
    geometryColumns.setZ(0);
    geometryColumns.setM(0);
    geometryColumns.setSrsId(4326);

    geoPackage.createFeatureTableWithFeatureTableMetadata(FeatureTableMetadata.create(geometryColumns, additionalColumns));

    const featureDao = geoPackage.getFeatureDao(tableName);

    const createRow = function(geoJson, name, properties, featureDao) {
      const featureRow = featureDao.newRow();
      const geometryData = GeoPackageGeometryData.createWithSrsId(featureDao.getSrsId(), FeatureConverter.toSimpleFeaturesGeometry({
        type: 'Feature',
        geometry: geoJson
      }));
      featureRow.setGeometry(geometryData);
      featureRow.setValueWithColumnName('name', name);
      featureRow.setValueWithColumnName('_feature_id', name);
      featureRow.setValueWithColumnName('_properties_id', 'properties' + name);
      if (!_.isNil(properties) && !_.isNil(properties.test_col)) {
        featureRow.setValueWithColumnName('test_col', properties.test_col);
      }
      return featureDao.create(featureRow);
    };
    const box1 = {
      "type": "Polygon",
      "coordinates": [[[-1, 1], [1, 1], [1, 3], [-1, 3], [-1, 1]]]
    };

    const box2 = {
      "type": "Polygon",
      "coordinates": [[[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]]
    };

    const line = {
      "type": "LineString",
      "coordinates": [[2, 3], [-1, 0]]
    };

    const point = {
      "type": "Point",
      "coordinates": [0.5, 1.5]
    };

    const point2 = {
      "type": "Point",
      "coordinates": [1.5, .5]
    };

    createRow(box1, 'box1', {}, featureDao);
    createRow(box2, 'box2', {}, featureDao);
    createRow(line, 'line', { 'test_col': 26 }, featureDao);
    createRow(line, 'line2', {}, featureDao);
    createRow(point, 'point', {}, featureDao);
    createRow(point2, 'point2', {}, featureDao);
    const indexer = geoPackage.getFeatureIndexManager(featureDao);
    indexer.setIndexLocation(FeatureIndexType.RTREE);
    indexer.index();
    featureStyleExtension = new NGAExtensions(geoPackage).getFeatureStyleExtension();
    featureStyleExtension.getOrCreateExtension(tableName);
    featureStyleExtension.getRelatedTables().getOrCreateExtension();
    featureStyleExtension.getContentsId().getOrCreateExtension();
    featureTableStyles = new FeatureTableStyles(geoPackage, tableName);
    featureTableStyles.createStyleRelationship();
  });

  afterEach(async function() {
    geoPackage.close();
    await testSetup.deleteGeoPackage(testGeoPackage);
  });

  it('should copy a feature table and it\'s content and it\'s extensions', function() {
    var featureDao = geoPackage.getFeatureDao(tableName);

    featureDao.count().should.be.equal(6);
    // rename table
    geoPackage.copyTable(tableName, copyTableName, true, true);

    // get feature dao for updated table name
    featureDao = geoPackage.getFeatureDao(copyTableName);
    featureDao.count().should.be.equal(6);

    // check if extensions were copied successfully
    featureStyleExtension.has(copyTableName).should.equal(true);
  });

  it('should copy a feature table and not it\'s content', function() {
    var featureDao = geoPackage.getFeatureDao(tableName);
    featureStyleExtension.has(tableName).should.equal(true);

    featureDao.count().should.be.equal(6);
    // rename table
    geoPackage.copyTable(tableName, copyTableName, false, true);

    // get feature dao for updated table name
    featureDao = geoPackage.getFeatureDao(copyTableName);
    featureDao.count().should.be.equal(0);

    // verify feature style extension was copied
    featureStyleExtension.has(copyTableName).should.equal(true);
  });


  it('should copy a feature table and not it\'s extensions', function() {
    var featureDao = geoPackage.getFeatureDao(tableName);

    featureDao.count().should.be.equal(6);
    // rename table
    geoPackage.copyTable(tableName, copyTableName, true, false);

    // get feature dao for updated table name
    featureDao = geoPackage.getFeatureDao(copyTableName);
    featureDao.count().should.be.equal(6);

    // verify feature style extension was not copied
    featureStyleExtension.has(copyTableName).should.equal(false);
  });

  it('should delete a table', function() {
    geoPackage.getConnection().tableExists(tableName).should.be.equal(true);
    geoPackage.deleteTable(tableName);
    geoPackage.getConnection().tableExists(tableName).should.be.equal(false);
    // verify feature style extension was deleted
    featureStyleExtension.has(tableName).should.equal(false);
  });

  it('should rename a feature table', function() {
    const newTableName = tableName + '_New';
    geoPackage.getConnection().tableExists(tableName).should.be.equal(true);
    geoPackage.getConnection().tableExists(newTableName).should.be.equal(false);
    geoPackage.renameTable(tableName, newTableName);
    geoPackage.getConnection().tableExists(tableName).should.be.equal(false);
    geoPackage.getConnection().tableExists(newTableName).should.be.equal(true);
  });

  it('should rename a column in a feature table', function() {
    const columnName = 'test_col';
    const newColumnName = 'test_col_renamed';
    var featureDao = geoPackage.getFeatureDao(tableName);
    let tableInfo = TableInfo.info(geoPackage.getConnection(), tableName);
    should.exist(tableInfo.getColumn(columnName));
    should.not.exist(tableInfo.getColumn(newColumnName));
    featureDao.renameColumnWithName(columnName, newColumnName);
    tableInfo = TableInfo.info(geoPackage.getConnection(), tableName);
    should.not.exist(tableInfo.getColumn(columnName));
    should.exist(tableInfo.getColumn(newColumnName));
  });

  it('should add a column to a feature table', function() {
    const columnName = 'feature_is_great';
    const featureDao = geoPackage.getFeatureDao(tableName);
    let column = FeatureColumn.createColumn(columnName, GeoPackageDataType.BOOLEAN, true, false)
    featureDao.addColumn(column);
    let tableInfo = TableInfo.info(geoPackage.getConnection(), tableName);
    should.exist(tableInfo.getColumn(columnName));
    featureDao.dropColumnWithName(columnName);
    tableInfo = TableInfo.info(geoPackage.getConnection(), tableName);
    should.not.exist(tableInfo.getColumn(columnName));
    column = FeatureColumn.createColumn(columnName, GeoPackageDataType.BOOLEAN, true, false)
    featureDao.addColumn(column);
    tableInfo = TableInfo.info(geoPackage.getConnection(), tableName);
    should.exist(tableInfo.getColumn(columnName));
    AlterTable.dropColumnForUserTable(geoPackage.getConnection(), featureDao.table, columnName);
    tableInfo = TableInfo.info(geoPackage.getConnection(), tableName);
    should.not.exist(tableInfo.getColumn(columnName));
  });

  it('should test all drop column functions', function() {
    const columnName = 'feature_is_great';
    var column = FeatureColumn.createColumn(columnName, GeoPackageDataType.BOOLEAN, true, false);
    var tableInfo = TableInfo.info(geoPackage.getConnection(), tableName);
    should.not.exist(tableInfo.getColumn(columnName));
    AlterTable.addColumn(geoPackage.getConnection(), tableName, columnName, CoreSQLUtils.columnDefinition(column));
    tableInfo = TableInfo.info(geoPackage.getConnection(), tableName);
    should.exist(tableInfo.getColumn(columnName));
    AlterTable.dropColumn(geoPackage.getConnection(), tableName, columnName);
    tableInfo = TableInfo.info(geoPackage.getConnection(), tableName);
    should.not.exist(tableInfo.getColumn(columnName));
  });

  it('should test all alter column functions', function() {
    const columnName = 'feature_is_great';
    var column = FeatureColumn.createColumn(columnName, GeoPackageDataType.BOOLEAN, true, false);
    AlterTable.addColumn(geoPackage.getConnection(), tableName, columnName, CoreSQLUtils.columnDefinition(column));
    var tableInfo = TableInfo.info(geoPackage.getConnection(), tableName);
    tableInfo.getColumn(columnName).getDefaultValue().should.be.equal(false);
    var columnCopy = column.copy();
    columnCopy.setDefaultValue(true);
    AlterTable.alterColumn(geoPackage.getConnection(), tableName, columnCopy);
    tableInfo = TableInfo.info(geoPackage.getConnection(), tableName);
    tableInfo.getColumn(columnName).getDefaultValue().should.be.equal(true);
  });
});

describe('AlterTable tests - Tile Table Copying', function() {
  var geoPackage;
  var tileDao;

  var filename;
  beforeEach('create the GeoPackage connection', async function() {
    var originalFilename = path.join(__dirname, '..', '..', 'fixtures', 'denver_tile.gpkg');
    // @ts-ignore
    let result = await copyAndOpenGeopackage(originalFilename);
    filename = result.path;
    geoPackage = result.geoPackage;
    tileDao = geoPackage.getTileDao('denver');
    let tileScalingExtension = geoPackage.getTileScalingExtension('denver');
    tileScalingExtension.getOrCreateExtension();
    const tileScaling = new TileScaling();
    tileScaling.scaling_type = TileScalingType.IN;
    tileScaling.zoom_in = 2;
    tileScaling.zoom_out = 1;
    tileScalingExtension.createOrUpdate(tileScaling);
  });

  afterEach('close the geoPackage connection', async function() {
    geoPackage.close();
    // await testSetup.deleteGeoPackage(filename);
  });

  it('should copy TileTable and it\'s contents', function(done) {
    geoPackage.copyTable('denver', 'cherry_creek', true, true);
    let copyTileDao = geoPackage.getTileDao('cherry_creek');
    copyTileDao.count().should.be.equal(42);
    let tileMatrixDao = new TileMatrixDao(geoPackage);
    tileMatrixDao.count().should.be.equal(2);
    let tileMatrixSetDao = new TileMatrixSetDao(geoPackage);
    tileMatrixSetDao.count().should.be.equal(2);
    let tileScalingExtension = geoPackage.getTileScalingExtension('cherry_creek');
    tileScalingExtension.has().should.be.equal(true);
    let tileScalingDao = tileScalingExtension.dao;
    should.exist(tileScalingDao.queryForTableName('cherry_creek'));
    done();
  });
});

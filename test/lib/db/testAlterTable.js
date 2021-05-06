import { default as testSetup } from '../../fixtures/testSetup'
import {TileScaling} from "../../../lib/extension/scale/tileScaling";
import {TileScalingType} from "../../../lib/extension/scale/tileScalingType";

var FeatureColumn = require('../../../lib/features/user/featureColumn').FeatureColumn
  , FeatureTableStyles = require('../../../lib/extension/style/featureTableStyles').FeatureTableStyles
  , GeometryColumns = require('../../../lib/features/columns/geometryColumns').GeometryColumns
  , AlterTable = require('../../../lib/db/alterTable').AlterTable
  , TableInfo = require('../../../lib/db/table/tableInfo').TableInfo
  , CoreSQLUtils = require('../../../lib/db/coreSQLUtils').CoreSQLUtils
  , GeoPackageDataType = require('../../../lib/db/geoPackageDataType').GeoPackageDataType
  , GeometryData = require('../../../lib/geom/geometryData').GeometryData
  , GeometryType = require('../../../lib/features/user/geometryType').GeometryType
  , TileMatrixDao = require('../../../lib/tiles/matrix/tileMatrixDao').TileMatrixDao
  , TileMatrixSetDao = require('../../../lib/tiles/matrixset/tileMatrixSetDao').TileMatrixSetDao
  , NGAExtensions = require('../../../lib/extension/ngaExtensions').NGAExtensions
  , should = require('chai').should()
  , wkx = require('wkx')
  , path = require('path')
  , _ = require('lodash');

describe('AlterTable tests', function() {

  var testGeoPackage = path.join(__dirname, '..', '..', 'fixtures', 'tmp', testSetup.createTempName());
  var geopackage;
  var tableName = 'AlterTest_FeatureTable';
  var copyTableName = tableName + '_Copy';

  var featureTableStyles;

  beforeEach(async function() {
    geopackage = await testSetup.createGeoPackage(testGeoPackage);
    var columns = [];

    columns.push(FeatureColumn.createPrimaryKeyColumn(0, 'id'));
    columns.push(FeatureColumn.createGeometryColumn(1, 'geom', GeometryType.GEOMETRY, false, null));
    columns.push(FeatureColumn.createColumn(2, 'name', GeoPackageDataType.TEXT, false, ""));
    columns.push(FeatureColumn.createColumn(3, '_feature_id', GeoPackageDataType.TEXT, false, ""));
    columns.push(FeatureColumn.createColumn(4, '_properties_id', GeoPackageDataType.TEXT, false, ""));
    columns.push(FeatureColumn.createColumn(5, 'test_col', GeoPackageDataType.INTEGER, true, 3));

    const geometryColumns = new GeometryColumns();
    geometryColumns.table_name = tableName;
    geometryColumns.column_name = 'geom';
    geometryColumns.geometry_type_name = GeometryType.nameFromType(GeometryType.GEOMETRY);
    geometryColumns.z = 0;
    geometryColumns.m = 0;

    geopackage.createFeatureTable(tableName, geometryColumns, columns);

    var featureDao = geopackage.getFeatureDao(tableName);

    var createRow = function(geoJson, name, featureDao) {
      var srs = featureDao.srs;
      var featureRow = featureDao.newRow();
      var geometryData = new GeometryData();
      geometryData.setSrsId(srs.srs_id);
      var geometry = wkx.Geometry.parseGeoJSON(geoJson);
      geometryData.setGeometry(geometry);
      featureRow.geometry = geometryData;
      featureRow.setValueWithColumnName('name', name);
      featureRow.setValueWithColumnName('_feature_id', name);
      featureRow.setValueWithColumnName('_properties_id', 'properties' + name);
      if (!_.isNil(geoJson.properties) && !_.isNil(geoJson.properties.test_col)) {
        featureRow.setValueWithColumnName('test_col', geoJson.properties.test_col);
      }
      return featureDao.create(featureRow);
    };
    var box1 = {
      "type": "Polygon",
      "coordinates": [[[-1, 1], [1, 1], [1, 3], [-1, 3], [-1, 1]]]
    };

    var box2 = {
      "type": "Polygon",
      "coordinates": [[[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]]
    };

    var line = {
      "type": "LineString",
      "properties": {
        "test_col": 26
      },
      "coordinates": [[2, 3], [-1, 0]]
    };

    // @ts-ignore
    // @ts-ignore
    var line2 = {
      "type": "Feature",
      "properties": {
        "test_col": 12
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [[2.0, 2.5], [-0.5, 0]]
      }
    };

    var point = {
      "type": "Point",
      "properties": {
      },
      "coordinates": [0.5, 1.5]
    };

    var point2 = {
      "type": "Point",
      "coordinates": [1.5, .5]
    };

    createRow(box1, 'box1', featureDao);
    createRow(box2, 'box2', featureDao);
    createRow(line, 'line', featureDao);
    createRow(line, 'line2', featureDao);
    createRow(point, 'point', featureDao);
    createRow(point2, 'point2', featureDao);
    await featureDao.featureTableIndex.index();
    geopackage.featureStyleExtension.getOrCreateExtension(tableName);
    geopackage.featureStyleExtension.getRelatedTables().getOrCreateExtension();
    geopackage.featureStyleExtension.getContentsId().getOrCreateExtension();
    featureTableStyles = new FeatureTableStyles(geopackage, tableName);
    featureTableStyles.createStyleRelationship();
  });

  afterEach(async function() {
    geopackage.close();
    await testSetup.deleteGeoPackage(testGeoPackage);
  });

  it('should copy a feature table and it\'s content and it\'s extensions', function() {
    var featureDao = geopackage.getFeatureDao(tableName);

    featureDao.count().should.be.equal(6);
    // rename table
    geopackage.copyTable(tableName, copyTableName, true, true);

    // get feature dao for updated table name
    featureDao = geopackage.getFeatureDao(copyTableName);
    featureDao.count().should.be.equal(6);

    // check if extensions were copied successfully
    NGAExtensions.getFeatureStyleExtension(geopackage).has(copyTableName).should.equal(true);
  });

  it('should copy a feature table and not it\'s content', function() {
    var featureDao = geopackage.getFeatureDao(tableName);
    geopackage.featureStyleExtension.has(tableName).should.equal(true);

    featureDao.count().should.be.equal(6);
    // rename table
    geopackage.copyTable(tableName, copyTableName, false, true);

    // get feature dao for updated table name
    featureDao = geopackage.getFeatureDao(copyTableName);
    featureDao.count().should.be.equal(0);

    // verify feature style extension was copied
    geopackage.featureStyleExtension.has(copyTableName).should.equal(true);
  });


  it('should copy a feature table and not it\'s extensions', function() {
    var featureDao = geopackage.getFeatureDao(tableName);

    featureDao.count().should.be.equal(6);
    // rename table
    geopackage.copyTable(tableName, copyTableName, true, false);

    // get feature dao for updated table name
    featureDao = geopackage.getFeatureDao(copyTableName);
    featureDao.count().should.be.equal(6);

    // verify feature style extension was not copied
    geopackage.featureStyleExtension.has(copyTableName).should.equal(false);
  });

  it('should delete a table', function() {
    geopackage.connection.tableExists(tableName).should.be.equal(true);
    geopackage.deleteTable(tableName);
    geopackage.connection.tableExists(tableName).should.be.equal(false);
    // verify feature style extension was deleted
    geopackage.featureStyleExtension.has(tableName).should.equal(false);
  });

  it('should rename a feature table', function() {
    const newTableName = tableName + '_New';
    geopackage.connection.tableExists(tableName).should.be.equal(true);
    geopackage.connection.tableExists(newTableName).should.be.equal(false);
    geopackage.renameTable(tableName, newTableName);
    geopackage.connection.tableExists(tableName).should.be.equal(false);
    geopackage.connection.tableExists(newTableName).should.be.equal(true);
  });

  it('should rename a column in a feature table', function() {
    const columnName = 'test_col';
    const newColumnName = 'test_col_renamed';
    var featureDao = geopackage.getFeatureDao(tableName);
    let tableInfo = TableInfo.info(geopackage.connection, tableName);
    should.exist(tableInfo.getColumn(columnName));
    should.not.exist(tableInfo.getColumn(newColumnName));
    featureDao.renameColumn(columnName, newColumnName);
    tableInfo = TableInfo.info(geopackage.connection, tableName);
    should.not.exist(tableInfo.getColumn(columnName));
    should.exist(tableInfo.getColumn(newColumnName));
  });

  it('should add a column to a feature table', function() {
    const columnName = 'feature_is_great';
    var featureDao = geopackage.getFeatureDao(tableName);
    var column = FeatureColumn.createColumn(6, columnName, GeoPackageDataType.BOOLEAN, true, false)
    featureDao.addColumn(column);
    let tableInfo = TableInfo.info(geopackage.connection, tableName);
    should.exist(tableInfo.getColumn(columnName));
    featureDao.dropColumn(columnName);
    tableInfo = TableInfo.info(geopackage.connection, tableName);
    should.not.exist(tableInfo.getColumn(columnName));

    column = FeatureColumn.createColumn(6, columnName, GeoPackageDataType.BOOLEAN, true, false)
    featureDao.addColumn(column);
    tableInfo = TableInfo.info(geopackage.connection, tableName);
    should.exist(tableInfo.getColumn(columnName));
    AlterTable.dropColumnForUserTable(geopackage.connection, featureDao.table, columnName);
    tableInfo = TableInfo.info(geopackage.connection, tableName);
    should.not.exist(tableInfo.getColumn(columnName));
  });

  it('should test all drop column functions', function() {
    const columnName = 'feature_is_great';
    var column = FeatureColumn.createColumn(6, columnName, GeoPackageDataType.BOOLEAN, true, false);
    var tableInfo = TableInfo.info(geopackage.connection, tableName);
    should.not.exist(tableInfo.getColumn(columnName));
    AlterTable.addColumn(geopackage.connection, tableName, columnName, CoreSQLUtils.columnDefinition(column));
    tableInfo = TableInfo.info(geopackage.connection, tableName);
    should.exist(tableInfo.getColumn(columnName));
    AlterTable.dropColumn(geopackage.connection, tableName, columnName);
    tableInfo = TableInfo.info(geopackage.connection, tableName);
    should.not.exist(tableInfo.getColumn(columnName));
  });

  it('should test all alter column functions', function() {
    const columnName = 'feature_is_great';
    var column = FeatureColumn.createColumn(6, columnName, GeoPackageDataType.BOOLEAN, true, false);
    AlterTable.addColumn(geopackage.connection, tableName, columnName, CoreSQLUtils.columnDefinition(column));
    var tableInfo = TableInfo.info(geopackage.connection, tableName);
    tableInfo.getColumn(columnName).getDefaultValue().should.be.equal('0');
    var columnCopy = column.copy();
    columnCopy.setDefaultValue(true);
    AlterTable.alterColumn(geopackage.connection, tableName, columnCopy);
    tableInfo = TableInfo.info(geopackage.connection, tableName);
    tableInfo.getColumn(columnName).getDefaultValue().should.be.equal('1');
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
    geoPackage = result.geopackage;
    tileDao = geoPackage.getTileDao('denver');
    let tileScalingExtension = geoPackage.getTileScalingExtension('denver');
    tileScalingExtension.getOrCreateExtension();
    const tileScaling = new TileScaling();
    tileScaling.scaling_type = TileScalingType.IN;
    tileScaling.zoom_in = 2;
    tileScaling.zoom_out = 1;
    tileScalingExtension.createOrUpdate(tileScaling);
  });

  afterEach('close the geopackage connection', async function() {
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

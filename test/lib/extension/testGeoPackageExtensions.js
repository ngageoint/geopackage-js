import { default as testSetup } from '../../fixtures/testSetup'

var ExtensionManager = require('../../../lib/extension/extensionManager').ExtensionManager
  , FeatureColumn = require('../../../lib/features/user/featureColumn').FeatureColumn
  , Canvas = require('../../../lib/canvas/canvas').Canvas
  , ExtensionDao = require('../../../lib/extension/extensionsDao').ExtensionsDao
  , SchemaExtension = require('../../../lib/extension/schema').SchemaExtension
  , FeatureTableStyles = require('../../../lib/extension/nga/style/featureTableStyles').FeatureTableStyles
  , FeatureStyleExtension = require('../../../lib/extension/nga/style/featureStyleExtension').FeatureStyleExtension
  , GeometryColumns = require('../../../lib/features/columns/geometryColumns').GeometryColumns
  , GeoPackageDataType = require('../../../lib/db/geoPackageDataType').GeoPackageDataType
  , GeometryData = require('../../../lib/geom/geoPackageGeometryData').GeoPackageGeometryData
  , GeometryType = require('@ngageoint/simple-features-js').GeometryType
  , ImageUtils = require('../../../lib/tiles/imageUtils').ImageUtils
  , RTreeIndex = require('../../../lib/extension/rtree/rtreeIndexExtension').RTreeIndex
  , FeatureTableIndex = require('../../../lib/extension/nga/index/featureTableIndex').FeatureTableIndex
  , MetadataExtension = require('../../../lib/extension/metadata/metadataExtension').MetadataExtension
  , should = require('chai').should()
  , expect = require('chai').expect
  , wkx = require('wkx')
  , path = require('path')
  , _ = require('lodash');


describe('GeoPackage Extensions tests', function() {
  var testGeoPackage;
  var geopackage;
  var tableName = 'feature_table';
  var iconImage;
  var iconImageBuffer;
  var schemaExtension;
  var rtreeIndex;
  var rtreeExtension;

  var randomStyle = function(featureTableStyles) {
    var styleRow = featureTableStyles.getStyleDao().createObject();
    styleRow.setName("Style Name");
    styleRow.setDescription("Style Description");
    styleRow.setColor(randomColor(), 1.0);
    styleRow.setFillColor(randomColor(), 1.0);
    styleRow.setWidth(1.0 + (Math.random() * 3));
    return styleRow;
  };

  var randomColor = function() {
    var length = 6;
    var chars = '0123456789ABCDEF';
    var hex = '#';
    while(length--) hex += chars[(Math.random() * 16) | 0];
    return hex;
  };

  var randomIcon = function(featureTableStyles) {
    var iconRow = featureTableStyles.getIconDao().newRow();
    iconRow.data = iconImageBuffer;
    iconRow.contentType = 'image/png';
    iconRow.name = "Icon Name";
    iconRow.description = "Icon Description";
    iconRow.width = Math.random() * iconImage.width;
    iconRow.height = Math.random() * iconImage.height;
    iconRow.anchorU = Math.random();
    iconRow.anchorV = Math.random();
    return iconRow;
  };

  beforeEach(async function() {
    let created = await testSetup.createTmpGeoPackage();
    testGeoPackage = created.path;
    geopackage = created.geopackage;
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
    geopackage.featureStyleExtension.getOrCreateExtension(tableName);
    geopackage.featureStyleExtension.getRelatedTables().getOrCreateExtension();
    geopackage.featureStyleExtension.getContentsId().getOrCreateExtension();
    const featureTableStyles = new FeatureTableStyles(geopackage, tableName);
    featureTableStyles.createRelationships();
    featureTableStyles.setTableStyle(GeometryType.POINT, randomStyle(featureTableStyles));
    iconImage = await ImageUtils.getImage(path.join(__dirname, '..', '..', 'fixtures', 'point.png'));
    // @ts-ignore
    iconImageBuffer = await loadTile(path.join(__dirname, '..', '..', 'fixtures', 'point.png'));
    featureTableStyles.setTableIcon(GeometryType.POINT, randomIcon(featureTableStyles));

    // setup schema extension
    schemaExtension = new SchemaExtension(geopackage);
    geopackage.createDataColumns();
    geopackage.createDataColumnConstraintsTable();

    rtreeIndex = new RTreeIndex(geopackage, featureDao);
    rtreeExtension = rtreeIndex.create()[0];
    var fti = new FeatureTableIndex(geopackage, featureDao);
    var indexed = fti.isIndexed();
    indexed.should.be.equal(true);
    var exists = rtreeIndex.hasExtension(rtreeIndex.extensionName, rtreeIndex.tableName, rtreeIndex.columnName);
    exists.should.be.equal(true);
    const metadataExtension = new MetadataExtension(geopackage);
    metadataExtension.getOrCreateExtension();

    geopackage.createMetadataTable();
    geopackage.createMetadataReferenceTable();
    const metadataDao = geopackage.metadataDao;
  });

  afterEach(async function() {
    geopackage.close();
    Canvas.disposeImage(iconImage);
    await testSetup.deleteGeoPackage(testGeoPackage);
  });

  it('should copy extensions for table', function() {
    const newTableName = 'copied_feature_table';
    geopackage.copyTable(tableName, newTableName, true, true);
    const featureTableStyles = new FeatureTableStyles(geopackage, newTableName);
    featureTableStyles.hasIconRelationship().should.be.equal(true);
    const rtreeIndexNewTable = new RTreeIndex(geopackage, geopackage.getFeatureDao(newTableName));
    rtreeIndexNewTable.extensionExists.should.be.equal(true);
    rtreeIndexNewTable.hasExtension(rtreeIndexNewTable.extensionName, rtreeIndexNewTable.tableName, rtreeIndexNewTable.columnName).should.be.equal(true);
  });

  it('should delete extensions for table', function() {
    new ExtensionManager(geopackage).deleteTableExtensions(tableName);
    new FeatureStyleExtension(geopackage).has(tableName).should.be.equal(false);
  });

  it('should delete extensions', function() {
    geopackage.connection.isTableExists(ExtensionDao.TABLE_NAME).should.be.equal(true);
    new ExtensionManager(geopackage).deleteExtensions();
    geopackage.connection.isTableExists(ExtensionDao.TABLE_NAME).should.be.equal(false);
  });

  it('should copy table and then delete copy and style extension for original table should be unchanged', function() {
    const newTableName = 'copied_feature_table';
    let featureTableStyles = new FeatureTableStyles(geopackage, tableName);
    should.exist(featureTableStyles.getTableIcon(GeometryType.POINT));
    should.exist(featureTableStyles.getTableStyle(GeometryType.POINT));
    geopackage.copyTable(tableName, newTableName, true, true);
    featureTableStyles = new FeatureTableStyles(geopackage, tableName);
    should.exist(featureTableStyles.getTableIcon(GeometryType.POINT));
    should.exist(featureTableStyles.getTableStyle(GeometryType.POINT));
    featureTableStyles = new FeatureTableStyles(geopackage, newTableName);
    should.exist(featureTableStyles.getTableIcon(GeometryType.POINT));
    should.exist(featureTableStyles.getTableStyle(GeometryType.POINT));
    geopackage.deleteTable(newTableName);
    featureTableStyles = new FeatureTableStyles(geopackage, tableName);
    should.exist(featureTableStyles.getTableIcon(GeometryType.POINT));
    should.exist(featureTableStyles.getTableStyle(GeometryType.POINT));
  });
});

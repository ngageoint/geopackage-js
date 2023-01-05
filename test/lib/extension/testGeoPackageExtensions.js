import { default as testSetup } from '../../testSetup'
import { FeatureConverter } from "@ngageoint/simple-features-geojson-js";
import { FeatureTableMetadata } from "../../../lib/features/user/featureTableMetadata";
import { FeatureIndexManager } from "../../../lib/features/index/featureIndexManager";
import { FeatureIndexType } from "../../../lib/features/index/featureIndexType";
import { Extensions } from "../../../lib/extension/extensions";

var ExtensionManager = require('../../../lib/extension/extensionManager').ExtensionManager
  , FeatureColumn = require('../../../lib/features/user/featureColumn').FeatureColumn
  , Canvas = require('../../../lib/canvas/canvas').Canvas
  , SchemaExtension = require('../../../lib/extension/schema/schemaExtension').SchemaExtension
  , FeatureTableStyles = require('../../../lib/extension/nga/style/featureTableStyles').FeatureTableStyles
  , FeatureStyleExtension = require('../../../lib/extension/nga/style/featureStyleExtension').FeatureStyleExtension
  , GeometryColumns = require('../../../lib/features/columns/geometryColumns').GeometryColumns
  , GeoPackageDataType = require('../../../lib/db/geoPackageDataType').GeoPackageDataType
  , GeometryData = require('../../../lib/geom/geoPackageGeometryData').GeoPackageGeometryData
  , GeometryType = require('@ngageoint/simple-features-js').GeometryType
  , ImageUtils = require('../../../lib/image/imageUtils').ImageUtils
  , MetadataExtension = require('../../../lib/extension/metadata/metadataExtension').MetadataExtension
  , should = require('chai').should()
  , expect = require('chai').expect
  , path = require('path')
  , _ = require('lodash');


describe('GeoPackage Extensions tests', function() {
  var testGeoPackage;
  var geoPackage;
  var tableName = 'feature_table';
  var iconImage;
  var iconImageBuffer;
  var schemaExtension;
  var rtreeIndexDao;

  const randomStyle = function(featureTableStyles) {
    var styleRow = featureTableStyles.getStyleDao().newRow();
    styleRow.setName("Style Name");
    styleRow.setDescription("Style Description");
    styleRow.setColor(randomColor(), 1.0);
    styleRow.setFillColor(randomColor(), 1.0);
    styleRow.setWidth(1.0 + (Math.random() * 3));
    return styleRow;
  };

  const randomColor = function() {
    var length = 6;
    var chars = '0123456789ABCDEF';
    var hex = '#';
    while(length--) hex += chars[(Math.random() * 16) | 0];
    return hex;
  };

  const randomIcon = function(featureTableStyles) {
    var iconRow = featureTableStyles.getIconDao().newRow();
    iconRow.setData(iconImageBuffer);
    iconRow.setContentType('image/png');
    iconRow.setName("Icon Name");
    iconRow.setDescription("Icon Description");
    iconRow.setWidth(Math.random() * iconImage.getWidth());
    iconRow.setHeight(Math.random() * iconImage.getHeight());
    iconRow.setAnchorU(Math.random());
    iconRow.setAnchorV(Math.random());
    return iconRow;
  };

  beforeEach(async function() {
    let created = await testSetup.createTmpGeoPackage();
    testGeoPackage = created.path;
    geoPackage = created.geoPackage;
    const columns = [];

    columns.push(FeatureColumn.createColumn('name', GeoPackageDataType.TEXT, false, ""));
    columns.push(FeatureColumn.createColumn('_feature_id', GeoPackageDataType.TEXT, false, ""));
    columns.push(FeatureColumn.createColumn('_properties_id', GeoPackageDataType.TEXT, false, ""));
    columns.push(FeatureColumn.createColumn('test_col', GeoPackageDataType.INTEGER, true, 3));

    const geometryColumns = new GeometryColumns();
    geometryColumns.setTableName(tableName);
    geometryColumns.setColumnName('geom');
    geometryColumns.setGeometryType(GeometryType.GEOMETRY);
    geometryColumns.setZ(0);
    geometryColumns.setM(0);
    geometryColumns.setSrsId(4326);

    geoPackage.createFeatureTableWithFeatureTableMetadata(FeatureTableMetadata.create(geometryColumns, columns));

    const featureDao = geoPackage.getFeatureDao(tableName);

    const createRow = function(geoJson, name, featureDao) {
      var srs = featureDao.getSrs();
      var featureRow = featureDao.newRow();
      var geometryData = new GeometryData();
      geometryData.setSrsId(srs.getSrsId());
      var geometry = FeatureConverter.toSimpleFeaturesGeometry(geoJson);
      geometryData.setGeometry(geometry);
      featureRow.setGeometry(geometryData);
      featureRow.setValue('name', name);
      featureRow.setValue('_feature_id', name);
      featureRow.setValue('_properties_id', 'properties' + name);
      if (!_.isNil(geoJson.properties) && !_.isNil(geoJson.properties.test_col)) {
        featureRow.setValue('test_col', geoJson.properties.test_col);
      }
      return featureDao.create(featureRow);
    };
    const box1 = {
      type: 'Feature',
      geometry: {
        type: "Polygon",
        coordinates: [[[-1, 1], [1, 1], [1, 3], [-1, 3], [-1, 1]]]
      },
      properties: {}
    };

    const box2 = {
      type: 'Feature',
      geometry: {
        type: "Polygon",
        coordinates: [[[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]]
      },
      properties: {}
    };

    const line = {
      type: 'Feature',
      geometry: {
        type: "LineString",
        coordinates: [[2, 3], [-1, 0]]
      },
      properties: {
        "test_col": 26
      },
    };

    const line2 = {
      type: "Feature",
      properties: {
        "test_col": 12
      },
      geometry: {
        type: "LineString",
        coordinates: [[2.0, 2.5], [-0.5, 0]]
      }
    };

    const point = {
      type: 'Feature',
      geometry: {
        type: "Point",
        coordinates: [0.5, 1.5]
      },
      properties: {}
    };

    const point2 = {
      type: 'Feature',
      geometry: {
        type: "Point",
        coordinates: [1.5, .5]
      },
      properties: {}
    };

    createRow(box1, 'box1', featureDao);
    createRow(box2, 'box2', featureDao);
    createRow(line, 'line', featureDao);
    createRow(line, 'line2', featureDao);
    createRow(point, 'point', featureDao);
    createRow(point2, 'point2', featureDao);

    const featureStyleExtension = new FeatureStyleExtension(geoPackage);
    featureStyleExtension.getOrCreateExtension(tableName);
    featureStyleExtension.getRelatedTables().getOrCreateExtension();
    featureStyleExtension.getContentsId().getOrCreateExtension();
    const featureTableStyles = new FeatureTableStyles(geoPackage, tableName);
    featureTableStyles.createRelationships();
    featureTableStyles.setTableStyle(GeometryType.POINT, randomStyle(featureTableStyles));
    iconImage = await ImageUtils.getImage(path.join(__dirname, '..', '..', 'fixtures', 'point.png'));
    // @ts-ignore
    iconImageBuffer = await loadTile(path.join(__dirname, '..', '..', 'fixtures', 'point.png'));
    featureTableStyles.setTableIcon(GeometryType.POINT, randomIcon(featureTableStyles));

    // setup schema extension
    schemaExtension = new SchemaExtension(geoPackage);
    geoPackage.createDataColumns();
    geoPackage.createDataColumnConstraintsTable();

    // setup rtree index
    const featureIndexManager = new FeatureIndexManager(geoPackage, featureDao);
    featureIndexManager.setIndexLocation(FeatureIndexType.RTREE);
    featureIndexManager.index();
    const indexed = featureIndexManager.isIndexed();
    indexed.should.be.equal(true);
    rtreeIndexDao = featureIndexManager.getRTreeIndexTableDao()
    var exists = rtreeIndexDao.has();
    exists.should.be.equal(true);
    const metadataExtension = new MetadataExtension(geoPackage);
    metadataExtension.getOrCreateExtension();

    geoPackage.createMetadataTable();
    geoPackage.createMetadataReferenceTable();
  });

  afterEach(async function() {
    geoPackage.close();
    Canvas.disposeImage(iconImage);
    await testSetup.deleteGeoPackage(testGeoPackage);
  });

  it('should copy extensions for table', function() {
    const newTableName = 'copied_feature_table';
    geoPackage.copyTable(tableName, newTableName, true, true);
    const featureTableStyles = new FeatureTableStyles(geoPackage, newTableName);
    featureTableStyles.hasIconRelationship().should.be.equal(true);
    const featureIndexManager = new FeatureIndexManager(geoPackage, newTableName);
    featureIndexManager.isIndexedForType(FeatureIndexType.RTREE).should.be.equal(true);
    featureIndexManager.getRTreeIndexTableDao().has().should.be.equal(true);
  });

  it('should delete extensions for table', function() {
    new ExtensionManager(geoPackage).deleteTableExtensions(tableName);
    new FeatureStyleExtension(geoPackage).has(tableName).should.be.equal(false);
  });

  it('should delete extensions', function() {
    geoPackage.getConnection().isTableExists(Extensions.TABLE_NAME).should.be.equal(true);
    new ExtensionManager(geoPackage).deleteExtensions();
    geoPackage.getConnection().isTableExists(Extensions.TABLE_NAME).should.be.equal(false);
  });

  it('should copy table and then delete copy and style extension for original table should be unchanged', function() {
    const newTableName = 'copied_feature_table';
    let featureTableStyles = new FeatureTableStyles(geoPackage, tableName);
    should.exist(featureTableStyles.getTableIcon(GeometryType.POINT));
    should.exist(featureTableStyles.getTableStyle(GeometryType.POINT));
    geoPackage.copyTable(tableName, newTableName, true, true);
    featureTableStyles = new FeatureTableStyles(geoPackage, tableName);
    should.exist(featureTableStyles.getTableIcon(GeometryType.POINT));
    should.exist(featureTableStyles.getTableStyle(GeometryType.POINT));
    featureTableStyles = new FeatureTableStyles(geoPackage, newTableName);
    should.exist(featureTableStyles.getTableIcon(GeometryType.POINT));
    should.exist(featureTableStyles.getTableStyle(GeometryType.POINT));
    geoPackage.deleteTable(newTableName);
    featureTableStyles = new FeatureTableStyles(geoPackage, tableName);
    should.exist(featureTableStyles.getTableIcon(GeometryType.POINT));
    should.exist(featureTableStyles.getTableStyle(GeometryType.POINT));
  });
});

import { default as GeoPackageAPI } from '../../.'
import { default as testSetup } from '../fixtures/testSetup'

var GeoPackageConnection = require('../../lib/db/geoPackageConnection')
  , GeoPackage = require('../../lib/geoPackage')
  // , GeoPackageAPI = require('../../.')
  , FeatureColumn = require('../../lib/features/user/featureColumn')
  , DataColumns = require('../../lib/dataColumns/dataColumns')
  , DataColumnsDao = require('../../lib/dataColumns/dataColumnsDao')
  , Verification = require('../fixtures/verification')
  , FeatureTable = require('../../lib/features/user/featureTable')
  , TileTable = require('../../lib/tiles/user/tileTable')
  , SetupFeatureTable = require('../fixtures/setupFeatureTable')
  , TableCreator = require('../../lib/db/tableCreator')
  , BoundingBox = require('../../lib/boundingBox')
  , DataTypes = require('../../lib/db/dataTypes')
  , GeometryData = require('../../lib/geom/geometryData')
  , FeatureTableReader = require('../../lib/features/user/featureTableReader')
  // , testSetup = require('../fixtures/testSetup')
  , should = require('chai').should()
  , wkb = require('../../lib/wkb/index')
  , wkx = require('wkx')
  , path = require('path');

describe('GeoPackage Feature table create tests', function() {
  var testGeoPackage;
  var testPath = path.join(__dirname, '..', 'tmp');
  var tableName = 'test_features.test';
  var geopackage;

  beforeEach(function(done) {
    testGeoPackage = path.join(testPath, testSetup.createTempName());
    testSetup.createGeoPackage(testGeoPackage, function(err, gp) {
      geopackage = gp;
      done();
    });
  });

  afterEach(function(done) {
    geopackage.close();
    testSetup.deleteGeoPackage(testGeoPackage, done);
  });

  it('should create a feature table', function() {
    var geometryColumns = SetupFeatureTable.buildGeometryColumns(tableName, 'geom.test', wkb.typeMap.wkt.Point);
    var boundingBox = new BoundingBox(-180, 180, -80, 80);

    var columns = [];

    columns.push(FeatureColumn.createPrimaryKeyColumnWithIndexAndName(0, 'id'));
    columns.push(FeatureColumn.createColumnWithIndexAndMax(7, 'test_text_limited.test', DataTypes.GPKGDataType.GPKG_DT_TEXT, 5, false, null));
    columns.push(FeatureColumn.createColumnWithIndexAndMax(8, 'test_blob_limited.test', DataTypes.GPKGDataType.GPKG_DT_BLOB, 7, false, null));
    columns.push(FeatureColumn.createGeometryColumn(1, 'geom.test', wkb.typeMap.wkt.Point, false, null));
    columns.push(FeatureColumn.createColumnWithIndex(2, 'test_text.test', DataTypes.GPKGDataType.GPKG_DT_TEXT, false, ""));
    columns.push(FeatureColumn.createColumnWithIndex(3, 'test_real.test', DataTypes.GPKGDataType.GPKG_DT_REAL, false, null));
    columns.push(FeatureColumn.createColumnWithIndex(4, 'test_boolean.test', DataTypes.GPKGDataType.GPKG_DT_BOOLEAN, false, null));
    columns.push(FeatureColumn.createColumnWithIndex(5, 'test_blob.test', DataTypes.GPKGDataType.GPKG_DT_BLOB, false, null));
    columns.push(FeatureColumn.createColumnWithIndex(6, 'test_integer.test', DataTypes.GPKGDataType.GPKG_DT_INTEGER, false, ""));

    geopackage.createFeatureTableWithGeometryColumns(geometryColumns, boundingBox, 4326, columns)
      .then(function(result) {
        result.should.be.equal(true);
        Verification.verifyGeometryColumns(geopackage).should.be.equal(true);
        Verification.verifyTableExists(geopackage, tableName).should.be.equal(true);
        Verification.verifyContentsForTable(geopackage, tableName).should.be.equal(true);
        Verification.verifyGeometryColumnsForTable(geopackage, tableName).should.be.equal(true);
      });
  });

  it('should not create a feature table with two geometry columns', function() {
    var geometryColumns = SetupFeatureTable.buildGeometryColumns(tableName, 'geom.test', wkb.typeMap.wkt.Point);
    var boundingBox = new BoundingBox(-180, 180, -80, 80);

    var columns = [];

    columns.push(FeatureColumn.createPrimaryKeyColumnWithIndexAndName(0, 'id'));
    columns.push(FeatureColumn.createGeometryColumn(1, 'geom.test', wkb.typeMap.wkt.Point, false, null));
    columns.push(FeatureColumn.createGeometryColumn(2, 'geom2.test', wkb.typeMap.wkt.Point, false, null));
    (function() {
      new FeatureTable(tableName, columns);
    }).should.throw();

  });

  it('should create a feature table from properties', function() {
    var properties = [];
    properties.push({
      name: 'Name',
      dataType: DataTypes.GPKG_DT_TEXT_NAME
    });
    properties.push({
      name: 'Number',
      dataType: DataTypes.GPKG_DT_INTEGER_NAME
    });

    GeoPackageAPI.createFeatureTableWithProperties(geopackage, 'NewTable', properties)
      .then(function(result) {
        var reader = new FeatureTableReader('NewTable');
        var result = reader.readFeatureTable(geopackage);
        var columns = result.columns;

        var plainObject = JSON.parse(JSON.stringify(columns));

        plainObject.should.deep.include.members([{
          index: 0,
          name: 'id',
          dataType: 5,
          notNull: true,
          primaryKey: true },
        { index: 1,
          name: 'geometry',
          notNull: false,
          primaryKey: false,
          geometryType: 7 },
        { index: 2,
          name: 'Name',
          dataType: 9,
          notNull: false,
          primaryKey: false },
        { index: 3,
          name: 'Number',
          dataType: 5,
          notNull: false,
          primaryKey: false } ]);
      });
  });

  it('should create a feature table and read the information about it', function() {
    var geometryColumns = SetupFeatureTable.buildGeometryColumns(tableName, 'geom.test', wkb.typeMap.wkt.Point);
    var boundingBox = new BoundingBox(-180, 180, -80, 80);

    var columns = [];

    columns.push(FeatureColumn.createPrimaryKeyColumnWithIndexAndName(0, 'id'));
    columns.push(FeatureColumn.createColumnWithIndexAndMax(7, 'test_text_limited.test', DataTypes.GPKGDataType.GPKG_DT_TEXT, 5, false, null));
    columns.push(FeatureColumn.createColumnWithIndexAndMax(8, 'test_blob_limited.test', DataTypes.GPKGDataType.GPKG_DT_BLOB, 7, false, null));
    columns.push(FeatureColumn.createGeometryColumn(1, 'geom.test', wkb.typeMap.wkt.Point, false, null));
    columns.push(FeatureColumn.createColumnWithIndex(2, 'test_text.test', DataTypes.GPKGDataType.GPKG_DT_TEXT, false, "default"));
    columns.push(FeatureColumn.createColumnWithIndex(3, 'test_real.test', DataTypes.GPKGDataType.GPKG_DT_REAL, false, null));
    columns.push(FeatureColumn.createColumnWithIndex(4, 'test_boolean.test', DataTypes.GPKGDataType.GPKG_DT_BOOLEAN, false, null));
    columns.push(FeatureColumn.createColumnWithIndex(5, 'test_blob.test', DataTypes.GPKGDataType.GPKG_DT_BLOB, false, null));
    columns.push(FeatureColumn.createColumnWithIndex(6, 'test_integer.test', DataTypes.GPKGDataType.GPKG_DT_INTEGER, false, 5));

    var dc = new DataColumns();
    dc.table_name = 'test_features.test';
    dc.column_name = 'test_text_limited.test';
    dc.name = 'Test Name';
    dc.title = 'Test';
    dc.description = 'Test Description';
    dc.mime_type = 'text/html';
    dc.constraint_name = 'test constraint';

    return geopackage.createFeatureTableWithGeometryColumnsAndDataColumns(geometryColumns, boundingBox, 4326, columns, [dc])
      .then(function() {
        var reader = new FeatureTableReader(tableName);
        var result = reader.readFeatureTable(geopackage);
        var columns = result.columns;

        var plainObject = JSON.parse(JSON.stringify(columns));

        plainObject.should.deep.include.members([{ index: 0,
          name: 'id',
          dataType: 5,
          notNull: true,
          primaryKey: true },
        { index: 1,
          name: 'geom.test',
          notNull: false,
          primaryKey: false,
          geometryType: 7 },
        { index: 2,
          name: 'test_text.test',
          dataType: 9,
          notNull: false,
          defaultValue: "\'default\'",
          primaryKey: false },
        { index: 3,
          name: 'test_real.test',
          dataType: 8,
          notNull: false,
          primaryKey: false },
        { index: 4,
          name: 'test_boolean.test',
          dataType: 0,
          notNull: false,
          primaryKey: false },
        { index: 5,
          name: 'test_blob.test',
          dataType: 10,
          notNull: false,
          primaryKey: false },
        { index: 6,
          name: 'test_integer.test',
          dataType: 5,
          notNull: false,
          defaultValue: '5',
          primaryKey: false },
        { index: 7,
          name: 'test_text_limited.test',
          dataType: 9,
          max: 5,
          notNull: false,
          primaryKey: false },
        { index: 8,
          name: 'test_blob_limited.test',
          dataType: 10,
          max: 7,
          notNull: false,
          primaryKey: false } ]);
        var dao = new DataColumnsDao(geopackage);
        var dataColumn = dao.getDataColumns('test_features.test', 'test_text_limited.test');
        dataColumn.should.be.deep.equal({
          table_name: 'test_features.test',
          column_name: 'test_text_limited.test',
          name: 'Test Name',
          title: 'Test',
          description: 'Test Description',
          mime_type: 'text/html',
          constraint_name: 'test constraint'
        });
      });
  });

  describe('GeoPackage feature CRUD tests', function(done) {

    beforeEach(function() {
      var geometryColumns = SetupFeatureTable.buildGeometryColumns(tableName, 'geom', wkb.typeMap.wkt.Point);
      var boundingBox = new BoundingBox(-180, 180, -80, 80);

      var columns = [];

      columns.push(FeatureColumn.createPrimaryKeyColumnWithIndexAndName(0, 'id'));
      columns.push(FeatureColumn.createColumnWithIndexAndMax(7, 'test_text_limited', DataTypes.GPKGDataType.GPKG_DT_TEXT, 5, false, null));
      columns.push(FeatureColumn.createColumnWithIndexAndMax(8, 'test_blob_limited', DataTypes.GPKGDataType.GPKG_DT_BLOB, 7, false, null));
      columns.push(FeatureColumn.createGeometryColumn(1, 'geom', wkb.typeMap.wkt.Point, false, null));
      columns.push(FeatureColumn.createColumnWithIndex(2, 'test_text.test', DataTypes.GPKGDataType.GPKG_DT_TEXT, false, ""));
      columns.push(FeatureColumn.createColumnWithIndex(3, 'test_real', DataTypes.GPKGDataType.GPKG_DT_REAL, false, null));
      columns.push(FeatureColumn.createColumnWithIndex(4, 'test_boolean', DataTypes.GPKGDataType.GPKG_DT_BOOLEAN, false, null));
      columns.push(FeatureColumn.createColumnWithIndex(5, 'test_blob', DataTypes.GPKGDataType.GPKG_DT_BLOB, false, null));
      columns.push(FeatureColumn.createColumnWithIndex(6, 'test_integer', DataTypes.GPKGDataType.GPKG_DT_INTEGER, false, ""));
      columns.push(FeatureColumn.createColumnWithIndex(9, 'test space', DataTypes.GPKGDataType.GPKG_DT_TEXT, false, ""));
      columns.push(FeatureColumn.createColumnWithIndex(10, 'test-dash', DataTypes.GPKGDataType.GPKG_DT_TEXT, false, ""));

      return geopackage.createFeatureTableWithGeometryColumns(geometryColumns, boundingBox, 4326, columns)
        .then(function(result) {
          var verified = Verification.verifyGeometryColumns(geopackage)
          && Verification.verifyTableExists(geopackage, tableName)
          && Verification.verifyContentsForTable(geopackage, tableName)
          && Verification.verifyGeometryColumnsForTable(geopackage, tableName);
          verified.should.be.equal(true);
        });
    });

    it('should create a feature', function() {
      var featureDao = geopackage.getFeatureDao(tableName);
      var featureRow = featureDao.newRow();
      var geometryData = new GeometryData();
      geometryData.setSrsId(4326);
      var point = new wkx.Point(1, 2);
      geometryData.setGeometry(point);
      featureRow.setGeometry(geometryData);
      featureRow.setValueWithColumnName('test_text.test', 'hello');
      featureRow.setValueWithColumnName('test_real', 3.0);
      featureRow.setValueWithColumnName('test_boolean', true);
      featureRow.setValueWithColumnName('test_blob', Buffer.from('test'));
      featureRow.setValueWithColumnName('test_integer', 5);
      featureRow.setValueWithColumnName('test_text_limited', 'testt');
      featureRow.setValueWithColumnName('test_blob_limited', Buffer.from('testtes'));
      featureRow.setValueWithColumnName('test space', 'space space');
      featureRow.setValueWithColumnName('test-dash', 'dash-dash');

      var result = featureDao.create(featureRow);
      var count = featureDao.getCount();
      count.should.be.equal(1);
      var rows = featureDao.queryForAll();
      var fr = featureDao.getRow(rows[0]);
      var geom = fr.getGeometry();
      geom.geometry.x.should.be.equal(1);
      geom.geometry.y.should.be.equal(2);
      fr.getValueWithColumnName('test_text.test').should.be.equal('hello');
      fr.getValueWithColumnName('test_real').should.be.equal(3.0);
      fr.getValueWithColumnName('test_boolean').should.be.equal(true);
      fr.getValueWithColumnName('test_integer').should.be.equal(5);
      fr.getValueWithColumnName('test_blob').toString().should.be.equal('test');
      fr.getValueWithColumnName('test_text_limited').should.be.equal('testt');
      fr.getValueWithColumnName('test_blob_limited').toString().should.be.equal('testtes');
      fr.getValueWithColumnName('test space').toString().should.be.equal('space space');
      fr.getValueWithColumnName('test-dash').toString().should.be.equal('dash-dash');
    });

    describe('delete feature tests', function(done) {
      var featureDao;

      beforeEach(function() {
        featureDao = geopackage.getFeatureDao(tableName);
        var featureRow = featureDao.newRow();
        var geometryData = new GeometryData();
        geometryData.setSrsId(4326);
        var point = new wkx.Point(1, 2);
        geometryData.setGeometry(point);
        featureRow.setGeometry(geometryData);
        featureRow.setValueWithColumnName('test_text.test', 'hello');
        featureRow.setValueWithColumnName('test_real', 3.0);
        featureRow.setValueWithColumnName('test_boolean', true);
        featureRow.setValueWithColumnName('test_blob', Buffer.from('test'));
        featureRow.setValueWithColumnName('test_integer', 5);
        featureRow.setValueWithColumnName('test_text_limited', 'testt');
        featureRow.setValueWithColumnName('test_blob_limited', Buffer.from('testtes'));

        var result = featureDao.create(featureRow);
        var count = featureDao.getCount();
        count.should.be.equal(1);
        var rows = featureDao.queryForAll();
        var fr = featureDao.getRow(rows[0]);
        var geom = fr.getGeometry();
        geom.geometry.x.should.be.equal(1);
        geom.geometry.y.should.be.equal(2);
        fr.getValueWithColumnName('test_text.test').should.be.equal('hello');
        fr.getValueWithColumnName('test_real').should.be.equal(3.0);
        fr.getValueWithColumnName('test_boolean').should.be.equal(true);
        fr.getValueWithColumnName('test_integer').should.be.equal(5);
        fr.getValueWithColumnName('test_blob').toString().should.be.equal('test');
        fr.getValueWithColumnName('test_text_limited').should.be.equal('testt');
        fr.getValueWithColumnName('test_blob_limited').toString().should.be.equal('testtes');
      });

      it('should delete the feature', function() {
        var count = featureDao.getCount();
        count.should.be.equal(1);

        var rows = featureDao.queryForAll();
        var fr = featureDao.getRow(rows[0]);
        var result = featureDao.delete(fr);
        var count = featureDao.getCount();
        count.should.be.equal(0);
      });
    });
  });

});

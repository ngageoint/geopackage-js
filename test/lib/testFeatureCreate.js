import { GeoPackageAPI } from '../../.'
import { default as testSetup } from '../fixtures/testSetup'

var FeatureColumn = require('../../lib/features/user/featureColumn').FeatureColumn
  , DataColumns = require('../../lib/dataColumns/dataColumns').DataColumns
  , DataColumnsDao = require('../../lib/dataColumns/dataColumnsDao').DataColumnsDao
  , Verification = require('../fixtures/verification')
  , FeatureTable = require('../../lib/features/user/featureTable').FeatureTable
  , SetupFeatureTable = require('../fixtures/setupFeatureTable')
  , BoundingBox = require('../../lib/boundingBox').BoundingBox
  , DataTypes = require('../../lib/db/dataTypes').DataTypes
  , GeometryData = require('../../lib/geom/geometryData').GeometryData
  , FeatureTableReader = require('../../lib/features/user/featureTableReader').FeatureTableReader
  // , testSetup = require('../fixtures/testSetup')
  , should = require('chai').should()
  , wkb = require('../../lib/wkb/index').WKB
  , wkx = require('wkx')
  , path = require('path');

describe('GeoPackage Feature table create tests', function() {
  var testGeoPackage;
  var tableName = 'test_features.test';
  var geopackage;

  beforeEach(async function() {
    let created = await testSetup.createTmpGeoPackage();
    testGeoPackage = created.path;
    geopackage = created.geopackage;
  });

  afterEach(async function() {
    geopackage.close();
    await testSetup.deleteGeoPackage(testGeoPackage);
  });

  it('should create a feature table', function() {
    var geometryColumns = SetupFeatureTable.buildGeometryColumns(tableName, 'geom.test', wkb.typeMap.wkt.Point);
    var columns = [];

    columns.push(FeatureColumn.createPrimaryKeyColumnWithIndexAndName(0, 'id'));
    columns.push(FeatureColumn.createColumn(7, 'test_text_limited.test', DataTypes.TEXT, false, null, 5));
    columns.push(FeatureColumn.createColumn(8, 'test_blob_limited.test', DataTypes.BLOB, false, null, 7));
    columns.push(FeatureColumn.createGeometryColumn(1, 'geom.test', wkb.typeMap.wkt.Point, false, null));
    columns.push(FeatureColumn.createColumn(2, 'test_text.test', DataTypes.TEXT, false, ""));
    columns.push(FeatureColumn.createColumn(3, 'test_real.test', DataTypes.REAL, false, null));
    columns.push(FeatureColumn.createColumn(4, 'test_boolean.test', DataTypes.BOOLEAN, false, null));
    columns.push(FeatureColumn.createColumn(5, 'test_blob.test', DataTypes.BLOB, false, null));
    columns.push(FeatureColumn.createColumn(6, 'test_integer.test', DataTypes.INTEGER, false, ""));

    geopackage.createFeatureTable('geom.test', geometryColumns, columns)
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
      dataType: DataTypes.nameFromType(DataTypes.TEXT)
    });
    properties.push({
      name: 'Number',
      dataType: DataTypes.nameFromType(DataTypes.INTEGER)
    });

    return geopackage.createFeatureTableFromProperties('NewTable', properties)
      .then(function() {
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
    columns.push(FeatureColumn.createColumn(7, 'test_text_limited.test', DataTypes.TEXT, false, null, 5));
    columns.push(FeatureColumn.createColumn(8, 'test_blob_limited.test', DataTypes.BLOB, false, null, 7));
    columns.push(FeatureColumn.createGeometryColumn(1, 'geom.test', wkb.typeMap.wkt.Point, false, null));
    columns.push(FeatureColumn.createColumn(2, 'test_text.test', DataTypes.TEXT, false, "default"));
    columns.push(FeatureColumn.createColumn(3, 'test_real.test', DataTypes.REAL, false, null));
    columns.push(FeatureColumn.createColumn(4, 'test_boolean.test', DataTypes.BOOLEAN, false, null));
    columns.push(FeatureColumn.createColumn(5, 'test_blob.test', DataTypes.BLOB, false, null));
    columns.push(FeatureColumn.createColumn(6, 'test_integer.test', DataTypes.INTEGER, false, 5));

    var dc = new DataColumns();
    dc.table_name = 'test_features.test';
    dc.column_name = 'test_text_limited.test';
    dc.name = 'Test Name';
    dc.title = 'Test';
    dc.description = 'Test Description';
    dc.mime_type = 'text/html';
    dc.constraint_name = 'test constraint';

    return geopackage.createFeatureTable('geom.test', geometryColumns, columns, boundingBox, 4326, [dc])
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
          geometryType: 1 },
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
      var columns = [];

      columns.push(FeatureColumn.createPrimaryKeyColumnWithIndexAndName(0, 'id'));
      columns.push(FeatureColumn.createColumn(7, 'test_text_limited', DataTypes.TEXT, false, null, 5));
      columns.push(FeatureColumn.createColumn(8, 'test_blob_limited', DataTypes.BLOB, false, null, 7));
      columns.push(FeatureColumn.createGeometryColumn(1, 'geom', wkb.typeMap.wkt.Point, false, null));
      columns.push(FeatureColumn.createColumn(2, 'test_text.test', DataTypes.TEXT, false, ""));
      columns.push(FeatureColumn.createColumn(3, 'test_real', DataTypes.REAL, false, null));
      columns.push(FeatureColumn.createColumn(4, 'test_boolean', DataTypes.BOOLEAN, false, null));
      columns.push(FeatureColumn.createColumn(5, 'test_blob', DataTypes.BLOB, false, null));
      columns.push(FeatureColumn.createColumn(6, 'test_integer', DataTypes.INTEGER, false, ""));
      columns.push(FeatureColumn.createColumn(9, 'test space', DataTypes.TEXT, false, ""));
      columns.push(FeatureColumn.createColumn(10, 'test-dash', DataTypes.TEXT, false, ""));

      return geopackage.createFeatureTable(tableName, geometryColumns, columns)
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
      featureRow.geometry = geometryData;
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
      var geom = fr.geometry;
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
        featureRow.geometry = geometryData;
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
        var geom = fr.geometry;
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

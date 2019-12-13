import { GeoPackage as GeoPackageAPI } from '../../../.'
import { default as testSetup } from '../../fixtures/testSetup'
import DataColumnsDao from '../../../lib/dataColumns/dataColumnsDao'
import AttributeDao from '../../../lib/attributes/attributeDao'
import AttributeTableReader from '../../../lib/attributes/attributeTableReader'
import UserTableReader from '../../../lib/user/userTableReader'
import AttributeTable from '../../../lib/attributes/attributeTable'
import DataTypes from '../../../lib/db/dataTypes'

// var GeoPackageAPI = require('../../../.')
// var testSetup = require('../../fixtures/testSetup')
var Verification = require('../../fixtures/verification')
  , DataColumns = require('../../../lib/dataColumns/dataColumns').default

  , UserColumn = require('../../../lib/user/userColumn').default
  , should = require('chai').should()
  , path = require('path');

describe('GeoPackage Attribute table create tests', function() {
  var testGeoPackage;
  var testPath = path.join(__dirname, '..', 'tmp');
  var tableName = 'test_attributes.test';
  var geopackage;

  beforeEach(async function() {
    testGeoPackage = path.join(testPath, testSetup.createTempName());
    geopackage = await testSetup.createGeoPackage(testGeoPackage);
  });

  afterEach(async function() {
    geopackage.close();
    await testSetup.deleteGeoPackage(testGeoPackage);
  });

  it('should create an attribute table', async function() {
    geopackage.hasAttributeTable(tableName).should.be.equal(false);

    var columns = [];
    columns.push(UserColumn.createPrimaryKeyColumnWithIndexAndName(0, 'id'));
    columns.push(UserColumn.createColumnWithIndexAndMax(6, 'test_text_limited.test', DataTypes.GPKGDataType.GPKG_DT_TEXT, 5, false, null));
    columns.push(UserColumn.createColumnWithIndexAndMax(7, 'test_blob_limited.test', DataTypes.GPKGDataType.GPKG_DT_BLOB, 7, false, null));
    columns.push(UserColumn.createColumnWithIndex(1, 'test_text.test', DataTypes.GPKGDataType.GPKG_DT_TEXT, false, ""));
    columns.push(UserColumn.createColumnWithIndex(2, 'test_real.test', DataTypes.GPKGDataType.GPKG_DT_REAL, false, null));
    columns.push(UserColumn.createColumnWithIndex(3, 'test_boolean.test', DataTypes.GPKGDataType.GPKG_DT_BOOLEAN, false, null));
    columns.push(UserColumn.createColumnWithIndex(4, 'test_blob.test', DataTypes.GPKGDataType.GPKG_DT_BLOB, false, null));
    columns.push(UserColumn.createColumnWithIndex(5, 'test_integer.test', DataTypes.GPKGDataType.GPKG_DT_INTEGER, false, ""));
    await geopackage.createAttributeTable(tableName, columns)
    var contentsVerified = Verification.verifyContentsForTable(geopackage, tableName);
    contentsVerified.should.be.equal(true);
    var attributesTableExists = Verification.verifyTableExists(geopackage, tableName);
    attributesTableExists.should.be.equal(true);

    geopackage.hasAttributeTable(tableName).should.be.equal(true);
  });

  it('should create an attribute table from properties', function() {
    var properties = [];
    properties.push({
      name: 'Name',
      dataType: DataTypes.GPKG_DT_TEXT_NAME,
      dataColumn: new DataColumns({
        table_name: 'NewTable',
        column_name: 'Name',
        name: 'The Name',
        title: 'The Title',
        description: 'Description',
        mime_type: 'text'
      })
    });
    properties.push({
      name: 'Number',
      dataType: DataTypes.GPKG_DT_INTEGER_NAME
    });

    GeoPackageAPI.createAttributeTableWithProperties(geopackage, 'NewTable', properties)
      .then(function() {
        var reader = new AttributeTableReader('NewTable');
        var result = reader.readTable(geopackage.connection);
        var columns = result.columns;

        var plainObject = JSON.parse(JSON.stringify(columns));

        plainObject.should.deep.include.members([{
          index: 0,
          name: 'id',
          dataType: 5,
          notNull: true,
          primaryKey: true },
        { index: 1,
          name: 'Name',
          dataType: 9,
          notNull: false,
          primaryKey: false },
        { index: 2,
          name: 'Number',
          dataType: 5,
          notNull: false,
          primaryKey: false } ]);

        var dc = new DataColumnsDao(geopackage);
        var dataColumn = dc.getDataColumns('NewTable', 'Name');
        dataColumn.should.be.deep.equal({
          table_name: 'NewTable',
          column_name: 'Name',
          name: 'The Name',
          title: 'The Title',
          description: 'Description',
          mime_type: 'text',
          constraint_name: null });
      });
  });

  it('should create a media table from properties', function() {
    var properties = [];
    properties.push({
      name: 'Name',
      dataType: DataTypes.GPKG_DT_TEXT_NAME
    });
    properties.push({
      name: 'Number',
      dataType: DataTypes.GPKG_DT_INTEGER_NAME
    });

    var dao = GeoPackageAPI.createMediaTableWithProperties(geopackage, 'NewTable', properties);
    var reader = new UserTableReader('NewTable');
    var result = reader.readTable(geopackage.connection);
    var columns = result.columns;

    var plainObject = JSON.parse(JSON.stringify(columns));

    plainObject.should.deep.include.members([ {
      index: 0,
      name: 'id',
      dataType: 5,
      notNull: true,
      primaryKey: true },
    { index: 1,
      name: 'data',
      dataType: 10,
      notNull: true,
      primaryKey: false },
    { index: 2,
      name: 'content_type',
      dataType: 9,
      notNull: true,
      primaryKey: false },
    { index: 3,
      name: 'Name',
      dataType: 9,
      notNull: false,
      primaryKey: false },
    { index: 4,
      name: 'Number',
      dataType: 5,
      notNull: false,
      primaryKey: false } ]);
  });

  it('should create a simple attribute table from properties', function() {
    var properties = [];
    properties.push({
      name: 'Name',
      dataType: DataTypes.GPKG_DT_TEXT_NAME
    });
    properties.push({
      name: 'Number',
      dataType: DataTypes.GPKG_DT_INTEGER_NAME
    });

    var dao = GeoPackageAPI.createSimpleAttributesTableWithProperties(geopackage, 'NewTable', properties);
    var reader = new AttributeTableReader('NewTable');
    var result = reader.readTable(geopackage.connection);
    var columns = result.columns;

    var plainObject = JSON.parse(JSON.stringify(columns));

    plainObject.should.deep.include.members([{
      index: 0,
      name: 'id',
      dataType: 5,
      notNull: true,
      primaryKey: true },
    { index: 1,
      name: 'Name',
      dataType: 9,
      notNull: true,
      primaryKey: false },
    { index: 2,
      name: 'Number',
      dataType: 5,
      notNull: true,
      primaryKey: false } ]);
  });

  it('should not allow two primary key columns', function() {
    var columns = [];

    columns.push(UserColumn.createPrimaryKeyColumnWithIndexAndName(0, 'id'));
    columns.push(UserColumn.createPrimaryKeyColumnWithIndexAndName(1, 'idagain'));

    (function() {
      new AttributeTable(tableName, columns);
    }).should.throw();
  });

  it('should not allow missing column indexes', function() {
    var columns = [];

    columns.push(UserColumn.createPrimaryKeyColumnWithIndexAndName(1, 'id'));
    columns.push(UserColumn.createPrimaryKeyColumnWithIndexAndName(2, 'idagain'));

    (function() {
      new AttributeTable(tableName, columns);
    }).should.throw();
  });

  it('should fail to create an attribute table with an incorrect contents type', function() {
    var columns = [];

    columns.push(UserColumn.createPrimaryKeyColumnWithIndexAndName(0, 'id'));
    columns.push(UserColumn.createColumnWithIndexAndMax(6, 'test_text_limited.test', DataTypes.GPKGDataType.GPKG_DT_TEXT, 5, false, null));
    columns.push(UserColumn.createColumnWithIndexAndMax(7, 'test_blob_limited.test', DataTypes.GPKGDataType.GPKG_DT_BLOB, 7, false, null));
    columns.push(UserColumn.createColumnWithIndex(1, 'test_text.test', DataTypes.GPKGDataType.GPKG_DT_TEXT, false, ""));
    columns.push(UserColumn.createColumnWithIndex(2, 'test_real.test', DataTypes.GPKGDataType.GPKG_DT_REAL, false, null));
    columns.push(UserColumn.createColumnWithIndex(3, 'test_boolean.test', DataTypes.GPKGDataType.GPKG_DT_BOOLEAN, false, null));
    columns.push(UserColumn.createColumnWithIndex(4, 'test_blob.test', DataTypes.GPKGDataType.GPKG_DT_BLOB, false, null));
    columns.push(UserColumn.createColumnWithIndex(5, 'test_integer.test', DataTypes.GPKGDataType.GPKG_DT_INTEGER, false, ""));

    var table = new AttributeTable(geopackage.connection, columns);
    (function() {
      table.setContents({data_type:'invalid'});
    }).should.throw();
  });

  it('should fail to create an attribute dao with no contents', function() {
    var columns = [];

    columns.push(UserColumn.createPrimaryKeyColumnWithIndexAndName(0, 'id'));
    columns.push(UserColumn.createColumnWithIndexAndMax(6, 'test_text_limited.test', DataTypes.GPKGDataType.GPKG_DT_TEXT, 5, false, null));
    columns.push(UserColumn.createColumnWithIndexAndMax(7, 'test_blob_limited.test', DataTypes.GPKGDataType.GPKG_DT_BLOB, 7, false, null));
    columns.push(UserColumn.createColumnWithIndex(1, 'test_text.test', DataTypes.GPKGDataType.GPKG_DT_TEXT, false, ""));
    columns.push(UserColumn.createColumnWithIndex(2, 'test_real.test', DataTypes.GPKGDataType.GPKG_DT_REAL, false, null));
    columns.push(UserColumn.createColumnWithIndex(3, 'test_boolean.test', DataTypes.GPKGDataType.GPKG_DT_BOOLEAN, false, null));
    columns.push(UserColumn.createColumnWithIndex(4, 'test_blob.test', DataTypes.GPKGDataType.GPKG_DT_BLOB, false, null));
    columns.push(UserColumn.createColumnWithIndex(5, 'test_integer.test', DataTypes.GPKGDataType.GPKG_DT_INTEGER, false, ""));

    var table = new AttributeTable(geopackage.connection, columns);

    (function() {
      new AttributeDao(geopackage, table);
    }).should.throw();
  });

  it('should create a attribute table and read the information about it', function() {

    var columns = [];

    columns.push(UserColumn.createPrimaryKeyColumnWithIndexAndName(0, 'id'));
    columns.push(UserColumn.createColumnWithIndexAndMax(6, 'test_text_limited.test', DataTypes.GPKGDataType.GPKG_DT_TEXT, 5, false, null));
    columns.push(UserColumn.createColumnWithIndexAndMax(7, 'test_blob_limited.test', DataTypes.GPKGDataType.GPKG_DT_BLOB, 7, false, null));
    columns.push(UserColumn.createColumnWithIndex(1, 'test_text.test', DataTypes.GPKGDataType.GPKG_DT_TEXT, false, "default"));
    columns.push(UserColumn.createColumnWithIndex(2, 'test_real.test', DataTypes.GPKGDataType.GPKG_DT_REAL, false, null));
    columns.push(UserColumn.createColumnWithIndex(3, 'test_boolean.test', DataTypes.GPKGDataType.GPKG_DT_BOOLEAN, false, null));
    columns.push(UserColumn.createColumnWithIndex(4, 'test_blob.test', DataTypes.GPKGDataType.GPKG_DT_BLOB, false, null));
    columns.push(UserColumn.createColumnWithIndex(5, 'test_integer.test', DataTypes.GPKGDataType.GPKG_DT_INTEGER, false, 5));

    var dc = new DataColumns();
    dc.table_name = 'test_attributes.test';
    dc.column_name = 'test_text_limited.test';
    dc.name = 'Test Name';
    dc.title = 'Test';
    dc.description = 'Test Description';
    dc.mime_type = 'text/html';
    dc.constraint_name = 'test constraint';

    return geopackage.createAttributeTable(tableName, columns, [dc])
      .then(function() {
        var reader = new AttributeTableReader(tableName);
        var result = reader.readTable(geopackage.connection);
        var columns = result.columns;
        var plainObject = JSON.parse(JSON.stringify(columns));

        plainObject.should.deep.include.members([{ index: 0,
          name: 'id',
          dataType: 5,
          notNull: true,
          primaryKey: true },
        { index: 1,
          name: 'test_text.test',
          dataType: 9,
          notNull: false,
          defaultValue: "\'default\'",
          primaryKey: false },
        { index: 2,
          name: 'test_real.test',
          dataType: 8,
          notNull: false,
          primaryKey: false },
        { index: 3,
          name: 'test_boolean.test',
          dataType: 0,
          notNull: false,
          primaryKey: false },
        { index: 4,
          name: 'test_blob.test',
          dataType: 10,
          notNull: false,
          primaryKey: false },
        { index: 5,
          name: 'test_integer.test',
          dataType: 5,
          notNull: false,
          defaultValue: '5',
          primaryKey: false },
        { index: 6,
          name: 'test_text_limited.test',
          dataType: 9,
          max: 5,
          notNull: false,
          primaryKey: false },
        { index: 7,
          name: 'test_blob_limited.test',
          dataType: 10,
          max: 7,
          notNull: false,
          primaryKey: false } ]);
        var dao = new DataColumnsDao(geopackage);
        var dataColumn = dao.getDataColumns('test_attributes.test', 'test_text_limited.test');
        dataColumn.should.be.deep.equal({
          table_name: 'test_attributes.test',
          column_name: 'test_text_limited.test',
          name: 'Test Name',
          title: 'Test',
          description: 'Test Description',
          mime_type: 'text/html',
          constraint_name: 'test constraint'
        });
      });
  });

  describe('GeoPackage attribute CRUD tests', function(done) {

    beforeEach(function() {
      var columns = [];

      columns.push(UserColumn.createPrimaryKeyColumnWithIndexAndName(0, 'id'));
      columns.push(UserColumn.createColumnWithIndexAndMax(6, 'test_text_limited', DataTypes.GPKGDataType.GPKG_DT_TEXT, 5, false, null));
      columns.push(UserColumn.createColumnWithIndexAndMax(7, 'test_blob_limited', DataTypes.GPKGDataType.GPKG_DT_BLOB, 7, false, null));
      columns.push(UserColumn.createColumnWithIndex(10, 'test_boolean2', DataTypes.GPKGDataType.GPKG_DT_BOOLEAN, false, null));

      columns.push(UserColumn.createColumnWithIndex(1, 'test_text.test', DataTypes.GPKGDataType.GPKG_DT_TEXT, false, ""));
      columns.push(UserColumn.createColumnWithIndex(2, 'test_real', DataTypes.GPKGDataType.GPKG_DT_REAL, false, null));
      columns.push(UserColumn.createColumnWithIndex(3, 'test_boolean', DataTypes.GPKGDataType.GPKG_DT_BOOLEAN, false, null));
      columns.push(UserColumn.createColumnWithIndex(4, 'test_blob', DataTypes.GPKGDataType.GPKG_DT_BLOB, false, null));
      columns.push(UserColumn.createColumnWithIndex(5, 'test_integer', DataTypes.GPKGDataType.GPKG_DT_INTEGER, false, ""));
      columns.push(UserColumn.createColumnWithIndex(8, 'test space', DataTypes.GPKGDataType.GPKG_DT_TEXT, false, ""));
      columns.push(UserColumn.createColumnWithIndex(9, 'test-dash', DataTypes.GPKGDataType.GPKG_DT_TEXT, false, ""));

      return geopackage.createAttributeTable(tableName, columns)
        .then(function(result) {
          var contentsVerified = Verification.verifyContentsForTable(geopackage, tableName);
          contentsVerified.should.be.equal(true);
          var attributesTableExists = Verification.verifyTableExists(geopackage, tableName);
          attributesTableExists.should.be.equal(true);
        });
    });

    it('should create an attribute', function() {
      var attributeDao = geopackage.getAttributeDaoWithTableName(tableName);
      var attributeRow = attributeDao.newRow();
      attributeRow.setValueWithColumnName('test_text.test', 'hello');
      attributeRow.setValueWithColumnName('test_real', 3.0);
      attributeRow.setValueWithColumnName('test_boolean', true);
      attributeRow.setValueWithColumnName('test_boolean2', false);
      attributeRow.setValueWithColumnName('test_blob', Buffer.from('test'));
      attributeRow.setValueWithColumnName('test_integer', 5);
      attributeRow.setValueWithColumnName('test_text_limited', 'testt');
      attributeRow.setValueWithColumnName('test_blob_limited', Buffer.from('testtes'));
      attributeRow.setValueWithColumnName('test space', 'space space');
      attributeRow.setValueWithColumnName('test-dash', 'dash-dash');

      var result = attributeDao.create(attributeRow);
      var count = attributeDao.getCount();
      count.should.be.equal(1);
      var rows = attributeDao.queryForAll();
      var ar = attributeDao.createObject(rows[0]);
      ar.getValueWithColumnName('test_text.test').should.be.equal('hello');
      ar.getValueWithColumnName('test_real').should.be.equal(3.0);
      ar.getValueWithColumnName('test_boolean').should.be.equal(true);
      ar.getValueWithColumnName('test_integer').should.be.equal(5);
      ar.getValueWithColumnName('test_blob').toString().should.be.equal('test');
      ar.getValueWithColumnName('test_text_limited').should.be.equal('testt');
      ar.getValueWithColumnName('test_blob_limited').toString().should.be.equal('testtes');
      ar.getValueWithColumnName('test space').toString().should.be.equal('space space');
      ar.getValueWithColumnName('test-dash').toString().should.be.equal('dash-dash');
    });

    describe('delete attribute tests', function(done) {
      var attributeDao;

      beforeEach(function() {
        attributeDao = geopackage.getAttributeDaoWithTableName(tableName);
        var attributeRow = attributeDao.createObject();
        attributeRow.setValueWithColumnName('test_text.test', 'hello');
        attributeRow.setValueWithColumnName('test_real', 3.0);
        attributeRow.setValueWithColumnName('test_boolean', attributeRow.toObjectValue(3, 1));
        attributeRow.setValueWithColumnName('test_boolean2', attributeRow.toObjectValue(10, 0));
        attributeRow.setValueWithColumnName('test_blob', Buffer.from('test'));
        attributeRow.setValueWithColumnName('test_integer', 5);
        attributeRow.setValueWithColumnName('test_text_limited', 'testt');
        attributeRow.setValueWithColumnName('test_blob_limited', Buffer.from('testtes'));
        attributeRow.setValueWithColumnName('test space', 'space space');
        attributeRow.setValueWithColumnName('test-dash', 'dash-dash');

        var result = attributeDao.create(attributeRow);
        var count = attributeDao.getCount();
        count.should.be.equal(1);
        var rows = attributeDao.queryForAll();
        var ar = attributeDao.createObject(rows[0]);
        ar.getValueWithColumnName('test_text.test').should.be.equal('hello');
        ar.getValueWithColumnName('test_real').should.be.equal(3.0);
        ar.getValueWithColumnName('test_boolean').should.be.equal(true);
        ar.getValueWithColumnName('test_boolean2').should.be.equal(false);
        ar.getValueWithColumnName('test_integer').should.be.equal(5);
        ar.getValueWithColumnName('test_blob').toString().should.be.equal('test');
        ar.getValueWithColumnName('test_text_limited').should.be.equal('testt');
        ar.getValueWithColumnName('test_blob_limited').toString().should.be.equal('testtes');
        ar.getValueWithColumnName('test space').toString().should.be.equal('space space');
        ar.getValueWithColumnName('test-dash').toString().should.be.equal('dash-dash');
      });

      it('should delete the attribute', function() {
        var count = attributeDao.getCount();
        count.should.be.equal(1);

        var rows = attributeDao.queryForAll();
        var ar = attributeDao.createObject(rows[0]);
        var result = attributeDao.delete(ar);
        var count = attributeDao.getCount();
        count.should.be.equal(0);
      });
    });
  });

});

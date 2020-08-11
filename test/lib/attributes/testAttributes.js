import { default as testSetup } from '../../fixtures/testSetup'
import {DataColumnsDao} from '../../../lib/dataColumns/dataColumnsDao'
import {AttributesDao} from '../../../lib/attributes/attributesDao'
import {AttributesTableReader} from '../../../lib/attributes/attributesTableReader'
import {AttributesTable} from '../../../lib/attributes/attributesTable'
import {GeoPackageDataType} from '../../../lib/db/geoPackageDataType'
import {Contents} from '../../../lib/core/contents/contents'
import {ConstraintType} from '../../../lib/db/table/constraintType'
import {UserCustomTableReader} from '../../../lib/user/custom/userCustomTableReader'
import {TableInfo} from "../../../lib/db/table/tableInfo";

// var GeoPackageAPI = require('../../../.')
// var testSetup = require('../../fixtures/testSetup')
var Verification = require('../../fixtures/verification')
  , DataColumns = require('../../../lib/dataColumns/dataColumns').DataColumns

  , UserColumn = require('../../../lib/user/userColumn').UserColumn;

describe('GeoPackage Attribute table create tests', function() {
  var testGeoPackage;
  var tableName = 'test_attributes.test';
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

  it('should create an attribute table', async function() {
    geopackage.hasAttributeTable(tableName).should.be.equal(false);

    var columns = [];
    columns.push(UserColumn.createPrimaryKeyColumnWithIndexAndName(0, 'id'));
    columns.push(UserColumn.createColumn(6, 'test_text_limited.test', GeoPackageDataType.TEXT, false, null, 5));
    columns.push(UserColumn.createColumn(7, 'test_blob_limited.test', GeoPackageDataType.BLOB, false, null, 7));
    columns.push(UserColumn.createColumn(1, 'test_text.test', GeoPackageDataType.TEXT, false, ""));
    columns.push(UserColumn.createColumn(2, 'test_real.test', GeoPackageDataType.REAL, false, null));
    columns.push(UserColumn.createColumn(3, 'test_boolean.test', GeoPackageDataType.BOOLEAN, false, null));
    columns.push(UserColumn.createColumn(4, 'test_blob.test', GeoPackageDataType.BLOB, false, null));
    columns.push(UserColumn.createColumn(5, 'test_integer.test', GeoPackageDataType.INTEGER, false, null));
    geopackage.createAttributesTable(tableName, columns)
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
      dataType: GeoPackageDataType.nameFromType(GeoPackageDataType.TEXT),
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
      dataType: GeoPackageDataType.nameFromType(GeoPackageDataType.INTEGER)
    });

    geopackage.createAttributesTableFromProperties('NewTable', properties);
    var reader = new AttributesTableReader('NewTable');
    var result = reader.readTable(geopackage.connection);
    var columns = result.getUserColumns().getColumns();

    var plainObject = JSON.parse(JSON.stringify(columns));

    plainObject.should.deep.include.members([{
      constraints: [
        {
          name: null,
          sql: "NOT NULL",
          type: ConstraintType.NOT_NULL
        },
        {
          name: null,
          sql: "PRIMARY KEY AUTOINCREMENT",
          type: ConstraintType.PRIMARY_KEY
        }
      ],
      index: 0,
      type: GeoPackageDataType.nameFromType(GeoPackageDataType.INTEGER),
      name: 'id',
      dataType: 5,
      max: null,
      notNull: true,
      primaryKey: true
    },
    {
      index: 1,
      constraints: [],
      name: 'Name',
      max: null,
      dataType: 9,
      notNull: false,
      primaryKey: false,
      type: GeoPackageDataType.nameFromType(GeoPackageDataType.TEXT)
    },
    {
      index: 2,
      constraints: [],
      name: 'Number',
      max: null,
      dataType: 5,
      notNull: false,
      primaryKey: false,
      type: GeoPackageDataType.nameFromType(GeoPackageDataType.INTEGER)
    }]);

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

  it('should create a media table from properties', function() {
    var properties = [];
    properties.push({
      name: 'Name',
      dataType: GeoPackageDataType.nameFromType(GeoPackageDataType.TEXT)
    });
    properties.push({
      name: 'Number',
      dataType: GeoPackageDataType.nameFromType(GeoPackageDataType.INTEGER)
    });

    var dao = geopackage.createMediaTable('NewTable', properties);
    var reader = new UserCustomTableReader('NewTable');
    var result = reader.readTable(geopackage.connection);
    var columns = result.getUserColumns().getColumns();

    var plainObject = JSON.parse(JSON.stringify(columns));

    plainObject.should.deep.include.members([ {
      index: 0,
      name: 'id',
      dataType: 5,
      notNull: true,
      primaryKey: true,
      max: null,
      type: GeoPackageDataType.nameFromType(GeoPackageDataType.INTEGER),
      constraints: [
        {
          name: null,
          sql: "NOT NULL",
          type: ConstraintType.NOT_NULL
        },
        {
          name: null,
          sql: "PRIMARY KEY AUTOINCREMENT",
          type: ConstraintType.PRIMARY_KEY
        }
      ]
    },
    {
      index: 1,
      name: 'data',
      dataType: 10,
      notNull: true,
      primaryKey: false,
      max: null,
      type: GeoPackageDataType.nameFromType(GeoPackageDataType.BLOB),
      constraints: [
        {
          name: null,
          sql: "NOT NULL",
          type: ConstraintType.NOT_NULL
        }
      ]
    },
    {
      index: 2,
      name: 'content_type',
      dataType: 9,
      notNull: true,
      primaryKey: false,
      max: null,
      type: GeoPackageDataType.nameFromType(GeoPackageDataType.TEXT),
      constraints: [
        {
          name: null,
          sql: "NOT NULL",
          type: ConstraintType.NOT_NULL
        }
      ]
    },
    {
      index: 3,
      name: 'Name',
      dataType: 9,
      notNull: false,
      primaryKey: false,
      max: null,
      type: GeoPackageDataType.nameFromType(GeoPackageDataType.TEXT),
      constraints: []
    },
    {
      index: 4,
      name: 'Number',
      dataType: 5,
      notNull: false,
      primaryKey: false,
      max: null,
      type: GeoPackageDataType.nameFromType(GeoPackageDataType.INTEGER),
      constraints: []
    } ]);
  });

  it('should create a simple attribute table from properties', function() {
    var properties = [];
    properties.push({
      name: 'Name',
      dataType: GeoPackageDataType.nameFromType(GeoPackageDataType.TEXT)
    });
    properties.push({
      name: 'Number',
      dataType: GeoPackageDataType.nameFromType(GeoPackageDataType.INTEGER)
    });

    var dao = geopackage.createSimpleAttributesTable('NewTable', properties);
    var reader = new AttributesTableReader('NewTable');
    var result = reader.readTable(geopackage.connection);
    var columns = result.getUserColumns().getColumns();

    var plainObject = JSON.parse(JSON.stringify(columns));

    plainObject.should.deep.include.members([
      {
        index: 0,
        name: 'id',
        dataType: 5,
        notNull: true,
        primaryKey: true,
        max: null,
        type: GeoPackageDataType.nameFromType(GeoPackageDataType.INTEGER),
        constraints: [
          {
            name: null,
            sql: "NOT NULL",
            type: ConstraintType.NOT_NULL
          },
          {
            name: null,
            sql: "PRIMARY KEY AUTOINCREMENT",
            type: ConstraintType.PRIMARY_KEY
          }
        ]
      },
      {
        index: 1,
        name: 'Name',
        dataType: 9,
        notNull: true,
        primaryKey: false,
        max: null,
        type: GeoPackageDataType.nameFromType(GeoPackageDataType.TEXT),
        constraints: [
          {
            name: null,
            sql: "NOT NULL",
            type: ConstraintType.NOT_NULL
          }
        ]
      },
      {
        index: 2,
        name: 'Number',
        dataType: 5,
        notNull: true,
        primaryKey: false,
        max: null,
        type: GeoPackageDataType.nameFromType(GeoPackageDataType.INTEGER),
        constraints: [
          {
            name: null,
            sql: "NOT NULL",
            type: ConstraintType.NOT_NULL
          }
        ]
      }
    ]);
  });

  it('should not allow two primary key columns', function() {
    var columns = [];

    columns.push(UserColumn.createPrimaryKeyColumnWithIndexAndName(0, 'id'));
    columns.push(UserColumn.createPrimaryKeyColumnWithIndexAndName(1, 'idagain'));

    (function() {
      new AttributesTable(tableName, columns);
    }).should.throw();
  });

  it('should not allow missing column indexes', function() {
    var columns = [];

    columns.push(UserColumn.createPrimaryKeyColumnWithIndexAndName(1, 'id'));
    columns.push(UserColumn.createPrimaryKeyColumnWithIndexAndName(2, 'idagain'));

    (function() {
      new AttributesTable(tableName, columns);
    }).should.throw();
  });

  it('should fail to create an attribute table with an incorrect contents type', function() {
    var columns = [];

    columns.push(UserColumn.createPrimaryKeyColumnWithIndexAndName(0, 'id'));
    columns.push(UserColumn.createColumn(6, 'test_text_limited.test', GeoPackageDataType.TEXT, false, null, 5));
    columns.push(UserColumn.createColumn(7, 'test_blob_limited.test', GeoPackageDataType.BLOB, false, null, 7));
    columns.push(UserColumn.createColumn(1, 'test_text.test', GeoPackageDataType.TEXT, false, ""));
    columns.push(UserColumn.createColumn(2, 'test_real.test', GeoPackageDataType.REAL, false, null));
    columns.push(UserColumn.createColumn(3, 'test_boolean.test', GeoPackageDataType.BOOLEAN, false, null));
    columns.push(UserColumn.createColumn(4, 'test_blob.test', GeoPackageDataType.BLOB, false, null));
    columns.push(UserColumn.createColumn(5, 'test_integer.test', GeoPackageDataType.INTEGER, false, null));

    var table = new AttributesTable(geopackage.connection, columns);
    (function() {
      var contents = new Contents();
      contents.data_type = 'invalid';
      table.setContents(contents);
    }).should.throw();
  });

  it('should fail to create an attribute dao with no contents', function() {
    var columns = [];

    columns.push(UserColumn.createPrimaryKeyColumnWithIndexAndName(0, 'id'));
    columns.push(UserColumn.createColumn(6, 'test_text_limited.test', GeoPackageDataType.TEXT, false, null, 5));
    columns.push(UserColumn.createColumn(7, 'test_blob_limited.test', GeoPackageDataType.BLOB, false, null, 7));
    columns.push(UserColumn.createColumn(1, 'test_text.test', GeoPackageDataType.TEXT, false, ""));
    columns.push(UserColumn.createColumn(2, 'test_real.test', GeoPackageDataType.REAL, false, null));
    columns.push(UserColumn.createColumn(3, 'test_boolean.test', GeoPackageDataType.BOOLEAN, false, null));
    columns.push(UserColumn.createColumn(4, 'test_blob.test', GeoPackageDataType.BLOB, false, null));
    columns.push(UserColumn.createColumn(5, 'test_integer.test', GeoPackageDataType.INTEGER, false, null));

    var table = new AttributesTable(geopackage.connection, columns);

    (function() {
      new AttributesDao(geopackage, table);
    }).should.throw();
  });

  it('should create a attribute table and read the information about it', function() {

    var columns = [];

    columns.push(UserColumn.createPrimaryKeyColumnWithIndexAndName(0, 'id'));
    columns.push(UserColumn.createColumn(6, 'test_text_limited.test', GeoPackageDataType.TEXT, false, null, 5));
    columns.push(UserColumn.createColumn(7, 'test_blob_limited.test', GeoPackageDataType.BLOB, false, null, 7));
    columns.push(UserColumn.createColumn(1, 'test_text.test', GeoPackageDataType.TEXT, false, "default"));
    columns.push(UserColumn.createColumn(2, 'test_real.test', GeoPackageDataType.REAL, false, null));
    columns.push(UserColumn.createColumn(3, 'test_boolean.test', GeoPackageDataType.BOOLEAN, false, null));
    columns.push(UserColumn.createColumn(4, 'test_blob.test', GeoPackageDataType.BLOB, false, null));
    columns.push(UserColumn.createColumn(5, 'test_integer.test', GeoPackageDataType.INTEGER, false, 5));

    var dc = new DataColumns();
    dc.table_name = 'test_attributes.test';
    dc.column_name = 'test_text_limited.test';
    dc.name = 'Test Name';
    dc.title = 'Test';
    dc.description = 'Test Description';
    dc.mime_type = 'text/html';
    dc.constraint_name = 'test constraint';

    geopackage.createAttributesTable(tableName, columns, [], [dc]);
    var reader = new AttributesTableReader(tableName);
    var result = reader.readTable(geopackage.connection);
    columns = result.getUserColumns().getColumns();
    var plainObject = JSON.parse(JSON.stringify(columns));
    plainObject.should.deep.include.members([
      {
        index: 0,
        name: 'id',
        dataType: 5,
        notNull: true,
        primaryKey: true,
        max: null,
        type: GeoPackageDataType.nameFromType(GeoPackageDataType.INTEGER),
        constraints: [
          {
            name: null,
            sql: "NOT NULL",
            type: ConstraintType.NOT_NULL
          },
          {
            name: null,
            sql: "PRIMARY KEY AUTOINCREMENT",
            type: ConstraintType.PRIMARY_KEY
          }
        ]
      },
      {
        index: 1,
        name: 'test_text.test',
        dataType: 9,
        notNull: false,
        defaultValue: "\'default\'",
        primaryKey: false,
        max: null,
        type: GeoPackageDataType.nameFromType(GeoPackageDataType.TEXT),
        constraints: [{
          name: null,
          sql: "DEFAULT 'default'",
          type: ConstraintType.DEFAULT
        }]
      },
      {
        index: 2,
        name: 'test_real.test',
        dataType: 8,
        notNull: false,
        primaryKey: false,
        max: null,
        type: GeoPackageDataType.nameFromType(GeoPackageDataType.REAL),
        constraints: []
      },
      {
        index: 3,
        name: 'test_boolean.test',
        dataType: 0,
        notNull: false,
        primaryKey: false,
        max: null,
        type: GeoPackageDataType.nameFromType(GeoPackageDataType.BOOLEAN),
        constraints: []
      },
      {
        index: 4,
        name: 'test_blob.test',
        dataType: 10,
        notNull: false,
        primaryKey: false,
        max: null,
        type: GeoPackageDataType.nameFromType(GeoPackageDataType.BLOB),
        constraints: []
      },
      {
        index: 5,
        name: 'test_integer.test',
        dataType: 5,
        notNull: false,
        defaultValue: '5',
        primaryKey: false,
        max: null,
        type: GeoPackageDataType.nameFromType(GeoPackageDataType.INTEGER),
        constraints: [{
          name: null,
          sql: "DEFAULT 5",
          type: ConstraintType.DEFAULT
        }]
      },
      {
        index: 6,
        name: 'test_text_limited.test',
        dataType: 9,
        max: 5,
        notNull: false,
        primaryKey: false,
        type: GeoPackageDataType.nameFromType(GeoPackageDataType.TEXT),
        constraints: []
      },
      {
        index: 7,
        name: 'test_blob_limited.test',
        dataType: 10,
        max: 7,
        notNull: false,
        primaryKey: false,
        type: GeoPackageDataType.nameFromType(GeoPackageDataType.BLOB),
        constraints: []
      }]);
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

  describe('GeoPackage attribute CRUD tests', function(done) {

    beforeEach(function() {
      var columns = [];

      columns.push(UserColumn.createPrimaryKeyColumnWithIndexAndName(0, 'id'));
      columns.push(UserColumn.createColumn(6, 'test_text_limited', GeoPackageDataType.TEXT, false, null, 5));
      columns.push(UserColumn.createColumn(7, 'test_blob_limited', GeoPackageDataType.BLOB, false, null, 7));
      columns.push(UserColumn.createColumn(10, 'test_boolean2', GeoPackageDataType.BOOLEAN, false, null));
      columns.push(UserColumn.createColumn(1, 'test_text.test', GeoPackageDataType.TEXT, false, ""));
      columns.push(UserColumn.createColumn(2, 'test_real', GeoPackageDataType.REAL, false, null));
      columns.push(UserColumn.createColumn(3, 'test_boolean', GeoPackageDataType.BOOLEAN, false, null));
      columns.push(UserColumn.createColumn(4, 'test_blob', GeoPackageDataType.BLOB, false, null));
      columns.push(UserColumn.createColumn(5, 'test_integer', GeoPackageDataType.INTEGER, false, null));
      columns.push(UserColumn.createColumn(8, 'test space', GeoPackageDataType.TEXT, false, ""));
      columns.push(UserColumn.createColumn(9, 'test-dash', GeoPackageDataType.TEXT, false, ""));

      geopackage.createAttributesTable(tableName, columns);
      var contentsVerified = Verification.verifyContentsForTable(geopackage, tableName);
      contentsVerified.should.be.equal(true);
      var attributesTableExists = Verification.verifyTableExists(geopackage, tableName);
      attributesTableExists.should.be.equal(true);
    });

    it('should create an attribute', function() {
      var attributeDao = geopackage.getAttributeDao(tableName);
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
        attributeDao = geopackage.getAttributeDao(tableName);
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

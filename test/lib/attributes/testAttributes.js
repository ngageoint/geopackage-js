var GeoPackageConnection = require('../../../lib/db/geoPackageConnection')
  , GeoPackage = require('../../../lib/geoPackage')
  , testSetup = require('../../fixtures/testSetup')
  , Verification = require('../../fixtures/verification')
  , DataColumns = require('../../../lib/dataColumns').DataColumns
  , DataColumnsDao = require('../../../lib/dataColumns').DataColumnsDao
  , AttributeColumn = require('../../../lib/attributes/attributeColumn')
  , AttributeDao = require('../../../lib/attributes/attributeDao')
  , AttributeTableReader = require('../../../lib/attributes/attributeTableReader')
  , AttributeTable = require('../../../lib/attributes/attributeTable')
  , DataTypes = require('../../../lib/db/dataTypes')
  , should = require('chai').should()
  , path = require('path');

describe('GeoPackage Attribute table create tests', function() {
  var testGeoPackage;
  var testPath = path.join(__dirname, '..', 'tmp');
  var tableName = 'test_attributes.test';
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

  it('should create an attribute table', function() {
    var columns = [];

    columns.push(AttributeColumn.createPrimaryKeyColumnWithIndexAndName(0, 'id'));
    columns.push(AttributeColumn.createColumnWithIndexAndMax(6, 'test_text_limited.test', DataTypes.GPKGDataType.GPKG_DT_TEXT, 5, false, null));
    columns.push(AttributeColumn.createColumnWithIndexAndMax(7, 'test_blob_limited.test', DataTypes.GPKGDataType.GPKG_DT_BLOB, 7, false, null));
    columns.push(AttributeColumn.createColumnWithIndex(1, 'test_text.test', DataTypes.GPKGDataType.GPKG_DT_TEXT, false, ""));
    columns.push(AttributeColumn.createColumnWithIndex(2, 'test_real.test', DataTypes.GPKGDataType.GPKG_DT_REAL, false, null));
    columns.push(AttributeColumn.createColumnWithIndex(3, 'test_boolean.test', DataTypes.GPKGDataType.GPKG_DT_BOOLEAN, false, null));
    columns.push(AttributeColumn.createColumnWithIndex(4, 'test_blob.test', DataTypes.GPKGDataType.GPKG_DT_BLOB, false, null));
    columns.push(AttributeColumn.createColumnWithIndex(5, 'test_integer.test', DataTypes.GPKGDataType.GPKG_DT_INTEGER, false, ""));

    return geopackage.createAttributeTable(tableName, columns)
    .then(function(result) {
      var contentsVerified = Verification.verifyContentsForTable(geopackage, tableName);
      contentsVerified.should.be.equal(true);
      var attributesTableExists = Verification.verifyTableExists(geopackage, tableName);
      attributesTableExists.should.be.equal(true);
    });
  });

  it('should fail to create an attribute table with an incorrect contents type', function() {
    var columns = [];

    columns.push(AttributeColumn.createPrimaryKeyColumnWithIndexAndName(0, 'id'));
    columns.push(AttributeColumn.createColumnWithIndexAndMax(6, 'test_text_limited.test', DataTypes.GPKGDataType.GPKG_DT_TEXT, 5, false, null));
    columns.push(AttributeColumn.createColumnWithIndexAndMax(7, 'test_blob_limited.test', DataTypes.GPKGDataType.GPKG_DT_BLOB, 7, false, null));
    columns.push(AttributeColumn.createColumnWithIndex(1, 'test_text.test', DataTypes.GPKGDataType.GPKG_DT_TEXT, false, ""));
    columns.push(AttributeColumn.createColumnWithIndex(2, 'test_real.test', DataTypes.GPKGDataType.GPKG_DT_REAL, false, null));
    columns.push(AttributeColumn.createColumnWithIndex(3, 'test_boolean.test', DataTypes.GPKGDataType.GPKG_DT_BOOLEAN, false, null));
    columns.push(AttributeColumn.createColumnWithIndex(4, 'test_blob.test', DataTypes.GPKGDataType.GPKG_DT_BLOB, false, null));
    columns.push(AttributeColumn.createColumnWithIndex(5, 'test_integer.test', DataTypes.GPKGDataType.GPKG_DT_INTEGER, false, ""));

    var table = new AttributeTable(geopackage.connection, columns);
    (function() {
      table.setContents({data_type:'invalid'});
    }).should.throw();
  });

  it('should fail to create an attribute dao with no contents', function() {
    var columns = [];

    columns.push(AttributeColumn.createPrimaryKeyColumnWithIndexAndName(0, 'id'));
    columns.push(AttributeColumn.createColumnWithIndexAndMax(6, 'test_text_limited.test', DataTypes.GPKGDataType.GPKG_DT_TEXT, 5, false, null));
    columns.push(AttributeColumn.createColumnWithIndexAndMax(7, 'test_blob_limited.test', DataTypes.GPKGDataType.GPKG_DT_BLOB, 7, false, null));
    columns.push(AttributeColumn.createColumnWithIndex(1, 'test_text.test', DataTypes.GPKGDataType.GPKG_DT_TEXT, false, ""));
    columns.push(AttributeColumn.createColumnWithIndex(2, 'test_real.test', DataTypes.GPKGDataType.GPKG_DT_REAL, false, null));
    columns.push(AttributeColumn.createColumnWithIndex(3, 'test_boolean.test', DataTypes.GPKGDataType.GPKG_DT_BOOLEAN, false, null));
    columns.push(AttributeColumn.createColumnWithIndex(4, 'test_blob.test', DataTypes.GPKGDataType.GPKG_DT_BLOB, false, null));
    columns.push(AttributeColumn.createColumnWithIndex(5, 'test_integer.test', DataTypes.GPKGDataType.GPKG_DT_INTEGER, false, ""));

    var table = new AttributeTable(geopackage.connection, columns);

    (function() {
      new AttributeDao(geopackage.connection, table);
    }).should.throw();
  });

  it('should create a attribute table and read the information about it', function() {

    var columns = [];

    columns.push(AttributeColumn.createPrimaryKeyColumnWithIndexAndName(0, 'id'));
    columns.push(AttributeColumn.createColumnWithIndexAndMax(6, 'test_text_limited.test', DataTypes.GPKGDataType.GPKG_DT_TEXT, 5, false, null));
    columns.push(AttributeColumn.createColumnWithIndexAndMax(7, 'test_blob_limited.test', DataTypes.GPKGDataType.GPKG_DT_BLOB, 7, false, null));
    columns.push(AttributeColumn.createColumnWithIndex(1, 'test_text.test', DataTypes.GPKGDataType.GPKG_DT_TEXT, false, "default"));
    columns.push(AttributeColumn.createColumnWithIndex(2, 'test_real.test', DataTypes.GPKGDataType.GPKG_DT_REAL, false, null));
    columns.push(AttributeColumn.createColumnWithIndex(3, 'test_boolean.test', DataTypes.GPKGDataType.GPKG_DT_BOOLEAN, false, null));
    columns.push(AttributeColumn.createColumnWithIndex(4, 'test_blob.test', DataTypes.GPKGDataType.GPKG_DT_BLOB, false, null));
    columns.push(AttributeColumn.createColumnWithIndex(5, 'test_integer.test', DataTypes.GPKGDataType.GPKG_DT_INTEGER, false, 5));

    var dc = new DataColumns();
    dc.table_name = 'test_attributes.test';
    dc.column_name = 'test_text_limited.test';
    dc.name = 'Test Name';
    dc.title = 'Test';
    dc.description = 'Test Description';
    dc.mime_type = 'text/html';
    dc.constraint_name = 'test constraint';

    return geopackage.createAttributeTable(tableName, columns, [dc])
    .then(function(result) {
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
      var dao = new DataColumnsDao(geopackage.getDatabase());
      return dao.getDataColumns('test_attributes.test', 'test_text_limited.test')
      .then(function(dataColumn) {
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
  });

  describe('GeoPackage attribute CRUD tests', function(done) {

    beforeEach(function() {
      var columns = [];

      columns.push(AttributeColumn.createPrimaryKeyColumnWithIndexAndName(0, 'id'));
      columns.push(AttributeColumn.createColumnWithIndexAndMax(6, 'test_text_limited', DataTypes.GPKGDataType.GPKG_DT_TEXT, 5, false, null));
      columns.push(AttributeColumn.createColumnWithIndexAndMax(7, 'test_blob_limited', DataTypes.GPKGDataType.GPKG_DT_BLOB, 7, false, null));
      columns.push(AttributeColumn.createColumnWithIndex(10, 'test_boolean2', DataTypes.GPKGDataType.GPKG_DT_BOOLEAN, false, null));

      columns.push(AttributeColumn.createColumnWithIndex(1, 'test_text.test', DataTypes.GPKGDataType.GPKG_DT_TEXT, false, ""));
      columns.push(AttributeColumn.createColumnWithIndex(2, 'test_real', DataTypes.GPKGDataType.GPKG_DT_REAL, false, null));
      columns.push(AttributeColumn.createColumnWithIndex(3, 'test_boolean', DataTypes.GPKGDataType.GPKG_DT_BOOLEAN, false, null));
      columns.push(AttributeColumn.createColumnWithIndex(4, 'test_blob', DataTypes.GPKGDataType.GPKG_DT_BLOB, false, null));
      columns.push(AttributeColumn.createColumnWithIndex(5, 'test_integer', DataTypes.GPKGDataType.GPKG_DT_INTEGER, false, ""));
      columns.push(AttributeColumn.createColumnWithIndex(8, 'test space', DataTypes.GPKGDataType.GPKG_DT_TEXT, false, ""));
      columns.push(AttributeColumn.createColumnWithIndex(9, 'test-dash', DataTypes.GPKGDataType.GPKG_DT_TEXT, false, ""));

      return geopackage.createAttributeTable(tableName, columns)
      .then(function(result) {
        var contentsVerified = Verification.verifyContentsForTable(geopackage, tableName);
        contentsVerified.should.be.equal(true);
        var attributesTableExists = Verification.verifyTableExists(geopackage, tableName);
        attributesTableExists.should.be.equal(true);
      });
    });

    it('should create an attribute', function() {
      return geopackage.getAttributeDaoWithTableName(tableName)
      .then(function(attributeDao){
        var attributeRow = attributeDao.newRow();
        attributeRow.setValueWithColumnName('test_text.test', 'hello');
        attributeRow.setValueWithColumnName('test_real', 3.0);
        attributeRow.setValueWithColumnName('test_boolean', true);
        attributeRow.setValueWithColumnName('test_boolean2', false);
        attributeRow.setValueWithColumnName('test_blob', new Buffer('test'));
        attributeRow.setValueWithColumnName('test_integer', 5);
        attributeRow.setValueWithColumnName('test_text_limited', 'testt');
        attributeRow.setValueWithColumnName('test_blob_limited', new Buffer('testtes'));
        attributeRow.setValueWithColumnName('test space', 'space space');
        attributeRow.setValueWithColumnName('test-dash', 'dash-dash');

        var result = attributeDao.create(attributeRow);
        var count = attributeDao.getCount();
        count.should.be.equal(1);
        var rows = attributeDao.queryForAll();
        var ar = attributeDao.getAttributeRow(rows[0]);
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
    });

    describe('delete attribute tests', function(done) {
      var attributeDao;

      beforeEach(function() {
        return geopackage.getAttributeDaoWithTableName(tableName)
        .then(function(ad){
          attributeDao = ad;
          var attributeRow = attributeDao.createObject();
          attributeRow.setValueWithColumnName('test_text.test', 'hello');
          attributeRow.setValueWithColumnName('test_real', 3.0);
          attributeRow.setValueWithColumnName('test_boolean', attributeRow.toObjectValue(3, 1));
          attributeRow.setValueWithColumnName('test_boolean2', attributeRow.toObjectValue(10, 0));
          attributeRow.setValueWithColumnName('test_blob', new Buffer('test'));
          attributeRow.setValueWithColumnName('test_integer', 5);
          attributeRow.setValueWithColumnName('test_text_limited', 'testt');
          attributeRow.setValueWithColumnName('test_blob_limited', new Buffer('testtes'));
          attributeRow.setValueWithColumnName('test space', 'space space');
          attributeRow.setValueWithColumnName('test-dash', 'dash-dash');

          var result = attributeDao.create(attributeRow);
          var count = attributeDao.getCount();
          count.should.be.equal(1);
          var rows = attributeDao.queryForAll();
          var ar = attributeDao.getAttributeRow(rows[0]);
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

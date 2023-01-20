import { default as testSetup } from '../testSetup'
import { Point } from "@ngageoint/simple-features-js";
import { FeatureTableMetadata } from "../../lib/features/user/featureTableMetadata";
import { SchemaExtension } from "../../lib/extension/schema/schemaExtension";

var FeatureColumn = require('../../lib/features/user/featureColumn').FeatureColumn
  , DataColumns = require('../../lib/extension/schema/columns/dataColumns').DataColumns
  , DataColumnsDao = require('../../lib/extension/schema/columns/dataColumnsDao').DataColumnsDao
  , Verification = require('../verification')
  , SetupFeatureTable = require('../setupFeatureTable')
  , BoundingBox = require('../../lib/boundingBox').BoundingBox
  , GeoPackageDataType = require('../../lib/db/geoPackageDataType').GeoPackageDataType
  , GeometryData = require('../../lib/geom/geoPackageGeometryData').GeoPackageGeometryData
  , ConstraintType = require('../../lib/db/table/constraintType').ConstraintType
  , UserColumn = require('../../lib/user/userColumn').UserColumn
  , GeometryType = require('@ngageoint/simple-features-js').GeometryType
  , FeatureTableReader = require('../../lib/features/user/featureTableReader').FeatureTableReader
  , should = require('chai').should()

describe('GeoPackage Feature table create tests', function() {
  var testGeoPackage;
  var tableName = 'test_features.test';
  var geoPackage;

  const notNullPrimaryKeyConstraints = {
    constraints: [
      {
        name: null,
        order: UserColumn.NOT_NULL_CONSTRAINT_ORDER,
        sql: "NOT NULL",
        type: ConstraintType.NOT_NULL
      },
      {
        name: null,
        sql: "PRIMARY KEY",
        order: UserColumn.PRIMARY_KEY_CONSTRAINT_ORDER,
        type: ConstraintType.PRIMARY_KEY
      },
      {
        name: null,
        order: UserColumn.AUTOINCREMENT_CONSTRAINT_ORDER,
        sql: "AUTOINCREMENT",
        type: ConstraintType.AUTOINCREMENT
      }
    ],
    typedConstraints: {
      "0": [
        {
          name: null,
          order: UserColumn.PRIMARY_KEY_CONSTRAINT_ORDER,
          sql: "PRIMARY KEY",
          type: ConstraintType.PRIMARY_KEY,
        }
      ],
      "4": [
        {
          name: null,
          order: UserColumn.NOT_NULL_CONSTRAINT_ORDER,
          sql: "NOT NULL",
          type: ConstraintType.NOT_NULL,
        }
      ],
      "7": [
        {
          name: null,
          order: UserColumn.AUTOINCREMENT_CONSTRAINT_ORDER,
          sql: "AUTOINCREMENT",
          type: ConstraintType.AUTOINCREMENT,
        }
      ]
    }
  };

  const emptyConstraints = {
    constraints: [],
    typedConstraints: {},
  };

  const defaultConstraints = value => {
    return {
      constraints: [{
        name: null,
        order: UserColumn.DEFAULT_VALUE_CONSTRAINT_ORDER,
        sql: "DEFAULT " + value,
        type: ConstraintType.DEFAULT
      }],
      typedConstraints: {
        "5": [
          {
            name: null,
            order: UserColumn.DEFAULT_VALUE_CONSTRAINT_ORDER,
            sql: "DEFAULT " + value,
            type: ConstraintType.DEFAULT,
          }
        ]
      },
    };
  };

  beforeEach(async function() {
    let created = await testSetup.createTmpGeoPackage();
    testGeoPackage = created.path;
    geoPackage = created.geoPackage;
  });

  afterEach(async function() {
    geoPackage.close();
    await testSetup.deleteGeoPackage(testGeoPackage);
  });

  it('should create a feature table', function() {
    var geometryColumns = SetupFeatureTable.buildGeometryColumns(tableName, 'geom.test', GeometryType.POINT);
    var columns = [];

    columns.push(FeatureColumn.createColumn('test_text_limited.test', GeoPackageDataType.TEXT, false, null, 5));
    columns.push(FeatureColumn.createColumn('test_blob_limited.test', GeoPackageDataType.BLOB, false, null, 7));
    columns.push(FeatureColumn.createColumn('test_text.test', GeoPackageDataType.TEXT, false, ""));
    columns.push(FeatureColumn.createColumn('test_real.test', GeoPackageDataType.REAL, false, null));
    columns.push(FeatureColumn.createColumn('test_boolean.test', GeoPackageDataType.BOOLEAN, false, null));
    columns.push(FeatureColumn.createColumn('test_blob.test', GeoPackageDataType.BLOB, false, null));
    columns.push(FeatureColumn.createColumn('test_integer.test', GeoPackageDataType.INTEGER, false, null));

    var result = geoPackage.createFeatureTableWithFeatureTableMetadata(FeatureTableMetadata.create(geometryColumns, columns));
    should.exist(result);
    Verification.verifyGeometryColumns(geoPackage).should.be.equal(true);
    Verification.verifyTableExists(geoPackage, tableName).should.be.equal(true);
    Verification.verifyContentsForTable(geoPackage, tableName).should.be.equal(true);
    Verification.verifyGeometryColumnsForTable(geoPackage, tableName).should.be.equal(true);
  });

  it('should create a feature table from properties', function() {
    var properties = [];
    properties.push({
      name: 'Name',
      dataType: GeoPackageDataType.nameFromType(GeoPackageDataType.TEXT)
    });
    properties.push({
      name: 'Number',
      dataType: GeoPackageDataType.nameFromType(GeoPackageDataType.INTEGER)
    });

    geoPackage.createFeatureTableWithProperties('NewTable', properties);
    var reader = new FeatureTableReader('NewTable');
    var result = reader.readTable(geoPackage.getConnection());

    var columns = result.getUserColumns().getColumns();

    var plainObject = JSON.parse(JSON.stringify(columns));

    plainObject.should.deep.include.members([
      {
        index: 0,
        name: 'id',
        dataType: 5,
        notNull: true,
        primaryKey: true,
        autoincrement: true,
        geometryType: null,
        max: null,
        type: GeoPackageDataType.nameFromType(GeoPackageDataType.INTEGER),
        constraints: notNullPrimaryKeyConstraints,
      },
      {
        index: 1,
        name: 'geometry',
        notNull: false,
        primaryKey: false,
        autoincrement: false,
        geometryType: GeometryType.GEOMETRY,
        dataType: GeoPackageDataType.BLOB,
        max: null,
        type: GeometryType.nameFromType(GeometryType.GEOMETRY),
        constraints: emptyConstraints,
      },
      {
        index: 2,
        name: 'Name',
        dataType: 9,
        notNull: false,
        primaryKey: false,
        autoincrement: false,
        geometryType: null,
        max: null,
        type: GeoPackageDataType.nameFromType(GeoPackageDataType.TEXT),
        constraints: emptyConstraints,
      },
      {
        index: 3,
        name: 'Number',
        dataType: 5,
        notNull: false,
        primaryKey: false,
        autoincrement: false,
        geometryType: null,
        max: null,
        type: GeoPackageDataType.nameFromType(GeoPackageDataType.INTEGER),
        constraints: emptyConstraints
      }
    ]);
  });

  it('should create a feature table and read the information about it', function() {
    let geometryColumns = SetupFeatureTable.buildGeometryColumns(tableName, 'geom.test', GeometryType.POINT);
    let boundingBox = new BoundingBox(-180, 180, -80, 80);

    let columns = [];
    columns.push(FeatureColumn.createColumn('test_text.test', GeoPackageDataType.TEXT, false, "default"));
    columns.push(FeatureColumn.createColumn('test_real.test', GeoPackageDataType.REAL, false, null));
    columns.push(FeatureColumn.createColumn('test_boolean.test', GeoPackageDataType.BOOLEAN, false, null));
    columns.push(FeatureColumn.createColumn('test_blob.test', GeoPackageDataType.BLOB, false, null));
    columns.push(FeatureColumn.createColumn('test_integer.test', GeoPackageDataType.INTEGER, false, 5));
    columns.push(FeatureColumn.createColumn('test_text_limited.test', GeoPackageDataType.TEXT, false, null, 5));
    columns.push(FeatureColumn.createColumn('test_blob_limited.test', GeoPackageDataType.BLOB, false, null, 7));

    const dc = new DataColumns();
    dc.setTableName('test_features.test');
    dc.setColumnName('test_text_limited.test');
    dc.setName('Test Name');
    dc.setTitle('Test');
    dc.setDescription('Test Description');
    dc.setMimeType('text/html');
    dc.setConstraintName('test constraint');

    geoPackage.createFeatureTableWithFeatureTableMetadata(FeatureTableMetadata.create(geometryColumns, columns, undefined, boundingBox));
    const schemaExtension = new SchemaExtension(geoPackage);
    schemaExtension.createDataColumnsTable();
    schemaExtension.createDataColumnConstraintsTable();
    const dataColumnsDao = schemaExtension.getDataColumnsDao();
    dataColumnsDao.create(dc);

    const reader = new FeatureTableReader(tableName);
    const result = reader.readTable(geoPackage.getConnection());
    columns = result.getUserColumns().getColumns();

    const plainObject = JSON.parse(JSON.stringify(columns));

    plainObject.should.deep.include.members([
      {
        index: 0,
        name: 'id',
        dataType: 5,
        notNull: true,
        primaryKey: true,
        autoincrement: true,
        geometryType: null,
        max: null,
        type: GeoPackageDataType.nameFromType(GeoPackageDataType.INTEGER),
        constraints: notNullPrimaryKeyConstraints,
      },
      {
        index: 1,
        name: 'geom.test',
        notNull: false,
        primaryKey: false,
        autoincrement: false,
        geometryType: GeometryType.POINT,
        dataType: GeoPackageDataType.BLOB,
        max: null,
        type: GeometryType.nameFromType(GeometryType.POINT),
        constraints: emptyConstraints,
      },
      {
        index: 2,
        name: 'test_text.test',
        dataType: 9,
        notNull: false,
        defaultValue: "\'default\'",
        primaryKey: false,
        autoincrement: false,
        geometryType: null,
        max: null,
        type: GeoPackageDataType.nameFromType(GeoPackageDataType.TEXT),
        constraints: defaultConstraints('\'default\''),
      },
      {
        index: 3,
        name: 'test_real.test',
        dataType: 8,
        notNull: false,
        primaryKey: false,
        autoincrement: false,
        geometryType: null,
        max: null,
        type: GeoPackageDataType.nameFromType(GeoPackageDataType.REAL),
        constraints: emptyConstraints
      },
      {
        index: 4,
        name: 'test_boolean.test',
        dataType: 0,
        notNull: false,
        primaryKey: false,
        autoincrement: false,
        geometryType: null,
        max: null,
        type: GeoPackageDataType.nameFromType(GeoPackageDataType.BOOLEAN),
        constraints: emptyConstraints,
      },
      {
        index: 5,
        name: 'test_blob.test',
        dataType: 10,
        notNull: false,
        primaryKey: false,
        autoincrement: false,
        max: null,
        type: GeoPackageDataType.nameFromType(GeoPackageDataType.BLOB),
        constraints: emptyConstraints,
      },
      {
        index: 6,
        name: 'test_integer.test',
        dataType: 5,
        notNull: false,
        defaultValue: 5,
        primaryKey: false,
        autoincrement: false,
        geometryType: null,
        max: null,
        type: GeoPackageDataType.nameFromType(GeoPackageDataType.INTEGER),
        constraints: defaultConstraints(5),
      },
      {
        index: 7,
        name: 'test_text_limited.test',
        dataType: 9,
        max: 5,
        notNull: false,
        primaryKey: false,
        autoincrement: false,
        geometryType: null,
        type: GeoPackageDataType.nameFromType(GeoPackageDataType.TEXT),
        constraints: emptyConstraints,
      },
      {
        index: 8,
        name: 'test_blob_limited.test',
        dataType: 10,
        max: 7,
        notNull: false,
        primaryKey: false,
        autoincrement: false,
        type: GeoPackageDataType.nameFromType(GeoPackageDataType.BLOB),
        constraints: emptyConstraints,
      }
    ]);
    var dao = new DataColumnsDao(geoPackage);
    var dataColumn = JSON.parse(JSON.stringify(dao.getDataColumns('test_features.test', 'test_text_limited.test')));

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

  describe('GeoPackage feature CRUD tests', function(done) {

    beforeEach(function() {
      var geometryColumns = SetupFeatureTable.buildGeometryColumns(tableName, 'geom', GeometryType.POINT);
      var columns = [];

      columns.push(FeatureColumn.createColumn('test_text_limited', GeoPackageDataType.TEXT, false, null, 5));
      columns.push(FeatureColumn.createColumn('test_blob_limited', GeoPackageDataType.BLOB, false, null, 7));
      columns.push(FeatureColumn.createColumn('test_text.test', GeoPackageDataType.TEXT, false, ""));
      columns.push(FeatureColumn.createColumn('test_real', GeoPackageDataType.REAL, false, null));
      columns.push(FeatureColumn.createColumn('test_boolean', GeoPackageDataType.BOOLEAN, false, null));
      columns.push(FeatureColumn.createColumn('test_blob', GeoPackageDataType.BLOB, false, null));
      columns.push(FeatureColumn.createColumn('test_integer', GeoPackageDataType.INTEGER, false, null));
      columns.push(FeatureColumn.createColumn('test space', GeoPackageDataType.TEXT, false, ""));
      columns.push(FeatureColumn.createColumn( 'test-dash', GeoPackageDataType.TEXT, false, ""));

      geoPackage.createFeatureTableWithFeatureTableMetadata(FeatureTableMetadata.create(geometryColumns, columns));
      var verified = Verification.verifyGeometryColumns(geoPackage)
        && Verification.verifyTableExists(geoPackage, tableName)
        && Verification.verifyContentsForTable(geoPackage, tableName)
        && Verification.verifyGeometryColumnsForTable(geoPackage, tableName);
      verified.should.be.equal(true);
    });

    it('should create a feature', function() {
      var featureDao = geoPackage.getFeatureDao(tableName);
      var featureRow = featureDao.newRow();
      var geometryData = new GeometryData();
      geometryData.setSrsId(4326);
      var point = new Point(1, 2);
      geometryData.setGeometry(point);
      featureRow.setGeometry(geometryData);
      featureRow.setValue('test_text.test', 'hello');
      featureRow.setValue('test_real', 3.0);
      featureRow.setValue('test_boolean', true);
      featureRow.setValue('test_blob', Buffer.from('test'));
      featureRow.setValue('test_integer', 5);
      featureRow.setValue('test_text_limited', 'testt');
      featureRow.setValue('test_blob_limited', Buffer.from('testtes'));
      featureRow.setValue('test space', 'space space');
      featureRow.setValue('test-dash', 'dash-dash');

      featureDao.create(featureRow);
      var count = featureDao.getCount();
      count.should.be.equal(1);
      var resultSet = featureDao.queryForAll();
      resultSet.moveToNext();
      var fr = resultSet.getRow();
      resultSet.close();
      var geom = fr.getGeometry();
      geom.geometry.x.should.be.equal(1);
      geom.geometry.y.should.be.equal(2);
      fr.getValue('test_text.test').should.be.equal('hello');
      fr.getValue('test_real').should.be.equal(3.0);
      fr.getValue('test_boolean').should.be.equal(true);
      fr.getValue('test_integer').should.be.equal(5);
      fr.getValue('test_blob').toString().should.be.equal('test');
      fr.getValue('test_text_limited').should.be.equal('testt');
      fr.getValue('test_blob_limited').toString().should.be.equal('testtes');
      fr.getValue('test space').toString().should.be.equal('space space');
      fr.getValue('test-dash').toString().should.be.equal('dash-dash');
    });

    describe('delete feature tests', function(done) {
      var featureDao;

      beforeEach(function() {
        featureDao = geoPackage.getFeatureDao(tableName);
        var featureRow = featureDao.newRow();
        var geometryData = new GeometryData();
        geometryData.setSrsId(4326);
        var point = new Point(1, 2);
        geometryData.setGeometry(point);
        featureRow.setGeometry(geometryData);
        featureRow.setValue('test_text.test', 'hello');
        featureRow.setValue('test_real', 3.0);
        featureRow.setValue('test_boolean', true);
        featureRow.setValue('test_blob', Buffer.from('test'));
        featureRow.setValue('test_integer', 5);
        featureRow.setValue('test_text_limited', 'testt');
        featureRow.setValue('test_blob_limited', Buffer.from('testtes'));
        featureDao.create(featureRow);
        var count = featureDao.getCount();
        count.should.be.equal(1);
        var resultSet = featureDao.queryForAll();
        resultSet.moveToNext();
        var fr = resultSet.getRow()
        resultSet.close();
        var geom = fr.getGeometry();
        geom.geometry.x.should.be.equal(1);
        geom.geometry.y.should.be.equal(2);
        fr.getValue('test_text.test').should.be.equal('hello');
        fr.getValue('test_real').should.be.equal(3.0);
        fr.getValue('test_boolean').should.be.equal(true);
        fr.getValue('test_integer').should.be.equal(5);
        fr.getValue('test_blob').toString().should.be.equal('test');
        fr.getValue('test_text_limited').should.be.equal('testt');
        fr.getValue('test_blob_limited').toString().should.be.equal('testtes');
      });

      it('should delete the feature', function() {
        let count = featureDao.getCount();
        count.should.be.equal(1);

        var resultSet = featureDao.queryForAll();
        resultSet.moveToNext();
        var fr = resultSet.getRow();
        resultSet.close();

        var result = featureDao.deleteRow(fr);
        count = featureDao.getCount();
        count.should.be.equal(0);
      });
    });
  });

});

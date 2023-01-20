import { default as testSetup } from '../../../testSetup';
import { FeatureTableMetadata } from "../../../../lib/features/user/featureTableMetadata";
import { BoundingBox } from "../../../../lib/boundingBox";

var SQLiteMaster = require('../../../../lib/db/master/sqliteMaster').SQLiteMaster
  , SQLiteMasterQuery = require('../../../../lib/db/master/sqliteMasterQuery').SQLiteMasterQuery
  , SQLiteMasterColumn = require('../../../../lib/db/master/sqliteMasterColumn').SQLiteMasterColumn
  , SQLiteMasterType = require('../../../../lib/db/master/sqliteMasterType').SQLiteMasterType
  , GeometryColumns = require('../../../../lib/features/columns/geometryColumns').GeometryColumns
  , GeometryType = require('@ngageoint/simple-features-js').GeometryType
  , FeatureColumn = require('../../../../lib/features/user/featureColumn').FeatureColumn
  , GeoPackageDataType = require('../../../../lib/db/geoPackageDataType').GeoPackageDataType
  , should = require('chai').should()
  , path = require('path')
  , _ = require('lodash')
  , expect = require('chai').expect;

describe('SQLiteMaster tests', function() {

  var testGeoPackage = path.join(__dirname, '..', '..', 'fixtures', 'tmp', testSetup.createTempName());
  var geoPackage;
  let tableName = 'test_features';


  beforeEach(async function() {
    geoPackage = await testSetup.createGeoPackage(testGeoPackage);
    const additionalColumns = [FeatureColumn.createColumn('name', GeoPackageDataType.TEXT, false, "")];
    const geometryColumns = new GeometryColumns();
    geometryColumns.setTableName(tableName);
    geometryColumns.setColumnName('geom');
    geometryColumns.setGeometryType(GeometryType.GEOMETRY);
    geometryColumns.setZ(0);
    geometryColumns.setM(0);
    geometryColumns.setSrsId(4326);
    geoPackage.createFeatureTableWithFeatureTableMetadata(FeatureTableMetadata.create(geometryColumns, additionalColumns));
  });

  afterEach(async function() {
    geoPackage.close();
    await testSetup.deleteGeoPackage(testGeoPackage);
  });

  it('should return the count for a given table name', function() {
    const count = SQLiteMaster.count(geoPackage.getConnection(), [], SQLiteMasterQuery.createForColumnValue(SQLiteMasterColumn.NAME, tableName));
    count.should.be.equal(1);
  });
  it('should return the count for a TBL_NAME that is \'=\' to the table name', function() {
    const count = SQLiteMaster.count(geoPackage.getConnection(), [], SQLiteMasterQuery.createForOperationAndColumnValue(SQLiteMasterColumn.NAME, '=', tableName));
    count.should.be.equal(1);
  });

  it('should run a single query against the SQLiteMaster table', function() {
    try {
      const sqliteMaster = SQLiteMaster.query(geoPackage.getConnection(), [SQLiteMasterColumn.TBL_NAME], [], SQLiteMasterQuery.create());
      sqliteMaster.count().should.be.equal(13);
    } catch (e) {
      console.error(e);
    }
  });

  it('should run a combined query against the SQLiteMaster table', function() {
    const sqliteMasterQuery = SQLiteMasterQuery.createAnd();
    sqliteMasterQuery.addIsNotNull(SQLiteMasterColumn.fromName('TBL_NAME'));
    sqliteMasterQuery.add(SQLiteMasterColumn.TBL_NAME, '=', tableName);
    const sqliteMaster = SQLiteMaster.query(geoPackage.getConnection(), [SQLiteMasterColumn.TBL_NAME, SQLiteMasterColumn.TYPE], [], sqliteMasterQuery);
    sqliteMaster.count().should.be.equal(1);
    sqliteMaster.getTableName(0).should.be.equal(tableName);
    sqliteMaster.getType(0).should.be.equal(SQLiteMasterType.TABLE);
  });

  it('should run a createOrForOperationAndColumnValue against the SQLiteMaster table', function() {
    const sqliteMasterQuery = SQLiteMasterQuery.createOrForOperationAndColumnValue(SQLiteMasterColumn.TBL_NAME, '=', [tableName]);
    const sqliteMaster = SQLiteMaster.query(geoPackage.getConnection(), [SQLiteMasterColumn.TBL_NAME, SQLiteMasterColumn.TYPE], [], sqliteMasterQuery);
    sqliteMaster.count().should.be.equal(1);
    sqliteMaster.getTableName(0).should.be.equal(tableName);
    sqliteMaster.getType(0).should.be.equal(SQLiteMasterType.TABLE);
  });

  it('should run a createAndForOperationAndColumnValue against the SQLiteMaster table', function() {
    const sqliteMasterQuery = SQLiteMasterQuery.createAndForOperationAndColumnValue(SQLiteMasterColumn.TBL_NAME, '=', [tableName]);
    const sqliteMaster = SQLiteMaster.query(geoPackage.getConnection(), [SQLiteMasterColumn.TBL_NAME, SQLiteMasterColumn.TYPE], [], sqliteMasterQuery);
    sqliteMaster.count().should.be.equal(1);
    sqliteMaster.getTableName(0).should.be.equal(tableName);
    sqliteMaster.getType(0).should.be.equal(SQLiteMasterType.TABLE);
  });

  it('should run a create or for column and values against the SQLiteMaster table', function() {
    const sqliteMasterQuery = SQLiteMasterQuery.createOrForColumnValue(SQLiteMasterColumn.TBL_NAME, [tableName]);
    const sqliteMaster = SQLiteMaster.query(geoPackage.getConnection(), [SQLiteMasterColumn.TBL_NAME, SQLiteMasterColumn.TYPE], [], sqliteMasterQuery);
    sqliteMaster.count().should.be.equal(1);
    sqliteMaster.getTableName(0).should.be.equal(tableName);
    sqliteMaster.getType(0).should.be.equal(SQLiteMasterType.TABLE);
  });

  it('should run a create and for column and values against the SQLiteMaster table', function() {
    const sqliteMasterQuery = SQLiteMasterQuery.createAndForColumnValue(SQLiteMasterColumn.TBL_NAME, [tableName]);
    const sqliteMaster = SQLiteMaster.query(geoPackage.getConnection(), [SQLiteMasterColumn.TBL_NAME, SQLiteMasterColumn.TYPE], [], sqliteMasterQuery);
    sqliteMaster.count().should.be.equal(1);
    sqliteMaster.getTableName(0).should.be.equal(tableName);
    sqliteMaster.getType(0).should.be.equal(SQLiteMasterType.TABLE);
  });

  it('should run a query with a isNull check', function() {
    const sqliteMasterQuery = SQLiteMasterQuery.createAndForColumnValue(SQLiteMasterColumn.TBL_NAME, [tableName]);
    sqliteMasterQuery.addIsNull(SQLiteMasterColumn.ROOTPAGE);
    const sqliteMaster = SQLiteMaster.query(geoPackage.getConnection(), [SQLiteMasterColumn.TBL_NAME, SQLiteMasterColumn.TYPE], [], sqliteMasterQuery);
    sqliteMaster.count().should.be.equal(0);
  });

  it('should fail to add an isNull check on a query that is not combined check', function() {
    const sqliteMasterQuery = SQLiteMasterQuery.create();
    sqliteMasterQuery.addIsNull(SQLiteMasterColumn.TYPE);
    expect(() => sqliteMasterQuery.addIsNull(SQLiteMasterColumn.ROOTPAGE)).to.throw();
  });
});

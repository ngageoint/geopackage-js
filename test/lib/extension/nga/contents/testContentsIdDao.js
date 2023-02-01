import { default as testSetup } from '../../../../testSetup';
import { ContentsIdExtension } from '../../../../../lib/extension/nga/contents/contentsIdExtension';
import { FeatureTableMetadata } from '../../../../../lib/features/user/featureTableMetadata';
import { GeometryColumns } from '../../../../../lib/features/columns/geometryColumns';
import { GeometryType } from '@ngageoint/simple-features-js';

var Verification = require('../../../../verification'),
  ContentsDataType = require('../../../../../lib/contents/contentsDataType').ContentsDataType,
  should = require('chai').should();

describe('ContentsIdExtension Tests', function () {
  var testGeoPackage;
  var geoPackage;
  var tableName = 'test';
  var contents;
  var contentsIdExtension;

  beforeEach(async function () {
    let created = await testSetup.createTmpGeoPackage();
    testGeoPackage = created.path;
    geoPackage = created.geoPackage;
  });

  beforeEach('create the GeoPackage connection', function () {
    // create the contents for 'test'
    const geometryColumn = new GeometryColumns();
    geometryColumn.setTableName(tableName);
    geometryColumn.setGeometryType(GeometryType.GEOMETRY);
    geometryColumn.setColumnName('geometry');
    geometryColumn.setSrsId(4326);
    geometryColumn.setZ(0);
    geometryColumn.setM(0);
    geoPackage.createFeatureTableWithMetadata(FeatureTableMetadata.create(geometryColumn));

    // enable the contents_id extension
    contentsIdExtension = new ContentsIdExtension(geoPackage);
    contentsIdExtension.getOrCreateExtension();

    contents = geoPackage.getFeatureDao(tableName).getContents();
  });

  afterEach(async function () {
    geoPackage.close();
    await testSetup.deleteGeoPackage(testGeoPackage);
  });

  it('should create a nga_contents_id table', function () {
    Verification.verifyContentsId(geoPackage).should.be.equal(true);
  });

  it('should create a record in the nga_contents_id table', function () {
    // test create
    contentsIdExtension.create(contents).getTableName().should.be.equal(tableName);
  });

  it('should create a record in the nga_contents_id table', function () {
    // test create
    contentsIdExtension.createId(contents).should.be.equal(1);
  });

  it("should retrieve table_name's of contents without record in contentsId table", function () {
    // test getMissing
    var missing = contentsIdExtension.getMissing();
    const tables = geoPackage.getTables();
    (missing.length - 1).should.be.equal(tables.length);
    contentsIdExtension.getIds().length.should.be.equal(0);

    // test create
    var contentsId = contentsIdExtension.create(contents);
    contentsId.getTableName().should.be.equal(tableName);
    // test getMissing returns nothing when all contents records have entry in contentsId table
    missing = contentsIdExtension.getMissing();
    (missing.length - 1).should.be.equal(geoPackage.getTables().length - 1);
    contentsIdExtension.getIds().length.should.be.equal(1);
  });

  it("should retrieve table_name's of contents without record in contentsId table for given type", function () {
    // test getMissing
    var missing = contentsIdExtension.getMissing(ContentsDataType.FEATURES);
    missing.length.should.be.equal(1);
    // test create
    var contentsId = contentsIdExtension.create(contents);
    contentsId.getTableName().should.be.equal(tableName);
    // test getMissing returns nothing when all contents records have entry in contentsId table
    missing = contentsIdExtension.getMissing(ContentsDataType.FEATURES);
    missing.length.should.be.equal(0);
  });

  it('should retrieve contentsId using contents object', function () {
    // create contentsId for contents
    contentsIdExtension.create(contents);
    // retrieve by contents
    contentsIdExtension.getWithContents(contents).getTableName().should.be.equal(contents.getTableName());
  });

  it('should retrieve contentsId by data_type of contents', function () {
    // create contentsId for contents
    contentsIdExtension.create(contents);

    // test getIdsByType
    var contentIdsForTypeFeature = contentsIdExtension.getIds(ContentsDataType.FEATURES);
    contentIdsForTypeFeature.length.should.be.equal(1);

    contentIdsForTypeFeature = contentsIdExtension.getIds(ContentsDataType.ATTRIBUTES);
    contentIdsForTypeFeature.length.should.be.equal(0);

    contentIdsForTypeFeature = contentsIdExtension.getIds(ContentsDataType.TILES);
    contentIdsForTypeFeature.length.should.be.equal(0);
  });

  it('should delete contentsId by type', function () {
    // create contentsId for contents
    contentsIdExtension.create(contents);

    // test deleteIds
    let numDeleted = contentsIdExtension.deleteIds(ContentsDataType.FEATURES);
    numDeleted.should.be.equal(1);

    // test deleteIds when no ids to be deleted
    numDeleted = contentsIdExtension.deleteIds(ContentsDataType.FEATURES);
    numDeleted.should.be.equal(0);
  });

  it('should getId for contents', function () {
    var id = contentsIdExtension.create(contents).getId();
    contentsIdExtension.getId(contents).should.be.equal(id);
  });

  it('should create contentsIds for all contents without contentsIds', function () {
    // test createIds which will create ids for all contents without contents ids
    contentsIdExtension.createIds().should.be.equal(2);
  });

  it('should create getOrCreate contents id', function () {
    // test that get or create will get the contents id when it doesn't exist
    var contentsId = contentsIdExtension.getOrCreateContentsId(contents);
    contentsId.getTableName().should.be.equal(tableName);
    // test that get or create will create the contents id when it does exist
    contentsId = contentsIdExtension.getOrCreateContentsId(contents);
    contentsId.getTableName().should.be.equal(tableName);
  });

  it('should deleteId by contents', function () {
    // test createIds which will create ids for all contents without contents ids
    let numCreated = contentsIdExtension.createIds(ContentsDataType.FEATURES);
    numCreated.should.be.equal(1);
    // delete by table name
    contentsIdExtension.deleteId(contents).should.be.equal(1);
  });

  it('should return the count of contentsIds', function () {
    // test createIds which will create ids for all contents without contents ids
    contentsIdExtension.createIds();
    contentsIdExtension.count().should.be.equal(2);
  });

  it('should return array of table names', function () {
    contentsIdExtension.getDao().getTableNames().length.should.be.equal(0);
    contentsIdExtension.createIds();
    contentsIdExtension.getDao().getTableNames().length.should.be.equal(2);
  });

  it('should return contents id for table name', function () {
    should.not.exist(contentsIdExtension.getDao().queryForTableName(tableName));
    contentsIdExtension.createIds();
    contentsIdExtension.getDao().queryForTableName(tableName).getTableName().should.be.equal(tableName);
  });
});

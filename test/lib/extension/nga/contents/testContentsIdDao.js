import { default as testSetup } from '../../../../testSetup'

var Verification = require('../../../../verification')
  , ContentsDataType = require('../../../../../lib/contents/contentsDataType').ContentsDataType
  , should = require('chai').should();

describe('ContentsIdExtension Tests', function() {
  var testGeoPackage;
  var geoPackage;
  var tableName = 'test';
  var contents;

  beforeEach(async function() {
    let created = await testSetup.createTmpGeoPackage();
    testGeoPackage = created.path;
    geoPackage = created.geoPackage;
  });

  beforeEach('create the GeoPackage connection', async function() {
    var contentsDao = geoPackage.contentsDao;
    var contentsIdExtension = geoPackage.contentsIdExtension;
    contentsIdExtension.getOrCreateExtension();
    var contentsIdDao = contentsIdExtension.dao;
    contents = contentsDao.createObject();
    contents.table_name = tableName;
    contents.data_type = ContentsDataType.FEATURES;
    contentsDao.create(contents);
    contentsIdDao.createTable();
  });

  afterEach(async function() {
    geoPackage.close();
    await testSetup.deleteGeoPackage(testGeoPackage);
  });

  it('should create a nga_contents_id table', function() {
    Verification.verifyContentsId(geoPackage).should.be.equal(true);
  });

  it('should create a record in the nga_contents_id table', function() {
    // test create
    geoPackage.contentsIdExtension.create(contents).table_name.should.be.equal(tableName);
  });

  it('should create a record in the nga_contents_id table', function() {
    // test create
    geoPackage.contentsIdExtension.createId(contents).table_name.should.be.equal(tableName);
  });

  it('should retrieve table_name\'s of contents without record in contentsId table', function() {
    // test getMissing
    var missing = geoPackage.contentsIdExtension.getMissing("");
    missing.length.should.be.equal(1);
    // test create
    var contentsId = geoPackage.contentsIdExtension.create(contents);
    contentsId.table_name.should.be.equal(tableName);
    // test getMissing returns nothing when all contents records have entry in contentsId table
    missing = geoPackage.contentsIdExtension.getMissing("");
    missing.length.should.be.equal(0);
  });

  it('should retrieve table_name\'s of contents without record in contentsId table for given type', function() {
    // test getMissing
    var missing = geoPackage.contentsIdExtension.getMissing(ContentsDataType.FEATURES);
    missing.length.should.be.equal(1);
    // test create
    var contentsId = geoPackage.contentsIdExtension.create(contents);
    contentsId.table_name.should.be.equal(tableName);
    // test getMissing returns nothing when all contents records have entry in contentsId table
    missing = geoPackage.contentsIdExtension.getMissing(ContentsDataType.FEATURES);
    missing.length.should.be.equal(0);
  });

  it('should retrieve contentsId using contents object', function() {
    // create contentsId for contents
    geoPackage.contentsIdExtension.create(contents);
    // retrieve by contents
    geoPackage.contentsIdExtension.get(contents).table_name.should.be.equal(contents.table_name);
  });

  it('should retrieve contentsId by data_type of contents', function() {
    // create contentsId for contents
    geoPackage.contentsIdExtension.create(contents);

    // test getIdsByType
    var contentIdsForTypeFeature = geoPackage.contentsIdExtension.getIdsByType(ContentsDataType.FEATURES);
    contentIdsForTypeFeature.length.should.be.equal(1);

    contentIdsForTypeFeature = geoPackage.contentsIdExtension.getIdsByType(ContentsDataType.ATTRIBUTES);
    contentIdsForTypeFeature.length.should.be.equal(0);

    contentIdsForTypeFeature = geoPackage.contentsIdExtension.getIdsByType(ContentsDataType.TILES);
    contentIdsForTypeFeature.length.should.be.equal(0);
  });

  it('should delete contentsId by type', function() {
    // create contentsId for contents
    geoPackage.contentsIdExtension.create(contents);

    // test deleteIds
    let numDeleted = geoPackage.contentsIdExtension.deleteIds(ContentsDataType.FEATURES);
    numDeleted.should.be.equal(1);

    // test deleteIds when no ids to be deleted
    numDeleted = geoPackage.contentsIdExtension.deleteIds(ContentsDataType.FEATURES);
    numDeleted.should.be.equal(0);
  });

  it('should getId for contents', function() {
    var id = geoPackage.contentsIdExtension.create(contents).id;
    geoPackage.contentsIdExtension.getId(contents).should.be.equal(id);
  });

  it('should create contentsIds for all contents without contentsIds', function() {
    // test createIds which will create ids for all contents without contents ids
    geoPackage.contentsIdExtension.createIds().should.be.equal(1);
  });

  it('should create getOrCreate contents id', function() {
    // test that get or create will get the contents id when it doesn't exist
    var contentsId = geoPackage.contentsIdExtension.getOrCreateId(contents);
    contentsId.table_name.should.be.equal(tableName);
    // test that get or create will create the contents id when it does exist
    contentsId = geoPackage.contentsIdExtension.getOrCreateId(contents);
    contentsId.table_name.should.be.equal(tableName);
  });

  it('should deleteId by contents', function() {
    // test createIds which will create ids for all contents without contents ids
    let numCreated = geoPackage.contentsIdExtension.createIds();
    numCreated.should.be.equal(1);
    // delete by table name
    geoPackage.contentsIdExtension.deleteId(contents).should.be.equal(1);
  });

  it('should return the count of contentsIds', function() {
    // test createIds which will create ids for all contents without contents ids
    geoPackage.contentsIdExtension.createIds();
    geoPackage.contentsIdExtension.count().should.be.equal(1);
  });

  it('should return array of table names', function() {
    geoPackage.contentsIdExtension.dao.getTableNames().length.should.be.equal(0);
    geoPackage.contentsIdExtension.createIds();
    geoPackage.contentsIdExtension.dao.getTableNames().length.should.be.equal(1);
  });

  it('should return contents id for table name', function() {
    should.not.exist(geoPackage.contentsIdExtension.dao.queryForTableName(tableName));
    geoPackage.contentsIdExtension.createIds();
    geoPackage.contentsIdExtension.dao.queryForTableName(tableName).table_name.should.be.equal(tableName);
  });
});

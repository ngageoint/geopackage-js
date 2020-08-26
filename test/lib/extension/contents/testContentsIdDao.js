
import { default as testSetup } from '../../../fixtures/testSetup'
import {ContentsDao} from '../../../../lib/core/contents/contentsDao'

var Verification = require('../../../fixtures/verification')
  , ContentsDataType = require('../../../../lib/core/contents/contentsDataType').ContentsDataType
  , should = require('chai').should()
  , path = require('path');

describe('ContentsIdExtension Tests', function() {
  var testGeoPackage;
  var geopackage;
  var tableName = 'test';
  var contents;

  beforeEach(async function() {
    let created = await testSetup.createTmpGeoPackage();
    testGeoPackage = created.path;
    geopackage = created.geopackage;
  });

  beforeEach('create the GeoPackage connection', async function() {
    var contentsDao = geopackage.contentsDao;
    var contentsIdExtension = geopackage.contentsIdExtension;
    contentsIdExtension.getOrCreateExtension();
    var contentsIdDao = contentsIdExtension.dao;
    contents = contentsDao.createObject();
    contents.table_name = tableName;
    contents.data_type = ContentsDataType.FEATURES;
    contentsDao.create(contents);
    contentsIdDao.createTable();
  });

  afterEach(async function() {
    geopackage.close();
    await testSetup.deleteGeoPackage(testGeoPackage);
  });

  it('should create a nga_contents_id table', function() {
    Verification.verifyContentsId(geopackage).should.be.equal(true);
  });

  it('should create a record in the nga_contents_id table', function() {
    // test create
    geopackage.contentsIdExtension.create(contents).table_name.should.be.equal(tableName);
  });

  it('should create a record in the nga_contents_id table', function() {
    // test create
    geopackage.contentsIdExtension.createId(contents).table_name.should.be.equal(tableName);
  });

  it('should retrieve table_name\'s of contents without record in contentsId table', function() {
    // test getMissing
    var missing = geopackage.contentsIdExtension.getMissing("");
    missing.length.should.be.equal(1);
    // test create
    var contentsId = geopackage.contentsIdExtension.create(contents);
    contentsId.table_name.should.be.equal(tableName);
    // test getMissing returns nothing when all contents records have entry in contentsId table
    missing = geopackage.contentsIdExtension.getMissing("");
    missing.length.should.be.equal(0);
  });

  it('should retrieve table_name\'s of contents without record in contentsId table for given type', function() {
    // test getMissing
    var missing = geopackage.contentsIdExtension.getMissing(ContentsDataType.FEATURES);
    missing.length.should.be.equal(1);
    // test create
    var contentsId = geopackage.contentsIdExtension.create(contents);
    contentsId.table_name.should.be.equal(tableName);
    // test getMissing returns nothing when all contents records have entry in contentsId table
    missing = geopackage.contentsIdExtension.getMissing(ContentsDataType.FEATURES);
    missing.length.should.be.equal(0);
  });

  it('should retrieve contentsId using contents object', function() {
    // create contentsId for contents
    geopackage.contentsIdExtension.create(contents);
    // retrieve by contents
    geopackage.contentsIdExtension.get(contents).table_name.should.be.equal(contents.table_name);
  });

  it('should retrieve contentsId by data_type of contents', function() {
    // create contentsId for contents
    geopackage.contentsIdExtension.create(contents);

    // test getIdsByType
    var contentIdsForTypeFeature = geopackage.contentsIdExtension.getIdsByType(ContentsDataType.FEATURES);
    contentIdsForTypeFeature.length.should.be.equal(1);

    contentIdsForTypeFeature = geopackage.contentsIdExtension.getIdsByType(ContentsDataType.ATTRIBUTES);
    contentIdsForTypeFeature.length.should.be.equal(0);

    contentIdsForTypeFeature = geopackage.contentsIdExtension.getIdsByType(ContentsDataType.TILES);
    contentIdsForTypeFeature.length.should.be.equal(0);
  });

  it('should delete contentsId by type', function() {
    // create contentsId for contents
    geopackage.contentsIdExtension.create(contents);

    // test deleteIds
    let numDeleted = geopackage.contentsIdExtension.deleteIds(ContentsDataType.FEATURES);
    numDeleted.should.be.equal(1);

    // test deleteIds when no ids to be deleted
    numDeleted = geopackage.contentsIdExtension.deleteIds(ContentsDataType.FEATURES);
    numDeleted.should.be.equal(0);
  });

  it('should getId for contents', function() {
    var id = geopackage.contentsIdExtension.create(contents).id;
    geopackage.contentsIdExtension.getId(contents).should.be.equal(id);
  });

  it('should create contentsIds for all contents without contentsIds', function() {
    // test createIds which will create ids for all contents without contents ids
    geopackage.contentsIdExtension.createIds().should.be.equal(1);
  });

  it('should create getOrCreate contents id', function() {
    // test that get or create will get the contents id when it doesn't exist
    var contentsId = geopackage.contentsIdExtension.getOrCreateId(contents);
    contentsId.table_name.should.be.equal(tableName);
    // test that get or create will create the contents id when it does exist
    contentsId = geopackage.contentsIdExtension.getOrCreateId(contents);
    contentsId.table_name.should.be.equal(tableName);
  });

  it('should deleteId by contents', function() {
    // test createIds which will create ids for all contents without contents ids
    let numCreated = geopackage.contentsIdExtension.createIds();
    numCreated.should.be.equal(1);
    // delete by table name
    geopackage.contentsIdExtension.deleteId(contents).should.be.equal(1);
  });

  it('should return the count of contentsIds', function() {
    // test createIds which will create ids for all contents without contents ids
    geopackage.contentsIdExtension.createIds();
    geopackage.contentsIdExtension.count().should.be.equal(1);
  });

  it('should return array of table names', function() {
    geopackage.contentsIdExtension.dao.getTableNames().length.should.be.equal(0);
    geopackage.contentsIdExtension.createIds();
    geopackage.contentsIdExtension.dao.getTableNames().length.should.be.equal(1);
  });

  it('should return contents id for table name', function() {
    should.not.exist(geopackage.contentsIdExtension.dao.queryForTableName(tableName));
    geopackage.contentsIdExtension.createIds();
    geopackage.contentsIdExtension.dao.queryForTableName(tableName).table_name.should.be.equal(tableName);
  });
});

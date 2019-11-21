var Verification = require('../../../fixtures/verification')
  , ContentsDao = require('../../../../lib/core/contents/contentsDao')
  , testSetup = require('../../../fixtures/testSetup')
  , should = require('chai').should()
  , path = require('path');

describe('ContentsIdExtension Tests', function() {
  var testGeoPackage;
  var geopackage;
  var testPath = path.join(__dirname, '..', 'tmp');
  var tableName = 'test';
  var contents;

  beforeEach('create the GeoPackage connection', function(done) {
    testGeoPackage = path.join(testPath, testSetup.createTempName());
    testSetup.createGeoPackage(testGeoPackage, function(err, gp) {
      geopackage = gp;
      var contentsDao = geopackage.getContentsDao();
      var contentsIdExtension = geopackage.getContentsIdExtension();
      contentsIdExtension.getOrCreateExtension();
      var contentsIdDao = contentsIdExtension.getDao();
      contents = contentsDao.createObject();
      contents.table_name = tableName;
      contents.data_type = ContentsDao.GPKG_CDT_FEATURES_NAME;
      contentsDao.create(contents);
      contentsIdDao.createTable().then(function() {
        done();
      });
    });
  });

  afterEach(function(done) {
    geopackage.close();
    testSetup.deleteGeoPackage(testGeoPackage, done);
  });

  it('should create a nga_contents_id table', function() {
    Verification.verifyContentsId(geopackage).should.be.equal(true);
  });

  it('should create a record in the nga_contents_id table', function() {
    // test create
    geopackage.getContentsIdExtension().create(contents).table_name.should.be.equal(tableName);
  });

  it('should create a record in the nga_contents_id table', function() {
    // test create
    geopackage.getContentsIdExtension().createId(contents).table_name.should.be.equal(tableName);
  });

  it('should retrieve table_name\'s of contents without record in contentsId table', function() {
    // test getMissing
    var missing = geopackage.getContentsIdExtension().getMissing("");
    missing.length.should.be.equal(1);
    // test create
    var contentsId = geopackage.getContentsIdExtension().create(contents);
    contentsId.table_name.should.be.equal(tableName);
    // test getMissing returns nothing when all contents records have entry in contentsId table
    missing = geopackage.getContentsIdExtension().getMissing("");
    missing.length.should.be.equal(0);
  });

  it('should retrieve table_name\'s of contents without record in contentsId table for given type', function() {
    // test getMissing
    var missing = geopackage.getContentsIdExtension().getMissing(ContentsDao.GPKG_CDT_FEATURES_NAME);
    missing.length.should.be.equal(1);
    // test create
    var contentsId = geopackage.getContentsIdExtension().create(contents);
    contentsId.table_name.should.be.equal(tableName);
    // test getMissing returns nothing when all contents records have entry in contentsId table
    missing = geopackage.getContentsIdExtension().getMissing(ContentsDao.GPKG_CDT_FEATURES_NAME);
    missing.length.should.be.equal(0);
  });

  it('should retrieve contentsId using contents object', function() {
    // create contentsId for contents
    geopackage.getContentsIdExtension().create(contents);
    // retrieve by contents
    geopackage.getContentsIdExtension().get(contents).table_name.should.be.equal(contents.table_name);
  });

  it('should retrieve contentsId by data_type of contents', function() {
    // create contentsId for contents
    geopackage.getContentsIdExtension().create(contents);

    // test getIdsByType
    var contentIdsForTypeFeature = geopackage.getContentsIdExtension().getIdsByType(ContentsDao.GPKG_CDT_FEATURES_NAME);
    contentIdsForTypeFeature.length.should.be.equal(1);

    contentIdsForTypeFeature = geopackage.getContentsIdExtension().getIdsByType(ContentsDao.GPKG_CDT_ATTRIBUTES_NAME);
    contentIdsForTypeFeature.length.should.be.equal(0);

    contentIdsForTypeFeature = geopackage.getContentsIdExtension().getIdsByType(ContentsDao.GPKG_CDT_TILES_NAME);
    contentIdsForTypeFeature.length.should.be.equal(0);
  });

  it('should delete contentsId by type', function() {
    // create contentsId for contents
    geopackage.getContentsIdExtension().create(contents);

    // test deleteIds
    let numDeleted = geopackage.getContentsIdExtension().deleteIds(ContentsDao.GPKG_CDT_FEATURES_NAME);
    numDeleted.should.be.equal(1);

    // test deleteIds when no ids to be deleted
    numDeleted = geopackage.getContentsIdExtension().deleteIds(ContentsDao.GPKG_CDT_FEATURES_NAME);
    numDeleted.should.be.equal(0);
  });

  it('should getId for contents', function() {
    var id = geopackage.getContentsIdExtension().create(contents).id;
    geopackage.getContentsIdExtension().getId(contents).should.be.equal(id);
  });

  it('should create contentsIds for all contents without contentsIds', function() {
    // test createIds which will create ids for all contents without contents ids
    geopackage.getContentsIdExtension().createIds().should.be.equal(1);
  });

  it('should create getOrCreate contents id', function() {
    // test that get or create will get the contents id when it doesn't exist
    var contentsId = geopackage.getContentsIdExtension().getOrCreateId(contents);
    contentsId.table_name.should.be.equal(tableName);
    // test that get or create will create the contents id when it does exist
    contentsId = geopackage.getContentsIdExtension().getOrCreateId(contents);
    contentsId.table_name.should.be.equal(tableName);
  });

  it('should deleteId by contents', function() {
    // test createIds which will create ids for all contents without contents ids
    let numCreated = geopackage.getContentsIdExtension().createIds();
    numCreated.should.be.equal(1);
    // delete by table name
    geopackage.getContentsIdExtension().deleteId(contents).should.be.equal(1);
  });

  it('should return the count of contentsIds', function() {
    // test createIds which will create ids for all contents without contents ids
    geopackage.getContentsIdExtension().createIds();
    geopackage.getContentsIdExtension().count().should.be.equal(1);
  });

  it('should return array of table names', function() {
    geopackage.getContentsIdExtension().getDao().getTableNames().length.should.be.equal(0);
    geopackage.getContentsIdExtension().createIds();
    geopackage.getContentsIdExtension().getDao().getTableNames().length.should.be.equal(1);
  });

  it('should return contents id for table name', function() {
    should.not.exist(geopackage.getContentsIdExtension().getDao().queryForTableName(tableName));
    geopackage.getContentsIdExtension().createIds();
    geopackage.getContentsIdExtension().getDao().queryForTableName(tableName).table_name.should.be.equal(tableName);
  });
});

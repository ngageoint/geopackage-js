var GeoPackageManager = require('../../../../lib/geoPackageManager')
  , ContentsDao = require('../../../../lib/core/contents').ContentsDao
  , Contents = require('../../../../lib/core/contents').Contents
  , should = require('chai').should()
  , path = require('path');

describe('Contents tests', function() {

  var geoPackage;
  var contentsDao;

  beforeEach('should open the geopackage', function(done) {
    var filename = path.join(__dirname, '..', '..', '..', 'fixtures', 'rivers.gpkg');
    GeoPackageManager.open(filename, function(err, gp) {
      geoPackage = gp;
      should.not.exist(err);
      should.exist(gp);
      should.exist(gp.getDatabase().getDBConnection());
      gp.getPath().should.be.equal(filename);
      contentsDao = new ContentsDao(gp.getDatabase());
      done();
    });
  });

  it('should get the contents', function(done) {
    contentsDao.queryForAll(function(err, contents) {
      console.log('contents', contents);
      done();
    })
  });

});

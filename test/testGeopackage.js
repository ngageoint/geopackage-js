var GeoPackage = require('../index.js');

var path = require('path')
  , should = require('chai').should();

describe('GeoPackageAPI tests', function() {

  var existingPath = path.join(__dirname, 'fixtures', 'rivers.gpkg');
  var geopackageToCreate = path.join(__dirname, 'tmp', 'tmp.gpkg');

  it('should open the geopackage', function(done) {
    GeoPackage.openGeoPackage(existingPath, function(err, geopackage) {
      should.not.exist(err);
      should.exist(geopackage);
      done();
    });
  });

  it('should create a geopackage', function(done) {
    GeoPackage.createGeoPackage(geopackageToCreate, function(err, gp) {
      should.not.exist(err);
      should.exist(gp);
      done();
    });
  });

});

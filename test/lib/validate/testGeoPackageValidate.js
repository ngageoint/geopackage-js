import {GeoPackage, GeoPackageConnection, GeoPackageValidate} from '@ngageoint/geopackage'

var path = require('path');

describe('GeoPackage Validate tests', function() {

  it('should have a geopackage extension with gpkg', function() {
    var hasGeoPackageExtension = GeoPackageValidate.hasGeoPackageExtension('test.gpkg');
    hasGeoPackageExtension.should.be.equal(true);
  });

  it('should have a geopackage extension with GPKG', function() {
    var hasGeoPackageExtension = GeoPackageValidate.hasGeoPackageExtension('test.GPKG');
    hasGeoPackageExtension.should.be.equal(true);
  });

  it('should have a geopackage extension with gpkx', function() {
    var hasGeoPackageExtension = GeoPackageValidate.hasGeoPackageExtension('test.gpkx');
    hasGeoPackageExtension.should.be.equal(true);
  });

  it('should have a geopackage extension with GPKX', function() {
    var hasGeoPackageExtension = GeoPackageValidate.hasGeoPackageExtension('test.GPKX');
    hasGeoPackageExtension.should.be.equal(true);
  });

  it('should not have a geopackage extension with asdf', function() {
    var hasGeoPackageExtension = GeoPackageValidate.hasGeoPackageExtension('test.asdf');
    hasGeoPackageExtension.should.be.equal(false);
  });

  // it('should not have the required minimum tables', function(done) {
  //   var db = new sqlite3.Database(':memory:', function(err) {
  //     var geoPackage = new GeoPackage('', '', db);
  //     GeoPackageValidate.hasMinimumTables(geoPackage, function(err) {
  //       should.exist(err);
  //       done();
  //     });
  //   });
  // });

  it('should not have the required minimum tables', function() {
    return GeoPackageConnection.connect(path.join(__dirname, '..', '..', 'fixtures', 'test.gpkg'))
    .then(function(connection) {
      var geoPackage = new GeoPackage('', '', connection);
      return GeoPackageValidate.hasMinimumTables(geoPackage);
    })
    .then(function(hasMinimumTables) {
      hasMinimumTables.should.be.equal(false);
    })
    .catch(function(error) {
      // this should not get called
      false.should.be.equal(true);
    });
  });

  it('should have the required minimum tables', function() {
    GeoPackageConnection.connect(path.join(__dirname, '..', '..', 'fixtures', 'gdal_sample.gpkg'))
    .then(function(connection) {
      var geoPackage = new GeoPackage('', '', connection);
      return GeoPackageValidate.hasMinimumTables(geoPackage);
    })
    .then(function(hasMinimumTables) {
      hasMinimumTables.should.be.equal(true);
    })
    .catch(function(error) {
      // this should not get called
      false.should.be.equal(true);
    });
  });

});

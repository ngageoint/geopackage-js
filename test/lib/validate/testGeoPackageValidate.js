var GeoPackageValidate = require('../../../lib/validate/geoPackageValidate')
  , GeoPackage = require('../../../lib/geoPackage')
  , GeoPackageConnection = require('../../../lib/db/geoPackageConnection')
  , should = require('chai').should()
  , path = require('path');

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

  it('should not have the required minimum tables', function(done) {
    GeoPackageConnection.connect(path.join(__dirname, '..', '..', 'fixtures', 'test.gpkg'), function(err, connection) {
      var geoPackage = new GeoPackage('', '', connection);
      GeoPackageValidate.hasMinimumTables(geoPackage, function(err) {
        should.exist(err);
        connection.close();
        done();
      });
    });
  });

  it('should have the required minimum tables', function(done) {
    GeoPackageConnection.connect(path.join(__dirname, '..', '..', 'fixtures', 'gdal_sample.gpkg'), function(err, connection) {
      var geoPackage = new GeoPackage('', '', connection);
      GeoPackageValidate.hasMinimumTables(geoPackage, function(err) {
        connection.close();
        should.not.exist(err);
        done();
      });
    });
  });

});

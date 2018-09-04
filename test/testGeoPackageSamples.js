var GeoPackageAPI = require('../index')
  , GeoPackageUtils = require('./geopackageUtils');

var path = require('path')
  , fs = require('fs');

describe('Create GeoPackage samples', function() {

  describe.only('Create a GeoPackage for OGC Certification', function() {
    var testGeoPackage = path.join(__dirname, 'fixtures', 'tmp', 'js-example.gpkg');
    var geopackage;

    before(function(done) {
      // remove the created geopackage
      if (typeof(process) !== 'undefined' && process.version) {
        fs.unlink(testGeoPackage, function() {
          fs.mkdir(path.dirname(testGeoPackage), function() {
            fs.open(testGeoPackage, 'w', done);
          });
        });
      } else {
        done();
      }
    });

    it('output a 1.2 compliant GeoPackage', function() {
      this.timeout(60000);
      console.log('Create GeoPackage');

      return GeoPackageAPI.create(testGeoPackage)
      .then(function(gp) {
        console.log('Created GeoPackage');
        return geopackage = gp;
      })
      .then(GeoPackageUtils.createCRSWKTExtension)
      .then(GeoPackageUtils.createFeatures)
      .then(GeoPackageUtils.createSchemaExtension)
      .then(GeoPackageUtils.createGeometryIndexExtension)
      .then(GeoPackageUtils.createFeatureTileLinkExtension)
      .then(GeoPackageUtils.createNonLinearGeometryTypesExtension)
      .then(GeoPackageUtils.createRTreeSpatialIndexExtension)
      .then(GeoPackageUtils.createRelatedTablesMediaExtension)
      .then(GeoPackageUtils.createRelatedTablesFeaturesExtension)
      .then(GeoPackageUtils.createTiles)
      .then(GeoPackageUtils.createWebPExtension)
      .then(GeoPackageUtils.createAttributes)
      .then(GeoPackageUtils.createRelatedTablesSimpleAttributesExtension)
      .then(GeoPackageUtils.createMetadataExtension)
      .then(GeoPackageUtils.createCoverageDataExtension)
      .then(GeoPackageUtils.createPropertiesExtension)
      .then(function() {
        geopackage.close();
      })
      .catch(function(error) {
        console.log('error', error);
        false.should.be.equal(true);
      });
    });
  });

  describe('Create a GeoPackage with an attributes table', function() {

    var testGeoPackage = path.join(__dirname, 'fixtures', 'tmp', 'attributes.gpkg');
    var geopackage;

    before(function(done) {
      // remove the created geopackage
      if (typeof(process) !== 'undefined' && process.version) {
        fs.unlink(testGeoPackage, function() {
          fs.mkdir(path.dirname(testGeoPackage), function() {
            fs.open(testGeoPackage, 'w', done);
          });
        });
      } else {
        done();
      }
    });

    it('output an attributes GeoPackage', function() {
      this.timeout(60000);
      console.log('Create GeoPackage');

      return GeoPackageAPI.create(testGeoPackage)
      .then(function(gp) {
        console.log('Created GeoPackage');
        return geopackage = gp;
      })
      .then(GeoPackageUtils.createCRSWKTExtension)
      .then(GeoPackageUtils.createAttributes)
      .then(function() {
        geopackage.close();
      })
      .catch(function(error) {
        console.log('error', error);
        false.should.be.equal(true);
      });
    });
  });

});

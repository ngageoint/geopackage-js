import { GeoPackageManager } from '../.'
import { default as GeoPackageUtils } from './geopackageUtils'

var path = require('path')
  , fs = require('fs-extra');

describe('Create GeoPackage samples', function() {

  describe('Create a GeoPackage for OGC Certification', function() {
    var testGeoPackage = path.join(__dirname, 'fixtures', 'tmp', 'js-example.gpkg');
    var geoPackage;

    before(function(done) {
      // remove the created geoPackage
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

      return GeoPackageManager.create(testGeoPackage)
      .then(async function(gp) {
        console.log('Created GeoPackage');
        GeoPackageUtils.createCRSWKTExtension(gp);
        GeoPackageUtils.createFeatures(gp);
        GeoPackageUtils.createSchemaExtension(gp);
        await GeoPackageUtils.createGeometryIndexExtension(gp);
        GeoPackageUtils.createFeatureTileLinkExtension(gp);
        GeoPackageUtils.createNonLinearGeometryTypesExtension(gp);
        await GeoPackageUtils.createRTreeSpatialIndexExtension(gp);
        GeoPackageUtils.createRelatedTablesMediaExtension(gp);
        GeoPackageUtils.createRelatedTablesFeaturesExtension(gp);
        await GeoPackageUtils.createTiles(gp);
        await GeoPackageUtils.createWebPExtension(gp);
        GeoPackageUtils.createAttributes(gp);
        GeoPackageUtils.createRelatedTablesSimpleAttributesExtension(gp);
        GeoPackageUtils.createMetadataExtension(gp);
        GeoPackageUtils.createCoverageDataExtension(gp);
        GeoPackageUtils.createPropertiesExtension(gp);
        gp.close();
      })
      .catch(function(error) {
        console.log(error);
        false.should.be.equal(true);
      });
    });
  });

  describe('Create a GeoPackage with an attributes table', function() {

    var testGeoPackage = path.join(__dirname, 'fixtures', 'tmp', 'attributes.gpkg');
    var geoPackage;

    before(function(done) {
      // remove the created geoPackage
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
      return GeoPackageManager.create(testGeoPackage)
      .then(function(gp) {
        console.log('Created GeoPackage');
        GeoPackageUtils.createCRSWKTExtension(gp);
        GeoPackageUtils.createAttributes(gp);
        gp.close();
      })
      .catch(function(error) {
        console.log('error', error);
        false.should.be.equal(true);
      });
    });
  });

});

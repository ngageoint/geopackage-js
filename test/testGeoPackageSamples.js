import { GeoPackageManager } from '../.';
import { default as GeoPackageUtils } from './geopackageUtils';

var path = require('path'),
  fs = require('fs-extra');

describe('Create GeoPackage samples', function () {
  describe('Create a GeoPackage for OGC Certification', function () {
    var testGeoPackage = path.join(__dirname, 'fixtures', 'tmp', 'js-example.gpkg');

    before(function (done) {
      // remove the created geoPackage
      if (typeof process !== 'undefined' && process.version) {
        fs.unlink(testGeoPackage, function () {
          fs.mkdir(path.dirname(testGeoPackage), function () {
            fs.open(testGeoPackage, 'w', done);
          });
        });
      } else {
        done();
      }
    });

    it('output a 1.2 compliant GeoPackage', function () {
      this.timeout(60000);
      console.log('Create GeoPackage');

      return GeoPackageManager.create(testGeoPackage)
        .then(async function (gp) {
          console.log('Created GeoPackage');
          GeoPackageUtils.createCRSWKTExtension(gp);
          GeoPackageUtils.createFeatures(gp);
          GeoPackageUtils.createSchemaExtension(gp);
          GeoPackageUtils.createGeometryIndexExtension(gp);
          GeoPackageUtils.createNonLinearGeometryTypesExtension(gp);
          GeoPackageUtils.createNonLinearFeatures(gp);
          GeoPackageUtils.createRTreeSpatialIndexExtension(gp);
          await GeoPackageUtils.createRelatedTablesMediaExtension(gp);
          GeoPackageUtils.createRelatedTablesFeaturesExtension(gp);
          await GeoPackageUtils.createTiles(gp);
          await GeoPackageUtils.createWebPExtension(gp);
          GeoPackageUtils.createAttributes(gp);
          GeoPackageUtils.createSimpleAttributes(gp);
          GeoPackageUtils.createRelatedTablesSimpleAttributesExtension(gp);
          GeoPackageUtils.createRelatedTablesAttributesExtension(gp);
          GeoPackageUtils.createRelatedTablesTilesExtension(gp);
          GeoPackageUtils.createMetadataExtension(gp);
          GeoPackageUtils.createCoverageDataExtension(gp);
          GeoPackageUtils.createPropertiesExtension(gp);
          GeoPackageUtils.createFeatureTileLinkExtension(gp);
          gp.close();
        })
        .catch(function (error) {
          console.log(error);
          false.should.be.equal(true);
        });
    });
  });

  describe('Create a GeoPackage with an attributes table', function () {
    var testGeoPackage = path.join(__dirname, 'fixtures', 'tmp', 'attributes.gpkg');

    before(function (done) {
      // remove the created geoPackage
      if (typeof process !== 'undefined' && process.version) {
        fs.unlink(testGeoPackage, function () {
          fs.mkdir(path.dirname(testGeoPackage), function () {
            fs.open(testGeoPackage, 'w', done);
          });
        });
      } else {
        done();
      }
    });

    it('output an attributes GeoPackage', function () {
      this.timeout(60000);
      console.log('Create GeoPackage');
      return GeoPackageManager.create(testGeoPackage)
        .then(function (gp) {
          console.log('Created GeoPackage');
          GeoPackageUtils.createCRSWKTExtension(gp);
          GeoPackageUtils.createAttributes(gp);
          gp.close();
        })
        .catch(function (error) {
          console.log('error', error);
          false.should.be.equal(true);
        });
    });
  });
});

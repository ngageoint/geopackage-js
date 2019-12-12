import { default as GeoPackageAPI } from '../../../..'
import { default as testSetup } from '../../../fixtures/testSetup'

var FeatureTiles = require('../../../../lib/tiles/features').FeatureTiles
  , FeatureTilePointIcon = require('../../../../lib/tiles/features/featureTilePointIcon')
  , NumberFeaturesTile = require('../../../../lib/tiles/features/custom/numberFeaturesTile').NumberFeaturesTile
  , ImageUtils = require('../../../../lib/tiles/imageUtils').ImageUtils
  // , GeoPackageAPI = require('../../../..')
  // , testSetup = require('../../../fixtures/testSetup')
  , fs = require('fs-extra')
  , should = require('chai').should()
  , path = require('path');

var isWeb = !(typeof(process) !== 'undefined' && process.version);
var isLinux = process.platform === 'linux';

describe('GeoPackage FeatureTiles tests', function() {

  describe('Rivers GeoPackage tests', function() {

    var geoPackage;
    var featureDao;
    var filename;

    beforeEach('should open the geopackage', async function() {
      var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'rivers.gpkg');
      // @ts-ignore
      let result = await copyAndOpenGeopackage(originalFilename);
      filename = result.path;
      geoPackage = result.geopackage;
      featureDao = geoPackage.getFeatureDao('FEATURESriversds');
    });

    afterEach('should close the geopackage', async function() {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    });

    it('should get the x: 1, y: 0, z: 1 tile', function(done) {
      this.timeout(30000);
      var ft = new FeatureTiles(featureDao);
      ft.drawTile(1, 0, 1)
        .then(function(image) {
          testSetup.diffImages(image, path.join(__dirname, '..','..','..', 'fixtures','featuretiles', isWeb ? 'web' : '', '1_1_0.png'), function(err, equal) {
            equal.should.be.equal(true);
            done();
          });
        });
    });

    it('should get the x: 0, y: 0, z: 0 tile', function(done) {
      this.timeout(30000);
      var ft = new FeatureTiles(featureDao);
      ft.drawTile(0, 0, 0)
        .then(function(image) {
          testSetup.diffImages(image, path.join(__dirname, '..','..','..', 'fixtures','featuretiles', isWeb ? 'web' : '', '0_0_0.png'), function(err, equal) {
            equal.should.be.equal(true);
            done();
          });
        });
    });

    it('should get the x: 1, y: 0, z: 1 tile from the GeoPackage api', function(done) {
      this.timeout(30000);
      console.time('Generating non indexed tiles');
      GeoPackageAPI.getFeatureTileFromXYZ(geoPackage, 'FEATURESriversds', 1, 0, 1, 256, 256)
      .then(function(data) {
        should.exist(data);
        console.timeEnd('Generating non indexed tiles');
        testSetup.diffImages(data, path.join(__dirname, '..','..','..','fixtures','featuretiles', isWeb ? 'web' : '', '1_1_0.png'), function(err, equal) {
          equal.should.be.equal(true);
          done();
        });
      });
    });

    it('should get the x: 8, y: 12, z: 5 tile from the GeoPackage api', function(done) {
      this.timeout(30000);
      console.time('Generating non indexed tiles');
      GeoPackageAPI.getFeatureTileFromXYZ(geoPackage, 'FEATURESriversds', 8, 12, 5, 256, 256)
      .then(function(data) {
        should.exist(data);
        console.timeEnd('Generating non indexed tiles');
        testSetup.diffImages(data, path.join(__dirname, '..','..','..','fixtures','featuretiles', isWeb ? 'web' : '', '5_8_12.png'), function(err, equal) {
          equal.should.be.equal(true);
          done();
        });
      });
    });
  });

  describe('Indexed Rivers GeoPackage tests', function() {

    var geoPackage;
    var featureDao;

    beforeEach('should open the geopackage', async function() {
      var filename = path.join(__dirname, '..', '..', '..', 'fixtures', 'rivers_indexed.gpkg');
      // @ts-ignore
      let result = await copyAndOpenGeopackage(filename);
      filename = result.path;
      geoPackage = result.geopackage;
      featureDao = geoPackage.getFeatureDao('rivers');
    });

    afterEach('should close the geopackage', function() {
      geoPackage.close();
    });

    it('should get the x: 1, y: 0, z: 1 tile', function(done) {
      this.timeout(30000);
      var ft = new FeatureTiles(featureDao);
      ft.drawTile(1, 0, 1)
      .then(function(imageStream) {
        testSetup.diffImages(imageStream, path.join(__dirname, '..','..','..','fixtures','featuretiles', isWeb ? 'web' : '', '1_1_0_indexed.png'), function(err, equal) {
          equal.should.be.equal(true);
          done();
        });
      });
    });

    it('should get the x: 1, y: 0, z: 1 tile from the GeoPackage api', function(done) {
      this.timeout(30000);
      console.time('generating indexed tile');
      GeoPackageAPI.getFeatureTileFromXYZ(geoPackage, 'rivers', 1, 0, 1, 256, 256)
      .then(function(data) {
        console.timeEnd('generating indexed tile');
        should.exist(data);
        testSetup.diffImages(data, path.join(__dirname, '..','..','..','fixtures','featuretiles', isWeb ? 'web' : '', '1_1_0_indexed.png'), function(err, equal) {
          equal.should.be.equal(true);
          done();
        });
      });
    });

    it('should get the x: 0, y: 0, z: 0 tile from the GeoPackage api', function(done) {
      this.timeout(30000);
      console.time('generating indexed tile');
      GeoPackageAPI.getFeatureTileFromXYZ(geoPackage, 'rivers', 0, 0, 0, 256, 256)
      .then(function(data) {
        should.exist(data);
        console.timeEnd('generating indexed tile');
        testSetup.diffImages(data, path.join(__dirname, '..','..','..','fixtures','featuretiles', isWeb ? 'web' : '', '0_0_0_indexed.png'), function(err, equal) {
          equal.should.be.equal(true);
          done();
        });
      });
    });

    it('should get the x: 8, y: 12, z: 5 tile from the GeoPackage api', function(done) {
      this.timeout(30000);
      console.time('generating indexed tile');
      GeoPackageAPI.getFeatureTileFromXYZ(geoPackage, 'rivers', 8, 12, 5, 256, 256)
      .then(function(data) {
        should.exist(data);
        console.timeEnd('generating indexed tile');
        testSetup.diffImages(data, path.join(__dirname, '..','..','..','fixtures','featuretiles', isWeb ? 'web' : '', '5_8_12_indexed.png'), function(err, equal) {
          fs.writeFileSync('/tmp/5_8_12_indexed.png', data);

          equal.should.be.equal(true);
          done();
        });
      });
    });

  });

  describe('Styled GeoPackage tests', function() {
    var geoPackage;
    var featureDao;
    var filename;

    beforeEach('should open the geopackage', async function() {
      var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'styled.gpkg');
      // @ts-ignore
      let result = await copyAndOpenGeopackage(originalFilename);
      filename = result.path;
      geoPackage = result.geopackage;
      featureDao = geoPackage.getFeatureDao('Drawing Layer 1');
    });

    afterEach('should close the geopackage', async function() {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    });

    it('should get the x: 153631, y: 91343, z: 18 tile', function(done) {
      this.timeout(30000);
      var ft = new FeatureTiles(featureDao);
      ft.drawTile(153631, 91343, 18)
        .then(function(image) {
          testSetup.diffImages(image, path.join(__dirname, '..','..','..', 'fixtures','featuretiles', isWeb ? 'web' : '', '153631_91343_18.png'), function(err, equal) {
            equal.should.be.equal(true);
            done();
          });
        });
    });

    it('should get the x: 153632, y: 91342, z: 18 tile', function(done) {
      this.timeout(30000);
      var ft = new FeatureTiles(featureDao);
      ft.drawTile(153632, 91342, 18)
        .then(function(image) {
          testSetup.diffImages(image, path.join(__dirname, '..','..','..', 'fixtures','featuretiles', isWeb ? 'web' : '', '153632_91342_18.png'), function(err, equal) {
            equal.should.be.equal(true);
            done();
          });
        });
    });

    it('should get the x: 153632, y: 91343, z: 18 tile', function(done) {
      this.timeout(30000);
      var ft = new FeatureTiles(featureDao);
      ft.drawTile(153632, 91343, 18)
        .then(function(image) {
          testSetup.diffImages(image, path.join(__dirname, '..','..','..', 'fixtures','featuretiles', isWeb ? 'web' : '', '153632_91343_18.png'), function(err, equal) {
            equal.should.be.equal(true);
            done();
          });
        });
    });

    it('should get the x: 153633, y: 91342, z: 18 tile', function(done) {
      this.timeout(30000);
      var ft = new FeatureTiles(featureDao);
      ft.drawTile(153633, 91342, 18)
        .then(function(image) {
          testSetup.diffImages(image, path.join(__dirname, '..','..','..', 'fixtures','featuretiles', isWeb ? 'web' : '', '153633_91342_18.png'), function(err, equal) {
            equal.should.be.equal(true);
            done();
          });
        });
    });

    it('should get the x: 153633, y: 91343, z: 18 tile', function(done) {
      this.timeout(30000);
      var ft = new FeatureTiles(featureDao);
      ft.drawTile(153633, 91343, 18)
        .then(function(image) {
          testSetup.diffImages(image, path.join(__dirname, '..','..','..', 'fixtures','featuretiles', isWeb ? 'web' : '', '153633_91343_18.png'), function(err, equal) {
            equal.should.be.equal(true);
            done();
          });
        });
    });

    it('should get the x: 153631, y: 91343, z: 18 tile from the GeoPackage api', function(done) {
      this.timeout(30000);
      console.time('Generating non indexed tiles');
      GeoPackageAPI.getFeatureTileFromXYZ(geoPackage, 'Drawing Layer 1', 153631, 91343, 18, 256, 256)
        .then(function(data) {
          should.exist(data);
          console.timeEnd('Generating non indexed tiles');
          testSetup.diffImages(data, path.join(__dirname, '..','..','..','fixtures','featuretiles', isWeb ? 'web' : '', '153631_91343_18.png'), function(err, equal) {
            equal.should.be.equal(true);
            done();
          });
        });
    });

    it('should get the x: 153632, y: 91342, z: 18 tile from the GeoPackage api', function(done) {
      this.timeout(30000);
      console.time('Generating non indexed tiles');
      GeoPackageAPI.getFeatureTileFromXYZ(geoPackage, 'Drawing Layer 1', 153632, 91342, 18, 256, 256)
        .then(function(data) {
          should.exist(data);
          console.timeEnd('Generating non indexed tiles');
          testSetup.diffImages(data, path.join(__dirname, '..','..','..','fixtures','featuretiles', isWeb ? 'web' : '', '153632_91342_18.png'), function(err, equal) {
            equal.should.be.equal(true);
            done();
          });
        });
    });

    it('should get the x: 153632, y: 91343, z: 18 tile from the GeoPackage api', function(done) {
      this.timeout(30000);
      console.time('Generating non indexed tiles');
      GeoPackageAPI.getFeatureTileFromXYZ(geoPackage, 'Drawing Layer 1', 153632, 91343, 18, 256, 256)
        .then(function(data) {
          should.exist(data);
          console.timeEnd('Generating non indexed tiles');
          testSetup.diffImages(data, path.join(__dirname, '..','..','..','fixtures','featuretiles', isWeb ? 'web' : '', '153632_91343_18.png'), function(err, equal) {
            equal.should.be.equal(true);
            done();
          });
        });
    });

    it('should get the x: 153633, y: 91342, z: 18 tile from the GeoPackage api', function(done) {
      this.timeout(30000);
      console.time('Generating non indexed tiles');
      GeoPackageAPI.getFeatureTileFromXYZ(geoPackage, 'Drawing Layer 1', 153633, 91342, 18, 256, 256)
        .then(function(data) {
          should.exist(data);
          console.timeEnd('Generating non indexed tiles');
          testSetup.diffImages(data, path.join(__dirname, '..','..','..','fixtures','featuretiles', isWeb ? 'web' : '', '153633_91342_18.png'), function(err, equal) {
            equal.should.be.equal(true);
            done();
          });
        });
    });

    it('should get the x: 153633, y: 91343, z: 18 tile from the GeoPackage api', function(done) {
      this.timeout(30000);
      console.time('Generating non indexed tiles');
      GeoPackageAPI.getFeatureTileFromXYZ(geoPackage, 'Drawing Layer 1', 153633, 91343, 18, 256, 256)
        .then(function(data) {
          should.exist(data);
          console.timeEnd('Generating non indexed tiles');
          testSetup.diffImages(data, path.join(__dirname, '..','..','..','fixtures','featuretiles', isWeb ? 'web' : '', '153633_91343_18.png'), function(err, equal) {
            equal.should.be.equal(true);
            done();
          });
        });
    });

    it('should get the x: 153632, y: 91343, z: 18 tile', function(done) {
      this.timeout(30000);
      var ft = new FeatureTiles(featureDao);
      ImageUtils.getImage(path.join(__dirname, '..','..','..', 'fixtures','marker-icon.png')).then((image) => {
        var ftpi = new FeatureTilePointIcon(image);
        ftpi.setWidth(ftpi.getWidth());
        ftpi.setHeight(ftpi.getHeight());
        ftpi.setXOffset(0);
        ftpi.setYOffset(0);
        ftpi.pinIconCenter();
        ft.setPointIcon(ftpi);
        ft.calculateDrawOverlap()
        ft.drawTile(153632, 91343, 18)
          .then(function(image) {
            testSetup.diffImages(image, path.join(__dirname, '..','..','..', 'fixtures','featuretiles', isWeb ? 'web' : '', '153632_91343_18_styled_with_icon.png'), function(err, equal) {
              equal.should.be.equal(true);
              done();
            });
          });
      });
    });
  });

  describe('Styled With Icon GeoPackage tests', function() {
    var geoPackage;
    var featureDao;
    var filename;

    beforeEach('should open the geopackage', async function() {
      var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'styled_with_icon.gpkg');
      // @ts-ignore
      let result = await copyAndOpenGeopackage(originalFilename);
      filename = result.path;
      geoPackage = result.geopackage;
      featureDao = geoPackage.getFeatureDao('Drawing Layer 1');
    });

    afterEach('should close the geopackage', async function() {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    });

    it('should get the x: 153632, y: 91343, z: 18 tile', function(done) {
      this.timeout(30000);
      var ft = new FeatureTiles(featureDao);
      ft.drawTile(153632, 91343, 18)
        .then(function(image) {
          testSetup.diffImages(image, path.join(__dirname, '..','..','..', 'fixtures','featuretiles', isWeb ? 'web' : '', '153632_91343_18_styled_with_icon.png'), function(err, equal) {
            equal.should.be.equal(true);
            done();
          });
        });
    });

    it('should get the x: 153632, y: 91343, z: 18 tile from the GeoPackage api', function(done) {
      this.timeout(30000);
      console.time('Generating non indexed tiles');
      GeoPackageAPI.getFeatureTileFromXYZ(geoPackage, 'Drawing Layer 1', 153632, 91343, 18, 256, 256)
        .then(function(data) {
          should.exist(data);
          console.timeEnd('Generating non indexed tiles');
          testSetup.diffImages(data, path.join(__dirname, '..','..','..','fixtures','featuretiles', isWeb ? 'web' : '', '153632_91343_18_styled_with_icon.png'), function(err, equal) {
            equal.should.be.equal(true);
            done();
          });
        });
    });
  });

  describe('FeatureTile tests', function() {
    var geoPackage;
    var featureDao;
    var filename;

    beforeEach('should open the geopackage', async function() {
      var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'styled_scaled.gpkg');
      // @ts-ignore
      let result = await copyAndOpenGeopackage(originalFilename);
      filename = result.path;
      geoPackage = result.geopackage;
      featureDao = geoPackage.getFeatureDao('Drawing Layer 1');
    });

    afterEach('should close the geopackage', async function() {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    });

    it('should get the x: 153632, y: 91343, z: 18 tile and scale the styles', function(done) {
      this.timeout(30000);
      var ft = new FeatureTiles(featureDao);
      should.exist(ft.getFeatureDao());
      should.exist(ft.getFeatureTableStyles());
      var featureTableStyles = ft.getFeatureTableStyles();
      ft.setFeatureTableStyles(null);
      should.not.exist(ft.getFeatureTableStyles());
      ft.setFeatureTableStyles(featureTableStyles);
      ft.setScale(0.5);
      ft.getScale().should.be.equal(0.5);
      ft.setTileHeight(256);
      ft.getTileHeight().should.be.equal(256);
      ft.setTileWidth(256);
      ft.getTileWidth().should.be.equal(256);
      var widthDrawOverlap = ft.getWidthDrawOverlap();
      var heightDrawOverlap = ft.getHeightDrawOverlap();
      ft.setWidthDrawOverlap(0);
      ft.setHeightDrawOverlap(0);
      ft.getWidthDrawOverlap().should.be.equal(0);
      ft.getHeightDrawOverlap().should.be.equal(0);
      ft.setWidthDrawOverlap(widthDrawOverlap);
      ft.setHeightDrawOverlap(heightDrawOverlap);
      ft.drawTile(153632, 91343, 18)
        .then(function(image) {
          testSetup.diffImages(image, path.join(__dirname, '..','..','..', 'fixtures','featuretiles', isWeb ? 'web' : '', '153632_91343_18_scaled.png'), function(err, equal) {
            equal.should.be.equal(true);
            done();
          });
        });
    });

    it.skip('should get the x: 153632, y: 91343, z: 18 tile without styling', function(done) {
      this.timeout(30000);
      var ft = new FeatureTiles(featureDao);
      ft.ignoreFeatureTableStyles();
      ft.clearCache();
      ft.setStylePaintCacheSize(100);
      ft.setIconCacheSize(100);
      ft.setCompressFormat('jpeg');
      ft.getCompressFormat().should.be.equal('jpeg');
      ft.setCompressFormat('png');
      ft.setDrawOverlap(0);
      ft.calculateDrawOverlap();
      ft.drawTile(153632, 91343, 18)
        .then(function(image) {
          testSetup.diffImages(image, path.join(__dirname, '..','..','..', 'fixtures','featuretiles',isWeb ? 'web' : '', '153632_91343_18_styles_ignored.png'), function(err, equal) {
            equal.should.be.equal(true);
            done();
          });
        });
    });

    it('should get the x: 153632, y: 91343, z: 18 tile with modified default styling', function(done) {
      this.timeout(30000);
      var ft = new FeatureTiles(featureDao);
      ft.ignoreFeatureTableStyles();
      ft.setFillPolygon(true);
      ft.isFillPolygon().should.be.equal(true);
      should.not.exist(ft.getPointIcon());
      ft.setLineColor('#FF0000FF');
      ft.getLineColor().should.be.equal('#FF0000FF');
      ft.setLineStrokeWidth(5);
      ft.getLineStrokeWidth().should.be.equal(5);
      ft.setPointColor('#FF0000FF');
      ft.getPointColor().should.be.equal('#FF0000FF');
      ft.setPointRadius(5);
      ft.getPointRadius().should.be.equal(5);
      ft.setPolygonColor('#FF0000FF');
      ft.getPolygonColor().should.be.equal('#FF0000FF');
      ft.setPolygonFillColor('#00FF00FF');
      ft.getPolygonFillColor().should.be.equal('#00FF00FF')
      ft.setPolygonStrokeWidth(5);
      ft.getPolygonStrokeWidth().should.be.equal(5);
      (function() {
        ft.getStylePaint({
          getId: function () {
            return 0;
          }
        }, 'INVALID');
      }).should.throw("Unsupported Draw Type: " + 'INVALID');

      ft.drawTile(153632, 91343, 18)
        .then(function(image) {
          testSetup.diffImages(image, path.join(__dirname, '..','..','..', 'fixtures','featuretiles',isWeb ? 'web' : '', '153632_91343_18_default_style_modified.png'), function(err, equal) {
            equal.should.be.equal(true);
            done();
          });
        });
    });

    it('should get the max feature tile and test various functions', function(done) {
      this.timeout(30000);
      var ft = new FeatureTiles(featureDao);
      ft.setMaxFeaturesPerTile(1);
      ft.getMaxFeaturesPerTile().should.be.equal(1);
      should.not.exist(ft.getMaxFeaturesTileDraw());
      var numberFeaturesTile = new NumberFeaturesTile();
      numberFeaturesTile.getCircleColor().should.be.equal("rgba(0, 0, 0, 0.25)");
      numberFeaturesTile.setCircleColor("rgba(0, 0, 0, 0.50)");
      numberFeaturesTile.getCircleColor().should.be.equal("rgba(0, 0, 0, 0.50)");
      numberFeaturesTile.setCircleColor("rgba(0, 0, 0, 0.25)");

      numberFeaturesTile.getCircleFillColor().should.be.equal("rgba(0, 0, 0, 1.0)");
      numberFeaturesTile.setCircleFillColor("rgba(0, 0, 0, 0.50)");
      numberFeaturesTile.getCircleFillColor().should.be.equal("rgba(0, 0, 0, 0.50)");
      numberFeaturesTile.setCircleFillColor("rgba(0, 0, 0, 1.0)");

      numberFeaturesTile.getTextSize().should.be.equal(18);
      numberFeaturesTile.setTextSize(12);
      numberFeaturesTile.getTextSize().should.be.equal(12);
      numberFeaturesTile.setTextSize(18);

      numberFeaturesTile.getTextColor().should.be.equal("rgba(255, 255, 255, 1.0)");
      numberFeaturesTile.setTextColor("rgba(0, 0, 0, 0.50)");
      numberFeaturesTile.getTextColor().should.be.equal("rgba(0, 0, 0, 0.50)");
      numberFeaturesTile.setTextColor("rgba(255, 255, 255, 1.0)");

      numberFeaturesTile.getCircleStrokeWidth().should.be.equal(3);
      numberFeaturesTile.setCircleStrokeWidth(12);
      numberFeaturesTile.getCircleStrokeWidth().should.be.equal(12);
      numberFeaturesTile.setCircleStrokeWidth(3);

      numberFeaturesTile.getCirclePaddingPercentage().should.be.equal(0.25);
      numberFeaturesTile.setCirclePaddingPercentage(0.5);
      numberFeaturesTile.getCirclePaddingPercentage().should.be.equal(0.5);
      (function() {
        numberFeaturesTile.setCirclePaddingPercentage(2)
      }).should.throw("Circle padding percentage must be between 0.0 and 1.0: " + 2);
      numberFeaturesTile.setCirclePaddingPercentage(0.25);

      numberFeaturesTile.getTileBorderStrokeWidth().should.be.equal(2);
      numberFeaturesTile.setTileBorderStrokeWidth(12);
      numberFeaturesTile.getTileBorderStrokeWidth().should.be.equal(12);
      numberFeaturesTile.setTileBorderStrokeWidth(2);

      numberFeaturesTile.getTileBorderColor().should.be.equal("rgba(0, 0, 0, 1.0)");
      numberFeaturesTile.setTileBorderColor("rgba(0, 0, 0, 0.50)");
      numberFeaturesTile.getTileBorderColor().should.be.equal("rgba(0, 0, 0, 0.50)");
      numberFeaturesTile.setTileBorderColor("rgba(0, 0, 0, 1.0)");

      numberFeaturesTile.getTileFillColor().should.be.equal("rgba(0, 0, 0, 0.0625)");
      numberFeaturesTile.setTileFillColor("rgba(0, 0, 0, 0.50)");
      numberFeaturesTile.getTileFillColor().should.be.equal("rgba(0, 0, 0, 0.50)");
      numberFeaturesTile.setTileFillColor("rgba(0, 0, 0, 0.0625)");

      numberFeaturesTile.isDrawUnindexedTiles().should.be.equal(true);
      numberFeaturesTile.setDrawUnindexedTiles(false);
      numberFeaturesTile.isDrawUnindexedTiles().should.be.equal(false);
      numberFeaturesTile.setDrawUnindexedTiles(true);

      numberFeaturesTile.getCompressFormat().should.be.equal('png');
      numberFeaturesTile.setCompressFormat('jpeg');
      numberFeaturesTile.getCompressFormat().should.be.equal('jpeg');
      numberFeaturesTile.setCompressFormat('png');

      ft.setMaxFeaturesTileDraw(numberFeaturesTile);
      should.exist(ft.getMaxFeaturesTileDraw());

      ft.drawTile(153632, 91343, 18)
        .then(function(image) {
          testSetup.diffImages(image, path.join(__dirname, '..','..','..', 'fixtures','featuretiles',isWeb ? 'web' : '',  isLinux ? 'max_feature_tile_unindexed_linux.png' : 'max_feature_tile_unindexed.png'), function(err, equal) {
            equal.should.be.equal(true);
            done();
          });
        });
    });
  });
});

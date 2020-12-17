import { default as testSetup } from '../../../fixtures/testSetup'

var FeatureTiles = require('../../../../lib/tiles/features').FeatureTiles
  , GeometryType = require('../../../../lib/features/user/geometryType').GeometryType
  , FeatureTilePointIcon = require('../../../../lib/tiles/features/featureTilePointIcon').FeatureTilePointIcon
  , NumberFeaturesTile = require('../../../../lib/tiles/features/custom/numberFeaturesTile').NumberFeaturesTile
  , ShadedFeaturesTile = require('../../../../lib/tiles/features/custom/shadedFeaturesTile').ShadedFeaturesTile
  , SetupFeatureTable = require('../../../fixtures/setupFeatureTable')
  , ImageUtils = require('../../../../lib/tiles/imageUtils').ImageUtils
  , FeatureColumn = require('../../../../lib/features/user/featureColumn').FeatureColumn
  , GeoPackageDataType = require('../../../../lib/db/geoPackageDataType').GeoPackageDataType
  , GeometryData = require('../../../../lib/geom/geometryData').GeometryData
  , fs = require('fs-extra')
  , should = require('chai').should()
  , path = require('path')
  , wkx = require('wkx');

var isWeb = !(typeof(process) !== 'undefined' && process.version);
var isLinux = process.platform === 'linux';

describe('GeoPackage FeatureTiles tests', function() {

  describe('Random tests', function() {
    var geoPackage;
    var featureDao;
    var filename;

    var testPath = path.join(__dirname, '..', '..', '..', 'fixtures', 'tmp');

    beforeEach('should create the GeoPackage', async function() {
      filename = path.join(testPath, testSetup.createTempName());
      geoPackage = await testSetup.createGeoPackage(filename)

      // @ts-ignore
      var geometryColumns = SetupFeatureTable.buildGeometryColumns('QueryTest', 'geom', GeometryType.POINT);

      var columns = [];

      columns.push(FeatureColumn.createPrimaryKeyColumn(0, 'id'));
      // @ts-ignore
      columns.push(FeatureColumn.createGeometryColumn(1, 'geom', GeometryType.POINT, false, null));
      columns.push(FeatureColumn.createColumn(2, 'name', GeoPackageDataType.TEXT, false, ""));
      columns.push(FeatureColumn.createColumn(3, '_feature_id', GeoPackageDataType.TEXT, false, ""));
      columns.push(FeatureColumn.createColumn(4, '_properties_id', GeoPackageDataType.TEXT, false, ""));

      var box = {
        "type": "Polygon",
        "coordinates": [
          [
            [-1,1],
            [1,1],
            [1,3],
            [ -1,3],
            [-1,1],
            [ NaN, NaN]
          ]
        ]
      };

      var line = {
        "type": "LineString",
        "coordinates": [
          [2,3],
          [-1,0],
          [NaN, NaN]
        ]
      };

      var point = {
        "type": "Point",
        "coordinates":
        [NaN,NaN]
      };

      var createRow = function(geoJson, name, featureDao) {
        var srs = featureDao.srs;
        var featureRow = featureDao.newRow();
        var geometryData = new GeometryData();
        geometryData.setSrsId(srs.srs_id);
        var geometry = wkx.Geometry.parseGeoJSON(geoJson);
        geometryData.setGeometry(geometry);
        featureRow.geometry = geometryData;
        featureRow.setValueWithColumnName('name', name);
        featureRow.setValueWithColumnName('_feature_id', name);
        featureRow.setValueWithColumnName('_properties_id', 'properties' + name);
        return featureDao.create(featureRow);
      }
      // create the features
      // Two intersecting boxes with a line going through the intersection and a point on the line
      // ---------- / 3
      // | 1  ____|/_____
      // |    |  /|  2  |
      // |____|_/_|     |
      //      |/        |
      //      /_________|
      //     /
      await geoPackage.createFeatureTable('QueryTest', geometryColumns, columns);
      featureDao = geoPackage.getFeatureDao('QueryTest');
      createRow(box, 'box', featureDao);
      createRow(line, 'line', featureDao);
      createRow(point, 'point', featureDao);
      // await featureDao.featureTableIndex.index()
    });

    afterEach('should close the geopackage', async function() {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    });

    it('should handle empty points in a line', function() {
      this.timeout(30000);
      var ft = new FeatureTiles(featureDao);
      return ft.drawTile(0, 0, 0)
        .then(function(image) {
          should.exist(image);
        });
    });
  })


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
      geoPackage.getFeatureTileFromXYZ('FEATURESriversds', 1, 0, 1, 256, 256)
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
      geoPackage.getFeatureTileFromXYZ('FEATURESriversds', 8, 12, 5, 256, 256)
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
    var filename;

    beforeEach('should open the geopackage', async function() {
      var indexedfilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'rivers_indexed.gpkg');
      // @ts-ignore
      let result = await copyAndOpenGeopackage(indexedfilename);
      filename = result.path;
      geoPackage = result.geopackage;
      featureDao = geoPackage.getFeatureDao('rivers');
    });

    afterEach('should close the geopackage', async function() {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
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
      geoPackage.getFeatureTileFromXYZ('rivers', 1, 0, 1, 256, 256)
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
      geoPackage.getFeatureTileFromXYZ('rivers', 0, 0, 0, 256, 256)
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
      geoPackage.getFeatureTileFromXYZ('rivers', 8, 12, 5, 256, 256)
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
      geoPackage.getFeatureTileFromXYZ('Drawing Layer 1', 153631, 91343, 18, 256, 256)
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
      geoPackage.getFeatureTileFromXYZ('Drawing Layer 1', 153632, 91342, 18, 256, 256)
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
      geoPackage.getFeatureTileFromXYZ('Drawing Layer 1', 153632, 91343, 18, 256, 256)
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
      geoPackage.getFeatureTileFromXYZ('Drawing Layer 1', 153633, 91342, 18, 256, 256)
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
      geoPackage.getFeatureTileFromXYZ('Drawing Layer 1', 153633, 91343, 18, 256, 256)
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
        ft.pointIcon = ftpi;
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
      geoPackage.getFeatureTileFromXYZ('Drawing Layer 1', 153632, 91343, 18, 256, 256)
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
      should.exist(ft.featureDao);
      should.exist(ft.featureTableStyles);
      var featureTableStyles = ft.featureTableStyles;
      ft.featureTableStyles = null;
      should.not.exist(ft.featureTableStyles);
      ft.featureTableStyles = featureTableStyles;
      ft.scale = 0.5;
      ft.scale.should.be.equal(0.5);
      ft.tileHeight = 256;
      ft.tileHeight.should.be.equal(256);
      ft.tileWidth = 256;
      ft.tileWidth.should.be.equal(256);
      var widthDrawOverlap = ft.widthDrawOverlap;
      var heightDrawOverlap = ft.heightDrawOverlap;
      ft.widthDrawOverlap = 0;
      ft.heightDrawOverlap = 0;
      ft.widthDrawOverlap.should.be.equal(0);
      ft.heightDrawOverlap.should.be.equal(0);
      ft.widthDrawOverlap = widthDrawOverlap;
      ft.heightDrawOverlap = heightDrawOverlap;
      ft.drawTile(153632, 91343, 18)
        .then(function(image) {
          testSetup.diffImages(image, path.join(__dirname, '..','..','..', 'fixtures','featuretiles', isWeb ? 'web' : '', '153632_91343_18_scaled.png'), function(err, equal) {
            equal.should.be.equal(true);
            done();
          });
        });
    });

    it('should get the x: 153632, y: 91343, z: 18 tile without styling', function(done) {
      this.timeout(30000);
      var ft = new FeatureTiles(featureDao);
      ft.ignoreFeatureTableStyles();
      ft.clearCache();
      ft.stylePaintCacheSize = 100;
      ft.iconCacheSize = 100;
      ft.compressFormat = 'jpeg';
      ft.compressFormat.should.be.equal('jpeg');
      ft.compressFormat = 'png';
      ft.drawOverlap = 0;
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
      ft.fillPolygon = true;
      ft.fillPolygon.should.be.equal(true);
      should.not.exist(ft.pointIcon);
      ft.lineColor = '#FF0000FF';
      ft.lineColor.should.be.equal('#FF0000FF');
      ft.lineStrokeWidth = 5;
      ft.lineStrokeWidth.should.be.equal(5);
      ft.pointColor = '#FF0000FF';
      ft.pointColor.should.be.equal('#FF0000FF');
      ft.pointRadius = 5;
      ft.pointRadius.should.be.equal(5);
      ft.polygonColor = '#FF0000FF';
      ft.polygonColor.should.be.equal('#FF0000FF');
      ft.polygonFillColor = '#00FF00FF';
      ft.polygonFillColor.should.be.equal('#00FF00FF')
      ft.polygonStrokeWidth = 5;
      ft.polygonStrokeWidth.should.be.equal(5);

      ft.drawTile(153632, 91343, 18)
        .then(function(image) {
          testSetup.diffImages(image, path.join(__dirname, '..','..','..', 'fixtures','featuretiles',isWeb ? 'web' : '', '153632_91343_18_default_style_modified.png'), function(err, equal) {
            equal.should.be.equal(true);
            done();
          });
        });
    });

    it('should get the max feature number tile and test various functions', function(done) {
      this.timeout(30000);
      var ft = new FeatureTiles(featureDao);
      ft.maxFeaturesPerTile = 1;
      ft.maxFeaturesPerTile.should.be.equal(1);
      should.not.exist(ft.maxFeaturesTileDraw);
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

      ft.maxFeaturesTileDraw = numberFeaturesTile;
      should.exist(ft.maxFeaturesTileDraw);

      ft.drawTile(153632, 91343, 18)
        .then(function(image) {
          testSetup.diffImages(image, path.join(__dirname, '..','..','..', 'fixtures','featuretiles',isWeb ? 'web' : '',  isLinux ? 'max_feature_tile_unindexed_linux.png' : 'max_feature_tile_unindexed.png'), function(err, equal) {
            equal.should.be.equal(true);
            done();
          });
        });
    });

    it('should get the max feature shaded tile and test various functions', function(done) {
      this.timeout(30000);
      var ft = new FeatureTiles(featureDao);
      ft.maxFeaturesPerTile = 1;
      ft.maxFeaturesPerTile.should.be.equal(1);
      should.not.exist(ft.maxFeaturesTileDraw);
      var shadedFeaturesTile = new ShadedFeaturesTile();

      shadedFeaturesTile.getTileBorderStrokeWidth().should.be.equal(2);
      shadedFeaturesTile.setTileBorderStrokeWidth(12);
      shadedFeaturesTile.getTileBorderStrokeWidth().should.be.equal(12);
      shadedFeaturesTile.setTileBorderStrokeWidth(2);

      shadedFeaturesTile.getTileBorderColor().should.be.equal("rgba(0, 0, 0, 1.0)");
      shadedFeaturesTile.setTileBorderColor("rgba(0, 0, 0, 0.50)");
      shadedFeaturesTile.getTileBorderColor().should.be.equal("rgba(0, 0, 0, 0.50)");
      shadedFeaturesTile.setTileBorderColor("rgba(0, 0, 0, 1.0)");

      shadedFeaturesTile.getTileFillColor().should.be.equal("rgba(0, 0, 0, 0.0625)");
      shadedFeaturesTile.setTileFillColor("rgba(0, 0, 0, 0.50)");
      shadedFeaturesTile.getTileFillColor().should.be.equal("rgba(0, 0, 0, 0.50)");
      shadedFeaturesTile.setTileFillColor("rgba(0, 0, 0, 0.0625)");

      shadedFeaturesTile.isDrawUnindexedTiles().should.be.equal(true);
      shadedFeaturesTile.setDrawUnindexedTiles(false);
      shadedFeaturesTile.isDrawUnindexedTiles().should.be.equal(false);
      shadedFeaturesTile.setDrawUnindexedTiles(true);

      shadedFeaturesTile.getCompressFormat().should.be.equal('png');
      shadedFeaturesTile.setCompressFormat('jpeg');
      shadedFeaturesTile.getCompressFormat().should.be.equal('jpeg');
      shadedFeaturesTile.setCompressFormat('png');

      ft.maxFeaturesTileDraw = shadedFeaturesTile;
      should.exist(ft.maxFeaturesTileDraw);

      ft.drawTile(153632, 91343, 18)
        .then(function(image) {
          // fs.writeFileSync('/tmp/max_feature_tile_shaded.png', image);
          testSetup.diffImages(image, path.join(__dirname, '..','..','..', 'fixtures','featuretiles', 'max_feature_tile_shaded.png'), function(err, equal) {
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
      var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'multigeometry.gpkg');
      // @ts-ignore
      let result = await copyAndOpenGeopackage(originalFilename);
      filename = result.path;
      geoPackage = result.geopackage;
      featureDao = geoPackage.getFeatureDao('test');
    });

    afterEach('should close the geopackage', async function() {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    });

    it('should get the x: 0, y: 0, z: 0 tile for multigeometries', function(done) {
      this.timeout(30000);
      var ft = new FeatureTiles(featureDao);
      ft.drawTile(0, 0, 0)
        .then(function(image) {
          testSetup.diffImages(image, path.join(__dirname, '..','..','..', 'fixtures','featuretiles', isWeb ? 'web' : '', 'multigeometry_0_0_0.png'), function(err, equal) {
            equal.should.be.equal(true);
            done();
          });
        });
    });
  });
});

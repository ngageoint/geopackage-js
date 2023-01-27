import { default as testSetup } from '../../../testSetup';
import { FeatureConverter } from '@ngageoint/simple-features-geojson-js';
import { FeatureTableMetadata } from '../../../../lib/features/user/featureTableMetadata';
import { FeatureIndexManager } from '../../../../lib/features/index/featureIndexManager';
import { FeatureIndexType } from '../../../../lib/features/index/featureIndexType';

var FeatureTiles = require('../../../../lib/tiles/features/featureTiles').FeatureTiles,
  Canvas = require('../../../../lib/canvas/canvas').Canvas,
  GeometryType = require('@ngageoint/simple-features-js').GeometryType,
  FeatureTilePointIcon = require('../../../../lib/tiles/features/featureTilePointIcon').FeatureTilePointIcon,
  NumberFeaturesTile = require('../../../../lib/tiles/features/custom/numberFeaturesTile').NumberFeaturesTile,
  SetupFeatureTable = require('../../../setupFeatureTable'),
  ImageUtils = require('../../../../lib/image/imageUtils').ImageUtils,
  FeatureColumn = require('../../../../lib/features/user/featureColumn').FeatureColumn,
  GeoPackageDataType = require('../../../../lib/db/geoPackageDataType').GeoPackageDataType,
  GeometryData = require('../../../../lib/geom/geoPackageGeometryData').GeoPackageGeometryData,
  should = require('chai').should(),
  path = require('path');

var isWeb = !(typeof process !== 'undefined' && process.version);
var isLinux = process.platform === 'linux';

describe('GeoPackage FeatureTiles tests', function () {
  describe('Random tests', function () {
    var geoPackage;
    var featureDao;
    var filename;

    var testPath = path.join(__dirname, '..', '..', '..', 'fixtures', 'tmp');

    beforeEach('should create the GeoPackage', async function () {
      filename = path.join(testPath, testSetup.createTempName());
      geoPackage = await testSetup.createGeoPackage(filename);

      var geometryColumns = SetupFeatureTable.buildGeometryColumns('QueryTest', 'geom', GeometryType.POINT);

      var columns = [];
      columns.push(FeatureColumn.createColumn('name', GeoPackageDataType.TEXT, false, ''));
      columns.push(FeatureColumn.createColumn('_feature_id', GeoPackageDataType.TEXT, false, ''));
      columns.push(FeatureColumn.createColumn('_properties_id', GeoPackageDataType.TEXT, false, ''));

      var box = {
        type: 'Polygon',
        coordinates: [
          [
            [-1, 1],
            [1, 1],
            [1, 3],
            [-1, 3],
            [-1, 1],
            [NaN, NaN],
          ],
        ],
      };

      var line = {
        type: 'LineString',
        coordinates: [
          [2, 3],
          [-1, 0],
          [NaN, NaN],
        ],
      };

      var point = {
        type: 'Point',
        coordinates: [NaN, NaN],
      };

      var createRow = function (geoJson, name, featureDao) {
        var srsId = featureDao.getSrsId();
        var featureRow = featureDao.newRow();
        var geometryData = new GeometryData();
        geometryData.setSrsId(srsId);
        var geometry = FeatureConverter.toSimpleFeaturesGeometry({
          type: 'Feature',
          geometry: geoJson,
        });
        geometryData.setGeometry(geometry);
        featureRow.setGeometry(geometryData);
        featureRow.setValue('name', name);
        featureRow.setValue('_feature_id', name);
        featureRow.setValue('_properties_id', 'properties' + name);
        return featureDao.create(featureRow);
      };
      // create the features
      // Two intersecting boxes with a line going through the intersection and a point on the line
      // ---------- / 3
      // | 1  ____|/_____
      // |    |  /|  2  |
      // |____|_/_|     |
      //      |/        |
      //      /_________|
      //     /
      await geoPackage.createFeatureTableWithFeatureTableMetadata(
        FeatureTableMetadata.create(geometryColumns, columns),
      );
      featureDao = geoPackage.getFeatureDao('QueryTest');
      createRow(box, 'box', featureDao);
      createRow(line, 'line', featureDao);
      createRow(point, 'point', featureDao);
      const indexManager = new FeatureIndexManager(geoPackage, featureDao);
      indexManager.setIndexLocation(FeatureIndexType.RTREE);
      indexManager.index();
    });

    afterEach('should close the geoPackage', async function () {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    });

    it('should handle empty points in a line', function () {
      this.timeout(30000);
      var ft = new FeatureTiles(geoPackage, featureDao);
      return ft.drawTile(0, 0, 0).then(function (image) {
        should.exist(image);
      });
    });
  });

  describe('Rivers GeoPackage tests', function () {
    var geoPackage;
    var featureDao;
    var filename;

    beforeEach('should open the geoPackage', async function () {
      var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'rivers.gpkg');

      let result = await copyAndOpenGeopackage(originalFilename);
      filename = result.path;
      geoPackage = result.geoPackage;
      featureDao = geoPackage.getFeatureDao('FEATURESriversds');
    });

    afterEach('should close the geoPackage', async function () {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    });

    it('should get the 4326 x: 0, y: 0, z: 0 tile', function (done) {
      this.timeout(30000);
      var ft = new FeatureTiles(geoPackage, featureDao);
      ft.drawTileWGS84(0, 0, 0).then((image) => {
        testSetup.diffImages(
          image,
          path.join(__dirname, '..', '..', '..', 'fixtures', 'featuretiles', isWeb ? 'web' : '', '4326_0_0_0.png'),
          function (err, equal) {
            try {
              equal.should.be.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          },
        );
      });
    });

    it('should get the 4326 x: 1, y: 0, z: 0 tile', function (done) {
      this.timeout(30000);
      var ft = new FeatureTiles(geoPackage, featureDao);
      ft.drawTileWGS84(1, 0, 0).then(function (image) {
        testSetup.diffImages(
          image,
          path.join(__dirname, '..', '..', '..', 'fixtures', 'featuretiles', isWeb ? 'web' : '', '4326_1_0_0.png'),
          function (err, equal) {
            try {
              equal.should.be.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          },
        );
      });
    });

    it('should get the x: 0, y: 0, z: 0 tile', function (done) {
      this.timeout(30000);
      var ft = new FeatureTiles(geoPackage, featureDao);
      ft.drawTile(0, 0, 0).then(function (image) {
        testSetup.diffImages(
          image,
          path.join(__dirname, '..', '..', '..', 'fixtures', 'featuretiles', isWeb ? 'web' : '', '0_0_0.png'),
          function (err, equal) {
            try {
              equal.should.be.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          },
        );
      });
    });

    it('should get the x: 1, y: 0, z: 1 tile', function (done) {
      this.timeout(30000);
      var ft = new FeatureTiles(geoPackage, featureDao);
      ft.drawTile(1, 0, 1).then(function (image) {
        testSetup.diffImages(
          image,
          path.join(__dirname, '..', '..', '..', 'fixtures', 'featuretiles', isWeb ? 'web' : '', '1_1_0.png'),
          function (err, equal) {
            try {
              equal.should.be.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          },
        );
      });
    });

    it('should get the x: 1, y: 0, z: 1 tile from the GeoPackage api', function (done) {
      this.timeout(30000);
      console.time('Generating non indexed tiles');
      geoPackage.getFeatureTileFromXYZ('FEATURESriversds', 1, 0, 1, 256, 256).then(function (data) {
        should.exist(data);
        console.timeEnd('Generating non indexed tiles');
        testSetup.diffImages(
          data,
          path.join(__dirname, '..', '..', '..', 'fixtures', 'featuretiles', isWeb ? 'web' : '', '1_1_0.png'),
          function (err, equal) {
            try {
              equal.should.be.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          },
        );
      });
    });

    it('should get the x: 8, y: 12, z: 5 tile from the GeoPackage api', function (done) {
      this.timeout(30000);
      console.time('Generating non indexed tiles');
      geoPackage.getFeatureTileFromXYZ('FEATURESriversds', 8, 12, 5, 256, 256).then(function (data) {
        should.exist(data);
        console.timeEnd('Generating non indexed tiles');
        testSetup.diffImages(
          data,
          path.join(__dirname, '..', '..', '..', 'fixtures', 'featuretiles', isWeb ? 'web' : '', '5_8_12.png'),
          function (err, equal) {
            try {
              equal.should.be.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          },
        );
      });
    });
  });

  describe('Indexed Rivers GeoPackage tests', function () {
    var geoPackage;
    var featureDao;
    var filename;

    beforeEach('should open the geoPackage', async function () {
      var indexedfilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'rivers_indexed.gpkg');

      let result = await copyAndOpenGeopackage(indexedfilename);
      filename = result.path;
      geoPackage = result.geoPackage;
      featureDao = geoPackage.getFeatureDao('rivers');
    });

    afterEach('should close the geoPackage', async function () {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    });

    it('should get the x: 1, y: 0, z: 1 tile', function (done) {
      this.timeout(30000);
      var ft = new FeatureTiles(geoPackage, featureDao);
      ft.drawTile(1, 0, 1).then(function (imageStream) {
        testSetup.diffImages(
          imageStream,
          path.join(__dirname, '..', '..', '..', 'fixtures', 'featuretiles', isWeb ? 'web' : '', '1_1_0.png'),
          function (err, equal) {
            try {
              equal.should.be.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          },
        );
      });
    });

    it('should get the 4326 x: 0, y: 0, z: 0 tile', function (done) {
      this.timeout(30000);
      var ft = new FeatureTiles(geoPackage, featureDao);
      ft.drawTileWGS84(0, 0, 0).then(function (image) {
        testSetup.diffImages(
          image,
          path.join(__dirname, '..', '..', '..', 'fixtures', 'featuretiles', isWeb ? 'web' : '', '4326_0_0_0.png'),
          function (err, equal) {
            try {
              equal.should.be.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          },
        );
      });
    });

    it('should get the 4326 x: 1, y: 0, z: 0 tile', function (done) {
      this.timeout(30000);
      var ft = new FeatureTiles(geoPackage, featureDao);
      ft.drawTileWGS84(1, 0, 0).then(function (image) {
        testSetup.diffImages(
          image,
          path.join(__dirname, '..', '..', '..', 'fixtures', 'featuretiles', isWeb ? 'web' : '', '4326_1_0_0.png'),
          function (err, equal) {
            try {
              equal.should.be.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          },
        );
      });
    });

    it('should get the x: 1, y: 0, z: 1 tile from the GeoPackage api', function (done) {
      this.timeout(30000);
      console.time('generating indexed tile');
      geoPackage.getFeatureTileFromXYZ('rivers', 1, 0, 1, 256, 256).then(function (data) {
        console.timeEnd('generating indexed tile');
        should.exist(data);
        testSetup.diffImages(
          data,
          path.join(__dirname, '..', '..', '..', 'fixtures', 'featuretiles', isWeb ? 'web' : '', '1_1_0.png'),
          function (err, equal) {
            try {
              equal.should.be.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          },
        );
      });
    });

    it('should get the x: 0, y: 0, z: 0 tile from the GeoPackage api', function (done) {
      this.timeout(30000);
      console.time('generating indexed tile');
      geoPackage.getFeatureTileFromXYZ('rivers', 0, 0, 0, 256, 256).then(function (data) {
        should.exist(data);
        console.timeEnd('generating indexed tile');
        testSetup.diffImages(
          data,
          path.join(__dirname, '..', '..', '..', 'fixtures', 'featuretiles', isWeb ? 'web' : '', '0_0_0.png'),
          function (err, equal) {
            try {
              equal.should.be.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          },
        );
      });
    });

    it('should get the x: 8, y: 12, z: 5 tile from the GeoPackage api', function (done) {
      this.timeout(30000);
      console.time('generating indexed tile');
      geoPackage.getFeatureTileFromXYZ('rivers', 8, 12, 5, 256, 256).then(function (data) {
        should.exist(data);
        console.timeEnd('generating indexed tile');
        testSetup.diffImages(
          data,
          path.join(__dirname, '..', '..', '..', 'fixtures', 'featuretiles', isWeb ? 'web' : '', '5_8_12.png'),
          function (err, equal) {
            try {
              equal.should.be.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          },
        );
      });
    });
  });

  describe('Styled GeoPackage tests', function () {
    var geoPackage;
    var featureDao;
    var filename;

    beforeEach('should open the geoPackage', async function () {
      var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'styled.gpkg');

      let result = await copyAndOpenGeopackage(originalFilename);
      filename = result.path;
      geoPackage = result.geoPackage;
      featureDao = geoPackage.getFeatureDao('Drawing Layer 1');
    });

    afterEach('should close the geoPackage', async function () {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    });

    it('should get the x: 153631, y: 91343, z: 18 tile', function (done) {
      this.timeout(30000);
      var ft = new FeatureTiles(geoPackage, featureDao);
      ft.drawTile(153631, 91343, 18).then((image) => {
        testSetup.diffImages(
          image,
          path.join(__dirname, '..', '..', '..', 'fixtures', 'featuretiles', isWeb ? 'web' : '', '153631_91343_18.png'),
          function (err, equal) {
            try {
              equal.should.be.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          },
        );
      });
    });

    it('should get the x: 153632, y: 91342, z: 18 tile', function (done) {
      this.timeout(30000);
      var ft = new FeatureTiles(geoPackage, featureDao);
      ft.drawTile(153632, 91342, 18).then(function (image) {
        testSetup.diffImages(
          image,
          path.join(__dirname, '..', '..', '..', 'fixtures', 'featuretiles', isWeb ? 'web' : '', '153632_91342_18.png'),
          function (err, equal) {
            try {
              equal.should.be.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          },
        );
      });
    });

    it('should get the x: 153632, y: 91343, z: 18 tile', function (done) {
      this.timeout(30000);
      var ft = new FeatureTiles(geoPackage, featureDao);
      ft.drawTile(153632, 91343, 18).then(function (image) {
        testSetup.diffImages(
          image,
          path.join(__dirname, '..', '..', '..', 'fixtures', 'featuretiles', isWeb ? 'web' : '', '153632_91343_18.png'),
          function (err, equal) {
            try {
              equal.should.be.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          },
        );
      });
    });

    it('should get the x: 153633, y: 91342, z: 18 tile', function (done) {
      this.timeout(30000);
      var ft = new FeatureTiles(geoPackage, featureDao);
      ft.drawTile(153633, 91342, 18).then(function (image) {
        testSetup.diffImages(
          image,
          path.join(__dirname, '..', '..', '..', 'fixtures', 'featuretiles', isWeb ? 'web' : '', '153633_91342_18.png'),
          function (err, equal) {
            try {
              equal.should.be.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          },
        );
      });
    });

    it('should get the x: 153633, y: 91343, z: 18 tile', function (done) {
      this.timeout(30000);
      var ft = new FeatureTiles(geoPackage, featureDao);
      ft.drawTile(153633, 91343, 18).then(function (image) {
        testSetup.diffImages(
          image,
          path.join(__dirname, '..', '..', '..', 'fixtures', 'featuretiles', isWeb ? 'web' : '', '153633_91343_18.png'),
          function (err, equal) {
            try {
              equal.should.be.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          },
        );
      });
    });

    it('should get the x: 153631, y: 91343, z: 18 tile from the GeoPackage api', function (done) {
      this.timeout(30000);
      console.time('Generating non indexed tiles');
      geoPackage.getFeatureTileFromXYZ('Drawing Layer 1', 153631, 91343, 18, 256, 256).then(function (data) {
        should.exist(data);
        console.timeEnd('Generating non indexed tiles');
        testSetup.diffImages(
          data,
          path.join(__dirname, '..', '..', '..', 'fixtures', 'featuretiles', isWeb ? 'web' : '', '153631_91343_18.png'),
          function (err, equal) {
            try {
              equal.should.be.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          },
        );
      });
    });

    it('should get the x: 153632, y: 91342, z: 18 tile from the GeoPackage api', function (done) {
      this.timeout(30000);
      console.time('Generating non indexed tiles');
      geoPackage.getFeatureTileFromXYZ('Drawing Layer 1', 153632, 91342, 18, 256, 256).then(function (data) {
        should.exist(data);
        console.timeEnd('Generating non indexed tiles');
        testSetup.diffImages(
          data,
          path.join(__dirname, '..', '..', '..', 'fixtures', 'featuretiles', isWeb ? 'web' : '', '153632_91342_18.png'),
          function (err, equal) {
            try {
              equal.should.be.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          },
        );
      });
    });

    it('should get the x: 153632, y: 91343, z: 18 tile from the GeoPackage api', function (done) {
      this.timeout(30000);
      console.time('Generating non indexed tiles');
      geoPackage.getFeatureTileFromXYZ('Drawing Layer 1', 153632, 91343, 18, 256, 256).then(function (data) {
        should.exist(data);
        console.timeEnd('Generating non indexed tiles');
        testSetup.diffImages(
          data,
          path.join(__dirname, '..', '..', '..', 'fixtures', 'featuretiles', isWeb ? 'web' : '', '153632_91343_18.png'),
          function (err, equal) {
            try {
              equal.should.be.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          },
        );
      });
    });

    it('should get the x: 153633, y: 91342, z: 18 tile from the GeoPackage api', function (done) {
      this.timeout(30000);
      console.time('Generating non indexed tiles');
      geoPackage.getFeatureTileFromXYZ('Drawing Layer 1', 153633, 91342, 18, 256, 256).then(function (data) {
        should.exist(data);
        console.timeEnd('Generating non indexed tiles');
        testSetup.diffImages(
          data,
          path.join(__dirname, '..', '..', '..', 'fixtures', 'featuretiles', isWeb ? 'web' : '', '153633_91342_18.png'),
          function (err, equal) {
            try {
              equal.should.be.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          },
        );
      });
    });

    it('should get the x: 153633, y: 91343, z: 18 tile from the GeoPackage api', function (done) {
      this.timeout(30000);
      console.time('Generating non indexed tiles');
      geoPackage.getFeatureTileFromXYZ('Drawing Layer 1', 153633, 91343, 18, 256, 256).then(function (data) {
        should.exist(data);
        console.timeEnd('Generating non indexed tiles');
        testSetup.diffImages(
          data,
          path.join(__dirname, '..', '..', '..', 'fixtures', 'featuretiles', isWeb ? 'web' : '', '153633_91343_18.png'),
          function (err, equal) {
            try {
              equal.should.be.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          },
        );
      });
    });

    it('should get the x: 153632, y: 91343, z: 18 tile with a point icon set', function (done) {
      this.timeout(30000);
      var ft = new FeatureTiles(geoPackage, featureDao);
      ImageUtils.getImage(path.join(__dirname, '..', '..', '..', 'fixtures', 'marker-icon.png')).then((icon) => {
        var ftpi = new FeatureTilePointIcon(icon);
        ftpi.setWidth(ftpi.getWidth());
        ftpi.setHeight(ftpi.getHeight());
        ftpi.setXOffset(0);
        ftpi.setYOffset(0);
        ftpi.pinIconCenter();
        ft.pointIcon = ftpi;
        ft.calculateDrawOverlap();
        ft.drawTile(153632, 91343, 18).then(function (image) {
          Canvas.disposeImage(icon);
          testSetup.diffImages(
            image,
            path.join(
              __dirname,
              '..',
              '..',
              '..',
              'fixtures',
              'featuretiles',
              isWeb ? 'web' : '',
              '153632_91343_18_styled_with_icon.png',
            ),
            function (err, equal) {
              try {
                equal.should.be.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            },
          );
        });
      });
    });
  });

  describe('Max Features Indexed', function () {
    var geoPackage;
    var featureDao;
    var filename;

    beforeEach('should open the geoPackage', async function () {
      var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'rivers_indexed.gpkg');

      let result = await copyAndOpenGeopackage(originalFilename);
      filename = result.path;
      geoPackage = result.geoPackage;
      featureDao = geoPackage.getFeatureDao('rivers');
    });

    afterEach('should close the geoPackage', async function () {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    });

    it('should get the number features tile with the correct number of features listed', function (done) {
      this.timeout(30000);
      var ft = new FeatureTiles(geoPackage, featureDao);
      ft.maxFeaturesPerTile = 1;
      ft.maxFeaturesTileDraw = new NumberFeaturesTile();
      ft.drawTile(0, 0, 0).then(function (image) {
        testSetup.diffImages(
          image,
          path.join(
            __dirname,
            '..',
            '..',
            '..',
            'fixtures',
            'featuretiles',
            isWeb ? 'web' : '',
            'max_feature_tile_indexed.png',
          ),
          function (err, equal) {
            try {
              equal.should.be.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          },
        );
      });
    });
  });

  describe('Styled With Icon GeoPackage tests', function () {
    var geoPackage;
    var featureDao;
    var filename;

    beforeEach('should open the geoPackage', async function () {
      var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'styled_with_icon.gpkg');

      let result = await copyAndOpenGeopackage(originalFilename);
      filename = result.path;
      geoPackage = result.geoPackage;
      featureDao = geoPackage.getFeatureDao('Drawing Layer 1');
    });

    afterEach('should close the geoPackage', async function () {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    });

    it('should get the x: 153632, y: 91343, z: 18 tile', function (done) {
      this.timeout(30000);
      var ft = new FeatureTiles(geoPackage, featureDao);
      ft.drawTile(153632, 91343, 18).then(function (image) {
        testSetup.diffImages(
          image,
          path.join(
            __dirname,
            '..',
            '..',
            '..',
            'fixtures',
            'featuretiles',
            isWeb ? 'web' : '',
            '153632_91343_18_styled_with_icon.png',
          ),
          function (err, equal) {
            try {
              equal.should.be.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          },
        );
      });
    });

    it('should get the x: 153632, y: 91343, z: 18 tile from the GeoPackage api', function (done) {
      this.timeout(30000);
      console.time('Generating non indexed tiles');
      geoPackage.getFeatureTileFromXYZ('Drawing Layer 1', 153632, 91343, 18, 256, 256).then(function (data) {
        should.exist(data);
        console.timeEnd('Generating non indexed tiles');
        testSetup.diffImages(
          data,
          path.join(
            __dirname,
            '..',
            '..',
            '..',
            'fixtures',
            'featuretiles',
            isWeb ? 'web' : '',
            '153632_91343_18_styled_with_icon.png',
          ),
          function (err, equal) {
            try {
              equal.should.be.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          },
        );
      });
    });
  });

  describe('FeatureTile tests', function () {
    var geoPackage;
    var featureDao;
    var filename;

    beforeEach('should open the geoPackage', async function () {
      var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'styled_scaled.gpkg');

      let result = await copyAndOpenGeopackage(originalFilename);
      filename = result.path;
      geoPackage = result.geoPackage;
      featureDao = geoPackage.getFeatureDao('Drawing Layer 1');
    });

    afterEach('should close the geoPackage', async function () {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    });

    it('should get the x: 153632, y: 91343, z: 18 tile and scale the styles', function (done) {
      this.timeout(30000);
      var ft = new FeatureTiles(geoPackage, featureDao);
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
      ft.drawTile(153632, 91343, 18).then(function (image) {
        testSetup.diffImages(
          image,
          path.join(
            __dirname,
            '..',
            '..',
            '..',
            'fixtures',
            'featuretiles',
            isWeb ? 'web' : '',
            '153632_91343_18_scaled.png',
          ),
          function (err, equal) {
            try {
              equal.should.be.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          },
        );
      });
    });

    it('should get the x: 153632, y: 91343, z: 18 tile without styling', function (done) {
      this.timeout(30000);
      var ft = new FeatureTiles(geoPackage, featureDao);
      ft.ignoreFeatureTableStyles();
      ft.clearCache();
      ft.stylePaintCacheSize = 100;
      ft.iconCacheSize = 100;
      ft.compressFormat = 'jpeg';
      ft.compressFormat.should.be.equal('jpeg');
      ft.compressFormat = 'png';
      ft.drawOverlap = 0;
      ft.calculateDrawOverlap();
      ft.drawTile(153632, 91343, 18).then(function (image) {
        testSetup.diffImages(
          image,
          path.join(
            __dirname,
            '..',
            '..',
            '..',
            'fixtures',
            'featuretiles',
            isWeb ? 'web' : '',
            '153632_91343_18_styles_ignored.png',
          ),
          function (err, equal) {
            try {
              equal.should.be.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          },
        );
      });
    });

    it('should get the x: 153632, y: 91343, z: 18 tile with modified default styling', function (done) {
      this.timeout(30000);
      var ft = new FeatureTiles(geoPackage, featureDao);
      ft.ignoreFeatureTableStyles();
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
      ft.getPolygonFillColor().should.be.equal('#00FF00FF');
      ft.setPolygonStrokeWidth(5);
      ft.getPolygonStrokeWidth().should.be.equal(5);

      ft.drawTile(153632, 91343, 18).then(function (image) {
        testSetup.diffImages(
          image,
          path.join(
            __dirname,
            '..',
            '..',
            '..',
            'fixtures',
            'featuretiles',
            isWeb ? 'web' : '',
            '153632_91343_18_default_style_modified.png',
          ),
          function (err, equal) {
            try {
              equal.should.be.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          },
        );
      });
    });

    it('should get the max feature number tile and test various functions', function (done) {
      this.timeout(30000);
      var ft = new FeatureTiles(geoPackage, featureDao);
      ft.maxFeaturesPerTile = 1;
      ft.maxFeaturesPerTile.should.be.equal(1);
      should.not.exist(ft.maxFeaturesTileDraw);
      var numberFeaturesTile = new NumberFeaturesTile();
      numberFeaturesTile.getCircleColor().should.be.equal('rgba(0, 0, 0, 0.25)');
      numberFeaturesTile.setCircleColor('rgba(0, 0, 0, 0.50)');
      numberFeaturesTile.getCircleColor().should.be.equal('rgba(0, 0, 0, 0.50)');
      numberFeaturesTile.setCircleColor('rgba(0, 0, 0, 0.25)');

      numberFeaturesTile.getCircleFillColor().should.be.equal('rgba(0, 0, 0, 1.0)');
      numberFeaturesTile.setCircleFillColor('rgba(0, 0, 0, 0.50)');
      numberFeaturesTile.getCircleFillColor().should.be.equal('rgba(0, 0, 0, 0.50)');
      numberFeaturesTile.setCircleFillColor('rgba(0, 0, 0, 1.0)');

      numberFeaturesTile.getTextSize().should.be.equal(18);
      numberFeaturesTile.setTextSize(12);
      numberFeaturesTile.getTextSize().should.be.equal(12);
      numberFeaturesTile.setTextSize(18);

      numberFeaturesTile.getTextColor().should.be.equal('rgba(255, 255, 255, 1.0)');
      numberFeaturesTile.setTextColor('rgba(0, 0, 0, 0.50)');
      numberFeaturesTile.getTextColor().should.be.equal('rgba(0, 0, 0, 0.50)');
      numberFeaturesTile.setTextColor('rgba(255, 255, 255, 1.0)');

      numberFeaturesTile.getCircleStrokeWidth().should.be.equal(3);
      numberFeaturesTile.setCircleStrokeWidth(12);
      numberFeaturesTile.getCircleStrokeWidth().should.be.equal(12);
      numberFeaturesTile.setCircleStrokeWidth(3);

      numberFeaturesTile.getCirclePaddingPercentage().should.be.equal(0.25);
      numberFeaturesTile.setCirclePaddingPercentage(0.5);
      numberFeaturesTile.getCirclePaddingPercentage().should.be.equal(0.5);
      (function () {
        numberFeaturesTile.setCirclePaddingPercentage(2);
      }).should.throw('Circle padding percentage must be between 0.0 and 1.0: ' + 2);
      numberFeaturesTile.setCirclePaddingPercentage(0.25);

      numberFeaturesTile.getTileBorderStrokeWidth().should.be.equal(2);
      numberFeaturesTile.setTileBorderStrokeWidth(12);
      numberFeaturesTile.getTileBorderStrokeWidth().should.be.equal(12);
      numberFeaturesTile.setTileBorderStrokeWidth(2);

      numberFeaturesTile.getTileBorderColor().should.be.equal('rgba(0, 0, 0, 1.0)');
      numberFeaturesTile.setTileBorderColor('rgba(0, 0, 0, 0.50)');
      numberFeaturesTile.getTileBorderColor().should.be.equal('rgba(0, 0, 0, 0.50)');
      numberFeaturesTile.setTileBorderColor('rgba(0, 0, 0, 1.0)');

      numberFeaturesTile.getTileFillColor().should.be.equal('rgba(0, 0, 0, 0.0625)');
      numberFeaturesTile.setTileFillColor('rgba(0, 0, 0, 0.50)');
      numberFeaturesTile.getTileFillColor().should.be.equal('rgba(0, 0, 0, 0.50)');
      numberFeaturesTile.setTileFillColor('rgba(0, 0, 0, 0.0625)');

      numberFeaturesTile.isDrawUnindexedTiles().should.be.equal(true);
      numberFeaturesTile.setDrawUnindexedTiles(false);
      numberFeaturesTile.isDrawUnindexedTiles().should.be.equal(false);
      numberFeaturesTile.setDrawUnindexedTiles(true);

      ft.maxFeaturesTileDraw = numberFeaturesTile;
      should.exist(ft.maxFeaturesTileDraw);

      ft.drawTile(153632, 91343, 18).then(function (image) {
        testSetup.diffImages(
          image,
          path.join(
            __dirname,
            '..',
            '..',
            '..',
            'fixtures',
            'featuretiles',
            isWeb ? 'web' : '',
            isLinux ? 'max_feature_tile_unindexed_linux.png' : 'max_feature_tile_unindexed.png',
          ),
          function (err, equal) {
            try {
              equal.should.be.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          },
        );
      });
    });
  });

  describe('Styled GeometryCollection GeoPackage tests', function () {
    var geoPackage;
    var featureDao;
    var filename;

    beforeEach('should open the geoPackage', async function () {
      var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'geometrycollection.gpkg');

      let result = await copyAndOpenGeopackage(originalFilename);
      filename = result.path;
      geoPackage = result.geoPackage;
      featureDao = geoPackage.getFeatureDao('test');
    });

    afterEach('should close the geoPackage', async function () {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    });

    it('should get the x: 0, y: 0, z: 0 tile for geometry collection', function (done) {
      this.timeout(30000);
      var ft = new FeatureTiles(geoPackage, featureDao);
      ft.drawTile(0, 0, 0).then(function (image) {
        testSetup.diffImages(
          image,
          path.join(
            __dirname,
            '..',
            '..',
            '..',
            'fixtures',
            'featuretiles',
            isWeb ? 'web' : '',
            'geometrycollection_0_0_0.png',
          ),
          function (err, equal) {
            try {
              equal.should.be.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          },
        );
      });
    });
  });

  describe('Polygon with holes test', function () {
    var geoPackage;
    var featureDao;
    var filename;

    beforeEach('should open the geoPackage', async function () {
      var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'multi.gpkg');

      let result = await copyAndOpenGeopackage(originalFilename);
      filename = result.path;
      geoPackage = result.geoPackage;
      featureDao = geoPackage.getFeatureDao('multi');
    });

    afterEach('should close the geoPackage', async function () {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    });

    it('should get the x: 1, y: 2, z: 2 tile', function (done) {
      this.timeout(30000);
      var ft = new FeatureTiles(geoPackage, featureDao);
      ft.drawTile(1, 2, 2).then((image) => {
        testSetup.diffImages(
          image,
          path.join(__dirname, '..', '..', '..', 'fixtures', 'featuretiles', isWeb ? 'web' : '', '1_2_2.png'),
          function (err, equal) {
            try {
              equal.should.be.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          },
        );
      });
    });
  });
  describe('MultiPolygon with multiple holes test', function () {
    var geoPackage;
    var featureDao;
    var filename;

    beforeEach('should open the geoPackage', async function () {
      var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'multipleholes.gpkg');

      let result = await copyAndOpenGeopackage(originalFilename);
      filename = result.path;
      geoPackage = result.geoPackage;
      featureDao = geoPackage.getFeatureDao('multipolywithholes');
    });

    afterEach('should close the geoPackage', async function () {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    });

    it('should get the x: 18, y: 24, z: 6 tile', function (done) {
      this.timeout(30000);
      var ft = new FeatureTiles(geoPackage, featureDao);
      ft.drawTile(18, 24, 6).then(function (image) {
        testSetup.diffImages(
          image,
          path.join(__dirname, '..', '..', '..', 'fixtures', 'featuretiles', isWeb ? 'web' : '', '18_24_6.png'),
          function (err, equal) {
            try {
              equal.should.be.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          },
        );
      });
    });
  });
});

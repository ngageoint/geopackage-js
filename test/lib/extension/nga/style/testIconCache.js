import { default as testSetup } from '../../../../testSetup';
import { GeometryType } from '@ngageoint/simple-features-js';
import { FeatureColumn } from '../../../../../lib/features/user/featureColumn';
import { GeoPackageDataType } from '../../../../../lib/db/geoPackageDataType';

var FeatureTableStyles = require('../../../../../lib/extension/nga/style/featureTableStyles').FeatureTableStyles,
  IconCache = require('../../../../../lib/extension/nga/style/iconCache').IconCache,
  should = require('chai').should(),
  path = require('path'),
  ImageUtils = require('../../../../../lib/image/imageUtils').ImageUtils,
  Canvas = require('../../../../../lib/canvas/canvas').Canvas;

var isWeb = !(typeof process !== 'undefined' && process.version);

describe('IconCache Tests', function () {
  var testGeoPackage;
  var geoPackage;
  var featureTableName = 'feature_table';

  var featureTableStyles;
  var iconImage;
  var iconImageBuffer;

  var randomIcon = function (featureTableStyles, noWidth = false, noHeight = false, noAnchors = false) {
    var iconRow = featureTableStyles.getIconDao().newRow();
    iconRow.setData(iconImageBuffer);
    iconRow.setContentType('image/png');
    iconRow.setName('Icon Name');
    iconRow.setDescription('Icon Description');
    if (!noWidth) {
      iconRow.setWidth(iconImage.getWidth());
    }
    if (!noHeight) {
      iconRow.setHeight(iconImage.getHeight());
    }
    if (!noAnchors) {
      iconRow.setAnchorU(0.5);
      iconRow.setAnchorV(1.0);
    }
    return iconRow;
  };

  var compareImages = function (actualImage, expectedImage) {
    return new Promise(function (resolve) {
      var actualCanvas, actualCtx, expectedCanvas, expectedCtx;
      actualCanvas = Canvas.create(actualImage.getWidth(), actualImage.getHeight());
      actualCtx = actualCanvas.getContext('2d');
      expectedCanvas = Canvas.create(expectedImage.getWidth(), expectedImage.getHeight());
      expectedCtx = expectedCanvas.getContext('2d');
      actualCtx.drawImage(actualImage.getImage(), 0, 0);
      expectedCtx.drawImage(expectedImage.getImage(), 0, 0);

      const result = actualCanvas.toDataURL('image/png') === expectedCanvas.toDataURL('image/png');
      if (!result) {
        console.log('actual: ' + actualCanvas.toDataURL('image/png'));
        console.log('expected: ' + expectedCanvas.toDataURL('image/png'));
      }
      Canvas.disposeCanvas(actualCanvas);
      Canvas.disposeCanvas(expectedCanvas);
      Canvas.disposeImage(actualImage);
      Canvas.disposeImage(expectedImage);
      resolve(result);
    });
  };

  beforeEach(async function () {
    let created = await testSetup.createTmpGeoPackage();
    testGeoPackage = created.path;
    geoPackage = created.geoPackage;
  });

  beforeEach('create the GeoPackage connection and setup the FeatureStyleExtension', async function () {
    // create a feature table first
    testSetup.buildFeatureTable(geoPackage, featureTableName, 'geom', GeometryType.GEOMETRY, [
      FeatureColumn.createColumn('name', GeoPackageDataType.TEXT, false, ''),
      FeatureColumn.createColumn('_feature_id', GeoPackageDataType.TEXT, false, ''),
      FeatureColumn.createColumn('_properties_id', GeoPackageDataType.TEXT, false, ''),
    ]);

    featureTableStyles = new FeatureTableStyles(geoPackage, featureTableName);
    featureTableStyles.getFeatureStyleExtension().getOrCreateExtension(featureTableName);
    featureTableStyles.getFeatureStyleExtension().getRelatedTables().getOrCreateExtension();
    featureTableStyles.getFeatureStyleExtension().getContentsId().getOrCreateExtension();
    featureTableStyles.createIconRelationship();
    iconImage = await ImageUtils.getImage(path.join(__dirname, '..', '..', '..', '..', 'fixtures', 'point.png'));

    iconImageBuffer = await loadTile(path.join(__dirname, '..', '..', '..', '..', 'fixtures', 'point.png'));
  });

  afterEach(async function () {
    geoPackage.close();
    Canvas.disposeImage(iconImage);
    await testSetup.deleteGeoPackage(testGeoPackage);
  });

  it('should create icon cache', function () {
    var iconCache = new IconCache();
    iconCache.cacheSize.should.be.equal(IconCache.DEFAULT_CACHE_SIZE);
    var cacheSize = 50;
    iconCache = new IconCache(cacheSize);
    iconCache.cacheSize.should.be.equal(cacheSize);
  });

  it('should test icon cache should return icon for icon row', function () {
    var iconCache = new IconCache();
    var iconRow = randomIcon(featureTableStyles);
    iconRow.setId(0, true);
    should.not.exist(iconCache.getIconForIconRow(iconRow));
    should.not.exist(iconCache.putIconForIconRow(iconRow, iconImage));
    should.exist(iconCache.getIconForIconRow(iconRow));
    should.exist(iconCache.putIconForIconRow(iconRow, iconImage));
    should.exist(iconCache.getIconForIconRow(iconRow));
    should.exist(iconCache.removeIconForIconRow(iconRow));
    should.not.exist(iconCache.removeIconForIconRow(iconRow));
  });

  it('should test icon cache should only store up to the cache size', function () {
    var cacheSize = 3;
    var iconCache = new IconCache(cacheSize);
    // test access history stuff
    for (var i = 0; i < cacheSize * 2; i++) {
      var testRow = randomIcon(featureTableStyles);
      testRow.setId(i + 1, true);
      iconCache.putIconForIconRow(testRow, iconImage);
      Object.keys(iconCache.iconCache).length.should.be.below(cacheSize + 1);
    }
    Object.keys(iconCache.iconCache).length.should.be.equal(cacheSize);
  });

  it('should clear icon cache', function () {
    var cacheSize = 3;
    var iconCache = new IconCache(cacheSize);
    var iconRow = randomIcon(featureTableStyles);
    iconRow.setId(0, true);
    iconCache.putIconForIconRow(iconRow, iconImage);
    Object.keys(iconCache.iconCache).length.should.be.equal(1);
    iconCache.clear();
    Object.keys(iconCache.iconCache).length.should.be.equal(0);
  });

  it('should resize icon cache', function () {
    var cacheSize = 5;
    var iconCache = new IconCache(cacheSize);
    // test access history stuff
    for (var i = 0; i < cacheSize; i++) {
      var testRow = randomIcon(featureTableStyles);
      testRow.setId(i + 1, true);
      iconCache.putIconForIconRow(testRow, iconImage);
      Object.keys(iconCache.iconCache).length.should.be.below(cacheSize + 1);
    }
    var newCacheSize = 3;
    iconCache.resize(newCacheSize);
    Object.keys(iconCache.iconCache).length.should.be.equal(newCacheSize);

    // test resizing to larger number, shouldn't remove any icons from the cache
    iconCache.resize(cacheSize);
    Object.keys(iconCache.iconCache).length.should.be.equal(newCacheSize);
  });

  var mochaAsync = (fn) => {
    return async () => {
      try {
        return fn();
      } catch (err) {
        console.log(err);
      }
    };
  };

  it(
    'should create icon and cache it',
    mochaAsync(async () => {
      var iconCache = new IconCache();
      var iconRow = randomIcon(featureTableStyles);
      iconRow.setId(0, true);
      var image = await iconCache.createIcon(iconRow);
      var result = await compareImages(image, iconImage);
      result.should.be.equal(true);
      should.exist(iconCache.getIconForIconRow(iconRow));
    }),
  );

  it(
    'should create icon but not cache it',
    mochaAsync(async () => {
      var iconCache = new IconCache();
      var iconRow = randomIcon(featureTableStyles);
      iconRow.setId(0, true);
      var image = await iconCache.createIconNoCache(iconRow);
      var result = await compareImages(image, iconImage);
      result.should.be.equal(true);
      should.not.exist(iconCache.getIconForIconRow(iconRow));
    }),
  );

  it(
    'should create scaled icon but not cache it',
    mochaAsync(async () => {
      var iconCache = new IconCache();
      var iconRow = randomIcon(featureTableStyles);
      iconRow.setId(0, true);
      var expectedImage = await ImageUtils.getImage(
        path.join(__dirname, '..', '..', '..', '..', 'fixtures', isWeb ? 'web' : '', 'point_2x.png'),
      );
      var image = await iconCache.createScaledIconNoCache(iconRow, 2.0);
      should.not.exist(iconCache.getIconForIconRow(iconRow));
      var result = await compareImages(image, expectedImage);
      result.should.be.equal(true);
    }),
  );

  it(
    'should create scaled icon and cache it',
    mochaAsync(async () => {
      var iconCache = new IconCache();
      var iconRow = randomIcon(featureTableStyles);
      iconRow.setId(0, true);
      var expectedImage = await ImageUtils.getImage(
        path.join(__dirname, '..', '..', '..', '..', 'fixtures', isWeb ? 'web' : '', 'point_2x.png'),
        'image/png',
      );
      var image = await iconCache.createScaledIcon(iconRow, 2.0);
      var result = await compareImages(image, expectedImage);
      result.should.be.equal(true);
      should.exist(iconCache.getIconForIconRow(iconRow));
    }),
  );

  it(
    'should automatically determine dimensions of an icon with no explicit width/height',
    mochaAsync(async () => {
      var iconCache = new IconCache();
      var iconRow = featureTableStyles.getIconDao().newRow();
      iconRow.setData(iconImageBuffer);
      iconRow.setContentType('image/png');
      iconRow.setName('Icon Name');
      iconRow.setDescription('Icon Description');
      iconRow.setWidth(iconImage.getWidth());

      let image = await iconCache.createScaledIcon(iconRow, 1.0);
      image.getWidth().should.be.equal(iconImage.getWidth());
      image.getHeight().should.be.equal(iconImage.getHeight());

      iconRow.setWidth(undefined);
      image = await iconCache.createScaledIcon(iconRow, 1.0);
      image.getWidth().should.be.equal(iconImage.getWidth());
      image.getHeight().should.be.equal(iconImage.getHeight());
    }),
  );
});

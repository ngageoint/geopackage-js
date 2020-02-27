import { default as testSetup } from '../../../fixtures/testSetup'

var FeatureTableStyles = require('../../../../lib/extension/style/featureTableStyles').FeatureTableStyles
  , IconCache = require('../../../../lib/extension/style/iconCache').IconCache
  // , testSetup = require('../../../fixtures/testSetup')
  , should = require('chai').should()
  , path = require('path')
  , ImageUtils = require('../../../../lib/tiles/imageUtils').ImageUtils
  // , GeoPackageAPI = require('../../../../lib/api')
  // @ts-ignore
  , fs = require('fs-extra');

describe('IconCache Tests', function() {
  var testGeoPackage;
  var geopackage;
  var featureTableName = 'feature_table';
  // @ts-ignore
  var featureTable;
  var featureTableStyles;
  var iconImage;
  var iconImageBuffer;

  var randomIcon = function(featureTableStyles) {
    var iconRow = featureTableStyles.getIconDao().newRow();
    iconRow.setData(iconImageBuffer);
    iconRow.setContentType('image/png');
    iconRow.setName("Icon Name");
    iconRow.setDescription("Icon Description");
    iconRow.setWidth(Math.random() * iconImage.width);
    iconRow.setHeight(Math.random() * iconImage.height);
    iconRow.setAnchorU(Math.random());
    iconRow.setAnchorV(Math.random());
    return iconRow;
  };

  var compareImages = function (imageA, imageB) {
    return new Promise(function(resolve) {
      var actualCanvas, actualCtx, expectedCanvas, expectedCtx;
      if (typeof(process) !== 'undefined' && process.version) {
        var Canvas = require('canvas');
        actualCanvas = Canvas.createCanvas(imageA.width, imageA.height);
        actualCtx = actualCanvas.getContext('2d');
        expectedCanvas = Canvas.createCanvas(imageB.width, imageB.height);
        expectedCtx = expectedCanvas.getContext('2d');
      } else {
        actualCanvas = document.getElementById('canvas');
        // @ts-ignore
        actualCanvas.width = imageA.width;
        // @ts-ignore
        actualCanvas.height = imageA.height;
        // @ts-ignore
        actualCtx = actualCanvas.getContext('2d');
        expectedCanvas = document.getElementById('canvas');
        // @ts-ignore
        expectedCanvas.width = imageB.width;
        // @ts-ignore
        expectedCanvas.height = imageB.height;
        // @ts-ignore
        expectedCtx = expectedCanvas.getContext('2d');
      }
      actualCtx.drawImage(imageA, 0, 0);
      expectedCtx.drawImage(imageB, 0, 0);
      // @ts-ignore
      resolve(actualCanvas.toDataURL() === expectedCanvas.toDataURL());
    });
  }

  beforeEach(async function() {
    let created = await testSetup.createTmpGeoPackage();
    testGeoPackage = created.path;
    geopackage = created.geopackage;
  });

  beforeEach('create the GeoPackage connection and setup the FeatureStyleExtension', async function() {
    // create a feature table first
    featureTable = await geopackage.createFeatureTable(featureTableName)
    await geopackage.featureStyleExtension.getOrCreateExtension(featureTableName)
    await geopackage.featureStyleExtension.getRelatedTables().getOrCreateExtension()
    await geopackage.featureStyleExtension.getContentsId().getOrCreateExtension()
    featureTableStyles = new FeatureTableStyles(geopackage, featureTableName);
    await featureTableStyles.createIconRelationship()
    iconImage = await ImageUtils.getImage(path.join(__dirname, '..', '..', '..', 'fixtures', 'point.png'))
    // @ts-ignore
    iconImageBuffer = await loadTile(path.join(__dirname, '..', '..', '..', 'fixtures', 'point.png'));
  });

  afterEach(async function() {
    geopackage.close();
    await testSetup.deleteGeoPackage(testGeoPackage);
  });

  it('should create icon cache', function() {
    var iconCache = new IconCache();
    iconCache.cacheSize.should.be.equal(IconCache.DEFAULT_CACHE_SIZE);
    var cacheSize = 50;
    iconCache = new IconCache(cacheSize);
    iconCache.cacheSize.should.be.equal(cacheSize);
  });

  it('should test icon cache should return icon for icon row', function() {
    var iconCache = new IconCache();
    var iconRow = randomIcon(featureTableStyles);
    iconRow.setId(0);
    should.not.exist(iconCache.getIconForIconRow(iconRow));
    should.not.exist(iconCache.putIconForIconRow(iconRow, iconImage));
    should.exist(iconCache.getIconForIconRow(iconRow));
    should.exist(iconCache.putIconForIconRow(iconRow, iconImage));
    should.exist(iconCache.getIconForIconRow(iconRow));
    should.exist(iconCache.removeIconForIconRow(iconRow));
    should.not.exist(iconCache.removeIconForIconRow(iconRow));
  });

  it('should test icon cache should only store up to the cache size', function() {
    var cacheSize = 3;
    var iconCache = new IconCache(cacheSize);
    // test access history stuff
    for (var i = 0; i < cacheSize * 2; i++) {
      var testRow = randomIcon(featureTableStyles);
      testRow.setId(i + 1);
      iconCache.putIconForIconRow(testRow, iconImage);
      Object.keys(iconCache.iconCache).length.should.be.below(cacheSize + 1);
    }
    Object.keys(iconCache.iconCache).length.should.be.equal(cacheSize);
  });

  it('should clear icon cache', function() {
    var cacheSize = 3;
    var iconCache = new IconCache(cacheSize);
    var iconRow = randomIcon(featureTableStyles);
    iconRow.setId(0);
    iconCache.putIconForIconRow(iconRow, iconImage);
    Object.keys(iconCache.iconCache).length.should.be.equal(1);
    iconCache.clear();
    Object.keys(iconCache.iconCache).length.should.be.equal(0);
  });

  it('should resize icon cache', function() {
    var cacheSize = 5;
    var iconCache = new IconCache(cacheSize);
    // test access history stuff
    for (var i = 0; i < cacheSize; i++) {
      var testRow = randomIcon(featureTableStyles);
      testRow.setId(i + 1);
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

  it('should create icon and cache it', mochaAsync(async () => {
    var iconCache = new IconCache();
    var iconRow = randomIcon(featureTableStyles);
    iconRow.setId(0);
    var image = await iconCache.createIcon(iconRow);
    var result = await compareImages(image, iconImage);
    result.should.be.equal(true);
    should.exist(iconCache.getIconForIconRow(iconRow));
  }));

  it('should create icon but not cache it', mochaAsync(async () => {
    var iconCache = new IconCache();
    var iconRow = randomIcon(featureTableStyles);
    iconRow.setId(0);
    var image = await iconCache.createIconNoCache(iconRow);
    var result = await compareImages(image, iconImage);
    result.should.be.equal(true);
    should.not.exist(iconCache.getIconForIconRow(iconRow));
  }));

  it('should create scaled icon but not cache it', mochaAsync(async () => {
    var iconCache = new IconCache();
    var iconRow = randomIcon(featureTableStyles);
    iconRow.setId(0);
    var expectedImage = await ImageUtils.getImage(path.join(__dirname, '..', '..', '..', 'fixtures', 'point_2x.png'));
    var image = await iconCache.createScaledIconNoCache(iconRow, 2.0);
    var result = await compareImages(expectedImage, image);
    result.should.be.equal(true);
    should.not.exist(iconCache.getIconForIconRow(iconRow));
  }));

  it('should create scaled icon and cache it', mochaAsync(async () => {
    var iconCache = new IconCache();
    var iconRow = randomIcon(featureTableStyles);
    iconRow.setId(0);
    var expectedImage = await ImageUtils.getImage(path.join(__dirname, '..', '..', '..', 'fixtures', 'point_2x.png'));
    var image = await iconCache.createScaledIcon(iconRow, 2.0);
    var result = await compareImages(expectedImage, image);
    result.should.be.equal(true);
    should.exist(iconCache.getIconForIconRow(iconRow));
  }));

  it('should create scaled icon and cache it even when already cached', mochaAsync(async () => {
    var iconCache = new IconCache();
    var iconRow = randomIcon(featureTableStyles);
    iconRow.setId(0);
    iconCache.putIconForIconRow(iconRow, iconImage);
    var expectedImage = await ImageUtils.getImage(path.join(__dirname, '..', '..', '..', 'fixtures', 'point_2x.png'));
    var image = await iconCache.createScaledIcon(iconRow, 2.0);
    var result = await compareImages(expectedImage, image);
    result.should.be.equal(true);
    should.exist(iconCache.getIconForIconRow(iconRow));
  }));
});

var FeatureTableStyles = require('../../../../lib/extension/style/featureTableStyles')
  , IconCache = require('../../../../lib/extension/style/iconCache')
  , testSetup = require('../../../fixtures/testSetup')
  , should = require('chai').should()
  , path = require('path')
  , PureImage = require('pureimage')
  , GeoPackageAPI = require('../../../../lib/api')
  , fs = require('fs');

describe('IconCache Tests', function() {
  var testGeoPackage;
  var geopackage;
  var testPath = path.join(__dirname, '..', 'tmp');
  var featureTableName = 'feature_table';
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

  beforeEach('create the GeoPackage connection and setup the FeatureStyleExtension', function(done) {
    testGeoPackage = path.join(testPath, testSetup.createTempName());
    testSetup.createGeoPackage(testGeoPackage, function(err, gp) {
      geopackage = gp;
      // create a feature table first
      GeoPackageAPI.createFeatureTableWithProperties(geopackage, featureTableName, []).then(function(table) {
        featureTable = table;
        geopackage.getFeatureStyleExtension().getOrCreateExtension(featureTableName).then(function() {
          geopackage.getFeatureStyleExtension().getRelatedTables().getOrCreateExtension().then(function () {
            geopackage.getFeatureStyleExtension().getContentsId().getOrCreateExtension().then(function () {
              featureTableStyles = new FeatureTableStyles(geopackage, featureTableName);
              featureTableStyles.createIconRelationship().then(function () {
                PureImage.decodePNGFromStream(fs.createReadStream(path.join(__dirname, '..', '..', '..', 'fixtures', 'point.png'))).then(function(expectedImage) {
                  iconImage = expectedImage;
                  testSetup.loadTile(path.join(__dirname, '..', '..', '..', 'fixtures', 'point.png'), function(err, buffer) {
                    iconImageBuffer = buffer;
                    done();
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  afterEach(function(done) {
    geopackage.close();
    testSetup.deleteGeoPackage(testGeoPackage, done);
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
    var bitmap = await iconCache.createIcon(iconRow);
    bitmap.width.should.be.equal(iconImage.width);
    bitmap.height.should.be.equal(iconImage.height);
    for (var i = 0; i < bitmap.width; i++) {
      for (var j = 0; j < bitmap.height; j++) {
        bitmap.getPixelRGBA(i, j).should.be.equal(iconImage.getPixelRGBA(i, j));
      }
    }
    should.exist(iconCache.getIconForIconRow(iconRow));
  }));

  it('should create icon but not cache it', mochaAsync(async () => {
    var iconCache = new IconCache();
    var iconRow = randomIcon(featureTableStyles);
    iconRow.setId(0);
    var bitmap = await iconCache.createIconNoCache(iconRow);
    bitmap.width.should.be.equal(iconImage.width);
    bitmap.height.should.be.equal(iconImage.height);
    for (var i = 0; i < bitmap.width; i++) {
      for (var j = 0; j < bitmap.height; j++) {
        bitmap.getPixelRGBA(i, j).should.be.equal(iconImage.getPixelRGBA(i, j));
      }
    }
    should.not.exist(iconCache.getIconForIconRow(iconRow));
  }));

  it('should create scaled icon but not cache it', mochaAsync(async () => {
    var iconCache = new IconCache();
    var iconRow = randomIcon(featureTableStyles);
    iconRow.setId(0);
    var expectedBitmap = await PureImage.decodePNGFromStream(fs.createReadStream(path.join(__dirname, '..', '..', '..', 'fixtures', 'point_2x.png')));
    var bitmap = await iconCache.createScaledIconNoCache(iconRow, 2.0);
    bitmap.width.should.be.equal(expectedBitmap.width);
    bitmap.height.should.be.equal(expectedBitmap.height);

    for (var i = 0; i < bitmap.width; i++) {
      for (var j = 0; j < bitmap.height; j++) {
        bitmap.getPixelRGBA(i, j).should.be.equal(expectedBitmap.getPixelRGBA(i, j));
      }
    }
    should.not.exist(iconCache.getIconForIconRow(iconRow));
  }));

  it('should create scaled icon and cache it', mochaAsync(async () => {
    var iconCache = new IconCache();
    var iconRow = randomIcon(featureTableStyles);
    iconRow.setId(0);
    var expectedBitmap = await PureImage.decodePNGFromStream(fs.createReadStream(path.join(__dirname, '..', '..', '..', 'fixtures', 'point_2x.png')));
    var bitmap = await iconCache.createScaledIcon(iconRow, 2.0);
    bitmap.width.should.be.equal(expectedBitmap.width);
    bitmap.height.should.be.equal(expectedBitmap.height);

    for (var i = 0; i < bitmap.width; i++) {
      for (var j = 0; j < bitmap.height; j++) {
        bitmap.getPixelRGBA(i, j).should.be.equal(expectedBitmap.getPixelRGBA(i, j));
      }
    }
    should.exist(iconCache.getIconForIconRow(iconRow));
  }));



  it('should create scaled icon and cache it even when already cached', mochaAsync(async () => {
    var iconCache = new IconCache();
    var iconRow = randomIcon(featureTableStyles);
    iconRow.setId(0);
    iconCache.putIconForIconRow(iconRow, iconImage);
    var expectedBitmap = await PureImage.decodePNGFromStream(fs.createReadStream(path.join(__dirname, '..', '..', '..', 'fixtures', 'point_2x.png')));
    var bitmap = await iconCache.createScaledIcon(iconRow, 2.0);
    bitmap.width.should.be.equal(expectedBitmap.width);
    bitmap.height.should.be.equal(expectedBitmap.height);

    for (var i = 0; i < bitmap.width; i++) {
      for (var j = 0; j < bitmap.height; j++) {
        bitmap.getPixelRGBA(i, j).should.be.equal(expectedBitmap.getPixelRGBA(i, j));
      }
    }
    should.exist(iconCache.getIconForIconRow(iconRow));
  }));
});

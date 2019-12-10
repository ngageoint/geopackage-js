import { default as GeoPackageAPI } from '../../../..'
import { default as testSetup } from '../../../fixtures/testSetup'
import FeatureStyleExtension from '../../../../lib/extension/style'

var FeatureTableStyles = require('../../../../lib/extension/style/featureTableStyles')
  , StyleMappingTable = require('../../../../lib/extension/style/styleMappingTable').default
  , StyleTable = require('../../../../lib/extension/style/styleTable').default
  , Styles = require('../../../../lib/extension/style/styles')
  , Icons = require('../../../../lib/extension/style/icons')
  , FeatureStyles = require('../../../../lib/extension/style/featureStyles')
  , FeatureStyle = require('../../../../lib/extension/style/featureStyle')
  , IconTable = require('../../../../lib/extension/style/iconTable').default
  , ContentsIdDao = require('../../../../lib/extension/contents/contentsIdDao').default
  // , testSetup = require('../../../fixtures/testSetup')
  , ImageUtils = require('../../../../lib/tiles/imageUtils').ImageUtils
  , should = require('chai').should()
  , assert = require('assert')
  , path = require('path')
  // , GeoPackageAPI = require('../../../../lib/api')
  , wkx = require('wkx')
  , fs = require('fs')
  , GeometryData = require('../../../../lib/geom/geometryData').GeometryData;

describe('StyleExtension Tests', function() {
  var testGeoPackage;
  var geopackage;
  var testPath = path.join(__dirname, '..', 'tmp');
  var featureTableName = 'feature_table';
  var featureTable;
  var featureTableStyles;
  var featureRowId;
  var iconImage;
  var iconImageBuffer;

  var mochaAsync = (fn) => {
    return async () => {
      try {
        return fn();
      } catch (err) {
        console.log(err);
      }
    };
  };

  var createRow = function(geoJson, name, featureDao) {
    var srs = featureDao.getSrs();
    var featureRow = featureDao.newRow();
    var geometryData = new GeometryData();
    geometryData.setSrsId(srs.srs_id);
    var geometry = wkx.Geometry.parseGeoJSON(geoJson);
    geometryData.setGeometry(geometry);
    featureRow.setGeometry(geometryData);
    featureRow.setValueWithColumnName('name', name);
    featureRow.setValueWithColumnName('_feature_id', name);
    featureRow.setValueWithColumnName('_properties_id', 'properties' + name);
    return featureDao.create(featureRow);
  };

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

  var randomStyle = function(featureTableStyles) {
    var styleRow = featureTableStyles.getStyleDao().createObject();
    styleRow.setName("Style Name");
    styleRow.setDescription("Style Description");
    styleRow.setColor(randomColor(), 1.0);
    styleRow.setFillColor(randomColor(), 1.0);
    styleRow.setWidth(1.0 + (Math.random() * 3));
    return styleRow;
  };

  var randomColor = function() {
    var length = 6;
    var chars = '0123456789ABCDEF';
    var hex = '#';
    while(length--) hex += chars[(Math.random() * 16) | 0];
    return hex;
  };

  beforeEach('create the GeoPackage connection and setup the FeatureStyleExtension', function(done) {
    testGeoPackage = path.join(testPath, testSetup.createTempName());
    testSetup.createGeoPackage(testGeoPackage, function(err, gp) {
      geopackage = gp;
      // create a feature table first
      GeoPackageAPI.createFeatureTableWithProperties(geopackage, featureTableName, []).then(function(table) {
        featureTable = table;
        var box = {
          "type": "Polygon",
          "coordinates": [[[-1, 1], [1, 1], [1, 3], [-1, 3], [-1, 1]]]
        };
        featureRowId = createRow(box, 'box', geopackage.getFeatureDao(featureTableName));
        geopackage.getFeatureStyleExtension().getOrCreateExtension(featureTableName).then(function() {
          geopackage.getFeatureStyleExtension().getRelatedTables().getOrCreateExtension().then(function () {
            geopackage.getFeatureStyleExtension().getContentsId().getOrCreateExtension().then(function () {
              featureTableStyles = new FeatureTableStyles(geopackage, featureTableName);
              ImageUtils.getImage(path.join(__dirname, '..', '..', '..', 'fixtures', 'point.png')).then(function (expectedImage) {
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

  afterEach(function(done) {
    geopackage.close();
    testSetup.deleteGeoPackage(testGeoPackage, done);
  });

  it('should create extension for feature table', function() {
    var extensions = geopackage.getExtensionDao().queryByExtensionAndTableName(FeatureStyleExtension.EXTENSION_NAME, featureTableName);
    should.exist(extensions.length);
    if (extensions.length) {
      extensions.length.should.be.equal(1);
    }
  });

  it('should check if geopackage has extension or not', function() {
    geopackage.getFeatureStyleExtension().has(featureTableName).should.be.equal(true);
    geopackage.getFeatureStyleExtension().has('not_valid_feature_table').should.be.equal(false);
    featureTableStyles.has().should.be.equal(true);
  });

  it('should return all feature tables with style extension', function() {
    geopackage.getFeatureStyleExtension().getTables().length.should.be.equal(1);
  });

  it('should get related tables extension', function() {
    geopackage.getFeatureStyleExtension().getRelatedTables().should.be.equal(geopackage.getRelatedTablesExtension());
  });

  it('should get content id extension', function() {
    geopackage.getFeatureStyleExtension().getContentsId().should.be.equal(geopackage.getContentsIdExtension());
  });

  it('should create relationships', function() {
    return featureTableStyles.createRelationships().then(function () {
      featureTableStyles.hasStyleRelationship().should.be.equal(true);
      featureTableStyles.hasTableStyleRelationship().should.be.equal(true);
      featureTableStyles.hasIconRelationship().should.be.equal(true);
      featureTableStyles.hasTableIconRelationship().should.be.equal(true);
      featureTableStyles.hasRelationship().should.be.equal(true);
      featureTableStyles.deleteRelationships();
      featureTableStyles.hasRelationship().should.be.equal(false);
    });
  });

  it('should get table name', function() {
    featureTableStyles.getTableName().should.be.equal(featureTableName);
  });

  it('should delete all relationships', function() {
    return featureTableStyles.createRelationships().then(function () {
      featureTableStyles.deleteRelationships();
      featureTableStyles.hasRelationship().should.be.equal(false);
    });
  });

  it('should create and delete style relationship', function() {
    return featureTableStyles.createStyleRelationship().then(function () {
      featureTableStyles.hasStyleRelationship().should.be.equal(true);
      featureTableStyles.deleteStyleRelationship();
      featureTableStyles.hasStyleRelationship().should.be.equal(false);
    });
  });

  it('should create and delete table style relationship', function() {
    return featureTableStyles.createTableStyleRelationship().then(function () {
      featureTableStyles.hasTableStyleRelationship().should.be.equal(true);
      featureTableStyles.deleteTableStyleRelationship();
      featureTableStyles.hasTableStyleRelationship().should.be.equal(false);
    });
  });

  it('should create and delete icon relationship', function() {
    return featureTableStyles.createIconRelationship().then(function () {
      featureTableStyles.hasIconRelationship().should.be.equal(true);
      featureTableStyles.deleteIconRelationship();
      featureTableStyles.hasIconRelationship().should.be.equal(false);
    });
  });

  it('should create and delete table icon relationship', function() {
    return featureTableStyles.createTableIconRelationship().then(function () {
      featureTableStyles.hasTableIconRelationship().should.be.equal(true);
      featureTableStyles.deleteTableIconRelationship();
      featureTableStyles.hasTableIconRelationship().should.be.equal(false);
    });
  });

  it('should create style relationship even if contentsIdExtension does not yet exist', function() {
    geopackage.getContentsIdExtension().removeExtension();
    return featureTableStyles.createTableIconRelationship().then(function () {
      featureTableStyles.hasTableIconRelationship().should.be.equal(true);
    });
  });

  it('should delete all relationships', function() {
    return featureTableStyles.createTableStyleRelationship().then(function () {
      featureTableStyles.hasTableStyleRelationship().should.be.equal(true);
      geopackage.getFeatureStyleExtension().deleteAllRelationships();
      featureTableStyles.hasTableStyleRelationship().should.be.equal(false);
    });
  });

  it('should verify styles do not yet exist', function() {
    should.not.exist(featureTableStyles.getTableFeatureStyles());
    should.not.exist(featureTableStyles.getTableStyles());
    should.not.exist(featureTableStyles.getCachedTableStyles());
    should.not.exist(featureTableStyles.getTableStyleDefault());
    should.not.exist(featureTableStyles.getTableStyle("GEOMETRY"));
    should.not.exist(featureTableStyles.getTableIcons());
    should.not.exist(featureTableStyles.getCachedTableIcons());
    should.not.exist(featureTableStyles.getTableIconDefault());
    should.not.exist(featureTableStyles.getTableIcon("GEOMETRY"));
    var featureDao = geopackage.getFeatureDao(featureTableName);
    var featureRow = featureDao.queryForId(featureRowId);
    should.not.exist(featureTableStyles.getFeatureStylesForFeatureRow(featureRow));
    should.not.exist(featureTableStyles.getFeatureStyles(featureRow.getId()));
    should.not.exist(featureTableStyles.getFeatureStyleForFeatureRow(featureRow));
    should.not.exist(featureTableStyles.getFeatureStyleDefault(featureRow));
    should.not.exist(featureTableStyles.getFeatureStyle(featureRow.getId(), featureRow.getGeometryType()));
    should.not.exist(featureTableStyles.getFeatureStyleDefault(featureRow.getId()));
    should.not.exist(featureTableStyles.getStylesForFeatureRow(featureRow));
    should.not.exist(featureTableStyles.getStylesForFeatureId(featureRow.getId()));
    should.not.exist(featureTableStyles.getStyleForFeatureRow(featureRow));
    should.not.exist(featureTableStyles.getStyleDefaultForFeatureRow(featureRow));
    should.not.exist(featureTableStyles.getStyle(featureRow.getId(), featureRow.getGeometryType()));
    should.not.exist(featureTableStyles.getStyleDefault(featureRow.getId()));
    should.not.exist(featureTableStyles.getIconsForFeatureRow(featureRow));
    should.not.exist(featureTableStyles.getIconsForFeatureId(featureRow.getId()));
    should.not.exist(featureTableStyles.getIconForFeatureRow(featureRow));
    should.not.exist(featureTableStyles.getIconDefaultForFeatureRow(featureRow));
    should.not.exist(featureTableStyles.getIcon(featureRow.getId(), featureRow.getGeometryType()));
    should.not.exist(featureTableStyles.getIconDefault(featureRow.getId()));
  });

  it('should test IconRow methods', mochaAsync(async () => {
    await featureTableStyles.createTableIconRelationship();
    var pointIcon = randomIcon(featureTableStyles);
    await featureTableStyles.setTableIcon('Point', pointIcon);
    var retrievedIcon = featureTableStyles.getTableIcon('Point');
    retrievedIcon.getName().should.be.equal('Icon Name');
    retrievedIcon.getDescription().should.be.equal('Icon Description');
    retrievedIcon.getWidth().should.be.below(retrievedIcon.getWidth() + 0.1);
    retrievedIcon.getHeight().should.be.below(retrievedIcon.getHeight() + 0.1);
    retrievedIcon.getAnchorUOrDefault().should.be.below(1.1);
    retrievedIcon.getAnchorVOrDefault().should.be.below(1.1);
    (await retrievedIcon.getDerivedWidth()).should.be.equal(retrievedIcon.getWidth());
    (await retrievedIcon.getDerivedHeight()).should.be.equal(retrievedIcon.getHeight());
    var retrievedIconWidth = retrievedIcon.getWidth();
    var retrievedIconHeight = retrievedIcon.getHeight();
    var retrievedIconAnchorU = retrievedIcon.getAnchorU();
    var retrievedIconAnchorV = retrievedIcon.getAnchorV();
    retrievedIcon.setAnchorU(null);
    retrievedIcon.setAnchorV(null);
    retrievedIcon.getAnchorUOrDefault().should.be.equal(0.5);
    retrievedIcon.getAnchorVOrDefault().should.be.equal(1.0);
    retrievedIcon.setAnchorU(retrievedIconAnchorU);
    retrievedIcon.setAnchorV(retrievedIconAnchorV);
    retrievedIcon.setWidth(null);
    retrievedIcon.setHeight(null);
    (await retrievedIcon.getDerivedWidth()).should.be.equal(iconImage.width);
    (await retrievedIcon.getDerivedHeight()).should.be.equal(iconImage.height);
    retrievedIcon.setWidth(retrievedIconWidth);
    retrievedIcon.setHeight(null);
    (await retrievedIcon.getDerivedWidth()).should.be.equal(retrievedIconWidth);
    (await retrievedIcon.getDerivedHeight()).should.be.equal(iconImage.height * (retrievedIconWidth / iconImage.width));
    retrievedIcon.setWidth(null);
    retrievedIcon.setHeight(retrievedIconHeight);
    (await retrievedIcon.getDerivedWidth()).should.be.equal(iconImage.width * (retrievedIconHeight / iconImage.height));
    (await retrievedIcon.getDerivedHeight()).should.be.equal(retrievedIconHeight);
    retrievedIcon.setWidth(retrievedIconWidth);
    retrievedIcon.setHeight(retrievedIconHeight);
    retrievedIcon.validateAnchor(null);
    retrievedIcon.validateAnchor(0.0);
    retrievedIcon.validateAnchor(0.5);
    retrievedIcon.validateAnchor(1.0);
    var badAnchor = -1.0;
    assert.throws(() => {
      retrievedIcon.validateAnchor(badAnchor);
    }, Error, "Anchor must be set inclusively between 0.0 and 1.0, invalid value: " + badAnchor);
    badAnchor = 1.1;
    assert.throws(() => {
      retrievedIcon.validateAnchor(badAnchor);
    }, Error, "Anchor must be set inclusively between 0.0 and 1.0, invalid value: " + badAnchor);
  }));

  it('should test StyleRow methods', mochaAsync(async () => {
    await featureTableStyles.createTableStyleRelationship();
    var rS = randomStyle(featureTableStyles);
    rS.getName().should.be.equal('Style Name');
    rS.getDescription().should.be.equal('Style Description');
    rS.hasColor().should.be.equal(true);
    rS.setHexColor(null);
    rS.setOpacity(1.0);
    rS.hasColor().should.be.equal(true);
    rS.setHexColor('#000000');
    rS.setOpacity(null);
    rS.hasColor().should.be.equal(true);
    rS.setHexColor(null);
    rS.setOpacity(null);
    rS.hasColor().should.be.equal(false);
    rS.hasFillColor().should.be.equal(true);
    rS.setFillOpacity(null);
    rS.getOpacityOrDefault().should.be.equal(1.0);
    rS.getFillOpacityOrDefault().should.be.equal(1.0);
    var badColor = '#GGGGGG';
    assert.throws(() => {
      rS.setHexColor(badColor);
    }, Error, "Color must be in hex format #RRGGBB or #RGB, invalid value: " + badColor);
    assert.throws(() => {
      rS.setFillHexColor(badColor);
    }, Error, "Color must be in hex format #RRGGBB or #RGB, invalid value: " + badColor);
    var badOpacity = 2.0;
    assert.throws(() => {
      rS.setOpacity(badOpacity);
    }, Error, "Opacity must be set inclusively between 0.0 and 1.0, invalid value: " + badOpacity);
    assert.throws(() => {
      rS.setFillOpacity(badOpacity);
    }, Error, "Opacity must be set inclusively between 0.0 and 1.0, invalid value: " + badOpacity);
    badOpacity = -2.0;
    assert.throws(() => {
      rS.setOpacity(badOpacity);
    }, Error, "Opacity must be set inclusively between 0.0 and 1.0, invalid value: " + badOpacity);
    assert.throws(() => {
      rS.setFillOpacity(badOpacity);
    }, Error, "Opacity must be set inclusively between 0.0 and 1.0, invalid value: " + badOpacity);
    rS.setHexColor('000000');
    rS.setFillHexColor('#000000');
    rS.setOpacity(1.0);
    rS.setFillOpacity(0.0);
    rS.getColor().toUpperCase().should.be.equal('#000000FF');
    rS.getFillColor().toUpperCase().should.be.equal('#00000000');
    rS.getOpacityOrDefault().should.be.equal(1.0);
    rS.getFillOpacityOrDefault().should.be.equal(0.0);
    var badWidth = -1.0;
    assert.throws(() => {
      rS.setWidth(badWidth);
    }, Error, "Width must be greater than or equal to 0.0, invalid value: " + badWidth);

    rS.setWidth(2.0);
    rS.getWidth().should.be.equal(2.0);
    rS.getWidthOrDefault().should.be.equal(2.0);
    rS.setWidth(null);
    rS.getWidthOrDefault().should.be.equal(1.0);
  }));

  it('should test Styles and Icons methods', mochaAsync(async () => {
    await featureTableStyles.createStyleRelationship();
    await featureTableStyles.createIconRelationship();
    var styleRow = randomStyle(featureTableStyles);
    var iconRow = randomIcon(featureTableStyles);
    var styles = new Styles();
    should.not.exist(styles.getDefault());
    styles.setDefault(styleRow);
    should.exist(styles.getDefault());
    should.not.exist(styles.getStyle('Point'));
    styles.setStyle(styleRow, 'Point');
    should.exist(styles.getStyle('Point'));
    styles.setStyle(null, 'Point');
    should.not.exist(styles.getStyle('Point'));
    styles.setStyle(null, null);
    should.not.exist(styles.getStyle(null));

    var icons = new Icons();
    should.not.exist(icons.getDefault());
    icons.setDefault(iconRow);
    should.exist(icons.getDefault());
    should.not.exist(icons.getIcon('Point'));
    icons.setIcon(iconRow, 'Point');
    should.exist(icons.getIcon('Point'));
    icons.setIcon(null, 'Point');
    should.not.exist(icons.getIcon('Point'));
    icons.setIcon(null, null);
    should.not.exist(icons.getIcon(null));
  }));

  it('should test FeatureStyles methods', mochaAsync(async () => {
    await featureTableStyles.createStyleRelationship();
    await featureTableStyles.createIconRelationship();
    var styleRow = randomStyle(featureTableStyles);
    var iconRow = randomIcon(featureTableStyles);
    var featureStyle = new FeatureStyle(null, null);
    featureStyle.hasStyle().should.be.equal(false);
    featureStyle.hasIcon().should.be.equal(false);
    featureStyle.setStyle(styleRow);
    featureStyle.setIcon(iconRow);
    featureStyle.hasStyle().should.be.equal(true);
    featureStyle.hasIcon().should.be.equal(true);
    should.exist(featureStyle.getStyle());
    should.exist(featureStyle.getIcon());
  }));

  it('should test IconTable, StyleTable, and StyleMappingTable indices', mochaAsync(async () => {
    await featureTableStyles.createStyleRelationship();
    await featureTableStyles.createIconRelationship();
    var styleTable = featureTableStyles.getStyleDao().table;
    styleTable.getNameColumnIndex().should.be.equal(1);
    styleTable.getDescriptionColumnIndex().should.be.equal(2);
    styleTable.getColorColumnIndex().should.be.equal(3);
    styleTable.getOpacityColumnIndex().should.be.equal(4);
    styleTable.getWidthColumnIndex().should.be.equal(5);
    styleTable.getFillColorColumnIndex().should.be.equal(6);
    styleTable.getFillOpacityColumnIndex().should.be.equal(7);
    var iconTable = featureTableStyles.getIconDao().table;
    iconTable.getNameColumnIndex().should.be.equal(3);
    iconTable.getDescriptionColumnIndex().should.be.equal(4);
    iconTable.getWidthColumnIndex().should.be.equal(5);
    iconTable.getHeightColumnIndex().should.be.equal(6);
    iconTable.getAnchorUColumnIndex().should.be.equal(7);
    iconTable.getAnchorVColumnIndex().should.be.equal(8);
    var styleMappingTable = StyleMappingTable.create('test');
    styleMappingTable.getGeometryTypeNameColumnIndex().should.be.equal(2);

  }));

  it('should create, access, and modify styles and icons', mochaAsync(async () => {
    should.not.exist(featureTableStyles.getStyleMappingDao());
    should.not.exist(featureTableStyles.getTableStyleMappingDao());
    should.not.exist(featureTableStyles.getIconMappingDao());
    should.not.exist(featureTableStyles.getTableIconMappingDao());

    await featureTableStyles.createTableStyleRelationship();
    // test table style default
    var tableStyleDefault = randomStyle(featureTableStyles);
    await featureTableStyles.setTableStyleDefault(tableStyleDefault);
    geopackage.getFeatureStyleExtension().has(featureTableName).should.be.equal(true);
    featureTableStyles.has().should.be.equal(true);
    featureTableStyles.hasTableStyleRelationship().should.be.equal(true);
    geopackage.isTable(StyleTable.TABLE_NAME).should.be.equal(true);
    geopackage.isTable(ContentsIdDao.TABLE_NAME).should.be.equal(true);
    geopackage.isTable(featureTableStyles.getFeatureStyleExtension().getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_TABLE_STYLE, featureTableName)).should.be.equal(true);
    should.exist(featureTableStyles.getTableStyleDefault());
    // test geometry style
    var polygonStyle = randomStyle(featureTableStyles);
    await featureTableStyles.setTableStyle('Polygon', polygonStyle);
    var featureStyles = featureTableStyles.getTableFeatureStyles();
    should.exist(featureStyles);
    should.exist(featureStyles.getStyles());
    should.not.exist(featureStyles.getIcons());
    var tableStyles = featureTableStyles.getTableStyles();
    should.exist(tableStyles);
    should.exist(tableStyles.getDefault());
    tableStyles.getDefault().getId().should.be.equal(tableStyleDefault.getId());
    featureTableStyles.getTableStyle(null).getId().should.be.equal(tableStyleDefault.getId());
    featureTableStyles.getTableStyle('Polygon').getId().should.be.equal(polygonStyle.getId());

    featureTableStyles.hasTableIconRelationship().should.be.equal(false);
    geopackage.isTable(featureTableStyles.getFeatureStyleExtension().getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_TABLE_ICON, featureTableName)).should.be.equal(false);
    // Create table icon relationship
    featureTableStyles.hasTableIconRelationship().should.be.equal(false);

    await featureTableStyles.createTableIconRelationship();
    featureTableStyles.hasTableIconRelationship().should.be.equal(true);

    var tableIconDefault = randomIcon(featureTableStyles);
    await featureTableStyles.setTableIconDefault(tableIconDefault);
    var pointIcon = randomIcon(featureTableStyles);
    await featureTableStyles.setTableIcon('Point', pointIcon);
    geopackage.isTable(IconTable.TABLE_NAME).should.be.equal(true);
    geopackage.isTable(featureTableStyles.getFeatureStyleExtension().getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_TABLE_ICON, featureTableName)).should.be.equal(true);

    featureStyles = featureTableStyles.getTableFeatureStyles();
    should.exist(featureStyles);
    should.exist(featureStyles.getStyles());
    var tableIcons = featureStyles.getIcons();
    should.exist(tableIcons);
    should.exist(tableIcons.getDefault());
    tableIconDefault.getId().should.be.equal(tableIcons.getDefault().getId());
    tableIconDefault.getId().should.be.equal(featureTableStyles.getTableIcon(null).getId());
    pointIcon.getId().should.be.equal(featureTableStyles.getTableIcon('Point').getId());

    featureTableStyles.hasStyleRelationship().should.be.equal(false);
    geopackage.isTable(featureTableStyles.getFeatureStyleExtension().getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_STYLE, featureTableName)).should.be.equal(false);
    featureTableStyles.hasIconRelationship().should.be.equal(false);
    geopackage.isTable(featureTableStyles.getFeatureStyleExtension().getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_ICON, featureTableName)).should.be.equal(false);

    var types = ['Point', 'Polygon', 'LineString', 'MultiPolygon', 'MultiPoint', 'MultiLineString'];
    // Create style and icon relationship
    await featureTableStyles.createStyleRelationship();
    featureTableStyles.hasStyleRelationship().should.be.equal(true);
    geopackage.isTable(featureTableStyles.getFeatureStyleExtension().getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_STYLE, featureTableName)).should.be.equal(true);

    await featureTableStyles.createIconRelationship();
    featureTableStyles.hasIconRelationship().should.be.equal(true);
    geopackage.isTable(featureTableStyles.getFeatureStyleExtension().getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_ICON, featureTableName)).should.be.equal(true);
    var featureRow, style, icon, typeStyle, typeIcon;
    var i, j, t;
    var featureResultsStyles = {};
    var featureResultsIcons = {};
    var featureDao = geopackage.getFeatureDao(featureTableName);
    var results = featureDao.queryForAll();
    for (i = 0; i < results.length; i++) {
      featureRow = featureDao.createObject(results[i]);

      var featureStyle = featureTableStyles.getFeatureStyleDefaultForFeatureRow(featureRow);
      featureStyle.getStyle().getId().should.be.equal(tableStyleDefault.getId());
      featureStyle.getIcon().getId().should.be.equal(tableIconDefault.getId());

      // verify that if no icon or style exist for the feature, that the default for the table is used
      geopackage.getFeatureStyleExtension().getStyle(featureTableName, featureRow.getId(), null, true).getId().should.be.equal(tableStyleDefault.getId());
      geopackage.getFeatureStyleExtension().getIcon(featureTableName, featureRow.getId(), null, true).getId().should.be.equal(tableIconDefault.getId());

      // Feature Styles
      var featureRowStyles = {};
      featureResultsStyles[featureRow.getId()] = featureRowStyles;
      // Add a default style
      var styleDefault = randomStyle(featureTableStyles);
      await featureTableStyles.setStyleDefaultForFeatureRow(featureRow, styleDefault);
      featureRowStyles['null'] = styleDefault;
      // Add geometry type styles
      for (j = 0; j < types.length; j++) {
        t = types[j];
        typeStyle = randomStyle(featureTableStyles);
        await featureTableStyles.setStyleForFeatureRowAndGeometryType(featureRow, t, typeStyle);
        featureRowStyles[t] = typeStyle;
      }
      // Feature Icons
      var featureRowIcons = {};
      featureResultsIcons[featureRow.getId()] = featureRowIcons;
      // Add a default icon
      var iconDefault = randomIcon(featureTableStyles);
      await featureTableStyles.setIconDefaultForFeatureRow(featureRow, iconDefault);
      featureRowIcons['null'] = iconDefault;
      for (j = 0; j < types.length; j++) {
        t = types[j];
        typeIcon = randomIcon(featureTableStyles);
        await featureTableStyles.setIconForFeatureRowAndGeometryType(featureRow, t, typeIcon);
        featureRowIcons[t] = typeIcon;
      }
    }
    results = featureDao.queryForAll();
    for (i = 0; i < results.length; i++) {
      featureRow = featureDao.createObject(results[i]);
      var featureRowId = featureRow.getId();
      featureStyles = featureResultsStyles[featureRowId];
      var featureIcons = featureResultsIcons[featureRowId];
      if (featureStyles) {
        // test defaults
        var defaultStyle = featureStyles['null'];
        if (defaultStyle) {
          style = featureTableStyles.getStyleDefaultForFeatureRow(featureRow);
          defaultStyle.getId().should.be.equal(style.getId());
        }
        for (j = 0; j < types.length; j++) {
          t = types[j];
          typeStyle = featureStyles[t];
          if (typeStyle) {
            style = featureTableStyles.getStyleForFeatureRowAndGeometryType(featureRow, t);
            typeStyle.getId().should.be.equal(style.getId());
          }
        }
      }
      if (featureIcons) {
        var defaultIcon = featureIcons['null'];
        if (defaultIcon) {
          icon = featureTableStyles.getIconDefaultForFeatureRow(featureRow);
          defaultIcon.getId().should.be.equal(icon.getId());
        }
        for (j = 0; j < types.length; j++) {
          t = types[j];
          typeIcon = featureIcons[t];
          if (typeIcon) {
            icon = featureTableStyles.getIconForFeatureRowAndGeometryType(featureRow, t);
            typeIcon.getId().should.be.equal(icon.getId());
          }
        }
      }
    }

    // test getting mappings
    should.exist(featureTableStyles.getStyleMappingDao());
    should.exist(featureTableStyles.getTableStyleMappingDao());
    should.exist(featureTableStyles.getIconMappingDao());
    should.exist(featureTableStyles.getTableIconMappingDao());

    var featureStyleExtension = geopackage.getFeatureStyleExtension();
    featureStyles = featureTableStyles.getFeatureStyles(featureRow.getId());
    should.exist(featureStyles.getStyles());
    should.exist(featureStyles.getIcons());

    should.exist(featureStyleExtension.getFeatureStyleForFeatureRow(featureRow));
    should.exist(featureStyleExtension.getFeatureStyleDefault(featureRow));

    var tables = featureStyleExtension.getTables();
    tables.length.should.be.equal(1);
    tables.indexOf(featureTableName).should.be.equal(0);
    should.exist(featureStyleExtension.getTableStyles(featureTableName));
    should.exist(featureStyleExtension.getTableIcons(featureTableName));
    featureTableStyles.deleteAllFeatureStyles();
    should.not.exist(featureStyleExtension.getTableStyles(featureTableName));
    should.not.exist(featureStyleExtension.getTableIcons(featureTableName));
    results = featureDao.queryForAll();
    for (i = 0; i < results.length; i++) {
      featureRow = featureDao.createObject(results[i]);
      should.not.exist(featureStyleExtension.getStylesForFeatureRow(featureRow));
      should.not.exist(featureStyleExtension.getIconsForFeatureRow(featureRow));
      featureStyleExtension.deleteRelationships(featureTableName);
      featureStyleExtension.has(featureTableName).should.be.equal(false);
    }
    featureStyleExtension.has(featureTableName).should.be.equal(false);
    geopackage.isTable(StyleTable.TABLE_NAME).should.be.equal(true);
    geopackage.isTable(IconTable.TABLE_NAME).should.be.equal(true);
    geopackage.isTable(ContentsIdDao.TABLE_NAME).should.be.equal(true);
    featureStyleExtension.removeExtension();
    geopackage.isTable(StyleTable.TABLE_NAME).should.be.equal(false);
    geopackage.isTable(IconTable.TABLE_NAME).should.be.equal(false);
    geopackage.isTable(ContentsIdDao.TABLE_NAME).should.be.equal(true);
    var contentsIdExtension = featureStyleExtension.getContentsId();
    contentsIdExtension.count().should.be.equal(1);
    contentsIdExtension.deleteIds().should.be.equal(1);
    contentsIdExtension.removeExtension();
    geopackage.isTable(ContentsIdDao.TABLE_NAME).should.be.equal(false);
  }));

  it('should test FeatureTableStyles functions', mochaAsync(async () => {
    // relationships do not yet exist, thus these will be null
    should.not.exist(featureTableStyles.getAllTableStyleIds());
    should.not.exist(featureTableStyles.getAllTableIconIds());
    should.not.exist(featureTableStyles.getAllStyleIds());
    should.not.exist(featureTableStyles.getAllIconIds());

    // setup relationships
    await featureTableStyles.createTableStyleRelationship();
    await featureTableStyles.createTableIconRelationship();
    await featureTableStyles.createStyleRelationship();
    await featureTableStyles.createIconRelationship();

    var featureDao = geopackage.getFeatureDao(featureTableName);
    var results = featureDao.queryForAll();
    var featureRow = featureDao.createObject(results[0]);

    // test table style default
    var tableStyleDefault = randomStyle(featureTableStyles);
    var tableIconDefault = randomIcon(featureTableStyles);
    await featureTableStyles.setTableStyleDefault(tableStyleDefault);
    await featureTableStyles.setTableStyle('Point', tableStyleDefault);
    await featureTableStyles.setTableIconDefault(tableIconDefault);
    await featureTableStyles.setTableIcon('Point', tableIconDefault);
    should.exist(featureTableStyles.getTableStyleDefault());
    var featureStyles = featureTableStyles.getTableFeatureStyles();
    await featureTableStyles.setTableFeatureStyles(null);
    should.not.exist(featureTableStyles.getTableStyleDefault());
    await featureTableStyles.setTableFeatureStyles(featureStyles);
    should.exist(featureTableStyles.getTableStyleDefault());
    await featureTableStyles.setTableStyles(null);
    await featureTableStyles.setTableIcons(null);
    should.not.exist(featureTableStyles.getTableStyles());
    should.not.exist(featureTableStyles.getTableIcons());

    await featureTableStyles.setFeatureStylesForFeatureRow(featureRow, featureStyles);
    should.exist(featureTableStyles.getFeatureStylesForFeatureRow(featureRow));
    featureTableStyles.deleteStylesForFeatureRow(featureRow);
    featureTableStyles.deleteIconsForFeatureRow(featureRow);
    should.not.exist(featureTableStyles.getFeatureStylesForFeatureRow(featureRow));

    var featureStyle = new FeatureStyle(tableStyleDefault, tableIconDefault);
    await featureTableStyles.setFeatureStyleForFeatureRow(featureRow, featureStyle);
    should.exist(featureTableStyles.getFeatureStyleForFeatureRow(featureRow));
    await featureTableStyles.setFeatureStyleForFeatureRow(featureRow, null);
    should.not.exist(featureTableStyles.getFeatureStyleForFeatureRow(featureRow));

    await featureTableStyles.setTableStyle('Point', tableStyleDefault);
    should.exist(featureTableStyles.getTableStyle('Point'));
    await featureTableStyles.setTableStyle('Point', null);
    should.not.exist(featureTableStyles.getTableStyle('Point'));

    await featureTableStyles.setTableIcon('Point', tableIconDefault);
    should.exist(featureTableStyles.getTableIcon('Point'));
    await featureTableStyles.setTableIcon('Point', null);
    should.not.exist(featureTableStyles.getTableIcon('Point'));

    await featureTableStyles.setTableStyleDefault(tableStyleDefault);
    await featureTableStyles.setStyleDefaultForFeatureRow(featureRow, tableStyleDefault);
    should.exist(featureTableStyles.getTableStyleDefault());
    should.exist(featureTableStyles.getStyleDefaultForFeatureRow(featureRow));
    featureTableStyles.deleteAllStyles();
    should.not.exist(featureTableStyles.getTableStyleDefault());
    should.not.exist(featureTableStyles.getStyleDefaultForFeatureRow(featureRow));

    await featureTableStyles.setTableIconDefault(tableIconDefault);
    await featureTableStyles.setIconDefaultForFeatureRow(featureRow, tableStyleDefault);
    should.exist(featureTableStyles.getTableIconDefault());
    should.exist(featureTableStyles.getIconDefaultForFeatureRow(featureRow));
    featureTableStyles.deleteAllIcons();
    should.not.exist(featureTableStyles.getTableIconDefault());
    should.not.exist(featureTableStyles.getIconDefaultForFeatureRow(featureRow));

    await featureTableStyles.setTableStyleDefault(tableStyleDefault);
    await featureTableStyles.setTableIconDefault(tableIconDefault);
    should.exist(featureTableStyles.getTableStyleDefault());
    should.exist(featureTableStyles.getTableIconDefault());
    featureTableStyles.deleteTableFeatureStyles();
    should.not.exist(featureTableStyles.getTableStyleDefault());
    should.not.exist(featureTableStyles.getTableIconDefault());

    await featureTableStyles.setTableStyleDefault(tableStyleDefault);
    should.exist(featureTableStyles.getTableStyleDefault());
    featureTableStyles.deleteTableStyles();
    should.not.exist(featureTableStyles.getTableStyleDefault());

    await featureTableStyles.setTableIconDefault(tableIconDefault);
    should.exist(featureTableStyles.getTableIconDefault());
    featureTableStyles.deleteTableIcons();
    should.not.exist(featureTableStyles.getTableIconDefault());

    await featureTableStyles.setTableStyleDefault(tableStyleDefault);
    should.exist(featureTableStyles.getTableStyleDefault());
    featureTableStyles.deleteTableStyleDefault();
    should.not.exist(featureTableStyles.getTableStyleDefault());

    await featureTableStyles.setTableIconDefault(tableIconDefault);
    should.exist(featureTableStyles.getTableIconDefault());
    featureTableStyles.deleteTableIconDefault();
    should.not.exist(featureTableStyles.getTableIconDefault());

    await featureTableStyles.setTableStyleDefault(tableStyleDefault);
    should.exist(featureTableStyles.getTableStyleDefault());
    featureTableStyles.deleteTableStyle(null);
    should.not.exist(featureTableStyles.getTableStyleDefault());

    await featureTableStyles.setTableIconDefault(tableIconDefault);
    should.exist(featureTableStyles.getTableIconDefault());
    featureTableStyles.deleteTableIcon(null);
    should.not.exist(featureTableStyles.getTableIconDefault());

    await featureTableStyles.setStyleDefaultForFeatureRow(featureRow, tableStyleDefault);
    await featureTableStyles.setIconDefaultForFeatureRow(featureRow, tableStyleDefault);
    should.exist(featureTableStyles.getStyleDefaultForFeatureRow(featureRow));
    should.exist(featureTableStyles.getIconDefaultForFeatureRow(featureRow));
    featureTableStyles.deleteFeatureStyles();
    should.not.exist(featureTableStyles.getStyleDefaultForFeatureRow(featureRow));
    should.not.exist(featureTableStyles.getIconDefaultForFeatureRow(featureRow));

    await featureTableStyles.setStyleDefaultForFeatureRow(featureRow, tableStyleDefault);
    should.exist(featureTableStyles.getStyleDefaultForFeatureRow(featureRow));
    featureTableStyles.deleteStyles();
    should.not.exist(featureTableStyles.getStyleDefaultForFeatureRow(featureRow));

    await featureTableStyles.setIconDefaultForFeatureRow(featureRow, tableStyleDefault);
    should.exist(featureTableStyles.getIconDefaultForFeatureRow(featureRow));
    featureTableStyles.deleteIcons();
    should.not.exist(featureTableStyles.getIconDefaultForFeatureRow(featureRow));

    await featureTableStyles.setFeatureStylesForFeatureRow(featureRow, null);
    await featureTableStyles.setFeatureStyles(featureRow.getId(), null);
    await featureTableStyles.setFeatureStyleForFeatureRow(featureRow, null);
    await featureTableStyles.setFeatureStyleDefaultForFeatureRow(featureRow, null);
    await featureTableStyles.setFeatureStyleForFeatureRowAndGeometryType(featureRow, null, null);
    await featureTableStyles.setFeatureStyle(featureRow.getId(), null, null);
    await featureTableStyles.setFeatureStyleDefault(featureRow.getId(), null);
    should.not.exist(featureTableStyles.getFeatureStyleDefaultForFeatureRow(featureRow));

    await featureTableStyles.setStylesForFeatureRow(featureRow, null);
    await featureTableStyles.setStyles(featureRow.getId(), null);
    await featureTableStyles.setStyleForFeatureRow(featureRow, null);
    await featureTableStyles.setStyle(featureRow.getId(), null, null);
    await featureTableStyles.setStyleDefault(featureRow.getId(), null);
    should.not.exist(featureTableStyles.getStyleDefaultForFeatureRow(featureRow));
    featureTableStyles.deleteStylesForFeatureRow(featureRow);
    featureTableStyles.deleteStylesForFeatureId(featureRow.getId());
    featureTableStyles.deleteStyleDefaultForFeatureRow(featureRow);
    featureTableStyles.deleteStyleDefault(featureRow.getId());
    featureTableStyles.deleteStyleForFeatureRow(featureRow);
    featureTableStyles.deleteStyleForFeatureRowAndGeometryType(featureRow, null);
    featureTableStyles.deleteStyle(featureRow.getId(), null);

    await featureTableStyles.setIconsForFeatureRow(featureRow, null);
    await featureTableStyles.setIcons(featureRow.getId(), null);
    await featureTableStyles.setIconForFeatureRow(featureRow, null);
    await featureTableStyles.setIcon(featureRow.getId(), null, null);
    await featureTableStyles.setIconDefault(featureRow.getId(), null);
    should.not.exist(featureTableStyles.getIconDefaultForFeatureRow(featureRow));
    featureTableStyles.deleteIconsForFeatureRow(featureRow);
    featureTableStyles.deleteIconsForFeatureId(featureRow.getId());
    featureTableStyles.deleteIconDefaultForFeatureRow(featureRow);
    featureTableStyles.deleteIconDefault(featureRow.getId());
    featureTableStyles.deleteIconForFeatureRow(featureRow);
    featureTableStyles.deleteIconForFeatureRowAndGeometryType(featureRow, null);
    featureTableStyles.deleteIcon(featureRow.getId(), null);

    featureStyles = new FeatureStyles();
    var styles = new Styles();
    styles.setDefault(tableStyleDefault);
    featureStyles.setStyles(styles);

    featureTableStyles.getAllTableStyleIds().length.should.be.equal(0);
    featureTableStyles.getAllTableIconIds().length.should.be.equal(0);
    featureTableStyles.getAllStyleIds().length.should.be.equal(0);
    featureTableStyles.getAllIconIds().length.should.be.equal(0);
  }));
});

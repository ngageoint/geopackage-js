
import { default as testSetup } from '../../../fixtures/testSetup'

var FeatureTableStyles = require('../../../../lib/extension/style/featureTableStyles').FeatureTableStyles
  , StyleMappingTable = require('../../../../lib/extension/style/styleMappingTable').StyleMappingTable
  , StyleTable = require('../../../../lib/extension/style/styleTable').StyleTable
  , Styles = require('../../../../lib/extension/style/styles').Styles
  , Canvas = require('../../../../lib/canvas/canvas').Canvas
  , Icons = require('../../../../lib/extension/style/icons').Icons
  , FeatureStyles = require('../../../../lib/extension/style/featureStyles').FeatureStyles
  , FeatureStyle = require('../../../../lib/extension/style/featureStyle').FeatureStyle
  , IconTable = require('../../../../lib/extension/style/iconTable').IconTable
  , ContentsIdDao = require('../../../../lib/extension/contents/contentsIdDao').ContentsIdDao
  , ImageUtils = require('../../../../lib/tiles/imageUtils').ImageUtils
  , should = require('chai').should()
  , assert = require('assert')
  , path = require('path')
  , wkx = require('wkx')
  , GeometryData = require('../../../../lib/geom/geometryData').GeometryData
  , GeometryType = require('../../../../lib/features/user/geometryType').GeometryType
  , FeatureStyleExtension = require('../../../../lib/extension/style').FeatureStyleExtension;

describe('StyleExtension Tests', function() {
  var testGeoPackage;
  var geopackage;
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
  };

  var randomIcon = function(featureTableStyles) {
    var iconRow = featureTableStyles.getIconDao().newRow();
    iconRow.data = iconImageBuffer;
    iconRow.contentType = 'image/png';
    iconRow.name = "Icon Name";
    iconRow.description = "Icon Description";
    iconRow.width = Math.random() * iconImage.width;
    iconRow.height = Math.random() * iconImage.height;
    iconRow.anchorU = Math.random();
    iconRow.anchorV = Math.random();
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

  beforeEach(async function() {
    let created = await testSetup.createTmpGeoPackage();
    testGeoPackage = created.path;
    geopackage = created.geopackage;
  });

  beforeEach('create the GeoPackage connection and setup the FeatureStyleExtension', async function() {
    // create a feature table first
    featureTable = geopackage.createFeatureTable(featureTableName);
    var box = {
      "type": "Polygon",
      "coordinates": [[[-1, 1], [1, 1], [1, 3], [-1, 3], [-1, 1]]]
    };
    featureRowId = createRow(box, 'box', geopackage.getFeatureDao(featureTableName));
    geopackage.featureStyleExtension.getOrCreateExtension(featureTableName)
    geopackage.featureStyleExtension.getRelatedTables().getOrCreateExtension()
    geopackage.featureStyleExtension.getContentsId().getOrCreateExtension()
    featureTableStyles = new FeatureTableStyles(geopackage, featureTableName);
    iconImage = await ImageUtils.getImage(path.join(__dirname, '..', '..', '..', 'fixtures', 'point.png'))
    // @ts-ignore
    iconImageBuffer = await loadTile(path.join(__dirname, '..', '..', '..', 'fixtures', 'point.png'));
  });

  afterEach(async function() {
    geopackage.close();
    Canvas.disposeImage(iconImage);
    await testSetup.deleteGeoPackage(testGeoPackage);
  });

  it('should create extension for feature table', function() {
    var extensions = geopackage.extensionDao.queryByExtensionAndTableName(FeatureStyleExtension.EXTENSION_NAME, featureTableName);
    should.exist(extensions.length);
    if (extensions.length) {
      extensions.length.should.be.equal(1);
    }
  });

  it('should check if geopackage has extension or not', function() {
    geopackage.featureStyleExtension.has(featureTableName).should.be.equal(true);
    geopackage.featureStyleExtension.has('not_valid_feature_table').should.be.equal(false);
    featureTableStyles.has().should.be.equal(true);
  });

  it('should return all feature tables with style extension', function() {
    geopackage.featureStyleExtension.getTables().length.should.be.equal(1);
  });

  it('should get related tables extension', function() {
    geopackage.featureStyleExtension.getRelatedTables().should.be.equal(geopackage.relatedTablesExtension);
  });

  it('should get content id extension', function() {
    geopackage.featureStyleExtension.getContentsId().should.be.equal(geopackage.contentsIdExtension);
  });

  it('should create relationships', function() {
    featureTableStyles.createRelationships();
    featureTableStyles.hasStyleRelationship().should.be.equal(true);
    featureTableStyles.hasTableStyleRelationship().should.be.equal(true);
    featureTableStyles.hasIconRelationship().should.be.equal(true);
    featureTableStyles.hasTableIconRelationship().should.be.equal(true);
    featureTableStyles.hasRelationship().should.be.equal(true);
    featureTableStyles.deleteRelationships();
    featureTableStyles.hasRelationship().should.be.equal(false);
  });

  it('should get table name', function() {
    featureTableStyles.getTableName().should.be.equal(featureTableName);
  });

  it('should delete all relationships', function() {
    featureTableStyles.createRelationships();
    featureTableStyles.deleteRelationships();
    featureTableStyles.hasRelationship().should.be.equal(false);
  });

  it('should create and delete style relationship', function() {
    featureTableStyles.createStyleRelationship();
    featureTableStyles.hasStyleRelationship().should.be.equal(true);
    featureTableStyles.deleteStyleRelationship();
    featureTableStyles.hasStyleRelationship().should.be.equal(false);
  });

  it('should create and delete table style relationship', function() {
    featureTableStyles.createTableStyleRelationship();
    featureTableStyles.hasTableStyleRelationship().should.be.equal(true);
    featureTableStyles.deleteTableStyleRelationship();
    featureTableStyles.hasTableStyleRelationship().should.be.equal(false);
  });

  it('should create and delete icon relationship', function() {
    featureTableStyles.createIconRelationship();
    featureTableStyles.hasIconRelationship().should.be.equal(true);
    featureTableStyles.deleteIconRelationship();
    featureTableStyles.hasIconRelationship().should.be.equal(false);
  });

  it('should create and delete table icon relationship', function() {
    featureTableStyles.createTableIconRelationship();
    featureTableStyles.hasTableIconRelationship().should.be.equal(true);
    featureTableStyles.deleteTableIconRelationship();
    featureTableStyles.hasTableIconRelationship().should.be.equal(false);

  });

  it('should create style relationship even if contentsIdExtension does not yet exist', function() {
    geopackage.contentsIdExtension.removeExtension();
    featureTableStyles.createTableIconRelationship();
    featureTableStyles.hasTableIconRelationship().should.be.equal(true);
  });

  it('should delete all relationships', function() {
    featureTableStyles.createTableStyleRelationship();
    featureTableStyles.hasTableStyleRelationship().should.be.equal(true);
    geopackage.featureStyleExtension.deleteAllRelationships();
    featureTableStyles.hasTableStyleRelationship().should.be.equal(false);
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
    should.not.exist(featureTableStyles.getFeatureStyles(featureRow.id));
    should.not.exist(featureTableStyles.getFeatureStyleForFeatureRow(featureRow));
    should.not.exist(featureTableStyles.getFeatureStyleDefault(featureRow));
    should.not.exist(featureTableStyles.getFeatureStyle(featureRow.id, featureRow.geometryType));
    should.not.exist(featureTableStyles.getFeatureStyleDefault(featureRow.id));
    should.not.exist(featureTableStyles.getStylesForFeatureRow(featureRow));
    should.not.exist(featureTableStyles.getStylesForFeatureId(featureRow.id));
    should.not.exist(featureTableStyles.getStyleForFeatureRow(featureRow));
    should.not.exist(featureTableStyles.getStyleDefaultForFeatureRow(featureRow));
    should.not.exist(featureTableStyles.getStyle(featureRow.id, featureRow.geometryType));
    should.not.exist(featureTableStyles.getStyleDefault(featureRow.id));
    should.not.exist(featureTableStyles.getIconsForFeatureRow(featureRow));
    should.not.exist(featureTableStyles.getIconsForFeatureId(featureRow.id));
    should.not.exist(featureTableStyles.getIconForFeatureRow(featureRow));
    should.not.exist(featureTableStyles.getIconDefaultForFeatureRow(featureRow));
    should.not.exist(featureTableStyles.getIcon(featureRow.id, featureRow.geometryType));
    should.not.exist(featureTableStyles.getIconDefault(featureRow.id));
  });

  it('should test IconRow methods', mochaAsync(async () => {
    featureTableStyles.createTableIconRelationship();
    var pointIcon = randomIcon(featureTableStyles);
    featureTableStyles.setTableIcon(GeometryType.POINT, pointIcon);
    var retrievedIcon = featureTableStyles.getTableIcon(GeometryType.POINT);
    retrievedIcon.name.should.be.equal('Icon Name');
    retrievedIcon.description.should.be.equal('Icon Description');
    retrievedIcon.width.should.be.below(retrievedIcon.width + 0.1);
    retrievedIcon.height.should.be.below(retrievedIcon.height + 0.1);
    retrievedIcon.anchorUOrDefault.should.be.below(1.1);
    retrievedIcon.anchorVOrDefault.should.be.below(1.1);
    (retrievedIcon.derivedWidth).should.be.equal(retrievedIcon.width);
    (retrievedIcon.derivedHeight).should.be.equal(retrievedIcon.height);
    var retrievedIconWidth = retrievedIcon.width;
    var retrievedIconHeight = retrievedIcon.height;
    var retrievedIconAnchorU = retrievedIcon.anchorU;
    var retrievedIconAnchorV = retrievedIcon.anchorV;
    retrievedIcon.anchorU = null;
    retrievedIcon.anchorV = null;
    retrievedIcon.anchorUOrDefault.should.be.equal(0.5);
    retrievedIcon.anchorVOrDefault.should.be.equal(1.0);
    retrievedIcon.anchorU = retrievedIconAnchorU;
    retrievedIcon.anchorV = retrievedIconAnchorV;
    retrievedIcon.width = null;
    retrievedIcon.height = null;
    (retrievedIcon.derivedWidth).should.be.equal(iconImage.width);
    (retrievedIcon.derivedHeight).should.be.equal(iconImage.height);
    retrievedIcon.width  = retrievedIconWidth;
    retrievedIcon.height = null;
    (retrievedIcon.derivedWidth).should.be.equal(retrievedIconWidth);
    (retrievedIcon.derivedHeight).should.be.equal(iconImage.height * (retrievedIconWidth / iconImage.width));
    retrievedIcon.width = null;
    retrievedIcon.height = retrievedIconHeight;
    (retrievedIcon.derivedWidth).should.be.equal(iconImage.width * (retrievedIconHeight / iconImage.height));
    (retrievedIcon.derivedHeight).should.be.equal(retrievedIconHeight);
    retrievedIcon.width = retrievedIconWidth;
    retrievedIcon.height = retrievedIconHeight;
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
    featureTableStyles.createTableStyleRelationship();
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
    featureTableStyles.createStyleRelationship();
    featureTableStyles.createIconRelationship();
    var styleRow = randomStyle(featureTableStyles);
    var iconRow = randomIcon(featureTableStyles);
    var styles = new Styles();
    should.not.exist(styles.getDefault());
    styles.setDefault(styleRow);
    should.exist(styles.getDefault());
    should.exist(styles.getStyle(GeometryType.POINT));
    styles.setDefault(null);
    should.not.exist(styles.getStyle(GeometryType.POINT));
    styles.setStyle(styleRow, GeometryType.POINT);
    should.exist(styles.getStyle(GeometryType.POINT));
    styles.setStyle(null, GeometryType.POINT);
    should.not.exist(styles.getStyle(GeometryType.POINT));
    styles.setStyle(null, null);
    should.not.exist(styles.getStyle(null));

    var icons = new Icons();
    should.not.exist(icons.getDefault());
    icons.setDefault(iconRow);
    should.exist(icons.getDefault());
    should.exist(icons.getIcon(GeometryType.POINT));
    icons.setDefault(null);
    should.not.exist(icons.getIcon(GeometryType.POINT));
    icons.setIcon(iconRow, GeometryType.POINT);
    should.exist(icons.getIcon(GeometryType.POINT));
    icons.setIcon(null, GeometryType.POINT);
    should.not.exist(icons.getIcon(GeometryType.POINT));
    icons.setIcon(null, null);
    should.not.exist(icons.getIcon(null));
  }));

  it('should test FeatureStyles methods', mochaAsync(async () => {
    featureTableStyles.createStyleRelationship();
    featureTableStyles.createIconRelationship();
    var styleRow = randomStyle(featureTableStyles);
    var iconRow = randomIcon(featureTableStyles);
    var featureStyle = new FeatureStyle(null, null);
    featureStyle.hasStyle().should.be.equal(false);
    featureStyle.hasIcon().should.be.equal(false);
    featureStyle.style = styleRow;
    featureStyle.icon = iconRow;
    featureStyle.hasStyle().should.be.equal(true);
    featureStyle.hasIcon().should.be.equal(true);
    should.exist(featureStyle.style);
    should.exist(featureStyle.icon);
  }));

  it('should test IconTable, StyleTable, and StyleMappingTable indices', mochaAsync(async () => {
    featureTableStyles.createStyleRelationship();
    featureTableStyles.createIconRelationship();
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

    featureTableStyles.createTableStyleRelationship();
    // test table style default
    var tableStyleDefault = randomStyle(featureTableStyles);
    featureTableStyles.setTableStyleDefault(tableStyleDefault);
    geopackage.featureStyleExtension.has(featureTableName).should.be.equal(true);
    featureTableStyles.has().should.be.equal(true);
    featureTableStyles.hasTableStyleRelationship().should.be.equal(true);
    geopackage.isTable(StyleTable.TABLE_NAME).should.be.equal(true);
    geopackage.isTable(ContentsIdDao.TABLE_NAME).should.be.equal(true);
    geopackage.isTable(featureTableStyles.getFeatureStyleExtension().getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_TABLE_STYLE, featureTableName)).should.be.equal(true);
    should.exist(featureTableStyles.getTableStyleDefault());
    // test geometry style
    var polygonStyle = randomStyle(featureTableStyles);
    featureTableStyles.setTableStyle(GeometryType.POLYGON, polygonStyle);
    var featureStyles = featureTableStyles.getTableFeatureStyles();
    should.exist(featureStyles);
    should.exist(featureStyles.styles);
    should.not.exist(featureStyles.icons);
    var tableStyles = featureTableStyles.getTableStyles();
    should.exist(tableStyles);
    should.exist(tableStyles.getDefault());
    tableStyles.getDefault().id.should.be.equal(tableStyleDefault.id);
    featureTableStyles.getTableStyle(null).id.should.be.equal(tableStyleDefault.id);
    featureTableStyles.getTableStyle(GeometryType.POLYGON).id.should.be.equal(polygonStyle.id);

    featureTableStyles.hasTableIconRelationship().should.be.equal(false);
    geopackage.isTable(featureTableStyles.getFeatureStyleExtension().getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_TABLE_ICON, featureTableName)).should.be.equal(false);
    // Create table icon relationship
    featureTableStyles.hasTableIconRelationship().should.be.equal(false);

    featureTableStyles.createTableIconRelationship();
    featureTableStyles.hasTableIconRelationship().should.be.equal(true);

    var tableIconDefault = randomIcon(featureTableStyles);
    featureTableStyles.setTableIconDefault(tableIconDefault);
    var pointIcon = randomIcon(featureTableStyles);
    featureTableStyles.setTableIcon(GeometryType.POINT, pointIcon);
    geopackage.isTable(IconTable.TABLE_NAME).should.be.equal(true);
    geopackage.isTable(featureTableStyles.getFeatureStyleExtension().getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_TABLE_ICON, featureTableName)).should.be.equal(true);

    featureStyles = featureTableStyles.getTableFeatureStyles();
    should.exist(featureStyles);
    should.exist(featureStyles.styles);
    var tableIcons = featureStyles.icons;
    should.exist(tableIcons);
    should.exist(tableIcons.getDefault());
    tableIconDefault.id.should.be.equal(tableIcons.getDefault().id);
    tableIconDefault.id.should.be.equal(featureTableStyles.getTableIcon(null).id);
    pointIcon.id.should.be.equal(featureTableStyles.getTableIcon(GeometryType.POINT).id);

    featureTableStyles.hasStyleRelationship().should.be.equal(false);
    geopackage.isTable(featureTableStyles.getFeatureStyleExtension().getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_STYLE, featureTableName)).should.be.equal(false);
    featureTableStyles.hasIconRelationship().should.be.equal(false);
    geopackage.isTable(featureTableStyles.getFeatureStyleExtension().getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_ICON, featureTableName)).should.be.equal(false);

    var types = [GeometryType.POINT, GeometryType.POLYGON, GeometryType.LINESTRING, GeometryType.MULTIPOINT, GeometryType.MULTIPOLYGON, GeometryType.MULTILINESTRING];
    // Create style and icon relationship
    featureTableStyles.createStyleRelationship();
    featureTableStyles.hasStyleRelationship().should.be.equal(true);
    geopackage.isTable(featureTableStyles.getFeatureStyleExtension().getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_STYLE, featureTableName)).should.be.equal(true);

    featureTableStyles.createIconRelationship();
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
      featureStyle.style.id.should.be.equal(tableStyleDefault.id);
      featureStyle.icon.id.should.be.equal(tableIconDefault.id);

      // verify that if no icon or style exist for the feature, that the default for the table is used
      geopackage.featureStyleExtension.getStyle(featureTableName, featureRow.id, null, true).id.should.be.equal(tableStyleDefault.id);
      geopackage.featureStyleExtension.getIcon(featureTableName, featureRow.id, null, true).id.should.be.equal(tableIconDefault.id);

      // Feature Styles
      var featureRowStyles = {};
      featureResultsStyles[featureRow.id] = featureRowStyles;
      // Add a default style
      var styleDefault = randomStyle(featureTableStyles);
      featureTableStyles.setStyleDefaultForFeatureRow(featureRow, styleDefault);
      featureRowStyles['null'] = styleDefault;
      // Add geometry type styles
      for (j = 0; j < types.length; j++) {
        t = types[j];
        typeStyle = randomStyle(featureTableStyles);
        featureTableStyles.setStyleForFeatureRowAndGeometryType(featureRow, t, typeStyle);
        featureRowStyles[t] = typeStyle;
      }
      // Feature Icons
      var featureRowIcons = {};
      featureResultsIcons[featureRow.id] = featureRowIcons;
      // Add a default icon
      var iconDefault = randomIcon(featureTableStyles);
      featureTableStyles.setIconDefaultForFeatureRow(featureRow, iconDefault);
      featureRowIcons['null'] = iconDefault;
      for (j = 0; j < types.length; j++) {
        t = types[j];
        typeIcon = randomIcon(featureTableStyles);
        featureTableStyles.setIconForFeatureRowAndGeometryType(featureRow, t, typeIcon);
        featureRowIcons[t] = typeIcon;
      }
    }
    results = featureDao.queryForAll();
    for (i = 0; i < results.length; i++) {
      featureRow = featureDao.createObject(results[i]);
      var featureRowId = featureRow.id;
      featureStyles = featureResultsStyles[featureRowId];
      var featureIcons = featureResultsIcons[featureRowId];
      if (featureStyles) {
        // test defaults
        var defaultStyle = featureStyles['null'];
        if (defaultStyle) {
          style = featureTableStyles.getStyleDefaultForFeatureRow(featureRow);
          defaultStyle.id.should.be.equal(style.id);
        }
        for (j = 0; j < types.length; j++) {
          t = types[j];
          typeStyle = featureStyles[t];
          if (typeStyle) {
            style = featureTableStyles.getStyleForFeatureRowAndGeometryType(featureRow, t);
            typeStyle.id.should.be.equal(style.id);
          }
        }
      }
      if (featureIcons) {
        var defaultIcon = featureIcons['null'];
        if (defaultIcon) {
          icon = featureTableStyles.getIconDefaultForFeatureRow(featureRow);
          defaultIcon.id.should.be.equal(icon.id);
        }
        for (j = 0; j < types.length; j++) {
          t = types[j];
          typeIcon = featureIcons[t];
          if (typeIcon) {
            icon = featureTableStyles.getIconForFeatureRowAndGeometryType(featureRow, t);
            typeIcon.id.should.be.equal(icon.id);
          }
        }
      }
    }

    // test getting mappings
    should.exist(featureTableStyles.getStyleMappingDao());
    should.exist(featureTableStyles.getTableStyleMappingDao());
    should.exist(featureTableStyles.getIconMappingDao());
    should.exist(featureTableStyles.getTableIconMappingDao());

    var featureStyleExtension = geopackage.featureStyleExtension;
    featureStyles = featureTableStyles.getFeatureStyles(featureRow.id);
    should.exist(featureStyles.styles);
    should.exist(featureStyles.icons);

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

  it('should test featureStyles useIcon functionality', mochaAsync(async () => {
    // setup relationships
    featureTableStyles.createTableStyleRelationship();
    featureTableStyles.createTableIconRelationship();
    featureTableStyles.createStyleRelationship();
    featureTableStyles.createIconRelationship();

    var featureDao = geopackage.getFeatureDao(featureTableName);
    var results = featureDao.queryForAll();
    var featureRow = featureDao.createObject(results[0]);

    // test table style default
    var tableStyleDefault = randomStyle(featureTableStyles);
    var tableIconDefault = randomIcon(featureTableStyles);
    featureTableStyles.setTableStyleDefault(tableStyleDefault);
    featureTableStyles.setTableStyle(GeometryType.POLYGON, tableStyleDefault);
    featureTableStyles.setTableIconDefault(tableIconDefault);
    featureTableStyles.setTableIcon(GeometryType.POLYGON, tableIconDefault);

    featureTableStyles.getFeatureStyleForFeatureRow(featureRow).useIcon().should.be.equal(true);
    featureTableStyles.setStyleForFeatureRow(featureRow, tableStyleDefault);
    featureTableStyles.getFeatureStyleForFeatureRow(featureRow).useIcon().should.be.equal(false);
  }));

  it('should test FeatureTableStyles functions', mochaAsync(async () => {
    // relationships do not yet exist, thus these will be null
    should.not.exist(featureTableStyles.getAllTableStyleIds());
    should.not.exist(featureTableStyles.getAllTableIconIds());
    should.not.exist(featureTableStyles.getAllStyleIds());
    should.not.exist(featureTableStyles.getAllIconIds());

    // setup relationships
    featureTableStyles.createTableStyleRelationship();
    featureTableStyles.createTableIconRelationship();
    featureTableStyles.createStyleRelationship();
    featureTableStyles.createIconRelationship();

    var featureDao = geopackage.getFeatureDao(featureTableName);
    var results = featureDao.queryForAll();
    var featureRow = featureDao.createObject(results[0]);

    // test table style default
    var tableStyleDefault = randomStyle(featureTableStyles);
    var tableIconDefault = randomIcon(featureTableStyles);
    featureTableStyles.setTableStyleDefault(tableStyleDefault);
    featureTableStyles.setTableStyle(GeometryType.POINT, tableStyleDefault);
    featureTableStyles.setTableIconDefault(tableIconDefault);
    featureTableStyles.setTableIcon(GeometryType.POINT, tableIconDefault);
    should.exist(featureTableStyles.getTableStyleDefault());
    var featureStyles = featureTableStyles.getTableFeatureStyles();
    featureTableStyles.setTableFeatureStyles(null);
    should.not.exist(featureTableStyles.getTableStyleDefault());
    featureTableStyles.setTableFeatureStyles(featureStyles);
    should.exist(featureTableStyles.getTableStyleDefault());
    featureTableStyles.setTableStyles(null);
    featureTableStyles.setTableIcons(null);
    should.not.exist(featureTableStyles.getTableStyles());
    should.not.exist(featureTableStyles.getTableIcons());
    featureTableStyles.setFeatureStylesForFeatureRow(featureRow, featureStyles);
    should.exist(featureTableStyles.getFeatureStylesForFeatureRow(featureRow));
    featureTableStyles.deleteStylesForFeatureRow(featureRow);
    featureTableStyles.deleteIconsForFeatureRow(featureRow);
    should.not.exist(featureTableStyles.getFeatureStylesForFeatureRow(featureRow));

    var featureStyle = new FeatureStyle(tableStyleDefault, tableIconDefault);
    featureTableStyles.setFeatureStyleForFeatureRow(featureRow, featureStyle);
    should.exist(featureTableStyles.getFeatureStyleForFeatureRow(featureRow));
    featureTableStyles.setFeatureStyleForFeatureRow(featureRow, null);
    should.not.exist(featureTableStyles.getFeatureStyleForFeatureRow(featureRow));
    featureTableStyles.setTableStyle(GeometryType.POINT, tableStyleDefault);
    should.exist(featureTableStyles.getTableStyle(GeometryType.POINT));
    featureTableStyles.setTableStyle(GeometryType.POINT, null);
    should.not.exist(featureTableStyles.getTableStyle(GeometryType.POINT));

    featureTableStyles.setTableIcon(GeometryType.POINT, tableIconDefault);
    should.exist(featureTableStyles.getTableIcon(GeometryType.POINT));
    featureTableStyles.setTableIcon(GeometryType.POINT, null);
    should.not.exist(featureTableStyles.getTableIcon(GeometryType.POINT));

    featureTableStyles.setTableStyleDefault(tableStyleDefault);
    featureTableStyles.setStyleDefaultForFeatureRow(featureRow, tableStyleDefault);
    should.exist(featureTableStyles.getTableStyleDefault());
    should.exist(featureTableStyles.getStyleDefaultForFeatureRow(featureRow));
    featureTableStyles.deleteAllStyles();
    should.not.exist(featureTableStyles.getTableStyleDefault());
    should.not.exist(featureTableStyles.getStyleDefaultForFeatureRow(featureRow));

    featureTableStyles.setTableIconDefault(tableIconDefault);
    featureTableStyles.setIconDefaultForFeatureRow(featureRow, tableStyleDefault);
    should.exist(featureTableStyles.getTableIconDefault());
    should.exist(featureTableStyles.getIconDefaultForFeatureRow(featureRow));
    featureTableStyles.deleteAllIcons();
    should.not.exist(featureTableStyles.getTableIconDefault());
    should.not.exist(featureTableStyles.getIconDefaultForFeatureRow(featureRow));

    featureTableStyles.setTableStyleDefault(tableStyleDefault);
    featureTableStyles.setTableIconDefault(tableIconDefault);
    should.exist(featureTableStyles.getTableStyleDefault());
    should.exist(featureTableStyles.getTableIconDefault());
    featureTableStyles.deleteTableFeatureStyles();
    should.not.exist(featureTableStyles.getTableStyleDefault());
    should.not.exist(featureTableStyles.getTableIconDefault());

    featureTableStyles.setTableStyleDefault(tableStyleDefault);
    should.exist(featureTableStyles.getTableStyleDefault());
    featureTableStyles.deleteTableStyles();
    should.not.exist(featureTableStyles.getTableStyleDefault());

    featureTableStyles.setTableIconDefault(tableIconDefault);
    should.exist(featureTableStyles.getTableIconDefault());
    featureTableStyles.deleteTableIcons();
    should.not.exist(featureTableStyles.getTableIconDefault());

    featureTableStyles.setTableStyleDefault(tableStyleDefault);
    should.exist(featureTableStyles.getTableStyleDefault());
    featureTableStyles.deleteTableStyleDefault();
    should.not.exist(featureTableStyles.getTableStyleDefault());

    featureTableStyles.setTableIconDefault(tableIconDefault);
    should.exist(featureTableStyles.getTableIconDefault());
    featureTableStyles.deleteTableIconDefault();
    should.not.exist(featureTableStyles.getTableIconDefault());

    featureTableStyles.setTableStyleDefault(tableStyleDefault);
    should.exist(featureTableStyles.getTableStyleDefault());
    featureTableStyles.deleteTableStyle(null);
    should.not.exist(featureTableStyles.getTableStyleDefault());

    featureTableStyles.setTableIconDefault(tableIconDefault);
    should.exist(featureTableStyles.getTableIconDefault());
    featureTableStyles.deleteTableIcon(null);
    should.not.exist(featureTableStyles.getTableIconDefault());

    featureTableStyles.setStyleDefaultForFeatureRow(featureRow, tableStyleDefault);
    featureTableStyles.setIconDefaultForFeatureRow(featureRow, tableStyleDefault);
    should.exist(featureTableStyles.getStyleDefaultForFeatureRow(featureRow));
    should.exist(featureTableStyles.getIconDefaultForFeatureRow(featureRow));
    featureTableStyles.deleteFeatureStyles();
    should.not.exist(featureTableStyles.getStyleDefaultForFeatureRow(featureRow));
    should.not.exist(featureTableStyles.getIconDefaultForFeatureRow(featureRow));

    featureTableStyles.setStyleDefaultForFeatureRow(featureRow, tableStyleDefault);
    should.exist(featureTableStyles.getStyleDefaultForFeatureRow(featureRow));
    featureTableStyles.deleteStyles();
    should.not.exist(featureTableStyles.getStyleDefaultForFeatureRow(featureRow));

    featureTableStyles.setIconDefaultForFeatureRow(featureRow, tableStyleDefault);
    should.exist(featureTableStyles.getIconDefaultForFeatureRow(featureRow));
    featureTableStyles.deleteIcons();
    should.not.exist(featureTableStyles.getIconDefaultForFeatureRow(featureRow));

    featureTableStyles.setFeatureStylesForFeatureRow(featureRow, null);
    featureTableStyles.setFeatureStyles(featureRow.id, null);
    featureTableStyles.setFeatureStyleForFeatureRow(featureRow, null);
    featureTableStyles.setFeatureStyleDefaultForFeatureRow(featureRow, null);
    featureTableStyles.setFeatureStyleForFeatureRowAndGeometryType(featureRow, null, null);
    featureTableStyles.setFeatureStyle(featureRow.id, null, null);
    featureTableStyles.setFeatureStyleDefault(featureRow.id, null);
    should.not.exist(featureTableStyles.getFeatureStyleDefaultForFeatureRow(featureRow));

    featureTableStyles.setStylesForFeatureRow(featureRow, null);
    featureTableStyles.setStyles(featureRow.id, null);
    featureTableStyles.setStyleForFeatureRow(featureRow, null);
    featureTableStyles.setStyle(featureRow.id, null, null);
    featureTableStyles.setStyleDefault(featureRow.id, null);
    should.not.exist(featureTableStyles.getStyleDefaultForFeatureRow(featureRow));
    featureTableStyles.deleteStylesForFeatureRow(featureRow);
    featureTableStyles.deleteStylesForFeatureId(featureRow.id);
    featureTableStyles.deleteStyleDefaultForFeatureRow(featureRow);
    featureTableStyles.deleteStyleDefault(featureRow.id);
    featureTableStyles.deleteStyleForFeatureRow(featureRow);
    featureTableStyles.deleteStyleForFeatureRowAndGeometryType(featureRow, null);
    featureTableStyles.deleteStyle(featureRow.id, null);

    featureTableStyles.setIconsForFeatureRow(featureRow, null);
    featureTableStyles.setIcons(featureRow.id, null);
    featureTableStyles.setIconForFeatureRow(featureRow, null);
    featureTableStyles.setIcon(featureRow.id, null, null);
    featureTableStyles.setIconDefault(featureRow.id, null);
    should.not.exist(featureTableStyles.getIconDefaultForFeatureRow(featureRow));
    featureTableStyles.deleteIconsForFeatureRow(featureRow);
    featureTableStyles.deleteIconsForFeatureId(featureRow.id);
    featureTableStyles.deleteIconDefaultForFeatureRow(featureRow);
    featureTableStyles.deleteIconDefault(featureRow.id);
    featureTableStyles.deleteIconForFeatureRow(featureRow);
    featureTableStyles.deleteIconForFeatureRowAndGeometryType(featureRow, null);
    featureTableStyles.deleteIcon(featureRow.id, null);

    featureStyles = new FeatureStyles();
    var styles = new Styles();
    styles.setDefault(tableStyleDefault);
    featureStyles.styles = styles;

    featureTableStyles.getAllTableStyleIds().length.should.be.equal(0);
    featureTableStyles.getAllTableIconIds().length.should.be.equal(0);
    featureTableStyles.getAllStyleIds().length.should.be.equal(0);
    featureTableStyles.getAllIconIds().length.should.be.equal(0);
  }));
});

import { default as testSetup } from '../../../../testSetup';
import { FeatureConverter } from '@ngageoint/simple-features-geojson-js';
import { GeoPackageDataType } from '../../../../../lib/db/geoPackageDataType';
import { FeatureColumn } from '../../../../../lib/features/user/featureColumn';
import { ContentsId } from '../../../../../lib/extension/nga/contents/contentsId';

var FeatureTableStyles = require('../../../../../lib/extension/nga/style/featureTableStyles').FeatureTableStyles,
  StyleMappingTable = require('../../../../../lib/extension/nga/style/styleMappingTable').StyleMappingTable,
  StyleTable = require('../../../../../lib/extension/nga/style/styleTable').StyleTable,
  Styles = require('../../../../../lib/extension/nga/style/styles').Styles,
  Canvas = require('../../../../../lib/canvas/canvas').Canvas,
  Icons = require('../../../../../lib/extension/nga/style/icons').Icons,
  FeatureStyles = require('../../../../../lib/extension/nga/style/featureStyles').FeatureStyles,
  FeatureStyle = require('../../../../../lib/extension/nga/style/featureStyle').FeatureStyle,
  IconTable = require('../../../../../lib/extension/nga/style/iconTable').IconTable,
  ImageUtils = require('../../../../../lib/image/imageUtils').ImageUtils,
  should = require('chai').should(),
  assert = require('assert'),
  path = require('path'),
  GeometryData = require('../../../../../lib/geom/geoPackageGeometryData').GeoPackageGeometryData,
  GeometryType = require('@ngageoint/simple-features-js').GeometryType,
  FeatureStyleExtension = require('../../../../../lib/extension/nga/style/featureStyleExtension').FeatureStyleExtension;

describe('StyleExtension Tests', function () {
  var testGeoPackage;
  var geoPackage;
  var featureTableName = 'feature_table';
  var featureTableStyles;
  var featureStyleExtension;
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

  var createRow = function (geoJson, name, featureDao) {
    var srs = featureDao.getSrs();
    var featureRow = featureDao.newRow();
    var geometryData = new GeometryData();
    geometryData.setSrsId(srs.getSrsId());
    var geometry = FeatureConverter.toSimpleFeaturesGeometry(geoJson);
    geometryData.setGeometry(geometry);
    featureRow.setGeometry(geometryData);
    featureRow.setValue('name', name);
    featureRow.setValue('_feature_id', name);
    featureRow.setValue('_properties_id', 'properties' + name);
    return featureDao.create(featureRow);
  };

  var randomIcon = function (featureTableStyles) {
    var iconRow = featureTableStyles.getIconDao().newRow();
    iconRow.setData(iconImageBuffer);
    iconRow.setContentType('image/png');
    iconRow.setName('Icon Name');
    iconRow.setDescription('Icon Description');
    iconRow.setWidth(Math.random() * iconImage.getWidth());
    iconRow.setHeight(Math.random() * iconImage.getHeight());
    iconRow.setAnchorU(Math.random());
    iconRow.setAnchorV(Math.random());
    return iconRow;
  };

  var randomStyle = function (featureTableStyles) {
    var styleRow = featureTableStyles.getStyleDao().newRow();
    styleRow.setName('Style Name');
    styleRow.setDescription('Style Description');
    styleRow.setColor(randomColor(), 1.0);
    styleRow.setFillColor(randomColor(), 1.0);
    styleRow.setWidth(1.0 + Math.random() * 3);
    return styleRow;
  };

  var randomColor = function () {
    var length = 6;
    var chars = '0123456789ABCDEF';
    var hex = '#';
    while (length--) hex += chars[(Math.random() * 16) | 0];
    return hex;
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
    const box = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-1, 1],
            [1, 1],
            [1, 3],
            [-1, 3],
            [-1, 1],
          ],
        ],
      },
      properties: {},
    };
    featureRowId = createRow(box, 'box', geoPackage.getFeatureDao(featureTableName));
    featureStyleExtension = new FeatureStyleExtension(geoPackage);
    featureStyleExtension.getOrCreateExtension(featureTableName);
    featureStyleExtension.getRelatedTables().getOrCreateExtension();
    featureStyleExtension.getContentsId().getOrCreateExtension();
    featureTableStyles = new FeatureTableStyles(geoPackage, featureTableName);

    iconImage = await ImageUtils.getImage(path.join(__dirname, '..', '..', '..', '..', 'fixtures', 'point.png'));

    iconImageBuffer = await loadTile(path.join(__dirname, '..', '..', '..', '..', 'fixtures', 'point.png'));
  });

  afterEach(async function () {
    try {
      geoPackage.close();
      Canvas.disposeImage(iconImage);
      await testSetup.deleteGeoPackage(testGeoPackage);
    } catch (e) {
      console.error(e);
    }
  });

  it('should create extension for feature table', function () {
    var extensions = geoPackage
      .getExtensionsDao()
      .queryByExtensionAndTableName(FeatureStyleExtension.EXTENSION_NAME, featureTableName);
    should.exist(extensions.length);
    if (extensions.length) {
      extensions.length.should.be.equal(1);
    }
  });

  it('should check if geoPackage has extension or not', function () {
    featureStyleExtension.has(featureTableName).should.be.equal(true);
    featureStyleExtension.has('not_valid_feature_table').should.be.equal(false);
    featureTableStyles.has().should.be.equal(true);
  });

  it('should return all feature tables with style extension', function () {
    featureStyleExtension.getTables().length.should.be.equal(1);
  });

  it('should get related tables extension', function () {
    should.exist(featureStyleExtension.getRelatedTables());
  });

  it('should get content id extension', function () {
    should.exist(featureStyleExtension.getContentsId());
  });

  it('should create relationships', function () {
    featureTableStyles.createRelationships();
    featureTableStyles.hasStyleRelationship().should.be.equal(true);
    featureTableStyles.hasTableStyleRelationship().should.be.equal(true);
    featureTableStyles.hasIconRelationship().should.be.equal(true);
    featureTableStyles.hasTableIconRelationship().should.be.equal(true);
    featureTableStyles.hasRelationship().should.be.equal(true);
    featureTableStyles.deleteRelationships();
    featureTableStyles.hasRelationship().should.be.equal(false);
  });

  it('should get table name', function () {
    featureTableStyles.getTableName().should.be.equal(featureTableName);
  });

  it('should delete all relationships', function () {
    featureTableStyles.createRelationships();
    featureTableStyles.deleteRelationships();
    featureTableStyles.hasRelationship().should.be.equal(false);
  });

  it('should create and delete style relationship', function () {
    featureTableStyles.createStyleRelationship();
    featureTableStyles.hasStyleRelationship().should.be.equal(true);
    featureTableStyles.deleteStyleRelationship();
    featureTableStyles.hasStyleRelationship().should.be.equal(false);
  });

  it('should create and delete table style relationship', function () {
    featureTableStyles.createTableStyleRelationship();
    featureTableStyles.hasTableStyleRelationship().should.be.equal(true);
    featureTableStyles.deleteTableStyleRelationship();
    featureTableStyles.hasTableStyleRelationship().should.be.equal(false);
  });

  it('should create and delete icon relationship', function () {
    featureTableStyles.createIconRelationship();
    featureTableStyles.hasIconRelationship().should.be.equal(true);
    featureTableStyles.deleteIconRelationship();
    featureTableStyles.hasIconRelationship().should.be.equal(false);
  });

  it('should create and delete table icon relationship', function () {
    featureTableStyles.createTableIconRelationship();
    featureTableStyles.hasTableIconRelationship().should.be.equal(true);
    featureTableStyles.deleteTableIconRelationship();
    featureTableStyles.hasTableIconRelationship().should.be.equal(false);
  });

  it('should create style relationship even if contentsIdExtension does not yet exist', function () {
    featureStyleExtension.getContentsId().removeExtension();
    featureTableStyles.createTableIconRelationship();
    featureTableStyles.hasTableIconRelationship().should.be.equal(true);
  });

  it('should delete all relationships', function () {
    featureTableStyles.createTableStyleRelationship();
    featureTableStyles.hasTableStyleRelationship().should.be.equal(true);
    featureStyleExtension.deleteAllRelationships();
    featureTableStyles.hasTableStyleRelationship().should.be.equal(false);
  });

  it('should verify styles do not yet exist', function () {
    should.not.exist(featureTableStyles.getTableFeatureStyles());
    should.not.exist(featureTableStyles.getTableStyles());
    should.not.exist(featureTableStyles.getCachedTableStyles());
    should.not.exist(featureTableStyles.getTableStyleDefault());
    should.not.exist(featureTableStyles.getTableStyle('GEOMETRY'));
    should.not.exist(featureTableStyles.getTableIcons());
    should.not.exist(featureTableStyles.getCachedTableIcons());
    should.not.exist(featureTableStyles.getTableIconDefault());
    should.not.exist(featureTableStyles.getTableIcon('GEOMETRY'));
    const featureDao = geoPackage.getFeatureDao(featureTableName);
    const featureRow = featureDao.queryForIdRow(featureRowId);
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

  it(
    'should test IconRow methods',
    mochaAsync(async () => {
      featureTableStyles.createTableIconRelationship();
      const pointIcon = randomIcon(featureTableStyles);
      featureTableStyles.setTableIcon(GeometryType.POINT, pointIcon);
      const retrievedIcon = featureTableStyles.getTableIcon(GeometryType.POINT);
      retrievedIcon.getName().should.be.equal('Icon Name');
      retrievedIcon.getDescription().should.be.equal('Icon Description');
      retrievedIcon.getWidth().should.be.below(retrievedIcon.getWidth() + 0.1);
      retrievedIcon.getHeight().should.be.below(retrievedIcon.getHeight() + 0.1);
      retrievedIcon.getAnchorUOrDefault().should.be.below(1.1);
      retrievedIcon.getAnchorVOrDefault().should.be.below(1.1);
      retrievedIcon.getDerivedWidth().should.be.equal(retrievedIcon.getWidth());
      retrievedIcon.getDerivedHeight().should.be.equal(retrievedIcon.getHeight());
      const retrievedIconWidth = retrievedIcon.getWidth();
      const retrievedIconHeight = retrievedIcon.getHeight();
      const retrievedIconAnchorU = retrievedIcon.getAnchorU();
      const retrievedIconAnchorV = retrievedIcon.getAnchorV();
      retrievedIcon.setAnchorU(null);
      retrievedIcon.setAnchorV(null);
      retrievedIcon.getAnchorUOrDefault().should.be.equal(0.5);
      retrievedIcon.getAnchorVOrDefault().should.be.equal(1.0);
      retrievedIcon.setAnchorU(retrievedIconAnchorU);
      retrievedIcon.setAnchorV(retrievedIconAnchorV);
      retrievedIcon.setWidth(null);
      retrievedIcon.setHeight(null);
      retrievedIcon.getDerivedWidth().should.be.equal(iconImage.getWidth());
      retrievedIcon.getDerivedHeight().should.be.equal(iconImage.getHeight());
      retrievedIcon.setWidth(retrievedIconWidth);
      retrievedIcon.setHeight(null);
      retrievedIcon.getDerivedWidth().should.be.equal(retrievedIconWidth);
      retrievedIcon
        .getDerivedHeight()
        .should.be.equal(iconImage.getHeight() * (retrievedIconWidth / iconImage.getWidth()));
      retrievedIcon.setWidth(null);
      retrievedIcon.setHeight(retrievedIconHeight);
      retrievedIcon
        .getDerivedWidth()
        .should.be.equal(iconImage.getWidth() * (retrievedIconHeight / iconImage.getHeight()));
      retrievedIcon.getDerivedHeight().should.be.equal(retrievedIconHeight);
      retrievedIcon.setWidth(retrievedIconWidth);
      retrievedIcon.setHeight(retrievedIconHeight);
      retrievedIcon.validateAnchor(null);
      retrievedIcon.validateAnchor(0.0);
      retrievedIcon.validateAnchor(0.5);
      retrievedIcon.validateAnchor(1.0);
      let badAnchor = -1.0;
      assert.throws(
        () => {
          retrievedIcon.validateAnchor(badAnchor);
        },
        Error,
        'Anchor must be set inclusively between 0.0 and 1.0, invalid value: ' + badAnchor,
      );
      badAnchor = 1.1;
      assert.throws(
        () => {
          retrievedIcon.validateAnchor(badAnchor);
        },
        Error,
        'Anchor must be set inclusively between 0.0 and 1.0, invalid value: ' + badAnchor,
      );
    }),
  );

  it(
    'should test StyleRow methods',
    mochaAsync(async () => {
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
      assert.throws(
        () => {
          rS.setHexColor(badColor);
        },
        Error,
        'Color must be in hex format #RRGGBB or #RGB, invalid value: ' + badColor,
      );
      assert.throws(
        () => {
          rS.setFillHexColor(badColor);
        },
        Error,
        'Color must be in hex format #RRGGBB or #RGB, invalid value: ' + badColor,
      );
      var badOpacity = 2.0;
      assert.throws(
        () => {
          rS.setOpacity(badOpacity);
        },
        Error,
        'Opacity must be set inclusively between 0.0 and 1.0, invalid value: ' + badOpacity,
      );
      assert.throws(
        () => {
          rS.setFillOpacity(badOpacity);
        },
        Error,
        'Opacity must be set inclusively between 0.0 and 1.0, invalid value: ' + badOpacity,
      );
      badOpacity = -2.0;
      assert.throws(
        () => {
          rS.setOpacity(badOpacity);
        },
        Error,
        'Opacity must be set inclusively between 0.0 and 1.0, invalid value: ' + badOpacity,
      );
      assert.throws(
        () => {
          rS.setFillOpacity(badOpacity);
        },
        Error,
        'Opacity must be set inclusively between 0.0 and 1.0, invalid value: ' + badOpacity,
      );
      rS.setHexColor('000000');
      rS.setFillHexColor('#000000');
      rS.setOpacity(1.0);
      rS.setFillOpacity(0.0);
      rS.getColor().toUpperCase().should.be.equal('#000000FF');
      rS.getFillColor().toUpperCase().should.be.equal('#00000000');
      rS.getOpacityOrDefault().should.be.equal(1.0);
      rS.getFillOpacityOrDefault().should.be.equal(0.0);
      var badWidth = -1.0;
      assert.throws(
        () => {
          rS.setWidth(badWidth);
        },
        Error,
        'Width must be greater than or equal to 0.0, invalid value: ' + badWidth,
      );

      rS.setWidth(2.0);
      rS.getWidth().should.be.equal(2.0);
      rS.getWidthOrDefault().should.be.equal(2.0);
      rS.setWidth(null);
      rS.getWidthOrDefault().should.be.equal(1.0);
    }),
  );

  it(
    'should test Styles and Icons methods',
    mochaAsync(async () => {
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
    }),
  );

  it(
    'should test FeatureStyles methods',
    mochaAsync(async () => {
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
    }),
  );

  it(
    'should test IconTable, StyleTable, and StyleMappingTable indices',
    mochaAsync(async () => {
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
    }),
  );

  it(
    'should create, access, and modify styles and icons',
    mochaAsync(async () => {
      should.not.exist(featureTableStyles.getStyleMappingDao());
      should.not.exist(featureTableStyles.getTableStyleMappingDao());
      should.not.exist(featureTableStyles.getIconMappingDao());
      should.not.exist(featureTableStyles.getTableIconMappingDao());

      featureTableStyles.createTableStyleRelationship();
      // test table style default
      var tableStyleDefault = randomStyle(featureTableStyles);
      featureTableStyles.setTableStyleDefault(tableStyleDefault);
      featureStyleExtension.has(featureTableName).should.be.equal(true);
      featureTableStyles.has().should.be.equal(true);
      featureTableStyles.hasTableStyleRelationship().should.be.equal(true);
      geoPackage.isTable(StyleTable.TABLE_NAME).should.be.equal(true);
      geoPackage.isTable(ContentsId.TABLE_NAME).should.be.equal(true);
      geoPackage
        .isTable(
          featureTableStyles
            .getFeatureStyleExtension()
            .getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_TABLE_STYLE, featureTableName),
        )
        .should.be.equal(true);
      should.exist(featureTableStyles.getTableStyleDefault());

      // test geometry style
      var polygonStyle = randomStyle(featureTableStyles);
      featureTableStyles.setTableStyle(GeometryType.POLYGON, polygonStyle);
      var featureStyles = featureTableStyles.getTableFeatureStyles();
      should.exist(featureStyles);
      should.exist(featureStyles.getStyles());
      should.not.exist(featureStyles.getIcons());
      var tableStyles = featureTableStyles.getTableStyles();
      should.exist(tableStyles);
      should.exist(tableStyles.getDefault());
      tableStyles.getDefault().getId().should.be.equal(tableStyleDefault.getId());
      featureTableStyles.getTableStyle(null).getId().should.be.equal(tableStyleDefault.getId());
      featureTableStyles.getTableStyle(GeometryType.POLYGON).getId().should.be.equal(polygonStyle.getId());

      featureTableStyles.hasTableIconRelationship().should.be.equal(false);
      geoPackage
        .isTable(
          featureTableStyles
            .getFeatureStyleExtension()
            .getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_TABLE_ICON, featureTableName),
        )
        .should.be.equal(false);
      // Create table icon relationship
      featureTableStyles.hasTableIconRelationship().should.be.equal(false);

      featureTableStyles.createTableIconRelationship();
      featureTableStyles.hasTableIconRelationship().should.be.equal(true);

      var tableIconDefault = randomIcon(featureTableStyles);
      featureTableStyles.setTableIconDefault(tableIconDefault);
      var pointIcon = randomIcon(featureTableStyles);
      featureTableStyles.setTableIcon(GeometryType.POINT, pointIcon);
      geoPackage.isTable(IconTable.TABLE_NAME).should.be.equal(true);
      geoPackage
        .isTable(
          featureTableStyles
            .getFeatureStyleExtension()
            .getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_TABLE_ICON, featureTableName),
        )
        .should.be.equal(true);

      featureStyles = featureTableStyles.getTableFeatureStyles();
      should.exist(featureStyles);
      should.exist(featureStyles.styles);
      var tableIcons = featureStyles.icons;
      should.exist(tableIcons);
      should.exist(tableIcons.getDefault());
      tableIconDefault.getId().should.be.equal(tableIcons.getDefault().getId());
      tableIconDefault.getId().should.be.equal(featureTableStyles.getTableIcon(null).getId());
      pointIcon.getId().should.be.equal(featureTableStyles.getTableIcon(GeometryType.POINT).getId());

      featureTableStyles.hasStyleRelationship().should.be.equal(false);
      geoPackage
        .isTable(
          featureTableStyles
            .getFeatureStyleExtension()
            .getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_STYLE, featureTableName),
        )
        .should.be.equal(false);
      featureTableStyles.hasIconRelationship().should.be.equal(false);
      geoPackage
        .isTable(
          featureTableStyles
            .getFeatureStyleExtension()
            .getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_ICON, featureTableName),
        )
        .should.be.equal(false);

      var types = [
        GeometryType.POINT,
        GeometryType.POLYGON,
        GeometryType.LINESTRING,
        GeometryType.MULTIPOINT,
        GeometryType.MULTIPOLYGON,
        GeometryType.MULTILINESTRING,
      ];
      // Create style and icon relationship
      featureTableStyles.createStyleRelationship();
      featureTableStyles.hasStyleRelationship().should.be.equal(true);
      geoPackage
        .isTable(
          featureTableStyles
            .getFeatureStyleExtension()
            .getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_STYLE, featureTableName),
        )
        .should.be.equal(true);

      featureTableStyles.createIconRelationship();
      featureTableStyles.hasIconRelationship().should.be.equal(true);
      geoPackage
        .isTable(
          featureTableStyles
            .getFeatureStyleExtension()
            .getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_ICON, featureTableName),
        )
        .should.be.equal(true);
      var featureRow, style, icon, typeStyle, typeIcon;
      var i, j, t;
      var featureResultsStyles = {};
      var featureResultsIcons = {};
      var featureDao = geoPackage.getFeatureDao(featureTableName);
      let features = [];
      let resultSet = featureDao.queryForAll();
      while (resultSet.moveToNext()) {
        features.push(resultSet.getRow());
      }
      resultSet.close();
      for (i = 0; i < features.length; i++) {
        featureRow = features[i];
        var featureStyle = featureTableStyles.getFeatureStyleDefaultForFeatureRow(featureRow);
        featureStyle.style.getId().should.be.equal(tableStyleDefault.getId());
        featureStyle.icon.getId().should.be.equal(tableIconDefault.getId());

        // verify that if no icon or style exist for the feature, that the default for the table is used
        featureStyleExtension
          .getStyle(featureTableName, featureRow.getId(), null, true)
          .getId()
          .should.be.equal(tableStyleDefault.getId());
        featureStyleExtension
          .getIcon(featureTableName, featureRow.getId(), null, true)
          .getId()
          .should.be.equal(tableIconDefault.getId());

        // Feature Styles
        var featureRowStyles = {};
        featureResultsStyles[featureRow.getId()] = featureRowStyles;
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
        featureResultsIcons[featureRow.getId()] = featureRowIcons;
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

      resultSet = featureDao.queryForAll();
      features = [];
      while (resultSet.moveToNext()) {
        features.push(resultSet.getRow());
      }
      resultSet.close();
      for (i = 0; i < features.length; i++) {
        const featureRow = features[i];
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

      featureStyleExtension.deleteRelationships(featureTableName);

      featureStyleExtension.has(featureTableName).should.be.equal(false);
      geoPackage.isTable(StyleTable.TABLE_NAME).should.be.equal(true);
      geoPackage.isTable(IconTable.TABLE_NAME).should.be.equal(true);
      geoPackage.isTable(ContentsId.TABLE_NAME).should.be.equal(true);
      featureStyleExtension.removeExtension();
      geoPackage.isTable(StyleTable.TABLE_NAME).should.be.equal(false);
      geoPackage.isTable(IconTable.TABLE_NAME).should.be.equal(false);
      geoPackage.isTable(ContentsId.TABLE_NAME).should.be.equal(true);
      var contentsIdExtension = featureStyleExtension.getContentsId();
      contentsIdExtension.count().should.be.equal(1);
      contentsIdExtension.deleteIds().should.be.equal(1);
      contentsIdExtension.removeExtension();
      geoPackage.isTable(ContentsId.TABLE_NAME).should.be.equal(false);
    }),
  );

  it(
    'should test featureStyles useIcon functionality',
    mochaAsync(async () => {
      // setup relationships
      featureTableStyles.createTableStyleRelationship();
      featureTableStyles.createTableIconRelationship();
      featureTableStyles.createStyleRelationship();
      featureTableStyles.createIconRelationship();

      var featureDao = geoPackage.getFeatureDao(featureTableName);
      var resultSet = featureDao.queryForAll();
      resultSet.moveToNext();
      var featureRow = resultSet.getRow();
      resultSet.close();

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
    }),
  );

  it(
    'should test FeatureTableStyles functions',
    mochaAsync(async () => {
      try {
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

        var featureDao = geoPackage.getFeatureDao(featureTableName);
        var resultSet = featureDao.queryForAll();
        resultSet.moveToNext();
        var featureRow = resultSet.getRow();
        resultSet.close();

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
        featureTableStyles.setFeatureStyles(featureRow.getId(), null);
        featureTableStyles.setFeatureStyleForFeatureRow(featureRow, null);
        featureTableStyles.setFeatureStyleDefaultForFeatureRow(featureRow, null);
        featureTableStyles.setFeatureStyleForFeatureRowAndGeometryType(featureRow, null, null);
        featureTableStyles.setFeatureStyle(featureRow.getId(), null, null);
        featureTableStyles.setFeatureStyleDefault(featureRow.getId(), null);
        should.not.exist(featureTableStyles.getFeatureStyleDefaultForFeatureRow(featureRow));

        featureTableStyles.setStylesForFeatureRow(featureRow, null);
        featureTableStyles.setStyles(featureRow.getId(), null);
        featureTableStyles.setStyleForFeatureRow(featureRow, null);
        featureTableStyles.setStyle(featureRow.getId(), null, null);
        featureTableStyles.setStyleDefault(featureRow.getId(), null);
        should.not.exist(featureTableStyles.getStyleDefaultForFeatureRow(featureRow));
        featureTableStyles.deleteStylesForFeatureRow(featureRow);
        featureTableStyles.deleteStylesForFeatureId(featureRow.getId());
        featureTableStyles.deleteStyleDefaultForFeatureRow(featureRow);
        featureTableStyles.deleteStyleDefault(featureRow.getId());
        featureTableStyles.deleteStyleForFeatureRow(featureRow);
        featureTableStyles.deleteStyleForFeatureRowAndGeometryType(featureRow, null);
        featureTableStyles.deleteStyle(featureRow.getId(), null);

        featureTableStyles.setIconsForFeatureRow(featureRow, null);
        featureTableStyles.setIcons(featureRow.getId(), null);
        featureTableStyles.setIconForFeatureRow(featureRow, null);
        featureTableStyles.setIcon(featureRow.getId(), null, null);
        featureTableStyles.setIconDefault(featureRow.getId(), null);
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
      } catch (e) {
        console.error(e);
      }
    }),
  );
});

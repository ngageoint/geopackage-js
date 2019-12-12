/**
 * @memberOf module:extension/style
 * @class FeatureStyleExtension
 */
import FeatureStyles from './featureStyles';
import FeatureStyle from './featureStyle';
import Styles from './styles';
import Icons from './icons';

/**
 * Feature Table Styles, styles and icons for an individual feature table
 * @param  {module:geoPackage~GeoPackage} geoPackage GeoPackage object
 * @param {String} tableName
 * @constructor
 */
export class FeatureTableStyles {
  featureStyleExtension: any;
  cachedTableFeatureStyles: FeatureStyles;
  tableName: any;
  constructor(geoPackage, tableName) {
    this.featureStyleExtension = geoPackage.getFeatureStyleExtension();
    this.cachedTableFeatureStyles = new FeatureStyles();
    this.tableName = tableName;
  }
  /**
	 * Get the feature style extension
	 * @return {module:extension/style.FeatureStyleExtension} feature style extension
	 */
  getFeatureStyleExtension() {
    return this.featureStyleExtension;
  }
  /**
	 * Get the feature table name
	 * @return {String} feature table name
	 */
  getTableName() {
    return this.tableName;
  }
  /**
	 * Determine if the GeoPackage has the extension for the table
	 * @return {Boolean} true if has extension
	 */
  has() {
    return this.featureStyleExtension.has(this.tableName);
  }
  /**
	 * Create style, icon, table style, and table icon relationships for the
	 * feature table
	 * @return {Promise}
	 */
  createRelationships() {
    return this.featureStyleExtension.createRelationships(this.tableName);
  }
  /**
	 * Check if feature table has a style, icon, table style, or table icon
	 * relationships
	 * @return {Boolean} true if has a relationship
	 */
  hasRelationship() {
    return this.featureStyleExtension.hasRelationship(this.tableName);
  }
  /**
	 * Create a style relationship for the feature table
	 * @return {Promise}
	 */
  createStyleRelationship() {
    return this.featureStyleExtension.createStyleRelationship(this.tableName);
  }
  /**
	 * Determine if a style relationship exists for the feature table
	 * @return {Boolean} true if relationship exists
	 */
  hasStyleRelationship() {
    return this.featureStyleExtension.hasStyleRelationship(this.tableName);
  }
  /**
	 * Create a feature table style relationship
	 * @return {Promise}
	 */
  createTableStyleRelationship() {
    return this.featureStyleExtension.createTableStyleRelationship(this.tableName);
  }
  /**
	 * Determine if feature table style relationship exists
	 *
	 * @return {Boolean} true if relationship exists
	 */
  hasTableStyleRelationship() {
    return this.featureStyleExtension.hasTableStyleRelationship(this.tableName);
  }
  /**
	 * Create an icon relationship for the feature table
	 * @return {Promise}
	 */
  createIconRelationship() {
    return this.featureStyleExtension.createIconRelationship(this.tableName);
  }
  /**
	 * Determine if an icon relationship exists for the feature table
	 * @return {Boolean} true if relationship exists
	 */
  hasIconRelationship() {
    return this.featureStyleExtension.hasIconRelationship(this.tableName);
  }
  /**
	 * Create a feature table icon relationship
	 * @return {Promise}
	 */
  createTableIconRelationship() {
    return this.featureStyleExtension.createTableIconRelationship(this.tableName);
  }
  /**
	 * Determine if feature table icon relationship exists
	 * @return {Boolean} true if relationship exists
	 */
  hasTableIconRelationship() {
    return this.featureStyleExtension.hasTableIconRelationship(this.tableName);
  }
  /**
	 * Delete the style and icon table and row relationships for the feature
	 * table
	 */
  deleteRelationships() {
    this.featureStyleExtension.deleteRelationships(this.tableName);
  }
  /**
	 * Delete a style relationship for the feature table
	 */
  deleteStyleRelationship() {
    this.featureStyleExtension.deleteStyleRelationship(this.tableName);
  }
  /**
	 * Delete a table style relationship for the feature table
	 */
  deleteTableStyleRelationship() {
    this.featureStyleExtension.deleteTableStyleRelationship(this.tableName);
  }
  /**
	 * Delete a icon relationship for the feature table
	 */
  deleteIconRelationship() {
    this.featureStyleExtension.deleteIconRelationship(this.tableName);
  }
  /**
	 * Delete a table icon relationship for the feature table
	 */
  deleteTableIconRelationship() {
    this.featureStyleExtension.deleteTableIconRelationship(this.tableName);
  }
  /**
	 * Get a Style Mapping DAO
	 * @return {module:extension/style.StyleMappingDao} style mapping DAO
	 */
  getStyleMappingDao() {
    return this.featureStyleExtension.getStyleMappingDao(this.tableName);
  }
  /**
	 * Get a Table Style Mapping DAO
	 * @return {module:extension/style.StyleMappingDao} table style mapping DAO
	 */
  getTableStyleMappingDao() {
    return this.featureStyleExtension.getTableStyleMappingDao(this.tableName);
  }
  /**
	 * Get a Icon Mapping DAO
	 * @return {module:extension/style.StyleMappingDao} icon mapping DAO
	 */
  getIconMappingDao() {
    return this.featureStyleExtension.getIconMappingDao(this.tableName);
  }
  /**
	 * Get a Table Icon Mapping DAO
	 * @return {module:extension/style.StyleMappingDao} table icon mapping DAO
	 */
  getTableIconMappingDao() {
    return this.featureStyleExtension.getTableIconMappingDao(this.tableName);
  }
  /**
	 * Get a style DAO
	 * @return {module:extension/style.StyleDao} style DAO
	 */
  getStyleDao() {
    return this.featureStyleExtension.getStyleDao();
  }
  /**
	 * Get a icon DAO
	 * @return {module:extension/style.IconDao} icon DAO
	 */
  getIconDao() {
    return this.featureStyleExtension.getIconDao();
  }
  /**
	 * Get the table feature styles
	 * @return {module:extension/style.FeatureStyles} table feature styles or null
	 */
  getTableFeatureStyles() {
    return this.featureStyleExtension.getTableFeatureStyles(this.tableName);
  }
  /**
	 * Get the table styles
	 * @return {module:extension/style.Styles} table styles or null
	 */
  getTableStyles() {
    return this.featureStyleExtension.getTableStyles(this.tableName);
  }
  /**
	 * Get the cached table styles, querying and caching if needed
	 * @return {module:extension/style.Styles} cached table styles
	 */
  getCachedTableStyles() {
    var styles = this.cachedTableFeatureStyles.getStyles();
    if (styles === null) {
      styles = this.cachedTableFeatureStyles.getStyles();
      if (styles === null) {
        styles = this.getTableStyles();
        if (styles === null) {
          styles = new Styles();
        }
        this.cachedTableFeatureStyles.setStyles(styles);
      }
    }
    if (styles.isEmpty()) {
      styles = null;
    }
    return styles;
  }
  /**
	 * Get the table style of the geometry type
	 * @param {String} geometryType geometry type
	 * @return {module:extension/style.StyleRow} style row
	 */
  getTableStyle(geometryType) {
    return this.featureStyleExtension.getTableStyle(this.tableName, geometryType);
  }
  /**
	 * Get the table style default
	 * @return {module:extension/style.StyleRow} style row
	 */
  getTableStyleDefault() {
    return this.featureStyleExtension.getTableStyleDefault(this.tableName);
  }
  /**
	 * Get the table icons
	 * @return {module:extension/style.Icons} table icons or null
	 */
  getTableIcons() {
    return this.featureStyleExtension.getTableIcons(this.tableName);
  }
  /**
	 * Get the cached table icons, querying and caching if needed
	 * @return {module:extension/style.Icons} cached table icons
	 */
  getCachedTableIcons() {
    var icons = this.cachedTableFeatureStyles.getIcons();
    if (icons === null) {
      icons = this.cachedTableFeatureStyles.getIcons();
      if (icons === null) {
        icons = this.getTableIcons();
        if (icons === null) {
          icons = new Icons();
        }
        this.cachedTableFeatureStyles.setIcons(icons);
      }
    }
    if (icons.isEmpty()) {
      icons = null;
    }
    return icons;
  }
  /**
	 * Get the table icon of the geometry type
	 * @param {String} geometryType geometry type
	 * @return {module:extension/style.IconRow} icon row
	 */
  getTableIcon(geometryType) {
    return this.featureStyleExtension.getTableIcon(this.tableName, geometryType);
  }
  /**
	 * Get the table icon default
	 * @return {module:extension/style.IconRow} icon row
	 */
  getTableIconDefault() {
    return this.featureStyleExtension.getTableIconDefault(this.tableName);
  }
  /**
	 * Get the feature styles for the feature row
	 *
	 * @param {module:features/user/featureRow} featureRow feature row
	 * @return {module:extension/style.FeatureStyles} feature styles or null
	 */
  getFeatureStylesForFeatureRow(featureRow) {
    return this.featureStyleExtension.getFeatureStylesForFeatureRow(featureRow);
  }
  /**
	 * Get the feature styles for the feature id
	 *
	 * @param {Number} featureId feature id
	 * @return {module:extension/style.FeatureStyles} feature styles or null
	 */
  getFeatureStyles(featureId) {
    return this.featureStyleExtension.getFeatureStyles(this.tableName, featureId);
  }
  /**
	 * Get the feature style (style and icon) of the feature row, searching in
	 * order: feature geometry type style or icon, feature default style or
	 * icon, table geometry type style or icon, table default style or icon
	 *
	 * @param {module:features/user/featureRow} featureRow feature row
	 * @return {module:extension/style.FeatureStyle} feature style
	 */
  getFeatureStyleForFeatureRow(featureRow) {
    return this.getFeatureStyleForFeatureRowAndGeometryType(featureRow, featureRow.getGeometryType());
  }
  /**
	 * Get the feature style (style and icon) of the feature row with the
	 * provided geometry type, searching in order: feature geometry type style
	 * or icon, feature default style or icon, table geometry type style or
	 * icon, table default style or icon
	 *
	 * @param {module:features/user/featureRow} featureRow feature row
	 * @param {String} geometryType geometry type
	 * @return {module:extension/style.FeatureStyle} feature style
	 */
  getFeatureStyleForFeatureRowAndGeometryType(featureRow, geometryType) {
    return this.getFeatureStyle(featureRow.getId(), geometryType);
  }
  /**
	 * Get the feature style default (style and icon) of the feature row,
	 * searching in order: feature default style or icon, table default style or
	 * icon
	 *
	 * @param {module:features/user/featureRow} featureRow feature row
	 * @return {module:extension/style.FeatureStyle} feature style
	 */
  getFeatureStyleDefaultForFeatureRow(featureRow) {
    return this.getFeatureStyle(featureRow.getId(), null);
  }
  /**
	 * Get the feature style (style and icon) of the feature, searching in
	 * order: feature geometry type style or icon, feature default style or
	 * icon, table geometry type style or icon, table default style or icon
	 *
	 * @param {Number} featureId feature id
	 * @param {String} geometryType geometry type
	 * @return {module:extension/style.FeatureStyle} feature style
	 */
  getFeatureStyle(featureId, geometryType) {
    var featureStyle = null;
    var style = this.getStyle(featureId, geometryType);
    var icon = this.getIcon(featureId, geometryType);
    if (style != null || icon != null) {
      featureStyle = new FeatureStyle(style, icon);
    }
    return featureStyle;
  }
  /**
	 * Get the feature style (style and icon) of the feature, searching in
	 * order: feature geometry type style or icon, feature default style or
	 * icon, table geometry type style or icon, table default style or icon
	 *
	 * @param {Number} featureId feature id
	 * @return {module:extension/style.FeatureStyle} feature style
	 */
  getFeatureStyleDefault(featureId) {
    return this.getFeatureStyle(featureId, null);
  }
  /**
	 * Get the styles for the feature row
	 *
	 * @param {module:features/user/featureRow} featureRow feature row
	 * @return {module:extension/style.Styles} styles or null
	 */
  getStylesForFeatureRow(featureRow) {
    return this.featureStyleExtension.getStylesForFeatureRow(featureRow);
  }
  /**
	 * Get the styles for the feature id
	 *
	 * @param {Number} featureId feature id
	 * @return {module:extension/style.Styles}  styles or null
	 */
  getStylesForFeatureId(featureId) {
    return this.featureStyleExtension.getStylesForFeatureId(this.tableName, featureId);
  }
  /**
	 * Get the style of the feature row, searching in order: feature geometry
	 * type style, feature default style, table geometry type style, table
	 * default style
	 *
	 * @param {module:features/user/featureRow} featureRow feature row
	 * @return {module:extension/style.StyleRow} style row
	 */
  getStyleForFeatureRow(featureRow) {
    return this.getStyleForFeatureRowAndGeometryType(featureRow, featureRow.getGeometryType());
  }
  /**
	 * Get the style of the feature row with the provided geometry type,
	 * searching in order: feature geometry type style, feature default style,
	 * table geometry type style, table default style
	 *
	 * @param {module:features/user/featureRow} featureRow feature row
	 * @param {String} geometryType geometry type
	 * @return {module:extension/style.StyleRow} style row
	 */
  getStyleForFeatureRowAndGeometryType(featureRow, geometryType) {
    return this.getStyle(featureRow.getId(), geometryType);
  }
  /**
	 * Get the default style of the feature row, searching in order: feature
	 * default style, table default style
	 *
	 * @param {module:features/user/featureRow} featureRow feature row
	 * @return {module:extension/style.StyleRow} style row
	 */
  getStyleDefaultForFeatureRow(featureRow) {
    return this.getStyle(featureRow.getId(), null);
  }
  /**
	 * Get the style of the feature, searching in order: feature geometry type
	 * style, feature default style, table geometry type style, table default
	 * style
	 *
	 * @param {Number} featureId feature id
	 * @param {String} geometryType geometry type
	 * @return {module:extension/style.StyleRow} style row
	 */
  getStyle(featureId, geometryType) {
    var styleRow = this.featureStyleExtension.getStyle(this.tableName, featureId, geometryType, false);
    if (styleRow === null) {
      // Table Style
      var styles = this.getCachedTableStyles();
      if (styles != null) {
        styleRow = styles.getStyle(geometryType);
      }
    }
    return styleRow;
  }
  /**
	 * Get the default style of the feature, searching in order: feature default
	 * style, table default style
	 *
	 * @param {Number} featureId feature id
	 * @return {module:extension/style.StyleRow} style row
	 */
  getStyleDefault(featureId) {
    return this.getStyle(featureId, null);
  }
  /**
	 * Get the icons for the feature row
	 *
	 * @param {module:features/user/featureRow} featureRow feature row
	 * @return {module:extension/style.Icons} icons or null
	 */
  getIconsForFeatureRow(featureRow) {
    return this.featureStyleExtension.getIconsForFeatureRow(featureRow);
  }
  /**
	 * Get the icons for the feature id
	 *
	 * @param {Number} featureId feature id
	 * @return {module:extension/style.Icons} icons or null
	 */
  getIconsForFeatureId(featureId) {
    return this.featureStyleExtension.getIconsForFeatureId(this.tableName, featureId);
  }
  /**
	 * Get the icon of the feature row, searching in order: feature geometry
	 * type icon, feature default icon, table geometry type icon, table default
	 * icon
	 *
	 * @param {module:features/user/featureRow} featureRow feature row
	 * @return {module:extension/style.IconRow} icon row
	 */
  getIconForFeatureRow(featureRow) {
    return this.getIconForFeatureRowAndGeometryType(featureRow, featureRow.getGeometryType());
  }
  /**
	 * Get the icon of the feature row with the provided geometry type,
	 * searching in order: feature geometry type icon, feature default icon,
	 * table geometry type icon, table default icon
	 *
	 * @param {module:features/user/featureRow} featureRow feature row
	 * @param {String} geometryType geometry type
	 * @return {module:extension/style.IconRow} icon row
	 */
  getIconForFeatureRowAndGeometryType(featureRow, geometryType) {
    return this.getIcon(featureRow.getId(), geometryType);
  }
  /**
	 * Get the default icon of the feature row, searching in order: feature
	 * default icon, table default icon
	 *
	 * @param {module:features/user/featureRow} featureRow feature row
	 * @return {module:extension/style.IconRow} icon row
	 */
  getIconDefaultForFeatureRow(featureRow) {
    return this.getIcon(featureRow.getId(), null);
  }
  /**
	 * Get the icon of the feature, searching in order: feature geometry type
	 * icon, feature default icon, table geometry type icon, table default icon
	 *
	 * @param {Number} featureId feature id
	 * @param {String} geometryType geometry type
	 * @return {module:extension/style.IconRow} icon row
	 */
  getIcon(featureId, geometryType) {
    var iconRow = this.featureStyleExtension.getIcon(this.tableName, featureId, geometryType, false);
    if (iconRow === null) {
      // Table Icon
      var icons = this.getCachedTableIcons();
      if (icons != null) {
        iconRow = icons.getIcon(geometryType);
      }
    }
    return iconRow;
  }
  /**
	 * Get the default icon of the feature, searching in order: feature default
	 * icon, table default icon
	 *
	 * @param {Number} featureId feature id
	 * @return {module:extension/style.IconRow} icon row
	 */
  getIconDefault(featureId) {
    return this.getIcon(featureId, null);
  }
  /**
	 * Set the feature table default feature styles
	 *
	 * @param {module:extension/style.FeatureStyles} featureStyles default feature styles
	 * @return {Promise}
	 */
  setTableFeatureStyles(featureStyles) {
    return this.featureStyleExtension.setTableFeatureStyles(this.tableName, featureStyles).then(function () {
      this.clearCachedTableFeatureStyles();
    }.bind(this));
  }
  /**
	 * Set the feature table default styles
	 *
	 * @param {module:extension/style.Styles} styles default styles
	 * @return {Promise}
	 */
  setTableStyles(styles) {
    return this.featureStyleExtension.setTableStyles(this.tableName, styles).then(function () {
      this.clearCachedTableStyles();
    }.bind(this));
  }
  /**
	 * Set the feature table style default
	 *
	 * @param {module:extension/style.StyleRow} style style row
	 * @return {Promise}
	 */
  setTableStyleDefault(style) {
    return this.featureStyleExtension.setTableStyleDefault(this.tableName, style).then(function () {
      this.clearCachedTableStyles();
    }.bind(this));
  }
  /**
	 * Set the feature table style for the geometry type
	 *
	 * @param {String} geometryType geometry type
	 * @param {module:extension/style.StyleRow} style style row
	 * @return {Promise}
	 */
  setTableStyle(geometryType, style) {
    return this.featureStyleExtension.setTableStyle(this.tableName, geometryType, style).then(function () {
      this.clearCachedTableStyles();
    }.bind(this));
  }
  /**
	 * Set the feature table default icons
	 *
	 * @param {module:extension/style.Icons} icons default icons
	 * @return {Promise}
	 */
  setTableIcons(icons) {
    return this.featureStyleExtension.setTableIcons(this.tableName, icons).then(function () {
      this.clearCachedTableIcons();
    }.bind(this));
  }
  /**
	 * Set the feature table icon default
	 *
	 * @param {module:extension/style.IconRow} icon icon row
	 * @return {Promise}
	 */
  setTableIconDefault(icon) {
    return this.featureStyleExtension.setTableIconDefault(this.tableName, icon).then(function () {
      this.clearCachedTableIcons();
    }.bind(this));
  }
  /**
	 * Set the feature table icon for the geometry type
	 *
	 * @param {String} geometryType geometry type
	 * @param {module:extension/style.IconRow} icon icon row
	 * @return {Promise}
	 */
  setTableIcon(geometryType, icon) {
    return this.featureStyleExtension.setTableIcon(this.tableName, geometryType, icon).then(function () {
      this.clearCachedTableIcons();
    }.bind(this));
  }
  /**
	 * Set the feature styles for the feature row
	 *
	 * @param {module:features/user/featureRow} featureRow feature row
	 * @param {module:extension/style.FeatureStyles} featureStyles feature styles
	 * @return {Promise}
	 */
  setFeatureStylesForFeatureRow(featureRow, featureStyles) {
    return this.featureStyleExtension.setFeatureStylesForFeatureRow(featureRow, featureStyles);
  }
  /**
	 * Set the feature styles for the feature table and feature id
	 *
	 * @param {Number} featureId feature id
	 * @param {module:extension/style.FeatureStyles} featureStyles feature styles
	 * @return {Promise}
	 */
  setFeatureStyles(featureId, featureStyles) {
    return this.featureStyleExtension.setFeatureStyles(this.tableName, featureId, featureStyles);
  }
  /**
	 * Set the feature style (style and icon) of the feature row
	 *
	 * @param {module:features/user/featureRow} featureRow feature row
	 * @param {module:extension/style.FeatureStyle} featureStyle feature style
	 * @return {Promise}
	 */
  setFeatureStyleForFeatureRow(featureRow, featureStyle) {
    return this.featureStyleExtension.setFeatureStyleForFeatureRow(featureRow, featureStyle);
  }
  /**
	 * Set the feature style (style and icon) of the feature row for the
	 * specified geometry type
	 *
	 * @param {module:features/user/featureRow} featureRow feature row
	 * @param {String} geometryType geometry type
	 * @param {module:extension/style.FeatureStyle} featureStyle feature style
	 * @return {Promise}
	 */
  setFeatureStyleForFeatureRowAndGeometryType(featureRow, geometryType, featureStyle) {
    return this.featureStyleExtension.setFeatureStyleForFeatureRowAndGeometryType(featureRow, geometryType, featureStyle);
  }
  /**
	 * Set the feature style default (style and icon) of the feature row
	 *
	 * @param {module:features/user/featureRow} featureRow feature row
	 * @param {module:extension/style.FeatureStyle} featureStyle feature style
	 * @return {Promise}
	 */
  setFeatureStyleDefaultForFeatureRow(featureRow, featureStyle) {
    return this.featureStyleExtension.setFeatureStyleDefaultForFeatureRow(featureRow, featureStyle);
  }
  /**
	 * Set the feature style (style and icon) of the feature
	 *
	 * @param {Number} featureId feature id
	 * @param {String} geometryType geometry type
	 * @param {module:extension/style.FeatureStyle} featureStyle feature style
	 * @return {Promise}
	 */
  setFeatureStyle(featureId, geometryType, featureStyle) {
    return this.featureStyleExtension.setFeatureStyle(this.tableName, featureId, geometryType, featureStyle);
  }
  /**
	 * Set the feature style (style and icon) of the feature
	 *
	 * @param {Number} featureId feature id
	 * @param {module:extension/style.FeatureStyle} featureStyle feature style
	 * @return {Promise}
	 */
  setFeatureStyleDefault(featureId, featureStyle) {
    return this.featureStyleExtension.setFeatureStyleDefault(this.tableName, featureId, featureStyle);
  }
  /**
	 * Set the styles for the feature row
	 *
	 * @param {module:features/user/featureRow} featureRow feature row
	 * @param {module:extension/style.StyleRow} styles styles
	 * @return {Promise}
	 */
  setStylesForFeatureRow(featureRow, styles) {
    return this.featureStyleExtension.setStylesForFeatureRow(featureRow, styles);
  }
  /**
	 * Set the styles for the feature table and feature id
	 *
	 * @param {Number} featureId feature id
	 * @param {module:extension/style.Styles} styles styles
	 * @return {Promise}
	 */
  setStyles(featureId, styles) {
    return this.featureStyleExtension.setStyles(this.tableName, featureId, styles);
  }
  /**
	 * Set the style of the feature row
	 *
	 * @param {module:features/user/featureRow} featureRow feature row
	 * @param {module:extension/style.StyleRow} style style row
	 * @return {Promise}
	 */
  setStyleForFeatureRow(featureRow, style) {
    return this.featureStyleExtension.setStyleForFeatureRow(featureRow, style);
  }
  /**
	 * Set the style of the feature row for the specified geometry type
	 *
	 * @param {module:features/user/featureRow} featureRow feature row
	 * @param {String} geometryType geometry type
	 * @param {module:extension/style.StyleRow} style style row
	 * @return {Promise}
	 */
  setStyleForFeatureRowAndGeometryType(featureRow, geometryType, style) {
    return this.featureStyleExtension.setStyleForFeatureRowAndGeometryType(featureRow, geometryType, style);
  }
  /**
	 * Set the default style of the feature row
	 *
	 * @param {module:features/user/featureRow} featureRow feature row
	 * @param {module:extension/style.StyleRow} style style row
	 * @return {Promise}
	 */
  setStyleDefaultForFeatureRow(featureRow, style) {
    return this.featureStyleExtension.setStyleDefaultForFeatureRow(featureRow, style);
  }
  /**
	 * Set the style of the feature
	 *
	 * @param {Number} featureId feature id
	 * @param {String} geometryType geometry type
	 * @param {module:extension/style.StyleRow} style style row
	 * @return {Promise}
	 */
  setStyle(featureId, geometryType, style) {
    return this.featureStyleExtension.setStyle(this.tableName, featureId, geometryType, style);
  }
  /**
	 * Set the default style of the feature
	 *
	 * @param {Number} featureId feature id
	 * @param {module:extension/style.StyleRow} style style row
	 * @return {Promise}
	 */
  setStyleDefault(featureId, style) {
    return this.featureStyleExtension.setStyleDefault(this.tableName, featureId, style);
  }
  /**
	 * Set the icons for the feature row
	 *
	 * @param {module:features/user/featureRow} featureRow feature row
	 * @param {module:extension/style.Icons} icons icons
	 * @return {Promise}
	 */
  setIconsForFeatureRow(featureRow, icons) {
    return this.featureStyleExtension.setIconsForFeatureRow(featureRow, icons);
  }
  /**
	 * Set the icons for the feature table and feature id
	 *
	 * @param {Number} featureId feature id
	 * @param {module:extension/style.Icons} icons icons
	 * @return {Promise}
	 */
  setIcons(featureId, icons) {
    return this.featureStyleExtension.setIcons(this.tableName, featureId, icons);
  }
  /**
	 * Set the icon of the feature row
	 *
	 * @param {module:features/user/featureRow} featureRow feature row
	 * @param {module:extension/style.IconRow} icon icon row
	 * @return {Promise}
	 */
  setIconForFeatureRow(featureRow, icon) {
    return this.featureStyleExtension.setIconForFeatureRow(featureRow, icon);
  }
  /**
	 * Set the icon of the feature row for the specified geometry type
	 *
	 * @param {module:features/user/featureRow} featureRow feature row
	 * @param {String} geometryType geometry type
	 * @param {module:extension/style.IconRow} icon icon row
	 * @return {Promise}
	 */
  setIconForFeatureRowAndGeometryType(featureRow, geometryType, icon) {
    return this.featureStyleExtension.setIconForFeatureRowAndGeometryType(featureRow, geometryType, icon);
  }
  /**
	 * Set the default icon of the feature row
	 *
	 * @param {module:features/user/featureRow} featureRow feature row
	 * @param {module:extension/style.IconRow} icon icon row
	 * @return {Promise}
	 */
  setIconDefaultForFeatureRow(featureRow, icon) {
    return this.featureStyleExtension.setIconDefaultForFeatureRow(featureRow, icon);
  }
  /**
	 * Get the icon of the feature, searching in order: feature geometry type
	 * icon, feature default icon, table geometry type icon, table default icon
	 *
	 * @param {Number} featureId feature id
	 * @param {String} geometryType geometry type
	 * @param {module:extension/style.IconRow} icon icon row
	 * @return {Promise}
	 */
  setIcon(featureId, geometryType, icon) {
    return this.featureStyleExtension.setIcon(this.tableName, featureId, geometryType, icon);
  }
  /**
	 * Set the default icon of the feature
	 *
	 * @param {Number} featureId feature id
	 * @param {module:extension/style.IconRow} icon icon row
	 * @return {Promise}
	 */
  setIconDefault(featureId, icon) {
    return this.featureStyleExtension.setIconDefault(this.tableName, featureId, icon);
  }
  /**
	 * Delete all feature styles including table styles, table icons, style, and
	 * icons
	 */
  deleteAllFeatureStyles() {
    this.featureStyleExtension.deleteAllFeatureStyles(this.tableName);
    this.clearCachedTableFeatureStyles();
  }
  /**
	 * Delete all styles including table styles and feature row styles
	 */
  deleteAllStyles() {
    this.featureStyleExtension.deleteAllStyles(this.tableName);
    this.clearCachedTableStyles();
  }
  /**
	 * Delete all icons including table icons and feature row icons
	 */
  deleteAllIcons() {
    this.featureStyleExtension.deleteAllIcons(this.tableName);
    this.clearCachedTableIcons();
  }
  /**
	 * Delete the feature table feature styles
	 */
  deleteTableFeatureStyles() {
    this.featureStyleExtension.deleteTableFeatureStyles(this.tableName);
    this.clearCachedTableFeatureStyles();
  }
  /**
	 * Delete the feature table styles
	 */
  deleteTableStyles() {
    this.featureStyleExtension.deleteTableStyles(this.tableName);
    this.clearCachedTableStyles();
  }
  /**
	 * Delete the feature table default style
	 */
  deleteTableStyleDefault() {
    this.featureStyleExtension.deleteTableStyleDefault(this.tableName);
    this.clearCachedTableStyles();
  }
  /**
	 * Delete the feature table style for the geometry type
	 *
	 * @param {String} geometryType geometry type
	 */
  deleteTableStyle(geometryType) {
    this.featureStyleExtension.deleteTableStyle(this.tableName, geometryType);
    this.clearCachedTableStyles();
  }
  /**
	 * Delete the feature table icons
	 */
  deleteTableIcons() {
    this.featureStyleExtension.deleteTableIcons(this.tableName);
    this.clearCachedTableIcons();
  }
  /**
	 * Delete the feature table default icon
	 */
  deleteTableIconDefault() {
    this.featureStyleExtension.deleteTableIconDefault(this.tableName);
    this.clearCachedTableIcons();
  }
  /**
	 * Delete the feature table icon for the geometry type
	 *
	 * @param {String} geometryType geometry type
	 */
  deleteTableIcon(geometryType) {
    this.featureStyleExtension.deleteTableIcon(this.tableName, geometryType);
    this.clearCachedTableIcons();
  }
  /**
	 * Clear the cached table feature styles
	 */
  clearCachedTableFeatureStyles() {
    this.cachedTableFeatureStyles.setStyles(null);
    this.cachedTableFeatureStyles.setIcons(null);
  }
  /**
	 * Clear the cached table styles
	 */
  clearCachedTableStyles() {
    this.cachedTableFeatureStyles.setStyles(null);
  }
  /**
	 * Clear the cached table icons
	 */
  clearCachedTableIcons() {
    this.cachedTableFeatureStyles.setIcons(null);
  }
  /**
	 * Delete all feature styles
	 */
  deleteFeatureStyles() {
    this.featureStyleExtension.deleteFeatureStyles(this.tableName);
  }
  /**
	 * Delete all styles
	 */
  deleteStyles() {
    this.featureStyleExtension.deleteStyles(this.tableName);
  }
  /**
	 * Delete feature row styles
	 *
	 * @param {module:features/user/featureRow} featureRow feature row
	 */
  deleteStylesForFeatureRow(featureRow) {
    this.featureStyleExtension.deleteStylesForFeatureRow(featureRow);
  }
  /**
	 * Delete feature row styles
	 *
	 * @param {Number} featureId feature id
	 */
  deleteStylesForFeatureId(featureId) {
    this.featureStyleExtension.deleteStylesForFeatureId(this.tableName, featureId);
  }
  /**
	 * Delete the feature row default style
	 *
	 * @param {module:features/user/featureRow} featureRow feature row
	 */
  deleteStyleDefaultForFeatureRow(featureRow) {
    this.featureStyleExtension.deleteStyleDefaultForFeatureRow(featureRow);
  }
  /**
	 * Delete the feature row default style
	 *
	 * @param {Number} featureId feature id
	 */
  deleteStyleDefault(featureId) {
    this.featureStyleExtension.deleteStyleDefault(this.tableName, featureId);
  }
  /**
	 * Delete the feature row style for the feature row geometry type
	 *
	 * @param {module:features/user/featureRow} featureRow feature row
	 */
  deleteStyleForFeatureRow(featureRow) {
    this.featureStyleExtension.deleteStyleForFeatureRow(featureRow);
  }
  /**
	 * Delete the feature row style for the geometry type
	 *
	 * @param {module:features/user/featureRow} featureRow feature row
	 * @param {String} geometryType geometry type
	 */
  deleteStyleForFeatureRowAndGeometryType(featureRow, geometryType) {
    this.featureStyleExtension.deleteStyleForFeatureRowAndGeometryType(featureRow, geometryType);
  }
  /**
	 * Delete the feature row style for the geometry type
	 *
	 * @param {Number} featureId feature id
	 * @param {String} geometryType geometry type
	 */
  deleteStyle(featureId, geometryType) {
    this.featureStyleExtension.deleteStyle(this.tableName, featureId, geometryType);
  }
  /**
	 * Delete all icons
	 */
  deleteIcons() {
    this.featureStyleExtension.deleteIcons(this.tableName);
  }
  /**
	 * Delete feature row icons
	 *
	 * @param {module:features/user/featureRow} featureRow feature row
	 */
  deleteIconsForFeatureRow(featureRow) {
    this.featureStyleExtension.deleteIconsForFeatureRow(featureRow);
  }
  /**
	 * Delete feature row icons
	 *
	 * @param {Number} featureId feature id
	 */
  deleteIconsForFeatureId(featureId) {
    this.featureStyleExtension.deleteIconsForFeatureId(this.tableName, featureId);
  }
  /**
	 * Delete the feature row default icon
	 *
	 * @param {module:features/user/featureRow} featureRow feature row
	 */
  deleteIconDefaultForFeatureRow(featureRow) {
    this.featureStyleExtension.deleteIconDefaultForFeatureRow(featureRow);
  }
  /**
	 * Delete the feature row default icon
	 *
	 * @param {Number} featureId feature id
	 */
  deleteIconDefault(featureId) {
    this.featureStyleExtension.deleteIconDefault(this.tableName, featureId);
  }
  /**
	 * Delete the feature row icon for the feature row geometry type
	 *
	 * @param {module:features/user/featureRow} featureRow feature row
	 */
  deleteIconForFeatureRow(featureRow) {
    this.featureStyleExtension.deleteIconForFeatureRow(featureRow);
  }
  /**
	 * Delete the feature row icon for the geometry type
	 *
	 * @param {module:features/user/featureRow} featureRow feature row
	 * @param {String} geometryType geometry type
	 */
  deleteIconForFeatureRowAndGeometryType(featureRow, geometryType) {
    this.featureStyleExtension.deleteIconForFeatureRowAndGeometryType(featureRow, geometryType);
  }
  /**
	 * Delete the feature row icon for the geometry type
	 *
	 * @param {Number} featureId feature id
	 * @param {String} geometryType geometry type
	 */
  deleteIcon(featureId, geometryType) {
    this.featureStyleExtension.deleteIcon(this.tableName, featureId, geometryType);
  }
  /**
	 * Get all the unique style row ids the table maps to
	 *
	 * @return {module:extension/style.StyleRow} style row ids
	 */
  getAllTableStyleIds() {
    return this.featureStyleExtension.getAllTableStyleIds(this.tableName);
  }
  /**
	 * Get all the unique icon row ids the table maps to
	 *
	 * @return {module:extension/style.IconRow} icon row ids
	 */
  getAllTableIconIds() {
    return this.featureStyleExtension.getAllTableIconIds(this.tableName);
  }
  /**
	 * Get all the unique style row ids the features map to
	 *
	 * @return {module:extension/style.StyleRow} style row ids
	 */
  getAllStyleIds() {
    return this.featureStyleExtension.getAllStyleIds(this.tableName);
  }
  /**
	 * Get all the unique icon row ids the features map to
	 *
	 * @return {module:extension/style.IconRow} icon row ids
	 */
  getAllIconIds() {
    return this.featureStyleExtension.getAllIconIds(this.tableName);
  }
}

/**
 * @memberOf module:extension/style
 * @class FeatureStyleExtension
 */
import FeatureStyles from './featureStyles';
import FeatureStyle from './featureStyle';
import Styles from './styles';
import Icons from './icons';
import { FeatureStyleExtension } from '.';
import { GeoPackage } from '../../geoPackage';
import { ExtendedRelation } from '../relatedTables/extendedRelation';
import { StyleMappingDao } from './styleMappingDao';
import { StyleDao } from './styleDao';
import { IconDao } from './iconDao';
import { StyleRow } from './styleRow';
import { IconRow } from './iconRow';
import { FeatureRow } from '../../features/user/featureRow';
import { FeatureTable } from '../../features/user/featureTable';

/**
 * Feature Table Styles, styles and icons for an individual feature table
 * @param  {module:geoPackage~GeoPackage} geoPackage GeoPackage object
 * @param {String} tableName
 * @constructor
 */
export class FeatureTableStyles {
  featureStyleExtension: FeatureStyleExtension;
  cachedTableFeatureStyles: FeatureStyles;
  tableName: string;
  constructor(public geoPackage: GeoPackage, tableNameOrTable: string | FeatureTable) {
    if (tableNameOrTable instanceof FeatureTable) {
      this.tableName = tableNameOrTable.table_name;
    } else {
      this.tableName = tableNameOrTable;
    }
    this.featureStyleExtension = geoPackage.getFeatureStyleExtension();
    this.cachedTableFeatureStyles = new FeatureStyles();
    // this.tableName = tableName;
  }
  /**
   * Get the feature style extension
   * @return {module:extension/style.FeatureStyleExtension} feature style extension
   */
  getFeatureStyleExtension(): FeatureStyleExtension {
    return this.featureStyleExtension;
  }
  /**
   * Get the feature table name
   * @return {String} feature table name
   */
  getTableName(): string {
    return this.tableName;
  }
  /**
   * Determine if the GeoPackage has the extension for the table
   * @return {Boolean} true if has extension
   */
  has(): boolean {
    return this.featureStyleExtension.has(this.tableName);
  }
  /**
   * Create style, icon, table style, and table icon relationships for the
   * feature table
   * @return {Promise}
   */
  createRelationships(): Promise<{
    styleRelationship: ExtendedRelation;
    tableStyleRelationship: ExtendedRelation;
    iconRelationship: ExtendedRelation;
    tableIconRelationship: ExtendedRelation;
  }> {
    return this.featureStyleExtension.createRelationships(this.tableName);
  }
  /**
   * Check if feature table has a style, icon, table style, or table icon
   * relationships
   * @return {Boolean} true if has a relationship
   */
  hasRelationship(): boolean {
    return this.featureStyleExtension.hasRelationship(this.tableName);
  }
  /**
   * Create a style relationship for the feature table
   * @return {Promise}
   */
  createStyleRelationship(): Promise<ExtendedRelation> {
    return this.featureStyleExtension.createStyleRelationship(this.tableName);
  }
  /**
   * Determine if a style relationship exists for the feature table
   * @return {Boolean} true if relationship exists
   */
  hasStyleRelationship(): boolean {
    return this.featureStyleExtension.hasStyleRelationship(this.tableName);
  }
  /**
   * Create a feature table style relationship
   * @return {Promise}
   */
  createTableStyleRelationship(): Promise<ExtendedRelation> {
    return this.featureStyleExtension.createTableStyleRelationship(this.tableName);
  }
  /**
   * Determine if feature table style relationship exists
   *
   * @return {Boolean} true if relationship exists
   */
  hasTableStyleRelationship(): boolean {
    return this.featureStyleExtension.hasTableStyleRelationship(this.tableName);
  }
  /**
   * Create an icon relationship for the feature table
   * @return {Promise}
   */
  createIconRelationship(): Promise<ExtendedRelation> {
    return this.featureStyleExtension.createIconRelationship(this.tableName);
  }
  /**
   * Determine if an icon relationship exists for the feature table
   * @return {Boolean} true if relationship exists
   */
  hasIconRelationship(): boolean {
    return this.featureStyleExtension.hasIconRelationship(this.tableName);
  }
  /**
   * Create a feature table icon relationship
   * @return {Promise}
   */
  createTableIconRelationship(): Promise<ExtendedRelation> {
    return this.featureStyleExtension.createTableIconRelationship(this.tableName);
  }
  /**
   * Determine if feature table icon relationship exists
   * @return {Boolean} true if relationship exists
   */
  hasTableIconRelationship(): boolean {
    return this.featureStyleExtension.hasTableIconRelationship(this.tableName);
  }
  /**
   * Delete the style and icon table and row relationships for the feature
   * table
   */
  deleteRelationships(): {
    styleRelationships: number;
    tableStyleRelationships: number;
    iconRelationship: number;
    tableIconRelationship: number;
  } {
    return this.featureStyleExtension.deleteRelationships(this.tableName);
  }
  /**
   * Delete a style relationship for the feature table
   */
  deleteStyleRelationship(): number {
    return this.featureStyleExtension.deleteStyleRelationship(this.tableName);
  }
  /**
   * Delete a table style relationship for the feature table
   */
  deleteTableStyleRelationship(): number {
    return this.featureStyleExtension.deleteTableStyleRelationship(this.tableName);
  }
  /**
   * Delete a icon relationship for the feature table
   */
  deleteIconRelationship(): number {
    return this.featureStyleExtension.deleteIconRelationship(this.tableName);
  }
  /**
   * Delete a table icon relationship for the feature table
   */
  deleteTableIconRelationship(): number {
    return this.featureStyleExtension.deleteTableIconRelationship(this.tableName);
  }
  /**
   * Get a Style Mapping DAO
   * @return {module:extension/style.StyleMappingDao} style mapping DAO
   */
  getStyleMappingDao(): StyleMappingDao {
    return this.featureStyleExtension.getStyleMappingDao(this.tableName);
  }
  /**
   * Get a Table Style Mapping DAO
   * @return {module:extension/style.StyleMappingDao} table style mapping DAO
   */
  getTableStyleMappingDao(): StyleMappingDao {
    return this.featureStyleExtension.getTableStyleMappingDao(this.tableName);
  }
  /**
   * Get a Icon Mapping DAO
   * @return {module:extension/style.StyleMappingDao} icon mapping DAO
   */
  getIconMappingDao(): StyleMappingDao {
    return this.featureStyleExtension.getIconMappingDao(this.tableName);
  }
  /**
   * Get a Table Icon Mapping DAO
   * @return {module:extension/style.StyleMappingDao} table icon mapping DAO
   */
  getTableIconMappingDao(): StyleMappingDao {
    return this.featureStyleExtension.getTableIconMappingDao(this.tableName);
  }
  /**
   * Get a style DAO
   * @return {module:extension/style.StyleDao} style DAO
   */
  getStyleDao(): StyleDao {
    return this.featureStyleExtension.getStyleDao();
  }
  /**
   * Get a icon DAO
   * @return {module:extension/style.IconDao} icon DAO
   */
  getIconDao(): IconDao {
    return this.featureStyleExtension.getIconDao();
  }
  /**
   * Get the table feature styles
   * @return {module:extension/style.FeatureStyles} table feature styles or null
   */
  getTableFeatureStyles(): FeatureStyles {
    return this.featureStyleExtension.getTableFeatureStyles(this.tableName);
  }
  /**
   * Get the table styles
   * @return {module:extension/style.Styles} table styles or null
   */
  getTableStyles(): Styles {
    return this.featureStyleExtension.getTableStyles(this.tableName);
  }
  /**
   * Get the cached table styles, querying and caching if needed
   * @return {module:extension/style.Styles} cached table styles
   */
  getCachedTableStyles(): Styles {
    let styles = this.cachedTableFeatureStyles.getStyles();
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
  getTableStyle(geometryType: string): StyleRow {
    return this.featureStyleExtension.getTableStyle(this.tableName, geometryType);
  }
  /**
   * Get the table style default
   * @return {module:extension/style.StyleRow} style row
   */
  getTableStyleDefault(): StyleRow {
    return this.featureStyleExtension.getTableStyleDefault(this.tableName);
  }
  /**
   * Get the table icons
   * @return {module:extension/style.Icons} table icons or null
   */
  getTableIcons(): Icons {
    return this.featureStyleExtension.getTableIcons(this.tableName);
  }
  /**
   * Get the cached table icons, querying and caching if needed
   * @return {module:extension/style.Icons} cached table icons
   */
  getCachedTableIcons(): Icons {
    let icons = this.cachedTableFeatureStyles.getIcons();
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
  getTableIcon(geometryType: string): IconRow {
    return this.featureStyleExtension.getTableIcon(this.tableName, geometryType);
  }
  /**
   * Get the table icon default
   * @return {module:extension/style.IconRow} icon row
   */
  getTableIconDefault(): IconRow {
    return this.featureStyleExtension.getTableIconDefault(this.tableName);
  }
  /**
   * Get the feature styles for the feature row
   *
   * @param {module:features/user/featureRow} featureRow feature row
   * @return {module:extension/style.FeatureStyles} feature styles or null
   */
  getFeatureStylesForFeatureRow(featureRow: FeatureRow): FeatureStyles {
    return this.featureStyleExtension.getFeatureStylesForFeatureRow(featureRow);
  }
  /**
   * Get the feature styles for the feature id
   *
   * @param {Number} featureId feature id
   * @return {module:extension/style.FeatureStyles} feature styles or null
   */
  getFeatureStyles(featureId: number): FeatureStyles {
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
  getFeatureStyleForFeatureRow(featureRow: FeatureRow): FeatureStyle {
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
  getFeatureStyleForFeatureRowAndGeometryType(featureRow: FeatureRow, geometryType: string): FeatureStyle {
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
  getFeatureStyleDefaultForFeatureRow(featureRow: FeatureRow): FeatureStyle {
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
  getFeatureStyle(featureId: number, geometryType: string): FeatureStyle {
    let featureStyle = null;
    const style = this.getStyle(featureId, geometryType);
    const icon = this.getIcon(featureId, geometryType);
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
  getFeatureStyleDefault(featureId: number): FeatureStyle {
    return this.getFeatureStyle(featureId, null);
  }
  /**
   * Get the styles for the feature row
   *
   * @param {module:features/user/featureRow} featureRow feature row
   * @return {module:extension/style.Styles} styles or null
   */
  getStylesForFeatureRow(featureRow: FeatureRow): Styles {
    return this.featureStyleExtension.getStylesForFeatureRow(featureRow);
  }
  /**
   * Get the styles for the feature id
   *
   * @param {Number} featureId feature id
   * @return {module:extension/style.Styles}  styles or null
   */
  getStylesForFeatureId(featureId: number): Styles {
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
  getStyleForFeatureRow(featureRow: FeatureRow): StyleRow {
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
  getStyleForFeatureRowAndGeometryType(featureRow: FeatureRow, geometryType: string): StyleRow {
    return this.getStyle(featureRow.getId(), geometryType);
  }
  /**
   * Get the default style of the feature row, searching in order: feature
   * default style, table default style
   *
   * @param {module:features/user/featureRow} featureRow feature row
   * @return {module:extension/style.StyleRow} style row
   */
  getStyleDefaultForFeatureRow(featureRow: FeatureRow): StyleRow {
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
  getStyle(featureId: number, geometryType: string): StyleRow {
    let styleRow = this.featureStyleExtension.getStyle(this.tableName, featureId, geometryType, false);
    if (styleRow === null) {
      // Table Style
      const styles = this.getCachedTableStyles();
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
  getStyleDefault(featureId: number): StyleRow {
    return this.getStyle(featureId, null);
  }
  /**
   * Get the icons for the feature row
   *
   * @param {module:features/user/featureRow} featureRow feature row
   * @return {module:extension/style.Icons} icons or null
   */
  getIconsForFeatureRow(featureRow: FeatureRow): Icons {
    return this.featureStyleExtension.getIconsForFeatureRow(featureRow);
  }
  /**
   * Get the icons for the feature id
   *
   * @param {Number} featureId feature id
   * @return {module:extension/style.Icons} icons or null
   */
  getIconsForFeatureId(featureId: number): Icons {
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
  getIconForFeatureRow(featureRow: FeatureRow): IconRow {
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
  getIconForFeatureRowAndGeometryType(featureRow: FeatureRow, geometryType: string): IconRow {
    return this.getIcon(featureRow.getId(), geometryType);
  }
  /**
   * Get the default icon of the feature row, searching in order: feature
   * default icon, table default icon
   *
   * @param {module:features/user/featureRow} featureRow feature row
   * @return {module:extension/style.IconRow} icon row
   */
  getIconDefaultForFeatureRow(featureRow: FeatureRow): IconRow {
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
  getIcon(featureId: number, geometryType: string): IconRow {
    let iconRow = this.featureStyleExtension.getIcon(this.tableName, featureId, geometryType, false);
    if (iconRow === null) {
      // Table Icon
      const icons = this.getCachedTableIcons();
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
  getIconDefault(featureId: number): IconRow {
    return this.getIcon(featureId, null);
  }
  /**
   * Set the feature table default feature styles
   *
   * @param {module:extension/style.FeatureStyles} featureStyles default feature styles
   * @return {Promise}
   */
  async setTableFeatureStyles(
    featureStyles: FeatureStyles,
  ): Promise<{
    tableStyles: {
      styleDefault: number;
      styles: number[];
    };
    tableIcons: {
      iconDefault: number;
      icons: number[];
    };
    deleted?: {
      styles: number;
      icons: number;
    };
  }> {
    const styles = await this.featureStyleExtension.setTableFeatureStyles(this.tableName, featureStyles);
    this.clearCachedTableFeatureStyles();
    return styles;
  }
  /**
   * Set the feature table default styles
   *
   * @param {module:extension/style.Styles} styles default styles
   * @return {Promise}
   */
  async setTableStyles(
    styles: Styles,
  ): Promise<{
    styleDefault: number;
    styles: number[];
    deleted: number;
  }> {
    const result = await this.featureStyleExtension.setTableStyles(this.tableName, styles);
    this.clearCachedTableStyles();
    return result;
  }
  /**
   * Set the feature table style default
   *
   * @param {module:extension/style.StyleRow} style style row
   * @return {Promise}
   */
  async setTableStyleDefault(style: StyleRow): Promise<number> {
    const result = await this.featureStyleExtension.setTableStyleDefault(this.tableName, style);
    this.clearCachedTableStyles();
    return result;
  }
  /**
   * Set the feature table style for the geometry type
   *
   * @param {String} geometryType geometry type
   * @param {module:extension/style.StyleRow} style style row
   * @return {Promise}
   */
  async setTableStyle(geometryType: string, style: StyleRow): Promise<number> {
    const result = await this.featureStyleExtension.setTableStyle(this.tableName, geometryType, style);
    this.clearCachedTableStyles();
    return result;
  }
  /**
   * Set the feature table default icons
   *
   * @param {module:extension/style.Icons} icons default icons
   * @return {Promise}
   */
  async setTableIcons(
    icons: Icons,
  ): Promise<{
    iconDefault: number;
    icons: number[];
    deleted: number;
  }> {
    const result = await this.featureStyleExtension.setTableIcons(this.tableName, icons);
    this.clearCachedTableIcons();
    return result;
  }
  /**
   * Set the feature table icon default
   *
   * @param {module:extension/style.IconRow} icon icon row
   * @return {Promise}
   */
  async setTableIconDefault(icon: IconRow): Promise<number> {
    const result = await this.featureStyleExtension.setTableIconDefault(this.tableName, icon);
    this.clearCachedTableIcons();
    return result;
  }
  /**
   * Set the feature table icon for the geometry type
   *
   * @param {String} geometryType geometry type
   * @param {module:extension/style.IconRow} icon icon row
   * @return {Promise}
   */
  async setTableIcon(geometryType: string, icon: IconRow): Promise<number> {
    const result = await this.featureStyleExtension.setTableIcon(this.tableName, geometryType, icon);
    this.clearCachedTableIcons();
    return result;
  }
  /**
   * Set the feature styles for the feature row
   *
   * @param {module:features/user/featureRow} featureRow feature row
   * @param {module:extension/style.FeatureStyles} featureStyles feature styles
   * @return {Promise}
   */
  async setFeatureStylesForFeatureRow(
    featureRow: FeatureRow,
    featureStyles: FeatureStyles,
  ): Promise<{
    styles: { styleDefault: number; styles: number[] };
    icons: {
      iconDefault: number;
      icons: number[];
      deleted?: {
        style: number;
        icon: number;
      };
    };
  }> {
    return await this.featureStyleExtension.setFeatureStylesForFeatureRow(featureRow, featureStyles);
  }
  /**
   * Set the feature styles for the feature table and feature id
   *
   * @param {Number} featureId feature id
   * @param {module:extension/style.FeatureStyles} featureStyles feature styles
   * @return {Promise}
   */
  async setFeatureStyles(
    featureId: number,
    featureStyles: FeatureStyles,
  ): Promise<{
    styles: { styleDefault: number; styles: number[] };
    icons: { iconDefault: number; icons: number[] };
    deleted?: {
      deletedStyles: number;
      deletedIcons: number;
    };
  }> {
    return this.featureStyleExtension.setFeatureStyles(this.tableName, featureId, featureStyles);
  }
  /**
   * Set the feature style (style and icon) of the feature row
   *
   * @param {module:features/user/featureRow} featureRow feature row
   * @param {module:extension/style.FeatureStyle} featureStyle feature style
   * @return {Promise}
   */
  async setFeatureStyleForFeatureRow(
    featureRow: FeatureRow,
    featureStyle: FeatureStyle,
  ): Promise<{
    style: number;
    icon: number;
    deleted?: {
      style: number;
      icon: number;
    };
  }> {
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
  async setFeatureStyleForFeatureRowAndGeometryType(
    featureRow: FeatureRow,
    geometryType: string,
    featureStyle: FeatureStyle,
  ): Promise<{
    style: number;
    icon: number;
    deleted?: {
      style: number;
      icon: number;
    };
  }> {
    return this.featureStyleExtension.setFeatureStyleForFeatureRowAndGeometryType(
      featureRow,
      geometryType,
      featureStyle,
    );
  }
  /**
   * Set the feature style default (style and icon) of the feature row
   *
   * @param {module:features/user/featureRow} featureRow feature row
   * @param {module:extension/style.FeatureStyle} featureStyle feature style
   * @return {Promise}
   */
  async setFeatureStyleDefaultForFeatureRow(
    featureRow: FeatureRow,
    featureStyle: FeatureStyle,
  ): Promise<{
    style: number;
    icon: number;
    deleted?: {
      style: number;
      icon: number;
    };
  }> {
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
  async setFeatureStyle(
    featureId: number,
    geometryType: string,
    featureStyle: FeatureStyle,
  ): Promise<{
    style: number;
    icon: number;
    deleted?: {
      style: number;
      icon: number;
    };
  }> {
    return this.featureStyleExtension.setFeatureStyle(this.tableName, featureId, geometryType, featureStyle);
  }
  /**
   * Set the feature style (style and icon) of the feature
   *
   * @param {Number} featureId feature id
   * @param {module:extension/style.FeatureStyle} featureStyle feature style
   * @return {Promise}
   */
  async setFeatureStyleDefault(
    featureId: number,
    featureStyle: FeatureStyle,
  ): Promise<{
    style: number;
    icon: number;
    deleted?: {
      style: number;
      icon: number;
    };
  }> {
    return this.featureStyleExtension.setFeatureStyleDefault(this.tableName, featureId, featureStyle);
  }
  /**
   * Set the styles for the feature row
   *
   * @param {module:features/user/featureRow} featureRow feature row
   * @param {module:extension/style.Styles} styles styles
   * @return {Promise}
   */
  async setStylesForFeatureRow(
    featureRow: FeatureRow,
    styles: Styles,
  ): Promise<{ styleDefault: number; styles: number[]; deleted: number }> {
    return this.featureStyleExtension.setStylesForFeatureRow(featureRow, styles);
  }
  /**
   * Set the styles for the feature table and feature id
   *
   * @param {Number} featureId feature id
   * @param {module:extension/style.Styles} styles styles
   * @return {Promise}
   */
  async setStyles(
    featureId: number,
    styles: Styles,
  ): Promise<{ styleDefault: number; styles: number[]; deleted: number }> {
    return this.featureStyleExtension.setStyles(this.tableName, featureId, styles);
  }
  /**
   * Set the style of the feature row
   *
   * @param {module:features/user/featureRow} featureRow feature row
   * @param {module:extension/style.StyleRow} style style row
   * @return {Promise}
   */
  async setStyleForFeatureRow(featureRow: FeatureRow, style: StyleRow): Promise<number> {
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
  async setStyleForFeatureRowAndGeometryType(
    featureRow: FeatureRow,
    geometryType: string,
    style: StyleRow,
  ): Promise<number> {
    return this.featureStyleExtension.setStyleForFeatureRowAndGeometryType(featureRow, geometryType, style);
  }
  /**
   * Set the default style of the feature row
   *
   * @param {module:features/user/featureRow} featureRow feature row
   * @param {module:extension/style.StyleRow} style style row
   * @return {Promise}
   */
  async setStyleDefaultForFeatureRow(featureRow: FeatureRow, style: StyleRow): Promise<number> {
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
  async setStyle(featureId: number, geometryType: string, style: StyleRow): Promise<number> {
    return this.featureStyleExtension.setStyle(this.tableName, featureId, geometryType, style);
  }
  /**
   * Set the default style of the feature
   *
   * @param {Number} featureId feature id
   * @param {module:extension/style.StyleRow} style style row
   * @return {Promise}
   */
  async setStyleDefault(featureId: number, style: StyleRow): Promise<number> {
    return this.featureStyleExtension.setStyleDefault(this.tableName, featureId, style);
  }
  /**
   * Set the icons for the feature row
   *
   * @param {module:features/user/featureRow} featureRow feature row
   * @param {module:extension/style.Icons} icons icons
   * @return {Promise}
   */
  async setIconsForFeatureRow(
    featureRow: FeatureRow,
    icons: Icons,
  ): Promise<{
    iconDefault: number;
    icons: number[];
    deleted: number;
  }> {
    return this.featureStyleExtension.setIconsForFeatureRow(featureRow, icons);
  }
  /**
   * Set the icons for the feature table and feature id
   *
   * @param {Number} featureId feature id
   * @param {module:extension/style.Icons} icons icons
   * @return {Promise}
   */
  async setIcons(
    featureId: number,
    icons: Icons,
  ): Promise<{
    iconDefault: number;
    icons: number[];
    deleted: number;
  }> {
    return this.featureStyleExtension.setIcons(this.tableName, featureId, icons);
  }
  /**
   * Set the icon of the feature row
   *
   * @param {module:features/user/featureRow} featureRow feature row
   * @param {module:extension/style.IconRow} icon icon row
   * @return {Promise}
   */
  async setIconForFeatureRow(featureRow: FeatureRow, icon: IconRow): Promise<number> {
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
  async setIconForFeatureRowAndGeometryType(
    featureRow: FeatureRow,
    geometryType: string,
    icon: IconRow,
  ): Promise<number> {
    return this.featureStyleExtension.setIconForFeatureRowAndGeometryType(featureRow, geometryType, icon);
  }
  /**
   * Set the default icon of the feature row
   *
   * @param {module:features/user/featureRow} featureRow feature row
   * @param {module:extension/style.IconRow} icon icon row
   * @return {Promise}
   */
  async setIconDefaultForFeatureRow(featureRow: FeatureRow, icon: IconRow): Promise<number> {
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
  async setIcon(featureId: number, geometryType: string, icon: IconRow): Promise<number> {
    return this.featureStyleExtension.setIcon(this.tableName, featureId, geometryType, icon);
  }
  /**
   * Set the default icon of the feature
   *
   * @param {Number} featureId feature id
   * @param {module:extension/style.IconRow} icon icon row
   * @return {Promise}
   */
  async setIconDefault(featureId: number, icon: IconRow): Promise<number> {
    return this.featureStyleExtension.setIconDefault(this.tableName, featureId, icon);
  }
  /**
   * Delete all feature styles including table styles, table icons, style, and
   * icons
   */
  deleteAllFeatureStyles(): {
    tableStyles: {
      styles: number;
      icons: number;
    };
    styles: {
      styles: number;
      icons: number;
    };
  } {
    const result = this.featureStyleExtension.deleteAllFeatureStyles(this.tableName);
    this.clearCachedTableFeatureStyles();
    return result;
  }
  /**
   * Delete all styles including table styles and feature row styles
   */
  deleteAllStyles(): {
    tableStyles: number;
    styles: number;
  } {
    const result = this.featureStyleExtension.deleteAllStyles(this.tableName);
    this.clearCachedTableStyles();
    return result;
  }
  /**
   * Delete all icons including table icons and feature row icons
   */
  deleteAllIcons(): {
    tableIcons: number;
    icons: number;
  } {
    const result = this.featureStyleExtension.deleteAllIcons(this.tableName);
    this.clearCachedTableIcons();
    return result;
  }
  /**
   * Delete the feature table feature styles
   */
  deleteTableFeatureStyles(): {
    styles: number;
    icons: number;
  } {
    const result = this.featureStyleExtension.deleteTableFeatureStyles(this.tableName);
    this.clearCachedTableFeatureStyles();
    return result;
  }
  /**
   * Delete the feature table styles
   */
  deleteTableStyles(): number {
    const result = this.featureStyleExtension.deleteTableStyles(this.tableName);
    this.clearCachedTableStyles();
    return result;
  }
  /**
   * Delete the feature table default style
   */
  deleteTableStyleDefault(): number {
    const result = this.featureStyleExtension.deleteTableStyleDefault(this.tableName);
    this.clearCachedTableStyles();
    return result;
  }
  /**
   * Delete the feature table style for the geometry type
   *
   * @param {String} geometryType geometry type
   */
  deleteTableStyle(geometryType: string): number {
    const result = this.featureStyleExtension.deleteTableStyle(this.tableName, geometryType);
    this.clearCachedTableStyles();
    return result;
  }
  /**
   * Delete the feature table icons
   */
  deleteTableIcons(): number {
    const result = this.featureStyleExtension.deleteTableIcons(this.tableName);
    this.clearCachedTableIcons();
    return result;
  }
  /**
   * Delete the feature table default icon
   */
  deleteTableIconDefault(): number {
    const result = this.featureStyleExtension.deleteTableIconDefault(this.tableName);
    this.clearCachedTableIcons();
    return result;
  }
  /**
   * Delete the feature table icon for the geometry type
   *
   * @param {String} geometryType geometry type
   */
  deleteTableIcon(geometryType: string): number {
    const result = this.featureStyleExtension.deleteTableIcon(this.tableName, geometryType);
    this.clearCachedTableIcons();
    return result;
  }
  /**
   * Clear the cached table feature styles
   */
  clearCachedTableFeatureStyles(): void {
    this.cachedTableFeatureStyles.setStyles(null);
    this.cachedTableFeatureStyles.setIcons(null);
  }
  /**
   * Clear the cached table styles
   */
  clearCachedTableStyles(): void {
    this.cachedTableFeatureStyles.setStyles(null);
  }
  /**
   * Clear the cached table icons
   */
  clearCachedTableIcons(): void {
    this.cachedTableFeatureStyles.setIcons(null);
  }
  /**
   * Delete all feature styles
   */
  deleteFeatureStyles(): {
    styles: number;
    icons: number;
  } {
    return this.featureStyleExtension.deleteFeatureStyles(this.tableName);
  }
  /**
   * Delete all styles
   */
  deleteStyles(): number {
    return this.featureStyleExtension.deleteStyles(this.tableName);
  }
  /**
   * Delete feature row styles
   *
   * @param {module:features/user/featureRow} featureRow feature row
   */
  deleteStylesForFeatureRow(featureRow: FeatureRow): number {
    return this.featureStyleExtension.deleteStylesForFeatureRow(featureRow);
  }
  /**
   * Delete feature row styles
   *
   * @param {Number} featureId feature id
   */
  deleteStylesForFeatureId(featureId: number): number {
    return this.featureStyleExtension.deleteStylesForFeatureId(this.tableName, featureId);
  }
  /**
   * Delete the feature row default style
   *
   * @param {module:features/user/featureRow} featureRow feature row
   */
  deleteStyleDefaultForFeatureRow(featureRow: FeatureRow): number {
    return this.featureStyleExtension.deleteStyleDefaultForFeatureRow(featureRow);
  }
  /**
   * Delete the feature row default style
   *
   * @param {Number} featureId feature id
   */
  deleteStyleDefault(featureId: number): number {
    return this.featureStyleExtension.deleteStyleDefault(this.tableName, featureId);
  }
  /**
   * Delete the feature row style for the feature row geometry type
   *
   * @param {module:features/user/featureRow} featureRow feature row
   */
  deleteStyleForFeatureRow(featureRow: FeatureRow): number {
    return this.featureStyleExtension.deleteStyleForFeatureRow(featureRow);
  }
  /**
   * Delete the feature row style for the geometry type
   *
   * @param {module:features/user/featureRow} featureRow feature row
   * @param {String} geometryType geometry type
   */
  deleteStyleForFeatureRowAndGeometryType(featureRow: FeatureRow, geometryType: string): number {
    return this.featureStyleExtension.deleteStyleForFeatureRowAndGeometryType(featureRow, geometryType);
  }
  /**
   * Delete the feature row style for the geometry type
   *
   * @param {Number} featureId feature id
   * @param {String} geometryType geometry type
   */
  deleteStyle(featureId: number, geometryType: string): number {
    return this.featureStyleExtension.deleteStyle(this.tableName, featureId, geometryType);
  }
  /**
   * Delete the style and associated mappings using StyleRow
   *
   * @param {module:extension/style.StyleRow} styleRow style row
   */
  deleteStyleAndMappingsByStyleRow(styleRow: StyleRow): number {
    return this.featureStyleExtension.deleteStyleAndMappingsByStyleRow(this.tableName, styleRow);
  }

  /**
   * Delete the style and associated mappings using StyleRow's Id
   *
   * @param {Number} styleRowId style row id
   */
  deleteStyleAndMappingsByStyleRowId(styleRowId: number): number {
    return this.featureStyleExtension.deleteStyleAndMappingsByStyleRowId(this.tableName, styleRowId);
  }

  /**
   * Delete all icons
   */
  deleteIcons(): number {
    return this.featureStyleExtension.deleteIcons(this.tableName);
  }
  /**
   * Delete feature row icons
   *
   * @param {module:features/user/featureRow} featureRow feature row
   */
  deleteIconsForFeatureRow(featureRow: FeatureRow): number {
    return this.featureStyleExtension.deleteIconsForFeatureRow(featureRow);
  }
  /**
   * Delete feature row icons
   *
   * @param {Number} featureId feature id
   */
  deleteIconsForFeatureId(featureId: number): number {
    return this.featureStyleExtension.deleteIconsForFeatureId(this.tableName, featureId);
  }
  /**
   * Delete the feature row default icon
   *
   * @param {module:features/user/featureRow} featureRow feature row
   */
  deleteIconDefaultForFeatureRow(featureRow: FeatureRow): number {
    return this.featureStyleExtension.deleteIconDefaultForFeatureRow(featureRow);
  }
  /**
   * Delete the feature row default icon
   *
   * @param {Number} featureId feature id
   */
  deleteIconDefault(featureId: number): number {
    return this.featureStyleExtension.deleteIconDefault(this.tableName, featureId);
  }
  /**
   * Delete the feature row icon for the feature row geometry type
   *
   * @param {module:features/user/featureRow} featureRow feature row
   */
  deleteIconForFeatureRow(featureRow: FeatureRow): number {
    return this.featureStyleExtension.deleteIconForFeatureRow(featureRow);
  }
  /**
   * Delete the feature row icon for the geometry type
   *
   * @param {module:features/user/featureRow} featureRow feature row
   * @param {String} geometryType geometry type
   */
  deleteIconForFeatureRowAndGeometryType(featureRow: FeatureRow, geometryType: string): number {
    return this.featureStyleExtension.deleteIconForFeatureRowAndGeometryType(featureRow, geometryType);
  }
  /**
   * Delete the feature row icon for the geometry type
   *
   * @param {Number} featureId feature id
   * @param {String} geometryType geometry type
   */
  deleteIcon(featureId: number, geometryType: string): number {
    return this.featureStyleExtension.deleteIcon(this.tableName, featureId, geometryType);
  }
  /**
   * Delete the icon and associated mappings using IconRow
   *
   * @param {module:extension/style.IconRow} iconRow icon row
   */
  deleteIconAndMappingsByIconRow(iconRow: IconRow): number {
    return this.featureStyleExtension.deleteIconAndMappingsByIconRow(this.tableName, iconRow);
  }

  /**
   * Delete the icon and associated mappings using IconRow
   *
   * @param {Number} iconRowId icon row id
   */
  deleteIconAndMappingsByIconRowId(iconRowId: number): number {
    return this.featureStyleExtension.deleteIconAndMappingsByIconRowId(this.tableName, iconRowId);
  }
  /**
   * Get all the unique style row ids the table maps to
   *
   * @return {module:extension/style.StyleRow} style row ids
   */
  getAllTableStyleIds(): number[] {
    return this.featureStyleExtension.getAllTableStyleIds(this.tableName);
  }
  /**
   * Get all the unique icon row ids the table maps to
   *
   * @return {module:extension/style.IconRow} icon row ids
   */
  getAllTableIconIds(): number[] {
    return this.featureStyleExtension.getAllTableIconIds(this.tableName);
  }
  /**
   * Get all the unique style row ids the features map to
   *
   * @return {module:extension/style.StyleRow} style row ids
   */
  getAllStyleIds(): number[] {
    return this.featureStyleExtension.getAllStyleIds(this.tableName);
  }
  /**
   * Get all the unique icon row ids the features map to
   *
   * @return {module:extension/style.IconRow} icon row ids
   */
  getAllIconIds(): number[] {
    return this.featureStyleExtension.getAllIconIds(this.tableName);
  }
}

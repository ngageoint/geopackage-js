/**
 * @module extension/style
 */

import { BaseExtension } from '../baseExtension';
import { Extension } from '../extension';
import { ContentsIdDao } from '../contents/contentsIdDao';
import { IconTable } from './iconTable';
import { IconDao } from './iconDao';
import { StyleTable } from './styleTable';
import { StyleDao } from './styleDao';
import { StyleMappingTable } from './styleMappingTable';
import { StyleMappingDao } from './styleMappingDao';
import { UserMappingTable } from '../relatedTables/userMappingTable';
import { StyleTableReader } from './styleTableReader';
import { UserTableReader } from '../../user/userTableReader';
import { FeatureTable } from '../../features/user/featureTable';
import { FeatureStyles } from './featureStyles';
import { FeatureStyle } from './featureStyle';
import { Styles } from './styles';
import { Icons } from './icons';
import { IconRow } from './iconRow';
import { FeatureRow } from '../../features/user/featureRow';
import { RelatedTablesExtension } from '../relatedTables';
import { ContentsIdExtension } from '../contents';
import { GeoPackage } from '../../geoPackage';
import { ExtendedRelation } from '../relatedTables/extendedRelation';
import { StyleRow } from './styleRow';
import { StyleMappingRow } from './styleMappingRow';
import {UserCustomTableReader} from "../../user/custom/userCustomTableReader";

/**
 * Style extension
 * @param  {module:geoPackage~GeoPackage} geoPackage GeoPackage object
 * @extends BaseExtension
 * @constructor
 */
export class FeatureStyleExtension extends BaseExtension {
  relatedTablesExtension: RelatedTablesExtension;
  contentsIdExtension: ContentsIdExtension;
  public static readonly EXTENSION_NAME = 'nga_feature_style';
  public static readonly EXTENSION_AUTHOR = 'nga';
  public static readonly EXTENSION_NAME_NO_AUTHOR = 'feature_style';
  public static readonly EXTENSION_DEFINITION =
    'http://ngageoint.github.io/GeoPackage/docs/extensions/feature-style.html';
  public static readonly TABLE_MAPPING_STYLE = FeatureStyleExtension.EXTENSION_AUTHOR + '_style_';
  public static readonly TABLE_MAPPING_TABLE_STYLE = FeatureStyleExtension.EXTENSION_AUTHOR + '_style_default_';
  public static readonly TABLE_MAPPING_ICON = FeatureStyleExtension.EXTENSION_AUTHOR + '_icon_';
  public static readonly TABLE_MAPPING_TABLE_ICON = FeatureStyleExtension.EXTENSION_AUTHOR + '_icon_default_';
  constructor(geoPackage: GeoPackage) {
    super(geoPackage);
    this.relatedTablesExtension = geoPackage.relatedTablesExtension;
    this.contentsIdExtension = geoPackage.contentsIdExtension;
  }
  /**
   * Get or create the metadata extension
   *  @param {module:features/user/featureTable|String} featureTable, defaults to null
   * @return {Promise}
   */
  getOrCreateExtension(featureTable: FeatureTable | string): Extension {
    return this.getOrCreate(
      FeatureStyleExtension.EXTENSION_NAME,
      this.getFeatureTableName(featureTable),
      null,
      FeatureStyleExtension.EXTENSION_DEFINITION,
      Extension.READ_WRITE,
    );
  }
  /**
   * Determine if the GeoPackage has the extension or has the extension for the feature table
   * @param {module:features/user/featureTable|String} featureTable feature table
   * @returns {Boolean}
   */
  has(featureTable: FeatureTable | string): boolean {
    return this.hasExtension(FeatureStyleExtension.EXTENSION_NAME, this.getFeatureTableName(featureTable), null);
  }
  /**
   * Gets featureTables
   * @returns {String[]}
   */
  getTables(): string[] {
    const tables = [];
    if (this.extensionsDao.isTableExists()) {
      const extensions = this.extensionsDao.queryAllByExtension(FeatureStyleExtension.EXTENSION_NAME);
      for (let i = 0; i < extensions.length; i++) {
        tables.push(extensions[i].table_name);
      }
    }
    return tables;
  }
  /**
   * Get the related tables extension
   * @returns {module:extension/relatedTables~RelatedTablesExtension}
   */
  getRelatedTables(): RelatedTablesExtension {
    return this.relatedTablesExtension;
  }
  /**
   * Get the contentsId extension
   * @returns {module:extension/contents~ContentsIdExtension}
   */
  getContentsId(): ContentsIdExtension {
    return this.contentsIdExtension;
  }
  /**
   * Create style, icon, table style, and table icon relationships for the
   * feature table
   * @param {module:features/user/featureTable|String} featureTable feature table
   * @return {any}
   */
  createRelationships(
    featureTable: FeatureTable | string,
  ): {
    styleRelationship: ExtendedRelation;
    tableStyleRelationship: ExtendedRelation;
    iconRelationship: ExtendedRelation;
    tableIconRelationship: ExtendedRelation;
  } {
    return {
      styleRelationship: this.createStyleRelationship(featureTable),
      tableStyleRelationship: this.createTableStyleRelationship(featureTable),
      iconRelationship: this.createIconRelationship(featureTable),
      tableIconRelationship: this.createTableIconRelationship(featureTable),
    };
  }
  /**
   * Check if feature table has a style, icon, table style, or table icon
   * relationships
   * @param {module:features/user/featureTable|String} featureTable feature table
   * @returns {boolean}
   */
  hasRelationship(featureTable: string | FeatureTable): boolean {
    return (
      this.hasStyleRelationship(featureTable) ||
      this.hasTableStyleRelationship(featureTable) ||
      this.hasIconRelationship(featureTable) ||
      this.hasTableIconRelationship(featureTable)
    );
  }
  /**
   * Create a style relationship for the feature table
   * @param {module:features/user/featureTable|String} featureTable feature table
   * @return {any}
   */
  createStyleRelationship(featureTable: string | FeatureTable): ExtendedRelation {
    return this._createStyleRelationship(
      this.getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_STYLE, featureTable),
      this.getFeatureTableName(featureTable),
      this.getFeatureTableName(featureTable),
      StyleTable.TABLE_NAME,
    );
  }
  /**
   * Determine if a style relationship exists for the feature table
   * @param {module:features/user/featureTable|String} featureTable feature table
   * @returns {boolean}
   */
  hasStyleRelationship(featureTable: string | FeatureTable): boolean {
    return this._hasStyleRelationship(
      this.getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_STYLE, featureTable),
      this.getFeatureTableName(featureTable),
      StyleTable.TABLE_NAME,
    );
  }
  /**
   * Create a feature table style relationship
   * @param {module:features/user/featureTable|String} featureTable feature table
   * @return {ExtendedRelation}
   */
  createTableStyleRelationship(featureTable: string | FeatureTable): ExtendedRelation {
    return this._createStyleRelationship(
      this.getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_TABLE_STYLE, featureTable),
      this.getFeatureTableName(featureTable),
      ContentsIdDao.TABLE_NAME,
      StyleTable.TABLE_NAME,
    );
  }
  /**
   * Determine if a feature table style relationship exists
   * @param {module:features/user/featureTable|String} featureTable feature table
   * @returns {boolean} true if relationship exists
   */
  hasTableStyleRelationship(featureTable: string | FeatureTable): boolean {
    return this._hasStyleRelationship(
      this.getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_TABLE_STYLE, featureTable),
      ContentsIdDao.TABLE_NAME,
      StyleTable.TABLE_NAME,
    );
  }
  /**
   * Create an icon relationship for the feature table
   * @param {module:features/user/featureTable|String} featureTable feature table
   * @return {ExtendedRelation}
   */
  createIconRelationship(featureTable: string | FeatureTable): ExtendedRelation {
    return this._createStyleRelationship(
      this.getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_ICON, featureTable),
      this.getFeatureTableName(featureTable),
      this.getFeatureTableName(featureTable),
      IconTable.TABLE_NAME,
    );
  }
  /**
   * Determine if an icon relationship exists for the feature table
   * @param {module:features/user/featureTable|String} featureTable feature table
   * @returns {boolean} true if relationship exists
   */
  hasIconRelationship(featureTable: string | FeatureTable): boolean {
    return this._hasStyleRelationship(
      this.getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_ICON, featureTable),
      this.getFeatureTableName(featureTable),
      IconTable.TABLE_NAME,
    );
  }
  /**
   * Create a feature table icon relationship
   * @param {module:features/user/featureTable|String} featureTable feature table
   * @return {ExtendedRelation}
   */
  createTableIconRelationship(featureTable: string | FeatureTable): ExtendedRelation {
    return this._createStyleRelationship(
      this.getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_TABLE_ICON, featureTable),
      this.getFeatureTableName(featureTable),
      ContentsIdDao.TABLE_NAME,
      IconTable.TABLE_NAME,
    );
  }
  /**
   * Determine if a feature table icon relationship exists
   * @param {module:features/user/featureTable|String} featureTable feature table
   * @returns {Boolean} true if relationship exists
   */
  hasTableIconRelationship(featureTable: string | FeatureTable): boolean {
    return this._hasStyleRelationship(
      this.getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_TABLE_ICON, featureTable),
      ContentsIdDao.TABLE_NAME,
      IconTable.TABLE_NAME,
    );
  }
  /**
   * Get the mapping table name
   * @param tablePrefix table name prefix
   * @param {module:features/user/featureTable|String} featureTable feature table name
   * @returns {String} mapping table name
   */
  getMappingTableName(tablePrefix: string, featureTable: string | FeatureTable): string {
    return tablePrefix + this.getFeatureTableName(featureTable);
  }
  /**
   * Check if the style extension relationship between a feature table and
   * style extension table exists
   * @param {String} mappingTableName mapping table name
   * @param {String} baseTable base table name
   * @param {String} relatedTable related table name
   * @returns {boolean} true if relationship exists
   */
  _hasStyleRelationship(mappingTableName: string, baseTable: string, relatedTable: string): boolean {
    return this.relatedTablesExtension.hasRelations(baseTable, relatedTable, mappingTableName);
  }
  /**
   * Create a style extension relationship between a feature table and style
   * extension table
   * @param {String} mappingTableName mapping table name
   * @param {String} featureTable feature table
   * @param {String} baseTable base table name
   * @param {String} relatedTable related table name
   * @return {ExtendedRelation}
   * @private
   */
  _createStyleRelationship(
    mappingTableName: string,
    featureTable: string,
    baseTable: string,
    relatedTable: string,
  ): ExtendedRelation {
    if (!this._hasStyleRelationship(mappingTableName, baseTable, relatedTable)) {
      // Create the extension
      this.getOrCreateExtension(featureTable);
      if (baseTable === ContentsIdDao.TABLE_NAME && !this.contentsIdExtension.has()) {
        this.contentsIdExtension.getOrCreateExtension();
      }
      return this._handleCreateStyleRelationship(mappingTableName, baseTable, relatedTable);
    } else {
      const relationships = this.geoPackage.extendedRelationDao.getRelations(baseTable, relatedTable, mappingTableName);
      // TODO this isn't quite right
      return relationships[0];
    }
  }
  /**
   * Private function to aid in creation of the a style extension relationship between a feature table and style extension table
   * @param {String} mappingTableName
   * @param {String} baseTable
   * @param {String} relatedTable
   * @return {ExtendedRelation}
   * @private
   */
  _handleCreateStyleRelationship(
    mappingTableName: string,
    baseTable: string,
    relatedTable: string,
  ): ExtendedRelation {
    if (relatedTable === StyleTable.TABLE_NAME) {
      return this.relatedTablesExtension.addAttributesRelationship(
        this.geoPackage.relatedTablesExtension
          .getRelationshipBuilder()
          .setBaseTableName(baseTable)
          .setUserMappingTable(StyleMappingTable.create(mappingTableName))
          .setRelatedTable(StyleTable.create()),
      );
    } else {
      return this.relatedTablesExtension.addMediaRelationship(
        this.geoPackage.relatedTablesExtension
          .getRelationshipBuilder()
          .setBaseTableName(baseTable)
          .setUserMappingTable(StyleMappingTable.create(mappingTableName))
          .setRelatedTable(IconTable.create()),
      );
    }
  }
  /**
   * Delete the style and icon table and row relationships for all feature
   * tables
   */
  deleteAllRelationships(): {
    styleRelationships: number;
    tableStyleRelationships: number;
    iconRelationship: number;
    tableIconRelationship: number;
  } {
    const removed = {
      styleRelationships: 0,
      tableStyleRelationships: 0,
      iconRelationship: 0,
      tableIconRelationship: 0,
    };
    const tables = this.getTables();
    for (let i = 0; i < tables.length; i++) {
      const {
        styleRelationships,
        tableStyleRelationships,
        iconRelationship,
        tableIconRelationship,
      } = this.deleteRelationships(tables[i]);

      removed.styleRelationships += styleRelationships;
      removed.tableStyleRelationships += tableStyleRelationships;
      removed.iconRelationship += iconRelationship;
      removed.tableIconRelationship += tableIconRelationship;
    }
    return removed;
  }
  /**
   * Delete the style and icon table and row relationships for the feature
   * table
   * @param {module:features/user/featureTable|String} featureTable feature table
   */
  deleteRelationships(
    featureTable: string | FeatureTable,
  ): {
    styleRelationships: number;
    tableStyleRelationships: number;
    iconRelationship: number;
    tableIconRelationship: number;
  } {
    return {
      styleRelationships: this.deleteStyleRelationship(featureTable),
      tableStyleRelationships: this.deleteTableStyleRelationship(featureTable),
      iconRelationship: this.deleteIconRelationship(featureTable),
      tableIconRelationship: this.deleteTableIconRelationship(featureTable),
    };
  }
  /**
   * Delete a style relationship for the feature table
   * @param {module:features/user/featureTable|String} featureTable feature table
   */
  deleteStyleRelationship(featureTable: string | FeatureTable): number {
    return this._deleteStyleRelationship(
      this.getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_STYLE, featureTable),
      featureTable,
    );
  }
  /**
   * Delete a table style relationship for the feature table
   * @param {module:features/user/featureTable|String} featureTable feature table
   */
  deleteTableStyleRelationship(featureTable: string | FeatureTable): number {
    return this._deleteStyleRelationship(
      this.getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_TABLE_STYLE, featureTable),
      featureTable,
    );
  }
  /**
   * Delete a icon relationship for the feature table
   * @param {module:features/user/featureTable|String} featureTable feature table
   */
  deleteIconRelationship(featureTable: string | FeatureTable): number {
    return this._deleteStyleRelationship(
      this.getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_ICON, featureTable),
      featureTable,
    );
  }
  /**
   * Delete a table icon relationship for the feature table
   * @param {module:features/user/featureTable|String} featureTable feature table
   */
  deleteTableIconRelationship(featureTable: string | FeatureTable): number {
    return this._deleteStyleRelationship(
      this.getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_TABLE_ICON, featureTable),
      featureTable,
    );
  }
  /**
   * Delete a style extension feature table relationship and the mapping table
   * @param {String} mappingTableName
   * @param {module:features/user/featureTable|String} featureTable feature table
   * @private
   */
  _deleteStyleRelationship(mappingTableName: string, featureTable: string | FeatureTable): number {
    let removed = 0;
    const relationships = this.geoPackage.extendedRelationDao.queryByMappingTableName(mappingTableName);
    for (let i = 0; i < relationships.length; i++) {
      removed += this.relatedTablesExtension.removeRelationship(relationships[i]);
    }
    if (!this.hasRelationship(featureTable)) {
      if (this.extensionsDao.isTableExists()) {
        this.extensionsDao.deleteByExtensionAndTableName(
          FeatureStyleExtension.EXTENSION_NAME,
          this.getFeatureTableName(featureTable),
        );
      }
    }
    return removed;
  }
  /**
   * Get a Style Mapping DAO
   * @param {module:features/user/featureTable|String} featureTable feature table
   * @return {module:extension/style.StyleMappingDao} style mapping DAO
   */
  getStyleMappingDao(featureTable: string | FeatureTable): StyleMappingDao {
    return this._getMappingDao(FeatureStyleExtension.TABLE_MAPPING_STYLE, featureTable);
  }
  /**
   * Get a Table Style Mapping DAO
   * @param {module:features/user/featureTable|String} featureTable feature table
   * @return {module:extension/style.StyleMappingDao} table style mapping DAO
   */
  getTableStyleMappingDao(featureTable: string | FeatureTable): StyleMappingDao {
    return this._getMappingDao(FeatureStyleExtension.TABLE_MAPPING_TABLE_STYLE, featureTable);
  }
  /**
   * Get a Icon Mapping DAO
   * @param {module:features/user/featureTable|String} featureTable feature table
   * @return {module:extension/style.StyleMappingDao} icon mapping DAO
   */
  getIconMappingDao(featureTable: FeatureTable | string): StyleMappingDao {
    return this._getMappingDao(FeatureStyleExtension.TABLE_MAPPING_ICON, featureTable);
  }
  /**
   * Get a Table Icon Mapping DAO
   * @param {module:features/user/featureTable|String} featureTable feature table
   * @return {module:extension/style.StyleMappingDao} table icon mapping DAO
   */
  getTableIconMappingDao(featureTable: string | FeatureTable): StyleMappingDao {
    return this._getMappingDao(FeatureStyleExtension.TABLE_MAPPING_TABLE_ICON, featureTable);
  }
  /**
   * Get a Style Mapping DAO from a table name
   * @param {String} tablePrefix table name prefix
   * @param {module:features/user/featureTable|String} featureTable feature table
   * @return {module:extension/style.StyleMappingDao} style mapping dao
   * @private
   */
  _getMappingDao(tablePrefix: string, featureTable: string | FeatureTable): StyleMappingDao {
    const featureTableName = this.getFeatureTableName(featureTable);
    const tableName = tablePrefix + featureTableName;
    let dao = null;
    if (this.geoPackage.isTable(tableName)) {
      dao = new StyleMappingDao(
        this.relatedTablesExtension.getUserDao(tableName),
        this.geoPackage,
      );
    }
    return dao;
  }
  /**
   * Get a style DAO
   * @return {module:extension/style.StyleDao} style DAO
   */
  getStyleDao(): StyleDao {
    let styleDao = null;
    if (this.geoPackage.isTable(StyleTable.TABLE_NAME)) {
      const contents = this.geoPackage.contentsDao.queryForId(StyleTable.TABLE_NAME);
      if (contents) {
        const reader = new StyleTableReader(contents.table_name);
        const table = reader.readTable(this.geoPackage.connection) as StyleTable;
        table.setContents(contents);
        styleDao = new StyleDao(this.geoPackage, table);
      }
    }
    return styleDao;
  }
  /**
   * Get a icon DAO
   * @return {module:extension/style.IconDao}
   */
  getIconDao(): IconDao {
    let iconDao = null;
    if (this.geoPackage.isTable(IconTable.TABLE_NAME)) {
      const reader = new UserCustomTableReader(IconTable.TABLE_NAME);
      const userTable = reader.readTable(this.geoPackage.database);
      const table = new IconTable(userTable.getTableName(), userTable.getUserColumns().getColumns(), IconTable.requiredColumns());
      table.setContents(this.geoPackage.contentsDao.queryForId(IconTable.TABLE_NAME));
      iconDao = new IconDao(this.geoPackage, table);
    }
    return iconDao;
  }
  /**
   * Get the feature table default feature styles
   * @param {module:features/user/featureTable|String} featureTable feature table
   * @return {module:extension/style.FeatureStyles} table feature styles or null
   */
  getTableFeatureStyles(featureTable: string | FeatureTable): FeatureStyles {
    let featureStyles = null;
    const id = this.contentsIdExtension.getIdByTableName(this.getFeatureTableName(featureTable));
    if (id !== null) {
      const styles = this.getTableStyles(featureTable);
      const icons = this.getTableIcons(featureTable);
      if (styles !== null || icons !== null) {
        featureStyles = new FeatureStyles(styles, icons);
      }
    }
    return featureStyles;
  }
  /**
   * Get the default style of the feature table
   * @param {module:features/user/featureTable|String} featureTable feature table
   * @return {module:extension/style.StyleRow} style row
   */
  getTableStyleDefault(featureTable: string | FeatureTable): StyleRow {
    return this.getTableStyle(featureTable, null);
  }
  /**
   * Get the style of the feature table and geometry type
   * @param {module:features/user/featureTable|String} featureTable feature table
   * @param {String} geometryType geometry type
   * @return {module:extension/style.StyleRow} style row
   */
  getTableStyle(featureTable: string | FeatureTable, geometryType: string): StyleRow {
    let style = null;
    const styles = this.getTableStyles(featureTable);
    if (styles !== null) {
      if (geometryType === null) {
        style = styles.getDefault();
      } else {
        style = styles.getStyle(geometryType);
      }
    }
    return style;
  }
  /**
   * Get the feature table default styles
   * @param {module:features/user/featureTable|String} featureTable feature table
   * @return {module:extension/style.Styles} table styles or null
   */
  getTableStyles(featureTable: string | FeatureTable): Styles {
    let styles = null;
    const id = this.contentsIdExtension.getIdByTableName(this.getFeatureTableName(featureTable));
    if (id !== null) {
      styles = this.getStyles(id, this.getTableStyleMappingDao(featureTable));
    }
    return styles;
  }
  /**
   * Get the default icon of the feature table
   * @param {module:features/user/featureTable|String} featureTable feature table
   * @return {module:extension/style.IconRow} icon row
   */
  getTableIconDefault(featureTable: string | FeatureTable): IconRow {
    return this.getTableIcon(featureTable, null);
  }
  /**
   * Get the icon of the feature table and geometry type
   * @param {module:features/user/featureTable|String} featureTable feature table
   * @param {String} geometryType geometry type
   * @return {module:extension/style.IconRow} icon row
   */
  getTableIcon(featureTable: string | FeatureTable, geometryType: string): IconRow {
    let icon = null;
    const icons = this.getTableIcons(featureTable);
    if (icons !== null) {
      if (geometryType === null) {
        icon = icons.getDefault();
      } else {
        icon = icons.getIcon(geometryType);
      }
    }
    return icon;
  }
  /**
   * Get the feature table default icons
   * @param {module:features/user/featureTable|String} featureTable feature table
   * @return {module:extension/style.Icons} table icons or null
   */
  getTableIcons(featureTable: string | FeatureTable): Icons {
    let icons = null;
    const id = this.contentsIdExtension.getIdByTableName(this.getFeatureTableName(featureTable));
    if (id !== null) {
      icons = this.getIcons(id, this.getTableIconMappingDao(featureTable));
    }
    return icons;
  }
  /**
   * Gets Icons for featureId and mappingDao
   * @param {Number} featureId
   * @param mappingDao
   * @returns {module:extension/style.Icons}
   * @private
   */
  getIcons(featureId: number, mappingDao: StyleMappingDao): Icons {
    let icons = new Icons();
    if (mappingDao !== null) {
      const iconDao = this.getIconDao();
      const styleMappingRows = mappingDao.queryByBaseId(featureId);
      for (let i = 0; i < styleMappingRows.length; i++) {
        const styleMappingRow = mappingDao.createObject(styleMappingRows[i]) as StyleMappingRow;
        const iconRow = iconDao.queryForId(styleMappingRow.relatedId) as IconRow;
        if (styleMappingRow.getGeometryTypeName() === null) {
          icons.setDefault(iconRow);
        } else {
          icons.setIcon(iconRow, styleMappingRow.getGeometryTypeName());
        }
      }
    }
    if (icons.isEmpty()) {
      icons = null;
    }
    return icons;
  }
  /**
   * Gets Styles for featureId and mappingDao
   * @param {Number} featureId
   * @param {module:extension/style.StyleMappingDao} mappingDao
   * @returns {module:extension/style.Styles}
   */
  getStyles(featureId: number, mappingDao: StyleMappingDao): Styles {
    let styles = new Styles();
    if (mappingDao !== null) {
      const styleDao = this.getStyleDao();
      const styleMappingRows = mappingDao.queryByBaseId(featureId);
      for (let i = 0; i < styleMappingRows.length; i++) {
        const styleMappingRow = mappingDao.createObject(styleMappingRows[i]) as StyleMappingRow;
        const styleRow = styleDao.queryForId(styleMappingRow.relatedId) as StyleRow;
        if (styleMappingRow.getGeometryTypeName() === null) {
          styles.setDefault(styleRow);
        } else {
          styles.setStyle(styleRow, styleMappingRow.getGeometryTypeName());
        }
      }
    }
    if (styles.isEmpty()) {
      styles = null;
    }
    return styles;
  }
  /**
   * Get the feature styles for the feature row
   * @param {module:features/user/featureRow} featureRow feature row
   * @return {module:extension/style.FeatureStyles} feature styles or null
   */
  getFeatureStylesForFeatureRow(featureRow: FeatureRow): FeatureStyles {
    return this.getFeatureStyles(featureRow.featureTable, featureRow.id);
  }
  /**
   * Get the feature styles for the feature row
   * @param {module:features/user/featureTable|String} featureTable feature table
   * @param {Number} featureId feature id
   * @return {module:extension/style.FeatureStyles} feature styles or null
   */
  getFeatureStyles(featureTable: string | FeatureTable, featureId: number): FeatureStyles {
    const styles = this.getStyles(featureId, this.getStyleMappingDao(featureTable));
    const icons = this.getIcons(featureId, this.getIconMappingDao(featureTable));
    let featureStyles = null;
    if (styles !== null || icons !== null) {
      featureStyles = new FeatureStyles(styles, icons);
    }
    return featureStyles;
  }
  /**
   * Get the styles for the feature row
   * @param {module:features/user/featureRow} featureRow feature row
   * @return {module:extension/style.Styles} styles or null
   */
  getStylesForFeatureRow(featureRow: FeatureRow): Styles {
    return this.getStyles(featureRow.id, this.getStyleMappingDao(featureRow.featureTable.getTableName()));
  }
  /**
   * Get the styles for the feature id
   * @param {String} tableName table name
   * @param {Number} featureId feature id
   * @return {module:extension/style.Styles} styles or null
   */
  getStylesForFeatureId(tableName: string, featureId: number): Styles {
    return this.getStyles(featureId, this.getStyleMappingDao(tableName));
  }
  /**
   * Get the icons for the feature row
   * @param {module:features/user/featureRow} featureRow feature row
   * @return {module:extension/style.Icons} icons or null
   */
  getIconsForFeatureRow(featureRow: FeatureRow): Icons {
    return this.getIcons(featureRow.id, this.getIconMappingDao(featureRow.featureTable.getTableName()));
  }
  /**
   * Get the icons for the feature id
   * @param {String} tableName table name
   * @param {Number} featureId feature id
   * @return {module:extension/style.Icons} icons or null
   */
  getIconsForFeatureId(tableName: string, featureId: number): Icons {
    return this.getIcons(featureId, this.getIconMappingDao(tableName));
  }
  /**
   * Get the feature style (style and icon) of the feature row, searching in
   * order: feature geometry type style or icon, feature default style or
   * icon, table geometry type style or icon, table default style or icon
   * @param {module:features/user/featureRow} featureRow feature row
   * @return {module:extension/style.FeatureStyle} feature style
   */
  getFeatureStyleForFeatureRow(featureRow: FeatureRow): FeatureStyle {
    return new FeatureStyle(
      this.getStyle(featureRow.featureTable.getTableName(), featureRow.id, featureRow.geometryType, true),
      this.getIcon(featureRow.featureTable.getTableName(), featureRow.id, featureRow.geometryType, true),
    );
  }
  /**
   * Get the feature style (style and icon) of the feature, searching in
   * order: feature geometry type style or icon, feature default style or
   * icon, table geometry type style or icon, table default style or icon
   * @param {module:features/user/featureRow} featureRow feature row
   * @return {module:extension/style.FeatureStyle} feature style
   */
  getFeatureStyleDefault(featureRow: FeatureRow): FeatureStyle {
    return new FeatureStyle(
      this.getStyle(featureRow.featureTable.getTableName(), featureRow.id, null, true),
      this.getIcon(featureRow.featureTable.getTableName(), featureRow.id, null, true),
    );
  }
  /**
   * Get the icon of the feature, searching in order: feature geometry type
   * icon, feature default icon, when tableIcon enabled continue searching:
   * table geometry type icon, table default icon
   * @param {module:features/user/featureTable|String} featureTable
   * @param {Number} featureId
   * @param {String} geometryType
   * @param {Boolean} tableIcon
   * @returns {module:extension/style.IconRow}
   * @private
   */
  getIcon(featureTable: string | FeatureTable, featureId: number, geometryType: string, tableIcon: boolean): IconRow {
    let iconRow = null;
    const icons = this.getIcons(featureId, this.getIconMappingDao(featureTable));
    if (icons !== null) {
      iconRow = icons.getIcon(geometryType);
    }
    if (iconRow === null && tableIcon) {
      iconRow = this.getTableIcon(featureTable, geometryType);
    }
    return iconRow;
  }
  /**
   * Get the style of the feature, searching in order: feature geometry type
   * style, feature default style, when tableStyle enabled continue searching:
   * table geometry type style, table default style
   * @param {module:features/user/featureTable|String} featureTable
   * @param {Number} featureId
   * @param {String} geometryType
   * @param {Boolean} tableStyle
   * @returns {module:extension/style.StyleRow}
   * @private
   */
  getStyle(
    featureTable: string | FeatureTable,
    featureId: number,
    geometryType: string,
    tableStyle: boolean,
  ): StyleRow {
    let styleRow = null;
    const styles = this.getStyles(featureId, this.getStyleMappingDao(featureTable));
    if (styles !== null) {
      styleRow = styles.getStyle(geometryType);
    }
    if (styleRow === null && tableStyle) {
      styleRow = this.getTableStyle(featureTable, geometryType);
    }
    return styleRow;
  }
  /**
   * Set the feature table default feature styles
   * @param {module:features/user/featureTable~FeatureTable|String} featureTable feature table
   * @param {module:extension/style.FeatureStyles} featureStyles feature styles
   * @return {any}
   */
  setTableFeatureStyles(
    featureTable: string | FeatureTable,
    featureStyles?: FeatureStyles,
  ): {
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
  } {
    if (featureStyles !== null) {
      const tableStyles = this.setTableStyles(featureTable, featureStyles.styles);
      const tableIcons = this.setTableIcons(featureTable, featureStyles.icons);
      return {
        tableStyles: tableStyles,
        tableIcons: tableIcons,
      };
    } else {
      return {
        deleted: this.deleteTableFeatureStyles(featureTable),
        tableStyles: undefined,
        tableIcons: undefined,
      };
    }
  }
  /**
   * Set the feature table default styles
   * @param {module:features/user/featureTable~FeatureTable|String} featureTable feature table
   * @param {module:extension/style.Styles} styles default styles
   * @return {any}
   */
  setTableStyles(
    featureTable: string | FeatureTable,
    styles?: Styles,
  ): { styleDefault: number; styles: number[]; deleted: number } {
    const deleted = this.deleteTableStyles(featureTable);
    if (styles !== null) {
      let styleIdList = [];
      let styleDefault = undefined;
      if (styles.getDefault() !== null) {
        styleDefault = this.setTableStyleDefault(featureTable, styles.getDefault());
      }
      const keys = Object.keys(styles.styles);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const value = styles.styles[key];
        styleIdList.push(this.setTableStyle(featureTable, key, value));
      }
      return {
        styleDefault,
        styles: styleIdList,
        deleted,
      };
    }
  }
  /**
   * Set the feature table style default
   * @param {module:features/user/featureTable~FeatureTable|String} featureTable feature table
   * @param {module:extension/style.StyleRow} style style row
   * @return {number}
   */
  setTableStyleDefault(featureTable: string | FeatureTable, style: StyleRow): number {
    return this.setTableStyle(featureTable, null, style);
  }
  /**
   * Set the feature table style for the geometry type
   * @param {module:features/user/featureTable~FeatureTable|String} featureTable feature table
   * @param {String} geometryType geometry type
   * @param {module:extension/style.StyleRow} style style row
   * @return {number}
   */
  setTableStyle(featureTable: string | FeatureTable, geometryType: string, style?: StyleRow): number {
    this.deleteTableStyle(featureTable, geometryType);
    if (style !== null) {
      this.createTableStyleRelationship(featureTable);
      const featureContentsId = this.contentsIdExtension.getOrCreateIdByTableName(
        this.getFeatureTableName(featureTable),
      );
      const styleId = this.getOrInsertStyle(style);
      const mappingDao = this.getTableStyleMappingDao(featureTable);
      return this.insertStyleMapping(mappingDao, featureContentsId.id, styleId, geometryType);
    }
  }
  /**
   * Set the feature table default icons
   * @param {module:features/user/featureTable~FeatureTable|String} featureTable feature table
   * @param {module:extension/style.Icons} icons default icons
   * @return {any}
   */
  setTableIcons(
    featureTable: string | FeatureTable,
    icons?: Icons,
  ): { iconDefault: number; icons: number[]; deleted: number } {
    const deleted = this.deleteTableIcons(featureTable);
    if (icons !== null) {
      let iconDefault = undefined;
      let iconIdList= [];
      if (icons.getDefault() !== null) {
        iconDefault = this.setTableIconDefault(featureTable, icons.getDefault());
      }
      const keys = Object.keys(icons.icons);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const value = icons.icons[key];
        iconIdList.push(this.setTableIcon(featureTable, key, value));
      }
      return {
        iconDefault,
        icons: iconIdList,
        deleted,
      };
    }
  }
  /**
   * Set the feature table icon default
   * @param {module:features/user/featureTable~FeatureTable|String} featureTable feature table
   * @param {module:extension/style.IconRow} icon icon row
   * @return {number}
   */
  setTableIconDefault(featureTable: string | FeatureTable, icon?: IconRow): number {
    return this.setTableIcon(featureTable, null, icon);
  }
  /**
   * Set the feature table icon for the geometry type
   * @param {module:features/user/featureTable~FeatureTable|String} featureTable feature table
   * @param {String} geometryType geometry type
   * @param {module:extension/style.IconRow} icon icon row
   * @return {number}
   */
  setTableIcon(featureTable: string | FeatureTable, geometryType: string, icon?: IconRow): number {
    this.deleteTableIcon(featureTable, geometryType);
    if (icon !== null) {
      this.createTableIconRelationship(featureTable);
      const featureContentsId = this.contentsIdExtension.getOrCreateIdByTableName(
        this.getFeatureTableName(featureTable),
      );
      const iconId = this.getOrInsertIcon(icon);
      const mappingDao = this.getTableIconMappingDao(featureTable);
      return this.insertStyleMapping(mappingDao, featureContentsId.id, iconId, geometryType);
    }
  }
  /**
   * Set the feature styles for the feature row
   * @param {module:features/user/featureRow} featureRow feature row
   * @param {module:extension/style.FeatureStyles} featureStyles feature styles
   * @return {any}
   */
  setFeatureStylesForFeatureRow(
    featureRow: FeatureRow,
    featureStyles: FeatureStyles,
  ): {
    styles: { styleDefault: number; styles: number[] };
    icons: {
      iconDefault: number;
      icons: number[];
      deleted?: {
        style: number;
        icon: number;
      };
    };
  } {
    return this.setFeatureStyles(featureRow.featureTable.getTableName(), featureRow.id, featureStyles);
  }

  /**
   * Set the feature styles for the feature table and feature id
   * @param {module:features/user/featureTable~FeatureTable|String} featureTable feature table
   * @param {Number} featureId feature id
   * @param {module:extension/style.FeatureStyles} featureStyles feature styles
   * @return {any}
   */
  setFeatureStyles(
    featureTable: string | FeatureTable,
    featureId: number,
    featureStyles?: FeatureStyles,
  ): {
    styles: { styleDefault: number; styles: number[] };
    icons: { iconDefault: number; icons: number[] };
    deleted?: {
      deletedStyles: number;
      deletedIcons: number;
    };
  } {
    if (featureStyles !== null) {
      const styles = this.setStyles(featureTable, featureId, featureStyles.styles);
      const icons = this.setIcons(featureTable, featureId, featureStyles.icons);
      return {
        styles,
        icons,
      };
    } else {
      const deletedStyles = this.deleteStyles(featureTable); //, featureId);
      const deletedIcons = this.deleteIcons(featureTable); //, featureId);
      return {
        styles: undefined,
        icons: undefined,
        deleted: {
          deletedStyles,
          deletedIcons,
        },
      };
    }
  }
  /**
   * Set the feature style (style and icon) of the feature row
   * @param {module:features/user/featureRow} featureRow feature row
   * @param {module:extension/style.FeatureStyle} featureStyle feature style
   * @return {any}
   */
  setFeatureStyleForFeatureRow(
    featureRow: FeatureRow,
    featureStyle: FeatureStyle,
  ): {
    style: number;
    icon: number;
    deleted?: {
      style: number;
      icon: number;
    };
  } {
    return this.setFeatureStyleForFeatureRowAndGeometryType(featureRow, featureRow.geometryType, featureStyle);
  }
  /**
   * Set the feature style (style and icon) of the feature row for the
   * specified geometry type
   * @param {module:features/user/featureRow} featureRow feature row
   * @param {String} geometryType geometry type
   * @param {module:extension/style.FeatureStyle} featureStyle feature style
   * @return {any}
   */
  setFeatureStyleForFeatureRowAndGeometryType(
    featureRow: FeatureRow,
    geometryType: string,
    featureStyle: FeatureStyle,
  ): {
    style: number;
    icon: number;
    deleted?: {
      style: number;
      icon: number;
    };
  } {
    return this.setFeatureStyle(featureRow.featureTable.getTableName(), featureRow.id, geometryType, featureStyle);
  }
  /**
   * Set the feature style default (style and icon) of the feature row
   * @param {module:features/user/featureRow} featureRow feature row
   * @param {module:extension/style.FeatureStyle} featureStyle feature style
   * @return {any}
   */
  setFeatureStyleDefaultForFeatureRow(
    featureRow: FeatureRow,
    featureStyle: FeatureStyle,
  ): {
    style: number;
    icon: number;
    deleted?: {
      style: number;
      icon: number;
    };
  } {
    return this.setFeatureStyle(featureRow.featureTable.getTableName(), featureRow.id, null, featureStyle);
  }
  /**
   * Set the feature style (style and icon) of the feature
   * @param {module:features/user/featureTable~FeatureTable|String} featureTable feature table
   * @param {Number} featureId feature id
   * @param {String} geometryType geometry type
   * @param {module:extension/style.FeatureStyle} featureStyle feature style
   * @return {any}
   */
  setFeatureStyle(
    featureTable: string | FeatureTable,
    featureId: number,
    geometryType: string,
    featureStyle?: FeatureStyle,
  ): {
    style: number;
    icon: number;
    deleted?: {
      style: number;
      icon: number;
    };
  } {
    if (featureStyle !== null) {
      return {
        style: this.setStyle(featureTable, featureId, geometryType, featureStyle.style),
        icon: this.setIcon(featureTable, featureId, geometryType, featureStyle.icon),
      }
    } else {
      return {
        style: undefined,
        icon: undefined,
        deleted: {
          style: this.deleteStyle(featureTable, featureId, geometryType),
          icon: this.deleteIcon(featureTable, featureId, geometryType),
        },
      };
    }
  }
  /**
   * Set the feature style (style and icon) of the feature
   * @param {module:features/user/featureTable~FeatureTable|String} featureTable feature table
   * @param {Number} featureId feature id
   * @param {module:extension/style.FeatureStyle} featureStyle feature style
   * @return {object}
   */
  setFeatureStyleDefault(
    featureTable: string | FeatureTable,
    featureId: number,
    featureStyle: FeatureStyle,
  ): {
    style: number;
    icon: number;
    deleted?: {
      style: number;
      icon: number;
    };
  } {
    return this.setFeatureStyle(featureTable, featureId, null, featureStyle);
  }
  /**
   * Set the styles for the feature row
   * @param {module:features/user/featureRow} featureRow feature row
   * @param {module:extension/style.Styles} styles styles
   * @return {Promise}
   */
  setStylesForFeatureRow(
    featureRow: FeatureRow,
    styles: Styles,
  ): { styleDefault: number; styles: number[]; deleted: number } {
    return this.setStyles(featureRow.featureTable.getTableName(), featureRow.id, styles);
  }
  /**
   * Set the styles for the feature table and feature id
   * @param {module:features/user/featureTable~FeatureTable|String} featureTable feature table
   * @param {Number} featureId feature id
   * @param {module:extension/style.Styles} styles styles
   * @return {Promise}
   */
  setStyles(
    featureTable: string | FeatureTable,
    featureId: number,
    styles?: Styles,
  ): { styleDefault: number; styles: number[]; deleted: number } {
    const deleted = this.deleteStylesForFeatureId(featureTable, featureId);
    if (styles !== null) {
      let styleIds = [];
      let styleDefault = undefined;
      if (styles.getDefault() !== null) {
        styleDefault = this.setStyleDefault(featureTable, featureId, styles.getDefault());
      }
      const keys = Object.keys(styles.styles);
      for (let i = 0; i < keys.length; i++) {
        styleIds.push(this.setStyle(featureTable, featureId, keys[i], styles.styles[keys[i]]));
      }
      return {
        styleDefault,
        styles: styleIds,
        deleted,
      };
    } else {
      return {
        styleDefault: undefined,
        styles: undefined,
        deleted,
      };
    }
  }
  /**
   * Set the style of the feature row
   * @param {module:features/user/featureRow} featureRow feature row
   * @param {module:extension/style.StyleRow} style style row
   * @return {Promise}
   */
  setStyleForFeatureRow(featureRow: FeatureRow, style: StyleRow): number {
    return this.setStyleForFeatureRowAndGeometryType(featureRow, featureRow.geometryType, style);
  }
  /**
   * Set the style of the feature row for the specified geometry type
   * @param {module:features/user/featureRow} featureRow feature row
   * @param {String} geometryType geometry type
   * @param {module:extension/style.StyleRow} style style row
   * @return {Promise}
   */
  setStyleForFeatureRowAndGeometryType(
    featureRow: FeatureRow,
    geometryType: string,
    style: StyleRow,
  ): number {
    return this.setStyle(featureRow.featureTable.getTableName(), featureRow.id, geometryType, style);
  }
  /**
   * Set the default style of the feature row
   * @param {module:features/user/featureRow} featureRow feature row
   * @param {module:extension/style.StyleRow} style style row
   * @return {Promise}
   */
  setStyleDefaultForFeatureRow(featureRow: FeatureRow, style: StyleRow): number {
    return this.setStyle(featureRow.featureTable.getTableName(), featureRow.id, null, style);
  }
  /**
   * Set the style of the feature
   * @param {module:features/user/featureTable~FeatureTable|String} featureTable feature table
   * @param {Number} featureId feature id
   * @param {String} geometryType geometry type
   * @param {module:extension/style.StyleRow} style style row
   * @return {number}
   */
  setStyle(
    featureTable: string | FeatureTable,
    featureId: number,
    geometryType: string,
    style: StyleRow,
  ): number {
    this.deleteStyle(featureTable, featureId, geometryType);
    if (style !== null) {
      this.createStyleRelationship(featureTable);
      const styleId = this.getOrInsertStyle(style);
      const mappingDao = this.getStyleMappingDao(featureTable);
      return this.insertStyleMapping(mappingDao, featureId, styleId, geometryType);
    }
  }
  /**
   * Set the default style of the feature
   * @param {module:features/user/featureTable~FeatureTable|String} featureTable feature table
   * @param {Number} featureId feature id
   * @param {module:extension/style.StyleRow} style style row
   * @return {number}
   */
  setStyleDefault(featureTable: string | FeatureTable, featureId: number, style: StyleRow): number {
    return this.setStyle(featureTable, featureId, null, style);
  }
  /**
   * Set the icons for the feature row
   * @param {module:features/user/featureRow} featureRow feature row
   * @param {module:extension/style.Icons} icons icons
   * @return {Promise}
   */
  setIconsForFeatureRow(
    featureRow: FeatureRow,
    icons: Icons,
  ): { iconDefault: number; icons: number[]; deleted: number } {
    return this.setIcons(featureRow.featureTable.getTableName(), featureRow.id, icons);
  }
  /**
   * Set the icons for the feature table and feature id
   * @param {module:features/user/featureTable~FeatureTable|String} featureTable feature table
   * @param {Number} featureId feature id
   * @param {module:extension/style.Icons} icons icons
   * @return {Promise}
   */
  setIcons(
    featureTable: string | FeatureTable,
    featureId: number,
    icons?: Icons,
  ): { iconDefault: number; icons: number[]; deleted: number } {
    const deleted = this.deleteIconsForFeatureId(featureTable, featureId);
    if (icons !== null) {
      if (icons.getDefault() !== null) {
        this.setIconDefault(featureTable, featureId, icons.getDefault());
      }
      const keys = Object.keys(icons.icons);
      for (let i = 0; i < keys.length; i++) {
        this.setIcon(featureTable, featureId, keys[i], icons.icons[keys[i]]);
      }
      return {
        iconDefault: undefined,
        icons: undefined,
        deleted,
      };
    } else {
      return {
        iconDefault: undefined,
        icons: undefined,
        deleted,
      };
    }
  }
  /**
   * Set the icon of the feature row
   * @param {module:features/user/featureRow} featureRow feature row
   * @param {module:extension/style.IconRow} icon icon row
   * @return {number}
   */
  setIconForFeatureRow(featureRow: FeatureRow, icon: IconRow): number {
    return this.setIconForFeatureRowAndGeometryType(featureRow, featureRow.geometryType, icon);
  }
  /**
   * Set the icon of the feature row for the specified geometry type
   * @param {module:features/user/featureRow} featureRow feature row
   * @param {String} geometryType geometry type
   * @param {module:extension/style.IconRow} icon icon row
   * @return {number}
   */
  setIconForFeatureRowAndGeometryType(
    featureRow: FeatureRow,
    geometryType: string,
    icon: IconRow,
  ): number {
    return this.setIcon(featureRow.featureTable.getTableName(), featureRow.id, geometryType, icon);
  }
  /**
   * Set the default icon of the feature row
   * @param {module:features/user/featureRow} featureRow feature row
   * @param {module:extension/style.IconRow} icon icon row
   * @return {number}
   */
  setIconDefaultForFeatureRow(featureRow: FeatureRow, icon: IconRow): number {
    return this.setIcon(featureRow.featureTable.getTableName(), featureRow.id, null, icon);
  }
  /**
   * Get the icon of the feature, searching in order: feature geometry type
   * icon, feature default icon, table geometry type icon, table default icon
   * @param {module:features/user/featureTable~FeatureTable|String} featureTable feature table
   * @param {Number} featureId feature id
   * @param {String} geometryType geometry type
   * @param {module:extension/style.IconRow} icon icon row
   * @return {number}
   */
  setIcon(
    featureTable: string | FeatureTable,
    featureId: number,
    geometryType: string,
    icon?: IconRow,
  ): number {
    this.deleteIcon(featureTable, featureId, geometryType);
    if (icon !== null) {
      this.createIconRelationship(featureTable);
      const iconId = this.getOrInsertIcon(icon);
      const mappingDao = this.getIconMappingDao(featureTable);
      return this.insertStyleMapping(mappingDao, featureId, iconId, geometryType);
    }
  }
  /**
   * Set the default icon of the feature
   * @param {module:features/user/featureTable|String} featureTable feature table
   * @param {Number} featureId feature id
   * @param {module:extension/style.IconRow} icon icon row
   * @return {number}
   */
  setIconDefault(featureTable: string | FeatureTable, featureId: number, icon: IconRow): number {
    return this.setIcon(featureTable, featureId, null, icon);
  }
  /**
   * Get the style id, either from the existing style or by inserting a new one
   * @param {module:extension/style.StyleRow} style style row
   * @return {Number} style id
   */
  getOrInsertStyle(style: StyleRow): number {
    let styleId;
    if (style.hasId()) {
      styleId = style.id;
    } else {
      const styleDao = this.getStyleDao();
      if (styleDao !== null) {
        styleId = styleDao.create(style);
        style.id = styleId;
      }
    }
    return styleId;
  }
  /**
   * Get the icon id, either from the existing icon or by inserting a new one
   * @param {module:extension/style.IconRow} icon icon row
   * @return {Number} icon id
   */
  getOrInsertIcon(icon: IconRow): number {
    let iconId;
    if (icon.hasId()) {
      iconId = icon.id;
    } else {
      const iconDao = this.getIconDao();
      if (iconDao != null) {
        iconId = iconDao.create(icon);
        icon.id = iconId;
      }
    }
    return iconId;
  }
  /**
   * Insert a style mapping row
   * @param {module:extension/style.StyleMappingDao} mappingDao mapping dao
   * @param {Number} baseId base id, either contents id or feature id
   * @param {Number} relatedId related id, either style or icon id
   * @param {String} geometryType geometry type or null
   */
  insertStyleMapping(mappingDao: StyleMappingDao, baseId: number, relatedId: number, geometryType?: string): number {
    const row = mappingDao.newRow();
    row.baseId = baseId;
    row.relatedId = relatedId;
    row.setGeometryTypeName(geometryType);
    return mappingDao.create(row);
  }
  /**
   * Delete all feature styles including table styles, table icons, style, and icons
   * @param {module:features/user/featureTable~FeatureTable|String} featureTable feature table
   */
  deleteAllFeatureStyles(
    featureTable: string | FeatureTable,
  ): {
    tableStyles: {
      styles: number;
      icons: number;
    };
    styles: {
      styles: number;
      icons: number;
    };
  } {
    return {
      tableStyles: this.deleteTableFeatureStyles(featureTable),
      styles: this.deleteFeatureStyles(featureTable),
    };
  }
  /**
   * Delete all styles including table styles and feature row style
   * @param {module:features/user/featureTable|String} featureTable feature table
   */
  deleteAllStyles(
    featureTable: string | FeatureTable,
  ): {
    tableStyles: number;
    styles: number;
  } {
    return {
      tableStyles: this.deleteTableStyles(featureTable),
      styles: this.deleteStyles(featureTable),
    };
  }
  /**
   * Delete all icons including table icons and feature row icons
   * @param {module:features/user/featureTable|String} featureTable feature table
   */
  deleteAllIcons(
    featureTable: string | FeatureTable,
  ): {
    tableIcons: number;
    icons: number;
  } {
    return {
      tableIcons: this.deleteTableIcons(featureTable),
      icons: this.deleteIcons(featureTable),
    };
  }
  /**
   * Delete the feature table feature styles
   * @param {module:features/user/featureTable|String} featureTable feature table
   */
  deleteTableFeatureStyles(
    featureTable: string | FeatureTable,
  ): {
    styles: number;
    icons: number;
  } {
    return {
      styles: this.deleteTableStyles(featureTable),
      icons: this.deleteTableIcons(featureTable),
    };
  }
  /**
   * Delete the feature table styles
   * @param {module:features/user/featureTable|String} featureTable feature table
   */
  deleteTableStyles(featureTable: string | FeatureTable): number {
    return this.deleteTableMappings(this.getTableStyleMappingDao(featureTable), featureTable);
  }
  /**
   * Delete the feature table default style
   * @param {module:features/user/featureTable|String} featureTable feature table
   */
  deleteTableStyleDefault(featureTable: string | FeatureTable): number {
    return this.deleteTableStyle(featureTable, null);
  }
  /**
   * Delete the feature table style for the geometry type
   * @param {module:features/user/featureTable|String} featureTable feature table
   * @param {String} geometryType geometry type
   */
  deleteTableStyle(featureTable: string | FeatureTable, geometryType: string): number {
    return this.deleteTableMapping(this.getTableStyleMappingDao(featureTable), featureTable, geometryType);
  }
  /**
   * Delete the feature table icons
   * @param {module:features/user/featureTable|String} featureTable feature table
   */
  deleteTableIcons(featureTable: string | FeatureTable): number {
    return this.deleteTableMappings(this.getTableIconMappingDao(featureTable), featureTable);
  }
  /**
   * Delete the feature table default icon
   * @param {module:features/user/featureTable|String} featureTable feature table
   */
  deleteTableIconDefault(featureTable: string | FeatureTable): number {
    return this.deleteTableIcon(featureTable, null);
  }
  /**
   * Delete the feature table icon for the geometry type
   * @param {module:features/user/featureTable|String} featureTable feature table
   * @param {String} geometryType geometry type
   */
  deleteTableIcon(featureTable: string | FeatureTable, geometryType: string): number {
    return this.deleteTableMapping(this.getTableIconMappingDao(featureTable), featureTable, geometryType);
  }
  /**
   * Delete the table style mappings
   * @param {module:extension/style.StyleMappingDao} mappingDao  mapping dao
   * @param {module:features/user/featureTable|String} featureTable feature table
   */
  deleteTableMappings(mappingDao: StyleMappingDao, featureTable: string | FeatureTable): number {
    if (mappingDao !== null) {
      const featureContentsId = this.contentsIdExtension.getIdByTableName(this.getFeatureTableName(featureTable));
      if (featureContentsId !== null) {
        return mappingDao.deleteByBaseId(featureContentsId);
      }
    }
    return 0;
  }
  /**
   * Delete the table style mapping with the geometry type value
   * @param {module:extension/style.StyleMappingDao} mappingDao  mapping dao
   * @param {module:features/user/featureTable|String} featureTable feature table
   * @param {String} geometryType geometry type
   */
  deleteTableMapping(mappingDao: StyleMappingDao, featureTable: string | FeatureTable, geometryType: string): number {
    if (mappingDao !== null) {
      const featureContentsId = this.contentsIdExtension.getIdByTableName(this.getFeatureTableName(featureTable));
      if (featureContentsId !== null) {
        return mappingDao.deleteByBaseIdAndGeometryType(featureContentsId, geometryType);
      }
    }
    return 0;
  }
  /**
   * Delete all feature styles
   * @param {module:features/user/featureTable|String} featureTable feature table
   */
  deleteFeatureStyles(
    featureTable: string | FeatureTable,
  ): {
    styles: number;
    icons: number;
  } {
    return {
      styles: this.deleteStyles(featureTable),
      icons: this.deleteIcons(featureTable),
    };
  }
  /**
   * Delete all styles
   * @param {module:features/user/featureTable|String} featureTable feature table
   */
  deleteStyles(featureTable: string | FeatureTable): number {
    return this.deleteMappings(this.getStyleMappingDao(featureTable));
  }
  /**
   * Delete feature row styles
   * @param {module:features/user/featureRow} featureRow feature row
   */
  deleteStylesForFeatureRow(featureRow: FeatureRow): number {
    return this.deleteStylesForFeatureId(featureRow.featureTable.getTableName(), featureRow.id);
  }
  /**
   * Delete feature row styles
   * @param {module:features/user/featureTable|String} featureTable feature table
   * @param {Number} featureId feature id
   */
  deleteStylesForFeatureId(featureTable: string | FeatureTable, featureId: number): number {
    return this.deleteMappingsForFeatureId(this.getStyleMappingDao(featureTable), featureId);
  }
  /**
   * Delete the feature row default style
   * @param {module:features/user/featureRow} featureRow feature row
   */
  deleteStyleDefaultForFeatureRow(featureRow: FeatureRow): number {
    return this.deleteStyleForFeatureRowAndGeometryType(featureRow, null);
  }
  /**
   * Delete the feature row default style
   * @param {module:features/user/featureTable|String} featureTable feature table
   * @param {Number} featureId feature id
   */
  deleteStyleDefault(featureTable: string | FeatureTable, featureId: number): number {
    return this.deleteStyle(featureTable, featureId, null);
  }
  /**
   * Delete the feature row style for the feature row geometry type
   * @param {module:features/user/featureRow} featureRow feature row
   */
  deleteStyleForFeatureRow(featureRow: FeatureRow): number {
    return this.deleteStyleForFeatureRowAndGeometryType(featureRow, featureRow.geometryType);
  }
  /**
   * Delete the feature row style for the geometry type
   * @param {module:features/user/featureRow} featureRow feature row
   * @param {String} geometryType geometry type
   */
  deleteStyleForFeatureRowAndGeometryType(featureRow: FeatureRow, geometryType: string): number {
    return this.deleteStyle(featureRow.featureTable, featureRow.id, geometryType);
  }
  /**
   * Delete the feature row style for the geometry type
   * @param {module:features/user/featureTable|String} featureTable feature table
   * @param {Number} featureId feature id
   * @param {String} geometryType geometry type
   */
  deleteStyle(featureTable: string | FeatureTable, featureId: number, geometryType: string): number {
    return this.deleteMapping(this.getStyleMappingDao(featureTable), featureId, geometryType);
  }
  /**
   * Delete the style row and associated mappings by style row
   * @param {module:features/user/featureTable|String} featureTable feature table
   * @param {module:extension/style.StyleRow} styleRow style row
   */
  deleteStyleAndMappingsByStyleRow(featureTable: string | FeatureTable, styleRow: StyleRow): number {
    return this.deleteStyleAndMappingsByStyleRowId(featureTable, styleRow.id);
  }

  /**
   * Delete the style row and associated mappings by style row id
   * @param {module:features/user/featureTable|String} featureTable feature table
   * @param {Number} styleRowId style row id
   */
  deleteStyleAndMappingsByStyleRowId(featureTable: string | FeatureTable, styleRowId: number): number {
    this.getStyleDao().deleteById(styleRowId);
    this.getStyleMappingDao(featureTable).deleteByRelatedId(styleRowId);
    return this.getTableStyleMappingDao(featureTable).deleteByRelatedId(styleRowId);
  }
  /**
   * Delete all icons
   * @param {module:features/user/featureTable|String} featureTable feature table
   */
  deleteIcons(featureTable: string | FeatureTable): number {
    return this.deleteMappings(this.getIconMappingDao(featureTable));
  }
  /**
   * Delete feature row icons
   * @param {module:features/user/featureRow} featureRow feature row
   */
  deleteIconsForFeatureRow(featureRow: FeatureRow): number {
    return this.deleteIconsForFeatureId(featureRow.featureTable.getTableName(), featureRow.id);
  }
  /**
   * Delete feature row icons
   * @param {module:features/user/featureTable|String} featureTable feature table
   * @param {Number} featureId feature id
   */
  deleteIconsForFeatureId(featureTable: string | FeatureTable, featureId: number): number {
    return this.deleteMappingsForFeatureId(this.getIconMappingDao(featureTable), featureId);
  }
  /**
   * Delete the feature row default icon
   * @param {module:features/user/featureRow} featureRow feature row
   */
  deleteIconDefaultForFeatureRow(featureRow: FeatureRow): number {
    return this.deleteIconDefault(featureRow.featureTable.getTableName(), featureRow.id);
  }
  /**
   * Delete the feature row default icon
   * @param {module:features/user/featureTable|String} featureTable feature table
   * @param {Number} featureId feature id
   */
  deleteIconDefault(featureTable: FeatureTable | string, featureId: number): number {
    return this.deleteIcon(featureTable, featureId, null);
  }
  /**
   * Delete the feature row icon for the feature row geometry type
   * @param {module:features/user/featureRow} featureRow feature row
   */
  deleteIconForFeatureRow(featureRow: FeatureRow): number {
    return this.deleteIconForFeatureRowAndGeometryType(featureRow, featureRow.geometryType);
  }
  /**
   * Delete the feature row icon for the geometry type
   * @param {module:features/user/featureRow} featureRow feature row
   * @param {String} geometryType geometry type
   */
  deleteIconForFeatureRowAndGeometryType(featureRow: FeatureRow, geometryType: string): number {
    return this.deleteIcon(featureRow.featureTable, featureRow.id, geometryType);
  }
  /**
   * Delete the feature row icon for the geometry type
   * @param {module:features/user/featureTable|String} featureTable feature table
   * @param {Number} featureId feature id
   * @param {String} geometryType geometry type
   */
  deleteIcon(featureTable: FeatureTable | string, featureId: number, geometryType: string): number {
    return this.deleteMapping(this.getIconMappingDao(featureTable), featureId, geometryType);
  }
  /**
   * Delete the icon row and associated mappings by icon row
   * @param {module:features/user/featureTable|String} featureTable feature table
   * @param {module:extension/style.IconRow} iconRow icon row
   */
  deleteIconAndMappingsByIconRow(featureTable: FeatureTable | string, iconRow: IconRow): number {
    return this.deleteIconAndMappingsByIconRowId(featureTable, iconRow.id);
  }

  /**
   * Delete the icon row and associated mappings by icon row id
   * @param {module:features/user/featureTable|String} featureTable feature table
   * @param {Number} iconRowId icon row id
   */
  deleteIconAndMappingsByIconRowId(featureTable: FeatureTable | string, iconRowId: number): number {
    this.getIconDao().deleteById(iconRowId);
    this.getIconMappingDao(featureTable).deleteByRelatedId(iconRowId);
    return this.getTableIconMappingDao(featureTable).deleteByRelatedId(iconRowId);
  }
  /**
   * Delete all style mappings
   * @param {module:extension/style.StyleMappingDao} mappingDao  mapping dao
   */
  deleteMappings(mappingDao?: StyleMappingDao): number {
    if (mappingDao !== null) {
      return mappingDao.deleteAll();
    }
    return 0;
  }
  /**
   * Delete the style mappings
   * @param {module:extension/style.StyleMappingDao} mappingDao  mapping dao
   * @param {Number} featureId feature id
   */
  deleteMappingsForFeatureId(mappingDao?: StyleMappingDao, featureId?: number): number {
    if (mappingDao !== null && featureId) {
      return mappingDao.deleteByBaseId(featureId);
    }
    return 0;
  }
  /**
   * Delete the style mapping with the geometry type value
   * @param {module:extension/style.StyleMappingDao} mappingDao  mapping dao
   * @param {Number} featureId feature id
   * @param {String} geometryType geometry type
   */
  deleteMapping(mappingDao?: StyleMappingDao, featureId?: number, geometryType?: string): number {
    if (mappingDao !== null) {
      return mappingDao.deleteByBaseIdAndGeometryType(featureId, geometryType);
    }
    return 0;
  }
  /**
   * Get all the unique style row ids the table maps to
   * @param {module:features/user/featureTable|String} featureTable feature table
   * @return style row ids
   */
  getAllTableStyleIds(featureTable: FeatureTable | string): number[] {
    let styleIds = null;
    const mappingDao = this.getTableStyleMappingDao(featureTable);
    if (mappingDao !== null) {
      styleIds = mappingDao.uniqueRelatedIds().map(row => row['related_id']);
    }
    return styleIds;
  }
  /**
   * Get all the unique icon row ids the table maps to
   * @param {module:features/user/featureTable|String} featureTable feature table
   * @return icon row ids
   */
  getAllTableIconIds(featureTable: FeatureTable | string): number[] {
    let styleIds = null;
    const mappingDao = this.getTableIconMappingDao(featureTable);
    if (mappingDao !== null) {
      styleIds = mappingDao.uniqueRelatedIds().map(row => row['related_id']);
    }
    return styleIds;
  }
  /**
   * Get all the unique style row ids the features map to
   * @param {module:features/user/featureTable|String} featureTable feature table
   * @return {Number[]} style row ids
   */
  getAllStyleIds(featureTable: FeatureTable | string): number[] {
    let styleIds = null;
    const mappingDao = this.getStyleMappingDao(featureTable);
    if (mappingDao !== null) {
      styleIds = mappingDao.uniqueRelatedIds().map(row => row['related_id']);
    }
    return styleIds;
  }
  /**
   * Get all the unique icon row ids the features map to
   * @param {module:features/user/featureTable|String} featureTable feature table
   * @return {Number[]} icon row ids
   */
  getAllIconIds(featureTable: FeatureTable | string): number[] {
    let styleIds = null;
    const mappingDao = this.getIconMappingDao(featureTable);
    if (mappingDao !== null) {
      styleIds = mappingDao.uniqueRelatedIds().map(row => row['related_id']);
    }
    return styleIds;
  }
  /**
   * Get name of feature table
   * @param featureTable
   * @returns {String}
   */
  getFeatureTableName(featureTable: FeatureTable | string): string {
    return featureTable instanceof FeatureTable ? featureTable.getTableName() : featureTable;
  }
  /**
   * Remove all traces of the extension
   */
  removeExtension(): number {
    this.deleteAllRelationships();
    this.geoPackage.deleteTable(StyleTable.TABLE_NAME);
    this.geoPackage.deleteTable(IconTable.TABLE_NAME);
    if (this.extensionsDao.isTableExists()) {
      return this.extensionsDao.deleteByExtension(FeatureStyleExtension.EXTENSION_NAME);
    }
    return 0;
  }
}

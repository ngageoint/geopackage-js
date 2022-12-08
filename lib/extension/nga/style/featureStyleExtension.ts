import { BaseExtension } from '../../baseExtension';
import { Extensions } from '../../extensions';
import { IconTable } from './iconTable';
import { IconDao } from './iconDao';
import { StyleTable } from './styleTable';
import { StyleDao } from './styleDao';
import { StyleMappingTable } from './styleMappingTable';
import { StyleMappingDao } from './styleMappingDao';
import { FeatureTable } from '../../../features/user/featureTable';
import { FeatureStyles } from './featureStyles';
import { FeatureStyle } from './featureStyle';
import { Styles } from './styles';
import { Icons } from './icons';
import { IconRow } from './iconRow';
import { FeatureRow } from '../../../features/user/featureRow';
import { RelatedTablesExtension } from '../../related/relatedTablesExtension';
import { ContentsIdExtension } from '../contents/contentsIdExtension';
import { ExtendedRelation } from '../../related/extendedRelation';
import { StyleRow } from './styleRow';
import { GeometryType } from '@ngageoint/simple-features-js';
import { ExtensionScopeType } from '../../extensionScopeType';
import { ContentsId } from '../contents/contentsId';
import { NGAExtensionsConstants } from '../ngaExtensionsConstants';
import type { GeoPackage } from '../../../geoPackage';

/**
 * Style extension
 */
export class FeatureStyleExtension extends BaseExtension {
  /**
   * Extension author
   */
  public static readonly EXTENSION_AUTHOR = NGAExtensionsConstants.EXTENSION_AUTHOR;

  /**
   * Extension name without the author
   */
  public static readonly EXTENSION_NAME_NO_AUTHOR = 'feature_style';

  /**
   * Extension, with author and name
   */
  public static readonly EXTENSION_NAME = Extensions.buildExtensionName(
    FeatureStyleExtension.EXTENSION_AUTHOR,
    FeatureStyleExtension.EXTENSION_NAME_NO_AUTHOR,
  );

  /**
   * Extension definition URL
   */
  public static readonly EXTENSION_DEFINITION =
    'http://ngageoint.github.io/GeoPackage/docs/extensions/feature-style.html">http://ngageoint.github.io/GeoPackage/docs/extensions/feature-style.html';

  /**
   * Table name prefix for mapping styles
   */
  public static readonly TABLE_MAPPING_STYLE = FeatureStyleExtension.EXTENSION_AUTHOR + '_style_';

  /**
   * Table name prefix for mapping style defaults
   */
  public static readonly TABLE_MAPPING_TABLE_STYLE = FeatureStyleExtension.EXTENSION_AUTHOR + '_style_default_';

  /**
   * Table name prefix for mapping icons
   */
  public static readonly TABLE_MAPPING_ICON = FeatureStyleExtension.EXTENSION_AUTHOR + '_icon_';

  /**
   * Table name prefix for mapping icon defaults
   */
  public static readonly TABLE_MAPPING_TABLE_ICON = FeatureStyleExtension.EXTENSION_AUTHOR + '_icon_default_';

  /**
   * Related Tables extension
   */
  protected readonly relatedTables: RelatedTablesExtension;

  /**
   * Contents Id extension
   */
  protected readonly contentsId: ContentsIdExtension;

  /**
   * Constructor
   * @param geoPackage
   * @param relatedTables
   */
  constructor(geoPackage: GeoPackage, relatedTables?: RelatedTablesExtension) {
    super(geoPackage);
    this.relatedTables = relatedTables || new RelatedTablesExtension(geoPackage);
    this.contentsId = new ContentsIdExtension(geoPackage);
  }
  /**
   * Get or create the metadata extension
   *  @param {FeatureTable|String} featureTable, defaults to null
   * @return {Promise}
   */
  getOrCreateExtension(featureTable: FeatureTable | string): Extensions {
    return this.getOrCreate(
      FeatureStyleExtension.EXTENSION_NAME,
      this.getFeatureTableName(featureTable),
      null,
      FeatureStyleExtension.EXTENSION_DEFINITION,
      ExtensionScopeType.READ_WRITE,
    );
  }

  /**
   * Determine if the GeoPackage has the extension or has the extension for the feature table
   * @param {FeatureTable|String} featureTable feature table
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
    return this.relatedTables;
  }
  /**
   * Get the contentsId extension
   * @returns {module:extension/nga/contents~ContentsIdExtension}
   */
  getContentsId(): ContentsIdExtension {
    return this.contentsId;
  }

  /**
   * Create style table
   * @return true if created, false if the table already existed
   */
  public createStyleTable(): boolean {
    return this.relatedTables.createRelatedTable(new StyleTable());
  }

  /**
   * Create icon table
   * @return true if created, false if the table already existed
   */
  public createIconTable(): boolean {
    return this.relatedTables.createRelatedTable(new IconTable());
  }

  /**
   * Create style, icon, table style, and table icon relationships for the
   * feature table
   * @param {FeatureTable|String} featureTable feature table
   * @return {any}
   */
  createRelationships(featureTable: FeatureTable | string): void {
    this.createStyleRelationship(featureTable);
    this.createTableStyleRelationship(featureTable);
    this.createIconRelationship(featureTable);
    this.createTableIconRelationship(featureTable);
  }
  /**
   * Check if feature table has a style, icon, table style, or table icon
   * relationships
   * @param {FeatureTable|String} featureTable feature table
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
   * @param {FeatureTable|String} featureTable feature table
   * @return {any}
   */
  createStyleRelationship(featureTable: string | FeatureTable): void {
    this._createStyleRelationship(
      this.getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_STYLE, featureTable),
      this.getFeatureTableName(featureTable),
      this.getFeatureTableName(featureTable),
      StyleTable.TABLE_NAME,
    );
  }
  /**
   * Determine if a style relationship exists for the feature table
   * @param {FeatureTable|String} featureTable feature table
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
   * @param {FeatureTable|String} featureTable feature table
   * @return {ExtendedRelation}
   */
  createTableStyleRelationship(featureTable: string | FeatureTable): void {
    this._createStyleRelationship(
      this.getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_TABLE_STYLE, featureTable),
      this.getFeatureTableName(featureTable),
      ContentsId.TABLE_NAME,
      StyleTable.TABLE_NAME,
    );
  }
  /**
   * Determine if a feature table style relationship exists
   * @param {FeatureTable|String} featureTable feature table
   * @returns {boolean} true if relationship exists
   */
  hasTableStyleRelationship(featureTable: string | FeatureTable): boolean {
    return this._hasStyleRelationship(
      this.getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_TABLE_STYLE, featureTable),
      ContentsId.TABLE_NAME,
      StyleTable.TABLE_NAME,
    );
  }
  /**
   * Create an icon relationship for the feature table
   * @param {FeatureTable|String} featureTable feature table
   * @return {ExtendedRelation}
   */
  createIconRelationship(featureTable: string | FeatureTable): void {
    this._createStyleRelationship(
      this.getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_ICON, featureTable),
      this.getFeatureTableName(featureTable),
      this.getFeatureTableName(featureTable),
      IconTable.TABLE_NAME,
    );
  }
  /**
   * Determine if an icon relationship exists for the feature table
   * @param {FeatureTable|String} featureTable feature table
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
   * @param {FeatureTable|String} featureTable feature table
   * @return {ExtendedRelation}
   */
  createTableIconRelationship(featureTable: string | FeatureTable): void {
    this._createStyleRelationship(
      this.getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_TABLE_ICON, featureTable),
      this.getFeatureTableName(featureTable),
      ContentsId.TABLE_NAME,
      IconTable.TABLE_NAME,
    );
  }
  /**
   * Determine if a feature table icon relationship exists
   * @param {FeatureTable|String} featureTable feature table
   * @returns {Boolean} true if relationship exists
   */
  hasTableIconRelationship(featureTable: string | FeatureTable): boolean {
    return this._hasStyleRelationship(
      this.getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_TABLE_ICON, featureTable),
      ContentsId.TABLE_NAME,
      IconTable.TABLE_NAME,
    );
  }
  /**
   * Get the mapping table name
   * @param tablePrefix table name prefix
   * @param {FeatureTable|String} featureTable feature table name
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
    return this.relatedTables.hasRelations(baseTable, null, relatedTable, null, null, mappingTableName);
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
  ): void {
    if (!this._hasStyleRelationship(mappingTableName, baseTable, relatedTable)) {
      // Create the extension
      this.getOrCreateExtension(featureTable);
      if (baseTable === ContentsId.TABLE_NAME && !this.contentsId.has()) {
        this.contentsId.getOrCreateExtension();
      }

      if (baseTable === ContentsId.TABLE_NAME) {
        if (!this.contentsId.has()) {
          this.contentsId.getOrCreateExtension();
        }
      }

      const mappingTable = StyleMappingTable.create(mappingTableName);

      if (relatedTable === StyleTable.TABLE_NAME) {
        this.relatedTables.addAttributesRelationshipWithAttributesTableAndMappingTable(
          baseTable,
          StyleTable.create(),
          mappingTable,
        );
      } else {
        this.relatedTables.addMediaRelationshipWithMappingTable(baseTable, IconTable.create(), mappingTable);
      }
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
   * @param {FeatureTable|String} featureTable feature table
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
   * @param {FeatureTable|String} featureTable feature table
   */
  deleteStyleRelationship(featureTable: string | FeatureTable): number {
    return this._deleteStyleRelationship(
      this.getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_STYLE, featureTable),
      featureTable,
    );
  }
  /**
   * Delete a table style relationship for the feature table
   * @param {FeatureTable|String} featureTable feature table
   */
  deleteTableStyleRelationship(featureTable: string | FeatureTable): number {
    return this._deleteStyleRelationship(
      this.getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_TABLE_STYLE, featureTable),
      featureTable,
    );
  }
  /**
   * Delete a icon relationship for the feature table
   * @param {FeatureTable|String} featureTable feature table
   */
  deleteIconRelationship(featureTable: string | FeatureTable): number {
    return this._deleteStyleRelationship(
      this.getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_ICON, featureTable),
      featureTable,
    );
  }
  /**
   * Delete a table icon relationship for the feature table
   * @param {FeatureTable|String} featureTable feature table
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
   * @param {FeatureTable|String} featureTable feature table
   * @private
   */
  _deleteStyleRelationship(mappingTableName: string, featureTable: string | FeatureTable): number {
    const removed = 0;
    this.relatedTables.removeRelationshipsWithMappingTable(mappingTableName);
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
   * @param {FeatureTable|String} featureTable feature table
   * @return {StyleMappingDao} style mapping DAO
   */
  getStyleMappingDao(featureTable: string | FeatureTable): StyleMappingDao {
    return this._getMappingDao(FeatureStyleExtension.TABLE_MAPPING_STYLE, featureTable);
  }
  /**
   * Get a Table Style Mapping DAO
   * @param {FeatureTable|String} featureTable feature table
   * @return {StyleMappingDao} table style mapping DAO
   */
  getTableStyleMappingDao(featureTable: string | FeatureTable): StyleMappingDao {
    return this._getMappingDao(FeatureStyleExtension.TABLE_MAPPING_TABLE_STYLE, featureTable);
  }
  /**
   * Get a Icon Mapping DAO
   * @param {FeatureTable|String} featureTable feature table
   * @return {StyleMappingDao} icon mapping DAO
   */
  getIconMappingDao(featureTable: FeatureTable | string): StyleMappingDao {
    return this._getMappingDao(FeatureStyleExtension.TABLE_MAPPING_ICON, featureTable);
  }
  /**
   * Get a Table Icon Mapping DAO
   * @param {FeatureTable|String} featureTable feature table
   * @return {StyleMappingDao} table icon mapping DAO
   */
  getTableIconMappingDao(featureTable: string | FeatureTable): StyleMappingDao {
    return this._getMappingDao(FeatureStyleExtension.TABLE_MAPPING_TABLE_ICON, featureTable);
  }
  /**
   * Get a Style Mapping DAO from a table name
   * @param {String} tablePrefix table name prefix
   * @param {FeatureTable|String} featureTable feature table
   * @return {StyleMappingDao} style mapping dao
   * @private
   */
  _getMappingDao(tablePrefix: string, featureTable: string | FeatureTable): StyleMappingDao {
    const tableName = this.getMappingTableName(tablePrefix, featureTable);
    let dao = null;
    if (this.geoPackage.isTableOrView(tableName)) {
      dao = new StyleMappingDao(this.relatedTables.getUserDao(tableName));
    }
    return dao;
  }
  /**
   * Get a style DAO
   * @return {StyleDao} style DAO
   */
  getStyleDao(): StyleDao {
    let styleDao = null;
    if (this.geoPackage.isTableOrView(StyleTable.TABLE_NAME)) {
      const attributesDao = this.geoPackage.getAttributesDao(StyleTable.TABLE_NAME);
      styleDao = new StyleDao(attributesDao);
      this.relatedTables.setContents(styleDao.getTable());
    }
    return styleDao;
  }
  /**
   * Get a icon DAO
   * @return {IconDao}
   */
  getIconDao(): IconDao {
    let iconDao = null;
    if (this.geoPackage.isTableOrView(IconTable.TABLE_NAME)) {
      iconDao = new IconDao(this.relatedTables.getUserDao(IconTable.TABLE_NAME));
      this.relatedTables.setContents(iconDao.getTable());
    }
    return iconDao;
  }
  /**
   * Get the feature table default feature styles
   * @param {FeatureTable|String} featureTable feature table
   * @return {FeatureStyles} table feature styles or null
   */
  getTableFeatureStyles(featureTable: string | FeatureTable): FeatureStyles {
    let featureStyles = null;
    const id = this.contentsId.getIdByTableName(this.getFeatureTableName(featureTable));
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
   * @param {FeatureTable|String} featureTable feature table
   * @return {StyleRow} style row
   */
  getTableStyleDefault(featureTable: string | FeatureTable): StyleRow {
    return this.getTableStyle(featureTable, null);
  }
  /**
   * Get the style of the feature table and geometry type
   * @param {FeatureTable|String} featureTable feature table
   * @param {GeometryType} geometryType geometry type
   * @return {StyleRow} style row
   */
  getTableStyle(featureTable: string | FeatureTable, geometryType: GeometryType): StyleRow {
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
   * @param {FeatureTable|String} featureTable feature table
   * @return {Styles} table styles or null
   */
  getTableStyles(featureTable: string | FeatureTable): Styles {
    let styles = null;
    const id = this.contentsId.getIdByTableName(this.getFeatureTableName(featureTable));
    if (id !== null) {
      styles = this.getStyles(id, this.getTableStyleMappingDao(featureTable), true);
    }
    return styles;
  }
  /**
   * Get the default icon of the feature table
   * @param {FeatureTable|String} featureTable feature table
   * @return {IconRow} icon row
   */
  getTableIconDefault(featureTable: string | FeatureTable): IconRow {
    return this.getTableIcon(featureTable, null);
  }
  /**
   * Get the icon of the feature table and geometry type
   * @param {FeatureTable|String} featureTable feature table
   * @param {GeometryType} geometryType geometry type
   * @return {IconRow} icon row
   */
  getTableIcon(featureTable: string | FeatureTable, geometryType: GeometryType): IconRow {
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
   * @param {FeatureTable|String} featureTable feature table
   * @return {Icons} table icons or null
   */
  getTableIcons(featureTable: string | FeatureTable): Icons {
    let icons = null;
    const id = this.contentsId.getIdByTableName(this.getFeatureTableName(featureTable));
    if (id !== null) {
      icons = this.getIcons(id, this.getTableIconMappingDao(featureTable), true);
    }
    return icons;
  }
  /**
   * Gets Icons for featureId and mappingDao
   * @param {Number} featureId
   * @param mappingDao
   * @param {boolean} tableIcons
   * @returns {Icons}
   * @private
   */
  getIcons(featureId: number, mappingDao: StyleMappingDao, tableIcons = false): Icons {
    let icons = new Icons(tableIcons);
    if (mappingDao !== null) {
      const iconDao = this.getIconDao();
      const styleMappingRows = mappingDao.queryByBaseFeatureId(featureId);
      for (const styleMappingRow of styleMappingRows) {
        const iconRow = iconDao.queryForRow(styleMappingRow);
        if (styleMappingRow.getGeometryTypeName() === null) {
          icons.setDefault(iconRow);
        } else {
          icons.setIcon(iconRow, GeometryType.fromName(styleMappingRow.getGeometryTypeName().toUpperCase()));
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
   * @param {StyleMappingDao} mappingDao
   * @param {boolean} tableStyles
   * @returns {Styles}
   */
  getStyles(featureId: number, mappingDao: StyleMappingDao, tableStyles = false): Styles {
    let styles = new Styles(tableStyles);
    if (mappingDao !== null) {
      const styleDao = this.getStyleDao();
      const styleMappingRows = mappingDao.queryByBaseFeatureId(featureId);
      for (const styleMappingRow of styleMappingRows) {
        const styleRow = styleDao.queryForRow(styleMappingRow);
        if (styleMappingRow.getGeometryTypeName() === null) {
          styles.setDefault(styleRow);
        } else {
          styles.setStyle(styleRow, GeometryType.fromName(styleMappingRow.getGeometryTypeName().toUpperCase()));
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
   * @param {FeatureRow} featureRow feature row
   * @return {FeatureStyles} feature styles or null
   */
  getFeatureStylesForFeatureRow(featureRow: FeatureRow): FeatureStyles {
    return this.getFeatureStyles(featureRow.getTable(), featureRow.getId());
  }
  /**
   * Get the feature styles for the feature row
   * @param {FeatureTable|String} featureTable feature table
   * @param {Number} featureId feature id
   * @return {FeatureStyles} feature styles or null
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
   * @param {FeatureRow} featureRow feature row
   * @return {Styles} styles or null
   */
  getStylesForFeatureRow(featureRow: FeatureRow): Styles {
    return this.getStyles(featureRow.getId(), this.getStyleMappingDao(featureRow.getTable().getTableName()));
  }
  /**
   * Get the styles for the feature id
   * @param {String} tableName table name
   * @param {Number} featureId feature id
   * @return {Styles} styles or null
   */
  getStylesForFeatureId(tableName: string, featureId: number): Styles {
    return this.getStyles(featureId, this.getStyleMappingDao(tableName));
  }
  /**
   * Get the icons for the feature row
   * @param {FeatureRow} featureRow feature row
   * @return {Icons} icons or null
   */
  getIconsForFeatureRow(featureRow: FeatureRow): Icons {
    return this.getIcons(featureRow.getId(), this.getIconMappingDao(featureRow.getTable().getTableName()));
  }
  /**
   * Get the icons for the feature id
   * @param {String} tableName table name
   * @param {Number} featureId feature id
   * @return {Icons} icons or null
   */
  getIconsForFeatureId(tableName: string, featureId: number): Icons {
    return this.getIcons(featureId, this.getIconMappingDao(tableName));
  }
  /**
   * Get the feature style (style and icon) of the feature row, searching in
   * order: feature geometry type style or icon, feature default style or
   * icon, table geometry type style or icon, table default style or icon
   * @param {FeatureRow} featureRow feature row
   * @return {FeatureStyle} feature style
   */
  getFeatureStyleForFeatureRow(featureRow: FeatureRow): FeatureStyle {
    return new FeatureStyle(
      this.getStyle(featureRow.getTable().getTableName(), featureRow.getId(), featureRow.getGeometryType(), true),
      this.getIcon(featureRow.getTable().getTableName(), featureRow.getId(), featureRow.getGeometryType(), true),
    );
  }
  /**
   * Get the feature style (style and icon) of the feature, searching in
   * order: feature geometry type style or icon, feature default style or
   * icon, table geometry type style or icon, table default style or icon
   * @param {FeatureRow} featureRow feature row
   * @return {FeatureStyle} feature style
   */
  getFeatureStyleDefault(featureRow: FeatureRow): FeatureStyle {
    return new FeatureStyle(
      this.getStyle(featureRow.getTable().getTableName(), featureRow.getId(), null, true),
      this.getIcon(featureRow.getTable().getTableName(), featureRow.getId(), null, true),
    );
  }
  /**
   * Get the icon of the feature, searching in order: feature geometry type
   * icon, feature default icon, when tableIcon enabled continue searching:
   * table geometry type icon, table default icon
   * @param {FeatureTable|String} featureTable
   * @param {Number} featureId
   * @param {GeometryType} geometryType
   * @param {Boolean} tableIcon
   * @returns {IconRow}
   * @private
   */
  getIcon(
    featureTable: string | FeatureTable,
    featureId: number,
    geometryType: GeometryType,
    tableIcon: boolean,
  ): IconRow {
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
   * @param {FeatureTable|String} featureTable
   * @param {Number} featureId
   * @param {GeometryType} geometryType
   * @param {Boolean} tableStyle
   * @returns {StyleRow}
   * @private
   */
  getStyle(
    featureTable: string | FeatureTable,
    featureId: number,
    geometryType: GeometryType,
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
   * @param {FeatureTable|String} featureTable feature table
   * @param {FeatureStyles} featureStyles feature styles
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
   * @param {FeatureTable|String} featureTable feature table
   * @param {Styles} styles default styles
   * @return {any}
   */
  setTableStyles(
    featureTable: string | FeatureTable,
    styles?: Styles,
  ): { styleDefault: number; styles: number[]; deleted: number } {
    const deleted = this.deleteTableStyles(featureTable);
    if (styles !== null) {
      const styleIdList = [];
      let styleDefault = undefined;
      if (styles.getDefault() !== null) {
        styleDefault = this.setTableStyleDefault(featureTable, styles.getDefault());
      }
      const keys = styles.getGeometryTypes();
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const value = styles.getStyle(key);
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
   * @param {FeatureTable|String} featureTable feature table
   * @param {StyleRow} style style row
   * @return {number}
   */
  setTableStyleDefault(featureTable: string | FeatureTable, style: StyleRow): number {
    return this.setTableStyle(featureTable, null, style);
  }
  /**
   * Set the feature table style for the geometry type
   * @param {FeatureTable|String} featureTable feature table
   * @param {GeometryType} geometryType geometry type
   * @param {StyleRow} style style row
   * @return {number}
   */
  setTableStyle(featureTable: string | FeatureTable, geometryType: GeometryType, style?: StyleRow): number {
    this.deleteTableStyle(featureTable, geometryType);
    if (style !== null) {
      this.createTableStyleRelationship(featureTable);
      const featureContentsId = this.contentsId.getOrCreateIdWithTableName(this.getFeatureTableName(featureTable));
      const styleId = this.getOrInsertStyle(style);
      const mappingDao = this.getTableStyleMappingDao(featureTable);
      return this.insertStyleMapping(mappingDao, featureContentsId, styleId, geometryType);
    }
  }
  /**
   * Set the feature table default icons
   * @param {FeatureTable|String} featureTable feature table
   * @param {Icons} icons default icons
   * @return {any}
   */
  setTableIcons(
    featureTable: string | FeatureTable,
    icons?: Icons,
  ): { iconDefault: number; icons: number[]; deleted: number } {
    const deleted = this.deleteTableIcons(featureTable);
    if (icons !== null) {
      let iconDefault = undefined;
      const iconIdList = [];
      if (icons.getDefault() !== null) {
        iconDefault = this.setTableIconDefault(featureTable, icons.getDefault());
      }
      const keys = icons.getGeometryTypes();
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const value = icons.getIcon(key);
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
   * @param {FeatureTable|String} featureTable feature table
   * @param {IconRow} icon icon row
   * @return {number}
   */
  setTableIconDefault(featureTable: string | FeatureTable, icon?: IconRow): number {
    return this.setTableIcon(featureTable, null, icon);
  }
  /**
   * Set the feature table icon for the geometry type
   * @param {FeatureTable|String} featureTable feature table
   * @param {GeometryType} geometryType geometry type
   * @param {IconRow} icon icon row
   * @return {number}
   */
  setTableIcon(featureTable: string | FeatureTable, geometryType: GeometryType, icon?: IconRow): number {
    this.deleteTableIcon(featureTable, geometryType);
    if (icon !== null) {
      this.createTableIconRelationship(featureTable);
      const featureContentsId = this.contentsId.getOrCreateIdWithTableName(this.getFeatureTableName(featureTable));
      const iconId = this.getOrInsertIcon(icon);
      const mappingDao = this.getTableIconMappingDao(featureTable);
      return this.insertStyleMapping(mappingDao, featureContentsId, iconId, geometryType);
    }
  }
  /**
   * Set the feature styles for the feature row
   * @param {FeatureRow} featureRow feature row
   * @param {FeatureStyles} featureStyles feature styles
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
    return this.setFeatureStyles(featureRow.getTable().getTableName(), featureRow.getId(), featureStyles);
  }

  /**
   * Set the feature styles for the feature table and feature id
   * @param {FeatureTable|String} featureTable feature table
   * @param {Number} featureId feature id
   * @param {FeatureStyles} featureStyles feature styles
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
      const styles = this.setStyles(featureTable, featureId, featureStyles.getStyles());
      const icons = this.setIcons(featureTable, featureId, featureStyles.getIcons());
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
   * @param {FeatureRow} featureRow feature row
   * @param {FeatureStyle} featureStyle feature style
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
    return this.setFeatureStyleForFeatureRowAndGeometryType(featureRow, featureRow.getGeometryType(), featureStyle);
  }
  /**
   * Set the feature style (style and icon) of the feature row for the
   * specified geometry type
   * @param {FeatureRow} featureRow feature row
   * @param {GeometryType} geometryType geometry type
   * @param {FeatureStyle} featureStyle feature style
   * @return {any}
   */
  setFeatureStyleForFeatureRowAndGeometryType(
    featureRow: FeatureRow,
    geometryType: GeometryType,
    featureStyle: FeatureStyle,
  ): {
    style: number;
    icon: number;
    deleted?: {
      style: number;
      icon: number;
    };
  } {
    return this.setFeatureStyle(featureRow.getTable().getTableName(), featureRow.getId(), geometryType, featureStyle);
  }
  /**
   * Set the feature style default (style and icon) of the feature row
   * @param {FeatureRow} featureRow feature row
   * @param {FeatureStyle} featureStyle feature style
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
    return this.setFeatureStyle(featureRow.getTable().getTableName(), featureRow.getId(), null, featureStyle);
  }
  /**
   * Set the feature style (style and icon) of the feature
   * @param {FeatureTable|String} featureTable feature table
   * @param {Number} featureId feature id
   * @param {GeometryType} geometryType geometry type
   * @param {FeatureStyle} featureStyle feature style
   * @return {any}
   */
  setFeatureStyle(
    featureTable: string | FeatureTable,
    featureId: number,
    geometryType: GeometryType,
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
      };
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
   * @param {FeatureTable|String} featureTable feature table
   * @param {Number} featureId feature id
   * @param {FeatureStyle} featureStyle feature style
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
   * @param {FeatureRow} featureRow feature row
   * @param {Styles} styles styles
   * @return {Promise}
   */
  setStylesForFeatureRow(
    featureRow: FeatureRow,
    styles: Styles,
  ): { styleDefault: number; styles: number[]; deleted: number } {
    return this.setStyles(featureRow.getTable().getTableName(), featureRow.getId(), styles);
  }
  /**
   * Set the styles for the feature table and feature id
   * @param {FeatureTable|String} featureTable feature table
   * @param {Number} featureId feature id
   * @param {Styles} styles styles
   * @return {Promise}
   */
  setStyles(
    featureTable: string | FeatureTable,
    featureId: number,
    styles?: Styles,
  ): { styleDefault: number; styles: number[]; deleted: number } {
    const deleted = this.deleteStylesForFeatureId(featureTable, featureId);
    if (styles !== null) {
      const styleIds = [];
      let styleDefault = undefined;
      if (styles.getDefault() !== null) {
        styleDefault = this.setStyleDefault(featureTable, featureId, styles.getDefault());
      }
      const keys = styles.getGeometryTypes();
      for (let i = 0; i < keys.length; i++) {
        styleIds.push(this.setStyle(featureTable, featureId, keys[i], styles.getStyle(keys[i])));
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
   * @param {FeatureRow} featureRow feature row
   * @param {StyleRow} style style row
   * @return {Promise}
   */
  setStyleForFeatureRow(featureRow: FeatureRow, style: StyleRow): number {
    return this.setStyleForFeatureRowAndGeometryType(featureRow, featureRow.getGeometryType(), style);
  }
  /**
   * Set the style of the feature row for the specified geometry type
   * @param {FeatureRow} featureRow feature row
   * @param {GeometryType} geometryType geometry type
   * @param {StyleRow} style style row
   * @return {Promise}
   */
  setStyleForFeatureRowAndGeometryType(featureRow: FeatureRow, geometryType: GeometryType, style: StyleRow): number {
    return this.setStyle(featureRow.getTable().getTableName(), featureRow.getId(), geometryType, style);
  }
  /**
   * Set the default style of the feature row
   * @param {FeatureRow} featureRow feature row
   * @param {StyleRow} style style row
   * @return {Promise}
   */
  setStyleDefaultForFeatureRow(featureRow: FeatureRow, style: StyleRow): number {
    return this.setStyle(featureRow.getTable().getTableName(), featureRow.getId(), null, style);
  }
  /**
   * Set the style of the feature
   * @param {FeatureTable|String} featureTable feature table
   * @param {Number} featureId feature id
   * @param {GeometryType} geometryType geometry type
   * @param {StyleRow} style style row
   * @return {number}
   */
  setStyle(
    featureTable: string | FeatureTable,
    featureId: number,
    geometryType: GeometryType,
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
   * @param {FeatureTable|String} featureTable feature table
   * @param {Number} featureId feature id
   * @param {StyleRow} style style row
   * @return {number}
   */
  setStyleDefault(featureTable: string | FeatureTable, featureId: number, style: StyleRow): number {
    return this.setStyle(featureTable, featureId, null, style);
  }
  /**
   * Set the icons for the feature row
   * @param {FeatureRow} featureRow feature row
   * @param {Icons} icons icons
   * @return {Promise}
   */
  setIconsForFeatureRow(
    featureRow: FeatureRow,
    icons: Icons,
  ): { iconDefault: number; icons: number[]; deleted: number } {
    return this.setIcons(featureRow.getTable().getTableName(), featureRow.getId(), icons);
  }
  /**
   * Set the icons for the feature table and feature id
   * @param {FeatureTable|String} featureTable feature table
   * @param {Number} featureId feature id
   * @param {Icons} icons icons
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
      const keys = icons.getGeometryTypes();
      for (let i = 0; i < keys.length; i++) {
        this.setIcon(featureTable, featureId, keys[i], icons.getIcon(keys[i]));
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
   * @param {FeatureRow} featureRow feature row
   * @param {IconRow} icon icon row
   * @return {number}
   */
  setIconForFeatureRow(featureRow: FeatureRow, icon: IconRow): number {
    return this.setIconForFeatureRowAndGeometryType(featureRow, featureRow.getGeometryType(), icon);
  }
  /**
   * Set the icon of the feature row for the specified geometry type
   * @param {FeatureRow} featureRow feature row
   * @param {GeometryType} geometryType geometry type
   * @param {IconRow} icon icon row
   * @return {number}
   */
  setIconForFeatureRowAndGeometryType(featureRow: FeatureRow, geometryType: GeometryType, icon: IconRow): number {
    return this.setIcon(featureRow.getTable().getTableName(), featureRow.getId(), geometryType, icon);
  }
  /**
   * Set the default icon of the feature row
   * @param {FeatureRow} featureRow feature row
   * @param {IconRow} icon icon row
   * @return {number}
   */
  setIconDefaultForFeatureRow(featureRow: FeatureRow, icon: IconRow): number {
    return this.setIcon(featureRow.getTable().getTableName(), featureRow.getId(), null, icon);
  }
  /**
   * Get the icon of the feature, searching in order: feature geometry type
   * icon, feature default icon, table geometry type icon, table default icon
   * @param {FeatureTable|String} featureTable feature table
   * @param {Number} featureId feature id
   * @param {GeometryType} geometryType geometry type
   * @param {IconRow} icon icon row
   * @return {number}
   */
  setIcon(featureTable: string | FeatureTable, featureId: number, geometryType: GeometryType, icon?: IconRow): number {
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
   * @param {FeatureTable|String} featureTable feature table
   * @param {Number} featureId feature id
   * @param {IconRow} icon icon row
   * @return {number}
   */
  setIconDefault(featureTable: string | FeatureTable, featureId: number, icon: IconRow): number {
    return this.setIcon(featureTable, featureId, null, icon);
  }
  /**
   * Get the style id, either from the existing style or by inserting a new one
   * @param {StyleRow} style style row
   * @return {Number} style id
   */
  getOrInsertStyle(style: StyleRow): number {
    let styleId;
    if (style.hasId()) {
      styleId = style.getId();
    } else {
      const styleDao = this.getStyleDao();
      if (styleDao !== null) {
        styleId = styleDao.create(style);
        style.setId(styleId, true);
      }
    }
    return styleId;
  }
  /**
   * Get the icon id, either from the existing icon or by inserting a new one
   * @param {IconRow} icon icon row
   * @return {Number} icon id
   */
  getOrInsertIcon(icon: IconRow): number {
    let iconId: number;
    if (icon.hasId()) {
      iconId = icon.getId();
    } else {
      const iconDao = this.getIconDao();
      if (iconDao != null) {
        iconId = iconDao.create(icon);
        icon.setId(iconId, true);
      }
    }
    return iconId;
  }
  /**
   * Insert a style mapping row
   * @param {StyleMappingDao} mappingDao mapping dao
   * @param {Number} baseId base id, either contents id or feature id
   * @param {Number} relatedId related id, either style or icon id
   * @param {GeometryType} geometryType geometry type or null
   */
  insertStyleMapping(
    mappingDao: StyleMappingDao,
    baseId: number,
    relatedId: number,
    geometryType: GeometryType = null,
  ): number {
    const row = mappingDao.newRow();
    row.setBaseId(baseId);
    row.setRelatedId(relatedId);
    row.setGeometryTypeName(GeometryType.nameFromType(geometryType));
    return mappingDao.create(row);
  }
  /**
   * Delete all feature styles including table styles, table icons, style, and icons
   * @param {FeatureTable|String} featureTable feature table
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
   * @param {FeatureTable|String} featureTable feature table
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
   * @param {FeatureTable|String} featureTable feature table
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
   * @param {FeatureTable|String} featureTable feature table
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
   * @param {FeatureTable|String} featureTable feature table
   */
  deleteTableStyles(featureTable: string | FeatureTable): number {
    return this.deleteTableMappings(this.getTableStyleMappingDao(featureTable), featureTable);
  }
  /**
   * Delete the feature table default style
   * @param {FeatureTable|String} featureTable feature table
   */
  deleteTableStyleDefault(featureTable: string | FeatureTable): number {
    return this.deleteTableStyle(featureTable, null);
  }
  /**
   * Delete the feature table style for the geometry type
   * @param {FeatureTable|String} featureTable feature table
   * @param {GeometryType} geometryType geometry type
   */
  deleteTableStyle(featureTable: string | FeatureTable, geometryType: GeometryType): number {
    return this.deleteTableMapping(this.getTableStyleMappingDao(featureTable), featureTable, geometryType);
  }
  /**
   * Delete the feature table icons
   * @param {FeatureTable|String} featureTable feature table
   */
  deleteTableIcons(featureTable: string | FeatureTable): number {
    return this.deleteTableMappings(this.getTableIconMappingDao(featureTable), featureTable);
  }
  /**
   * Delete the feature table default icon
   * @param {FeatureTable|String} featureTable feature table
   */
  deleteTableIconDefault(featureTable: string | FeatureTable): number {
    return this.deleteTableIcon(featureTable, null);
  }
  /**
   * Delete the feature table icon for the geometry type
   * @param {FeatureTable|String} featureTable feature table
   * @param {GeometryType} geometryType geometry type
   */
  deleteTableIcon(featureTable: string | FeatureTable, geometryType: GeometryType): number {
    return this.deleteTableMapping(this.getTableIconMappingDao(featureTable), featureTable, geometryType);
  }
  /**
   * Delete the table style mappings
   * @param {StyleMappingDao} mappingDao  mapping dao
   * @param {FeatureTable|String} featureTable feature table
   */
  deleteTableMappings(mappingDao: StyleMappingDao, featureTable: string | FeatureTable): number {
    if (mappingDao !== null) {
      const featureContentsId = this.contentsId.getIdByTableName(this.getFeatureTableName(featureTable));
      if (featureContentsId !== null) {
        return mappingDao.deleteByBaseId(featureContentsId);
      }
    }
    return 0;
  }
  /**
   * Delete the table style mapping with the geometry type value
   * @param {StyleMappingDao} mappingDao  mapping dao
   * @param {FeatureTable|String} featureTable feature table
   * @param {GeometryType} geometryType geometry type
   */
  deleteTableMapping(
    mappingDao: StyleMappingDao,
    featureTable: string | FeatureTable,
    geometryType: GeometryType,
  ): number {
    if (mappingDao !== null) {
      const featureContentsId = this.contentsId.getIdByTableName(this.getFeatureTableName(featureTable));
      if (featureContentsId !== null) {
        return mappingDao.deleteByBaseIdAndGeometryType(featureContentsId, geometryType);
      }
    }
    return 0;
  }
  /**
   * Delete all feature styles
   * @param {FeatureTable|String} featureTable feature table
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
   * @param {FeatureTable|String} featureTable feature table
   */
  deleteStyles(featureTable: string | FeatureTable): number {
    return this.deleteMappings(this.getStyleMappingDao(featureTable));
  }
  /**
   * Delete feature row styles
   * @param {FeatureRow} featureRow feature row
   */
  deleteStylesForFeatureRow(featureRow: FeatureRow): number {
    return this.deleteStylesForFeatureId(featureRow.getTable().getTableName(), featureRow.getId());
  }
  /**
   * Delete feature row styles
   * @param {FeatureTable|String} featureTable feature table
   * @param {Number} featureId feature id
   */
  deleteStylesForFeatureId(featureTable: string | FeatureTable, featureId: number): number {
    return this.deleteMappingsForFeatureId(this.getStyleMappingDao(featureTable), featureId);
  }
  /**
   * Delete the feature row default style
   * @param {FeatureRow} featureRow feature row
   */
  deleteStyleDefaultForFeatureRow(featureRow: FeatureRow): number {
    return this.deleteStyleForFeatureRowAndGeometryType(featureRow, null);
  }
  /**
   * Delete the feature row default style
   * @param {FeatureTable|String} featureTable feature table
   * @param {Number} featureId feature id
   */
  deleteStyleDefault(featureTable: string | FeatureTable, featureId: number): number {
    return this.deleteStyle(featureTable, featureId, null);
  }
  /**
   * Delete the feature row style for the feature row geometry type
   * @param {FeatureRow} featureRow feature row
   */
  deleteStyleForFeatureRow(featureRow: FeatureRow): number {
    return this.deleteStyleForFeatureRowAndGeometryType(featureRow, featureRow.getGeometryType());
  }
  /**
   * Delete the feature row style for the geometry type
   * @param {FeatureRow} featureRow feature row
   * @param {GeometryType} geometryType geometry type
   */
  deleteStyleForFeatureRowAndGeometryType(featureRow: FeatureRow, geometryType: GeometryType): number {
    return this.deleteStyle(featureRow.getTable(), featureRow.getId(), geometryType);
  }
  /**
   * Delete the feature row style for the geometry type
   * @param {FeatureTable|String} featureTable feature table
   * @param {Number} featureId feature id
   * @param {GeometryType} geometryType geometry type
   */
  deleteStyle(featureTable: string | FeatureTable, featureId: number, geometryType: GeometryType): number {
    return this.deleteMapping(this.getStyleMappingDao(featureTable), featureId, geometryType);
  }
  /**
   * Delete the style row and associated mappings by style row
   * @param {FeatureTable|String} featureTable feature table
   * @param {StyleRow} styleRow style row
   */
  deleteStyleAndMappingsByStyleRow(featureTable: string | FeatureTable, styleRow: StyleRow): number {
    return this.deleteStyleAndMappingsByStyleRowId(featureTable, styleRow.getId());
  }

  /**
   * Delete the style row and associated mappings by style row id
   * @param {FeatureTable|String} featureTable feature table
   * @param {Number} styleRowId style row id
   */
  deleteStyleAndMappingsByStyleRowId(featureTable: string | FeatureTable, styleRowId: number): number {
    let rowsDeleted = 0;
    const styleDao = this.getStyleDao();
    if (styleDao !== null && styleDao !== undefined) {
      rowsDeleted += styleDao.deleteById(styleRowId);
    }
    const styleMappingDao = this.getStyleMappingDao(featureTable);
    if (styleMappingDao !== null && styleMappingDao !== undefined) {
      rowsDeleted += styleMappingDao.deleteByRelatedId(styleRowId);
    }
    const tableStyleMappingDao = this.getTableStyleMappingDao(featureTable);
    if (tableStyleMappingDao !== null && tableStyleMappingDao !== undefined) {
      rowsDeleted += tableStyleMappingDao.deleteByRelatedId(styleRowId);
    }
    return rowsDeleted;
  }

  /**
   * Delete all icons
   * @param {FeatureTable|String} featureTable feature table
   */
  deleteIcons(featureTable: string | FeatureTable): number {
    return this.deleteMappings(this.getIconMappingDao(featureTable));
  }
  /**
   * Delete feature row icons
   * @param {FeatureRow} featureRow feature row
   */
  deleteIconsForFeatureRow(featureRow: FeatureRow): number {
    return this.deleteIconsForFeatureId(featureRow.getTable().getTableName(), featureRow.getId());
  }
  /**
   * Delete feature row icons
   * @param {FeatureTable|String} featureTable feature table
   * @param {Number} featureId feature id
   */
  deleteIconsForFeatureId(featureTable: string | FeatureTable, featureId: number): number {
    return this.deleteMappingsForFeatureId(this.getIconMappingDao(featureTable), featureId);
  }
  /**
   * Delete the feature row default icon
   * @param {FeatureRow} featureRow feature row
   */
  deleteIconDefaultForFeatureRow(featureRow: FeatureRow): number {
    return this.deleteIconDefault(featureRow.getTable().getTableName(), featureRow.getId());
  }
  /**
   * Delete the feature row default icon
   * @param {FeatureTable|String} featureTable feature table
   * @param {Number} featureId feature id
   */
  deleteIconDefault(featureTable: FeatureTable | string, featureId: number): number {
    return this.deleteIcon(featureTable, featureId, null);
  }
  /**
   * Delete the feature row icon for the feature row geometry type
   * @param {FeatureRow} featureRow feature row
   */
  deleteIconForFeatureRow(featureRow: FeatureRow): number {
    return this.deleteIconForFeatureRowAndGeometryType(featureRow, featureRow.getGeometryType());
  }
  /**
   * Delete the feature row icon for the geometry type
   * @param {FeatureRow} featureRow feature row
   * @param {GeometryType} geometryType geometry type
   */
  deleteIconForFeatureRowAndGeometryType(featureRow: FeatureRow, geometryType: GeometryType): number {
    return this.deleteIcon(featureRow.getTable(), featureRow.getId(), geometryType);
  }
  /**
   * Delete the feature row icon for the geometry type
   * @param {FeatureTable|String} featureTable feature table
   * @param {Number} featureId feature id
   * @param {GeometryType} geometryType geometry type
   */
  deleteIcon(featureTable: FeatureTable | string, featureId: number, geometryType: GeometryType): number {
    return this.deleteMapping(this.getIconMappingDao(featureTable), featureId, geometryType);
  }
  /**
   * Delete the icon row and associated mappings by icon row
   * @param {FeatureTable|String} featureTable feature table
   * @param {IconRow} iconRow icon row
   */
  deleteIconAndMappingsByIconRow(featureTable: FeatureTable | string, iconRow: IconRow): number {
    return this.deleteIconAndMappingsByIconRowId(featureTable, iconRow.getId());
  }

  /**
   * Delete the icon row and associated mappings by icon row id
   * @param {FeatureTable|String} featureTable feature table
   * @param {Number} iconRowId icon row id
   */
  deleteIconAndMappingsByIconRowId(featureTable: FeatureTable | string, iconRowId: number): number {
    let rowsDeleted = 0;
    const iconDao = this.getIconDao();
    if (iconDao !== null && iconDao !== undefined) {
      rowsDeleted += iconDao.deleteById(iconRowId);
    }
    const iconMappingDao = this.getIconMappingDao(featureTable);
    if (iconMappingDao !== null && iconMappingDao !== undefined) {
      rowsDeleted += iconMappingDao.deleteByRelatedId(iconRowId);
    }
    const tableIconMappingDao = this.getTableIconMappingDao(featureTable);
    if (tableIconMappingDao !== null && tableIconMappingDao !== undefined) {
      rowsDeleted += tableIconMappingDao.deleteByRelatedId(iconRowId);
    }
    return rowsDeleted;
  }

  /**
   * Delete all style mappings
   * @param {StyleMappingDao} mappingDao  mapping dao
   */
  deleteMappings(mappingDao?: StyleMappingDao): number {
    if (mappingDao !== null) {
      return mappingDao.delete();
    }
    return 0;
  }
  /**
   * Delete the style mappings
   * @param {StyleMappingDao} mappingDao  mapping dao
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
   * @param {StyleMappingDao} mappingDao  mapping dao
   * @param {Number} featureId feature id
   * @param {GeometryType} geometryType geometry type
   */
  deleteMapping(mappingDao?: StyleMappingDao, featureId?: number, geometryType?: GeometryType): number {
    if (mappingDao !== null) {
      return mappingDao.deleteByBaseIdAndGeometryType(featureId, geometryType);
    }
    return 0;
  }
  /**
   * Get all the unique style row ids the table maps to
   * @param {FeatureTable|String} featureTable feature table
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
   * @param {FeatureTable|String} featureTable feature table
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
   * @param {FeatureTable|String} featureTable feature table
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
   * @param {FeatureTable|String} featureTable feature table
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

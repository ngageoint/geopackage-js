import { ExtensionManagement } from '../ExtensionManagement';
import { GeoPackage } from '../../geoPackage';
import { FeatureTableIndex } from './index/featureTableIndex';
import { GeometryIndexDao } from './index/geometryIndexDao';
import { SQLUtils } from '../../db/sqlUtils';
import { RelatedTablesExtension } from '../related/relatedTablesExtension';
import { UserCustomTableReader } from '../../user/custom/userCustomTableReader';
import { AlterTable } from '../../db/alterTable';
import { TableMapping } from '../../db/tableMapping';
import { UserMappingTable } from '../related/userMappingTable';
import { TableInfo } from '../../db/table/tableInfo';
import { ExtendedRelationsDao } from '../related/extendedRelationsDao';
import { FeatureStyleExtension } from './style/featureStyleExtension';
import { ContentsIdExtension } from './contents/contentsIdExtension';
import { TileTableScaling } from './scale/tileTableScaling';
import { TileScalingDao } from './scale/tileScalingDao';
import { ContentsIdDao } from './contents/contentsIdDao';
import { GeoPackageException } from '../../geoPackageException';

/**
 * NGA Extensions
 * <a href="http://ngageoint.github.io/GeoPackage/docs/extensions/">http://ngageoint.github.io/GeoPackage/docs/extensions/</a>
 *
 * @since 5.0.0
 */
export class NGAExtensions extends ExtensionManagement {
  /**
   * Extension author
   */
  public static readonly EXTENSION_AUTHOR = 'nga';

  /**
   * Constructor
   * @param geoPackage GeoPackage
   */
  public constructor(geoPackage: GeoPackage) {
    super(geoPackage);
  }

  /**
   * {@inheritDoc}
   */
  public getAuthor(): string {
    return NGAExtensions.EXTENSION_AUTHOR;
  }

  /**
   * Delete all NGA table extensions for the table within the GeoPackage
   * @param geoPackage GeoPackage
   * @param table  table name
   */
  public deleteTableExtensions(table: string): void {
    this.deleteGeometryIndex(table);
    this.deleteTileScaling(table);
    this.deleteFeatureStyle(table);
    this.deleteContentsId(table);
    // Delete future extensions for the table here
  }

  /**
   * Delete all NGA extensions including custom extension tables for the
   * GeoPackage
   * @param geoPackage GeoPackage
   */
  public deleteExtensions(): void {
    this.deleteGeometryIndexExtension();
    this.deleteTileScalingExtension();
    this.deleteFeatureStyleExtension();
    this.deleteContentsIdExtension();
    // Delete future extension tables here
  }

  /**
   * Copy all NGA table extensions for the table within the GeoPackage
   * @param table table name
   * @param newTable new table name
   */
  public copyTableExtensions(table: string, newTable: string): void {
    try {
      this.copyContentsId(table, newTable);
      this.copyFeatureStyle(table, newTable);
      this.copyTileScaling(table, newTable);
      this.copyGeometryIndex(table, newTable);
      // Copy future extensions for the table here
    } catch (e) {
      console.warn('Failed to copy extensions for table: ' + newTable + ', copied from table: ' + table, e);
    }
  }

  /**
   * Delete the Geometry Index extension for the table
   * @param table table name
   */
  public deleteGeometryIndex(table: string): void {
    const tableIndexDao = FeatureTableIndex.getTableIndexDao(this.geoPackage);
    const extensionsDao = this.geoPackage.getExtensionsDao();

    try {
      if (tableIndexDao.isTableExists()) {
        tableIndexDao.deleteByIdCascade(table);
      }
      if (extensionsDao.isTableExists()) {
        extensionsDao.deleteByExtensionAndTableName(FeatureTableIndex.EXTENSION_NAME, table);
      }
    } catch (e) {
      throw new GeoPackageException(
        'Failed to delete Table Index. GeoPackage: ' + this.geoPackage.getName() + ', Table: ' + table,
      );
    }
  }

  /**
   * Delete the Geometry Index extension including the extension entries and
   * custom tables
   */
  public deleteGeometryIndexExtension(): void {
    const geometryIndexDao = FeatureTableIndex.getGeometryIndexDao(this.geoPackage);
    const tableIndexDao = FeatureTableIndex.getTableIndexDao(this.geoPackage);
    const extensionsDao = this.geoPackage.getExtensionsDao();

    try {
      if (geometryIndexDao.isTableExists()) {
        this.geoPackage.dropTable(geometryIndexDao.getTableName());
      }
      if (tableIndexDao.isTableExists()) {
        this.geoPackage.dropTable(tableIndexDao.getTableName());
      }
      if (extensionsDao.isTableExists()) {
        extensionsDao.deleteByExtension(FeatureTableIndex.EXTENSION_NAME);
      }
    } catch (e) {
      throw new GeoPackageException(
        'Failed to delete Table Index extension and tables. GeoPackage: ' + this.geoPackage.getName(),
      );
    }
  }

  /**
   * Copy the Geometry Index extension for the table
   * @param table table name
   * @param newTable new table name
   */
  public copyGeometryIndex(table: string, newTable: string): void {
    try {
      const extensionsDao = this.geoPackage.extensionDao;

      if (extensionsDao.isTableExists()) {
        const extensions = extensionsDao.queryByExtensionAndTableName(FeatureTableIndex.EXTENSION_NAME, table);
        if (extensions.length > 0) {
          const extension = extensions[0];
          extension.table_name = newTable;
          extensionsDao.create(extension);
          const tableIndexDao = this.geoPackage.tableIndexDao;
          if (tableIndexDao.isTableExists()) {
            const tableIndex = tableIndexDao.queryForId(table);
            if (tableIndex !== null && tableIndex !== undefined) {
              tableIndex.table_name = newTable;
              tableIndexDao.create(tableIndex);
              if (this.geoPackage.isTable(GeometryIndexDao.TABLE_NAME)) {
                SQLUtils.transferTableContent(
                  this.geoPackage.connection,
                  GeometryIndexDao.TABLE_NAME,
                  GeometryIndexDao.COLUMN_TABLE_NAME_FIELD,
                  newTable,
                  table,
                );
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('Failed to create Geometry Index for table: ' + newTable + ', copied from table: ' + table, e);
    }
  }

  /**
   * Delete the Tile Scaling extensions for the table
   * @param table table name
   */
  public deleteTileScaling(table: string): void {
    const tileScalingDao = this.geoPackage.tileScalingDao;
    const extensionsDao = this.geoPackage.extensionDao;

    try {
      if (tileScalingDao.isTableExists()) {
        tileScalingDao.deleteByTableName(table);
      }
      if (extensionsDao.isTableExists()) {
        extensionsDao.deleteByExtensionAndTableName(TileScalingExtension.EXTENSION_NAME, table);
      }
    } catch (e) {
      throw new Error('Failed to delete Tile Scaling. GeoPackage: ' + this.geoPackage.name + ', Table: ' + table);
    }
  }

  /**
   * Delete the Tile Scaling extension including the extension entries and
   * custom tables
   */
  public deleteTileScalingExtension(): void {
    const tileScalingDao = this.geoPackage.tileScalingDao;
    const extensionsDao = this.geoPackage.extensionDao;
    try {
      if (tileScalingDao.isTableExists()) {
        this.geoPackage.dropTable(tileScalingDao.gpkgTableName);
      }
      if (extensionsDao.isTableExists()) {
        extensionsDao.deleteByExtension(TileScalingExtension.EXTENSION_NAME);
      }
    } catch (e) {
      throw new Error('Failed to delete Tile Scaling extension and table. GeoPackage: ' + this.geoPackage.name);
    }
  }

  /**
   * Copy the Tile Scaling extensions for the table
   * @param table table name
   * @param newTable new table name
   */
  public copyTileScaling(table: string, newTable: string): void {
    try {
      const tileTableScaling = new TileScalingExtension(this.geoPackage, table);
      if (tileTableScaling.has()) {
        const extension = tileTableScaling.getOrCreateExtension();
        if (extension !== null && extension !== undefined) {
          extension.setTableName(newTable);
          tileTableScaling.extensionsDao.create(extension);
          if (this.geoPackage.isTable(TileScalingDao.TABLE_NAME)) {
            SQLUtils.transferTableContent(
              this.geoPackage.connection,
              TileScalingDao.TABLE_NAME,
              TileScalingDao.COLUMN_TABLE_NAME,
              newTable,
              table,
            );
          }
        }
      }
    } catch (e) {
      console.warn('Failed to create Tile Scaling for table: ' + newTable + ', copied from table: ' + table, e);
    }
  }

  /**
   * Delete the Feature Style extensions for the table
   * @param table table name
   */
  public deleteFeatureStyle(table: string): void {
    const featureStyleExtension = this.getFeatureStyleExtension();
    if (featureStyleExtension.has(table)) {
      featureStyleExtension.deleteRelationships(table);
    }
  }

  /**
   * Delete the Feature Style extension including the extension entries and
   * custom tables
   */
  public deleteFeatureStyleExtension(): void {
    const featureStyleExtension = this.getFeatureStyleExtension();
    if (featureStyleExtension.has(null)) {
      featureStyleExtension.removeExtension();
    }
  }

  /**
   * Copy the Feature Style extensions for the table. Relies on
   * {@link ExtensionManager#copyRelatedTables(String, String)} to be called first.
   * @param table table name
   * @param newTable new table name
   */
  public copyFeatureStyle(table: string, newTable: string): void {
    try {
      const featureStyleExtension = this.getFeatureStyleExtension();
      if (featureStyleExtension.hasRelationship(table)) {
        const extension = featureStyleExtension.getOrCreateExtension(table);
        if (extension != null) {
          extension.setTableName(newTable);
          featureStyleExtension.extensionsDao.create(extension);
          const contentsIdExtension = featureStyleExtension.getContentsId();
          const contentsId = contentsIdExtension.getIdByTableName(table);
          const newContentsId = contentsIdExtension.getIdByTableName(newTable);
          if (
            contentsId !== null &&
            contentsId !== undefined &&
            newContentsId !== null &&
            newContentsId !== undefined
          ) {
            if (featureStyleExtension.hasTableStyleRelationship(table)) {
              this.copyFeatureTableStyle(
                featureStyleExtension,
                FeatureStyleExtension.TABLE_MAPPING_TABLE_STYLE,
                table,
                newTable,
                contentsId,
                newContentsId,
              );
            }
            if (featureStyleExtension.hasTableIconRelationship(table)) {
              this.copyFeatureTableStyle(
                featureStyleExtension,
                FeatureStyleExtension.TABLE_MAPPING_TABLE_ICON,
                table,
                newTable,
                contentsId,
                newContentsId,
              );
            }
          }
        }
      }
    } catch (e) {
      console.warn('Failed to create Feature Style for table: ' + newTable + ', copied from table: ' + table, e);
    }
  }

  /**
   * Copy the feature table style
   * @param featureStyleExtension feature style extension
   * @param mappingTablePrefix mapping table prefix
   * @param table table name
   * @param newTable new table name
   * @param contentsId contents id
   * @param newContentsId new contents id
   */
  public copyFeatureTableStyle(
    featureStyleExtension: FeatureStyleExtension,
    mappingTablePrefix: string,
    table: string,
    newTable: string,
    contentsId: number,
    newContentsId: number,
  ): void {
    const geoPackage: GeoPackage = featureStyleExtension.geoPackage;
    const mappingTableName = featureStyleExtension.getMappingTableName(mappingTablePrefix, table);
    const extensionsDao = geoPackage.extensionDao;
    const extensions = extensionsDao
      .queryByExtensionAndTableName(RelatedTablesExtension.EXTENSION_NAME, mappingTableName)
      .concat(
        extensionsDao.queryByExtensionAndTableName(
          RelatedTablesExtension.EXTENSION_RELATED_TABLES_NAME_NO_AUTHOR,
          mappingTableName,
        ),
      );

    if (extensions.length > 0) {
      const newMappingTableName = featureStyleExtension.getMappingTableName(mappingTablePrefix, newTable);
      const userTable = new UserCustomTableReader(mappingTableName).readTable(geoPackage.connection);
      AlterTable.copyTable(geoPackage.connection, userTable, newMappingTableName, false);
      const mappingTableTableMapping = new TableMapping(
        userTable.getTableName(),
        newMappingTableName,
        userTable.getUserColumns().getColumns(),
      );
      const baseIdColumn = mappingTableTableMapping.getColumn(UserMappingTable.COLUMN_BASE_ID);
      baseIdColumn.constantValue = newContentsId;
      baseIdColumn.whereValue = contentsId;
      SQLUtils.transferTableContentForTableMapping(geoPackage.connection, mappingTableTableMapping);
      const extension = extensions[0];
      extension.setTableName(newMappingTableName);
      extensionsDao.create(extension);
      const extendedRelationTableMapping = TableMapping.fromTableInfo(
        TableInfo.info(geoPackage.connection, ExtendedRelationsDao.TABLE_NAME),
      );
      extendedRelationTableMapping.removeColumn(ExtendedRelationsDao.ID);
      const baseTableNameColumn = extendedRelationTableMapping.getColumn(ExtendedRelationsDao.BASE_TABLE_NAME);
      baseTableNameColumn.whereValue = ContentsIdDao.TABLE_NAME;
      const mappingTableNameColumn = extendedRelationTableMapping.getColumn(ExtendedRelationsDao.MAPPING_TABLE_NAME);
      mappingTableNameColumn.constantValue = newMappingTableName;
      mappingTableNameColumn.whereValue = mappingTableName;
      SQLUtils.transferTableContentForTableMapping(geoPackage.connection, extendedRelationTableMapping);
    }
  }

  /**
   * Get a Feature Style Extension used only for deletions
   * @return Feature Style Extension
   */
  public getFeatureStyleExtension(): FeatureStyleExtension {
    return new FeatureStyleExtension(this.geoPackage);
  }

  /**
   * Delete the Contents Id extensions for the table
   * @param table table name
   */
  public deleteContentsId(table: string): void {
    const contentsIdExtension = new ContentsIdExtension(this.geoPackage);
    if (contentsIdExtension.has()) {
      contentsIdExtension.deleteIdByTableName(table);
    }
  }

  /**
   * Delete the Contents Id extension including the extension entries and
   * custom tables
   */
  public deleteContentsIdExtension(): void {
    const contentsIdExtension = new ContentsIdExtension(this.geoPackage);
    if (contentsIdExtension.has()) {
      contentsIdExtension.removeExtension();
    }
  }

  /**
   * Copy the Contents Id extensions for the table
   * @param table table name
   * @param newTable new table name
   */
  public copyContentsId(table: string, newTable: string): void {
    try {
      const contentsIdExtension = new ContentsIdExtension(this.geoPackage);
      if (contentsIdExtension.has()) {
        const contentsId = contentsIdExtension.getByTableName(table);
        if (contentsId !== null && contentsId !== undefined) {
          contentsIdExtension.createWithTableName(newTable);
        }
      }
    } catch (e) {
      console.warn('Failed to create Contents Id for table: ' + newTable + ', copied from table: ' + table, e);
    }
  }
}

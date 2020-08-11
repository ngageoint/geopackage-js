/**
 * NGA extension management class for deleting extensions for a table or in a
 * GeoPackage
 */
import { GeoPackage } from '../geoPackage';
import { FeatureTableIndex } from './index/featureTableIndex';
import { GeometryIndexDao } from './index/geometryIndexDao';
import { TableIndexDao } from './index/tableIndexDao';
import { CoreSQLUtils } from '../db/coreSQLUtils';
import { TileScalingDao } from './scale/tileScalingDao';
import { TileScalingExtension } from './scale';
import { FeatureStyleExtension } from './style';
import { RelatedTablesExtension } from './relatedTables';
import { ContentsIdExtension } from './contents';
import { UserCustomTableReader } from '../user/custom/userCustomTableReader';
import { AlterTable } from '../db/alterTable';
import { TableMapping } from '../db/tableMapping';
import { UserMappingTable } from './relatedTables/userMappingTable';
import { ExtendedRelationDao } from './relatedTables/extendedRelationDao';
import { TableInfo } from '../db/table/tableInfo';
import { ContentsIdDao } from './contents/contentsIdDao';

export class NGAExtensions {
  /**
   * Delete all NGA table extensions for the table within the GeoPackage
   * @param geoPackage GeoPackage
   * @param table  table name
   */
  static deleteTableExtensions(geoPackage: GeoPackage, table: string) {
    NGAExtensions.deleteGeometryIndex(geoPackage, table);
    NGAExtensions.deleteTileScaling(geoPackage, table);
    NGAExtensions.deleteFeatureStyle(geoPackage, table);
    NGAExtensions.deleteContentsId(geoPackage, table);
    // Delete future extensions for the table here
  }

  /**
   * Delete all NGA extensions including custom extension tables for the
   * GeoPackage
   * @param geoPackage GeoPackage
   */
  static deleteExtensions(geoPackage: GeoPackage) {
    NGAExtensions.deleteGeometryIndexExtension(geoPackage);
    NGAExtensions.deleteTileScalingExtension(geoPackage);
    NGAExtensions.deleteFeatureStyleExtension(geoPackage);
    NGAExtensions.deleteContentsIdExtension(geoPackage);
    // Delete future extension tables here
  }

  /**
   * Copy all NGA table extensions for the table within the GeoPackage
   * @param geoPackage GeoPackage
   * @param table table name
   * @param newTable new table name
   */
  static copyTableExtensions(geoPackage: GeoPackage, table: string, newTable: string) {
    try {
      NGAExtensions.copyFeatureStyle(geoPackage, table, newTable);
      NGAExtensions.copyTileScaling(geoPackage, table, newTable);
      NGAExtensions.copyGeometryIndex(geoPackage, table, newTable);
      NGAExtensions.copyContentsId(geoPackage, table, newTable);
      // Copy future extensions for the table here
    } catch (e) {
      console.warn('Failed to copy extensions for table: ' + newTable + ', copied from table: ' + table, e);
    }

  }

  /**
   * Delete the Geometry Index extension for the table
   * @param geoPackage GeoPackage
   * @param table table name
   */
  static deleteGeometryIndex(geoPackage: GeoPackage, table: string) {
    let tableIndexDao = geoPackage.tableIndexDao;
    let extensionsDao = geoPackage.extensionDao;

    try {
      if (tableIndexDao.isTableExists()) {
        tableIndexDao.deleteById(table)
      }
      if (extensionsDao.isTableExists()) {
        extensionsDao.deleteByExtensionAndTableName(FeatureTableIndex.EXTENSION_NAME, table);
      }
    } catch (e) {
      throw new Error('Failed to delete Table Index. GeoPackage: ' + geoPackage.name + ', Table: ' + table);
    }
  }

  /**
   * Delete the Geometry Index extension including the extension entries and
   * custom tables
   * @param geoPackage GeoPackage
   */
  static deleteGeometryIndexExtension(geoPackage: GeoPackage) {
    let geometryIndexDao = geoPackage.getGeometryIndexDao(null);
    let tableIndexDao = geoPackage.tableIndexDao;
    let extensionsDao = geoPackage.extensionDao;

    try {
      if (geometryIndexDao.isTableExists()) {
        geoPackage.dropTable(GeometryIndexDao.TABLE_NAME);
      }
      if (tableIndexDao.isTableExists()) {
        geoPackage.dropTable(TableIndexDao.TABLE_NAME);
      }
      if (extensionsDao.isTableExists()) {
        extensionsDao.deleteByExtension(FeatureTableIndex.EXTENSION_NAME);
      }
    } catch (e) {
      throw new Error('Failed to delete Table Index extension and tables. GeoPackage: ' + geoPackage.name);
    }

  }

  /**
   * Copy the Geometry Index extension for the table
   * @param geoPackage GeoPackage
   * @param table table name
   * @param newTable new table name
   */
  static copyGeometryIndex(geoPackage: GeoPackage, table: string, newTable: string) {
    try {
      let extensionsDao = geoPackage.extensionDao;

      if (extensionsDao.isTableExists()) {
        let extensions = extensionsDao.queryByExtensionAndTableName(FeatureTableIndex.EXTENSION_NAME, table);
        if (extensions.length > 0) {
          let extension = extensions[0];
          extension.table_name = newTable;
          extensionsDao.create(extension);
          let tableIndexDao = geoPackage.tableIndexDao;
          if (tableIndexDao.isTableExists()) {
            let tableIndex = tableIndexDao.queryForId(table);
            if (tableIndex != null) {
              tableIndex.table_name = newTable;
              tableIndexDao.create(tableIndex);
              if (geoPackage.isTable(GeometryIndexDao.TABLE_NAME)) {
                CoreSQLUtils.transferTableContent(
                  geoPackage.connection,
                  GeometryIndexDao.TABLE_NAME,
                  GeometryIndexDao.COLUMN_TABLE_NAME,
                  newTable, table);
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn(
        'Failed to create Geometry Index for table: ' + newTable
        + ', copied from table: ' + table,
        e);
    }

  }

  /**
   * Delete the Tile Scaling extensions for the table
   * @param geoPackage GeoPackage
   * @param table table name
   */
  static deleteTileScaling(geoPackage: GeoPackage, table: string) {
    let tileScalingDao = geoPackage.tileScalingDao;
    let extensionsDao = geoPackage.extensionDao;

    try {
      if (tileScalingDao.isTableExists()) {
        tileScalingDao.deleteByTableName(table);
      }
      if (extensionsDao.isTableExists()) {
        extensionsDao.deleteByExtensionAndTableName(TileScalingExtension.EXTENSION_NAME, table);
      }
    } catch (e) {
      throw new Error(
        'Failed to delete Tile Scaling. GeoPackage: ' + geoPackage.name + ', Table: ' + table);
    }
  }

  /**
   * Delete the Tile Scaling extension including the extension entries and
   * custom tables
   * @param geoPackage GeoPackage
   */
  static deleteTileScalingExtension(geoPackage: GeoPackage) {
    let tileScalingDao = geoPackage.tileScalingDao;
    let extensionsDao = geoPackage.extensionDao;
    try {
      if (tileScalingDao.isTableExists()) {
        geoPackage.dropTable(tileScalingDao.gpkgTableName);
      }
      if (extensionsDao.isTableExists()) {
        extensionsDao.deleteByExtension(TileScalingExtension.EXTENSION_NAME);
      }
    } catch (e) {
      throw new Error(
        'Failed to delete Tile Scaling extension and table. GeoPackage: '
        + geoPackage.name);
    }

  }

  /**
   * Copy the Tile Scaling extensions for the table
   * @param geoPackage GeoPackage
   * @param table table name
   * @param newTable new table name
   */
  static copyTileScaling(geoPackage: GeoPackage, table: string, newTable: string) {
    try {
      let tileTableScaling = new TileScalingExtension(geoPackage, table);

      if (tileTableScaling.has()) {
        let extension = tileTableScaling.getOrCreateExtension();
        if (extension !== null && extension !== undefined) {
          extension.setTableName(newTable);
          tileTableScaling.getOrCreateExtension();
          if (geoPackage.isTable(TileScalingDao.TABLE_NAME)) {
            CoreSQLUtils.transferTableContent(
              geoPackage.connection,
              TileScalingDao.TABLE_NAME,
              TileScalingDao.COLUMN_TABLE_NAME, newTable, table);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to create Tile Scaling for table: ' + newTable + ', copied from table: ' + table, e);
    }
  }

  /**
   * Delete the Feature Style extensions for the table
   * @param geoPackage GeoPackage
   * @param table table name
   */
  static deleteFeatureStyle(geoPackage: GeoPackage, table: string) {
    let featureStyleExtension = NGAExtensions.getFeatureStyleExtension(geoPackage);
    if (featureStyleExtension.has(table)) {
      featureStyleExtension.deleteRelationships(table);
    }

  }

  /**
   * Delete the Feature Style extension including the extension entries and
   * custom tables
   * @param geoPackage GeoPackage
   */
  static deleteFeatureStyleExtension(geoPackage: GeoPackage) {
    let featureStyleExtension = NGAExtensions.getFeatureStyleExtension(geoPackage);
    if (featureStyleExtension.has(null)) {
      featureStyleExtension.removeExtension();
    }

  }

  /**
   * Copy the Feature Style extensions for the table. Relies on
   * {@link GeoPackageExtensions#copyRelatedTables(GeoPackageCore, String, String)}
   * to be called first.
   * @param geoPackage GeoPackage
   * @param table table name
   * @param newTable new table name
   */
  static copyFeatureStyle(geoPackage: GeoPackage, table: string, newTable: string) {
    try {
      let featureStyleExtension = NGAExtensions.getFeatureStyleExtension(geoPackage);
      if (featureStyleExtension.hasRelationship(table)) {
        let extension = featureStyleExtension.getOrCreateExtension(table);
        if (extension != null) {
          extension.setTableName(newTable);
          featureStyleExtension.extensionsDao.create(extension);
          let contentsIdExtension = featureStyleExtension.getContentsId();
          let contentsId = contentsIdExtension.getIdByTableName(table);
          let newContentsId = contentsIdExtension.getIdByTableName(newTable);
          if (contentsId != null && newContentsId != null) {
            if (featureStyleExtension.hasTableStyleRelationship(table)) {
              NGAExtensions.copyFeatureTableStyle(featureStyleExtension, FeatureStyleExtension.TABLE_MAPPING_TABLE_STYLE, table, newTable, contentsId, newContentsId);
            }
            if (featureStyleExtension.hasTableIconRelationship(table)) {
              NGAExtensions.copyFeatureTableStyle(featureStyleExtension,
                FeatureStyleExtension.TABLE_MAPPING_TABLE_ICON,
                table, newTable, contentsId, newContentsId);
            }
          }
        }
      }
    } catch (e) {
      console.warn(
        'Failed to create Feature Style for table: ' + newTable
        + ', copied from table: ' + table, e);
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
  static copyFeatureTableStyle(featureStyleExtension: FeatureStyleExtension, mappingTablePrefix: string, table: string, newTable: string, contentsId: number, newContentsId: number) {
    let geoPackage: GeoPackage = featureStyleExtension.geoPackage;
    let mappingTableName = featureStyleExtension.getMappingTableName(mappingTablePrefix, table);
    let extensionsDao = geoPackage.extensionDao;
    let extensions = extensionsDao.queryByExtensionAndTableName(RelatedTablesExtension.EXTENSION_NAME, mappingTableName);

    if (extensions.length > 0) {
      let newMappingTableName = featureStyleExtension.getMappingTableName(mappingTablePrefix, newTable);
      let userTable = new UserCustomTableReader(mappingTableName).readTable(geoPackage.connection);
      AlterTable.copyTable(geoPackage.connection, userTable, newMappingTableName, false);
      let mappingTableTableMapping = new TableMapping(userTable.getTableName(), newMappingTableName, userTable.getUserColumns().getColumns());
      let baseIdColumn = mappingTableTableMapping.getColumn(UserMappingTable.COLUMN_BASE_ID);
      baseIdColumn.constantValue = newContentsId;
      baseIdColumn.whereValue = contentsId;
      CoreSQLUtils.transferTableContentForTableMapping(geoPackage.connection, mappingTableTableMapping);
      let extension = extensions[0];
      extension.setTableName(newMappingTableName);
      extensionsDao.create(extension);
      let extendedRelationTableMapping = TableMapping.fromTableInfo(TableInfo.info(geoPackage.connection, ExtendedRelationDao.TABLE_NAME));
      extendedRelationTableMapping.removeColumn(ExtendedRelationDao.COLUMN_ID);
      let baseTableNameColumn = extendedRelationTableMapping.getColumn(ExtendedRelationDao.COLUMN_BASE_TABLE_NAME);
      baseTableNameColumn.whereValue = ContentsIdDao.TABLE_NAME;
      let mappingTableNameColumn = extendedRelationTableMapping.getColumn(ExtendedRelationDao.COLUMN_MAPPING_TABLE_NAME);
      mappingTableNameColumn.constantValue = newMappingTableName;
      mappingTableNameColumn.whereValue = mappingTableName;
      CoreSQLUtils.transferTableContentForTableMapping(geoPackage.connection, extendedRelationTableMapping);
    }
  }

  /**
   * Get a Feature Style Extension used only for deletions
   * @param geoPackage GeoPackage
   * @return Feature Style Extension
   */
  static getFeatureStyleExtension(geoPackage: GeoPackage): FeatureStyleExtension {
    return new FeatureStyleExtension(geoPackage);
  }

  /**
   * Delete the Contents Id extensions for the table
   * @param geoPackage GeoPackage
   * @param table table name
   */
  static deleteContentsId(geoPackage: GeoPackage, table: string) {
    let contentsIdExtension = new ContentsIdExtension(geoPackage);
    if (contentsIdExtension.has()) {
      contentsIdExtension.deleteIdByTableName(table);
    }
  }

  /**
   * Delete the Contents Id extension including the extension entries and
   * custom tables
   * @param geoPackage GeoPackage
   */
  static deleteContentsIdExtension(geoPackage: GeoPackage) {
    let contentsIdExtension = new ContentsIdExtension(geoPackage);
    if (contentsIdExtension.has()) {
      contentsIdExtension.removeExtension();
    }
  }

  /**
   * Copy the Contents Id extensions for the table
   * @param geoPackage GeoPackage
   * @param table table name
   * @param newTable new table name
   */
  static copyContentsId(geoPackage: GeoPackage, table: string, newTable: string) {
    try {
      let contentsIdExtension = new ContentsIdExtension(geoPackage);
      if (contentsIdExtension.has()) {
        if (contentsIdExtension.getByTableName(table) !== null) {
          contentsIdExtension.createWithTableName(newTable);
        }
      }
    } catch (e) {
      console.warn( 'Failed to create Contents Id for table: '
        + newTable + ', copied from table: ' + table, e);
    }
  }
}

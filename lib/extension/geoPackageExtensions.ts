/**
 * GeoPackage extension management class for deleting extensions for a table or
 * in a GeoPackage
 */
import { NGAExtensions } from './ngaExtensions';
import { GeoPackage } from '../geoPackage';
import { RTreeIndex } from './rtree/rtreeIndex';
import { RelatedTablesExtension } from './relatedTables';
import { TableInfo } from '../db/table/tableInfo';
import { CoreSQLUtils } from '../db/coreSQLUtils';
import { UserCustomTableReader } from '../user/custom/userCustomTableReader';
import { AlterTable } from '../db/alterTable';
import { TableMapping } from '../db/tableMapping';
import { ExtendedRelationDao } from './relatedTables/extendedRelationDao';
import { SchemaExtension } from './schema';
import { DataColumnsDao } from '../dataColumns/dataColumnsDao';
import { TableCreator } from '../db/tableCreator';
import { ConstraintParser } from '../db/table/constraintParser';
import { MetadataExtension } from './metadata';
import { MetadataReferenceDao } from '../metadata/reference/metadataReferenceDao';
import { CrsWktExtension } from './crsWkt';

export class GeoPackageExtensions {

  /**
   * Delete all table extensions for the table within the GeoPackage
   *
   * @param geoPackage GeoPackage
   * @param table table name
   */
  static deleteTableExtensions(geoPackage: GeoPackage, table: string) {
    // Handle deleting any extensions with extra tables here
    NGAExtensions.deleteTableExtensions(geoPackage, table);
    GeoPackageExtensions.deleteRTreeSpatialIndex(geoPackage, table);
    GeoPackageExtensions.deleteRelatedTables(geoPackage, table);
    GeoPackageExtensions.deleteSchema(geoPackage, table);
    GeoPackageExtensions.deleteMetadata(geoPackage, table);
    GeoPackageExtensions.deleteExtensionForTable(geoPackage, table);
  }

  /**
   * Delete all extensions
   * @param geoPackage GeoPackage
   */
  static deleteExtensions(geoPackage: GeoPackage) {
    // Handle deleting any extensions with extra tables here
    NGAExtensions.deleteExtensions(geoPackage);
    this.deleteRTreeSpatialIndexExtension(geoPackage);
    this.deleteRelatedTablesExtension(geoPackage);
    this.deleteSchemaExtension(geoPackage);
    this.deleteMetadataExtension(geoPackage);
    this.deleteCrsWktExtension(geoPackage);
    this.delete(geoPackage);
  }

  /**
   * Copy all table extensions for the table within the GeoPackage
   *
   * @param geoPackage GeoPackage
   * @param table table name
   * @param newTable new table name
   */
  static copyTableExtensions(geoPackage: GeoPackage, table: string, newTable: string) {
    try {
      GeoPackageExtensions.copyRTreeSpatialIndex(geoPackage, table, newTable);
      GeoPackageExtensions.copyRelatedTables(geoPackage, table, newTable);
      GeoPackageExtensions.copySchema(geoPackage, table, newTable);
      GeoPackageExtensions.copyMetadata(geoPackage, table, newTable);
      // Handle copying any extensions with extra tables here
      NGAExtensions.copyTableExtensions(geoPackage, table, newTable);
    } catch (e) {
      console.warn( 'Failed to copy extensions for table: '
        + newTable + ', copied from table: ' + table, e);
    }

  }

  /**
   * Delete the extensions for the table
   * @param geoPackage
   * @param table
   */
  static deleteExtensionForTable(geoPackage: GeoPackage, table: string) {
    let extensionsDao = geoPackage.extensionDao;
    try {
      if (extensionsDao.isTableExists()) {
        extensionsDao.deleteByExtension(table);
      }
    } catch (SQLe) {
      throw new Error('Failed to delete Table extensions. GeoPackage: ' + geoPackage.name + ', Table: ' + table);
    }
  }

  /**
   * Delete the extensions
   * @param geoPackage
   */
  static delete(geoPackage: GeoPackage) {
    let extensionsDao = geoPackage.extensionDao;
    try {
      if (extensionsDao.isTableExists()) {
        geoPackage.dropTable(extensionsDao.gpkgTableName);
      }
    } catch (SQLe) {
      throw new Error('Failed to delete all extensions. GeoPackage: ' + geoPackage.name);
    }

  }

  /**
   * Delete the RTree Spatial extension for the table
   * @param geoPackage GeoPackage
   * @param table table name
   */
  static deleteRTreeSpatialIndex(geoPackage: GeoPackage, table: string) {
    let rTreeIndexExtension = GeoPackageExtensions.getRTreeIndexExtension(geoPackage);
    if (rTreeIndexExtension.has(table)) {
      rTreeIndexExtension.deleteTable(table);
    }

  }

  /**
   * Delete the RTree Spatial extension
   * @param geoPackage GeoPackage
   */
  static deleteRTreeSpatialIndexExtension(geoPackage: GeoPackage) {
    let rTreeIndexExtension = GeoPackageExtensions.getRTreeIndexExtension(geoPackage);
    if (rTreeIndexExtension.has()) {
      rTreeIndexExtension.deleteAll();
    }
  }

  /**
   * Copy the RTree Spatial extension for the table
   * @param geoPackage GeoPackage
   * @param table table name
   * @param newTable new table name
   */
  static copyRTreeSpatialIndex(geoPackage: GeoPackage, table: string, newTable: string) {
    try {
      let rTreeIndexExtension = GeoPackageExtensions.getRTreeIndexExtension(geoPackage);
      if (rTreeIndexExtension.has(table)) {
        let geometryColumnsDao = geoPackage.geometryColumnsDao;
        let geometryColumns = geometryColumnsDao.queryForTableName(newTable);
        if (geometryColumns !== null && geometryColumns !== undefined) {
          let tableInfo = TableInfo.info(geoPackage.connection, newTable);
          if (tableInfo !== null && tableInfo !== undefined) {
            let pk = tableInfo.getPrimaryKey().getName();
            rTreeIndexExtension.createWithParameters(newTable, geometryColumns.column_name, pk);
          }
        }
      }
    } catch (e) {
      console.warn( 'Failed to create RTree for table: '
        + newTable + ', copied from table: ' + table, e);
    }
  }

  /**
   * Get a RTree Index Extension used only for deletions
   * @param geoPackage GeoPackage
   * @return RTree index extension
   */
  static getRTreeIndexExtension(geoPackage: GeoPackage): RTreeIndex {
    return new RTreeIndex(geoPackage, null);
  }

  /**
   * Delete the Related Tables extensions for the table
   * @param geoPackage GeoPackage
   * @param table table name
   */
  static deleteRelatedTables(geoPackage: GeoPackage,
    table: string) {
    let relatedTablesExtension = GeoPackageExtensions.getRelatedTableExtension(geoPackage);
    if (relatedTablesExtension.has()) {
      relatedTablesExtension.removeRelationships(table);
    }
  }

  /**
   * Delete the Related Tables extension
   * @param geoPackage GeoPackage
   */
  static deleteRelatedTablesExtension(geoPackage: GeoPackage) {
    let relatedTablesExtension = GeoPackageExtensions.getRelatedTableExtension(geoPackage);
    if (relatedTablesExtension.has()) {
      relatedTablesExtension.removeExtension();
    }
  }

  /**
   * Copy the Related Tables extensions for the table
   * @param geoPackage GeoPackage
   * @param table table name
   * @param newTable new table name
   */
  static copyRelatedTables(geoPackage: GeoPackage, table: string, newTable: string) {
    try {
      let relatedTablesExtension = GeoPackageExtensions.getRelatedTableExtension(geoPackage);
      if (relatedTablesExtension.has()) {
        let extendedRelationsDao = relatedTablesExtension.extendedRelationDao;
        let extensionsDao = geoPackage.extensionDao;
        let extendedRelations = extendedRelationsDao.getBaseTableRelations(table);
        extendedRelations.forEach(extendedRelation => {
          let mappingTableName = extendedRelation.mapping_table_name;
          let extensions = extensionsDao.queryByExtensionAndTableName(RelatedTablesExtension.EXTENSION_NAME, mappingTableName)
            .concat(extensionsDao.queryByExtensionAndTableName(RelatedTablesExtension.EXTENSION_RELATED_TABLES_NAME_NO_AUTHOR, mappingTableName));
          if (extensions.length > 0) {
            let newMappingTableName = CoreSQLUtils.createName(geoPackage.connection, mappingTableName, table, newTable);
            let userTable = new UserCustomTableReader(mappingTableName).readTable(geoPackage.connection);
            AlterTable.copyTable(geoPackage.connection, userTable, newMappingTableName);
            let extension = extensions[0];
            extension.setTableName(newMappingTableName);
            extensionsDao.create(extension);
            let extendedRelationTableMapping = TableMapping.fromTableInfo(TableInfo.info(geoPackage.connection, ExtendedRelationDao.TABLE_NAME));
            extendedRelationTableMapping.removeColumn(ExtendedRelationDao.ID);
            let baseTableNameColumn = extendedRelationTableMapping.getColumn(ExtendedRelationDao.BASE_TABLE_NAME);
            baseTableNameColumn.constantValue = newTable;
            baseTableNameColumn.whereValue = table;
            let mappingTableNameColumn = extendedRelationTableMapping.getColumn(ExtendedRelationDao.MAPPING_TABLE_NAME);
            mappingTableNameColumn.constantValue = newMappingTableName;
            mappingTableNameColumn.whereValue = mappingTableName;
            CoreSQLUtils.transferTableContentForTableMapping(geoPackage.connection, extendedRelationTableMapping);
          }
        });
      }
    } catch (e) {
      console.warn('Failed to create Related Tables for table: ' + newTable + ', copied from table: ' + table, e);
    }

  }

  /**
   * Get a Related Table Extension used only for deletions
   * @param geoPackage GeoPackage
   * @return Related Table Extension
   */
  static getRelatedTableExtension(geoPackage: GeoPackage): RelatedTablesExtension {
    return new RelatedTablesExtension(geoPackage);
  }

  /**
   * Delete the Schema extensions for the table
   * @param geoPackage GeoPackage
   * @param table table name
   */
  static deleteSchema(geoPackage: GeoPackage, table: string) {
    let dataColumnsDao = geoPackage.dataColumnsDao;
    try {
      if (dataColumnsDao.isTableExists()) {
        dataColumnsDao.deleteByTableName(table);
      }
    } catch (e) {
      throw new Error('Failed to delete Schema extension. GeoPackage: ' + geoPackage.name + ', Table: ' + table);
    }

  }

  /**
   * Delete the Schema extension
   * @param geoPackage GeoPackage
   */
  static deleteSchemaExtension(geoPackage: GeoPackage) {
    let schemaExtension = new SchemaExtension(geoPackage);
    if (schemaExtension.has()) {
      schemaExtension.removeExtension();
    }
  }

  /**
   * Copy the Schema extensions for the table
   * @param geoPackage GeoPackage
   * @param table table name
   * @param newTable new table name
   */
  static copySchema(geoPackage: GeoPackage, table: string, newTable: string) {
    try {
      if (geoPackage.isTable(DataColumnsDao.TABLE_NAME)) {
        let dataColumnsTable = new UserCustomTableReader(DataColumnsDao.TABLE_NAME).readUserCustomTable(geoPackage);
        let nameColumn = dataColumnsTable.getColumnWithColumnName(DataColumnsDao.COLUMN_NAME);
        if (nameColumn.hasConstraints()) {
          nameColumn.clearConstraints();
          if (dataColumnsTable.hasConstraints()) {
            dataColumnsTable.clearConstraints();
            let constraintSql = TableCreator.tableCreationScripts.data_columns[0];
            let constraints = ConstraintParser.getConstraints(constraintSql);
            dataColumnsTable.addConstraints(constraints.getTableConstraints());
          }
          AlterTable.alterColumnForTable(geoPackage.connection, dataColumnsTable, nameColumn);
        }
        CoreSQLUtils.transferTableContent(geoPackage.connection, DataColumnsDao.TABLE_NAME, DataColumnsDao.COLUMN_TABLE_NAME, newTable, table);
      }
    } catch (e) {
      console.warn( 'Failed to create Schema for table: '
        + newTable + ', copied from table: ' + table, e);
    }

  }

  /**
   * Delete the Metadata extensions for the table
   * @param geoPackage GeoPackage
   * @param table table name
   */
  static deleteMetadata(geoPackage: GeoPackage, table: string) {
    let metadataReferenceDao = geoPackage.metadataReferenceDao;
    try {
      if (metadataReferenceDao.isTableExists()) {
        metadataReferenceDao.deleteByTableName(table);
      }
    } catch (SQLe) {
      throw new Error('Failed to delete Metadata extension. GeoPackage: ' + geoPackage.name + ', Table: ' + table);
    }

  }

  /**
   * Delete the Metadata extension
   * @param geoPackage GeoPackage
   */
  static deleteMetadataExtension(geoPackage: GeoPackage) {
    let metadataExtension = new MetadataExtension(geoPackage);
    if (metadataExtension.has()) {
      metadataExtension.removeExtension();
    }
  }

  /**
   * Copy the Metadata extensions for the table
   * @param geoPackage  GeoPackage
   * @param table table name
   * @param newTable  new table name
   */
  static copyMetadata(geoPackage: GeoPackage, table: string, newTable: string) {
    try {
      if (geoPackage.isTable(MetadataReferenceDao.TABLE_NAME)) {
        CoreSQLUtils.transferTableContent(geoPackage.connection, MetadataReferenceDao.TABLE_NAME, MetadataReferenceDao.COLUMN_TABLE_NAME, newTable, table);
      }
    } catch (e) {
      console.warn( 'Failed to create Metadata for table: ' + newTable + ', copied from table: ' + table, e);
    }
  }

  /**
   * Delete the WKT for Coordinate Reference Systems extension
   * @param geoPackage GeoPackage
   */
  static deleteCrsWktExtension(geoPackage: GeoPackage) {
    let crsWktExtension = new CrsWktExtension(geoPackage);
    if (crsWktExtension.has()) {
      crsWktExtension.removeExtension();
    }
  }
}

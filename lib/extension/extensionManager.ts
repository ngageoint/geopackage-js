import { ExtensionManagement } from './extensionManagement';
import { NGAExtensions } from './nga/ngaExtensions';
import { GeoPackageConstants } from '../geoPackageConstants';
import { GeoPackageException } from '../geoPackageException';
import { TableInfo } from '../db/table/tableInfo';
import { RTreeIndexExtension } from './rtree/rTreeIndexExtension';
import { RelatedTablesExtension } from './related/relatedTablesExtension';
import { SQLUtils } from '../db/sqlUtils';
import { UserCustomTableReader } from '../user/custom/userCustomTableReader';
import { AlterTable } from '../db/alterTable';
import { TableMapping } from '../db/tableMapping';
import { SchemaExtension } from './schema/schemaExtension';
import { GeoPackageTableCreator } from '../db/geoPackageTableCreator';
import { ConstraintParser } from '../db/table/constraintParser';
import { MetadataExtension } from './metadata/metadataExtension';
import { CrsWktExtension } from './crsWktExtension';
import { DataColumns } from './schema/columns/dataColumns';
import { MetadataReference } from './metadata/reference/metadataReference';
import { ExtendedRelation } from './related/extendedRelation';
import type { GeoPackage } from '../geoPackage';
import { PropertiesExtension } from './nga/properties/propertiesExtension';

/**
 * GeoPackage Extension Manager for deleting and copying extensions
 */
export class ExtensionManager extends ExtensionManagement {
  /**
   * Community Extensions
   */
  private readonly communityExtensions: ExtensionManagement[] = [];

  /**
   * Constructor
   *
   * @param geoPackage
   *            GeoPackage
   */
  public constructor(geoPackage: GeoPackage) {
    super(geoPackage);
    this.communityExtensions.push(new NGAExtensions(geoPackage));
    // communityExtensions.add(new ImageMattersExtensions(geoPackage));
    // communityExtensions.add(new EcereExtensions(geoPackage));
  }

  /**
   * @inheritDoc
   */
  public getAuthor(): string {
    return GeoPackageConstants.EXTENSION_AUTHOR;
  }

  /**
   * @inheritDoc
   */
  public deleteTableExtensions(table: string): void {
    // Handle deleting any extensions with extra tables here
    for (const extensions of this.communityExtensions) {
      extensions.deleteTableExtensions(table);
    }

    this.deleteRTreeSpatialIndex(table);
    this.deleteRelatedTables(table);
    // this.deleteGriddedCoverage(table);
    this.deleteSchema(table);
    this.deleteMetadata(table);
    this.deleteProperties(table);

    this.deleteTable(table);
  }

  /**
   * @inheritDoc
   */
  public deleteExtensions(): void {
    // Handle deleting any extensions with extra tables here
    for (const extensions of this.communityExtensions) {
      extensions.deleteExtensions();
    }

    this.deleteRTreeSpatialIndexExtension();
    this.deleteRelatedTablesExtension();
    // this.deleteGriddedCoverageExtension();
    this.deleteSchemaExtension();
    this.deleteMetadataExtension();
    this.deleteCrsWktExtension();
    this.deletePropertiesExtension();

    this.delete();
  }

  /**
   * @inheritDoc
   */
  public copyTableExtensions(table: string, newTable: string): void {
    try {
      this.copyRTreeSpatialIndex(table, newTable);
      this.copyRelatedTables(table, newTable);
      // this.copyGriddedCoverage(table, newTable);
      this.copySchema(table, newTable);
      this.copyMetadata(table, newTable);

      // Handle copying any extensions with extra tables here
      for (const extensions of this.communityExtensions) {
        try {
          extensions.copyTableExtensions(table, newTable);
        } catch (e) {
          console.warn(
            "Failed to copy '" +
              extensions.getAuthor() +
              "' extensions for table: " +
              newTable +
              ', copied from table: ' +
              table,
          );
        }
      }
    } catch (e) {
      console.warn('Failed to copy extensions for table: ' + newTable + ', copied from table: ' + table);
    }
  }

  /**
   * Delete the extensions for the table
   *
   * @param table table name
   */
  private deleteTable(table: string): void {
    const extensionsDao = this.geoPackage.getExtensionsDao();

    try {
      if (extensionsDao.isTableExists()) {
        extensionsDao.deleteByTableName(table);
      }
    } catch (e) {
      throw new GeoPackageException(
        'Failed to delete Table extensions. GeoPackage: ' + this.geoPackage.getName() + ', Table: ' + table,
      );
    }
  }

  /**
   * Delete the extensions
   */
  private delete(): void {
    const extensionsDao = this.geoPackage.getExtensionsDao();

    try {
      if (extensionsDao.isTableExists()) {
        this.geoPackage.dropTable(extensionsDao.getTableName());
      }
    } catch (e) {
      throw new GeoPackageException('Failed to delete all extensions. GeoPackage: ' + this.geoPackage.getName());
    }
  }

  /**
   * Delete the RTree Spatial extension for the table
   *
   * @param table
   *            table name
   */
  public deleteRTreeSpatialIndex(table: string): void {
    const rTreeIndexExtension = this.getRTreeIndexExtension();
    if (rTreeIndexExtension.hasExtensionWithTable(table)) {
      rTreeIndexExtension.deleteWithTableName(table);
    }
  }

  /**
   * Delete the RTree Spatial extension
   */
  public deleteRTreeSpatialIndexExtension(): void {
    const rTreeIndexExtension = this.getRTreeIndexExtension();
    if (rTreeIndexExtension.has()) {
      rTreeIndexExtension.deleteAll();
    }
  }

  /**
   * Copy the RTree Spatial extension for the table
   *
   * @param table table name
   * @param newTable new table name
   */
  public copyRTreeSpatialIndex(table: string, newTable: string): void {
    try {
      const rTreeIndexExtension = this.getRTreeIndexExtension();
      if (rTreeIndexExtension.hasExtensionWithTable(table)) {
        const geometryColumnsDao = this.geoPackage.getGeometryColumnsDao();

        const geometryColumns = geometryColumnsDao.queryForTableName(newTable);
        if (geometryColumns != null) {
          const tableInfo = TableInfo.info(this.geoPackage.getDatabase(), newTable);
          if (tableInfo != null) {
            const pk = tableInfo.getPrimaryKey().name;
            rTreeIndexExtension.create(newTable, geometryColumns.getColumnName(), pk);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to create RTree for table: ' + newTable + ', copied from table: ' + table);
    }
  }

  /**
   * Get a RTree Index Extension used only for deletions
   *
   * @return RTree index extension
   */
  private getRTreeIndexExtension(): RTreeIndexExtension {
    return new RTreeIndexExtension(this.geoPackage);
  }

  /**
   * Delete the Related Tables extensions for the table
   *
   * @param table table name
   */
  public deleteRelatedTables(table: string): void {
    const relatedTablesExtension = this.getRelatedTablesExtension();
    if (relatedTablesExtension.has()) {
      relatedTablesExtension.removeRelationships(table);
    }
  }

  /**
   * Delete the Related Tables extension
   */
  public deleteRelatedTablesExtension(): void {
    const relatedTablesExtension = this.getRelatedTablesExtension();
    if (relatedTablesExtension.has()) {
      relatedTablesExtension.removeExtension();
    }
  }

  /**
   * Copy the Related Tables extensions for the table
   *
   * @param table
   *            table name
   * @param newTable
   *            new table name
   */
  public copyRelatedTables(table: string, newTable: string): void {
    try {
      const relatedTablesExtension = this.getRelatedTablesExtension();
      if (relatedTablesExtension.has()) {
        const extendedRelationsDao = relatedTablesExtension.getExtendedRelationsDao();
        const extensionsDao = this.geoPackage.getExtensionsDao();
        const extendedRelations = extendedRelationsDao.getBaseTableRelations(table);
        extendedRelations.forEach((extendedRelation) => {
          const mappingTableName = extendedRelation.getMappingTableName();
          const extensions = extensionsDao
            .queryByExtensionAndTableName(RelatedTablesExtension.EXTENSION_NAME, mappingTableName)
            .concat(
              extensionsDao.queryByExtensionAndTableName(
                RelatedTablesExtension.EXTENSION_NAME_NO_AUTHOR,
                mappingTableName,
              ),
            );
          if (extensions.length > 0) {
            const newMappingTableName = SQLUtils.createName(
              this.geoPackage.getConnection(),
              mappingTableName,
              table,
              newTable,
            );
            const userTable = new UserCustomTableReader(mappingTableName).readTable(this.geoPackage.getConnection());
            AlterTable.copyTable(this.geoPackage.getConnection(), userTable, newMappingTableName);
            const extension = extensions[0];
            extension.setTableName(newMappingTableName);
            extensionsDao.create(extension);
            const extendedRelationTableMapping = TableMapping.fromTableInfo(
              TableInfo.info(this.geoPackage.getConnection(), ExtendedRelation.TABLE_NAME),
            );
            extendedRelationTableMapping.removeColumn(ExtendedRelation.COLUMN_ID);
            const baseTableNameColumn = extendedRelationTableMapping.getColumn(ExtendedRelation.COLUMN_BASE_TABLE_NAME);
            baseTableNameColumn.constantValue = newTable;
            baseTableNameColumn.whereValue = table;
            const mappingTableNameColumn = extendedRelationTableMapping.getColumn(
              ExtendedRelation.COLUMN_MAPPING_TABLE_NAME,
            );
            mappingTableNameColumn.constantValue = newMappingTableName;
            mappingTableNameColumn.whereValue = mappingTableName;
            SQLUtils.transferTableContentForTableMapping(this.geoPackage.getConnection(), extendedRelationTableMapping);
          }
        });
      }
    } catch (e) {
      console.warn('Failed to create Related Tables for table: ' + newTable + ', copied from table: ' + table);
    }
  }

  /**
   * Get a Related Table Extension used only for deletions
   *
   * @return Related Table Extension
   */
  public getRelatedTablesExtension(): RelatedTablesExtension {
    return new RelatedTablesExtension(this.geoPackage);
  }

  // /**
  //  * Delete the Gridded Coverage extensions for the table
  //  *
  //  * @param table
  //  *            table name
  //  */
  // public void deleteGriddedCoverage(table: string) {
  //
  // 	if (geoPackage.isTableType(table, CoverageDataCore.GRIDDED_COVERAGE)) {
  //
  // 		GriddedTileDao griddedTileDao = CoverageDataCore
  // 				.getGriddedTileDao(geoPackage);
  // 		GriddedCoverageDao griddedCoverageDao = CoverageDataCore
  // 				.getGriddedCoverageDao(geoPackage);
  // 		ExtensionsDao extensionsDao = this.geoPackage.getExtensionDao();
  //
  // 		try {
  // 			if (griddedTileDao.isTableExists()) {
  // 				griddedTileDao.delete(table);
  // 			}
  // 			if (griddedCoverageDao.isTableExists()) {
  // 				griddedCoverageDao.delete(table);
  // 			}
  // 			if (extensionsDao.isTableExists()) {
  // 				extensionsDao.deleteByExtension(
  // 						CoverageDataCore.EXTENSION_NAME, table);
  // 			}
  // 		} catch (e) {
  // 			throw new GeoPackageException(
  // 					"Failed to delete Table Index. GeoPackage: "
  // 							+ this.geoPackage.getName() + ", Table: " + table,
  // 					e);
  // 		}
  // 	}
  //
  // }
  //
  // /**
  //  * Delete the Gridded Coverage extension
  //  */
  // public void deleteGriddedCoverageExtension() {
  //
  // 	List<String> coverageTables = geoPackage
  // 			.getTables(CoverageDataCore.GRIDDED_COVERAGE);
  // 	for (table: string : coverageTables) {
  // 		geoPackage.deleteTable(table);
  // 	}
  //
  // 	GriddedTileDao griddedTileDao = CoverageDataCore
  // 			.getGriddedTileDao(geoPackage);
  // 	GriddedCoverageDao griddedCoverageDao = CoverageDataCore
  // 			.getGriddedCoverageDao(geoPackage);
  // 	ExtensionsDao extensionsDao = this.geoPackage.getExtensionDao();
  //
  // 	try {
  // 		if (griddedTileDao.isTableExists()) {
  // 			geoPackage.dropTable(griddedTileDao.getTableName());
  // 		}
  // 		if (griddedCoverageDao.isTableExists()) {
  // 			geoPackage.dropTable(griddedCoverageDao.getTableName());
  // 		}
  // 		if (extensionsDao.isTableExists()) {
  // 			extensionsDao
  // 					.deleteByExtension(CoverageDataCore.EXTENSION_NAME);
  // 		}
  // 	} catch (e) {
  // 		throw new GeoPackageException(
  // 				"Failed to delete Gridded Coverage extension and tables. GeoPackage: "
  // 						+ this.geoPackage.getName(),
  // 				e);
  // 	}
  //
  // }
  //
  // /**
  //  * Copy the Gridded Coverage extensions for the table
  //  *
  //  * @param table
  //  *            table name
  //  * @param newTable
  //  *            new table name
  //  */
  // public void copyGriddedCoverage(table: string, newTable: string) {
  //
  // 	try {
  //
  // 		if (geoPackage.isTableType(table,
  // 				CoverageDataCore.GRIDDED_COVERAGE)) {
  //
  // 			ExtensionsDao extensionsDao = this.geoPackage.getExtensionDao();
  //
  // 			if (extensionsDao.isTableExists()) {
  //
  // 				List<Extensions> extensions = extensionsDao
  // 						.queryByExtension(CoverageDataCore.EXTENSION_NAME,
  // 								table);
  //
  // 				if (!extensions.isEmpty()) {
  //
  // 					Extensions extension = extensions.get(0);
  // 					extension.setTableName(newTable);
  // 					extensionsDao.create(extension);
  //
  // 					GriddedCoverageDao griddedCoverageDao = CoverageDataCore
  // 							.getGriddedCoverageDao(geoPackage);
  // 					if (griddedCoverageDao.isTableExists()) {
  //
  // 						CoreSQLUtils.transferTableContent(
  // 								geoPackage.getDatabase(),
  // 								GriddedCoverage.TABLE_NAME,
  // 								GriddedCoverage.COLUMN_TILE_MATRIX_SET_NAME,
  // 								newTable, table, GriddedCoverage.COLUMN_ID);
  //
  // 					}
  //
  // 					GriddedTileDao griddedTileDao = CoverageDataCore
  // 							.getGriddedTileDao(geoPackage);
  // 					if (griddedTileDao.isTableExists()) {
  //
  // 						CoreSQLUtils.transferTableContent(
  // 								geoPackage.getDatabase(),
  // 								GriddedTile.TABLE_NAME,
  // 								GriddedTile.COLUMN_TABLE_NAME, newTable,
  // 								table, GriddedTile.COLUMN_ID);
  //
  // 					}
  // 				}
  // 			}
  // 		}
  //
  // 	} catch (Exception e) {
  // 		logger.log(Level.WARNING,
  // 				"Failed to create Gridded Coverage for table: " + newTable
  // 						+ ", copied from table: " + table,
  // 				e);
  // 	}
  //
  // }

  /**
   * Delete the Schema extensions for the table
   *
   * @param table
   *            table name
   */
  public deleteSchema(table: string): void {
    const dataColumnsDao = this.geoPackage.getDataColumnsDao();
    try {
      if (dataColumnsDao.isTableExists()) {
        dataColumnsDao.deleteByTableName(table);
      }
    } catch (e) {
      throw new GeoPackageException(
        'Failed to delete Schema extension. GeoPackage: ' + this.geoPackage.getName() + ', Table: ' + table,
      );
    }
  }

  /**
   * Delete the Schema extension
   */
  public deleteSchemaExtension(): void {
    const schemaExtension = new SchemaExtension(this.geoPackage);
    if (schemaExtension.has()) {
      schemaExtension.removeExtension();
    }
  }

  /**
   * Copy the Schema extensions for the table
   *
   * @param table
   *            table name
   * @param newTable
   *            new table name
   */
  public copySchema(table: string, newTable: string): void {
    try {
      if (this.geoPackage.isTable(DataColumns.TABLE_NAME)) {
        const dataColumnsTable = UserCustomTableReader.readUserCustomTable(
          this.geoPackage.getConnection(),
          DataColumns.TABLE_NAME,
        );
        const nameColumn = dataColumnsTable.getColumn(DataColumns.COLUMN_NAME);
        if (nameColumn.hasConstraints()) {
          nameColumn.clearConstraints();
          if (dataColumnsTable.hasConstraints()) {
            dataColumnsTable.clearConstraints();
            const constraintSql = GeoPackageTableCreator.sqlScripts.data_columns[0];
            const constraints = ConstraintParser.getConstraints(constraintSql);
            dataColumnsTable.addConstraintsWithConstraints(constraints.getTableConstraints());
          }
          AlterTable.alterColumnForTable(this.geoPackage.getConnection(), dataColumnsTable, nameColumn);
        }
        SQLUtils.transferTableContent(
          this.geoPackage.getConnection(),
          DataColumns.TABLE_NAME,
          DataColumns.COLUMN_TABLE_NAME,
          newTable,
          table,
        );
      }
    } catch (e) {
      console.warn('Failed to create Schema for table: ' + newTable + ', copied from table: ' + table);
    }
  }

  /**
   * Delete the Metadata extensions for the table
   *
   * @param table table name
   */
  public deleteMetadata(table: string): void {
    const metadataReferenceDao = this.geoPackage.getMetadataReferenceDao();
    try {
      if (metadataReferenceDao.isTableExists()) {
        metadataReferenceDao.deleteByTableName(table);
      }
    } catch (e) {
      throw new GeoPackageException(
        'Failed to delete Metadata extension. GeoPackage: ' + this.geoPackage.getName() + ', Table: ' + table,
      );
    }
  }

  /**
   * Delete the Metadata extension
   */
  public deleteMetadataExtension(): void {
    const metadataExtension = new MetadataExtension(this.geoPackage);
    if (metadataExtension.has()) {
      metadataExtension.removeExtension();
    }
  }

  /**
   * Copy the Metadata extensions for the table
   * @param table table name
   * @param newTable new table name
   */
  public copyMetadata(table: string, newTable: string): void {
    try {
      if (this.geoPackage.isTable(MetadataReference.TABLE_NAME)) {
        SQLUtils.transferTableContent(
          this.geoPackage.getConnection(),
          MetadataReference.TABLE_NAME,
          MetadataReference.COLUMN_TABLE_NAME,
          newTable,
          table,
        );
      }
    } catch (e) {
      console.warn('Failed to create Metadata for table: ' + newTable + ', copied from table: ' + table);
    }
  }

  /**
   * Delete the WKT for Coordinate Reference Systems extension
   */
  public deleteCrsWktExtension(): void {
    const crsWktExtension = new CrsWktExtension(this.geoPackage);
    if (crsWktExtension.has()) {
      crsWktExtension.removeExtension();
    }
  }

  /**
   * Delete the Properties extension if the deleted table is the properties
   * table
   *
   * @param table table name
   */
  public deleteProperties(table: string): void {
    if (table.toUpperCase() === PropertiesExtension.TABLE_NAME.toUpperCase()) {
      this.deletePropertiesExtension();
    }
  }

  /**
   * Delete the properties extension from the GeoPackage
   */
  public deletePropertiesExtension(): void {
    this.getPropertiesExtension().removeExtension();
  }

  /**
   * Get a Properties Extension used only for deletions
   *
   * @return Feature Style Extension
   */
  private getPropertiesExtension(): PropertiesExtension {
    return new PropertiesExtension(this.geoPackage);
  }
}

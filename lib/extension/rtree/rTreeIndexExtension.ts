import { BaseExtension } from '../baseExtension';
import { Extensions } from '../extensions';
import { GeoPackageGeometryData } from '../../geom/geoPackageGeometryData';
import { FeatureTable } from '../../features/user/featureTable';
import { GeoPackageException } from '../../geoPackageException';
import { ExtensionScopeType } from '../extensionScopeType';
import { GeoPackageConnection } from '../../db/geoPackageConnection';
import { FeatureDao } from '../../features/user/featureDao';
import { RTreeIndexTableDao } from './rTreeIndexTableDao';
import { UserCustomDao } from '../../user/custom/userCustomDao';
import { GeometryFunction } from './geometryFunction';
import { GeometryEnvelope } from '@ngageoint/simple-features-js';
import { UserCustomColumn } from '../../user/custom/userCustomColumn';
import { UserCustomTable } from '../../user/custom/userCustomTable';
import { GeoPackageDataType } from '../../db/geoPackageDataType';
import { RTreeIndexExtensionConstants } from './rTreeIndexExtensionConstants';
import type { GeoPackage } from '../../geoPackage';
import { GeoPackageConstants } from '../../geoPackageConstants';

/**
 * RTreeIndex extension
 */
export class RTreeIndexExtension extends BaseExtension {
  /**
   * Extension name
   */
  public static readonly EXTENSION_NAME =
    GeoPackageConstants.EXTENSION_AUTHOR + Extensions.EXTENSION_NAME_DIVIDER + RTreeIndexExtensionConstants.NAME;

  /**
   * Extension definition URL
   */
  public static readonly DEFINITION = 'http://www.geopackage.org/spec/#extension_rtree';

  /**
   * Connection
   */
  protected connection: GeoPackageConnection = null;

  private sqlScripts = {
    rtree_create: 'CREATE VIRTUAL TABLE "rtree_<t>_<c>" USING rtree(id, minx, maxx, miny, maxy)',
    rtree_drop: 'DROP TABLE "rtree_<t>_<c>"',
    rtree_drop_force:
      'DROP TABLE IF EXISTS "rtree_<t>_<c>_node"\n' +
      '\n' +
      'DROP TABLE IF EXISTS "rtree_<t>_<c>_parent"\n' +
      '\n' +
      'DROP TABLE IF EXISTS "rtree_<t>_<c>_rowid"\n' +
      '\n' +
      'PRAGMA writable_schema = ON\n' +
      '\n' +
      'DELETE FROM sqlite_master WHERE type = "table" AND name = "rtree_<t>_<c>"\n' +
      '\n' +
      'PRAGMA writable_schema = OFF',
    rtree_load:
      'INSERT OR REPLACE INTO "rtree_<t>_<c>"\n' +
      '  SELECT "<i>", ST_MinX("<c>"), ST_MaxX("<c>"), ST_MinY("<c>"), ST_MaxY("<c>") FROM "<t>" WHERE "<c>" NOT NULL AND NOT ST_IsEmpty("<c>");',
    rtree_trigger_delete:
      'CREATE TRIGGER "rtree_<t>_<c>_delete" AFTER DELETE ON "<t>"\n' +
      '  WHEN old."<c>" NOT NULL\n' +
      'BEGIN\n' +
      '  DELETE FROM "rtree_<t>_<c>" WHERE id = OLD."<i>";\n' +
      'END;',
    rtree_trigger_drop: 'DROP TRIGGER IF EXISTS "rtree_<t>_<c>_<n>"',
    rtree_trigger_insert:
      'CREATE TRIGGER "rtree_<t>_<c>_insert" AFTER INSERT ON "<t>"\n' +
      '  WHEN (new."<c>" NOT NULL AND NOT ST_IsEmpty(NEW."<c>"))\n' +
      'BEGIN\n' +
      '  INSERT OR REPLACE INTO "rtree_<t>_<c>" VALUES (\n' +
      '    NEW."<i>",\n' +
      '    ST_MinX(NEW."<c>"), ST_MaxX(NEW."<c>"),\n' +
      '    ST_MinY(NEW."<c>"), ST_MaxY(NEW."<c>")\n' +
      '  );\n' +
      'END;',
    rtree_trigger_update1:
      'CREATE TRIGGER "rtree_<t>_<c>_update1" AFTER UPDATE OF "<c>" ON "<t>"\n' +
      '  WHEN OLD."<i>" = NEW."<i>" AND\n' +
      '       (NEW."<c>" NOTNULL AND NOT ST_IsEmpty(NEW."<c>"))\n' +
      'BEGIN\n' +
      '  INSERT OR REPLACE INTO "rtree_<t>_<c>" VALUES (\n' +
      '    NEW."<i>",\n' +
      '    ST_MinX(NEW."<c>"), ST_MaxX(NEW."<c>"),\n' +
      '    ST_MinY(NEW."<c>"), ST_MaxY(NEW."<c>")\n' +
      '  );\n' +
      'END;',
    rtree_trigger_update2:
      'CREATE TRIGGER "rtree_<t>_<c>_update2" AFTER UPDATE OF "<c>" ON "<t>"\n' +
      '  WHEN OLD."<i>" = NEW."<i>" AND\n' +
      '       (NEW."<c>" ISNULL OR ST_IsEmpty(NEW."<c>"))\n' +
      'BEGIN\n' +
      '  DELETE FROM "rtree_<t>_<c>" WHERE id = OLD."<i>";\n' +
      'END;',
    rtree_trigger_update3:
      'CREATE TRIGGER "rtree_<t>_<c>_update3" AFTER UPDATE ON "<t>"\n' +
      '  WHEN OLD."<i>" != NEW."<i>" AND\n' +
      '       (NEW."<c>" NOTNULL AND NOT ST_IsEmpty(NEW."<c>"))\n' +
      'BEGIN\n' +
      '  DELETE FROM "rtree_<t>_<c>" WHERE id = OLD."<i>";\n' +
      '  INSERT OR REPLACE INTO "rtree_<t>_<c>" VALUES (\n' +
      '    NEW."<i>",\n' +
      '    ST_MinX(NEW."<c>"), ST_MaxX(NEW."<c>"),\n' +
      '    ST_MinY(NEW."<c>"), ST_MaxY(NEW."<c>")\n' +
      '  );\n' +
      'END;',
    rtree_trigger_update4:
      'CREATE TRIGGER "rtree_<t>_<c>_update4" AFTER UPDATE ON "<t>"\n' +
      '  WHEN OLD."<i>" != NEW."<i>" AND\n' +
      '       (NEW."<c>" ISNULL OR ST_IsEmpty(NEW."<c>"))\n' +
      'BEGIN\n' +
      '  DELETE FROM "rtree_<t>_<c>" WHERE id IN (OLD."<i>", NEW."<i>");\n' +
      'END;',
  };

  /**
   * Constructor
   * @param geoPackage GeoPackage
   */
  constructor(geoPackage: GeoPackage) {
    super(geoPackage);
    this.connection = geoPackage.getDatabase();
  }

  /**
   * Get or create the extension
   * @param featureTable feature table
   * @return extension
   */
  public getOrCreateWithFeatureTable(featureTable: FeatureTable): Extensions {
    return this.getOrCreate(featureTable.getTableName(), featureTable.getGeometryColumnName());
  }

  /**
   * Get or create the extension
   * @param tableName table name
   * @param columnName column name
   * @return extension
   */
  public getOrCreate(tableName: string, columnName: string): Extensions {
    return super.getOrCreate(
      RTreeIndexExtension.EXTENSION_NAME,
      tableName,
      columnName,
      RTreeIndexExtension.DEFINITION,
      ExtensionScopeType.WRITE_ONLY,
    );
  }

  /**
   * Determine if the GeoPackage feature table has the extension feature table
   * @return true if has extension
   */
  public hasExtensionWithFeatureTable(featureTable: FeatureTable): boolean {
    return this.hasExtensionWithTableAndColumn(featureTable.getTableName(), featureTable.getGeometryColumnName());
  }

  /**
   * Determine if the GeoPackage table and column has the extension
   * @param tableName table name
   * @param columnName column name
   * @return true if has extension
   */
  public hasExtensionWithTableAndColumn(tableName: string, columnName: string): boolean {
    return (
      super.hasExtension(RTreeIndexExtension.EXTENSION_NAME, tableName, columnName) &&
      this.connection.tableOrViewExists(this.getRTreeTableName(tableName, columnName))
    );
  }

  /**
   * Determine if the GeoPackage table has the extension
   *
   * @param tableName table name
   * @return true if has extension
   */
  public hasExtensionWithTable(tableName: string): boolean {
    return super.hasExtension(RTreeIndexExtension.EXTENSION_NAME, tableName, undefined);
  }

  /**
   * Determine if the GeoPackage has the extension for any table
   *
   * @return true if has extension
   */
  public has(): boolean {
    return super.hasExtensions(RTreeIndexExtension.EXTENSION_NAME);
  }

  /**
   * Check if the feature table has the RTree extension and create the
   * functions if needed
   *
   * @param featureTable feature table
   * @return true if has extension and functions created
   */
  public createFunctionsWithFeatureTable(featureTable: FeatureTable): boolean {
    return this.createFunctionsWithTableAndColumn(featureTable.getTableName(), featureTable.getGeometryColumnName());
  }

  /**
   * Check if the table and column has the RTree extension and create the
   * functions if needed
   *
   * @param tableName table name
   * @param columnName column name
   * @return true if has extension and functions created
   */
  public createFunctionsWithTableAndColumn(tableName: string, columnName: string): boolean {
    const created = this.hasExtensionWithTableAndColumn(tableName, columnName);
    if (created) {
      this.createAllFunctions();
    }
    return created;
  }

  /**
   * Check if the GeoPackage has the RTree extension and create the functions
   * if needed
   *
   * @return true if has extension and functions created
   */
  public createFunctions(): boolean {
    const created = this.has();
    if (created) {
      this.createAllFunctions();
    }
    return created;
  }

  /**
   * Create the RTree Index extension for the feature table. Creates the SQL
   * functions, loads the tree, and creates the triggers.
   *
   * @param featureTable feature table
   * @return extension
   */
  public createWithFeatureTable(featureTable: FeatureTable): Extensions {
    return this.create(
      featureTable.getTableName(),
      featureTable.getGeometryColumnName(),
      featureTable.getPkColumnName(),
    );
  }

  /**
   * Create the RTree Index extension for the feature table, geometry column, and id column. Creates the SQL functions, loads the tree, and creates the
   * triggers.
   *
   * @param tableName table name
   * @param geometryColumnName geometry column name
   * @param idColumnName id column name
   * @return extension
   */
  public create(tableName: string, geometryColumnName: string, idColumnName: string): Extensions {
    const extension = this.getOrCreate(tableName, geometryColumnName);
    this.createAllFunctions();
    this.createRTreeIndex(tableName, geometryColumnName, idColumnName);
    this.loadRTreeIndex(tableName, geometryColumnName, idColumnName);
    this.createAllTriggers(tableName, geometryColumnName, idColumnName);
    return extension;
  }

  /**
   * Create the RTree Index Virtual Table
   *
   * @param featureTable feature table
   */
  public createRTreeIndexWithFeatureTable(featureTable: FeatureTable): void {
    this.createRTreeIndex(
      featureTable.getTableName(),
      featureTable.getGeometryColumnName(),
      featureTable.getPkColumnName(),
    );
  }

  /**
   * Create the RTree Index Virtual Table
   *
   * @param tableName table name
   * @param geometryColumnName geometry column name
   * @param idColumn id column name
   */
  public createRTreeIndex(tableName: string, geometryColumnName: string, idColumn?: string): void {
    const sqlName = 'rtree_create';
    this.executeSQL(sqlName, tableName, geometryColumnName, idColumn);
  }

  /**
   * Create all connection SQL Functions for min x, max x, min y, max y, and
   * is empty
   */
  public createAllFunctions(): void {
    this.createMinXFunction();
    this.createMaxXFunction();
    this.createMinYFunction();
    this.createMaxYFunction();
    this.createIsEmptyFunction();
  }

  /**
   * Get a RTree Index Table DAO for the feature dao
   *
   * @param featureDao
   *            feature DAO
   * @return RTree Index Table DAO
   */
  public getTableDao(featureDao: FeatureDao): RTreeIndexTableDao {
    const userCustomTable = this.getRTreeTable(featureDao.getTable());
    const userCustomDao = new UserCustomDao(this.geoPackage.getName(), this.geoPackage, userCustomTable);

    return new RTreeIndexTableDao(this, userCustomDao, featureDao);
  }

  /**
   * Get or build a geometry envelope from the Geometry Data
   * @param data geometry data
   * @return geometry envelope
   */
  public static getEnvelope(data: GeoPackageGeometryData): GeometryEnvelope {
    let envelope = null;
    if (data != null) {
      envelope = data.getOrBuildEnvelope();
    }
    return envelope;
  }

  /**
   * {@inheritDoc}
   */
  public createMinXFunction(): void {
    this.createFunction(
      new GeometryFunction(RTreeIndexExtensionConstants.MIN_X_FUNCTION, (data: GeoPackageGeometryData) => {
        let value = null;
        const envelope = RTreeIndexExtension.getEnvelope(data);
        if (envelope != null) {
          value = envelope.minX;
        }
        return value;
      }),
    );
  }

  /**
   * {@inheritDoc}
   */
  public createMaxXFunction(): void {
    this.createFunction(
      new GeometryFunction(RTreeIndexExtensionConstants.MAX_X_FUNCTION, (data: GeoPackageGeometryData) => {
        let value = null;
        const envelope = RTreeIndexExtension.getEnvelope(data);
        if (envelope != null) {
          value = envelope.maxX;
        }
        return value;
      }),
    );
  }

  /**
   * {@inheritDoc}
   */
  public createMinYFunction(): void {
    this.createFunction(
      new GeometryFunction(RTreeIndexExtensionConstants.MIN_Y_FUNCTION, (data: GeoPackageGeometryData) => {
        let value = null;
        const envelope = RTreeIndexExtension.getEnvelope(data);
        if (envelope != null) {
          value = envelope.minY;
        }
        return value;
      }),
    );
  }

  /**
   * {@inheritDoc}
   */
  public createMaxYFunction(): void {
    this.createFunction(
      new GeometryFunction(RTreeIndexExtensionConstants.MAX_Y_FUNCTION, (data: GeoPackageGeometryData) => {
        let value = null;
        const envelope = RTreeIndexExtension.getEnvelope(data);
        if (envelope != null) {
          value = envelope.maxY;
        }
        return value;
      }),
    );
  }

  /**
   * {@inheritDoc}
   */
  public createIsEmptyFunction(): void {
    this.createFunction(
      new GeometryFunction(RTreeIndexExtensionConstants.IS_EMPTY_FUNCTION, (data: GeoPackageGeometryData) => {
        let value = null;
        if (data != null) {
          if (data.isEmpty() || data.getGeometry() == null) {
            value = 1;
          } else {
            value = 0;
          }
        }
        return value;
      }),
    );
  }

  /**
   * Create the function for the connection
   * @param function geometry function
   */
  private createFunction(geometryFunction: GeometryFunction): void {
    this.geoPackage.getConnection().registerFunction(geometryFunction.getName(), geometryFunction.getFunction());
  }

  /**
   * Load the RTree Spatial Index Values
   *
   * @param featureTable feature table
   */
  public loadRTreeIndexWithFeatureTable(featureTable: FeatureTable): void {
    this.loadRTreeIndex(
      featureTable.getTableName(),
      featureTable.getGeometryColumnName(),
      featureTable.getPkColumnName(),
    );
  }

  /**
   * Load the RTree Spatial Index Values
   * @param tableName table name
   * @param geometryColumnName geometry column name
   * @param idColumnName id column name
   */
  public loadRTreeIndex(tableName: string, geometryColumnName: string, idColumnName: string): void {
    const sqlName = 'rtree_load';
    this.executeSQL(sqlName, tableName, geometryColumnName, idColumnName);
  }

  /**
   * Create Triggers to Maintain Spatial Index Values
   *
   * @param featureTable feature table
   */
  public createAllTriggersWithFeatureTable(featureTable: FeatureTable): void {
    this.createAllTriggers(
      featureTable.getTableName(),
      featureTable.getGeometryColumnName(),
      featureTable.getPkColumnName(),
    );
  }

  /**
   * Create Triggers to Maintain Spatial Index Values
   *
   * @param tableName table name
   * @param geometryColumnName geometry column name
   * @param idColumnName id column name
   */
  public createAllTriggers(tableName: string, geometryColumnName: string, idColumnName: string): void {
    this.createInsertTrigger(tableName, geometryColumnName, idColumnName);
    this.createUpdate1Trigger(tableName, geometryColumnName, idColumnName);
    this.createUpdate2Trigger(tableName, geometryColumnName, idColumnName);
    this.createUpdate3Trigger(tableName, geometryColumnName, idColumnName);
    this.createUpdate4Trigger(tableName, geometryColumnName, idColumnName);
    this.createDeleteTrigger(tableName, geometryColumnName, idColumnName);
  }

  /**
   * Create insert trigger
   *
   * <pre>
   * Conditions: Insertion of non-empty geometry
   * Actions   : Insert record into rtree
   * </pre>
   *
   * @param tableName table name
   * @param geometryColumnName geometry column name
   * @param idColumnName id column name
   */
  public createInsertTrigger(tableName: string, geometryColumnName: string, idColumnName: string): void {
    const sqlName = 'rtree_trigger_insert';
    this.executeSQL(sqlName, tableName, geometryColumnName, idColumnName);
  }

  /**
   * Create update 1 trigger
   *
   * <pre>
   * Conditions: Update of geometry column to non-empty geometry No row ID change
   * Actions   : Update record in rtree
   * </pre>
   *
   * @param tableName table name
   * @param geometryColumnName geometry column name
   * @param idColumnName id column name
   */
  public createUpdate1Trigger(tableName: string, geometryColumnName: string, idColumnName: string): void {
    const sqlName = 'rtree_trigger_update1';
    this.executeSQL(sqlName, tableName, geometryColumnName, idColumnName);
  }

  /**
   * Create update 2 trigger
   *
   * <pre>
   * Conditions: Update of geometry column to empty geometry No row ID change
   * Actions   : Remove record from rtree
   * </pre>
   *
   * @param tableName table name
   * @param geometryColumnName geometry column name
   * @param idColumnName id column name
   */
  public createUpdate2Trigger(tableName: string, geometryColumnName: string, idColumnName: string): void {
    const sqlName = 'rtree_trigger_update2';
    this.executeSQL(sqlName, tableName, geometryColumnName, idColumnName);
  }

  /**
   * Create update 3 trigger
   *
   * <pre>
   * Conditions: Update of any column Row ID change Non-empty geometry
   * Actions   : Remove record from rtree for old {@literal <i>}
   *             Insert record into rtree for new {@literal <i>}
   * </pre>
   *
   * @param tableName table name
   * @param geometryColumnName geometry column name
   * @param idColumnName id column name
   */
  public createUpdate3Trigger(tableName: string, geometryColumnName: string, idColumnName: string): void {
    const sqlName = 'rtree_trigger_update3';
    this.executeSQL(sqlName, tableName, geometryColumnName, idColumnName);
  }

  /**
   * Create update 4 trigger
   *
   * <pre>
   * Conditions: Update of any column Row ID change Empty geometry
   * Actions   : Remove record from rtree for old and new {@literal <i>}
   * </pre>
   *
   * @param tableName table name
   * @param geometryColumnName geometry column name
   * @param idColumnName id column name
   */
  public createUpdate4Trigger(tableName: string, geometryColumnName: string, idColumnName: string): void {
    const sqlName = 'rtree_trigger_update4';
    this.executeSQL(sqlName, tableName, geometryColumnName, idColumnName);
  }

  /**
   * Create delete trigger
   *
   * <pre>
   * Conditions: Row deleted
   * Actions   : Remove record from rtree for old {@literal <i>}
   * </pre>
   *
   * @param tableName table name
   * @param geometryColumnName geometry column name
   * @param idColumnName id column name
   */
  public createDeleteTrigger(tableName: string, geometryColumnName: string, idColumnName: string): void {
    const sqlName = 'rtree_trigger_delete';
    this.executeSQL(sqlName, tableName, geometryColumnName, idColumnName);
  }

  /**
   * Delete the RTree Index extension for the feature table. Drops the
   * triggers, RTree table, and deletes the extension.
   *
   * @param featureTable feature table
   */
  public deleteWithFeatureTable(featureTable: FeatureTable): void {
    this.deleteWithTableAndGeometryColumn(featureTable.getTableName(), featureTable.getGeometryColumnName());
  }

  /**
   * Delete the RTree Index extension for the table and geometry column. Drops
   * the triggers, RTree table, and deletes the extension.
   *
   * @param tableName table name
   * @param geometryColumnName geometry column name
   */
  public deleteWithTableAndGeometryColumn(tableName: string, geometryColumnName: string): void {
    if (this.hasExtensionWithTableAndColumn(tableName, geometryColumnName)) {
      this.drop(tableName, geometryColumnName);
      try {
        this.extensionsDao.deleteByExtensionAndTableNameAndColumnName(
          RTreeIndexExtension.EXTENSION_NAME,
          tableName,
          geometryColumnName,
        );
      } catch (e) {
        throw new GeoPackageException(
          'Failed to delete RTree Index extension. GeoPackage: ' +
            this.geoPackage.getName() +
            ', Table: ' +
            tableName +
            ', Geometry Column: ' +
            geometryColumnName,
        );
      }
    }
  }

  /**
   * Delete all RTree Index extensions for the table. Drops the triggers, RTree tables, and deletes the extensions.
   * @param tableName table name
   */
  public deleteWithTableName(tableName: string): void {
    try {
      if (this.extensionsDao.isTableExists()) {
        const extensions = this.extensionsDao.queryByExtensionAndTableName(
          RTreeIndexExtension.EXTENSION_NAME,
          tableName,
        );
        for (const extension of extensions) {
          this.deleteWithTableAndGeometryColumn(extension.getTableName(), extension.getColumnName());
        }
      }
    } catch (e) {
      throw new GeoPackageException(
        'Failed to delete RTree Index extensions for table. GeoPackage: ' +
          this.geoPackage.getName() +
          ', Table: ' +
          tableName,
      );
    }
  }

  /**
   * Delete all RTree Index extensions. Drops the triggers, RTree tables, and
   * deletes the extensions.
   *
   */
  public deleteAll(): void {
    try {
      if (this.extensionsDao.isTableExists()) {
        const extensions = this.extensionsDao.queryAllByExtension(RTreeIndexExtension.EXTENSION_NAME);
        for (const extension of extensions) {
          this.deleteWithTableAndGeometryColumn(extension.getTableName(), extension.getColumnName());
        }
      }
    } catch (e) {
      throw new GeoPackageException(
        'Failed to delete all RTree Index extensions. GeoPackage: ' + this.geoPackage.getName(),
      );
    }
  }

  /**
   * Drop the the triggers and RTree table for the feature table
   *
   * @param featureTable feature table
   */
  public dropWithFeatureTable(featureTable: FeatureTable): void {
    this.drop(featureTable.getTableName(), featureTable.getGeometryColumnName());
  }

  /**
   * Drop the the triggers and RTree table for the table and geometry column
   *
   * @param tableName table name
   * @param geometryColumnName geometry column name
   */
  public drop(tableName: string, geometryColumnName: string): void {
    this.dropAllTriggers(tableName, geometryColumnName);
    this.dropRTreeIndex(tableName, geometryColumnName);
  }

  /**
   * Drop the RTree Index Virtual Table
   *
   * @param featureTable feature table
   */
  public dropRTreeIndexWithFeatureTable(featureTable: FeatureTable): void {
    this.dropRTreeIndex(featureTable.getTableName(), featureTable.getGeometryColumnName());
  }

  /**
   * Drop the RTree Index Virtual Table
   *
   * @param tableName table name
   * @param geometryColumnName geometry column name
   */
  public dropRTreeIndex(tableName: string, geometryColumnName: string): void {
    let sqlName = 'rtree_trigger_drop';
    try {
      this.executeSQL(sqlName, tableName, geometryColumnName);
    } catch (e) {
      sqlName = 'rtree_drop_force';
      this.executeSQL(sqlName, tableName, geometryColumnName);
    }
  }

  /**
   * Check if the feature table has the RTree extension and if found, drop the
   * triggers
   *
   * @param featureTable feature table
   */
  public dropTriggersWithFeatureTable(featureTable: FeatureTable): void {
    this.dropTriggers(featureTable.getTableName(), featureTable.getGeometryColumnName());
  }

  /**
   * Check if the table and column has the RTree extension and if found, drop
   * the triggers
   *
   * @param tableName table name
   * @param columnName column name
   * @return true if dropped
   */
  public dropTriggers(tableName: string, columnName: string): boolean {
    const dropped = this.hasExtensionWithTableAndColumn(tableName, columnName);
    if (dropped) {
      this.dropAllTriggers(tableName, columnName);
    }
    return dropped;
  }

  /**
   * Drop Triggers that Maintain Spatial Index Values
   *
   * @param featureTable feature table
   */
  public dropAllTriggersWithFeatureTable(featureTable: FeatureTable): void {
    this.dropAllTriggers(featureTable.getTableName(), featureTable.getGeometryColumnName());
  }

  /**
   * Drop Triggers that Maintain Spatial Index Values
   *
   * @param tableName table name
   * @param geometryColumnName geometry column name
   */
  public dropAllTriggers(tableName: string, geometryColumnName: string): void {
    this.dropInsertTrigger(tableName, geometryColumnName);
    this.dropUpdate1Trigger(tableName, geometryColumnName);
    this.dropUpdate2Trigger(tableName, geometryColumnName);
    this.dropUpdate3Trigger(tableName, geometryColumnName);
    this.dropUpdate4Trigger(tableName, geometryColumnName);
    this.dropDeleteTrigger(tableName, geometryColumnName);
  }

  /**
   * Drop insert trigger
   *
   * @param tableName table name
   * @param geometryColumnName geometry column name
   */
  public dropInsertTrigger(tableName: string, geometryColumnName: string): void {
    this.dropTrigger(tableName, geometryColumnName, RTreeIndexExtensionConstants.TRIGGER_INSERT_NAME);
  }

  /**
   * Drop update 1 trigger
   *
   * @param tableName table name
   * @param geometryColumnName geometry column name
   */
  public dropUpdate1Trigger(tableName: string, geometryColumnName: string): void {
    this.dropTrigger(tableName, geometryColumnName, RTreeIndexExtensionConstants.TRIGGER_UPDATE1_NAME);
  }

  /**
   * Drop update 2 trigger
   *
   * @param tableName table name
   * @param geometryColumnName geometry column name
   */
  public dropUpdate2Trigger(tableName: string, geometryColumnName: string): void {
    this.dropTrigger(tableName, geometryColumnName, RTreeIndexExtensionConstants.TRIGGER_UPDATE2_NAME);
  }

  /**
   * Drop update 3 trigger
   *
   * @param tableName table name
   * @param geometryColumnName geometry column name
   */
  public dropUpdate3Trigger(tableName: string, geometryColumnName: string): void {
    this.dropTrigger(tableName, geometryColumnName, RTreeIndexExtensionConstants.TRIGGER_UPDATE3_NAME);
  }

  /**
   * Drop update 4 trigger
   *
   * @param tableName table name
   * @param geometryColumnName geometry column name
   */
  public dropUpdate4Trigger(tableName: string, geometryColumnName: string): void {
    this.dropTrigger(tableName, geometryColumnName, RTreeIndexExtensionConstants.TRIGGER_UPDATE4_NAME);
  }

  /**
   * Drop delete trigger
   *
   * @param tableName table name
   * @param geometryColumnName geometry column name
   */
  public dropDeleteTrigger(tableName: string, geometryColumnName: string): void {
    this.dropTrigger(tableName, geometryColumnName, RTreeIndexExtensionConstants.TRIGGER_DELETE_NAME);
  }

  /**
   * Drop the trigger for the table, geometry column, and trigger name
   *
   * @param tableName table name
   * @param geometryColumnName geometry column name
   * @param triggerName trigger name
   */
  public dropTrigger(tableName: string, geometryColumnName: string, triggerName: string): void {
    const sqlName = 'rtree_trigger_drop';
    this.executeSQL(sqlName, tableName, geometryColumnName, null, triggerName);
  }

  /**
   * Execute the SQL for the SQL file name while substituting values for the
   * table, geometry column, id column, and trigger name
   *
   * @param sqlName sql file name
   * @param tableName table name
   * @param geometryColumnName geometry column name
   * @param idColumnName id column name
   * @param triggerName trigger name
   */
  private executeSQL(
    sqlName: string,
    tableName: string,
    geometryColumnName: string,
    idColumnName?: string,
    triggerName?: string,
  ): void {
    const statement = this.sqlScripts[sqlName];
    const sql = this.substituteSqlArguments(statement, tableName, geometryColumnName, idColumnName, triggerName);
    this._executeSQL(sql);
  }

  /**
   * Execute the SQL statement
   * @param sql SQL statement
   */
  protected _executeSQL(sql: string): void {
    this.connection.run(sql);
  }

  /**
   * Replace the SQL arguments for the table, geometry column, id column, and
   * trigger name
   *
   * @param sql sql to substitute
   * @param tableName table name
   * @param geometryColumnName geometry column name
   * @param idColumnName id column name
   * @param triggerName trigger name
   * @return substituted sql
   */
  private substituteSqlArguments(
    sql: string,
    tableName: string,
    geometryColumnName: string,
    idColumnName: string,
    triggerName: string,
  ): string {
    let substituted = sql.slice();
    substituted = substituted.replace(new RegExp(RTreeIndexExtensionConstants.TABLE_SUBSTITUTE, 'gm'), tableName);
    substituted = substituted.replace(
      new RegExp(RTreeIndexExtensionConstants.GEOMETRY_COLUMN_SUBSTITUTE, 'gm'),
      geometryColumnName,
    );
    if (idColumnName != null) {
      substituted = substituted.replace(
        new RegExp(RTreeIndexExtensionConstants.PK_COLUMN_SUBSTITUTE, 'gm'),
        idColumnName,
      );
    }
    if (triggerName != null) {
      substituted = substituted.replace(new RegExp(RTreeIndexExtensionConstants.TRIGGER_SUBSTITUTE, 'gm'), triggerName);
    }
    return substituted;
  }

  /**
   * Get the RTree Table name for the feature table and geometry column
   *
   * @param tableName feature table name
   * @param geometryColumnName geometry column name
   * @return RTree table name
   */
  private getRTreeTableName(tableName: string, geometryColumnName: string): string {
    return this.substituteSqlArguments('rtree_<t>_<c>', tableName, geometryColumnName, null, null);
  }

  /**
   * Get the RTree Table
   *
   * @param featureTable feature table
   * @return RTree table
   */
  protected getRTreeTable(featureTable: FeatureTable): UserCustomTable {
    const columns = [];
    columns.push(UserCustomColumn.createPrimaryKeyColumn(RTreeIndexExtensionConstants.COLUMN_ID, false));
    columns.push(UserCustomColumn.createColumn(RTreeIndexExtensionConstants.COLUMN_MIN_X, GeoPackageDataType.FLOAT));
    columns.push(UserCustomColumn.createColumn(RTreeIndexExtensionConstants.COLUMN_MAX_X, GeoPackageDataType.FLOAT));
    columns.push(UserCustomColumn.createColumn(RTreeIndexExtensionConstants.COLUMN_MIN_Y, GeoPackageDataType.FLOAT));
    columns.push(UserCustomColumn.createColumn(RTreeIndexExtensionConstants.COLUMN_MAX_Y, GeoPackageDataType.FLOAT));
    const rTreeTableName = this.getRTreeTableName(featureTable.getTableName(), featureTable.getGeometryColumnName());
    return new UserCustomTable(rTreeTableName, columns);
  }
}

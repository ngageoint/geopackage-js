import { GeoPackage } from '../../geoPackage';
import { BaseExtension } from '../baseExtension';
import { Extensions } from '../extensions';
import { RTreeIndexDao } from './rtreeIndexDao';
import { GeoPackageGeometryData } from '../../geom/geoPackageGeometryData';
import { FeatureTable } from '../../features/user/featureTable';
import { GeoPackageException } from '../../geoPackageException';
import { ExtensionScopeType } from '../extensionScopeType';
/**
 * RTreeIndex extension
 * @class RTreeIndex
 * @extends BaseExtension
 * @param {module:geoPackage~GeoPackage} geoPackage The GeoPackage object
 */
export class RTreeIndexExtension extends BaseExtension {
  /**
   * Trigger Insert name
   */
  static TRIGGER_INSERT_NAME = 'insert';

  /**
   * Trigger update 1 name
   */
  static TRIGGER_UPDATE1_NAME = 'update1';

  /**
   * Trigger update 2 name
   */
  static TRIGGER_UPDATE2_NAME = 'update2';

  /**
   * Trigger update 3 name
   */
  static TRIGGER_UPDATE3_NAME = 'update3';

  /**
   * Trigger update 4 name
   */
  static TRIGGER_UPDATE4_NAME = 'update4';

  /**
   * Trigger delete name
   */
  static TRIGGER_DELETE_NAME = 'delete';

  tableName: string;
  primaryKeyColumn: string;
  columnName: string;
  featureCount: number;
  rtreeIndexDao: RTreeIndexDao;
  extensionExists: boolean;
  constructor(geoPackage: GeoPackage) {
    super(geoPackage);
    this.extensionName = Extensions.buildExtensionName(
      RTreeIndexDao.EXTENSION_RTREE_INDEX_AUTHOR,
      RTreeIndexDao.EXTENSION_RTREE_INDEX_NAME_NO_AUTHOR,
    );
    this.extensionDefinition = RTreeIndexDao.EXTENSION_RTREE_INDEX_DEFINITION;
    this.rtreeIndexDao = new RTreeIndexDao(geoPackage);
    this.extensionExists = this.hasExtension(this.extensionName, this.tableName, this.columnName);
    this.createAllFunctions();
  }
  getRTreeIndexExtension(): Extensions[] {
    return this.getExtension(this.extensionName, this.tableName, this.columnName);
  }
  getOrCreateExtension(): Extensions {
    return this.getOrCreate(
      this.extensionName,
      this.tableName,
      this.columnName,
      this.extensionDefinition,
      ExtensionScopeType.WRITE_ONLY,
    );
  }

  /**
   * Create the RTree Index extension for the feature table, geometry column,
   * and id column. Creates the SQL functions, loads the tree, and creates the
   * triggers.
   * @param tableName table name
   * @param geometryColumnName geometry column name
   * @param idColumnName id column name
   * @return extension
   */
  createWithParameters(tableName: string, geometryColumnName: string, idColumnName: string): Extensions[] {
    if (this.hasExtension(this.extensionName, tableName, geometryColumnName)) {
      return this.getRTreeIndexExtension();
    }
    this.getOrCreate(
      this.extensionName,
      tableName,
      geometryColumnName,
      RTreeIndexDao.EXTENSION_RTREE_INDEX_DEFINITION,
      ExtensionScopeType.WRITE_ONLY,
    );
    this.createRTreeIndex(tableName, geometryColumnName);
    this.loadRTreeIndex(tableName, geometryColumnName, idColumnName);
    this.createAllTriggers(tableName, geometryColumnName, idColumnName);
    return this.getRTreeIndexExtension();
  }
  /**
   * Create the extension
   * @param {Function} [progress] progress function
   * @returns {Extensions[]}
   */
  create(progress?: Function): Extensions[] {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const safeProgress = progress || function(): void {};
    if (this.extensionExists) {
      return this.getRTreeIndexExtension();
    }
    this.getOrCreate(
      this.extensionName,
      this.tableName,
      this.columnName,
      RTreeIndexDao.EXTENSION_RTREE_INDEX_DEFINITION,
      ExtensionScopeType.WRITE_ONLY,
    );
    this.createAllFunctions();
    this.createRTreeIndex(this.tableName, this.columnName);
    const totalCount = this.connection.count(this.tableName);
    safeProgress({
      description: 'Creating Feature Index',
      count: 0,
      totalCount: totalCount,
      layer: this.tableName,
    });
    try {
      this.loadRTreeIndex(this.tableName, this.columnName, this.primaryKeyColumn);
    } catch (e) {
      console.log('ERROR CREATING RTREE INDEX', e);
    }
    this.createAllTriggers(this.tableName, this.columnName, this.primaryKeyColumn);
    return this.getRTreeIndexExtension();
  }
  createAllTriggers(tableName: string, geometryColumnName: string, idColumnName: string): boolean {
    const insertTrigger =
      'CREATE TRIGGER "rtree_' +
      tableName +
      '_' +
      geometryColumnName +
      '_insert" AFTER INSERT ON "' +
      tableName +
      '" WHEN (new.' +
      geometryColumnName +
      ' NOT NULL AND NOT ST_IsEmpty(NEW.' +
      geometryColumnName +
      ')) ' +
      'BEGIN ' +
      '  INSERT OR REPLACE INTO "rtree_' +
      tableName +
      '_' +
      geometryColumnName +
      '" VALUES (' +
      '    NEW.' +
      idColumnName +
      ',' +
      '    ST_MinX(NEW.' +
      geometryColumnName +
      '), ST_MaxX(NEW.' +
      geometryColumnName +
      '), ' +
      '    ST_MinY(NEW.' +
      geometryColumnName +
      '), ST_MaxY(NEW.' +
      geometryColumnName +
      ') ' +
      '  ); ' +
      'END;';
    const update1Trigger =
      'CREATE TRIGGER "rtree_' +
      tableName +
      '_' +
      geometryColumnName +
      '_update1" AFTER UPDATE OF ' +
      geometryColumnName +
      ' ON "' +
      tableName +
      '" WHEN OLD.' +
      idColumnName +
      ' = NEW.' +
      idColumnName +
      ' AND ' +
      '     (NEW.' +
      geometryColumnName +
      ' NOTNULL AND NOT ST_IsEmpty(NEW.' +
      geometryColumnName +
      ')) ' +
      'BEGIN ' +
      '  INSERT OR REPLACE INTO "rtree_' +
      tableName +
      '_' +
      geometryColumnName +
      '" VALUES (' +
      '    NEW.' +
      idColumnName +
      ',' +
      '    ST_MinX(NEW.' +
      geometryColumnName +
      '), ST_MaxX(NEW.' +
      geometryColumnName +
      '), ' +
      '    ST_MinY(NEW.' +
      geometryColumnName +
      '), ST_MaxY(NEW.' +
      geometryColumnName +
      ') ' +
      '  ); ' +
      'END;';
    const update2Trigger =
      'CREATE TRIGGER "rtree_' +
      tableName +
      '_' +
      geometryColumnName +
      '_update2" AFTER UPDATE OF ' +
      geometryColumnName +
      ' ON "' +
      tableName +
      '" WHEN OLD.' +
      idColumnName +
      ' = NEW.' +
      idColumnName +
      ' AND ' +
      '       (NEW.' +
      geometryColumnName +
      ' ISNULL OR ST_IsEmpty(NEW.' +
      geometryColumnName +
      ')) ' +
      'BEGIN ' +
      '  DELETE FROM "rtree_' +
      tableName +
      '_' +
      geometryColumnName +
      '" WHERE id = OLD.' +
      idColumnName +
      '; ' +
      'END;';
    const update3Trigger =
      'CREATE TRIGGER "rtree_' +
      tableName +
      '_' +
      geometryColumnName +
      '_update3" AFTER UPDATE OF ' +
      geometryColumnName +
      ' ON "' +
      tableName +
      '" WHEN OLD.' +
      idColumnName +
      ' != NEW.' +
      idColumnName +
      ' AND ' +
      '       (NEW.' +
      geometryColumnName +
      ' NOTNULL AND NOT ST_IsEmpty(NEW.' +
      geometryColumnName +
      ')) ' +
      'BEGIN ' +
      '  DELETE FROM "rtree_' +
      tableName +
      '_' +
      geometryColumnName +
      '" WHERE id = OLD.' +
      idColumnName +
      '; ' +
      '  INSERT OR REPLACE INTO "rtree_' +
      tableName +
      '_' +
      geometryColumnName +
      '" VALUES (' +
      '    NEW.' +
      idColumnName +
      ', ' +
      '    ST_MinX(NEW.' +
      geometryColumnName +
      '), ST_MaxX(NEW.' +
      geometryColumnName +
      '), ' +
      '    ST_MinY(NEW.' +
      geometryColumnName +
      '), ST_MaxY(NEW.' +
      geometryColumnName +
      ')' +
      '  ); ' +
      'END;';
    const update4Trigger =
      'CREATE TRIGGER "rtree_' +
      tableName +
      '_' +
      geometryColumnName +
      '_update4" AFTER UPDATE ON "' +
      tableName +
      '"  WHEN OLD.' +
      idColumnName +
      ' != NEW.' +
      idColumnName +
      ' AND ' +
      '       (NEW.' +
      geometryColumnName +
      ' ISNULL OR ST_IsEmpty(NEW.' +
      geometryColumnName +
      ')) ' +
      'BEGIN ' +
      '  DELETE FROM "rtree_' +
      tableName +
      '_' +
      geometryColumnName +
      '" WHERE id IN (OLD.' +
      idColumnName +
      ', NEW.' +
      idColumnName +
      '); ' +
      'END;';
    const deleteTrigger =
      'CREATE TRIGGER "rtree_' +
      tableName +
      '_' +
      geometryColumnName +
      '_delete" AFTER DELETE ON "' +
      tableName +
      '" WHEN old.' +
      geometryColumnName +
      ' NOT NULL ' +
      'BEGIN' +
      '  DELETE FROM "rtree_' +
      tableName +
      '_' +
      geometryColumnName +
      '" WHERE id = OLD.' +
      idColumnName +
      '; ' +
      'END;';
    let changes = 0;
    changes += this.connection.run(insertTrigger).changes;
    changes += this.connection.run(update1Trigger).changes;
    changes += this.connection.run(update2Trigger).changes;
    changes += this.connection.run(update3Trigger).changes;
    changes += this.connection.run(update4Trigger).changes;
    changes += this.connection.run(deleteTrigger).changes;
    return changes === 6;
  }
  loadRTreeIndex(tableName: string, geometryColumnName: string, idColumnName: string): boolean {
    return (
      this.connection.run(
        'INSERT OR REPLACE INTO "rtree_' +
          tableName +
          '_' +
          geometryColumnName +
          '" SELECT ' +
          idColumnName +
          ', st_minx(' +
          geometryColumnName +
          '), st_maxx(' +
          geometryColumnName +
          '), st_miny(' +
          geometryColumnName +
          '), st_maxy(' +
          geometryColumnName +
          ') FROM "' +
          tableName +
          '"',
      ).changes === 1
    );
  }
  createRTreeIndex(tableName: string, columnName: string): boolean {
    return (
      this.connection.run(
        'CREATE VIRTUAL TABLE "rtree_' + tableName + '_' + columnName + '" USING rtree(id, minx, maxx, miny, maxy)',
      ).changes === 1
    );
  }
  createAllFunctions(): void {
    this.createMinXFunction();
    this.createMaxXFunction();
    this.createMinYFunction();
    this.createMaxYFunction();
    this.createIsEmptyFunction();
  }
  createMinXFunction(): void {
    this.connection.registerFunction()
    this.connection.registerFunction('ST_MinX', function(buffer: Buffer | Uint8Array) {
      const geom = new GeoPackageGeometryData(buffer);
      if (!geom.getGeometry()) {
        return null;
      }
      const envelope = geom.getOrBuildEnvelope();
      if (envelope.minX === Infinity) {
        return null;
      }
      return envelope.minX;
    });
  }
  createMinYFunction(): void {
    this.connection.registerFunction('ST_MinY', function(buffer: Buffer | Uint8Array) {
      const geom = new GeoPackageGeometryData(buffer);
      if (!geom.getGeometry()) {
        return null;
      }
      const envelope = geom.getOrBuildEnvelope();
      if (envelope.minY === Infinity) {
        return null;
      }
      return envelope.minY;
    });
  }
  createMaxXFunction(): void {
    this.connection.registerFunction('ST_MaxX', function(buffer: Buffer | Uint8Array) {
      const geom = new GeoPackageGeometryData(buffer);
      if (!geom.getGeometry()) {
        return null;
      }
      const envelope = geom.getOrBuildEnvelope();
      if (envelope.maxX === -Infinity) {
        return null;
      }
      return envelope.maxX;
    });
  }
  createMaxYFunction(): void {
    this.connection.registerFunction('ST_MaxY', function(buffer: Buffer | Uint8Array) {
      const geom = new GeoPackageGeometryData(buffer);
      if (!geom.getGeometry()) {
        return null;
      }
      const envelope = geom.getOrBuildEnvelope();
      if (envelope.maxY === -Infinity) {
        return null;
      }
      return envelope.maxY;
    });
  }
  createIsEmptyFunction(): void {
    this.connection.registerFunction('ST_IsEmpty', function(buffer: Buffer | Uint8Array): number {
      const geom = new GeoPackageGeometryData(buffer);
      const empty = !geom || geom.isEmpty() || !geom.getGeometry();
      return empty ? 1 : 0;
    });
  }

  has(table?: string, column?: string): boolean {
    return this.hasExtension(this.extensionName, table, column);
  }

  deleteTable(tableName: string): void {
    try {
      if (this.extensionsDao.isTableExists()) {
        const extensions = this.extensionsDao.queryByExtensionAndTableName(this.extensionName, tableName);
        extensions.forEach(extension => {
          this.deleteTableAndColumn(extension.getTableName(), extension.column_name);
        });
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
   * Delete the RTree Index extension for the table and geometry column. Drops
   * the triggers, RTree table, and deletes the extension.
   * @param tableName table name
   * @param geometryColumnName geometry column name
   */
  deleteTableAndColumn(tableName: string, geometryColumnName: string): void {
    if (this.has(tableName, geometryColumnName)) {
      this.dropTableAndColumn(tableName, geometryColumnName);
      try {
        this.extensionsDao.deleteByExtensionAndTableNameAndColumnName(
          this.extensionName,
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

  deleteAll(): void {
    try {
      if (this.extensionsDao.isTableExists()) {
        const extensions = this.extensionsDao.queryByExtensionAndTableName(this.extensionName, this.tableName);
        extensions.forEach(extension => {
          this.deleteTableAndColumn(extension.getTableName(), extension.column_name);
        });
      }
    } catch (e) {
      throw new GeoPackageException(
        'Failed to delete RTree Index extensions for table. GeoPackage: ' +
          this.geoPackage.getName() +
          ', Table: ' +
          this.tableName,
      );
    }
  }

  /**
   * Drop the the triggers and RTree table for the feature table
   * @param featureTable feature table
   */
  dropByFeatureTable(featureTable: FeatureTable): void {
    this.dropTableAndColumn(featureTable.getTableName(), featureTable.getGeometryColumnName());
  }

  /**
   * Drop the the triggers and RTree table for the table and geometry column
   *
   * @param tableName table name
   * @param geometryColumnName geometry column name
   */
  dropTableAndColumn(tableName: string, geometryColumnName: string): void {
    this.dropAllTriggers(tableName, geometryColumnName);
    this.dropRTreeIndex(tableName, geometryColumnName);
  }

  /**
   * Drop the RTree Index Virtual Table
   * @param featureTable feature table
   */
  dropRTreeIndexByFeatureTable(featureTable: FeatureTable): void {
    this.dropRTreeIndex(featureTable.getTableName(), featureTable.getGeometryColumnName());
  }

  /**
   * Drop the RTree Index Virtual Table
   * @param tableName table name
   * @param geometryColumnName geometry column name
   */
  dropRTreeIndex(tableName: string, geometryColumnName: string): void {
    try {
      this.geoPackage.getConnection().run('DROP TABLE "rtree_' + tableName + '_' + geometryColumnName + '"');
    } catch (e) {
      // If no rtree module, try to delete manually
      if (e.getMessage().indexOf('no such module: rtree') > -1) {
        this.geoPackage
          .getConnection()
          .run('DROP TABLE IF EXISTS "rtree_' + tableName + '_' + geometryColumnName + '_node"');
        this.geoPackage
          .getConnection()
          .run('DROP TABLE IF EXISTS "rtree_' + tableName + '_' + geometryColumnName + '_parent"');
        this.geoPackage
          .getConnection()
          .run('DROP TABLE IF EXISTS "rtree_' + tableName + '_' + geometryColumnName + '_rowid"');
        this.geoPackage.getConnection().run('PRAGMA writable_schema = ON');
        this.geoPackage
          .getConnection()
          .run(
            'DELETE FROM sqlite_master WHERE type = "table" AND name = "rtree_' +
              tableName +
              '_' +
              geometryColumnName +
              '"',
          );
        this.geoPackage.getConnection().run('PRAGMA writable_schema = OFF');
      } else {
        throw e;
      }
    }
  }

  /**
   * Check if the feature table has the RTree extension and if found, drop the
   * triggers
   * @param featureTable feature table
   */
  dropTriggersByFeatureTable(featureTable: FeatureTable): void {
    this.dropTriggers(featureTable.getTableName(), featureTable.getGeometryColumnName());
  }

  /**
   * Check if the table and column has the RTree extension and if found, drop
   * the triggers
   * @param tableName table name
   * @param columnName column name
   * @return true if dropped
   */
  dropTriggers(tableName: string, columnName: string): boolean {
    const dropped = this.has(tableName, columnName);
    if (dropped) {
      this.dropAllTriggers(tableName, columnName);
    }
    return dropped;
  }

  /**
   * Drop Triggers that Maintain Spatial Index Values
   * @param featureTable feature table
   */
  dropAllTriggersByFeatureTable(featureTable: FeatureTable): void {
    this.dropAllTriggers(featureTable.getTableName(), featureTable.getGeometryColumnName());
  }

  /**
   * Drop Triggers that Maintain Spatial Index Values
   *
   * @param tableName table name
   * @param geometryColumnName geometry column name
   */
  dropAllTriggers(tableName: string, geometryColumnName: string): void {
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
   * @param tableName
   *            table name
   * @param geometryColumnName
   *            geometry column name
   */
  dropInsertTrigger(tableName: string, geometryColumnName: string): void {
    this.dropTrigger(tableName, geometryColumnName, RTreeIndexExtension.TRIGGER_INSERT_NAME);
  }

  /**
   * Drop update 1 trigger
   *
   * @param tableName table name
   * @param geometryColumnName  geometry column name
   */
  dropUpdate1Trigger(tableName: string, geometryColumnName: string): void {
    this.dropTrigger(tableName, geometryColumnName, RTreeIndexExtension.TRIGGER_UPDATE1_NAME);
  }

  /**
   * Drop update 2 trigger
   *
   * @param tableName
   *            table name
   * @param geometryColumnName
   *            geometry column name
   */
  dropUpdate2Trigger(tableName: string, geometryColumnName: string): void {
    this.dropTrigger(tableName, geometryColumnName, RTreeIndexExtension.TRIGGER_UPDATE2_NAME);
  }

  /**
   * Drop update 3 trigger
   *
   * @param tableName
   *            table name
   * @param geometryColumnName
   *            geometry column name
   */
  dropUpdate3Trigger(tableName: string, geometryColumnName: string): void {
    this.dropTrigger(tableName, geometryColumnName, RTreeIndexExtension.TRIGGER_UPDATE3_NAME);
  }

  /**
   * Drop update 4 trigger
   *
   * @param tableName
   *            table name
   * @param geometryColumnName
   *            geometry column name
   */
  dropUpdate4Trigger(tableName: string, geometryColumnName: string): void {
    this.dropTrigger(tableName, geometryColumnName, RTreeIndexExtension.TRIGGER_UPDATE4_NAME);
  }

  /**
   * Drop delete trigger
   *
   * @param tableName
   *            table name
   * @param geometryColumnName
   *            geometry column name
   */
  dropDeleteTrigger(tableName: string, geometryColumnName: string): void {
    this.dropTrigger(tableName, geometryColumnName, RTreeIndexExtension.TRIGGER_DELETE_NAME);
  }

  /**
   * Drop the trigger for the table, geometry column, and trigger name
   * @param tableName table name
   * @param geometryColumnName geometry column name
   * @param triggerName trigger name
   */
  dropTrigger(tableName: string, geometryColumnName: string, triggerName: string): void {
    this.geoPackage
      .getConnection()
      .run('DROP TRIGGER IF EXISTS "rtree_' + tableName + '_' + geometryColumnName + '_' + triggerName + '"');
  }
}

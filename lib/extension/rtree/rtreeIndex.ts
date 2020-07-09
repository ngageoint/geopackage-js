import { GeoPackage } from '../../geoPackage';
import { BaseExtension } from '../baseExtension';
import { Extension } from '../extension';
import { RTreeIndexDao } from './rtreeIndexDao';
import { FeatureDao } from '../../features/user/featureDao';
import { EnvelopeBuilder } from '../../geom/envelopeBuilder';
import { GeometryData } from '../../geom/geometryData';
import { FeatureRow } from '../../features/user/featureRow';
/**
 * RTreeIndex extension
 * @class RTreeIndex
 * @extends BaseExtension
 * @param {module:geoPackage~GeoPackage} geoPackage The GeoPackage object
 */
export class RTreeIndex extends BaseExtension {
  tableName: string;
  primaryKeyColumn: string;
  columnName: string;
  featureCount: number;
  rtreeIndexDao: RTreeIndexDao;
  extensionExists: boolean;
  constructor(geoPackage: GeoPackage, featureDao: FeatureDao<FeatureRow>) {
    super(geoPackage);
    this.extensionName = Extension.buildExtensionName(
      RTreeIndexDao.EXTENSION_RTREE_INDEX_AUTHOR,
      RTreeIndexDao.EXTENSION_RTREE_INDEX_NAME_NO_AUTHOR,
    );
    this.extensionDefinition = RTreeIndexDao.EXTENSION_RTREE_INDEX_DEFINITION;
    this.tableName = featureDao.table_name;
    this.primaryKeyColumn = featureDao.idColumns[0];
    this.columnName = featureDao.getGeometryColumnName();
    this.featureCount = featureDao.count();
    this.rtreeIndexDao = new RTreeIndexDao(geoPackage, featureDao);
    this.extensionExists = this.hasExtension(this.extensionName, this.tableName, this.columnName);
    this.createAllFunctions();
  }
  getRTreeIndexExtension(): Extension[] {
    return this.getExtension(this.extensionName, this.tableName, this.columnName);
  }
  async getOrCreateExtension(): Promise<Extension> {
    return this.getOrCreate(
      this.extensionName,
      this.tableName,
      this.columnName,
      this.extensionDefinition,
      Extension.WRITE_ONLY,
    );
  }
  /**
   *
   * @param {Function} [progress] progress function
   * @returns {Promise}
   */
  async create(progress?: Function): Promise<Extension[]> {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const safeProgress = progress || function(): void {};
    if (this.extensionExists) {
      return this.getRTreeIndexExtension();
    }
    await this.getOrCreate(
      this.extensionName,
      this.tableName,
      this.columnName,
      RTreeIndexDao.EXTENSION_RTREE_INDEX_DEFINITION,
      Extension.WRITE_ONLY,
    );
    this.createAllFunctions();
    this.createRTreeIndex();
    safeProgress({
      description: 'Creating Feature Index',
      count: 0,
      totalCount: this.featureCount,
      layer: this.tableName,
    });
    try {
      this.loadRTreeIndex();
    } catch (e) {
      console.log('ERROR CREATING RTREE INDEX', e);
    }
    this.createAllTriggers();
    return this.getRTreeIndexExtension();
  }
  createAllTriggers(): boolean {
    const insertTrigger =
      'CREATE TRIGGER "rtree_' +
      this.tableName +
      '_' +
      this.columnName +
      '_insert" AFTER INSERT ON "' +
      this.tableName +
      '" WHEN (new.' +
      this.columnName +
      ' NOT NULL AND NOT ST_IsEmpty(NEW.' +
      this.columnName +
      ')) ' +
      'BEGIN ' +
      '  INSERT OR REPLACE INTO "rtree_' +
      this.tableName +
      '_' +
      this.columnName +
      '" VALUES (' +
      '    NEW.' +
      this.primaryKeyColumn +
      ',' +
      '    ST_MinX(NEW.' +
      this.columnName +
      '), ST_MaxX(NEW.' +
      this.columnName +
      '), ' +
      '    ST_MinY(NEW.' +
      this.columnName +
      '), ST_MaxY(NEW.' +
      this.columnName +
      ') ' +
      '  ); ' +
      'END;';
    const update1Trigger =
      'CREATE TRIGGER "rtree_' +
      this.tableName +
      '_' +
      this.columnName +
      '_update1" AFTER UPDATE OF ' +
      this.columnName +
      ' ON "' +
      this.tableName +
      '" WHEN OLD.' +
      this.primaryKeyColumn +
      ' = NEW.' +
      this.primaryKeyColumn +
      ' AND ' +
      '     (NEW.' +
      this.columnName +
      ' NOTNULL AND NOT ST_IsEmpty(NEW.' +
      this.columnName +
      ')) ' +
      'BEGIN ' +
      '  INSERT OR REPLACE INTO "rtree_' +
      this.tableName +
      '_' +
      this.columnName +
      '" VALUES (' +
      '    NEW.' +
      this.primaryKeyColumn +
      ',' +
      '    ST_MinX(NEW.' +
      this.columnName +
      '), ST_MaxX(NEW.' +
      this.columnName +
      '), ' +
      '    ST_MinY(NEW.' +
      this.columnName +
      '), ST_MaxY(NEW.' +
      this.columnName +
      ') ' +
      '  ); ' +
      'END;';
    const update2Trigger =
      'CREATE TRIGGER "rtree_' +
      this.tableName +
      '_' +
      this.columnName +
      '_update2" AFTER UPDATE OF ' +
      this.columnName +
      ' ON "' +
      this.tableName +
      '" WHEN OLD.' +
      this.primaryKeyColumn +
      ' = NEW.' +
      this.primaryKeyColumn +
      ' AND ' +
      '       (NEW.' +
      this.columnName +
      ' ISNULL OR ST_IsEmpty(NEW.' +
      this.columnName +
      ')) ' +
      'BEGIN ' +
      '  DELETE FROM "rtree_' +
      this.tableName +
      '_' +
      this.columnName +
      '" WHERE id = OLD.' +
      this.primaryKeyColumn +
      '; ' +
      'END;';
    const update3Trigger =
      'CREATE TRIGGER "rtree_' +
      this.tableName +
      '_' +
      this.columnName +
      '_update3" AFTER UPDATE OF ' +
      this.columnName +
      ' ON "' +
      this.tableName +
      '" WHEN OLD.' +
      this.primaryKeyColumn +
      ' != NEW.' +
      this.primaryKeyColumn +
      ' AND ' +
      '       (NEW.' +
      this.columnName +
      ' NOTNULL AND NOT ST_IsEmpty(NEW.' +
      this.columnName +
      ')) ' +
      'BEGIN ' +
      '  DELETE FROM "rtree_' +
      this.tableName +
      '_' +
      this.columnName +
      '" WHERE id = OLD.' +
      this.primaryKeyColumn +
      '; ' +
      '  INSERT OR REPLACE INTO "rtree_' +
      this.tableName +
      '_' +
      this.columnName +
      '" VALUES (' +
      '    NEW.' +
      this.primaryKeyColumn +
      ', ' +
      '    ST_MinX(NEW.' +
      this.columnName +
      '), ST_MaxX(NEW.' +
      this.columnName +
      '), ' +
      '    ST_MinY(NEW.' +
      this.columnName +
      '), ST_MaxY(NEW.' +
      this.columnName +
      ')' +
      '  ); ' +
      'END;';
    const update4Trigger =
      'CREATE TRIGGER "rtree_' +
      this.tableName +
      '_' +
      this.columnName +
      '_update4" AFTER UPDATE ON "' +
      this.tableName +
      '"  WHEN OLD.' +
      this.primaryKeyColumn +
      ' != NEW.' +
      this.primaryKeyColumn +
      ' AND ' +
      '       (NEW.' +
      this.columnName +
      ' ISNULL OR ST_IsEmpty(NEW.' +
      this.columnName +
      ')) ' +
      'BEGIN ' +
      '  DELETE FROM "rtree_' +
      this.tableName +
      '_' +
      this.columnName +
      '" WHERE id IN (OLD.' +
      this.primaryKeyColumn +
      ', NEW.' +
      this.primaryKeyColumn +
      '); ' +
      'END;';
    const deleteTrigger =
      'CREATE TRIGGER "rtree_' +
      this.tableName +
      '_' +
      this.columnName +
      '_delete" AFTER DELETE ON "' +
      this.tableName +
      '" WHEN old.' +
      this.columnName +
      ' NOT NULL ' +
      'BEGIN' +
      '  DELETE FROM "rtree_' +
      this.tableName +
      '_' +
      this.columnName +
      '" WHERE id = OLD.' +
      this.primaryKeyColumn +
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
  loadRTreeIndex(): boolean {
    console.log(
      'minx',
      this.connection.get(
        'SELECT ' +
          this.primaryKeyColumn +
          ', ST_MinX(' +
          this.columnName +
          '), ST_MaxX(' +
          this.columnName +
          '), ST_MinY(' +
          this.columnName +
          '), ST_MaxY(' +
          this.columnName +
          ') FROM "' +
          this.tableName +
          '"',
      ),
    );
    return (
      this.connection.run(
        'INSERT OR REPLACE INTO "rtree_' +
          this.tableName +
          '_' +
          this.columnName +
          '" SELECT ' +
          this.primaryKeyColumn +
          ', ST_MinX(' +
          this.columnName +
          '), ST_MaxX(' +
          this.columnName +
          '), ST_MinY(' +
          this.columnName +
          '), ST_MaxY(' +
          this.columnName +
          ') FROM "' +
          this.tableName +
          '"',
      ).changes === 1
    );
  }
  createRTreeIndex(): boolean {
    return (
      this.connection.run(
        'CREATE VIRTUAL TABLE "rtree_' +
          this.tableName +
          '_' +
          this.columnName +
          '" USING rtree(id, minx, maxx, miny, maxy)',
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
    this.connection.registerFunction('ST_MinX', function(buffer: Buffer | Uint8Array) {
      const geom = new GeometryData(buffer);
      let envelope = geom.envelope;
      if (!envelope) {
        envelope = EnvelopeBuilder.buildEnvelopeWithGeometry(geom.geometry);
      }
      if (envelope.minX === Infinity) {
        return null;
      }
      return envelope.minX;
    });
  }
  createMinYFunction(): void {
    this.connection.registerFunction('ST_MinY', function(buffer: Buffer | Uint8Array) {
      const geom = new GeometryData(buffer);
      let envelope = geom.envelope;
      if (!envelope) {
        envelope = EnvelopeBuilder.buildEnvelopeWithGeometry(geom.geometry);
      }
      if (envelope.minY === Infinity) {
        return null;
      }
      return envelope.minY;
    });
  }
  createMaxXFunction(): void {
    this.connection.registerFunction('ST_MaxX', function(buffer: Buffer | Uint8Array) {
      const geom = new GeometryData(buffer);
      let envelope = geom.envelope;
      if (!envelope) {
        envelope = EnvelopeBuilder.buildEnvelopeWithGeometry(geom.geometry);
      }
      if (envelope.maxX === -Infinity) {
        return null;
      }
      return envelope.maxX;
    });
  }
  createMaxYFunction(): void {
    this.connection.registerFunction('ST_MaxY', function(buffer: Buffer | Uint8Array) {
      const geom = new GeometryData(buffer);
      let envelope = geom.envelope;
      if (!envelope) {
        envelope = EnvelopeBuilder.buildEnvelopeWithGeometry(geom.geometry);
      }
      if (envelope.maxY === -Infinity) {
        return null;
      }
      return envelope.maxY;
    });
  }
  createIsEmptyFunction(): void {
    this.connection.registerFunction('ST_IsEmpty', function(buffer: Buffer | Uint8Array): number {
      const geom = new GeometryData(buffer);
      const empty = !geom || geom.empty || !geom.geometry;
      return empty ? 1 : 0;
    });
  }
}

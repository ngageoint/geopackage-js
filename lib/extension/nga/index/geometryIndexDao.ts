import { GeometryIndex } from './geometryIndex';
import { TableIndex } from './tableIndex';
import { GeometryEnvelope } from '@ngageoint/simple-features-js';
import { DBValue } from '../../../db/dbValue';
import { GeoPackageDao } from '../../../db/geoPackageDao';
import { GeometryIndexKey } from './geometryIndexKey';
import { FieldValues } from '../../../dao/fieldValues';
import { GeoPackageException } from '../../../geoPackageException';
import type { GeoPackage } from '../../../geoPackage';

/**
 * Geometry Index Data Access Object
 */
export class GeometryIndexDao extends GeoPackageDao<GeometryIndex, GeometryIndexKey> {
  readonly gpkgTableName: string = GeometryIndex.TABLE_NAME;
  readonly idColumns: string[] = [GeometryIndex.COLUMN_TABLE_NAME, GeometryIndex.COLUMN_GEOM_ID];

  constructor(geoPackage: GeoPackage) {
    super(geoPackage, GeometryIndex.TABLE_NAME);
  }

  /**
   * Create the DAO
   * @param geoPackage GeoPackageConnection
   * @return dao
   */
  public static createDao(geoPackage: GeoPackage): GeometryIndexDao {
    return new GeometryIndexDao(geoPackage);
  }

  /**
   * Query for ID with Key
   * @param key
   */
  public queryForIdWithKey(key: GeometryIndexKey): GeometryIndex {
    let geometryIndex = null;
    if (key != null) {
      const fieldValues = new FieldValues();
      fieldValues.addFieldValue(GeometryIndex.COLUMN_TABLE_NAME, key.getTableName());
      fieldValues.addFieldValue(GeometryIndex.COLUMN_GEOM_ID, key.getGeomId());
      const results = this.queryForFieldValues(fieldValues);
      const values = [];
      for (const result of results) {
        if (result != null) {
          values.push(result);
        }
      }
      if (values.length > 1) {
        throw new GeoPackageException(
          'More than one GeometryIndex returned for key. Table Name: ' +
            key.getTableName() +
            ', Geom Id: ' +
            key.getGeomId(),
        );
      }
      if (values.length === 1) {
        geometryIndex = this.createObject(values[0]);
      }
      return geometryIndex;
    }
  }

  public createObject(result: Record<string, DBValue>): GeometryIndex {
    const geometryIndex = new GeometryIndex();
    geometryIndex.setTableName(result['table_name'] as string);
    geometryIndex.setGeomId(result['geom_id'] as number);
    geometryIndex.setMinX(result['min_x'] as number);
    geometryIndex.setMaxX(result['max_x'] as number);
    geometryIndex.setMinY(result['min_y'] as number);
    geometryIndex.setMaxY(result['max_y'] as number);
    geometryIndex.setMinZ(result['min_z'] as number);
    geometryIndex.setMaxZ(result['max_z'] as number);
    geometryIndex.setMinM(result['min_m'] as number);
    geometryIndex.setMaxM(result['max_m'] as number);
    return geometryIndex;
  }

  /**
   * @inheritDoc
   */
  public extractId(data: GeometryIndex): GeometryIndexKey {
    return data.getId();
  }

  /**
   * @inheritDoc
   */
  public idExists(id: GeometryIndexKey): boolean {
    return this.queryForIdWithKey(id) != null;
  }

  /**
   * @inheritDoc
   */
  public queryForSameId(data: GeometryIndex): GeometryIndex {
    return this.queryForIdWithKey(data.getId());
  }

  /**
   * @inheritDoc
   */
  public updateId(data: GeometryIndex, newId: GeometryIndexKey): number {
    let count = 0;
    const readData = this.queryForIdWithKey(data.getId());
    if (readData != null && newId != null) {
      readData.setId(newId);
      count = this.update(readData).changes;
    }
    return count;
  }

  /**
   * @inheritDoc
   */
  public deleteByIdWithKey(id: GeometryIndexKey): number {
    let count = 0;
    if (id != null) {
      count = this.deleteByMultiId([id.getTableName(), id.getGeomId()]);
    }
    return count;
  }

  /**
   * Query by table name
   * @param tableName table name
   * @return geometry indices
   */
  public queryForTableName(tableName: string): GeometryIndex[] {
    let results: GeometryIndex[] = [];
    try {
      results = this.queryForAllEq(GeometryIndex.COLUMN_TABLE_NAME, tableName).map((result) =>
        this.createObject(result),
      );
    } catch (e) {
      throw new GeoPackageException('Failed to query for Geometry Index objects by Table Name: ' + tableName);
    }
    return results;
  }

  /**
   * Populate a new geometry index from an envelope
   * @param tableIndex table index
   * @param geomId geometry id
   * @param envelope geometry envelope
   * @return geometry index
   */
  public populate(tableIndex: TableIndex, geomId: number, envelope: GeometryEnvelope): GeometryIndex {
    const geometryIndex = new GeometryIndex();
    geometryIndex.setTableIndex(tableIndex);
    geometryIndex.setGeomId(geomId);
    geometryIndex.setMinX(envelope.minX);
    geometryIndex.setMaxX(envelope.maxX);
    geometryIndex.setMinY(envelope.minY);
    geometryIndex.setMaxY(envelope.maxY);
    if (envelope.hasZ) {
      geometryIndex.setMinZ(envelope.minZ);
      geometryIndex.setMaxZ(envelope.maxZ);
    }
    if (envelope.hasM) {
      geometryIndex.setMinM(envelope.minM);
      geometryIndex.setMaxM(envelope.maxM);
    }
    return geometryIndex;
  }

  /**
   * Count by table name
   * @param  {string}   tableName table name
   * @return {Number}
   */
  countByTableName(tableName: string): number {
    return this.count(GeometryIndex.COLUMN_TABLE_NAME, tableName);
  }

  // /**
  //  * Query the index with an envelope
  //  * @param  {Object} envelope envelope
  //  * @param  {Number} envelope.minX min x
  //  * @param  {Number} envelope.maxX max x
  //  * @param  {Number} envelope.minY min y
  //  * @param  {Number} envelope.maxY max y
  //  * @param  {Number} envelope.minZ min z
  //  * @param  {Number} envelope.maxZ max z
  //  * @param  {Number} envelope.minM min m
  //  * @param  {Number} envelope.maxM max m
  //  * @param  {Boolean} envelope.hasM has m
  //  * @param  {Boolean} envelope.hasZ has z
  //  * @return {Object}
  //  */
  // _generateGeometryEnvelopeQuery(
  //   envelope: GeometryEnvelope,
  // ): { join: string; where: string; whereArgs: DBValue[]; tableNameArr: string[] } {
  //   const tableName = new FeatureDao().gpkgTableName;
  //   let where = '';
  //   where += this.buildWhereWithFieldAndValue(GeometryIndex.COLUMN_TABLE_NAME, tableName);
  //   where += ' and ';
  //   const minXLessThanMaxX = envelope.minX < envelope.maxX;
  //   if (minXLessThanMaxX) {
  //     where += this.buildWhereWithFieldAndValue(GeometryIndex.COLUMN_MIN_X, envelope.maxX, '<=');
  //     where += ' and ';
  //     where += this.buildWhereWithFieldAndValue(GeometryIndex.COLUMN_MAX_X, envelope.minX, '>=');
  //   } else {
  //     where += '(';
  //     where += this.buildWhereWithFieldAndValue(GeometryIndex.COLUMN_MIN_X, envelope.maxX, '<=');
  //     where += ' or ';
  //     where += this.buildWhereWithFieldAndValue(GeometryIndex.COLUMN_MAX_X, envelope.minX, '>=');
  //     where += ' or ';
  //     where += this.buildWhereWithFieldAndValue(GeometryIndex.COLUMN_MIN_X, envelope.minX, '>=');
  //     where += ' or ';
  //     where += this.buildWhereWithFieldAndValue(GeometryIndex.COLUMN_MAX_X, envelope.maxX, '<=');
  //     where += ')';
  //   }
  //   where += ' and ';
  //   where += this.buildWhereWithFieldAndValue(GeometryIndex.COLUMN_MIN_Y, envelope.maxY, '<=');
  //   where += ' and ';
  //   where += this.buildWhereWithFieldAndValue(GeometryIndex.COLUMN_MAX_Y, envelope.minY, '>=');
  //   const whereArgs = [tableName, envelope.maxX, envelope.minX];
  //   if (!minXLessThanMaxX) {
  //     whereArgs.push(envelope.minX, envelope.maxX);
  //   }
  //   whereArgs.push(envelope.maxY, envelope.minY);
  //   if (envelope.hasZ) {
  //     where += ' and ';
  //     where += this.buildWhereWithFieldAndValue(GeometryIndex.COLUMN_MIN_Z, envelope.minZ, '<=');
  //     where += ' and ';
  //     where += this.buildWhereWithFieldAndValue(GeometryIndex.COLUMN_MAX_Z, envelope.maxZ, '>=');
  //     whereArgs.push(envelope.maxZ, envelope.minZ);
  //   }
  //   if (envelope.hasM) {
  //     where += ' and ';
  //     where += this.buildWhereWithFieldAndValue(GeometryIndex.COLUMN_MIN_M, envelope.minM, '<=');
  //     where += ' and ';
  //     where += this.buildWhereWithFieldAndValue(GeometryIndex.COLUMN_MAX_M, envelope.maxM, '>=');
  //     whereArgs.push(envelope.maxM, envelope.minM);
  //   }
  //   return {
  //     join:
  //       'inner join "' +
  //       tableName +
  //       '" on "' +
  //       tableName +
  //       '".' +
  //       this.featureDao.idColumns[0] +
  //       ' = ' +
  //       GeometryIndex.COLUMN_GEOM_ID,
  //     where,
  //     whereArgs,
  //     tableNameArr: ['"' + tableName + '".*'],
  //   };
  // }
  //
  // /**
  //  * @param  {Object} envelope envelope
  //  * @param  {Number} envelope.minX min x
  //  * @param  {Number} envelope.maxX max x
  //  * @param  {Number} envelope.minY min y
  //  * @param  {Number} envelope.maxY max y
  //  * @param  {Number} envelope.minZ min z
  //  * @param  {Number} envelope.maxZ max z
  //  * @param  {Number} envelope.minM min m
  //  * @param  {Number} envelope.maxM max m
  //  * @param  {Boolean} envelope.hasM has m
  //  * @param  {Boolean} envelope.hasZ has z
  //  */
  // queryWithGeometryEnvelope(envelope: GeometryEnvelope): IterableIterator<GeometryIndex> {
  //   const result = this._generateGeometryEnvelopeQuery(envelope);
  //   return (this.queryJoinWhereWithArgs(
  //     result.join,
  //     result.where,
  //     result.whereArgs,
  //     result.tableNameArr,
  //   ) as unknown) as IterableIterator<GeometryIndex>;
  // }
  // /**
  //  * @param  {Object} envelope envelope
  //  * @param  {Number} envelope.minX min x
  //  * @param  {Number} envelope.maxX max x
  //  * @param  {Number} envelope.minY min y
  //  * @param  {Number} envelope.maxY max y
  //  * @param  {Number} envelope.minZ min z
  //  * @param  {Number} envelope.maxZ max z
  //  * @param  {Number} envelope.minM min m
  //  * @param  {Number} envelope.maxM max m
  //  * @param  {Boolean} envelope.hasM has m
  //  * @param  {Boolean} envelope.hasZ has z
  //  */
  // countWithGeometryEnvelope(envelope: GeometryEnvelope): number {
  //   const result = this._generateGeometryEnvelopeQuery(envelope);
  //   return this.countJoinWhereWithArgs(result.join, result.where, result.whereArgs);
  // }
}

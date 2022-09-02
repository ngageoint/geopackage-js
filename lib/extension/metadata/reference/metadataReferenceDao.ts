import { ColumnValues } from '../../../dao/columnValues';
import { MetadataReference } from './metadataReference';
import { DBValue } from '../../../db/dbValue';
import { GeoPackageDao } from '../../../db/geoPackageDao';
import { GeoPackageConnection } from '../../../db/geoPackageConnection';

/**
 * Metadata Reference Data Access Object
 */
export class MetadataReferenceDao extends GeoPackageDao<MetadataReference, void> {
  readonly gpkgTableName: string = MetadataReference.TABLE_NAME;
  readonly idColumns: string[] = [MetadataReference.COLUMN_FILE_ID, MetadataReference.COLUMN_PARENT_ID];

  createObject(results?: Record<string, DBValue>): MetadataReference {
    const mr = new MetadataReference();
    if (results) {
      mr.reference_scope = results.reference_scope as string;
      mr.table_name = results.table_name as string;
      mr.column_name = results.column_name as string;
      mr.row_id_value = results.row_id_value as number;
      mr.timestamp = new Date(results.timestamp as string);
      mr.md_file_id = results.md_file_id as number;
      mr.md_parent_id = results.md_parent_id as number;
    }
    return mr;
  }

  /**
   * Constructor
   * @param geoPackageConnection GeoPackage object this dao belongs to
   */
  constructor(geoPackageConnection: GeoPackageConnection) {
    super(geoPackageConnection, MetadataReference.TABLE_NAME);
  }

  public static createDao(geoPackageConnection: GeoPackageConnection): MetadataReferenceDao {
    return new MetadataReferenceDao(geoPackageConnection);
  }

  /**
   * Delete metadata references with foreign keys to the metadata file id
   *
   * @param fileId file id
   * @return deleted count
   */
  public deleteByMetadata(fileId: number): number {
    const where = this.buildWhereWithFieldAndValue(MetadataReference.COLUMN_FILE_ID, fileId);
    const whereArgs = this.buildWhereArgs(fileId);
    const deleted = this.deleteWhere(where, whereArgs);
    return deleted;
  }

  /**
   * @param {Number} parentId
   * @return {Number} number of rows updated
   */
  removeMetadataParent(parentId: number): number {
    const values: Record<string, DBValue> = {};
    values[MetadataReference.COLUMN_PARENT_ID] = null;
    const where = this.buildWhereWithFieldAndValue(MetadataReference.COLUMN_PARENT_ID, parentId);
    const whereArgs = this.buildWhereArgs(parentId);
    return this.updateWithValues(values, where, whereArgs).changes;
  }
  /**
   * @param {Number} fileId
   * @param {Number} parentId
   * @return {Iterable.<Object>}
   */
  queryByMetadataAndParent(fileId: number, parentId: number): IterableIterator<any> {
    const columnValues = new ColumnValues();
    columnValues.addColumn(MetadataReference.COLUMN_FILE_ID, fileId);
    columnValues.addColumn(MetadataReference.COLUMN_PARENT_ID, parentId);
    return this.queryForFieldValues(columnValues);
  }
  /**
   * @param {Number} fileId
   * @return {Iterable.<Object>}
   */
  queryByMetadata(fileId: number): IterableIterator<any> {
    const columnValues = new ColumnValues();
    columnValues.addColumn(MetadataReference.COLUMN_FILE_ID, fileId);
    return this.queryForFieldValues(columnValues);
  }
  /**
   * @param {Number} parentId
   * @return {Iterable.<Object>}
   */
  queryByMetadataParent(parentId: number): IterableIterator<any> {
    const columnValues = new ColumnValues();
    columnValues.addColumn(MetadataReference.COLUMN_PARENT_ID, parentId);
    return this.queryForFieldValues(columnValues);
  }

  deleteByTableName(table: string): number {
    let where = '';
    where += this.buildWhereWithFieldAndValue(MetadataReference.COLUMN_TABLE_NAME, table);
    const whereArgs = this.buildWhereArgs(table);
    return this.deleteWhere(where, whereArgs);
  }

  queryForIdWithKey(key: void): MetadataReference {
    return undefined;
  }
}

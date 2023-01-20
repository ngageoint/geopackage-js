import { FieldValues } from '../../../dao/fieldValues';
import { MetadataReference } from './metadataReference';
import { DBValue } from '../../../db/dbValue';
import { GeoPackageDao } from '../../../db/geoPackageDao';
import type { GeoPackage } from '../../../geoPackage';
import { ReferenceScopeType } from './referenceScopeType';

/**
 * Metadata Reference Data Access Object
 */
export class MetadataReferenceDao extends GeoPackageDao<MetadataReference, void> {
  readonly gpkgTableName: string = MetadataReference.TABLE_NAME;
  readonly idColumns: string[] = [MetadataReference.COLUMN_FILE_ID, MetadataReference.COLUMN_PARENT_ID];

  createObject(results?: Record<string, DBValue>): MetadataReference {
    const mr = new MetadataReference();
    if (results) {
      mr.setReferenceScopeType(ReferenceScopeType.fromName(results.reference_scope as string));
      mr.setTableName(results.table_name as string);
      mr.setColumnName(results.column_name as string);
      mr.setRowIdValue(results.row_id_value as number);
      mr.setTimestamp(new Date(results.timestamp as string));
      mr.setMdFileId(results.md_file_id as number);
      mr.setMdParentId(results.md_parent_id as number);
    }
    return mr;
  }

  /**
   * Constructor
   * @param geoPackage GeoPackage object this dao belongs to
   */
  constructor(geoPackage: GeoPackage) {
    super(geoPackage, MetadataReference.TABLE_NAME);
  }

  public static createDao(geoPackage: GeoPackage): MetadataReferenceDao {
    return new MetadataReferenceDao(geoPackage);
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
    const columnValues = new FieldValues();
    columnValues.addFieldValue(MetadataReference.COLUMN_FILE_ID, fileId);
    columnValues.addFieldValue(MetadataReference.COLUMN_PARENT_ID, parentId);
    return this.queryForFieldValues(columnValues);
  }
  /**
   * @param {Number} fileId
   * @return {Iterable.<Object>}
   */
  queryByMetadata(fileId: number): IterableIterator<any> {
    const columnValues = new FieldValues();
    columnValues.addFieldValue(MetadataReference.COLUMN_FILE_ID, fileId);
    return this.queryForFieldValues(columnValues);
  }
  /**
   * @param {Number} parentId
   * @return {Iterable.<Object>}
   */
  queryByMetadataParent(parentId: number): IterableIterator<any> {
    const columnValues = new FieldValues();
    columnValues.addFieldValue(MetadataReference.COLUMN_PARENT_ID, parentId);
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

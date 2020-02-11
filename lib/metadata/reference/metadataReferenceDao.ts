import { Dao } from '../../dao/dao';

import { ColumnValues } from '../../dao/columnValues';
import { MetadataReference } from './metadataReference';
/**
 * Metadata Reference Data Access Object
 * @class
 * @extends Dao
 */
export class MetadataReferenceDao extends Dao<MetadataReference> {
  public static readonly TABLE_NAME: string = 'gpkg_metadata_reference';
  public static readonly COLUMN_REFERENCE_SCOPE: string = 'reference_scope';
  public static readonly COLUMN_TABLE_NAME: string = 'table_name';
  public static readonly COLUMN_COLUMN_NAME: string = 'column_name';
  public static readonly COLUMN_ROW_ID: string = 'row_id';
  public static readonly COLUMN_TIMESTAMP: string = 'timestamp';
  public static readonly COLUMN_MD_FILE_ID: string = 'md_file_id';
  public static readonly COLUMN_MD_PARENT_ID: string = 'md_parent_id';

  readonly gpkgTableName: string = MetadataReferenceDao.TABLE_NAME;
  readonly idColumns: string[] = [MetadataReferenceDao.COLUMN_MD_FILE_ID, MetadataReferenceDao.COLUMN_MD_PARENT_ID];

  createObject(): MetadataReference {
    return new MetadataReference();
  }
  /**
   * @param {Number} parentId
   * @return {Number} number of rows updated
   */
  removeMetadataParent(parentId: number): number {
    const values = {};
    values[MetadataReferenceDao.COLUMN_MD_PARENT_ID] = null;
    const where = this.buildWhereWithFieldAndValue(MetadataReferenceDao.COLUMN_MD_PARENT_ID, parentId);
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
    columnValues.addColumn(MetadataReferenceDao.COLUMN_MD_FILE_ID, fileId);
    columnValues.addColumn(MetadataReferenceDao.COLUMN_MD_PARENT_ID, parentId);
    return this.queryForFieldValues(columnValues);
  }
  /**
   * @param {Number} fileId
   * @return {Iterable.<Object>}
   */
  queryByMetadata(fileId: number): IterableIterator<any> {
    const columnValues = new ColumnValues();
    columnValues.addColumn(MetadataReferenceDao.COLUMN_MD_FILE_ID, fileId);
    return this.queryForFieldValues(columnValues);
  }
  /**
   * @param {Number} parentId
   * @return {Iterable.<Object>}
   */
  queryByMetadataParent(parentId: number): IterableIterator<any> {
    const columnValues = new ColumnValues();
    columnValues.addColumn(MetadataReferenceDao.COLUMN_MD_PARENT_ID, parentId);
    return this.queryForFieldValues(columnValues);
  }
}

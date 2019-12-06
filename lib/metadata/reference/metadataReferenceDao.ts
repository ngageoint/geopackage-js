import Dao from '../../dao/dao';

import ColumnValues from '../../dao/columnValues';
var MetadataReference = require('./metadataReference');
/**
 * Metadata Reference Data Access Object
 * @class
 * @extends Dao
 */
export default class MetadataReferenceDao extends Dao<typeof MetadataReference> {
  public static readonly TABLE_NAME = "gpkg_metadata_reference";
  public static readonly COLUMN_REFERENCE_SCOPE = "reference_scope";
  public static readonly COLUMN_TABLE_NAME = "table_name";
  public static readonly COLUMN_COLUMN_NAME = "column_name";
  public static readonly COLUMN_ROW_ID = "row_id";
  public static readonly COLUMN_TIMESTAMP = "timestamp";
  public static readonly COLUMN_MD_FILE_ID = "md_file_id";
  public static readonly COLUMN_MD_PARENT_ID = "md_parent_id";


  readonly gpkgTableName = MetadataReferenceDao.TABLE_NAME;
  readonly idColumns = [MetadataReferenceDao.COLUMN_MD_FILE_ID, MetadataReferenceDao.COLUMN_MD_PARENT_ID];

  createObject() {
    return new MetadataReference();
  }
  /**
   * @param {Number} parentId
   * @return {Number} number of rows updated
   */
  removeMetadataParent(parentId) {
    var values = {};
    values[MetadataReferenceDao.COLUMN_MD_PARENT_ID] = null;
    var where = this.buildWhereWithFieldAndValue(MetadataReferenceDao.COLUMN_MD_PARENT_ID, parentId);
    var whereArgs = this.buildWhereArgs(parentId);
    return this.updateWithValues(values, where, whereArgs);
  }
  /**
   * @param {Number} fileId
   * @param {Number} parentId
   * @return {Iterable.<Object>}
   */
  queryByMetadataAndParent(fileId, parentId) {
    var columnValues = new ColumnValues();
    columnValues.addColumn(MetadataReferenceDao.COLUMN_MD_FILE_ID, fileId);
    columnValues.addColumn(MetadataReferenceDao.COLUMN_MD_PARENT_ID, parentId);
    return this.queryForFieldValues(columnValues);
  }
  /**
   * @param {Number} fileId
   * @return {Iterable.<Object>}
   */
  queryByMetadata(fileId) {
    var columnValues = new ColumnValues();
    columnValues.addColumn(MetadataReferenceDao.COLUMN_MD_FILE_ID, fileId);
    return this.queryForFieldValues(columnValues);
  }
  /**
  * @param {Number} parentId
  * @return {Iterable.<Object>}
  */
  queryByMetadataParent(parentId) {
    var columnValues = new ColumnValues();
    columnValues.addColumn(MetadataReferenceDao.COLUMN_MD_PARENT_ID, parentId);
    return this.queryForFieldValues(columnValues);
  }
}

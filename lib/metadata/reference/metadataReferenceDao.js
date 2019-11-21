var Dao = require('../../dao/dao')
  , ColumnValues = require('../../dao/columnValues')
  , MetadataReference = require('./metadataReference');
/**
 * Metadata Reference Data Access Object
 * @class
 * @extends Dao
 */
class MetadataReferenceDao extends Dao {
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

MetadataReferenceDao.TABLE_NAME = "gpkg_metadata_reference";
MetadataReferenceDao.COLUMN_REFERENCE_SCOPE = "reference_scope";
MetadataReferenceDao.COLUMN_TABLE_NAME = "table_name";
MetadataReferenceDao.COLUMN_COLUMN_NAME = "column_name";
MetadataReferenceDao.COLUMN_ROW_ID = "row_id";
MetadataReferenceDao.COLUMN_TIMESTAMP = "timestamp";
MetadataReferenceDao.COLUMN_MD_FILE_ID = "md_file_id";
MetadataReferenceDao.COLUMN_MD_PARENT_ID = "md_parent_id";


MetadataReferenceDao.prototype.gpkgTableName = MetadataReferenceDao.TABLE_NAME;
MetadataReferenceDao.prototype.idColumns = [MetadataReferenceDao.COLUMN_MD_FILE_ID, MetadataReferenceDao.COLUMN_MD_PARENT_ID];

module.exports = MetadataReferenceDao;
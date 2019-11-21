/**
 * MetadataReference module.
 * @module metadata/reference
 * @see module:dao/dao
 */

// eslint-disable-next-line no-unused-vars
var  Metadata = require('../metadata');

/**
 * Links metadata in the gpkg_metadata table to data in the feature, and tiles tables
 * @class MetadataReference
 */
class MetadataReference {
  constructor() {
    /**
     * Lowercase metadata reference scope; one of ‘geopackage’, ‘table’, ‘column’, ’row’, ’row/col’
     * @member {string}
     */
    this.reference_scope = undefined;
    /**
     * Name of the table to which this metadata reference applies, or NULL for reference_scope of ‘geopackage’.
     * @member {string}
     */
    this.table_name = undefined;
    /**
     * Name of the column to which this metadata reference applies; NULL for
     * reference_scope of ‘geopackage’,‘table’ or ‘row’, or the name of a column
     * in the table_name table for reference_scope of ‘column’ or ‘row/col’
     * @member {string}
     */
    this.column_name = undefined;
    /**
     * NULL for reference_scope of ‘geopackage’, ‘table’ or ‘column’, or the
     * rowed of a row record in the table_name table for reference_scope of
     * ‘row’ or ‘row/col’
     * @member {Number}
     */
    this.row_id_value = undefined;
    /**
     * timestamp value in ISO 8601 format as defined by the strftime function
     * '%Y-%m-%dT%H:%M:%fZ' format string applied to the current time
     * @member {Date}
     */
    this.timestamp = undefined;
    /**
     * gpkg_metadata table id column value for the metadata to which this
     * gpkg_metadata_reference applies
     * @member {Number}
     */
    this.md_file_id = undefined;
    /**
     * gpkg_metadata table id column value for the hierarchical parent
     * gpkg_metadata for the gpkg_metadata to which this gpkg_metadata_reference
     * applies, or NULL if md_file_id forms the root of a metadata hierarchy
     * @member {Number}
     */
    this.md_parent_id = undefined;
  }
  /**
   * @param {string} columnName
   */
  toDatabaseValue(columnName) {
    if (columnName === 'timestamp') {
      return this.timestamp.toISOString();
    }
    return this[columnName];
  }
  /**
   * Set the metadata
   * @param  {Metadata} metadata metadata
   */
  setMetadata(metadata) {
    if (metadata) {
      this.md_file_id = metadata.id;
    }
    else {
      this.md_file_id = -1;
    }
  }
  /**
   * Set the parent metadata
   * @param  {Metadata} metadata parent metadata
   */
  setParentMetadata(metadata) {
    if (metadata) {
      this.md_parent_id = metadata.id;
    }
    else {
      this.md_parent_id = -1;
    }
  }
  setReferenceScopeType(referenceScopeType) {
    this.reference_scope = referenceScopeType;
    switch (referenceScopeType) {
    case MetadataReference.GEOPACKAGE:
      this.table_name = undefined;
      this.column_name = undefined;
      this.row_id_value = undefined;
      break;
    case MetadataReference.TABLE:
      this.column_name = undefined;
      this.row_id_value = undefined;
      break;
    case MetadataReference.ROW:
      this.column_name = undefined;
      break;
    case MetadataReference.COLUMN:
      this.row_id_value = undefined;
      break;
    }
  }
}

MetadataReference.GEOPACKAGE = "geopackage";
MetadataReference.TABLE = "table";
MetadataReference.COLUMN = "column";
MetadataReference.ROW = "row";
MetadataReference.ROW_COL = "row/col";

module.exports = MetadataReference;

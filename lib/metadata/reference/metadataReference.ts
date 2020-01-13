/**
 * MetadataReference module.
 * @module metadata/reference
 * @see module:dao/dao
 */
import { Metadata } from '../metadata';

/**
 * Links metadata in the gpkg_metadata table to data in the feature, and tiles tables
 * @class MetadataReference
 */
export class MetadataReference {
  public static readonly GEOPACKAGE: string = "geopackage";
  public static readonly TABLE: string = "table";
  public static readonly COLUMN: string = "column";
  public static readonly ROW: string = "row";
  public static readonly ROW_COL: string = "row/col";

  /**
   * Lowercase metadata reference scope; one of ‘geopackage’, ‘table’, ‘column’, ’row’, ’row/col’
   * @member {string}
   */
  reference_scope: string;
  /**
   * Name of the table to which this metadata reference applies, or NULL for reference_scope of ‘geopackage’.
   * @member {string}
   */
  table_name: string;
  /**
   * Name of the column to which this metadata reference applies; NULL for
   * reference_scope of ‘geopackage’,‘table’ or ‘row’, or the name of a column
   * in the table_name table for reference_scope of ‘column’ or ‘row/col’
   * @member {string}
   */
  column_name: string;
  /**
   * NULL for reference_scope of ‘geopackage’, ‘table’ or ‘column’, or the
   * rowed of a row record in the table_name table for reference_scope of
   * ‘row’ or ‘row/col’
   * @member {Number}
   */
  row_id_value: number;
  /**
   * timestamp value in ISO 8601 format as defined by the strftime function
   * '%Y-%m-%dT%H:%M:%fZ' format string applied to the current time
   * @member {Date}
   */
  timestamp: Date;
  /**
   * gpkg_metadata table id column value for the metadata to which this
   * gpkg_metadata_reference applies
   * @member {Number}
   */
  md_file_id: number;
  /**
   * gpkg_metadata table id column value for the hierarchical parent
   * gpkg_metadata for the gpkg_metadata to which this gpkg_metadata_reference
   * applies, or NULL if md_file_id forms the root of a metadata hierarchy
   * @member {Number}
   */
  md_parent_id: number;
  /**
   * @param {string} columnName
   */
  toDatabaseValue(columnName: string): any {
    if (columnName === 'timestamp') {
      return this.timestamp.toISOString();
    }
    return this[columnName];
  }
  /**
   * Set the metadata
   * @param  {Metadata} [metadata] metadata
   */
  setMetadata(metadata?: Metadata) {
    if (metadata) {
      this.md_file_id = metadata.id;
    }
    else {
      this.md_file_id = -1;
    }
  }
  /**
   * Set the parent metadata
   * @param  {Metadata} [metadata] parent metadata
   */
  setParentMetadata(metadata?: Metadata) {
    if (metadata) {
      this.md_parent_id = metadata.id;
    }
    else {
      this.md_parent_id = -1;
    }
  }
  setReferenceScopeType(referenceScopeType: string) {
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

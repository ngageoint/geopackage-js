/**
 * MetadataReference module.
 * @module metadata/reference
 * @see module:dao/dao
 */
import { Metadata } from '../metadata';
import { DBValue } from '../../../db/dbValue';
import { ReferenceScopeType } from './referenceScopeType';

type MetadataReferenceKeys =
  | 'reference_scope'
  | 'table_name'
  | 'column_name'
  | 'row_id_value'
  | 'timestamp'
  | 'md_file_id'
  | 'md_parent_id';
/**
 * Links metadata in the gpkg_metadata table to data in the feature, and tiles tables
 * @class MetadataReference
 */
export class MetadataReference {
  /**
   * Table name
   */
  public static readonly TABLE_NAME = 'gpkg_metadata_reference';

  /**
   * referenceScope field name
   */
  public static readonly COLUMN_REFERENCE_SCOPE = 'reference_scope';

  /**
   * tableName field name
   */
  public static readonly COLUMN_TABLE_NAME = 'table_name';

  /**
   * columnName field name
   */
  public static readonly COLUMN_COLUMN_NAME = 'column_name';

  /**
   * rowIdValue field name
   */
  public static readonly COLUMN_ROW_ID_VALUE = 'row_id_value';

  /**
   * timestamp field name
   */
  public static readonly COLUMN_TIMESTAMP = 'timestamp';

  /**
   * mdFileId field name
   */
  public static readonly COLUMN_FILE_ID = 'md_file_id';

  /**
   * mdParentId field name
   */
  public static readonly COLUMN_PARENT_ID = 'md_parent_id';

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
  toDatabaseValue(columnName: MetadataReferenceKeys): DBValue {
    if (columnName === 'timestamp') {
      return this.timestamp.toISOString();
    }
    return this[columnName];
  }
  /**
   * Set the metadata
   * @param  {Metadata} [metadata] metadata
   */
  setMetadata(metadata?: Metadata): void {
    if (metadata) {
      this.md_file_id = metadata.id;
    } else {
      this.md_file_id = -1;
    }
  }
  /**
   * Set the parent metadata
   * @param  {Metadata} [metadata] parent metadata
   */
  setParentMetadata(metadata?: Metadata): void {
    if (metadata) {
      this.md_parent_id = metadata.id;
    } else {
      this.md_parent_id = -1;
    }
  }
  setReferenceScopeType(referenceScopeType: ReferenceScopeType): void {
    this.reference_scope = referenceScopeType;
    switch (referenceScopeType) {
      case ReferenceScopeType.GEOPACKAGE:
        this.table_name = undefined;
        this.column_name = undefined;
        this.row_id_value = undefined;
        break;
      case ReferenceScopeType.TABLE:
        this.column_name = undefined;
        this.row_id_value = undefined;
        break;
      case ReferenceScopeType.ROW:
        this.column_name = undefined;
        break;
      case ReferenceScopeType.COLUMN:
        this.row_id_value = undefined;
        break;
    }
  }
}

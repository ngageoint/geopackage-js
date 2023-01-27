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
      this.md_file_id = metadata.getId();
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
      this.md_parent_id = metadata.getId();
    } else {
      this.md_parent_id = -1;
    }
  }

  /**
   * Setter for the table name
   * @param tableName
   */
  setTableName(tableName: string): void {
    this.table_name = tableName;
  }

  /**
   * Getter for the table name
   */
  getTableName(): string {
    return this.table_name;
  }

  /**
   * Set the reference scope type
   * @param referenceScopeType
   */
  setReferenceScopeType(referenceScopeType: ReferenceScopeType): void {
    this.reference_scope = ReferenceScopeType.nameFromType(referenceScopeType).toLowerCase();
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

  /**
   * Getter for the reference scope type
   */
  getReferenceScopeType(): string {
    return ReferenceScopeType.fromName(this.reference_scope);
  }

  /**
   * Setter for the column name
   * @param columnName
   */
  setColumnName(columnName: string): void {
    this.column_name = columnName;
  }

  /**
   * Getter for the column name
   */
  getColumnName(): string {
    return this.column_name;
  }

  /**
   * Setter for the row id value
   * @param rowIdValue
   */
  setRowIdValue(rowIdValue: number): void {
    this.row_id_value = rowIdValue;
  }

  /**
   * Getter for the row id value
   */
  getRowIdValue(): number {
    return this.row_id_value;
  }

  /**
   * Setter for the timestamp
   * @param date
   */
  setTimestamp(date: Date): void {
    this.timestamp = date;
  }

  /**
   * Getter for the timestamp
   */
  getTimestamp(): Date {
    return this.timestamp;
  }

  /**
   * Setter the metadata file id
   * @param mdFileId
   */
  setMdFileId(mdFileId: number): void {
    this.md_file_id = mdFileId;
  }

  /**
   * Getter for the metadata file id
   */
  getMdFileId(): number {
    return this.md_file_id;
  }

  /**
   * Setter for the metadata parent id
   * @param mdParentId
   */
  setMdParentId(mdParentId: number): void {
    this.md_parent_id = mdParentId;
  }

  /**
   * Getter for the metadata parent id
   */
  getMdParentId(): number {
    return this.md_parent_id;
  }
}

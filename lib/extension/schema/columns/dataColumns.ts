import { Contents } from '../../../contents/contents';
import { TableColumnKey } from '../../../db/tableColumnKey';
import { DataColumnConstraints } from '../constraints/dataColumnConstraints';
import type { DataColumnConstraintsDao } from '../constraints/dataColumnConstraintsDao';

/**
 * Stores minimal application schema identifying, descriptive and MIME type
 * information about columns in user vector feature and tile matrix data tables
 * that supplements the data available from the SQLite sqlite_master table and
 * pragma table_info(table_name) SQL function. The gpkg_data_columns data CAN be
 * used to provide more specific column data types and value ranges and
 * application specific structural and semantic information to enable more
 * informative user menu displays and more effective user decisions on the
 * suitability of GeoPackage contents for specific purposes.
 * @class DataColumns
 */
export class DataColumns {
  /**
   * Table name
   */
  public static readonly TABLE_NAME = 'gpkg_data_columns';

  /**
   * tableName field name
   */
  public static readonly COLUMN_TABLE_NAME = Contents.COLUMN_TABLE_NAME;

  /**
   * columnName field name
   */
  public static readonly COLUMN_COLUMN_NAME = 'column_name';

  /**
   * id 1 field name, tableName
   */
  public static readonly COLUMN_ID_1 = DataColumns.COLUMN_TABLE_NAME;

  /**
   * id 2 field name, columnName
   */
  public static readonly COLUMN_ID_2 = DataColumns.COLUMN_COLUMN_NAME;

  /**
   * name field name
   */
  public static readonly COLUMN_NAME = 'name';

  /**
   * title field name
   */
  public static readonly COLUMN_TITLE = 'title';

  /**
   * description field name
   */
  public static readonly COLUMN_DESCRIPTION = 'description';

  /**
   * mimeType field name
   */
  public static readonly COLUMN_MIME_TYPE = 'mime_type';

  /**
   * constraintName field name
   */
  public static readonly COLUMN_CONSTRAINT_NAME = 'constraint_name';

  /**
   * the name of the tiles, or feature table
   * @member {string}
   */
  table_name: string;

  /**
   * the name of the table column
   * @member {string}
   */
  column_name: string;

  /**
   * A human-readable identifier (e.g. short name) for the column_name content
   * @member {string}
   */
  name: string;

  /**
   * A human-readable formal title for the column_name content
   * @member {string}
   */
  title: string;

  /**
   * A human-readable description for the table_name contents
   * @member {string}
   */
  description: string;

  /**
   * MIME type of columnName if BLOB type or NULL for other types
   * @member {string}
   */
  mime_type: string;

  /**
   * Case sensitive column value constraint name specified
   */
  constraint_name: string;

  /**
   * Default Constructor
   */
  public constructor();

  /**
   * Copy Constructor
   * @param dataColumns data columns to copy
   */
  public constructor(dataColumns: DataColumns);

  /**
   * Constructor
   * @param args
   */
  constructor(...args) {
    if (args.length === 1 && args[0] instanceof DataColumns) {
      const dataColumns = args[0];
      this.table_name = dataColumns.table_name;
      this.column_name = dataColumns.column_name;
      this.name = dataColumns.name;
      this.title = dataColumns.title;
      this.description = dataColumns.description;
      this.mime_type = dataColumns.mime_type;
      this.constraint_name = dataColumns.constraint_name;
    }
  }

  /**
   * Get the id
   *
   * @return table column key
   */
  public getId(): TableColumnKey {
    return new TableColumnKey(this.table_name, this.column_name);
  }

  /**
   * Set the id
   * @param id id
   */
  public setId(id: TableColumnKey): void {
    this.table_name = id.getTableName();
    this.column_name = id.getColumnName();
  }

  public getTableName(): string {
    return this.table_name;
  }

  public setTableName(tableName: string): void {
    this.table_name = tableName;
  }

  public getColumnName(): string {
    return this.column_name;
  }

  public setColumnName(columnName: string): void {
    this.column_name = columnName;
  }

  public getName(): string {
    return this.name;
  }

  public setName(name: string): void {
    this.name = name;
  }

  public getTitle(): string {
    return this.title;
  }

  public setTitle(title: string): void {
    this.title = title;
  }

  public getDescription(): string {
    return this.description;
  }

  public setDescription(description: string): void {
    this.description = description;
  }

  public getMimeType(): string {
    return this.mime_type;
  }

  public setMimeType(mimeType: string): void {
    this.mime_type = mimeType;
  }

  public getConstraintName(): string {
    return this.constraint_name;
  }

  public setConstraint(constraint: DataColumnConstraints): void {
    let name = null;
    if (constraint != null) {
      name = constraint.getConstraintName();
    }
    this.setConstraintName(name);
  }

  public setConstraintName(constraintName: string): void {
    this.constraint_name = constraintName;
  }

  public getConstraints(dao: DataColumnConstraintsDao): DataColumnConstraints[] {
    const constraints = [];
    if (this.constraint_name != null) {
      for (const constraint of dao.queryByConstraintName(this.constraint_name)) {
        constraints.push(constraint);
      }
    }
    return constraints;
  }
}

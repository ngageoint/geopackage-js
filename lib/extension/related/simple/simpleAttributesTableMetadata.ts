import { UserCustomColumn } from '../../../user/custom/userCustomColumn';
import { UserTableMetadata } from '../../../user/userTableMetadata';
import { SimpleAttributesTable } from './simpleAttributesTable';

/**
 * Simple Attributes Table Metadata for defining table creation information
 */
export class SimpleAttributesTableMetadata extends UserTableMetadata<UserCustomColumn> {
  public static create(): SimpleAttributesTableMetadata;
  public static create(tableName: string): SimpleAttributesTableMetadata;
  public static create(tableName: string, autoincrement: boolean): SimpleAttributesTableMetadata;
  public static create(tableName: string, columns: UserCustomColumn[]): SimpleAttributesTableMetadata;
  public static create(
    tableName: string,
    autoincrement: boolean,
    columns: UserCustomColumn[],
  ): SimpleAttributesTableMetadata;
  public static create(
    tableName: string,
    idColumnName: string,
    columns: UserCustomColumn[],
  ): SimpleAttributesTableMetadata;
  public static create(
    tableName: string,
    idColumnName: string,
    autoincrement: boolean,
    columns: UserCustomColumn[],
  ): SimpleAttributesTableMetadata;

  /**
   * Create metadata
   * @param args
   * @return SimpleAttributesTableMetadata
   */
  public static create(...args): SimpleAttributesTableMetadata {
    let simpleAttributesTableMetadata = null;
    if (args.length === 0) {
      simpleAttributesTableMetadata = new SimpleAttributesTableMetadata();
    } else if (args.length === 1) {
      const tableName = args[0];
      simpleAttributesTableMetadata = new SimpleAttributesTableMetadata(tableName, null, null);
    } else if (args.length === 2) {
      const tableName = args[0];
      if (typeof args[1] === 'boolean') {
        const autoincrement = args[1];
        simpleAttributesTableMetadata = new SimpleAttributesTableMetadata(tableName, null, autoincrement, null);
      } else if (args[1].length != null) {
        const columns = args[1];
        simpleAttributesTableMetadata = new SimpleAttributesTableMetadata(tableName, null, columns);
      }
    } else if (args.length === 3) {
      const tableName = args[0];
      if (typeof args[1] === 'boolean') {
        const autoincrement = args[1];
        const columns = args[2];
        simpleAttributesTableMetadata = new SimpleAttributesTableMetadata(tableName, null, autoincrement, columns);
      } else {
        const idColumnName = args[1];
        const columns = args[2];
        simpleAttributesTableMetadata = new SimpleAttributesTableMetadata(tableName, idColumnName, columns);
      }
    } else if (args.length === 4) {
      const tableName = args[0];
      const idColumnName = args[1];
      const autoincrement = args[2];
      const columns = args[3];
      simpleAttributesTableMetadata = new SimpleAttributesTableMetadata(
        tableName,
        idColumnName,
        autoincrement,
        columns,
      );
    }

    return simpleAttributesTableMetadata;
  }

  /**
   * Constructor
   */
  public constructor();
  /**
   * Constructor
   *
   * @param tableName table name
   * @param idColumnName  id column name
   * @param columns columns
   */
  public constructor(tableName: string, idColumnName: string, columns: UserCustomColumn[]);
  /**
   * Constructor
   *
   * @param tableName table name
   * @param idColumnName id column name
   * @param autoincrement autoincrement ids
   * @param columns columns
   */
  public constructor(tableName: string, idColumnName: string, autoincrement: boolean, columns: UserCustomColumn[]);

  /**
   * Constructor
   * @param args
   */
  public constructor(...args) {
    super();
    if (args.length === 3) {
      this.tableName = args[0];
      this.idColumnName = args[1];
      this.additionalColumns = args[2];
    } else if (args.length === 4) {
      this.tableName = args[0];
      this.idColumnName = args[1];
      this.autoincrement = args[2];
      this.additionalColumns = args[3];
    }
  }

  /**
   * {@inheritDoc}
   */
  public getDefaultDataType(): string {
    return null;
  }

  /**
   * {@inheritDoc}
   */
  public buildColumns(): UserCustomColumn[] {
    let simpleAttributeColumns = this.getColumns();
    if (simpleAttributeColumns == null) {
      simpleAttributeColumns = [];
      simpleAttributeColumns.push(
        ...SimpleAttributesTable.createRequiredColumns(this.getIdColumnName(), this.isAutoincrement()),
      );

      const additional = this.getAdditionalColumns();
      if (additional != null) {
        simpleAttributeColumns.push(...additional);
      }
    }

    return simpleAttributeColumns;
  }
}

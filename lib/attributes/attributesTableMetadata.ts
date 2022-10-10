import { ContentsDataType } from '../contents/contentsDataType';
import { Constraints } from '../db/table/constraints';
import { UserTableMetadata } from '../user/userTableMetadata';
import { AttributesColumn } from './attributesColumn';
import { AttributesTable } from './attributesTable';
import { AttributesColumns } from './attributesColumns';

/**
 * Attributes Table Metadata for defining table creation information
 */
export class AttributesTableMetadata extends UserTableMetadata<AttributesColumn> {
  /**
   * Default data type
   */
  public static readonly DEFAULT_DATA_TYPE = ContentsDataType.nameFromType(ContentsDataType.ATTRIBUTES);

  /**
   * Constructor
   * @param tableName table name
   * @param additionalColumns additional columns
   * @param constraints: Constraints
   * @param idColumnName id column name
   * @param autoincrement autoincrement ids
   * @return metadata
   */
  public static create(
    tableName?: string,
    additionalColumns?: AttributesColumn[],
    constraints?: Constraints,
    idColumnName?: string,
    autoincrement?: boolean,
  ): AttributesTableMetadata {
    return new AttributesTableMetadata(null, tableName, idColumnName, additionalColumns, constraints, autoincrement);
  }

  /**
   * Constructor
   * @param columns columns
   * @param constraints constraints
   * @param autoincrement autoincrement ids
   * @return metadata
   */
  public static createWithColumnsAndConstraints(
    columns: AttributesColumns,
    constraints: Constraints,
    autoincrement = false,
  ): AttributesTableMetadata {
    return new AttributesTableMetadata(
      null,
      columns.getTableName(),
      columns.getPkColumnName(),
      columns.getColumns(),
      constraints,
      autoincrement,
    );
  }

  /**
   * Create metadata
   * @param table attributes table
   * @param autoincrement autoincrement ids
   * @return metadata
   */
  public static createWithTable(table: AttributesTable, autoincrement = false): AttributesTableMetadata {
    return new AttributesTableMetadata(
      null,
      table.getTableName(),
      table.getPkColumnName(),
      table.getColumns(),
      table.getConstraints(),
      autoincrement,
    );
  }

  /**
   * Create metadata
   * @param dataType data type
   * @param tableName table name
   * @param idColumnName id column name
   * @param additionalColumns additional columns
   * @param constraints constraints
   * @param autoincrement autoincrement ids
   * @return metadata
   */
  public static createTyped(
    dataType?: string,
    tableName?: string,
    idColumnName?: string,
    additionalColumns?: AttributesColumn[],
    constraints?: Constraints,
    autoincrement?: boolean,
  ): AttributesTableMetadata {
    return new AttributesTableMetadata(
      dataType,
      tableName,
      idColumnName,
      additionalColumns,
      constraints,
      autoincrement,
    );
  }

  /**
   * Create metadata
   *
   * @param dataType
   *            data type
   * @param columns
   *            columns
   * @param constraints
   *            constraints
   * @param autoincrement autoincrement ids
   * @return metadata
   */
  public static createTypedWithColumnsAndConstraints(
    dataType: string,
    columns: AttributesColumns,
    constraints?: Constraints,
    autoincrement = false,
  ): AttributesTableMetadata {
    return new AttributesTableMetadata(
      dataType,
      columns.getTableName(),
      columns.getPkColumnName(),
      columns.getColumns(),
      constraints,
      autoincrement,
    );
  }

  /**
   * Create metadata
   *
   * @param dataType
   *            data type
   * @param table
   *            attributes table
   * @param autoincrement autoincrement ids
   * @return metadata
   */
  public static createTypedWithTable(
    dataType: string,
    table: AttributesTable,
    autoincrement = false,
  ): AttributesTableMetadata {
    return new AttributesTableMetadata(
      dataType,
      table.getTableName(),
      table.getPkColumnName(),
      table.getColumns(),
      table.getConstraints(),
      autoincrement,
    );
  }

  /**
   * Constraints
   */
  protected constraints: Constraints;

  /**
   * Constructor
   */
  public constructor();

  /**
   * Constructor
   *
   * @param dataType data type
   * @param tableName table name
   * @param idColumnName id column name
   * @param additionalColumns additional columns
   * @param constraints constraints
   * @param autoincrement autoincrement ids
   */
  public constructor(
    dataType: string,
    tableName: string,
    idColumnName: string,
    additionalColumns: AttributesColumn[],
    constraints: Constraints,
    autoincrement: boolean,
  );

  /**
   * Constructor
   * @param args
   */
  public constructor(...args) {
    super();
    if (args.length === 6) {
      this.dataType = args[0];
      this.tableName = args[1];
      this.idColumnName = args[2];
      this.additionalColumns = args[3];
      this.constraints = args[4];
      this.autoincrement = args[5];
    }
  }

  /**
   * Get the default data type
   * @return default data type
   */
  public getDefaultDataType(): string {
    return AttributesTableMetadata.DEFAULT_DATA_TYPE;
  }

  /**
   * {@inheritDoc}
   */
  public buildColumns(): AttributesColumn[] {
    let attributesColumns = this.getColumns();

    if (attributesColumns == null) {
      attributesColumns = [];
      attributesColumns.push(
        AttributesColumn.createPrimaryKeyColumn(this.getIdColumnName(), this.isAutoincrement()),
      );
      const additional = this.getAdditionalColumns();
      if (additional != null) {
        attributesColumns.push(...additional);
      }
    }
    return attributesColumns;
  }

  /**
   * Get the constraints
   * @return constraints
   */
  public getConstraints(): Constraints {
    return this.constraints;
  }

  /**
   * Set the constraints
   * @param constraints: Constraints
   */
  public setConstraints(constraints: Constraints): void {
    this.constraints = constraints;
  }
}

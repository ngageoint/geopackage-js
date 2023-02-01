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
    return new AttributesTableMetadata(tableName, additionalColumns, idColumnName, null, constraints, autoincrement);
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
      columns.getTableName(),
      columns.getColumns(),
      columns.getPkColumnName(),
      null,
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
      table.getTableName(),
      table.getColumns(),
      table.getPkColumnName(),
      null,
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
      tableName,
      additionalColumns,
      idColumnName,
      dataType,
      constraints,
      autoincrement,
    );
  }

  /**
   * Create metadata
   *
   * @param dataType data type
   * @param columns columns
   * @param constraints constraints
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
      columns.getTableName(),
      columns.getColumns(),
      columns.getPkColumnName(),
      dataType,
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
      table.getTableName(),
      table.getColumns(),
      table.getPkColumnName(),
      dataType,
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
   * @param tableName table name
   * @param additionalColumns additional columns
   * @param idColumnName id column name
   * @param dataType data type
   * @param constraints constraints
   * @param autoincrement autoincrement ids
   */
  public constructor(
    tableName?: string,
    additionalColumns?: AttributesColumn[],
    idColumnName?: string,
    dataType?: string,
    constraints?: Constraints,
    autoincrement?: boolean,
  ) {
    super();
    this.dataType = dataType;
    this.tableName = tableName;
    this.idColumnName = idColumnName;
    this.additionalColumns = additionalColumns;
    this.constraints = constraints;
    this.autoincrement = autoincrement;
  }

  /**
   * Get the default data type
   * @return default data type
   */
  public getDefaultDataType(): string {
    return AttributesTableMetadata.DEFAULT_DATA_TYPE;
  }

  /**
   * @inheritDoc
   */
  public buildColumns(): AttributesColumn[] {
    let attributesColumns = this.getColumns();

    if (attributesColumns == null) {
      attributesColumns = [];
      attributesColumns.push(AttributesColumn.createPrimaryKeyColumn(this.getIdColumnName(), this.isAutoincrement()));
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

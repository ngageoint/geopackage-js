/**
 * Table Index object, for indexing data within user tables
 */
import { GeometryIndex } from './geometryIndex';

export class TableIndex {
  /**
   * Table name
   */
  public static readonly TABLE_NAME = 'nga_table_index';

  /**
   * tableName field name
   */
  public static readonly COLUMN_TABLE_NAME = 'table_name';

  /**
   * Last indexed column
   */
  public static readonly COLUMN_LAST_INDEXED = 'last_indexed';

  /**
   * Name of the table
   */
  private table_name: string;

  /**
   * Last indexed date
   */
  private last_indexed: Date;

  /**
   * Geometry Indices
   */
  private geometryIndices: GeometryIndex[];

  public constructor();
  public constructor(tableIndex: TableIndex);

  public constructor(...args) {
    if (args.length === 1 && args[0] instanceof TableIndex) {
      const tableIndex = args[0];
      this.table_name = tableIndex.table_name;
      this.last_indexed = new Date(tableIndex.last_indexed);
      this.geometryIndices = tableIndex.getGeometryIndices().slice();
    }
  }

  /**
   * Get the table name
   *
   * @return table name
   */
  public getTableName(): string {
    return this.table_name;
  }

  /**
   * Set the table name
   *
   * @param tableName
   *            table name
   */
  public setTableName(tableName: string): void {
    this.table_name = tableName;
  }

  /**
   * Get the last indexed date
   *
   * @return last indexed date
   */
  public getLastIndexed(): Date {
    return this.last_indexed;
  }

  /**
   * Set the last indexed date
   *
   * @param lastIndexed
   *            last indexed date
   */
  public setLastIndexed(lastIndexed: Date): void {
    this.last_indexed = lastIndexed;
  }

  /**
   * Get the Geometry Indices
   *
   * @return collection of geometry indices
   */
  public getGeometryIndices(): GeometryIndex[] {
    return this.geometryIndices;
  }
}

import { AttributesTable } from './attributesTable';
import { UserRow } from '../user/userRow';
import { AttributesColumns } from './attributesColumns';
import { AttributesColumn } from './attributesColumn';

/**
 * Attribute Row containing the values from a single result set row
 * @class AttributesRow
 * @param  {module:attributes/attributesTable~AttributeTable} attributeTable attribute table
 * @param  {module:db/geoPackageDataType[]} columnTypes  column types
 * @param  {module:dao/columnValues~ColumnValues[]} values      values
 */
export class AttributesRow extends UserRow<AttributesColumn, AttributesTable> {
  /**
   * Constructor
   * @param table attributes table
   * @param columns columns
   * @param columnTypes column types
   * @param values values
   */
  public constructor(table: AttributesTable, columns: AttributesColumns, columnTypes: number[], values: any[]);

  /**
   * Constructor to create an empty row
   * @param table attributes table
   */
  public constructor(table: AttributesTable);

  /**
   * Copy Constructor
   * @param attributesRow attributes row to copy
   */
  public constructor(attributesRow: AttributesRow);

  /**
   * Constructor
   * @param args
   */
  public constructor(...args) {
    if (args.length === 1) {
      super(args[0]);
    } else if (args.length === 4) {
      super(args[0], args[1], args[2], args[3]);
    }
  }

  /**
   * {@inheritDoc}
   */
  public getColumns(): AttributesColumns {
    return super.getColumns() as AttributesColumns;
  }

  /**
   * Copy the row
   * @return row copy
   */
  public copy(): AttributesRow {
    return new AttributesRow(this);
  }
}

import { UserTableReader } from '../../user/userTableReader';
import { FeatureColumn } from './featureColumn';
import { FeatureTable } from './featureTable';
import { GeometryColumns } from '../columns/geometryColumns';
import { TableColumn } from '../../db/table/tableColumn';

/**
 * Reads the metadata from an existing feature table
 */
export class FeatureTableReader extends UserTableReader<FeatureColumn, FeatureTable> {
  /**
   * Geometry column name
   */
  private readonly columnName: string;

  /**
   * Constructor
   * @param geometryColumns geometry columns
   */
  public constructor(geometryColumns: GeometryColumns);

  /**
   * Constructor
   * @param tableName table name
   * @param geometryColumnName geometry column name
   */
  public constructor(tableName: string, geometryColumnName: string);

  /**
   * Constructor, uses first or only found geometry column
   * @param tableName table name
   */
  public constructor(tableName: string);

  /**
   * Constructor
   * @param args
   */
  public constructor(...args) {
    if (args.length === 1) {
      if (typeof args[0] === 'string') {
        super(args[0]);
      } else if (args[0] instanceof GeometryColumns) {
        const geometryColumns = args[0];
        super(geometryColumns.getTableName());
        this.columnName = geometryColumns.getColumnName();
      }
    } else if (args.length === 2) {
      super(args[0]);
      this.columnName = args[1];
    }
  }

  /**
   * @inheritDoc
   */
  public createTable(tableName: string, columnList: FeatureColumn[]): FeatureTable {
    return new FeatureTable(tableName, this.columnName, columnList);
  }

  /**
   * @inheritDoc
   */
  public createColumn(tableColumn: TableColumn): FeatureColumn {
    return FeatureColumn.createColumnWithTableColumn(tableColumn);
  }
}

/**
 * featureTable module.
 * @module features/user/featureTable
 */
import { UserTable } from '../../user/userTable';
import { FeatureColumn } from './featureColumn';
import { FeatureColumns } from './featureColumns';
import { Contents } from '../../contents/contents';
import { ContentsDataType } from '../../contents/contentsDataType';
import { GeometryColumns } from '../columns/geometryColumns';

/**
 * Represents a user feature table
 * @param  {string} tableName table name
 * @param  {array} columns   feature columns
 */
export class FeatureTable extends UserTable<FeatureColumn> {
  /**
   * Constructor
   * @param geometryColumns geometry columns
   * @param columns  feature columns
   */
  public constructor(geometryColumns: GeometryColumns, columns: FeatureColumn[]);

  /**
   * Constructor
   * @param tableName table name
   * @param columns feature columns
   */
  public constructor(tableName: string, columns: FeatureColumn[]);

  /**
   * Constructor
   * @param tableName table name
   * @param geometryColumn geometry column
   * @param columns feature columns
   */
  public constructor(tableName: string, geometryColumn: string, columns: FeatureColumn[]);

  /**
   * Copy Constructor
   * @param featureTable feature table
   */
  public constructor(featureTable: FeatureTable);

  /**
   * Constructor
   * @param args
   */
  public constructor(...args) {
    if (args.length === 1) {
      super(args[0]);
    } else if (args.length === 2) {
      if (args[0] instanceof GeometryColumns) {
        const geometryColumn = args[0];
        const columns: FeatureColumn[] = args[1];
        super(new FeatureColumns(geometryColumn.getTableName(), geometryColumn.getColumnName(), columns, false));
      } else if (typeof args[0] === 'string') {
        const tableName = args[0];
        const columns: FeatureColumn[] = args[1];
        super(new FeatureColumns(args[0], undefined, columns, false));
      }
    } else if (args.length === 3) {
      const tableName = args[0];
      const geometryColumn = args[1];
      const columns: FeatureColumn[] = args[2];
      super(new FeatureColumns(args[0], geometryColumn, columns, false));
    }
  }

  copy(): FeatureTable {
    return new FeatureTable(this.getTableName(), this.getGeometryColumnName(), this.getUserColumns().getColumns());
  }

  /**
   * {@inheritDoc}
   */
  public getDataType(): string {
    return this.getDataTypeOrDefault(ContentsDataType.nameFromType(ContentsDataType.FEATURES));
  }

  /**
   * {@inheritDoc}
   */
  public getUserColumns(): FeatureColumns {
    return super.getUserColumns() as FeatureColumns;
  }

  /**
   * {@inheritDoc}
   */
  public createUserColumns(columns: FeatureColumn[]): FeatureColumns {
    return new FeatureColumns(this.getTableName(), this.getGeometryColumnName(), columns, true);
  }

  /**
   * Get the geometry column index
   * @return geometry column index
   */
  getGeometryColumnIndex(): number {
    return this.getUserColumns().getGeometryIndex();
  }

  /**
   * Get the geometry feature column
   * @return geometry feature column
   */
  getGeometryColumn(): FeatureColumn {
    return this.getUserColumns().getGeometryColumn();
  }

  /**
   * Get the geometry column name
   * @return geometry column name
   */
  getGeometryColumnName(): string {
    return this.getUserColumns().getGeometryColumnName();
  }

  /**
   * Get the Id and Geometry Column names
   * @return column names
   */
  getIdAndGeometryColumnNames(): string[] {
    return [this.getPkColumnName(), this.getGeometryColumnName()];
  }

  /**
   * {@inheritDoc}
   */
  validateContents(contents: Contents): void {
    // Verify the Contents have a features data type
    const dataType = contents.getDataType();
    if (dataType === null || dataType === undefined || dataType !== ContentsDataType.FEATURES) {
      throw new Error('The Contents of a FeatureTable must have a data type of ' + ContentsDataType.FEATURES);
    }
  }
}

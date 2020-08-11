/**
 * featureTable module.
 * @module features/user/featureTable
 */
import { UserTable } from '../../user/userTable';
import { FeatureColumn } from './featureColumn';
import { FeatureColumns } from './featureColumns';
import { Contents } from '../../core/contents/contents';
import { ContentsDataType } from '../../core/contents/contentsDataType';

/**
 * Represents a user feature table
 * @param  {string} tableName table name
 * @param  {array} columns   feature columns
 */
export class FeatureTable extends UserTable<FeatureColumn> {
  constructor(tableName: string, geometryColumn: string, columns: FeatureColumn[]) {
    super(new FeatureColumns(tableName, geometryColumn, columns, false));
  }

  copy(): FeatureTable {
    return new FeatureTable(this.getTableName(), this.getGeometryColumnName(), this.getUserColumns().getColumns());
  }

  /**
   * Get the geometry column index
   * @return geometry column index
   */
  getGeometryColumnIndex(): number {
    return this.getUserColumns().getGeometryIndex();
  }

  /**
   * {@inheritDoc}
   */
  getUserColumns(): FeatureColumns {
    return super.getUserColumns() as FeatureColumns;
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
    return [ this.getPkColumnName(), this.getGeometryColumnName() ];
  }

  /**
   * {@inheritDoc}
   */
  validateContents(contents: Contents) {
    // Verify the Contents have a features data type
    const dataType = contents.data_type;
    if (dataType === null || dataType === undefined || dataType !== ContentsDataType.FEATURES) {
    throw new Error('The Contents of a '
        + 'FeatureTable'
        + ' must have a data type of '
        + ContentsDataType.FEATURES);
    }
  }

}

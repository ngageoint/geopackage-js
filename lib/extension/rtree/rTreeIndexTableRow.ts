import { UserCustomRow } from '../../user/custom/userCustomRow';
import { RTreeIndexExtension } from './rtreeIndexExtension';

/**
 * RTree Index Table Row containing the values from a single result set row
 */
export class RTreeIndexTableRow extends UserCustomRow {
  /**
   * Constructor
   * @param userCustomRow user custom row
   */
  constructor(userCustomRow: UserCustomRow) {
    super(
      userCustomRow.getTable(),
      userCustomRow.getColumns(),
      userCustomRow.getRowColumnTypes(),
      userCustomRow.getValues(),
    );
  }

  /**
   * Get the ID
   *
   * @return ID
   */
  public getId(): number {
    return this.getValueWithColumnName(RTreeIndexExtension.COLUMN_ID) as number;
  }

  /**
   * Get the min x
   *
   * @return min x
   */
  public getMinX(): number {
    return this.getValueWithColumnName(RTreeIndexExtension.COLUMN_MIN_X) as number;
  }

  /**
   * Get the max x
   *
   * @return max x
   */
  public getMaxX(): number {
    return this.getValueWithColumnName(RTreeIndexExtension.COLUMN_MAX_X) as number;
  }

  /**
   * Get the min y
   *
   * @return min y
   */
  public getMinY(): number {
    return this.getValueWithColumnName(RTreeIndexExtension.COLUMN_MIN_Y) as number;
  }

  /**
   * Get the max y
   *
   * @return max y
   */
  public getMaxY(): number {
    return this.getValueWithColumnName(RTreeIndexExtension.COLUMN_MAX_Y) as number;
  }
}

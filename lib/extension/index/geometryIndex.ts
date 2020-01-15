import { TableIndex } from './tableIndex';

/**
 * Geometry Index object, for indexing data within user tables
 * @class
 */
export class GeometryIndex {
  /**
   * Name of the table
   * @member {String}
   */
  table_name: string;
  /**
   * Geometry Id column
   * @member {Number}
   */
  geom_id: number;
  /**
   * Min X
   * @member {Number}
   */
  min_x: number;
  /**
   * Max X
   * @member {Number}
   */
  max_x: number;
  /**
   * Min Y
   * @member {Number}
   */
  min_y: number;
  /**
   * Max Y
   * @member {Number}
   */
  max_y: number;
  /**
   * Min Z
   * @member {Number}
   */
  min_z: number;
  /**
   * Max Z
   * @member {Number}
   */
  max_z: number;
  /**
   * Min M
   * @member {Number}
   */
  min_m: number;
  /**
   * Max M
   * @member {Number}
   */
  max_m: number;
  setTableIndex(tableIndex: TableIndex): void {
    this.table_name = tableIndex.table_name;
  }
}

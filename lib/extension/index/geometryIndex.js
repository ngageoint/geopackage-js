/**
 * Geometry Index object, for indexing data within user tables
 * @class
 */
class GeometryIndex {
  constructor() {
    /**
     * Name of the table
     * @member {String}
     */
    this.table_name = undefined;
    /**
     * Geometry Id column
     * @member {Number}
     */
    this.geom_id = undefined;
    /**
     * Min X
     * @member {Number}
     */
    this.min_x = undefined;
    /**
     * Max X
     * @member {Number}
     */
    this.max_x = undefined;
    /**
     * Min Y
     * @member {Number}
     */
    this.min_y = undefined;
    /**
     * Max Y
     * @member {Number}
     */
    this.max_y = undefined;
    /**
     * Min Z
     * @member {Number}
     */
    this.min_z = undefined;
    /**
     * Max Z
     * @member {Number}
     */
    this.max_z = undefined;
    /**
     * Min M
     * @member {Number}
     */
    this.min_m = undefined;
    /**
     * Max M
     * @member {Number}
     */
    this.max_m = undefined;
  }
  setTableIndex(tableIndex) {
    this.table_name = tableIndex.table_name;
  }
}

module.exports = GeometryIndex;

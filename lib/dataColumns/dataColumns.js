
/**
 * Stores minimal application schema identifying, descriptive and MIME type
 * information about columns in user vector feature and tile matrix data tables
 * that supplements the data available from the SQLite sqlite_master table and
 * pragma table_info(table_name) SQL function. The gpkg_data_columns data CAN be
 * used to provide more specific column data types and value ranges and
 * application specific structural and semantic information to enable more
 * informative user menu displays and more effective user decisions on the
 * suitability of GeoPackage contents for specific purposes.
 * @class DataColumns
 */
class DataColumns {
  /**
   * 
   * @param {object} [object] object containing properties to apply to this
   */
  constructor(object) {
    object = object || {};
    /**
   * the name of the tiles, or feature table
   * @member {string}
   */
    this.table_name = object.table_name;

    /**
   * the name of the table column
   * @member {string}
   */
    this.column_name = object.column_name;

    /**
   * A human-readable identifier (e.g. short name) for the column_name content
   * @member {string}
   */
    this.name = object.name;

    /**
   * A human-readable formal title for the column_name content
   * @member {string}
   */
    this.title = object.title;

    /**
   * A human-readable description for the table_name contente
   * @member {string}
   */
    this.description = object.description;

    /**
   * MIME type of columnName if BLOB type or NULL for other types
   * @member {string}
   */
    this.mime_type = object.mime_type;

    /**
   * Case sensitive column value constraint name specified
   */
    this.constraint_name = object.constraint_name;
  }
}
module.exports = DataColumns;

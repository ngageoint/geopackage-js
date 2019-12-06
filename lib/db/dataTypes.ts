/**
 * @module db/dataTypes
 */
export default class DataTypes {
  /**
   * A boolean value representing true or false.
   * @type {String}
   */
  public static readonly GPKG_DT_BOOLEAN_NAME = "BOOLEAN";
  /**
   * 8-bit signed two’s complement integer.
   * @type {String}
   */
  public static readonly GPKG_DT_TINYINT_NAME = "TINYINT";
  /**
   * 16-bit signed two’s complement integer.
   * @type {String}
   */
  public static readonly GPKG_DT_SMALLINT_NAME = "SMALLINT";
  /**
   * 32-bit signed two’s complement integer.
   * @type {String}
   */
  public static readonly GPKG_DT_MEDIUMINT_NAME = "MEDIUMINT";
  /**
   * 64-bit signed two’s complement integer.
   * @type {String}
   */
  public static readonly GPKG_DT_INT_NAME = "INT";
  /**
   * 64-bit signed two’s complement integer.
   * @type {String}
   */
  public static readonly GPKG_DT_INTEGER_NAME = "INTEGER";
  /**
   * 32-bit IEEE floating point number.
   * @type {String}
   */
  public static readonly GPKG_DT_FLOAT_NAME = "FLOAT";
  /**
   * 64-bit IEEE floating point number.
   * @type {String}
   */
  public static readonly GPKG_DT_DOUBLE_NAME = "DOUBLE";
  /**
   * 64-bit IEEE floating point number.
   * @type {String}
   */
  public static readonly GPKG_DT_REAL_NAME = "REAL";
  /**
   * TEXT{(maxchar_count)}: Variable length string encoded in either UTF-8 or UTF-16, determined by PRAGMA encoding; see http://www.sqlite.org/pragma.html#pragma_encoding.
   * @type {String}
   */
  public static readonly GPKG_DT_TEXT_NAME = "TEXT";
  /**
   * BLOB{(max_size)}: Variable length binary data.
   * @type {String}
   */
  public static readonly GPKG_DT_BLOB_NAME = "BLOB";
  /**
   * ISO-8601 date string in the form YYYY-MM-DD encoded in either UTF-8 or UTF-16.
   * @type {String}
   */
  public static readonly GPKG_DT_DATE_NAME = "DATE";
  /**
   * ISO-8601 date/time string in the form YYYY-MM-DDTHH:MM:SS.SSSZ with T separator character and Z suffix for coordinated universal time (UTC) encoded in either UTF-8 or UTF-16.
   * @type {String}
   */
  public static readonly GPKG_DT_DATETIME_NAME = "DATETIME";
  public static readonly GPKG_DT_GEOMETRY_NAME = "GEOMETRY";

/**
 * DataType enumeration
 * @typedef {object} GPKGDataType
 */
public static GPKGDataType = {
  [DataTypes.GPKG_DT_BOOLEAN_NAME]: 0,
  GPKG_DT_BOOLEAN: 0,
  [DataTypes.GPKG_DT_TINYINT_NAME]: 1,
  GPKG_DT_TINYINT: 1,
  [DataTypes.GPKG_DT_SMALLINT_NAME]: 2,
  GPKG_DT_SMALLINT: 2,
  [DataTypes.GPKG_DT_MEDIUMINT_NAME]: 3,
  GPKG_DT_MEDIUMINT: 3,
  [DataTypes.GPKG_DT_INT_NAME]: 4,
  GPKG_DT_INT: 4,
  [DataTypes.GPKG_DT_INTEGER_NAME]: 5,
  GPKG_DT_INTEGER: 5,
  [DataTypes.GPKG_DT_FLOAT_NAME]: 6,
  GPKG_DT_FLOAT: 6,
  [DataTypes.GPKG_DT_DOUBLE_NAME]: 7,
  GPKG_DT_DOUBLE: 7,
  [DataTypes.GPKG_DT_REAL_NAME]: 8,
  GPKG_DT_REAL: 8,
  [DataTypes.GPKG_DT_TEXT_NAME]: 9,
  GPKG_DT_TEXT: 9,
  [DataTypes.GPKG_DT_BLOB_NAME]: 10,
  GPKG_DT_BLOB: 10,
  [DataTypes.GPKG_DT_DATE_NAME]: 11,
  GPKG_DT_DATE: 11,
  [DataTypes.GPKG_DT_DATETIME_NAME]: 12,
  GPKG_DT_DATETIME: 12,
  [DataTypes.GPKG_DT_GEOMETRY_NAME]: 13,
  GPKG_DT_GEOMETRY: 13,
};
// public static readonly GPKGDataType[DataTypes.GPKG_DT_BOOLEAN_NAME] = 0;
// public static readonly GPKGDataType[DataTypes.GPKG_DT_TINYINT_NAME] = 1;
// public static readonly GPKGDataType[DataTypes.GPKG_DT_SMALLINT_NAME] = 2;
// public static readonly GPKGDataType[DataTypes.GPKG_DT_MEDIUMINT_NAME] = 3;
// public static readonly GPKGDataType[DataTypes.GPKG_DT_INT_NAME] = 4;
// public static readonly GPKGDataType[DataTypes.GPKG_DT_INTEGER_NAME] = 5;
// public static readonly GPKGDataType[DataTypes.GPKG_DT_FLOAT_NAME] = 6;
// public static readonly GPKGDataType[DataTypes.GPKG_DT_DOUBLE_NAME] = 7;
// public static readonly GPKGDataType[DataTypes.GPKG_DT_REAL_NAME] = 8;
// public static readonly GPKGDataType[DataTypes.GPKG_DT_TEXT_NAME] = 9;
// public static readonly GPKGDataType[DataTypes.GPKG_DT_BLOB_NAME] = 10;
// public static readonly GPKGDataType[DataTypes.GPKG_DT_DATE_NAME] = 11;
// public static readonly GPKGDataType[DataTypes.GPKG_DT_DATETIME_NAME] = 12;
// public static readonly GPKGDataType[DataTypes.GPKG_DT_GEOMETRY_NAME] = 13;

// public static readonly GPKGDataType.GPKG_DT_BOOLEAN = 0;
// public static readonly GPKGDataType.GPKG_DT_TINYINT = 1;
// public static readonly GPKGDataType.GPKG_DT_SMALLINT = 2;
// public static readonly GPKGDataType.GPKG_DT_MEDIUMINT = 3;
// public static readonly GPKGDataType.GPKG_DT_INT = 4;
// public static readonly GPKGDataType.GPKG_DT_INTEGER = 5;
// public static readonly GPKGDataType.GPKG_DT_FLOAT = 6;
// public static readonly GPKGDataType.GPKG_DT_DOUBLE = 7;
// public static readonly GPKGDataType.GPKG_DT_REAL = 8;
// public static readonly GPKGDataType.GPKG_DT_TEXT = 9;
// public static readonly GPKGDataType.GPKG_DT_BLOB = 10;
// public static readonly GPKGDataType.GPKG_DT_DATE = 11;
// public static readonly GPKGDataType.GPKG_DT_DATETIME = 12;
// public static readonly GPKGDataType.GPKG_DT_GEOMETRY = 13;


/**
 * Return the name of the given data type.
 *
 * @param  {module:db/dataTypes~GPKGDataType} dataType the enum to retrieve the name for
 * @return {String} the string name of the given data type enum
 */
static nameFromType(dataType) {
  var name = undefined;
  switch(dataType){
  case DataTypes.GPKGDataType.GPKG_DT_BOOLEAN:
    name = DataTypes.GPKG_DT_BOOLEAN_NAME;
    break;
  case DataTypes.GPKGDataType.GPKG_DT_TINYINT:
    name = DataTypes.GPKG_DT_TINYINT_NAME;
    break;
  case DataTypes.GPKGDataType.GPKG_DT_SMALLINT:
    name = DataTypes.GPKG_DT_SMALLINT_NAME;
    break;
  case DataTypes.GPKGDataType.GPKG_DT_MEDIUMINT:
    name = DataTypes.GPKG_DT_MEDIUMINT_NAME;
    break;
  case DataTypes.GPKGDataType.GPKG_DT_INT:
    name = DataTypes.GPKG_DT_INT_NAME;
    break;
  case DataTypes.GPKGDataType.GPKG_DT_INTEGER:
    name = DataTypes.GPKG_DT_INTEGER_NAME;
    break;
  case DataTypes.GPKGDataType.GPKG_DT_FLOAT:
    name = DataTypes.GPKG_DT_FLOAT_NAME;
    break;
  case DataTypes.GPKGDataType.GPKG_DT_DOUBLE:
    name = DataTypes.GPKG_DT_DOUBLE_NAME;
    break;
  case DataTypes.GPKGDataType.GPKG_DT_REAL:
    name = DataTypes.GPKG_DT_REAL_NAME;
    break;
  case DataTypes.GPKGDataType.GPKG_DT_TEXT:
    name = DataTypes.GPKG_DT_TEXT_NAME;
    break;
  case DataTypes.GPKGDataType.GPKG_DT_BLOB:
    name = DataTypes.GPKG_DT_BLOB_NAME;
    break;
  case DataTypes.GPKGDataType.GPKG_DT_DATE:
    name = DataTypes.GPKG_DT_DATE_NAME;
    break;
  case DataTypes.GPKGDataType.GPKG_DT_DATETIME:
    name = DataTypes.GPKG_DT_DATETIME_NAME;
    break;
  case DataTypes.GPKGDataType.GPKG_DT_GEOMETRY:
    name = DataTypes.GPKG_DT_GEOMETRY_NAME;
    break;
  }

  return name;
}

  /**
   * Return the data type enum value for the given name, ignoring case.
   *
   * @param  {String} name the name of the data type enum
   * @return {module:db/dataTypes~GPKGDataType} the enum value
   */
  static fromName = function(name: string): number {
    DataTypes.GPKGDataType['test'] = 5;
    var value = 9;
    if (name) {
      name = name.toUpperCase();
      value = DataTypes.GPKGDataType[name];
    }
    return value;
  }
}

/**
 * Data Types module.
 * @module db/dataTypes
 */

/**
 * A boolean value representing true or false.
 * @type {String}
 */
module.exports.GPKG_DT_BOOLEAN_NAME = "BOOLEAN";
/**
 * 8-bit signed two’s complement integer.
 * @type {String}
 */
module.exports.GPKG_DT_TINYINT_NAME = "TINYINT";
/**
 * 16-bit signed two’s complement integer.
 * @type {String}
 */
module.exports.GPKG_DT_SMALLINT_NAME = "SMALLINT";
/**
 * 32-bit signed two’s complement integer.
 * @type {String}
 */
module.exports.GPKG_DT_MEDIUMINT_NAME = "MEDIUMINT";
/**
 * 64-bit signed two’s complement integer.
 * @type {String}
 */
module.exports.GPKG_DT_INT_NAME = "INT";
/**
 * 64-bit signed two’s complement integer.
 * @type {String}
 */
module.exports.GPKG_DT_INTEGER_NAME = "INTEGER";
/**
 * 32-bit IEEE floating point number.
 * @type {String}
 */
module.exports.GPKG_DT_FLOAT_NAME = "FLOAT";
/**
 * 64-bit IEEE floating point number.
 * @type {String}
 */
module.exports.GPKG_DT_DOUBLE_NAME = "DOUBLE";
/**
 * 64-bit IEEE floating point number.
 * @type {String}
 */
module.exports.GPKG_DT_REAL_NAME = "REAL";
/**
 * TEXT{(maxchar_count)}: Variable length string encoded in either UTF-8 or UTF-16, determined by PRAGMA encoding; see http://www.sqlite.org/pragma.html#pragma_encoding.
 * @type {String}
 */
module.exports.GPKG_DT_TEXT_NAME = "TEXT";
/**
 * BLOB{(max_size)}: Variable length binary data.
 * @type {String}
 */
module.exports.GPKG_DT_BLOB_NAME = "BLOB";
/**
 * ISO-8601 date string in the form YYYY-MM-DD encoded in either UTF-8 or UTF-16.
 * @type {String}
 */
module.exports.GPKG_DT_DATE_NAME = "DATE";
/**
 * ISO-8601 date/time string in the form YYYY-MM-DDTHH:MM:SS.SSSZ with T separator character and Z suffix for coordinated universal time (UTC) encoded in either UTF-8 or UTF-16.
 * @type {String}
 */
module.exports.GPKG_DT_DATETIME_NAME = "DATETIME";
module.exports.GPKG_DT_GEOMETRY_NAME = "GEOMETRY";

/**
 * DataType enumeration
 * @typedef {object} GPKGDataType
 */
module.exports.GPKGDataType = {};
module.exports.GPKGDataType[module.exports.GPKG_DT_BOOLEAN_NAME] = 0;
module.exports.GPKGDataType[module.exports.GPKG_DT_TINYINT_NAME] = 1;
module.exports.GPKGDataType[module.exports.GPKG_DT_SMALLINT_NAME] = 2;
module.exports.GPKGDataType[module.exports.GPKG_DT_MEDIUMINT_NAME] = 3;
module.exports.GPKGDataType[module.exports.GPKG_DT_INT_NAME] = 4;
module.exports.GPKGDataType[module.exports.GPKG_DT_INTEGER_NAME] = 5;
module.exports.GPKGDataType[module.exports.GPKG_DT_FLOAT_NAME] = 6;
module.exports.GPKGDataType[module.exports.GPKG_DT_DOUBLE_NAME] = 7;
module.exports.GPKGDataType[module.exports.GPKG_DT_REAL_NAME] = 8;
module.exports.GPKGDataType[module.exports.GPKG_DT_TEXT_NAME] = 9;
module.exports.GPKGDataType[module.exports.GPKG_DT_BLOB_NAME] = 10;
module.exports.GPKGDataType[module.exports.GPKG_DT_DATE_NAME] = 11;
module.exports.GPKGDataType[module.exports.GPKG_DT_DATETIME_NAME] = 12;
module.exports.GPKGDataType[module.exports.GPKG_DT_GEOMETRY_NAME] = 13;

module.exports.GPKGDataType.GPKG_DT_BOOLEAN = 0;
module.exports.GPKGDataType.GPKG_DT_TINYINT = 1;
module.exports.GPKGDataType.GPKG_DT_SMALLINT = 2;
module.exports.GPKGDataType.GPKG_DT_MEDIUMINT = 3;
module.exports.GPKGDataType.GPKG_DT_INT = 4;
module.exports.GPKGDataType.GPKG_DT_INTEGER = 5;
module.exports.GPKGDataType.GPKG_DT_FLOAT = 6;
module.exports.GPKGDataType.GPKG_DT_DOUBLE = 7;
module.exports.GPKGDataType.GPKG_DT_REAL = 8;
module.exports.GPKGDataType.GPKG_DT_TEXT = 9;
module.exports.GPKGDataType.GPKG_DT_BLOB = 10;
module.exports.GPKGDataType.GPKG_DT_DATE = 11;
module.exports.GPKGDataType.GPKG_DT_DATETIME = 12;
module.exports.GPKGDataType.GPKG_DT_GEOMETRY = 13;


/**
 * Returns the {string} from this data type
 * @param  {module:db/dataTypes~GPKGDataType} dataType the enum to retrieve the name for
 * @return {String}          the string corresponding to the enum
 */
module.exports.name = function(dataType) {
  var name = undefined;

  switch(dataType){
    case module.exports.GPKGDataType.GPKG_DT_BOOLEAN:
      name = module.exports.GPKG_DT_BOOLEAN_NAME;
      break;
    case module.exports.GPKGDataType.GPKG_DT_TINYINT:
      name = module.exports.GPKG_DT_TINYINT_NAME;
      break;
    case module.exports.GPKGDataType.GPKG_DT_SMALLINT:
      name = module.exports.GPKG_DT_SMALLINT_NAME;
      break;
    case module.exports.GPKGDataType.GPKG_DT_MEDIUMINT:
      name = module.exports.GPKG_DT_MEDIUMINT_NAME;
      break;
    case module.exports.GPKGDataType.GPKG_DT_INT:
      name = module.exports.GPKG_DT_INT_NAME;
      break;
    case module.exports.GPKGDataType.GPKG_DT_INTEGER:
      name = module.exports.GPKG_DT_INTEGER_NAME;
      break;
    case module.exports.GPKGDataType.GPKG_DT_FLOAT:
      name = module.exports.GPKG_DT_FLOAT_NAME;
      break;
    case module.exports.GPKGDataType.GPKG_DT_DOUBLE:
      name = module.exports.GPKG_DT_DOUBLE_NAME;
      break;
    case module.exports.GPKGDataType.GPKG_DT_REAL:
      name = module.exports.GPKG_DT_REAL_NAME;
      break;
    case module.exports.GPKGDataType.GPKG_DT_TEXT:
      name = module.exports.GPKG_DT_TEXT_NAME;
      break;
    case module.exports.GPKGDataType.GPKG_DT_BLOB:
      name = module.exports.GPKG_DT_BLOB_NAME;
      break;
    case module.exports.GPKGDataType.GPKG_DT_DATE:
      name = module.exports.GPKG_DT_DATE_NAME;
      break;
    case module.exports.GPKGDataType.GPKG_DT_DATETIME:
      name = module.exports.GPKG_DT_DATETIME_NAME;
      break;
    case module.exports.GPKGDataType.GPKG_DT_GEOMETRY:
      name = module.exports.GPKG_DT_GEOMETRY_NAME;
      break;
  }

  return name;
}

/**
 * Get the Data Type from the name, ignoring case
 * @param  {String} name the name of the enum
 * @return {module:db/dataTypes~GPKGDataType}      the enum value
 */
module.exports.fromName = function(name) {
  var value = 9;
  if (name) {
    name = name.toUpperCase();
    value = module.exports.GPKGDataType[name];
  }
  return value;
}

/**
 * featureTableReader module.
 * @module features/user/featureTableReader
 */

var UserTableReader = require('../../user/UserTableReader')
  , FeatureTable = require('./featureTable')
  , FeatureColumn = require('./featureColumn')
  , GeometryColumnsDao = require('../columns').GeometryColumnsDao
  , DataTypes = require('../../db/dataTypes')
  , wkb = require('../../wkb');

var util = require('util');

/**
* Reads the metadata from an existing feature table
* @class FeatureTableReader
* @extends {module:user~UserTableReader}
*/
var FeatureTableReader = function(tableNameOrGeometryColumns) {
  if (util.isString(tableNameOrGeometryColumns)) {
    UserTableReader.call(this, tableNameOrGeometryColumns);
  } else {
    UserTableReader.call(this, tableNameOrGeometryColumns.table_name);
    this.geometryColumns = tableNameOrGeometryColumns;
  }
}

util.inherits(FeatureTableReader, UserTableReader);

FeatureTableReader.prototype.readFeatureTable = function (db, callback) {
  if (!this.geometryColumns) {
    new GeometryColumnsDao(db).queryForTableName(this.table_name, function(err, geometryColumns) {
      this.geometryColumns = geometryColumns;
      this.readTable(db, callback);
    }.bind(this));
  } else {
    this.readTable(db, callback);
  }
};

FeatureTableReader.prototype.createTableWithNameAndColumns = function (tableName, columns) {
  return new FeatureTable(tableName, columns);
};

FeatureTableReader.prototype.createColumnWithResults = function (results, index, name, type, max, notNull, defaultValueIndex, primaryKey) {
  var geometry = name === this.geometryColumns.column_name;
  var geometryType = undefined;
  var dataType = undefined;
  if (geometry) {
    geometryType = wkb.fromName(type);
  } else {
    dataType = DataTypes.fromName(type);
  }
  var defaultValue = undefined;
  if (defaultValueIndex) {
  }
  var column = new FeatureColumn(index, name, dataType, max, notNull, defaultValue, primaryKey, geometryType);

  return column;
};

/**
 * -(GPKGUserColumn *) createColumnWithResults: (GPKGResultSet *) results
                                   andIndex: (int) index
                                    andName: (NSString *) name
                                    andType: (NSString *) type
                                     andMax: (NSNumber *) max
                                 andNotNull: (BOOL) notNull
                       andDefaultValueIndex: (int) defaultValueIndex
                              andPrimaryKey: (BOOL) primaryKey{

    BOOL geometry = [name isEqualToString:self.geometryColumns.columnName];

    enum WKBGeometryType geometryType = WKB_NONE;
    enum GPKGDataType dataType = GPKG_DT_GEOMETRY;
    if(geometry){
        geometryType = [WKBGeometryTypes fromName:type];
    }else{
        dataType = [GPKGDataTypes fromName:type];
    }

    NSObject * defaultValue = [results getValueWithIndex:defaultValueIndex];

    GPKGFeatureColumn * column = [[GPKGFeatureColumn alloc] initWithIndex:index andName:name andDataType:dataType andMax:max andNotNull:notNull andDefaultValue:defaultValue andPrimaryKey:primaryKey andGeometryType:geometryType];

    return column;
}
 */

/**
 * The FeatureTableReader
 * @type {FeatureTableReader}
 */
module.exports = FeatureTableReader;

/**
 * UserDao module.
 * @module user/userDao
 */

var UserRow = require('./userRow')
  , MediaTable = require('../extension/relatedTables/mediaTable')
  , SimpleAttributesTable = require('../extension/relatedTables/simpleAttributesTable')
  , RelationType = require('../extension/relatedTables/relationType')
  , UserTableReader = require('./userTableReader')
  , Dao = require('../dao/dao');

var util = require('util');

/**
 * Abstract User DAO for reading user tables
 * @class UserDao
 * @extends {module:dao/dao~Dao}
 * @param  {module:db/geoPackageConnection~GeoPackageConnection} connection        connection
 * @param  {string} table table name
 */
var UserDao = function(geoPackage, table) {
  Dao.call(this, geoPackage);
  this.table = table;
  this.table_name = table.table_name;
  this.gpkgTableName = table.table_name;
  if (table.getPkColumn()) {
    this.idColumns = [table.getPkColumn().name];
  } else {
    this.idColumns = [];
  }
  this.columns = table.columnNames;
}

util.inherits(UserDao, Dao);

/**
 * Reads the table specified from the geopackage
 * @param  {module:geoPackage~GeoPackage} geoPackage      geopackage object
 * @param  {string} tableName       table name
 * @param  {string[]} requiredColumns required columns
 * @return {module:user/userDao~UserDao}
 */
UserDao.readTable = function(geoPackage, tableName) {
  var reader = new UserTableReader(tableName);
  var userTable = reader.readTable(geoPackage.getDatabase());
  return new UserDao(geoPackage, userTable);
}

/**
 * Creates a UserRow
 * @param  {Object} [results] results to create the row from if not specified, an empty row is created
 * @return {module:user/userRow~UserRow}
 */
UserDao.prototype.createObject = function (results) {
  if (results) {
    return this.getRow(results);
  }
  return this.newRow();
};

/**
 * Sets the value in the row
 * @param  {module:user/userRow~UserRow} object      user row
 * @param  {Number} columnIndex index
 * @param  {Object} value       value
 */
UserDao.prototype.setValueInObject = function (object, columnIndex, value) {
  object.setValueNoValidationWithIndex(columnIndex, value);
};

/**
 * Get a user row from the current results
 * @param  {Object} results result to create the row from
 * @return {module:user/userRow~UserRow}         the user row
 */
UserDao.prototype.getRow = function (results) {
  var row = undefined;
  if (!this.table) return row;
  var columns = this.table.columnCount();
  var columnTypes = {};
  for (var i = 0; i < columns; i++) {
    var column = this.table.getColumnWithIndex(i);
    columnTypes[column.name] = column.dataType;
  }
  return this.newRowWithColumnTypes(columnTypes, results);
};

/**
 * Get the table for this dao
 * @return {module:user/userTable~UserTable}
 */
UserDao.prototype.getTable = function() {
  return this.table;
}

/**
 * Create a user row
 * @param  {module:db/dataTypes[]} columnTypes  column types
 * @param  {module:dao/columnValues~ColumnValues[]} values      values
 * @return {module:user/userRow~UserRow}             user row
 */
UserDao.prototype.newRowWithColumnTypes = function (columnTypes, values) {
  return new UserRow(this.table, columnTypes, values);
};

/**
 * Get the projection
 * @return {string} the projection
 */
UserDao.prototype.getProjection = function () {
  return this.projection;
};

/**
 * Links related rows together
 * @param  {module:user/userRow~UserRow} userRow             user row
 * @param  {module:user/userRow~UserRow} relatedRow          related row
 * @param  {string} relationType        relation type
 * @param  {string|module:extension/relatedTables~UserMappingTable} [mappingTable]        mapping table
 * @param  {module:dao/columnValues~ColumnValues} [mappingColumnValues] column values
 * @return {Promise}
 */
UserDao.prototype.linkRelatedRow = function(userRow, relatedRow, relationType, mappingTable, mappingColumnValues) {
  var rte = this.geoPackage.getRelatedTablesExtension();
  var baseTableName = userRow.table.table_name;
  var relatedTableName = relatedRow.table.table_name;
  var relationship = rte.getRelationshipBuilder()
  .setBaseTableName(baseTableName)
  .setRelatedTableName(relatedTableName)
  .setRelationType(relationType);

  var mappingTableName;
  if (!mappingTable || typeof mappingTable === 'string') {
    var mappingTable = mappingTable || baseTableName + '_' + relatedTableName;
    relationship.setMappingTableName(mappingTable);
    mappingTableName = mappingTable;
  } else {
    relationship.setUserMappingTable(mappingTable);
    mappingTableName = mappingTable.table_name;
  }

  return rte.addRelationship(relationship)
  .then(function() {
    var userMappingDao = rte.getMappingDao(mappingTableName);
    var userMappingRow = userMappingDao.newRow();
    userMappingRow.setBaseId(userRow.getId());
    userMappingRow.setRelatedId(relatedRow.getId());
    for (var column in mappingColumnValues) {
      userMappingRow.setValueWithColumnName(column, mappingColumnValues[column]);
    }
    userMappingDao.create(userMappingRow);
  });
}

/**
 * Links a user row to a feature row
 * @param  {module:user/userRow~UserRow} userRow             user row
 * @param  {module:features/user/featureRow~FeatureRow} featureRow          feature row
 * @param  {string|module:extension/relatedTables~UserMappingTable} [mappingTable]        mapping table
 * @param  {module:dao/columnValues~ColumnValues} [mappingColumnValues] column values
 * @return {Promise}
 */
UserDao.prototype.linkFeatureRow = function(userRow, featureRow, mappingTable, mappingColumnValues) {
  return this.linkRelatedRow(userRow, featureRow, RelationType.FEATURES, mappingTable, mappingColumnValues);
}

/**
 * Links a user row to a media row
 * @param  {module:user/userRow~UserRow} userRow             user row
 * @param  {module:extension/relatedTables~MediaRow} mediaRow          media row
 * @param  {string|module:extension/relatedTables~UserMappingTable} [mappingTable]        mapping table
 * @param  {module:dao/columnValues~ColumnValues} [mappingColumnValues] column values
 * @return {Promise}
 */
UserDao.prototype.linkMediaRow = function(userRow, mediaRow, mappingTable, mappingColumnValues) {
  return this.linkRelatedRow(userRow, mediaRow, RelationType.MEDIA, mappingTable, mappingColumnValues);
}

/**
 * Links a user row to a simpleAttributes row
 * @param  {module:user/userRow~UserRow} userRow             user row
 * @param  {module:extension/relatedTables~SimpleAttributesRow} simpleAttributesRow          simple attributes row
 * @param  {string|module:extension/relatedTables~UserMappingTable} [mappingTable]        mapping table
 * @param  {module:dao/columnValues~ColumnValues} [mappingColumnValues] column values
 * @return {Promise}
 */
UserDao.prototype.linkSimpleAttributesRow = function(userRow, simpleAttrbuteRow, mappingTable, mappingColumnValues) {
  return this.linkRelatedRow(userRow, simpleAttrbuteRow, RelationType.SIMPLE_ATTRIBUTES, mappingTable, mappingColumnValues);
}

/**
 * Get all media rows that are linked to this user row
 * @param  {module:user/userRow~UserRow} userRow user row
 * @return {module:extension/relatedTables~MediaRow[]}
 */
UserDao.prototype.getLinkedMedia = function(userRow) {
  var mediaRelations = this.getMediaRelations();
  var rte = this.geoPackage.getRelatedTablesExtension();
  var linkedMedia = [];
  for (var i = 0; i < mediaRelations.length; i++) {
    var mediaRelation = mediaRelations[i];
    var mediaDao = rte.getMediaDao(mediaRelation);
    var userMappingDao = rte.getMappingDao(mediaRelation.mapping_table_name);
    var mappings = userMappingDao.queryByBaseId(userRow.getId());
    for (var m = 0; m < mappings.length; m++) {
      var relatedId = mappings[m].related_id;
      linkedMedia.push(mediaDao.queryForId(relatedId));
    }
  }
  return linkedMedia;
}

/**
 * Get all simple attribute rows that are linked to this user row
 * @param  {module:user/userRow~UserRow} userRow user row
 * @return {module:extension/relatedTables~SimpleAttributeRow[]}
 */
UserDao.prototype.getLinkedSimpleAttributes = function(userRow) {
  var simpleRelations = this.getSimpleAttributesRelations();
  var rte = this.geoPackage.getRelatedTablesExtension();
  var linkedSimpleAttributes = [];
  for (var i = 0; i < simpleRelations.length; i++) {
    var simpleRelation = simpleRelations[i];
    var simpleDao = rte.getSimpleAttributesDao(simpleRelation);
    var userMappingDao = rte.getMappingDao(simpleRelation.mapping_table_name);
    var mappings = userMappingDao.queryByBaseId(userRow.getId());
    for (var m = 0; m < mappings.length; m++) {
      var relatedId = mappings[m].related_id;
      linkedSimpleAttributes.push(simpleDao.queryForId(relatedId));
    }
  }
  return linkedSimpleAttributes;
}

/**
 * Get all feature rows that are linked to this user row
 * @param  {module:user/userRow~UserRow} userRow user row
 * @return {module:features/user/featureRow~FeatureRow[]}
 */
UserDao.prototype.getLinkedFeatures = function(userRow) {
  var featureRelations = this.getFeatureRelations();
  var rte = this.geoPackage.getRelatedTablesExtension();
  var linkedFeatures = [];
  for (var i = 0; i < featureRelations.length; i++) {
    var featureRelation = featureRelations[i];
    var featureDao = this.geoPackage.getFeatureDao(featureRelation.base_table_name);
    var userMappingDao = rte.getMappingDao(featureRelation.mapping_table_name);
    var mappings = userMappingDao.queryByBaseId(userRow.getId());
    for (var m = 0; m < mappings.length; m++) {
      var relatedId = mappings[m].related_id;
      linkedFeatures.push(featureDao.queryForId(relatedId));
    }
  }
  return linkedFeatures;
}

/**
 * Get all simple attribute relations to this table
 * @return {Object[]}
 */
UserDao.prototype.getSimpleAttributesRelations = function() {
  return this.getRelationsWithName(SimpleAttributesTable.RELATION_TYPE.name);
}

/**
 * Get all feature relations to this table
 * @return {Object[]}
 */
UserDao.prototype.getFeatureRelations = function() {
  return this.getRelationsWithName(RelationType.FEATURES.name);
}

/**
 * Get all media relations to this table
 * @return {Object[]}
 */
UserDao.prototype.getMediaRelations = function() {
  return this.getRelationsWithName(MediaTable.RELATION_TYPE.name);
}

/**
 * Get all relations to this table with the specified name
 * @param {string} name
 * @return {Object[]}
 */
UserDao.prototype.getRelationsWithName = function(name) {
  return this.geoPackage.getExtendedRelationDao().getBaseTableRelationsWithName(this.table_name, name);
}

/**
 * Get all relations to this table
 * @return {Object[]}
 */
UserDao.prototype.getRelations = function() {
  return this.geoPackage.getExtendedRelationDao().getBaseTableRelations(this.table_name);
}

/**
 * Gets the rows in this table by id
 * @param  {Number[]} ids ids to query for
 * @return {Object[]}
 */
UserDao.prototype.getRows = function(ids) {
  var rows = [];
  for (var i = 0; i < ids.length; i++) {
    var row = this.queryForId(ids[i]);
    if (row) {
      rows.push(row);
    }
  }
  return rows;
}

/**
 *  Get the approximate zoom level of where the bounding box of the user data fits into the world
 *
 *  @return zoom level
 */
UserDao.prototype.getZoomLevel = function () {
  return 0;
  // if(self.projection == nil){
  //     [NSException raise:@"No Projection" format:@"No projection was set which is required to determine the zoom level"];
  // }
  // GPKGBoundingBox * boundingBox = [self getBoundingBox];
  // if([self.projection.epsg intValue] == PROJ_EPSG_WORLD_GEODETIC_SYSTEM){
  //     boundingBox = [GPKGTileBoundingBoxUtils boundWgs84BoundingBoxWithWebMercatorLimits:boundingBox];
  // }
  // GPKGProjectionTransform * webMercatorTransform = [[GPKGProjectionTransform alloc] initWithFromProjection:self.projection andToEpsg:PROJ_EPSG_WEB_MERCATOR];
  // GPKGBoundingBox * webMercatorBoundingBox = [webMercatorTransform transformWithBoundingBox:boundingBox];
  // int zoomLevel = [GPKGTileBoundingBoxUtils getZoomLevelWithWebMercatorBoundingBox:webMercatorBoundingBox];
  // return zoomLevel;
};

/**
 * Get count of all rows in this table
 * @return {Number}
 */
UserDao.prototype.getCount = function () {
  return this.connection.count(this.table_name);
};

module.exports = UserDao;

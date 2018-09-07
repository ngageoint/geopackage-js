/**
 * UserDao module.
 * @module user/userDao
 * @see module:dao/dao
 */

var UserRow = require('./userRow')
  , MediaTable = require('../extension/relatedTables/mediaTable')
  , SimpleAttributesTable = require('../extension/relatedTables/simpleAttributesTable')
  , RelationType = require('../extension/relatedTables/relationType')
  , Dao = require('../dao/dao');

var util = require('util');

/**
 * Abstract User DAO for reading user tables
 * @class UserDao
 * @extends {module:dao/dao~Dao}
 * @param  {GeoPackageConnection} connection        connection
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

UserDao.prototype.createObject = function (results) {
  if (results) {
    return this.getRow(results);
  }
  return this.newRow();
};

UserDao.prototype.setValueInObject = function (object, columnIndex, value) {
  object.setValueNoValidationWithIndex(columnIndex, value);
};

/**
 * Get a user row from the current results
 * @param  {results} results result set
 * @return {UserRow}         the user row
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
 * Create a user row
 * @param  {Array} columnTypes column Types
 * @param  {Array} values      values
 * @return {UserRow}             user row
 */
UserDao.prototype.newRowWithColumnTypes = function (columnTypes, values) {
  return new UserRow(this.table, columnTypes, values);
};

/**
 * Get the projection
 * @return {Projection} the projection
 */
UserDao.prototype.getProjection = function () {
  return this.projection;
};

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

UserDao.prototype.linkFeatureRow = function(userRow, featureRow, mappingTable, mappingColumnValues) {
  return this.linkRelatedRow(userRow, featureRow, RelationType.FEATURES, mappingTable, mappingColumnValues);
}

UserDao.prototype.linkMediaRow = function(userRow, mediaRow, mappingTable, mappingColumnValues) {
  return this.linkRelatedRow(userRow, mediaRow, RelationType.MEDIA, mappingTable, mappingColumnValues);
}

UserDao.prototype.linkSimpleAttributesRow = function(userRow, simpleAttrbuteRow, mappingTable, mappingColumnValues) {
  return this.linkRelatedRow(userRow, simpleAttrbuteRow, RelationType.SIMPLE_ATTRIBUTES, mappingTable, mappingColumnValues);
}

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

UserDao.prototype.getSimpleAttributesRelations = function() {
  return this.getRelationsWithName(SimpleAttributesTable.RELATION_TYPE.name);
}

UserDao.prototype.getFeatureRelations = function() {
  return this.getRelationsWithName(RelationType.FEATURES.name);
}

UserDao.prototype.getMediaRelations = function() {
  return this.getRelationsWithName(MediaTable.RELATION_TYPE.name);
}

UserDao.prototype.getRelationsWithName = function(name) {
  return this.geoPackage.getExtendedRelationDao().getBaseTableRelationsWithName(this.table_name, name);
}

UserDao.prototype.getRelations = function() {
  return this.geoPackage.getExtendedRelationDao().getBaseTableRelations(this.table_name);
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

UserDao.prototype.getCount = function () {
  return this.connection.count(this.table_name);
};

module.exports = UserDao;

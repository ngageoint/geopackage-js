/**
 * RelatedTablesExtension module.
 * @module extension/relatedTables
 * @see module:extension/BaseExtension
 */

var BaseExtension = require('../baseExtension')
  , Extension = require('../.').Extension
  , ColumnValues = require('../../dao/columnValues')
  , OptionBuilder = require('../../optionBuilder')
  , ExtendedRelationDao = require('./extendedRelation').ExtendedRelationDao
  , ExtendedRelation = require('./extendedRelation').ExtendedRelation
  , MediaDao = require('./mediaDao')
  , MediaTable = require('./mediaTable')
  , SimpleAttributesDao = require('./simpleAttributesDao')
  , SimpleAttributesTable = require('./simpleAttributesTable')
  , UserMappingTable = require('./userMappingTable')
  , UserMappingDao = require('./userMappingDao')
  , UserCustomDao = require('../../user/custom/userCustomDao')
  , UserDao = require('../../user/userDao')
  , UserTableReader = require('../../user/userTableReader')
  , RelationType = require('./relationType')
  , ContentsDao = require('../../core/contents').ContentsDao
  , Contents = require('../../core/contents').Contents
  , GeometryColumnsDao = require('../../features/columns').GeometryColumnsDao;

var util = require('util');

/**
 * Related Tables Extension
 * @param  {module:geoPackage~GeoPackage} geoPackage the GeoPackage object
 * @class
 * @extends {module:extension/baseExtension~BaseExtension}
 */
var RelatedTablesExtension = function(geoPackage) {
  BaseExtension.call(this, geoPackage);
  this.extendedRelationDao = geoPackage.getExtendedRelationDao();
}

util.inherits(RelatedTablesExtension, BaseExtension);

/**
 * Get or create the extension
 * @return {Promise}
 */
RelatedTablesExtension.prototype.getOrCreateExtension = function() {
  return this.getOrCreate(RelatedTablesExtension.EXTENSION_NAME, 'gpkgext_relations', undefined, RelatedTablesExtension.EXTENSION_RELATED_TABLES_DEFINITION, Extension.READ_WRITE)
  .then(function() {
    return this.extendedRelationDao.createTable();
  }.bind(this));
};

/**
 * Get or create the extension for the mapping table
 * @param  {string} mappingTableName user mapping table
 * @return {Promise}
 */
RelatedTablesExtension.prototype.getOrCreateMappingTable = function(mappingTableName) {
  return this.getOrCreateExtension()
  .then(function() {
    this.getOrCreate(RelatedTablesExtension.EXTENSION_NAME, mappingTableName, undefined, RelatedTablesExtension.EXTENSION_RELATED_TABLES_DEFINITION, Extension.READ_WRITE);
  }.bind(this));
}

/**
 * Set the contents in the UserRelatedTable
 * @param  {module:extension/relatedTables~UserRelatedTable} userRelatedTable user related table
 */
RelatedTablesExtension.prototype.setContents = function(userRelatedTable) {
  var contents = this.geoPackage.getContentsDao().queryForId(userRelatedTable.table_name);
  userRelatedTable.setContents(contents);
}

/**
 * Reads the user table and creates a UserCustomDao
 * @param  {string} tableName       table name to reader
 * @param  {string[]} requiredColumns required columns
 * @return {module:user/custom~UserCustomDao}
 */
RelatedTablesExtension.prototype.getUserDao = function(tableName, requiredColumns) {
  return UserCustomDao.readTable(this.geoPackage, tableName, requiredColumns);
}

/**
 * Gets the UserMappingDao from the mapping table name
 * @param  {string|module:extension/relatedTables~ExtendedRelation} tableName user mapping table name or ExtendedRelation object
 * @return {module:extension/relatedTables~UserMappingDao}
 */
RelatedTablesExtension.prototype.getMappingDao = function(tableName) {
  if (tableName.mapping_table_name) {
    tableName = tableName.mapping_table_name;
  }
  return new UserMappingDao(this.getUserDao(tableName, UserMappingTable.requiredColumns()), this.geoPackage);
}

/**
 * Gets all relationships in the GeoPackage with an optional base table name and an optional base id
 * @param {string} [baseTableName] base table name
 * @return {module:extension/relatedTables~ExtendedRelation[]}
 */
RelatedTablesExtension.prototype.getRelationships = function(baseTableName) {
  if (this.extendedRelationDao.isTableExists()) {
    if (baseTableName) {
      return this.geoPackage.getExtendedRelationDao().getBaseTableRelations(baseTableName);
    }
    return this.extendedRelationDao.queryForAll();
  }
  return [];
}

RelatedTablesExtension.prototype.getRelatedRows = function(baseTableName, baseId) {
  var relationships = this.getRelationships(baseTableName);
  for (var i = 0; i < relationships.length; i++) {
    var relation = relationships[i];
    var mappingRows = this.getMappingRowsForBase(relation.mapping_table_name, baseId);
    relation.mappingRows = mappingRows;
    var userDao;
    // TODO do this for all known types
    if (relation.relation_name === 'media') {
      userDao = MediaDao.readTable(this.geoPackage, relation.related_table_name);
    } else {
      userDao = UserDao.readTable(this.geoPackage, relation.related_table_name);
    }
    for (var m = 0; m < mappingRows.length; m++) {
      var mappingRow = mappingRows[m];
      mappingRow.row = userDao.queryForId(mappingRow.related_id);
    }
  }
  return relationships;
}

RelatedTablesExtension.RelationshipBuilder = function() {
  return OptionBuilder([
    'baseTableName',
    'relatedTableName',
    'userMappingTable',
    'mappingTableName',
    'relationName',
    'relationAuthor',
    'relationType',
    'relatedTable'
  ]);
}
/**
 * Convience object to build a Relationship object for querying and adding
 * @typedef {Object} module:extension/relatedTables~Relationship
 * @property  {module:extension/relatedTables~RelationType} relationType type of relationship
 * @property  {string} baseTableName base table name
 * @property  {string} relatedTableName related table name
 * @property  {string} relationAuthor relationship author
 * @property  {string} mappingTableName mapping table name
 * @property  {module:extension/relatedTables~UserMappingTable} userMappingTable UserMappingTable
 * @property  {module:extension/relatedTables~UserRelatedTable} relatedTable UserRelatedTable
 */
RelatedTablesExtension.prototype.getRelationshipBuilder = function() {
  return RelatedTablesExtension.RelationshipBuilder();
}

/**
 * Adds a relationship to the GeoPackage
 * @param  {module:extension/relatedTables~Relationship|module:extension/relatedTables~ExtendedRelation} relationship relationship to add
 * @return {Promise<module:extension/relatedTables~ExtendedRelation>}
 */
RelatedTablesExtension.prototype.addRelationship = function(relationship) {
  var extendedRelation = this.extendedRelationDao.createObject();
  var userMappingTable = relationship.userMappingTable;
  if (relationship.hasOwnProperty('base_table_name')) {
    extendedRelation = relationship;
    userMappingTable = UserMappingTable.create(extendedRelation.mapping_table_name);
  } else {
    if (relationship.relationType) {
      relationship.relationName = relationship.relationType.name;
    }
    if (relationship.relationAuthor) {
      relationship.relationName = this.buildRelationName(relationship.relationAuthor, relationship.relationName);
    }
    if (relationship.mappingTableName) {
      userMappingTable = UserMappingTable.create(relationship.mappingTableName);
    }

    if (relationship.relatedTable) {
      this.createRelatedTable(relationship.relatedTable);
      relationship.relatedTableName = relationship.relatedTable.table_name;
      relationship.relationName = relationship.relatedTable.relation_name;
    }

    extendedRelation.base_table_name = relationship.baseTableName;
    extendedRelation.base_primary_column = this.getPrimaryKeyColumnName(relationship.baseTableName);
    extendedRelation.related_table_name = relationship.relatedTableName;
    extendedRelation.related_primary_column = this.getPrimaryKeyColumnName(relationship.relatedTableName);
    extendedRelation.mapping_table_name = userMappingTable.table_name;
    extendedRelation.relation_name = relationship.relationName;
  }

  if (!this.validateRelationship(extendedRelation.base_table_name, extendedRelation.related_table_name, extendedRelation.relation_name)) {
    return Promise.resolve(false);
  }
  return this.createUserMappingTable(userMappingTable)
  .then(function() {
    var mappingTableRelations = this.extendedRelationDao.queryByMappingTableName(extendedRelation.mapping_table_name);
    if (mappingTableRelations.length) {
      return mappingTableRelations[0];
    }
    this.extendedRelationDao.create(extendedRelation);
    return extendedRelation;
  }.bind(this));
}

/**
 * Get the primary key column name from the specified table
 * @param  {string} tableName table name
 * @return {string}
 */
RelatedTablesExtension.prototype.getPrimaryKeyColumnName = function(tableName) {
  var reader = new UserTableReader(tableName);
  var table = reader.readTable(this.geoPackage.getDatabase());
  return table.getPkColumn().name;
}

/**
 * Adds a features relationship between the base feature and related feature
 * table. Creates a default user mapping table if needed.
 * @param  {module:extension/relatedTables~Relationship|module:extension/relatedTables~ExtendedRelation} relationship relationship to add
 * @return {Promise<module:extension/relatedTables~ExtendedRelation>}
 */
RelatedTablesExtension.prototype.addFeaturesRelationship = function(relationship) {
  if (relationship.hasOwnProperty('relation_name')) {
    relationship.relation_name = relationship.relation_name || RelationType.FEATURES.name;
  } else {
    relationship.relationType = RelationType.FEATURES;
  }
  return this.addRelationship(relationship);
}

/**
 * Adds a simple attributes relationship between the base table and user
 * simple attributes related table. Creates a default user mapping table and
 * the simple attributes table if needed.
 * @param  {module:extension/relatedTables~Relationship|module:extension/relatedTables~ExtendedRelation} relationship relationship to add
 * @return {Promise<module:extension/relatedTables~ExtendedRelation>}
 */
RelatedTablesExtension.prototype.addSimpleAttributesRelationship = function(relationship) {
  if (relationship.hasOwnProperty('relation_name')) {
    relationship.relation_name = relationship.relation_name || RelationType.SIMPLE_ATTRIBUTES.name;
  } else {
    relationship.relationType = RelationType.SIMPLE_ATTRIBUTES;
  }
  return this.addRelationship(relationship);
}

/**
 * Adds a media relationship between the base table and user media related
 * table. Creates a default user mapping table and the media table if
 * needed.
 * @param  {module:extension/relatedTables~Relationship|module:extension/relatedTables~ExtendedRelation} relationship relationship to add
 * @return {Promise<module:extension/relatedTables~ExtendedRelation>}
 */
RelatedTablesExtension.prototype.addMediaRelationship = function(relationship) {
  if (relationship.hasOwnProperty('relation_name')) {
    relationship.relation_name = relationship.relation_name || RelationType.MEDIA.name;
  } else {
    relationship.relationType = RelationType.MEDIA;
  }
  return this.addRelationship(relationship);
}

/**
 * Remove a specific relationship from the GeoPackage
 * @param  {module:extension/relatedTables~Relationship|module:extension/relatedTables~ExtendedRelation} relationship relationship to remove
 * @return {Number} number of relationships removed
 */
RelatedTablesExtension.prototype.removeRelationship = function(relationship) {
  // this is an ExtendedRelation
  if (relationship.hasOwnProperty('base_table_name')) {
    relationship.baseTableName = relationship.base_table_name;
    relationship.relatedTableName = relationship.related_table_name;
    relationship.relationName = relationship.relation_name;
    relationship.userMappingTable = relationship.mapping_table_name;
  }

  if (relationship.relationType) {
    relationship.relationName = relationship.relationType.name;
  }
  if (relationship.relationAuthor) {
    relationship.relationName = this.buildRelationName(relationship.relationAuthor, relationship.relationName);
  }

  if (this.extendedRelationDao.isTableExists()) {

    var values = new ColumnValues();
    values.addColumn(ExtendedRelationDao.COLUMN_BASE_TABLE_NAME, relationship.baseTableName);
    values.addColumn(ExtendedRelationDao.COLUMN_RELATED_TABLE_NAME, relationship.relatedTableName);
    values.addColumn(ExtendedRelationDao.COLUMN_RELATION_NAME, relationship.relationName);

    var iterator = this.extendedRelationDao.queryForFieldValues(values);

    var tablesToDelete = [];
    for (var extendedRelation of iterator) {
      tablesToDelete.push(extendedRelation.mapping_table_name);
    }
    tablesToDelete.forEach(function(table) {
      this.geoPackage.deleteTable(table);
    }.bind(this));
    this.extensionsDao.deleteByExtensionAndTableName(RelatedTablesExtension.EXTENSION_NAME, relationship.userMappingTable);
    return this.extendedRelationDao.delete(extendedRelation);
  }

  return 0;
}

/**
 * Create a default user mapping table and extension row if either does not
 * exist. When not created, there is no guarantee that an existing table has
 * the same schema as the provided tabled.
 * @param  {string|module:extension/relatedTables~UserMappingTable} userMappingTableOrName user mapping table or name
 * @return {Promise<Boolean>}
 */
RelatedTablesExtension.prototype.createUserMappingTable = function(userMappingTableOrName) {
  var userMappingTable = userMappingTableOrName;
  if (typeof userMappingTableOrName === 'string') {
    userMappingTable = UserMappingTable.create(userMappingTableOrName);
  }
  return this.getOrCreateMappingTable(userMappingTable.table_name)
  .then(function(){
    if (!this.geoPackage.isTable(userMappingTable.table_name)) {
      return this.geoPackage.tableCreator.createUserTable(userMappingTable);
    }
    return true;
  }.bind(this));
}

/**
 * Create a user related table if it does not exist. When not created, there
 * is no guarantee that an existing table has the same schema as the
 * provided tabled.
 * @param  {module:extension/relatedTables~UserRelatedTable} relatedTable user related table
 * @return {Boolean} true if the table now exists
 */
RelatedTablesExtension.prototype.createRelatedTable = function(relatedTable) {
  if (!this.geoPackage.isTable(relatedTable.table_name)) {
    this.geoPackage.tableCreator.createUserTable(relatedTable);

    var contents = new Contents();
    contents.table_name = relatedTable.table_name;
    contents.data_type = relatedTable.data_type;
    contents.identifier = relatedTable.table_name;
    this.geoPackage.getContentsDao().create(contents);
    var refreshed = this.geoPackage.getContentsDao().refresh(contents);
    relatedTable.setContents(refreshed);
  }
  return true;
}

/**
 * Validate that the relation name is valid between the base and related tables
 * @param  {string} baseTableName    base table name
 * @param  {string} relatedTableName related table name
 * @param  {string} relationName     relation name
 * @return {Boolean}
 */
RelatedTablesExtension.prototype.validateRelationship = function(baseTableName, relatedTableName, relationName) {
  // Verify the base and related tables exist
  if (!this.geoPackage.isTable(baseTableName)) {
    console.log('Base relationship table does not exist: ' + baseTableName + ', Relation: ' + relationName);
    return false;
  }
  if (!this.geoPackage.isTable(relatedTableName)) {
    console.log('Related relationship table does not exist: ' + relatedTableName + ', Relation: ' + relationName);
    return false;
  }
  // Verify spec defined relation types
  var relationType = RelationType.fromName(relationName);
  if (relationType === RelationType.FEATURES) {
    if (!this.geoPackage.hasFeatureTable(baseTableName)) {
      console.log('The base table must be a feature table.');
      return false;
    }
    if (!this.geoPackage.hasFeatureTable(relatedTableName)) {
      console.log('The related table must be a feature table.');
      return false;
    }
    return true;
  } else if (relationType === RelationType.SIMPLE_ATTRIBUTES
  || relationType === RelationType.MEDIA) {
    if (!this.geoPackage.isTableType(relationType.dataType, relatedTableName)) {
      console.log('The related table must be a ' + relationType.dataType + ' table.  Related Table: ' + relatedTableName + ', Type: ' + this.geoPackage.getTableType(relatedTableName));
      return false;
    }
    return true;
  }
  console.log('Unsupported relation type: ' + relationType);
  return false;
}

/**
 * Link related Ids
 * @param  {string} baseTableName    base table name
 * @param  {Number} baseId           base row id
 * @param  {string} relatedTableName related table name
 * @param  {Number} relatedId        related row id
 * @param  {module:extension/relatedTables~RelationType} relationType     relation type
 * @return {Promise}
 */
RelatedTablesExtension.prototype.linkRelatedIds = function(baseTableName, baseId, relatedTableName, relatedId, relationType) {
  var baseDao = UserDao.readTable(this.geoPackage, baseTableName);
  var relatedDao = UserDao.readTable(this.geoPackage, relatedTableName);

  var baseRow = baseDao.queryForId(baseId);
  var relatedRow = relatedDao.queryForId(relatedId);

  return baseDao.linkRelatedRow(baseRow, relatedRow, relationType);
}

/**
 * Get the related id mappings for the base id
 * @param  {string} mappingTableName mapping table name
 * @param  {Number} baseId           base id
 * @return {Number[]} ids of related items
 */
RelatedTablesExtension.prototype.getMappingsForBase = function(mappingTableName, baseId) {
  var mappingDao = this.getMappingDao(mappingTableName);
  var results = mappingDao.queryByBaseId(baseId);
  var relatedIds = [];
  for (var i = 0; i < results.length; i++) {
    var row = mappingDao.getUserMappingRow(results[i]);
    relatedIds.push(row.getRelatedId());
  }
  return relatedIds;
}

/**
 * Get the related id mapping rows for the base id
 * @param  {string} mappingTableName mapping table name
 * @param  {Number} baseId           base id
 * @return {module:extension/relatedTables~UserMappingRow[]} user mapping rows
 */
RelatedTablesExtension.prototype.getMappingRowsForBase = function(mappingTableName, baseId) {
  var mappingDao = this.getMappingDao(mappingTableName);
  return mappingDao.queryByBaseId(baseId);
}

/**
 * Get the base id mappings for the base id
 * @param  {string} mappingTableName mapping table name
 * @param  {Number} relatedId           related id
 * @return {Number[]} ids of base items
 */
RelatedTablesExtension.prototype.getMappingsForRelated = function(mappingTableName, relatedId) {
  var mappingDao = this.getMappingDao(mappingTableName);
  var results = mappingDao.queryByRelatedId(relatedId);
  var baseIds = [];
  for (var i = 0; i < results.length; i++) {
    var row = mappingDao.getUserMappingRow(results[i]);
    baseIds.push(row.getBaseId());
  }
  return baseIds;
}

/**
 * Returns a {module:extension/relatedTables~MediaDao} from the table specified
 * @param  {string|module:extension/relatedTables~MediaTable} tableName either a table name or a MediaTable
 * @return {module:extension/relatedTables~MediaDao}
 */
RelatedTablesExtension.prototype.getMediaDao = function(tableName) {
  var table;
  if (tableName.TABLE_TYPE && tableName.TABLE_TYPE === 'media') {
    table = tableName;
  } else {
    if (tableName.related_table_name) {
      tableName = tableName.related_table_name;
    }
    var reader = new UserTableReader(tableName, MediaTable.requiredColumns());
    var userTable = reader.readTable(this.geoPackage.getDatabase());
    table = new MediaTable(userTable.table_name, userTable.columns, MediaTable.requiredColumns());
    table.setContents(this.geoPackage.getContentsDao().queryForId(table.table_name));
  }

  return new MediaDao(this.geoPackage, table);
}

/**
 * Returns a {module:extension/relatedTables~SimpleAttributesDao} from the table specified
 * @param  {string|module:extension/relatedTables~SimpleAttributesDao} tableName either a table name or a SimpleAttributesDao
 * @return {module:extension/relatedTables~SimpleAttributesDao}
 */
RelatedTablesExtension.prototype.getSimpleAttributesDao = function(tableName) {
  var table;
  if (tableName.TABLE_TYPE && tableName.TABLE_TYPE === 'simple_attributes') {
    table = tableName;
  } else {
    if (tableName.related_table_name) {
      tableName = tableName.related_table_name;
    }
    var reader = new UserTableReader(tableName, SimpleAttributesTable.requiredColumns());
    var userTable = reader.readTable(this.geoPackage.getDatabase());
    table = new SimpleAttributesTable(userTable.table_name, userTable.columns, SimpleAttributesTable.requiredColumns());
    table.setContents(this.geoPackage.getContentsDao().queryForId(table.table_name));
  }

  return new SimpleAttributesDao(this.geoPackage, table);
}

/**
 * Builds the custom relation name with the author
 * @param  {string} author author
 * @param  {string} name   name
 * @return {string}
 */
RelatedTablesExtension.prototype.buildRelationName = function(author, name) {
  return 'x-' + author + '_' + name;
}

/**
 * Remove all traces of the extension
 */
RelatedTablesExtension.prototype.removeExtension = function() {
  if (this.extendedRelationDao.isTableExists()) {
    var extendedRelations = this.extendedRelationDao.queryForAll();
    extendedRelations.forEach(function(relation) {
      this.geoPackage.deleteTable(relation.mapping_table_name);
    }.bind(this));
    this.geoPackage.deleteTable(ExtendedRelationDao.TABLE_NAME);
  }
  if (this.extensionsDao.isTableExists()) {
    this.extensionsDao.deleteByExtension(RelatedTablesExtension.EXTENSION_NAME);
  }
}

/**
 * Determine if the GeoPackage has the extension
 * @param  {string} [mappingTableName] mapping table name to check, if not specified, this checks for any mapping table name
 * @return {Boolean}
 */
RelatedTablesExtension.prototype.has = function(mappingTableName) {
  if (mappingTableName) {
    return this.hasExtension(RelatedTablesExtension.EXTENSION_NAME, ExtendedRelationDao.TABLE_NAME)
      && this.hasExtension(RelatedTablesExtension.EXTENSION_NAME, mappingTableName);
  }
  return this.hasExtension(RelatedTablesExtension.EXTENSION_NAME, ExtendedRelationDao.TABLE_NAME);
}

RelatedTablesExtension.EXTENSION_NAME = 'related_tables';
RelatedTablesExtension.EXTENSION_RELATED_TABLES_AUTHOR = 'gpkg';
RelatedTablesExtension.EXTENSION_RELATED_TABLES_NAME_NO_AUTHOR = 'related_tables';
RelatedTablesExtension.EXTENSION_RELATED_TABLES_DEFINITION = 'TBD';

module.exports = RelatedTablesExtension;

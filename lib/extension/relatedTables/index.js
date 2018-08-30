/**
 * RelatedTablesExtension module.
 * @module RelatedTablesExtension
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
  , UserTableReader = require('../../user/userTableReader')
  , RelationType = require('./relationType')
  , ContentsDao = require('../../core/contents').ContentsDao
  , Contents = require('../../core/contents').Contents
  , GeometryColumnsDao = require('../../features/columns').GeometryColumnsDao;

var util = require('util');

var RelatedTablesExtension = function(geoPackage) {
  BaseExtension.call(this, geoPackage);
  this.extendedRelationDao = geoPackage.getExtendedRelationDao();
}

util.inherits(RelatedTablesExtension, BaseExtension);

RelatedTablesExtension.prototype.getOrCreateExtension = function() {
  return this.getOrCreate(RelatedTablesExtension.EXTENSION_NAME, 'gpkgext_relations', undefined, RelatedTablesExtension.EXTENSION_RELATED_TABLES_DEFINITION, Extension.READ_WRITE)
  .then(function() {
    return this.extendedRelationDao.createTable();
  }.bind(this));
};

RelatedTablesExtension.prototype.getOrCreateMappingTable = function(mappingTable) {
  return this.getOrCreateExtension()
  .then(function() {
    this.getOrCreate(RelatedTablesExtension.EXTENSION_NAME, mappingTable, undefined, RelatedTablesExtension.EXTENSION_RELATED_TABLES_DEFINITION, Extension.READ_WRITE);
  }.bind(this));
}

RelatedTablesExtension.prototype.setContents = function(userRelatedTable) {
  var contents = this.geoPackage.getContentsDao().queryForIdObject(userRelatedTable.table_name);
  userRelatedTable.setContents(contents);
}

RelatedTablesExtension.prototype.getUserDao = function(tableName, requiredColumns) {
  return UserCustomDao.readTable(this.geoPackage, tableName, requiredColumns);
}

RelatedTablesExtension.prototype.getMappingDao = function(tableName) {
  if (tableName.mapping_table_name) {
    tableName = tableName.mapping_table_name;
  }
  return new UserMappingDao(this.getUserDao(tableName, UserMappingTable.requiredColumns()), this.geoPackage);
}

RelatedTablesExtension.prototype.getRelationships = function() {
  if (this.extendedRelationDao.isTableExists()) {
    return this.extendedRelationDao.queryForAll();
  }
  return [];
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

RelatedTablesExtension.prototype.getRelationshipBuilder = function() {
  return RelatedTablesExtension.RelationshipBuilder();
}

RelatedTablesExtension.prototype.addRelationship = function(relationship) {
  if (relationship.relationType) {
    relationship.relationName = relationship.relationType.name;
  }
  if (relationship.relationAuthor) {
    relationship.relationName = this.buildRelationName(relationship.relationAuthor, relationship.relationName);
  }
  if (relationship.mappingTableName) {
    relationship.userMappingTable = UserMappingTable.create(relationship.mappingTableName);
  }

  if (relationship.relatedTable) {
    this.createRelatedTable(relationship.relatedTable);
    relationship.relatedTableName = relationship.relatedTable.table_name;
    relationship.relationName = relationship.relatedTable.relation_name;
  }

  if (!this.validateRelationship(relationship.baseTableName, relationship.relatedTableName, relationship.relationName)) {
    return Promise.resolve(false);
  }
  console.log('adding relationship', relationship);
  return this.createUserMappingTable(relationship.userMappingTable)
  .then(function() {
    var extendedRelation = this.extendedRelationDao.createObject();
    extendedRelation.base_table_name = relationship.baseTableName;
    extendedRelation.base_primary_column = this.getPrimaryKeyColumnName(relationship.baseTableName);
    extendedRelation.related_table_name = relationship.relatedTableName;
    extendedRelation.related_primary_column = this.getPrimaryKeyColumnName(relationship.relatedTableName);
    extendedRelation.mapping_table_name = relationship.userMappingTable.table_name;
    extendedRelation.relation_name = relationship.relationName;

    this.extendedRelationDao.create(extendedRelation);
    return extendedRelation;
  }.bind(this));
}

RelatedTablesExtension.prototype.getPrimaryKeyColumnName = function(tableName) {
  var reader = new UserTableReader(tableName);
  var table = reader.readTable(this.geoPackage.getDatabase());
  return table.getPkColumn().name;
}

RelatedTablesExtension.prototype.addFeaturesRelationship = function(relationship) {
  relationship.relationType = RelationType.FEATURES;
  return this.addRelationship(relationship);
}

RelatedTablesExtension.prototype.addSimpleAttributesRelationship = function(relationship) {
  relationship.relationType = RelationType.SIMPLE_ATTRIBUTES;
  return this.addRelationship(relationship);
}

RelatedTablesExtension.prototype.addMediaRelationship = function(relationship) {
  relationship.relationType = RelationType.MEDIA;
  return this.addRelationship(relationship);
}

RelatedTablesExtension.prototype.removeRelationship = function(relationship) {
  // this is an ExtendedRelation
  if (relationship.base_table_name) {
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
    this.extendedRelationDao.delete(extendedRelation);
  }
}

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
    table.setContents(this.geoPackage.getContentsDao().queryForIdObject(table.table_name));
  }

  return new MediaDao(this.geoPackage, table);
}

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
    table.setContents(this.geoPackage.getContentsDao().queryForIdObject(table.table_name));
  }

  return new SimpleAttributesDao(this.geoPackage, table);
}

RelatedTablesExtension.prototype.buildRelationName = function(author, name) {
  return 'x-' + author + '_' + name;
}

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

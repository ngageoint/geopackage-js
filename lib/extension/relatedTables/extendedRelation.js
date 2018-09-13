/**
 * @module extension/relatedTables
 */

var Dao = require('../../dao/dao')
  , ColumnValues = require('../../dao/columnValues');

var util = require('util');

/**
 * Describes the relationships between a base table, a related data table, and a
 * mapping table
 * @class ExtendedRelation
 */
var ExtendedRelation = function() {

  /**
   * Autoincrement primary key
   * @member {Number}
   */
  this.id;

  /**
   * Name of the table containing the base data (e.g., features) to relate
   * @member {String}
   */
  this.base_table_name;

  /**
   * Name of the primary key column in base_table_name
   * @member {String}
   */
  this.base_primary_column;

  /**
   * Name of the table containing the related content
   * @member {String}
   */
  this.related_table_name;

  /**
   * Name of the primary key column in related_table_name
   * @member {String}
   */
  this.related_primary_column;

  /**
   * Name (profile) of the relationship
   * @member {String}
   */
  this.relation_name;

  /**
   * Name of a mapping table
   * @member {String}
   */
  this.mapping_table_name;
}

/**
 * Extended Relations Data Access Object
 * @class ExtendedRelationDao
 * @extends {module:dao/dao~Dao}
 */
var ExtendedRelationDao = function(geoPackage) {
  Dao.call(this, geoPackage);
};

util.inherits(ExtendedRelationDao, Dao);

/**
 * Create a {module:extension/relatedTables~ExtendedRelation} object
 * @return {module:extension/relatedTables~ExtendedRelation}
 */
ExtendedRelationDao.prototype.createObject = function() {
  return new ExtendedRelation();
};

/**
 * Create the necessary tables for this dao
 * @return {Promise}
 */
ExtendedRelationDao.prototype.createTable = function() {
  var tc = this.geoPackage.getTableCreator();
  return tc.createExtendedRelations();
}

/**
 * Get all the base table names
 * @return {string[]}
 */
ExtendedRelationDao.prototype.getBaseTables = function() {
  var baseTables = [];
  var baseTableColumns = this.queryForColumns('base_table_name');
  for (var i = 0; i < baseTableColumns.length; i++) {
    baseTables.push(baseTableColumns[i].base_table_name);
  }
  return baseTables;
};

/**
 * Get all the related table names
 * @return {string[]}
 */
ExtendedRelationDao.prototype.getRelatedTables = function() {
  var relatedTables = [];
  var relatedTableColumns = this.queryForColumns('related_table_name');
  for (var i = 0; i < relatedTableColumns.length; i++) {
    relatedTables.push(relatedTableColumns[i].related_table_name);
  }
  return relatedTables;
};

/**
 * Get all relations for the given base table name
 * @param  {string} baseTable base table name
 * @return {module:extension/relatedTables~ExtendedRelation[]}
 */
ExtendedRelationDao.prototype.getBaseTableRelations = function(baseTable) {
  return this.queryForAllEq(ExtendedRelationDao.COLUMN_BASE_TABLE_NAME, baseTable);
}

/**
 * Get all relations for the given related table name
 * @param  {string} relatedTable related table name
 * @return {module:extension/relatedTables~ExtendedRelation[]}
 */
ExtendedRelationDao.prototype.getRelatedTableRelations = function(relatedTable) {
  return this.queryForAllEq(ExtendedRelationDao.COLUMN_RELATED_TABLE_NAME, relatedTable);
}

/**
 * Get all relations for the base table with the relation name
 * @param  {string} baseTable base table name
 * @param  {string} name      relation name
 * @return {module:extension/relatedTables~ExtendedRelation[]}
 */
ExtendedRelationDao.prototype.getBaseTableRelationsWithName = function(baseTable, name) {
  var fields = new ColumnValues();
  fields.addColumn(ExtendedRelationDao.COLUMN_BASE_TABLE_NAME, baseTable);
  fields.addColumn(ExtendedRelationDao.COLUMN_RELATION_NAME, name);
  var where = this.buildWhere(fields, 'and');
  var whereArgs = this.buildWhereArgs(fields);
  return this.queryForAll(where, whereArgs);
}

/**
 * Get all relations to the table.  Returns relations where the table is the base table and relations where the table is the related table.
 * @param  {string} table table name to query for
 * @return {module:extension/relatedTables~ExtendedRelation[]}
 */
ExtendedRelationDao.prototype.getTableRelations = function(table) {
  var fields = new ColumnValues();
  fields.addColumn(ExtendedRelationDao.COLUMN_BASE_TABLE_NAME, table);
  fields.addColumn(ExtendedRelationDao.COLUMN_RELATED_TABLE_NAME, table);
  var where = this.buildWhere(fields, 'or');
  var whereArgs = this.buildWhereArgs(fields);
  return this.queryForAll(where, whereArgs);
}

/**
 * Get all relations by the mapping table name
 * @param  {string} mappingTableName name of the mapping table
 * @return {module:extension/relatedTables~ExtendedRelation[]}
 */
ExtendedRelationDao.prototype.queryByMappingTableName = function(mappingTableName) {
  var fields = new ColumnValues();
  fields.addColumn(ExtendedRelationDao.COLUMN_MAPPING_TABLE_NAME, mappingTableName);
  var where = this.buildWhere(fields, 'and');
  var whereArgs = this.buildWhereArgs(fields);
  return this.queryForAll(where, whereArgs);
}

ExtendedRelationDao.TABLE_NAME = 'gpkgext_relations';
ExtendedRelationDao.COLUMN_ID = ExtendedRelationDao.TABLE_NAME + '.id';
ExtendedRelationDao.COLUMN_BASE_TABLE_NAME = ExtendedRelationDao.TABLE_NAME + '.base_table_name';
ExtendedRelationDao.COLUMN_BASE_PRIMARY_COLUMN = ExtendedRelationDao.TABLE_NAME + '.base_primary_column';
ExtendedRelationDao.COLUMN_RELATED_TABLE_NAME = ExtendedRelationDao.TABLE_NAME + '.related_table_name';
ExtendedRelationDao.COLUMN_RELATED_PRIMARY_COLUMN = ExtendedRelationDao.TABLE_NAME + '.related_primary_column';
ExtendedRelationDao.COLUMN_RELATION_NAME = ExtendedRelationDao.TABLE_NAME + '.relation_name';
ExtendedRelationDao.COLUMN_MAPPING_TABLE_NAME = ExtendedRelationDao.TABLE_NAME + '.mapping_table_name';

ExtendedRelationDao.prototype.gpkgTableName = ExtendedRelationDao.TABLE_NAME;
ExtendedRelationDao.prototype.idColumns = ['id'];

module.exports.ExtendedRelationDao = ExtendedRelationDao;
module.exports.ExtendedRelation = ExtendedRelation;

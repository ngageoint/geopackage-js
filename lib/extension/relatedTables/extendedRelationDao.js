var Dao = require('../../dao/dao')
  , ColumnValues = require('../../dao/columnValues')
  , ExtendedRelation = require('./extendedRelation');

/**
 * Extended Relations Data Access Object
 * @class ExtendedRelationDao
 * @extends Dao
 */
class ExtendedRelationDao extends Dao {
  /**
   * Create a {module:extension/relatedTables~ExtendedRelation} object
   * @return {module:extension/relatedTables~ExtendedRelation}
   */
  createObject(result) {
    var er = new ExtendedRelation();
    if (result) {
      er.base_table_name = result.base_table_name;
      er.base_primary_column = result.base_primary_column;
      er.related_table_name = result.base_primary_column;
      er.related_table_name = result.related_table_name;
      er.relation_name = result.relation_name;
      er.mapping_table_name = result.mapping_table_name;
      er.related_primary_column = result.related_primary_column;
      er.id = result.id;
    }
    return er;
  }
  /**
   * Create the necessary tables for this dao
   * @return {Promise}
   */
  createTable() {
    var tc = this.geoPackage.getTableCreator();
    return tc.createExtendedRelations();
  }
  /**
   * Get all the base table names
   * @return {string[]}
   */
  getBaseTables() {
    var baseTables = [];
    var baseTableColumns = this.queryForColumns('base_table_name');
    for (var i = 0; i < baseTableColumns.length; i++) {
      baseTables.push(baseTableColumns[i].base_table_name);
    }
    return baseTables;
  }
  /**
   * Get all the related table names
   * @return {string[]}
   */
  getRelatedTables() {
    var relatedTables = [];
    var relatedTableColumns = this.queryForColumns('related_table_name');
    for (var i = 0; i < relatedTableColumns.length; i++) {
      relatedTables.push(relatedTableColumns[i].related_table_name);
    }
    return relatedTables;
  }
  /**
   * Get all relations for the given base table name
   * @param  {string} baseTable base table name
   * @return {module:extension/relatedTables~ExtendedRelation[]}
   */
  getBaseTableRelations(baseTable) {
    var results = [];
    for (var relation of this.queryForAllEq(ExtendedRelationDao.COLUMN_BASE_TABLE_NAME, baseTable)) {
      results.push(this.createObject(relation));
    }
    return results;
  }
  /**
   * Get all relations for the given related table name
   * @param  {string} relatedTable related table name
   * @return {module:extension/relatedTables~ExtendedRelation[]}
   */
  getRelatedTableRelations(relatedTable) {
    var results = [];
    for (var relation of this.queryForAllEq(ExtendedRelationDao.COLUMN_RELATED_TABLE_NAME, relatedTable)) {
      results.push(this.createObject(relation));
    }
    return results;
  }
  /**
   * Get all relations for the base table with the relation name
   * @param  {string} baseTable base table name
   * @param  {string} name      relation name
   * @return {module:extension/relatedTables~ExtendedRelation[]}
   */
  getBaseTableRelationsWithName(baseTable, name) {
    var fields = new ColumnValues();
    fields.addColumn(ExtendedRelationDao.COLUMN_BASE_TABLE_NAME, baseTable);
    fields.addColumn(ExtendedRelationDao.COLUMN_RELATION_NAME, name);
    var where = this.buildWhere(fields, 'and');
    var whereArgs = this.buildWhereArgs(fields);
    var results = [];
    for (var relation of this.queryForAll(where, whereArgs)) {
      results.push(this.createObject(relation));
    }
    return results;
  }
  /**
   * Get all relations to the table.  Returns relations where the table is the base table and relations where the table is the related table.
   * @param  {string} table table name to query for
   * @return {module:extension/relatedTables~ExtendedRelation[]}
   */
  getTableRelations(table) {
    var fields = new ColumnValues();
    fields.addColumn(ExtendedRelationDao.COLUMN_BASE_TABLE_NAME, table);
    fields.addColumn(ExtendedRelationDao.COLUMN_RELATED_TABLE_NAME, table);
    var where = this.buildWhere(fields, 'or');
    var whereArgs = this.buildWhereArgs(fields);
    var results = [];
    for (var relation of this.queryForAll(where, whereArgs)) {
      results.push(this.createObject(relation));
    }
    return results;
  }
  /**
   * Gets all relationships in the GeoPackage with an optional base table name and an optional base id
   * @param {String} [baseTableName] base table name
   * @param {String} [relatedTableName] related table name
   * @param {String} [mappingTableName] mapping table name
   * @return {module:extension/relatedTables~ExtendedRelation[]}
   */
  getRelations(baseTableName, relatedTableName, mappingTableName) {
    var fields = new ColumnValues();
    fields.addColumn(ExtendedRelationDao.COLUMN_BASE_TABLE_NAME, baseTableName);
    fields.addColumn(ExtendedRelationDao.COLUMN_RELATED_TABLE_NAME, relatedTableName);
    fields.addColumn(ExtendedRelationDao.COLUMN_MAPPING_TABLE_NAME, mappingTableName);
    var where = this.buildWhereLike(fields, 'and');
    var whereArgs = this.buildWhereArgs(fields);
    var results = [];
    for (var relation of this.queryForAll(where, whereArgs)) {
      results.push(this.createObject(relation));
    }
    return results;
  }
  /**
   * Get all relations by the mapping table name
   * @param  {string} mappingTableName name of the mapping table
   * @return {module:extension/relatedTables~ExtendedRelation[]}
   */
  queryByMappingTableName(mappingTableName) {
    var fields = new ColumnValues();
    fields.addColumn(ExtendedRelationDao.COLUMN_MAPPING_TABLE_NAME, mappingTableName);
    var where = this.buildWhere(fields, 'and');
    var whereArgs = this.buildWhereArgs(fields);
    var results = [];
    for (var relation of this.queryForAll(where, whereArgs)) {
      results.push(this.createObject(relation));
    }
    return results;
  }
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

module.exports = ExtendedRelationDao;
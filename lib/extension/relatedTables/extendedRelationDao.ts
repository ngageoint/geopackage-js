import {Dao} from '../../dao/dao';
import ColumnValues from '../../dao/columnValues'
import ExtendedRelation from './extendedRelation';

/**
 * Extended Relations Data Access Object
 * @class ExtendedRelationDao
 * @extends Dao
 */
export class ExtendedRelationDao extends Dao<ExtendedRelation> {
  public static readonly TABLE_NAME: string = 'gpkgext_relations';
  public static readonly COLUMN_ID: string = ExtendedRelationDao.TABLE_NAME + '.id';
  public static readonly COLUMN_BASE_TABLE_NAME: string = ExtendedRelationDao.TABLE_NAME + '.base_table_name';
  public static readonly COLUMN_BASE_PRIMARY_COLUMN: string = ExtendedRelationDao.TABLE_NAME + '.base_primary_column';
  public static readonly COLUMN_RELATED_TABLE_NAME: string = ExtendedRelationDao.TABLE_NAME + '.related_table_name';
  public static readonly COLUMN_RELATED_PRIMARY_COLUMN: string = ExtendedRelationDao.TABLE_NAME + '.related_primary_column';
  public static readonly COLUMN_RELATION_NAME: string = ExtendedRelationDao.TABLE_NAME + '.relation_name';
  public static readonly COLUMN_MAPPING_TABLE_NAME: string = ExtendedRelationDao.TABLE_NAME + '.mapping_table_name';

  readonly gpkgTableName: string = ExtendedRelationDao.TABLE_NAME;
  readonly idColumns: string[] = ['id'];
  /**
   * Create a {module:extension/relatedTables~ExtendedRelation} object
   * @return {module:extension/relatedTables~ExtendedRelation}
   */
  createObject(result?: any): ExtendedRelation {
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
  createTable(): Promise<boolean> {
    var tc = this.geoPackage.getTableCreator();
    return tc.createExtendedRelations();
  }
  /**
   * Get all the base table names
   * @return {string[]}
   */
  getBaseTables(): string[] {
    var baseTables: string[] = [];
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
  getRelatedTables(): string[] {
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
  getBaseTableRelations(baseTable: string): ExtendedRelation[] {
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
  getRelatedTableRelations(relatedTable: string): ExtendedRelation[] {
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
  getBaseTableRelationsWithName(baseTable: string, name: string): ExtendedRelation[] {
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
  getTableRelations(table: string): ExtendedRelation[] {
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
  getRelations(baseTableName?: string, relatedTableName?: string, mappingTableName?: string): ExtendedRelation[] {
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
  queryByMappingTableName(mappingTableName: string): ExtendedRelation[] {
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

import { ColumnValues } from '../../dao/columnValues';
import { ExtendedRelation } from './extendedRelation';
import { DBValue } from '../../db/dbValue';
import { GeoPackageDao } from '../../db/geoPackageDao';
import { GeoPackageConnection } from '../../db/geoPackageConnection';
import { Contents } from '../../contents/contents';

/**
 * Extended Relations Data Access Object
 */
export class ExtendedRelationsDao extends GeoPackageDao<ExtendedRelation, number> {
  readonly gpkgTableName: string = ExtendedRelation.TABLE_NAME;
  readonly idColumns: string[] = ['id'];

  /**
   * Constructor
   * @param geoPackageConnection GeoPackage object this dao belongs to
   */
  constructor(geoPackageConnection: GeoPackageConnection) {
    super(geoPackageConnection, Contents.TABLE_NAME);
  }

  public static createDao(geoPackageConnection: GeoPackageConnection): ExtendedRelationsDao {
    return new ExtendedRelationsDao(geoPackageConnection);
  }

  queryForIdWithKey(key: number): ExtendedRelation {
    return this.queryForId(key);
  }

  /**
   * Create a {module:extension/relatedTables~ExtendedRelation} object
   * @return {module:extension/relatedTables~ExtendedRelation}
   */
  createObject(result?: Record<string, DBValue>): ExtendedRelation {
    const er = new ExtendedRelation();
    if (result) {
      er.setBaseTableName(result.base_table_name as string);
      er.setBasePrimaryColumn(result.base_primary_column as string);
      er.setBasePrimaryColumn(result.base_primary_column as string);
      er.setRelatedTableName(result.related_table_name as string);
      er.setRelationName(result.relation_name as string);
      er.setMappingTableName(result.mapping_table_name as string);
      er.setRelatedPrimaryColumn(result.related_primary_column as string);
      er.setId(result.id as number);
    }
    return er;
  }
  /**
   * Get all the base table names
   * @return {string[]}
   */
  getBaseTables(): string[] {
    const baseTables: string[] = [];
    const baseTableColumns = this.queryForColumns('base_table_name');
    for (let i = 0; i < baseTableColumns.length; i++) {
      baseTables.push(baseTableColumns[i].base_table_name as string);
    }
    return baseTables;
  }
  /**
   * Get all the related table names
   * @return {string[]}
   */
  getRelatedTables(): string[] {
    const relatedTables = [];
    const relatedTableColumns = this.queryForColumns('related_table_name');
    for (let i = 0; i < relatedTableColumns.length; i++) {
      relatedTables.push(relatedTableColumns[i].related_table_name as string);
    }
    return relatedTables;
  }
  /**
   * Get all relations for the given base table name
   * @param  {string} baseTable base table name
   * @return {module:extension/relatedTables~ExtendedRelation[]}
   */
  getBaseTableRelations(baseTable: string): ExtendedRelation[] {
    const results = [];
    for (const relation of this.queryForAllEq(ExtendedRelation.COLUMN_BASE_TABLE_NAME, baseTable)) {
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
    const results = [];
    for (const relation of this.queryForAllEq(ExtendedRelation.COLUMN_RELATED_TABLE_NAME, relatedTable)) {
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
    const fields = new ColumnValues();
    fields.addColumn(ExtendedRelation.COLUMN_BASE_TABLE_NAME, baseTable);
    fields.addColumn(ExtendedRelation.COLUMN_RELATION_NAME, name);
    const where = this.buildWhere(fields, 'and');
    const whereArgs = this.buildWhereArgs(fields);
    const results = [];
    for (const relation of this.queryForAll(where, whereArgs)) {
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
    const fields = new ColumnValues();
    fields.addColumn(ExtendedRelation.COLUMN_BASE_TABLE_NAME, table);
    fields.addColumn(ExtendedRelation.COLUMN_RELATED_TABLE_NAME, table);
    const where = this.buildWhere(fields, 'or');
    const whereArgs = this.buildWhereArgs(fields);
    const results = [];
    for (const relation of this.queryForAll(where, whereArgs)) {
      results.push(this.createObject(relation));
    }
    return results;
  }

  /**
   * Get the relations matching the non null provided values
   * @param baseTable base table name
   * @param baseColumn base primary column name
   * @param relatedTable related table name
   * @param relatedColumn related primary column name
   * @param relation relation name
   * @param mappingTable mapping table name
   * @return extended relations
   */
  public getRelations(
    baseTable: string,
    baseColumn: string,
    relatedTable: string,
    relatedColumn: string,
    relation: string,
    mappingTable: string,
  ): ExtendedRelation[] {
    const fields = new ColumnValues();

    if (baseTable != null) {
      fields.addColumn(ExtendedRelation.COLUMN_BASE_TABLE_NAME, baseTable);
    }

    if (baseColumn != null) {
      fields.addColumn(ExtendedRelation.COLUMN_BASE_PRIMARY_COLUMN, baseColumn);
    }

    if (relatedTable != null) {
      fields.addColumn(ExtendedRelation.COLUMN_RELATED_TABLE_NAME, relatedTable);
    }

    if (relatedColumn != null) {
      fields.addColumn(ExtendedRelation.COLUMN_RELATED_PRIMARY_COLUMN, relatedColumn);
    }

    if (relation != null) {
      fields.addColumn(ExtendedRelation.COLUMN_RELATION_NAME, relation);
    }

    if (mappingTable != null) {
      fields.addColumn(ExtendedRelation.COLUMN_MAPPING_TABLE_NAME, mappingTable);
    }
    const where = this.buildWhereLike(fields, 'and');
    const whereArgs = this.buildWhereArgs(fields);
    const results = [];
    for (const relation of this.queryForAll(where, whereArgs)) {
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
    const fields = new ColumnValues();
    fields.addColumn(ExtendedRelation.COLUMN_MAPPING_TABLE_NAME, mappingTableName);
    const where = this.buildWhere(fields, 'and');
    const whereArgs = this.buildWhereArgs(fields);
    const results = [];
    for (const relation of this.queryForAll(where, whereArgs)) {
      results.push(this.createObject(relation));
    }
    return results;
  }
}

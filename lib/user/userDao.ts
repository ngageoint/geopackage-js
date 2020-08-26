import { Dao } from '../dao/dao';
import { GeoPackage } from '../geoPackage';
import { UserMappingTable } from '../extension/relatedTables/userMappingTable';
import { MediaTable } from '../extension/relatedTables/mediaTable';
import { SimpleAttributesTable } from '../extension/relatedTables/simpleAttributesTable';
import { UserRow } from './userRow';
import { RelationType } from '../extension/relatedTables/relationType';
import { UserTable } from './userTable';
import { MediaRow } from '../extension/relatedTables/mediaRow';
import { SimpleAttributesRow } from '../extension/relatedTables/simpleAttributesRow';
import { FeatureRow } from '../features/user/featureRow';
import { ExtendedRelation } from '../extension/relatedTables/extendedRelation';
import { DBValue } from '../db/dbAdapter';
import { GeoPackageDataType } from '../db/geoPackageDataType';
import { UserColumn } from './userColumn';
import { AlterTable } from '../db/alterTable';
import { CoreSQLUtils } from '../db/coreSQLUtils';

/**
 * Abstract User DAO for reading user tables
 * @class UserDao
 * @extends Dao
 * @param  {module:db/geoPackageConnection~GeoPackageConnection} geoPackage        connection
 * @param  {string} table table name
 */
export class UserDao<T extends UserRow> extends Dao<UserRow> {
  table_name: string;
  columns: string[];
  protected _table: UserTable<UserColumn>;
  protected constructor(geoPackage: GeoPackage, table: UserTable<UserColumn>) {
    super(geoPackage);
    this._table = table;
    this.table_name = table.getTableName();
    this.gpkgTableName = table.getTableName();
    if (table.getPkColumn()) {
      this.idColumns = [table.getPkColumn().getName()];
    } else {
      this.idColumns = [];
    }
    this.columns = table.getUserColumns().getColumnNames();
  }
  /**
   * Creates a UserRow
   * @param  {Object} [results] results to create the row from if not specified, an empty row is created
   * @return {module:user/userRow~UserRow}
   */
  createObject(results: Record<string, DBValue>): UserRow {
    if (results) {
      return this.getRow(results);
    }
    return this.newRow();
  }
  /**
   * Sets the value in the row
   * @param  {module:user/userRow~UserRow} object      user row
   * @param  {Number} columnIndex index
   * @param  {Object} value       value
   */
  setValueInObject(object: T, columnIndex: number, value: any): void {
    object.setValueNoValidationWithIndex(columnIndex, value);
  }
  /**
   * Get a user row from the current results
   * @param  {Object} results result to create the row from
   * @return {module:user/userRow~UserRow}         the user row
   */
  getRow(results: Record<string, DBValue>): UserRow {
    if (results instanceof UserRow) {
      return results;
    }
    if (!this.table) return undefined;
    const columns = this.table.getColumnCount();
    const columnTypes: { [key: string]: GeoPackageDataType } = {};
    for (let i = 0; i < columns; i++) {
      const column = this.table.getColumnWithIndex(i);
      columnTypes[column.name] = column.dataType;
    }
    return this.newRow(columnTypes, results);
  }
  /**
   * Get the table for this dao
   * @return {module:user/userTable~UserTable}
   */
  get table(): UserTable<UserColumn> {
    return this._table;
  }
  /**
   * Create a user row
   * @param  {module:db/geoPackageDataType[]} columnTypes  column types
   * @param  {module:dao/columnValues~ColumnValues[]} values      values
   * @return {module:user/userRow~UserRow}             user row
   */
  newRow(columnTypes?: { [key: string]: GeoPackageDataType }, values?: Record<string, DBValue>): UserRow {
    return new UserRow(this.table, columnTypes, values);
  }

  /**
   * Links related rows together
   * @param  {module:user/userRow~UserRow} userRow             user row
   * @param  {module:user/userRow~UserRow} relatedRow          related row
   * @param  {string} relationType        relation type
   * @param  {string|UserMappingTable} [mappingTable]        mapping table
   * @param  {module:dao/columnValues~ColumnValues} [mappingColumnValues] column values
   * @return {number}
   */
  linkRelatedRow(
    userRow: UserRow,
    relatedRow: UserRow,
    relationType: RelationType,
    mappingTable?: string | UserMappingTable,
    mappingColumnValues?: Record<string, any>,
  ): number {
    const rte = this.geoPackage.relatedTablesExtension;
    const baseTableName = userRow.table.getTableName();
    const relatedTableName = relatedRow.table.getTableName();
    const relationship = rte
      .getRelationshipBuilder()
      .setBaseTableName(baseTableName)
      .setRelatedTableName(relatedTableName)
      .setRelationType(relationType);
    let mappingTableName: string;
    if (!mappingTable || typeof mappingTable === 'string') {
      mappingTable = mappingTable || baseTableName + '_' + relatedTableName;
      relationship.setMappingTableName(mappingTable);
      mappingTableName = mappingTable as string;
    } else {
      relationship.setUserMappingTable(mappingTable);
      mappingTableName = mappingTable.getTableName();
    }
    rte.addRelationship(relationship);
    const userMappingDao = rte.getMappingDao(mappingTableName);
    const userMappingRow = userMappingDao.newRow();
    userMappingRow.baseId = userRow.id;
    userMappingRow.relatedId = relatedRow.id;
    for (const column in mappingColumnValues) {
      userMappingRow.setValueWithColumnName(column, mappingColumnValues[column]);
    }
    return userMappingDao.create(userMappingRow);
  }
  /**
   * Links a user row to a feature row
   * @param  {module:user/userRow~UserRow} userRow             user row
   * @param  {module:features/user/featureRow~FeatureRow} featureRow          feature row
   * @param  {string|UserMappingTable} [mappingTable]        mapping table
   * @param  {module:dao/columnValues~ColumnValues} [mappingColumnValues] column values
   * @return {number}
   */
  linkFeatureRow(
    userRow: UserRow,
    featureRow: FeatureRow,
    mappingTable?: string | UserMappingTable,
    mappingColumnValues?: Record<string, any>,
  ): number {
    return this.linkRelatedRow(userRow, featureRow, RelationType.FEATURES, mappingTable, mappingColumnValues);
  }
  /**
   * Links a user row to a media row
   * @param  {module:user/userRow~UserRow} userRow             user row
   * @param  {module:extension/relatedTables~MediaRow} mediaRow          media row
   * @param  {string|UserMappingTable} [mappingTable]        mapping table
   * @param  {module:dao/columnValues~ColumnValues} [mappingColumnValues] column values
   * @return {number}
   */
  linkMediaRow(
    userRow: UserRow,
    mediaRow: MediaRow,
    mappingTable?: string | UserMappingTable,
    mappingColumnValues?: Record<string, any>,
  ): number {
    return this.linkRelatedRow(userRow, mediaRow, RelationType.MEDIA, mappingTable, mappingColumnValues);
  }
  /**
   * Links a user row to a simpleAttributes row
   * @param  {module:user/userRow~UserRow} userRow             user row
   * @param  {module:extension/relatedTables~SimpleAttributesRow} simpleAttributesRow          simple attributes row
   * @param  {string|UserMappingTable} [mappingTable]        mapping table
   * @param  {module:dao/columnValues~ColumnValues} [mappingColumnValues] column values
   * @return {number}
   */
  linkSimpleAttributesRow(
    userRow: UserRow,
    simpleAttributesRow: SimpleAttributesRow,
    mappingTable?: string | UserMappingTable,
    mappingColumnValues?: Record<string, any>,
  ): number {
    return this.linkRelatedRow(
      userRow,
      simpleAttributesRow,
      RelationType.SIMPLE_ATTRIBUTES,
      mappingTable,
      mappingColumnValues,
    );
  }
  /**
   * Get all media rows that are linked to this user row
   * @param  {module:user/userRow~UserRow} userRow user row
   * @return {module:extension/relatedTables~MediaRow[]}
   */
  getLinkedMedia(userRow: UserRow): MediaRow[] {
    const mediaRelations = this.mediaRelations;
    const rte = this.geoPackage.relatedTablesExtension;
    const linkedMedia: MediaRow[] = [];
    for (let i = 0; i < mediaRelations.length; i++) {
      const mediaRelation = mediaRelations[i];
      const mediaDao = rte.getMediaDao(mediaRelation);
      const userMappingDao = rte.getMappingDao(mediaRelation.mapping_table_name);
      const mappings = userMappingDao.queryByBaseId(userRow.id);
      for (let m = 0; m < mappings.length; m++) {
        const relatedId = mappings[m].related_id;
        linkedMedia.push(mediaDao.queryForId(relatedId) as MediaRow);
      }
    }
    return linkedMedia;
  }
  /**
   * Get all simple attribute rows that are linked to this user row
   * @param  {module:user/userRow~UserRow} userRow user row
   * @return {module:extension/relatedTables~SimpleAttributeRow[]}
   */
  getLinkedSimpleAttributes(userRow: UserRow): SimpleAttributesRow[] {
    const simpleRelations = this.simpleAttributesRelations;
    const rte = this.geoPackage.relatedTablesExtension;
    const linkedSimpleAttributes: SimpleAttributesRow[] = [];
    for (let i = 0; i < simpleRelations.length; i++) {
      const simpleRelation = simpleRelations[i];
      const simpleDao = rte.getSimpleAttributesDao(simpleRelation);
      const userMappingDao = rte.getMappingDao(simpleRelation.mapping_table_name);
      const mappings = userMappingDao.queryByBaseId(userRow.id);
      for (let m = 0; m < mappings.length; m++) {
        const relatedId = mappings[m].related_id;
        linkedSimpleAttributes.push(simpleDao.queryForId(relatedId) as SimpleAttributesRow);
      }
    }
    return linkedSimpleAttributes;
  }
  /**
   * Get all feature rows that are linked to this user row
   * @param  {module:user/userRow~UserRow} userRow user row
   * @return {module:features/user/featureRow~FeatureRow[]}
   */
  getLinkedFeatures(userRow: UserRow): FeatureRow[] {
    const featureRelations = this.featureRelations;
    const rte = this.geoPackage.relatedTablesExtension;
    const linkedFeatures: FeatureRow[] = [];
    for (let i = 0; i < featureRelations.length; i++) {
      const featureRelation = featureRelations[i];
      const featureDao = this.geoPackage.getFeatureDao(featureRelation.base_table_name);
      const userMappingDao = rte.getMappingDao(featureRelation.mapping_table_name);
      const mappings = userMappingDao.queryByBaseId(userRow.id);
      for (let m = 0; m < mappings.length; m++) {
        const relatedId = mappings[m].related_id;
        linkedFeatures.push(featureDao.queryForId(relatedId) as FeatureRow);
      }
    }
    return linkedFeatures;
  }
  /**
   * Get all simple attribute relations to this table
   * @return {Object[]}
   */
  get simpleAttributesRelations(): ExtendedRelation[] {
    return this.getRelationsWithName(SimpleAttributesTable.RELATION_TYPE.name);
  }
  /**
   * Get all feature relations to this table
   * @return {Object[]}
   */
  get featureRelations(): ExtendedRelation[] {
    return this.getRelationsWithName(RelationType.FEATURES.name);
  }
  /**
   * Get all media relations to this table
   * @return {Object[]}
   */
  get mediaRelations(): ExtendedRelation[] {
    return this.getRelationsWithName(MediaTable.RELATION_TYPE.name);
  }
  /**
   * Get all relations to this table with the specified name
   * @param {string} name
   * @return {Object[]}
   */
  getRelationsWithName(name: string): ExtendedRelation[] {
    return this.geoPackage.extendedRelationDao.getBaseTableRelationsWithName(this.table_name, name);
  }
  /**
   * Get all relations to this table
   * @return {Object[]}
   */
  get relations(): ExtendedRelation[] {
    return this.geoPackage.extendedRelationDao.getBaseTableRelations(this.table_name);
  }
  /**
   * Gets the rows in this table by id
   * @param  {Number[]} ids ids to query for
   * @return {Object[]}
   */
  getRows(ids: number[]): T[] {
    const rows: T[] = [];
    for (let i = 0; i < ids.length; i++) {
      const row = this.queryForId(ids[i]);
      if (row) {
        rows.push(row as T);
      }
    }
    return rows;
  }
  /**
   * Get count of all rows in this table
   * @return {Number}
   */
  getCount(): number {
    return this.connection.count(this.table_name);
  }

  getTableName(): string {
    return this.table_name;
  }

  /**
   * Rename column
   * @param columnName column name
   * @param newColumnName  new column name
   */
  renameColumn(columnName: string, newColumnName: string) {
    AlterTable.renameColumn(this.connection, this.table_name, columnName, newColumnName);
    this._table.renameColumnWithName(columnName, newColumnName);
  }

  /**
   * Add a new column
   * @param column new column
   */
  addColumn(column: UserColumn) {
    AlterTable.addColumn(this.connection, this.table_name, column.getName(), CoreSQLUtils.columnDefinition(column));
    this._table.addColumn(column);
  }

  /**
   * Drop a colum
   * @param index column index
   */
   dropColumnWithIndex(index: number) {
    this.dropColumn(this._table.getColumnNameWithIndex(index));
  }

  /**
   * Drop a column
   * @param columnName column name
   */
   dropColumn(columnName: string) {
    AlterTable.dropColumnForUserTable(this.connection, this.table, columnName);
  }

  /**
   * Drop columns
   * @param columns columns
   */
   dropColumns(columns: UserColumn[]) {
    let columnNames = [];
    columns.forEach(column => {
      columnNames.push(column.getName());
    });
    this.dropColumnNames(columnNames);
  }

  /**
   * Drop columns
   * @param indices column indexes
   */
   dropColumnIndexes(indices: number[]) {
    let columnNames = [];
    indices.forEach(idx => {
      columnNames.push(this._table.getColumnNameWithIndex(idx));
    });
    this.dropColumnNames(columnNames);
  }

  /**
   * Drop columns
   * @param columnNames column names
   */
   dropColumnNames(columnNames: string[]) {
    AlterTable.dropColumnsForUserTable(this.connection, this.table, columnNames);
  }

  /**
   * Alter a column
   * @param column column
   */
   alterColumn(column: UserColumn) {
    AlterTable.alterColumnForTable(this.connection, this.table, column);
  }

  /**
   * Alter columns
   * @param columns columns
   */
   alterColumns(columns: UserColumn[]) {
    AlterTable.alterColumnsForTable(this.connection, this.table, columns);
  }
}

import { Dao } from '../dao/dao';
import { GeoPackage } from '../geoPackage';
import { UserMappingTable } from '../extension/relatedTables/userMappingTable';
import { UserTableReader } from './userTableReader';
import { MediaTable } from '../extension/relatedTables/mediaTable';
import { SimpleAttributesTable } from '../extension/relatedTables/simpleAttributesTable';
import { UserRow } from './userRow';
import { RelationType } from '../extension/relatedTables/relationType';
import { ColumnValues } from '../dao/columnValues';
import { UserTable } from './userTable';
import { DataTypes } from '../..';
import { MediaRow } from '../extension/relatedTables/mediaRow';
import { SimpleAttributesRow } from '../extension/relatedTables/simpleAttributesRow';
import { FeatureRow } from '../features/user/featureRow';
import { ExtendedRelation } from '../extension/relatedTables/extendedRelation';

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
  constructor(geoPackage: GeoPackage, public table: UserTable) {
    super(geoPackage);
    this.table_name = table.table_name;
    this.gpkgTableName = table.table_name;
    if (table.getPkColumn()) {
      this.idColumns = [table.getPkColumn().name];
    } else {
      this.idColumns = [];
    }
    this.columns = table.columnNames;
  }
  /**
   * Creates a UserRow
   * @param  {Object} [results] results to create the row from if not specified, an empty row is created
   * @return {module:user/userRow~UserRow}
   */
  createObject(results: any): UserRow {
    if (results) {
      return this.getRow(results);
    }
    return this.newRow();
  }
  /**
   * Create a new user row
   */
  newRow(): UserRow {
    return new UserRow(this.table);
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
  getRow(results: any): UserRow {
    const row = undefined;
    if (!this.table) return row;
    const columns = this.table.columnCount();
    const columnTypes: { [key: string]: DataTypes } = {};
    for (let i = 0; i < columns; i++) {
      const column = this.table.getColumnWithIndex(i);
      columnTypes[column.name] = column.dataType;
    }
    return this.newRowWithColumnTypes(columnTypes, results);
  }
  /**
   * Get the table for this dao
   * @return {module:user/userTable~UserTable}
   */
  getTable(): UserTable {
    return this.table;
  }
  /**
   * Create a user row
   * @param  {module:db/dataTypes[]} columnTypes  column types
   * @param  {module:dao/columnValues~ColumnValues[]} values      values
   * @return {module:user/userRow~UserRow}             user row
   */
  newRowWithColumnTypes(columnTypes: { [key: string]: DataTypes }, values: ColumnValues[]): UserRow {
    return new UserRow(this.table, columnTypes, values);
  }
  /**
   * Links related rows together
   * @param  {module:user/userRow~UserRow} userRow             user row
   * @param  {module:user/userRow~UserRow} relatedRow          related row
   * @param  {string} relationType        relation type
   * @param  {string|UserMappingTable} [mappingTable]        mapping table
   * @param  {module:dao/columnValues~ColumnValues} [mappingColumnValues] column values
   * @return {Promise}
   */
  async linkRelatedRow(
    userRow: UserRow,
    relatedRow: UserRow,
    relationType: RelationType,
    mappingTable?: string | UserMappingTable,
    mappingColumnValues?: ColumnValues,
  ): Promise<number> {
    const rte = this.geoPackage.getRelatedTablesExtension();
    const baseTableName = userRow.table.table_name;
    const relatedTableName = relatedRow.table.table_name;
    const relationship = rte
      .getRelationshipBuilder()
      .setBaseTableName(baseTableName)
      .setRelatedTableName(relatedTableName)
      .setRelationType(relationType);
    let mappingTableName;
    if (!mappingTable || typeof mappingTable === 'string') {
      mappingTable = mappingTable || baseTableName + '_' + relatedTableName;
      relationship.setMappingTableName(mappingTable);
      mappingTableName = mappingTable;
    } else {
      relationship.setUserMappingTable(mappingTable);
      mappingTableName = mappingTable.table_name;
    }
    await rte.addRelationship(relationship);
    const userMappingDao = rte.getMappingDao(mappingTableName);
    const userMappingRow = userMappingDao.newRow();
    userMappingRow.setBaseId(userRow.getId());
    userMappingRow.setRelatedId(relatedRow.getId());
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
   * @return {Promise}
   */
  async linkFeatureRow(
    userRow: UserRow,
    featureRow: FeatureRow,
    mappingTable?: string | UserMappingTable,
    mappingColumnValues?: ColumnValues,
  ): Promise<number> {
    return this.linkRelatedRow(userRow, featureRow, RelationType.FEATURES, mappingTable, mappingColumnValues);
  }
  /**
   * Links a user row to a media row
   * @param  {module:user/userRow~UserRow} userRow             user row
   * @param  {module:extension/relatedTables~MediaRow} mediaRow          media row
   * @param  {string|UserMappingTable} [mappingTable]        mapping table
   * @param  {module:dao/columnValues~ColumnValues} [mappingColumnValues] column values
   * @return {Promise}
   */
  async linkMediaRow(
    userRow: UserRow,
    mediaRow: MediaRow,
    mappingTable?: string | UserMappingTable,
    mappingColumnValues?: ColumnValues,
  ): Promise<number> {
    return this.linkRelatedRow(userRow, mediaRow, RelationType.MEDIA, mappingTable, mappingColumnValues);
  }
  /**
   * Links a user row to a simpleAttributes row
   * @param  {module:user/userRow~UserRow} userRow             user row
   * @param  {module:extension/relatedTables~SimpleAttributesRow} simpleAttributesRow          simple attributes row
   * @param  {string|UserMappingTable} [mappingTable]        mapping table
   * @param  {module:dao/columnValues~ColumnValues} [mappingColumnValues] column values
   * @return {Promise}
   */
  linkSimpleAttributesRow(
    userRow: UserRow,
    simpleAttributesRow: SimpleAttributesRow,
    mappingTable?: string | UserMappingTable,
    mappingColumnValues?: ColumnValues,
  ): Promise<number> {
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
    const mediaRelations = this.getMediaRelations();
    const rte = this.geoPackage.getRelatedTablesExtension();
    const linkedMedia = [];
    for (let i = 0; i < mediaRelations.length; i++) {
      const mediaRelation = mediaRelations[i];
      const mediaDao = rte.getMediaDao(mediaRelation);
      const userMappingDao = rte.getMappingDao(mediaRelation.mapping_table_name);
      const mappings = userMappingDao.queryByBaseId(userRow.getId());
      for (let m = 0; m < mappings.length; m++) {
        const relatedId = mappings[m].related_id;
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
  getLinkedSimpleAttributes(userRow: UserRow): SimpleAttributesRow[] {
    const simpleRelations = this.getSimpleAttributesRelations();
    const rte = this.geoPackage.getRelatedTablesExtension();
    const linkedSimpleAttributes = [];
    for (let i = 0; i < simpleRelations.length; i++) {
      const simpleRelation = simpleRelations[i];
      const simpleDao = rte.getSimpleAttributesDao(simpleRelation);
      const userMappingDao = rte.getMappingDao(simpleRelation.mapping_table_name);
      const mappings = userMappingDao.queryByBaseId(userRow.getId());
      for (let m = 0; m < mappings.length; m++) {
        const relatedId = mappings[m].related_id;
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
  getLinkedFeatures(userRow: UserRow): FeatureRow[] {
    const featureRelations = this.getFeatureRelations();
    const rte = this.geoPackage.getRelatedTablesExtension();
    const linkedFeatures = [];
    for (let i = 0; i < featureRelations.length; i++) {
      const featureRelation = featureRelations[i];
      const featureDao = this.geoPackage.getFeatureDao(featureRelation.base_table_name);
      const userMappingDao = rte.getMappingDao(featureRelation.mapping_table_name);
      const mappings = userMappingDao.queryByBaseId(userRow.getId());
      for (let m = 0; m < mappings.length; m++) {
        const relatedId = mappings[m].related_id;
        linkedFeatures.push(featureDao.queryForId(relatedId));
      }
    }
    return linkedFeatures;
  }
  /**
   * Get all simple attribute relations to this table
   * @return {Object[]}
   */
  getSimpleAttributesRelations(): ExtendedRelation[] {
    return this.getRelationsWithName(SimpleAttributesTable.RELATION_TYPE.name);
  }
  /**
   * Get all feature relations to this table
   * @return {Object[]}
   */
  getFeatureRelations(): ExtendedRelation[] {
    return this.getRelationsWithName(RelationType.FEATURES.name);
  }
  /**
   * Get all media relations to this table
   * @return {Object[]}
   */
  getMediaRelations(): ExtendedRelation[] {
    return this.getRelationsWithName(MediaTable.RELATION_TYPE.name);
  }
  /**
   * Get all relations to this table with the specified name
   * @param {string} name
   * @return {Object[]}
   */
  getRelationsWithName(name: string): ExtendedRelation[] {
    return this.geoPackage.getExtendedRelationDao().getBaseTableRelationsWithName(this.table_name, name);
  }
  /**
   * Get all relations to this table
   * @return {Object[]}
   */
  getRelations(): ExtendedRelation[] {
    return this.geoPackage.getExtendedRelationDao().getBaseTableRelations(this.table_name);
  }
  /**
   * Gets the rows in this table by id
   * @param  {Number[]} ids ids to query for
   * @return {Object[]}
   */
  getRows(ids: number[]): T[] {
    const rows = [];
    for (let i = 0; i < ids.length; i++) {
      const row = this.queryForId(ids[i]);
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
  getZoomLevel(): number {
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
  }
  /**
   * Get count of all rows in this table
   * @return {Number}
   */
  getCount(): number {
    return this.connection.count(this.table_name);
  }
  /**
   * Reads the table specified from the geopackage
   * @param  {module:geoPackage~GeoPackage} geoPackage      geopackage object
   * @param  {string} tableName       table name
   * @return {module:user/userDao~UserDao}
   */
  static readTable(geoPackage: GeoPackage, tableName: string): UserDao<UserRow> {
    const reader = new UserTableReader(tableName);
    const userTable = reader.readTable(geoPackage.getDatabase());
    return new UserDao(geoPackage, userTable);
  }
}

import Dao from '../dao/dao';
import GeoPackage from '../geoPackage';
import UserMappingTable from '../extension/relatedTables/userMappingTable'
import UserTableReader from './userTableReader'
import MediaTable from '../extension/relatedTables/mediaTable'
import SimpleAttributesTable from '../extension/relatedTables/simpleAttributesTable'
import UserRow from './userRow'
import RelationType from '../extension/relatedTables/relationType'
import ColumnValues from '../dao/columnValues'

/**
 * Abstract User DAO for reading user tables
 * @class UserDao
 * @extends Dao
 * @param  {module:db/geoPackageConnection~GeoPackageConnection} geoPackage        connection
 * @param  {string} table table name
 */
export default class UserDao<T extends UserRow> extends Dao<T> {
  table: any;
  table_name: any;
  columns: any;
  constructor(geoPackage, table) {
    super(geoPackage);
    this.table = table;
    this.table_name = table.table_name;
    this.gpkgTableName = table.table_name;
    if (table.getPkColumn()) {
      this.idColumns = [table.getPkColumn().name];
    }
    else {
      this.idColumns = [];
    }
    this.columns = table.columnNames;
  }
  /**
   * Creates a UserRow
   * @param  {Object} [results] results to create the row from if not specified, an empty row is created
   * @return {module:user/userRow~UserRow}
   */
  createObject(results): any {
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
  setValueInObject(object, columnIndex, value) {
    object.setValueNoValidationWithIndex(columnIndex, value);
  }
  /**
   * Get a user row from the current results
   * @param  {Object} results result to create the row from
   * @return {module:user/userRow~UserRow}         the user row
   */
  getRow(results) {
    var row = undefined;
    if (!this.table)
      return row;
    var columns = this.table.columnCount();
    var columnTypes = {};
    for (var i = 0; i < columns; i++) {
      var column = this.table.getColumnWithIndex(i);
      columnTypes[column.name] = column.dataType;
    }
    return this.newRowWithColumnTypes(columnTypes, results);
  }
  /**
   * Get the table for this dao
   * @return {module:user/userTable~UserTable}
   */
  getTable() {
    return this.table;
  }
  /**
   * Create a user row
   * @param  {module:db/dataTypes[]} columnTypes  column types
   * @param  {module:dao/columnValues~ColumnValues[]} values      values
   * @return {module:user/userRow~UserRow}             user row
   */
  newRowWithColumnTypes(columnTypes, values) {
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
  linkRelatedRow(userRow, relatedRow, relationType, mappingTable?: string | UserMappingTable, mappingColumnValues?: typeof ColumnValues) {
    var rte = this.geoPackage.getRelatedTablesExtension();
    var baseTableName = userRow.table.table_name;
    var relatedTableName = relatedRow.table.table_name;
    var relationship = rte.getRelationshipBuilder()
      .setBaseTableName(baseTableName)
      .setRelatedTableName(relatedTableName)
      .setRelationType(relationType);
    var mappingTableName;
    if (!mappingTable || typeof mappingTable === 'string') {
      mappingTable = mappingTable || baseTableName + '_' + relatedTableName;
      relationship.setMappingTableName(mappingTable);
      mappingTableName = mappingTable;
    }
    else {
      relationship.setUserMappingTable(mappingTable);
      mappingTableName = mappingTable.table_name;
    }
    return rte.addRelationship(relationship)
      .then(function () {
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
   * @param  {string|UserMappingTable} [mappingTable]        mapping table
   * @param  {module:dao/columnValues~ColumnValues} [mappingColumnValues] column values
   * @return {Promise}
   */
  linkFeatureRow(userRow, featureRow, mappingTable, mappingColumnValues) {
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
  linkMediaRow(userRow, mediaRow, mappingTable, mappingColumnValues) {
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
  linkSimpleAttributesRow(userRow, simpleAttributesRow, mappingTable, mappingColumnValues) {
    return this.linkRelatedRow(userRow, simpleAttributesRow, RelationType.SIMPLE_ATTRIBUTES, mappingTable, mappingColumnValues);
  }
  /**
   * Get all media rows that are linked to this user row
   * @param  {module:user/userRow~UserRow} userRow user row
   * @return {module:extension/relatedTables~MediaRow[]}
   */
  getLinkedMedia(userRow) {
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
  getLinkedSimpleAttributes(userRow) {
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
  getLinkedFeatures(userRow) {
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
  getSimpleAttributesRelations() {
    return this.getRelationsWithName(SimpleAttributesTable.RELATION_TYPE.name);
  }
  /**
   * Get all feature relations to this table
   * @return {Object[]}
   */
  getFeatureRelations() {
    return this.getRelationsWithName(RelationType.FEATURES.name);
  }
  /**
   * Get all media relations to this table
   * @return {Object[]}
   */
  getMediaRelations() {
    return this.getRelationsWithName(MediaTable.RELATION_TYPE.name);
  }
  /**
   * Get all relations to this table with the specified name
   * @param {string} name
   * @return {Object[]}
   */
  getRelationsWithName(name) {
    return this.geoPackage.getExtendedRelationDao().getBaseTableRelationsWithName(this.table_name, name);
  }
  /**
   * Get all relations to this table
   * @return {Object[]}
   */
  getRelations() {
    return this.geoPackage.getExtendedRelationDao().getBaseTableRelations(this.table_name);
  }
  /**
   * Gets the rows in this table by id
   * @param  {Number[]} ids ids to query for
   * @return {Object[]}
   */
  getRows(ids) {
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
  getZoomLevel() {
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
  getCount() {
    return this.connection.count(this.table_name);
  }
  /**
   * Reads the table specified from the geopackage
   * @param  {module:geoPackage~GeoPackage} geoPackage      geopackage object
   * @param  {string} tableName       table name
   * @return {module:user/userDao~UserDao}
   */
  static readTable(geoPackage: GeoPackage, tableName: string): UserDao<UserRow> {
    var reader = new UserTableReader(tableName);
    var userTable = reader.readTable(geoPackage.getDatabase());
    return new UserDao(geoPackage, userTable);
  }
}

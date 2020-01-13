/**
 * RelatedTablesExtension module.
 * @module extension/relatedTables
 * @see module:extension/BaseExtension
 */

import {BaseExtension} from '../baseExtension';
import {Extension} from '../extension';
import {MediaDao} from './mediaDao'
import {MediaTable} from './mediaTable'
import {SimpleAttributesDao} from './simpleAttributesDao'
import {SimpleAttributesTable} from './simpleAttributesTable'
import {UserMappingTable} from './userMappingTable'
import {UserMappingDao} from './userMappingDao'
import {UserCustomDao} from '../../user/custom/userCustomDao'
import {UserDao} from '../../user/userDao'
import {UserTableReader} from '../../user/userTableReader'
import {ExtendedRelationDao} from './extendedRelationDao'
import {RelationType} from './relationType'
import {Contents} from '../../core/contents/contents'
import {ColumnValues} from '../../dao/columnValues';
import {ExtendedRelation} from './extendedRelation';
import { OptionBuilder } from '../../optionBuilder';
import {GeoPackage} from '../../geoPackage';
import {UserRelatedTable} from './userRelatedTable';
import {UserRow} from '../../user/userRow';
import {UserMappingRow} from './userMappingRow';
import {MediaRow} from './mediaRow';
import {SimpleAttributesRow} from './simpleAttributesRow';
/**
 * Related Tables Extension
 * @param  {module:geoPackage~GeoPackage} geoPackage the GeoPackage object
 * @class
 * @extends BaseExtension
 */
export class RelatedTablesExtension extends BaseExtension {
  extendedRelationDao: ExtendedRelationDao;

  public static readonly EXTENSION_NAME: string = 'related_tables';
  public static readonly EXTENSION_RELATED_TABLES_AUTHOR: string = 'gpkg';
  public static readonly EXTENSION_RELATED_TABLES_NAME_NO_AUTHOR: string = 'related_tables';
  public static readonly EXTENSION_RELATED_TABLES_DEFINITION: string = 'TBD';

  constructor(geoPackage: GeoPackage) {
    super(geoPackage);
    this.extendedRelationDao = geoPackage.getExtendedRelationDao();
  }
  /**
   * Get or create the extension
   * @return {Promise}
   */
  async getOrCreateExtension(): Promise<Extension> {
    let extension = await this.getOrCreate(RelatedTablesExtension.EXTENSION_NAME, 'gpkgext_relations', undefined, RelatedTablesExtension.EXTENSION_RELATED_TABLES_DEFINITION, Extension.READ_WRITE)
    await this.extendedRelationDao.createTable();
    return extension;
  }
  /**
   * Get or create the extension for the mapping table
   * @param  {string} mappingTableName user mapping table
   * @return {Promise}
   */
  async getOrCreateMappingTable(mappingTableName: string): Promise<Extension> {
    await this.getOrCreateExtension()
    return this.getOrCreate(RelatedTablesExtension.EXTENSION_NAME, mappingTableName, undefined, RelatedTablesExtension.EXTENSION_RELATED_TABLES_DEFINITION, Extension.READ_WRITE);
  }
  /**
   * Set the contents in the UserRelatedTable
   * @param  {module:extension/relatedTables~UserRelatedTable} userRelatedTable user related table
   */
  setContents(userRelatedTable: UserRelatedTable) {
    var contents = this.geoPackage.getContentsDao().queryForId(userRelatedTable.table_name);
    userRelatedTable.setContents(contents);
  }
  /**
   * Reads the user table and creates a UserCustomDao
   * @param  {string} tableName       table name to reader
   * @param  {string[]} requiredColumns required columns
   * @return {module:user/custom~UserCustomDao}
   */
  getUserDao(tableName: string, requiredColumns?: string[]): UserCustomDao<UserRow> {
    return UserCustomDao.readTable(this.geoPackage, tableName, requiredColumns);
  }
  /**
   * Gets the UserMappingDao from the mapping table name
   * @param  {string | ExtendedRelation} tableName user mapping table name or ExtendedRelation object
   * @return {module:extension/relatedTables~UserMappingDao}
   */
  getMappingDao(tableName: string | ExtendedRelation): UserMappingDao<UserMappingRow> {
    let mappingTableName;
    if (tableName instanceof ExtendedRelation) {
      mappingTableName = tableName.mapping_table_name;
    } else {
      mappingTableName = tableName;
    }
    return new UserMappingDao(this.getUserDao(mappingTableName, UserMappingTable.requiredColumns()), this.geoPackage);
  }
  /**
   * Gets all relationships in the GeoPackage with an optional base table name and an optional base id
   * @param {String} [baseTableName] base table name
   * @return {module:extension/relatedTables~ExtendedRelation[]}
   */
  getRelationships(baseTableName?: string): ExtendedRelation[] {
    if (this.extendedRelationDao.isTableExists()) {
      if (baseTableName) {
        return this.geoPackage.getExtendedRelationDao().getBaseTableRelations(baseTableName);
      }
      return this.extendedRelationDao.queryForAll();
    }
    return [];
  }
  /**
   * Gets all relationships in the GeoPackage with an optional base table name and an optional base id
   * @param {String} [baseTableName] base table name
   * @param {String} [relatedTableName] related table name
   * @param {String} [mappingTableName] mapping table name
   * @return {Boolean}
   */
  hasRelations(baseTableName?: string, relatedTableName?: string, mappingTableName?: string): boolean {
    var relations = [];
    if (this.extendedRelationDao.isTableExists()) {
      relations = this.extendedRelationDao.getRelations(baseTableName, relatedTableName, mappingTableName);
    }
    return !!relations.length;
  }
  getRelatedRows(baseTableName: string, baseId: number): ExtendedRelation[] {
    var relationships = this.getRelationships(baseTableName);
    for (var i = 0; i < relationships.length; i++) {
      var relation = relationships[i];
      var mappingRows = this.getMappingRowsForBase(relation.mapping_table_name, baseId);
      relation.mappingRows = mappingRows;
      var userDao;
      // TODO do this for all known types
      if (relation.relation_name === 'media') {
        userDao = MediaDao.readTable(this.geoPackage, relation.related_table_name);
      }
      else {
        userDao = UserDao.readTable(this.geoPackage, relation.related_table_name);
      }
      for (var m = 0; m < mappingRows.length; m++) {
        var mappingRow = mappingRows[m];
        mappingRow.row = userDao.queryForId(mappingRow.related_id);
      }
    }
    return relationships;
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
  getRelationshipBuilder(): any {
    return RelatedTablesExtension.RelationshipBuilder();
  }
  /**
   * Adds a relationship to the GeoPackage
   * @param  {module:extension/relatedTables~Relationship|module:extension/relatedTables~ExtendedRelation} relationship relationship to add
   * @return {Promise<ExtendedRelation | undefined>}
   */
  async addRelationship(relationship: ExtendedRelation | {relationType?: RelationType, relationName?: string, baseTableName?: string, relatedTableName?: string, relationAuthor?: string, mappingTableName?: string, userMappingTable?: UserMappingTable, relatedTable?: UserRelatedTable}): Promise<ExtendedRelation> {
    var extendedRelation = this.extendedRelationDao.createObject();
    var userMappingTable: UserMappingTable;
    if (relationship instanceof ExtendedRelation) {
      extendedRelation = relationship;
      userMappingTable = UserMappingTable.create(extendedRelation.mapping_table_name);
    }
    else {
      userMappingTable = relationship.userMappingTable;

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
      return;
    }
    await this.createUserMappingTable(userMappingTable);
    var mappingTableRelations = this.extendedRelationDao.queryByMappingTableName(extendedRelation.mapping_table_name);
    if (mappingTableRelations.length) {
      return mappingTableRelations[0];
    }
    this.extendedRelationDao.create(extendedRelation);
    return extendedRelation;
  }
  /**
   * Get the primary key column name from the specified table
   * @param  {string} tableName table name
   * @return {string}
   */
  getPrimaryKeyColumnName(tableName: string): string {
    var reader = new UserTableReader(tableName);
    var table = reader.readTable(this.geoPackage.getDatabase());
    return table.getPkColumn().name;
  }
  /**
   * Adds a features relationship between the base feature and related feature
   * table. Creates a default user mapping table if needed.
   * @param  {module:extension/relatedTables~Relationship|module:extension/relatedTables~ExtendedRelation} relationship relationship to add
   * @return {Promise<ExtendedRelation>}
   */
  async addFeaturesRelationship(relationship: ExtendedRelation | {relationType?: RelationType, relationName?: string, baseTableName?: string, relatedTableName?: string, relationAuthor?: string, mappingTableName?: string, userMappingTable?: UserMappingTable, relatedTable?: UserRelatedTable}): Promise<ExtendedRelation> {
    if (relationship instanceof ExtendedRelation) {
      relationship.relation_name = relationship.relation_name || RelationType.FEATURES.name;
    }
    else {
      relationship.relationType = RelationType.FEATURES;
    }
    return this.addRelationship(relationship);
  }
  /**
   * Adds a tiles relationship between the base table and related tile
   * table. Creates a default user mapping table if needed.
   * @param  {module:extension/relatedTables~Relationship|module:extension/relatedTables~ExtendedRelation} relationship relationship to add
   * @return {Promise<ExtendedRelation>}
   */
  async addTilesRelationship(relationship: ExtendedRelation | {relationType?: RelationType, relationName?: string, baseTableName?: string, relatedTableName?: string, relationAuthor?: string, mappingTableName?: string, userMappingTable?: UserMappingTable, relatedTable?: UserRelatedTable}): Promise<ExtendedRelation> {
    if (relationship instanceof ExtendedRelation) {
      relationship.relation_name = relationship.relation_name || RelationType.TILES.name;
    }
    else {
      relationship.relationType = RelationType.TILES;
    }
    return this.addRelationship(relationship);
  }
  /**
   * Adds an attributes relationship between the base table and related attribute
   * table. Creates a default user mapping table if needed.
   * @param  {module:extension/relatedTables~Relationship|module:extension/relatedTables~ExtendedRelation} relationship relationship to add
   * @return {Promise<ExtendedRelation>}
   */
  async addAttributesRelationship(relationship: ExtendedRelation | {relationType?: RelationType, relationName?: string, baseTableName?: string, relatedTableName?: string, relationAuthor?: string, mappingTableName?: string, userMappingTable?: UserMappingTable, relatedTable?: UserRelatedTable}): Promise<ExtendedRelation> {
    if (relationship instanceof ExtendedRelation) {
      relationship.relation_name = relationship.relation_name || RelationType.ATTRIBUTES.name;
    }
    else {
      relationship.relationType = RelationType.ATTRIBUTES;
    }
    return this.addRelationship(relationship);
  }
  /**
   * Adds a simple attributes relationship between the base table and user
   * simple attributes related table. Creates a default user mapping table and
   * the simple attributes table if needed.
   * @param  {module:extension/relatedTables~Relationship|module:extension/relatedTables~ExtendedRelation} relationship relationship to add
   * @return {Promise<ExtendedRelation>}
   */
  async addSimpleAttributesRelationship(relationship: ExtendedRelation | {relationType?: RelationType, relationName?: string, baseTableName?: string, relatedTableName?: string, relationAuthor?: string, mappingTableName?: string, userMappingTable?: UserMappingTable, relatedTable?: UserRelatedTable}): Promise<ExtendedRelation> {
    if (relationship instanceof ExtendedRelation) {
      relationship.relation_name = relationship.relation_name || RelationType.SIMPLE_ATTRIBUTES.name;
    }
    else {
      relationship.relationType = RelationType.SIMPLE_ATTRIBUTES;
    }
    return this.addRelationship(relationship);
  }
  /**
   * Adds a media relationship between the base table and user media related
   * table. Creates a default user mapping table and the media table if
   * needed.
   * @param  {module:extension/relatedTables~Relationship|module:extension/relatedTables~ExtendedRelation} relationship relationship to add
   * @return {Promise<ExtendedRelation>}
   */
  async addMediaRelationship(relationship: ExtendedRelation | {relationType?: RelationType, relationName?: string, baseTableName?: string, relatedTableName?: string, relationAuthor?: string, mappingTableName?: string, userMappingTable?: UserMappingTable, relatedTable?: UserRelatedTable}): Promise<ExtendedRelation> {
    if (relationship instanceof ExtendedRelation) {
      relationship.relation_name = relationship.relation_name || RelationType.MEDIA.name;
    }
    else {
      relationship.relationType = RelationType.MEDIA;
    }
    return this.addRelationship(relationship);
  }
  /**
   * Remove a specific relationship from the GeoPackage
   * @param  {module:extension/relatedTables~Relationship|module:extension/relatedTables~ExtendedRelation} relationship relationship to remove
   * @return {Number} number of relationships removed
   */
  removeRelationship(relationship: any | ExtendedRelation | {relationType?: RelationType, relationName?: string, baseTableName?: string, relatedTableName?: string, relationAuthor?: string, mappingTableName?: string, userMappingTable?: UserMappingTable, relatedTable?: UserRelatedTable}): number {
    // this is an ExtendedRelation
    if (Object.prototype.hasOwnProperty.call(relationship, 'base_table_name')) {
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
      tablesToDelete.forEach(table => {
        this.geoPackage.deleteTable(table);
      });
      this.extensionsDao.deleteByExtensionAndTableName(RelatedTablesExtension.EXTENSION_NAME, relationship.userMappingTable);
      return this.extendedRelationDao.delete(extendedRelation);
    }
    return 0;
  }
  /**
   * Create a default user mapping table and extension row if either does not
   * exist. When not created, there is no guarantee that an existing table has
   * the same schema as the provided tabled.
   * @param  {string | UserMappingTable} userMappingTableOrName user mapping table or name
   * @return {Promise<Boolean>}
   */
  async createUserMappingTable(userMappingTableOrName: UserMappingTable | string): Promise<boolean> {
    var umt;
    if (userMappingTableOrName instanceof UserMappingTable) {
      umt = userMappingTableOrName;
    } else {
      umt = UserMappingTable.create(userMappingTableOrName);
    }
    await this.getOrCreateMappingTable(umt.table_name);
    if (!this.geoPackage.isTable(umt.table_name)) {
      return !!this.geoPackage.tableCreator.createUserTable(umt);
    }
    return true;
  }
  /**
   * Create a user related table if it does not exist. When not created, there
   * is no guarantee that an existing table has the same schema as the
   * provided tabled.
   * @param  {module:extension/relatedTables~UserRelatedTable} relatedTable user related table
   * @return {Boolean} true if the table now exists
   */
  createRelatedTable(relatedTable: UserRelatedTable): boolean {
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
  validateRelationship(baseTableName: string, relatedTableName: string, relationName: string): boolean {
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
    if (relationType) {
      if (!this.geoPackage.isTableType(relationType.dataType, relatedTableName)) {
        console.log('The related table must be a ' + relationType.dataType + ' table.  Related Table: ' + relatedTableName + ', Type: ' + this.geoPackage.getTableType(relatedTableName));
        return false;
      }
      return true;
    }
    return true;
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
  async linkRelatedIds(baseTableName: string, baseId: number, relatedTableName: string, relatedId: number, relationType: RelationType): Promise<number> {
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
  getMappingsForBase(mappingTableName: string | ExtendedRelation, baseId: number): number[] {
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
  getMappingRowsForBase(mappingTableName: string | ExtendedRelation, baseId: number): any[] {
    var mappingDao = this.getMappingDao(mappingTableName);
    return mappingDao.queryByBaseId(baseId);
  }
  /**
   * Get the base id mappings for the base id
   * @param  {string} mappingTableName mapping table name
   * @param  {Number} relatedId           related id
   * @return {Number[]} ids of base items
   */
  getMappingsForRelated(mappingTableName: string | ExtendedRelation, relatedId: number): number[] {
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
   * @param  {string|MediaTable|ExtendedRelation} tableName either a table name or a MediaTable
   * @return {module:extension/relatedTables~MediaDao}
   */
  getMediaDao(tableName: string | MediaTable | ExtendedRelation): MediaDao<MediaRow> {
    var table;
    if (tableName instanceof MediaTable) {
      table = tableName.table_name;
    }
    else if (tableName instanceof ExtendedRelation) {
      table = tableName.related_table_name;
    }
    else if (typeof tableName === 'string') {
      table = tableName;
    }
    var reader = new UserTableReader(table, MediaTable.requiredColumns());
    var userTable = reader.readTable(this.geoPackage.getDatabase());
    table = new MediaTable(userTable.table_name, userTable.columns, MediaTable.requiredColumns());
    table.setContents(this.geoPackage.getContentsDao().queryForId(table.table_name));
    return new MediaDao(this.geoPackage, table);
  }
  /**
   * Returns a {module:extension/relatedTables~SimpleAttributesDao} from the table specified
   * @param  {string|SimpleAttributesTable|ExtendedRelation} tableName either a table name or a SimpleAttributesDao
   * @return {module:extension/relatedTables~SimpleAttributesDao}
   */
  getSimpleAttributesDao(tableName: string | ExtendedRelation | SimpleAttributesTable): SimpleAttributesDao<SimpleAttributesRow> {
    var table;
    if (tableName instanceof SimpleAttributesTable && tableName.TABLE_TYPE === 'simple_attributes') {
      table = tableName;
    }
    else {
      if (tableName instanceof ExtendedRelation) {
        table = tableName.related_table_name;
      }
      var reader = new UserTableReader(table, SimpleAttributesTable.requiredColumns());
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
  buildRelationName(author: string, name: string): string {
    return 'x-' + author + '_' + name;
  }
  /**
   * Remove all traces of the extension
   */
  removeExtension(): void {
    if (this.extendedRelationDao.isTableExists()) {
      var extendedRelations = this.extendedRelationDao.queryForAll();
      extendedRelations.forEach(function (relation) {
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
   * @param  {String} [mappingTableName] mapping table name to check, if not specified, this checks for any mapping table name
   * @return {Boolean}
   */
  has(mappingTableName?: string): boolean {
    if (mappingTableName) {
      return this.hasExtension(RelatedTablesExtension.EXTENSION_NAME, ExtendedRelationDao.TABLE_NAME, null)
        && this.hasExtension(RelatedTablesExtension.EXTENSION_NAME, mappingTableName, null);
    }
    return this.hasExtension(RelatedTablesExtension.EXTENSION_NAME, ExtendedRelationDao.TABLE_NAME, null);
  }
  static RelationshipBuilder(): any {
    return OptionBuilder.build([
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
}
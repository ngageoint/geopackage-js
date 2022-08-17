/**
 * RelatedTablesExtension module.
 * @module extension/relatedTables
 * @see module:extension/BaseExtension
 */

import { BaseExtension } from '../baseExtension';
import { Extensions } from '../extensions';
import { MediaTable } from './media/mediaTable';
import { SimpleAttributesTable } from './simple/simpleAttributesTable';
import { UserMappingTable } from './userMappingTable';
import { ExtendedRelationsDao } from './extendedRelationsDao';
import { RelationType } from './relationType';
import { Contents } from '../../contents/contents';
import { ExtendedRelation } from './extendedRelation';
import { GeoPackage } from '../../geoPackage';
import { UserRelatedTable } from './userRelatedTable';
import { UserCustomTableReader } from '../../user/custom/userCustomTableReader';
import { ExtensionScopeType } from '../extensionScopeType';
import { GeoPackageConstants } from '../../geoPackageConstants';
import { GeoPackageConnection } from '../../db/geoPackageConnection';
import { GeoPackageException } from '../../geoPackageException';
import { UserTable } from '../../user/userTable';
import { UserColumn } from '../../user/userColumn';
import { AttributesTable } from '../../attributes/attributesTable';
import { TileTable } from '../../tiles/user/tileTable';
import { UserCustomDao } from '../../user/custom/userCustomDao';

/**
 * Related Tables Extension
 */
export class RelatedTablesExtension extends BaseExtension {
  /**
   * Extension author
   */
  public static readonly EXTENSION_AUTHOR = GeoPackageConstants.EXTENSION_AUTHOR;

  /**
   * Extension name without the author
   */
  public static readonly EXTENSION_NAME_NO_AUTHOR = 'related_tables';

  /**
   * Extension, with author and name
   */
  public static readonly EXTENSION_NAME = Extensions.buildExtensionName(
    RelatedTablesExtension.EXTENSION_AUTHOR,
    RelatedTablesExtension.EXTENSION_NAME_NO_AUTHOR,
  );

  /**
   * Extension definition URL
   */
  public static readonly EXTENSION_DEFINITION = 'http://www.geopackage.org/18-000.html';

  /**
   * Extended Relations DAO
   */
  private extendedRelationsDao: ExtendedRelationsDao;

  constructor(geoPackage: GeoPackage) {
    super(geoPackage);
    this.extendedRelationsDao = this.getExtendedRelationsDao();
  }

  /**
   * Get a User Custom DAO from a table name
   * @param tableName table name
   * @return user custom dao
   */
  public getUserDao(tableName: string): UserCustomDao {
    return UserCustomDao.readTable(this.geoPackage.getName(), this.connection, tableName);
  }

  /**
   * Get or create the extension
   *
   * @return extension
   */
  public getOrCreate(): Extensions {
    // Create table
    this.createExtendedRelationsTable();
    return super.getOrCreate(
      RelatedTablesExtension.EXTENSION_NAME,
      ExtendedRelation.TABLE_NAME,
      null,
      RelatedTablesExtension.EXTENSION_DEFINITION,
      ExtensionScopeType.READ_WRITE,
    );
  }

  /**
   * Get or create the extension
   *
   * @param mappingTable
   *            mapping table name
   * @return extension
   */
  private getOrCreateWithMappingTable(mappingTable: string): Extensions {
    this.getOrCreate();
    return super.getOrCreate(
      RelatedTablesExtension.EXTENSION_NAME,
      mappingTable,
      null,
      RelatedTablesExtension.EXTENSION_DEFINITION,
      ExtensionScopeType.READ_WRITE,
    );
  }

  /**
   * Determine if the GeoPackage has the extension
   *
   * @return true if has extension
   */
  public has(): boolean {
    return (
      super.hasExtension(RelatedTablesExtension.EXTENSION_NAME, ExtendedRelation.TABLE_NAME, null) &&
      this.geoPackage.isTable(ExtendedRelation.TABLE_NAME)
    );
  }

  /**
   * Determine if the GeoPackage has the extension for the mapping table
   *
   * @param mappingTable mapping table name
   * @return true if has extension
   */
  public hasExtensionForMappingTable(mappingTable: string): boolean {
    return this.has() && super.hasExtension(RelatedTablesExtension.EXTENSION_NAME, mappingTable, null);
  }

  /**
   * Get a Extended Relations DAO
   * @return extended relations dao
   */
  public getExtendedRelationsDao(): ExtendedRelationsDao {
    if (this.extendedRelationsDao == null) {
      this.extendedRelationsDao = RelatedTablesExtension.getExtendedRelationsDaoFromGeoPackage(this.geoPackage);
    }
    return this.extendedRelationsDao;
  }

  /**
   * Get a Extended Relations DAO
   * @param geoPackage GeoPackage
   * @return extended relations dao
   */
  public static getExtendedRelationsDaoFromGeoPackage(geoPackage: GeoPackage): ExtendedRelationsDao {
    return ExtendedRelationsDao.createDao(geoPackage.getConnection());
  }

  /**
   * Get a Extended Relations DAO
   * @param db database connection
   * @return extended relations dao
   */
  public static getExtendedRelationsDaoFromGeoPackageConnection(db: GeoPackageConnection): ExtendedRelationsDao {
    return ExtendedRelationsDao.createDao(db);
  }

  /**
   * Create the Extended Relations Table if it does not exist
   *
   * @return true if created
   */
  public createExtendedRelationsTable(): boolean {
    this.verifyWritable();

    let created = false;

    try {
      if (!this.extendedRelationsDao.isTableExists()) {
        created = this.geoPackage.getTableCreator().createExtendedRelations();
      }
    } catch (e) {
      throw new GeoPackageException('Failed to check if ExtendedRelation table exists and create it');
    }

    return created;
  }

  /**
   * Get the primary key of a table
   *
   * @param tableName table name
   * @return the column name
   */
  public getPrimaryKeyColumnName(tableName: string): string {
    const table = UserCustomTableReader.readUserCustomTable(this.geoPackage.getDatabase(), tableName);
    const pkColumn = table.getPkColumn();
    if (pkColumn == null) {
      throw new GeoPackageException('Found no primary key for table ' + tableName);
    }
    return pkColumn.getName();
  }

  /**
   * Set the contents in the user table
   * @param table user table
   */
  public setContents(table: UserTable<UserColumn>): void {
    const dao = this.geoPackage.getContentsDao();
    let contents = null;
    try {
      contents = dao.queryForId(table.getTableName());
    } catch (e) {
      throw new GeoPackageException('Failed to retrieve Contents for table name: ' + table.getTableName());
    }
    if (contents == null) {
      throw new GeoPackageException('No Contents Table exists for table name: ' + table.getTableName());
    }
    table.setContents(contents);
  }

  /**
   * Returns the relationships defined through this extension
   *
   * @return a Array of ExtendedRelation objects
   */
  public getRelationships(): ExtendedRelation[] {
    let result;
    try {
      if (this.extendedRelationsDao.isTableExists()) {
        result = this.extendedRelationsDao.queryForAll();
      } else {
        result = [];
      }
    } catch (e) {
      throw new GeoPackageException('Failed to query for relationships in ' + RelatedTablesExtension.EXTENSION_NAME);
    }
    return result;
  }

  /**
   * Adds a relationship between the base and related table. Creates a default
   * user mapping table if needed.
   *
   * @param baseTableName base table name
   * @param relatedTableName related table name
   * @param mappingTableName mapping table name
   * @param relationType relation type
   * @return The relationship that was added
   */
  public addRelationshipWithRelationType(
    baseTableName: string,
    relatedTableName: string,
    mappingTableName: string,
    relationType: RelationType,
  ): ExtendedRelation {
    return this.addRelationshipWithRelationName(
      baseTableName,
      relatedTableName,
      mappingTableName,
      relationType.getName(),
    );
  }

  /**
   * Adds a relationship between the base and related table. Creates a default
   * user mapping table if needed.
   *
   * @param baseTableName base table name
   * @param relatedTableName related table name
   * @param mappingTableName mapping table name
   * @param relationAuthor relation author
   * @param relationName relation name
   * @return The relationship that was added
   */
  public addRelationshipWithRelationAuthorAndRelationName(
    baseTableName: string,
    relatedTableName: string,
    mappingTableName: string,
    relationAuthor: string,
    relationName: string,
  ): ExtendedRelation {
    return this.addRelationshipWithRelationName(
      baseTableName,
      relatedTableName,
      mappingTableName,
      this.buildRelationName(relationAuthor, relationName),
    );
  }

  /**
   * Adds a relationship between the base and related table. Creates a default
   * user mapping table if needed.
   *
   * @param baseTableName base table name
   * @param relatedTableName related table name
   * @param mappingTableName mapping table name
   * @param relationName relation name
   * @return The relationship that was added
   */
  public addRelationshipWithRelationName(
    baseTableName: string,
    relatedTableName: string,
    mappingTableName: string,
    relationName: string,
  ): ExtendedRelation {
    return this.addRelationshipWithMappingTableAndRelationName(
      baseTableName,
      relatedTableName,
      UserMappingTable.create(mappingTableName),
      relationName,
    );
  }

  /**
   * Adds a relationship between the base and related table. Creates the user
   * mapping table if needed.
   *
   * @param baseTableName base table name
   * @param relatedTableName related table name
   * @param userMappingTable user mapping table
   * @param relationType relation type
   * @return The relationship that was added
   */
  public addRelationshipWithMappingTableAndRelationType(
    baseTableName: string,
    relatedTableName: string,
    userMappingTable: UserMappingTable,
    relationType: RelationType,
  ): ExtendedRelation {
    return this.addRelationshipWithMappingTableAndRelationName(
      baseTableName,
      relatedTableName,
      userMappingTable,
      relationType.getName(),
    );
  }

  /**
   * Adds a relationship between the base and related table. Creates the user
   * mapping table if needed.
   *
   * @param baseTableName base table name
   * @param relatedTableName related table name
   * @param userMappingTable user mapping table
   * @param relationAuthor relation author
   * @param relationName relation name
   * @return The relationship that was added
   */
  public addRelationshipWithMappingTableAndRelationAuthorAndRelationName(
    baseTableName: string,
    relatedTableName: string,
    userMappingTable: UserMappingTable,
    relationAuthor: string,
    relationName: string,
  ): ExtendedRelation {
    return this.addRelationshipWithMappingTableAndRelationName(
      baseTableName,
      relatedTableName,
      userMappingTable,
      this.buildRelationName(relationAuthor, relationName),
    );
  }

  /**
   * Adds a relationship between the base and related table. Creates the user
   * mapping table if needed.
   *
   * @param baseTableName base table name
   * @param relatedTableName related table name
   * @param userMappingTable user mapping table
   * @param relationName relation name
   * @return The relationship that was added
   */
  public addRelationshipWithMappingTableAndRelationName(
    baseTableName: string,
    relatedTableName: string,
    userMappingTable: UserMappingTable,
    relationName: string,
  ): ExtendedRelation {
    // Validate the relation
    this.validateRelationship(baseTableName, relatedTableName, relationName);

    // Create the user mapping table if needed
    this.createUserMappingTableWithMappingTable(userMappingTable);

    // Add a row to gpkgext_relations
    const extendedRelation = new ExtendedRelation();
    extendedRelation.setBaseTableName(baseTableName);
    extendedRelation.setBasePrimaryColumn(this.getPrimaryKeyColumnName(baseTableName));
    extendedRelation.setRelatedTableName(relatedTableName);
    extendedRelation.setRelatedPrimaryColumn(this.getPrimaryKeyColumnName(relatedTableName));
    extendedRelation.setMappingTableName(userMappingTable.getTableName());
    extendedRelation.setRelationName(relationName);
    try {
      this.extendedRelationsDao.create(extendedRelation);
    } catch (e) {
      throw new GeoPackageException(
        "Failed to add relationship '" + relationName + "' between " + baseTableName + ' and ' + relatedTableName,
      );
    }
    return extendedRelation;
  }

  /**
   * Adds a relationship between the base and user related table. Creates a
   * default user mapping table and the related table if needed.
   *
   * @param baseTableName base table name
   * @param relatedTable user related table
   * @param mappingTableName user mapping table name
   * @return The relationship that was added
   */
  public addRelationshipWithRelatedTable(
    baseTableName: string,
    relatedTable: UserRelatedTable,
    mappingTableName: string,
  ): ExtendedRelation {
    return this.addRelationshipWithUserTable(
      baseTableName,
      relatedTable,
      relatedTable.getRelationName(),
      mappingTableName,
    );
  }

  /**
   * Adds a relationship between the base and user related table. Creates the
   * user mapping table and related table if needed.
   *
   * @param baseTableName base table name
   * @param relatedTable user related table
   * @param userMappingTable user mapping table
   * @return The relationship that was added
   */
  public addRelationshipWithRelatedTableAndMappingTable(
    baseTableName: string,
    relatedTable: UserRelatedTable,
    userMappingTable: UserMappingTable,
  ): ExtendedRelation {
    return this.addRelationshipWithRelatedTableAndRelationNameAndMappingTable(
      baseTableName,
      relatedTable,
      relatedTable.getRelationName(),
      userMappingTable,
    );
  }

  /**
   * Adds a relationship between the base and user related table. Creates a
   * default user mapping table and the related table if needed.
   * @param baseTableName base table name
   * @param relatedTable user related table
   * @param mappingTableName user mapping table name
   * @return The relationship that was added
   */
  public addRelationshipWithUserTableAndMappingName(
    baseTableName: string,
    relatedTable: UserTable<UserColumn>,
    mappingTableName: string,
  ): ExtendedRelation {
    return this.addRelationshipWithUserTable(baseTableName, relatedTable, relatedTable.getDataType(), mappingTableName);
  }

  /**
   * Adds a relationship between the base and user related table. Creates the
   * user mapping table and related table if needed.
   *
   * @param baseTableName base table name
   * @param relatedTable user related table
   * @param userMappingTable user mapping table
   * @return The relationship that was added
   */
  public addRelationshipWithUserTableAndMappingTable(
    baseTableName: string,
    relatedTable: UserTable<UserColumn>,
    userMappingTable: UserMappingTable,
  ): ExtendedRelation {
    return this.addRelationshipWithRelatedTableAndRelationNameAndMappingTable(
      baseTableName,
      relatedTable,
      relatedTable.getDataType(),
      userMappingTable,
    );
  }

  /**
   * Adds a relationship between the base and user related table. Creates a
   * default user mapping table and the related table if needed.
   * @param baseTableName base table name
   * @param relatedTable user related table
   * @param relationName relation name
   * @param mappingTableName user mapping table name
   * @return The relationship that was added
   */
  public addRelationshipWithUserTable(
    baseTableName: string,
    relatedTable: UserTable<UserColumn>,
    relationName: string,
    mappingTableName: string,
  ): ExtendedRelation {
    const userMappingTable: UserMappingTable = UserMappingTable.create(mappingTableName);
    return this.addRelationshipWithRelatedTableAndRelationNameAndMappingTable(
      baseTableName,
      relatedTable,
      relationName,
      userMappingTable,
    );
  }

  /**
   * Adds a relationship between the base and user related table. Creates the
   * user mapping table and related table if needed.
   *
   * @param baseTableName base table name
   * @param relatedTable user related table
   * @param relationName relation name
   * @param userMappingTable  user mapping table
   * @return The relationship that was added
   */
  public addRelationshipWithRelatedTableAndRelationNameAndMappingTable(
    baseTableName: string,
    relatedTable: UserTable<UserColumn>,
    relationName: string,
    userMappingTable: UserMappingTable,
  ): ExtendedRelation {
    // Create the related table if needed
    this.createRelatedTable(relatedTable);

    return this.addRelationshipWithMappingTableAndRelationName(
      baseTableName,
      relatedTable.getTableName(),
      userMappingTable,
      relationName,
    );
  }

  /**
   * Adds a features relationship between the base feature and related feature
   * table. Creates a default user mapping table if needed.
   *
   * @param baseFeaturesTableName
   *            base features table name
   * @param relatedFeaturesTableName
   *            related features table name
   * @param mappingTableName
   *            mapping table name
   * @return The relationship that was added
   */
  public addFeaturesRelationship(
    baseFeaturesTableName: string,
    relatedFeaturesTableName: string,
    mappingTableName: string,
  ): ExtendedRelation {
    return this.addRelationshipWithRelationType(
      baseFeaturesTableName,
      relatedFeaturesTableName,
      mappingTableName,
      RelationType.FEATURES,
    );
  }

  /**
   * Adds a features relationship between the base feature and related feature
   * table. Creates the user mapping table if needed.
   *
   * @param baseFeaturesTableName
   *            base features table name
   * @param relatedFeaturesTableName
   *            related features table name
   * @param userMappingTable
   *            user mapping table
   * @return The relationship that was added
   */
  public addFeaturesRelationshipWithMappingTable(
    baseFeaturesTableName: string,
    relatedFeaturesTableName: string,
    userMappingTable: UserMappingTable,
  ): ExtendedRelation {
    return this.addRelationshipWithMappingTableAndRelationType(
      baseFeaturesTableName,
      relatedFeaturesTableName,
      userMappingTable,
      RelationType.FEATURES,
    );
  }

  /**
   * Adds a media relationship between the base table and user media related
   * table. Creates a default user mapping table and the media table if
   * needed.
   *
   * @param baseTableName
   *            base table name
   * @param mediaTable
   *            user media table
   * @param mappingTableName
   *            user mapping table name
   * @return The relationship that was added
   */
  public addMediaRelationship(
    baseTableName: string,
    mediaTable: MediaTable,
    mappingTableName: string,
  ): ExtendedRelation {
    return this.addRelationshipWithRelatedTable(baseTableName, mediaTable, mappingTableName);
  }

  /**
   * Adds a media relationship between the base table and user media related
   * table. Creates the user mapping table and media table if needed.
   *
   * @param baseTableName base table name
   * @param mediaTable user media table
   * @param userMappingTable user mapping table
   * @return The relationship that was added
   */
  public addMediaRelationshipWithMappingTable(
    baseTableName: string,
    mediaTable: MediaTable,
    userMappingTable: UserMappingTable,
  ): ExtendedRelation {
    return this.addRelationshipWithRelatedTableAndMappingTable(baseTableName, mediaTable, userMappingTable);
  }

  /**
   * Adds a simple attributes relationship between the base table and user
   * simple attributes related table. Creates a default user mapping table and
   * the simple attributes table if needed.
   *
   * @param baseTableName base table name
   * @param simpleAttributesTable user simple attributes table
   * @param mappingTableName user mapping table name
   * @return The relationship that was added
   */
  public addSimpleAttributesRelationship(
    baseTableName: string,
    simpleAttributesTable: SimpleAttributesTable,
    mappingTableName: string,
  ): ExtendedRelation {
    return this.addRelationshipWithRelatedTable(baseTableName, simpleAttributesTable, mappingTableName);
  }

  /**
   * Adds a simple attributes relationship between the base table and user
   * simple attributes related table. Creates the user mapping table and
   * simple attributes table if needed.
   *
   * @param baseTableName base table name
   * @param simpleAttributesTable user simple attributes table
   * @param userMappingTable user mapping table
   * @return The relationship that was added
   */
  public addSimpleAttributesRelationshipWithMappingTable(
    baseTableName: string,
    simpleAttributesTable: SimpleAttributesTable,
    userMappingTable: UserMappingTable,
  ): ExtendedRelation {
    return this.addRelationshipWithRelatedTableAndMappingTable(baseTableName, simpleAttributesTable, userMappingTable);
  }

  /**
   * Adds an attributes relationship between the base table and related
   * attributes table. Creates a default user mapping table if needed.
   *
   * @param baseTableName base table name
   * @param relatedAttributesTableName related attributes table name
   * @param mappingTableName mapping table name
   * @return The relationship that was added
   */
  public addAttributesRelationship(
    baseTableName: string,
    relatedAttributesTableName: string,
    mappingTableName: string,
  ): ExtendedRelation {
    return this.addRelationshipWithRelationType(
      baseTableName,
      relatedAttributesTableName,
      mappingTableName,
      RelationType.ATTRIBUTES,
    );
  }

  /**
   * Adds an attributes relationship between the base table and related
   * attributes table. Creates the user mapping table if needed.
   * @param baseTableName base table name
   * @param relatedAttributesTableName related attributes table name
   * @param userMappingTable user mapping table
   * @return The relationship that was added
   */
  public addAttributesRelationshipWithMappingTable(
    baseTableName: string,
    relatedAttributesTableName: string,
    userMappingTable: UserMappingTable,
  ): ExtendedRelation {
    return this.addRelationshipWithMappingTableAndRelationType(
      baseTableName,
      relatedAttributesTableName,
      userMappingTable,
      RelationType.ATTRIBUTES,
    );
  }

  /**
   * Adds an attributes relationship between the base table and user
   * attributes related table. Creates a default user mapping table and the
   * attributes table if needed.
   *
   * @param baseTableName base table name
   * @param attributesTable user attributes table
   * @param mappingTableName user mapping table name
   * @return The relationship that was added
   */
  public addAttributesRelationshipWithAttributesTable(
    baseTableName: string,
    attributesTable: AttributesTable,
    mappingTableName: string,
  ): ExtendedRelation {
    return this.addRelationshipWithUserTableAndMappingName(baseTableName, attributesTable, mappingTableName);
  }

  /**
   * Adds an attributes relationship between the base table and user
   * attributes related table. Creates the user mapping table and an
   * attributes table if needed.
   *
   * @param baseTableName base table name
   * @param attributesTable user attributes table
   * @param userMappingTable user mapping table
   * @return The relationship that was added
   */
  public addAttributesRelationshipWithAttributesTableAndMappingTable(
    baseTableName: string,
    attributesTable: AttributesTable,
    userMappingTable: UserMappingTable,
  ): ExtendedRelation {
    return this.addRelationshipWithUserTableAndMappingTable(baseTableName, attributesTable, userMappingTable);
  }

  /**
   * Adds a tiles relationship between the base table and related tiles table.
   * Creates a default user mapping table if needed.
   *
   * @param baseTableName base table name
   * @param relatedTilesTableName related tiles table name
   * @param mappingTableName mapping table name
   * @return The relationship that was added
   */
  public addTilesRelationship(
    baseTableName: string,
    relatedTilesTableName: string,
    mappingTableName: string,
  ): ExtendedRelation {
    return this.addRelationshipWithRelationType(
      baseTableName,
      relatedTilesTableName,
      mappingTableName,
      RelationType.TILES,
    );
  }

  /**
   * Adds a tiles relationship between the base table and related tiles table.
   * Creates the user mapping table if needed.
   *
   * @param baseTableName base table name
   * @param relatedTilesTableName related tiles table name
   * @param userMappingTable user mapping table
   * @return The relationship that was added
   */
  public addTilesRelationshipWithMappingTable(
    baseTableName: string,
    relatedTilesTableName: string,
    userMappingTable: UserMappingTable,
  ): ExtendedRelation {
    return this.addRelationshipWithMappingTableAndRelationType(
      baseTableName,
      relatedTilesTableName,
      userMappingTable,
      RelationType.TILES,
    );
  }

  /**
   * Adds a tiles relationship between the base table and user tiles related
   * table. Creates a default user mapping table and the tile table if needed.
   *
   * @param baseTableName base table name
   * @param tileTable user tile table
   * @param mappingTableName user mapping table name
   * @return The relationship that was added
   */
  public addTilesRelationshipWithTileTable(
    baseTableName: string,
    tileTable: TileTable,
    mappingTableName: string,
  ): ExtendedRelation {
    return this.addRelationshipWithUserTableAndMappingName(baseTableName, tileTable, mappingTableName);
  }

  /**
   * Adds a tiles relationship between the base table and user tiles related
   * table. Creates the user mapping table and a tile table if needed.
   *
   * @param baseTableName base table name
   * @param tileTable user tile table
   * @param userMappingTable user mapping table
   * @return The relationship that was added
   */
  public addTilesRelationshipWithTileTableAndMappingTable(
    baseTableName: string,
    tileTable: TileTable,
    userMappingTable: UserMappingTable,
  ): ExtendedRelation {
    return this.addRelationshipWithUserTableAndMappingTable(baseTableName, tileTable, userMappingTable);
  }

  /**
   * Validate that the relation name is valid between the base and related
   * table
   * @param baseTableName base table name
   * @param relatedTableName related table name
   * @param relationName relation name
   */
  private validateRelationship(baseTableName: string, relatedTableName: string, relationName: string): void {
    // Verify the base and related tables exist
    if (!this.geoPackage.isTableOrView(baseTableName)) {
      throw new GeoPackageException(
        'Base Relationship table does not exist: ' + baseTableName + ', Relation: ' + relationName,
      );
    }
    if (!this.geoPackage.isTableOrView(relatedTableName)) {
      throw new GeoPackageException(
        'Related Relationship table does not exist: ' + relatedTableName + ', Relation: ' + relationName,
      );
    }

    // Verify spec defined relation types
    const relationType = RelationType.fromName(relationName);
    if (relationType != null) {
      this.validateRelationshipWithRelationType(baseTableName, relatedTableName, relationType);
    }
  }

  /**
   * Determine if the relation type is valid between the base and related
   * table
   *
   * @param baseTableName base table name
   * @param relatedTableName related table name
   * @param relationType relation type
   */
  private validateRelationshipWithRelationType(
    baseTableName: string,
    relatedTableName: string,
    relationType: RelationType,
  ): void {
    if (relationType != null) {
      if (!this.geoPackage.isTableTypeWithStringType(relatedTableName, relationType.getDataType())) {
        throw new GeoPackageException(
          'The related table must be a ' +
            relationType.getDataType() +
            ' table. Related Table: ' +
            relatedTableName +
            ', Type: ' +
            this.geoPackage.getTableType(relatedTableName),
        );
      }
    }
  }

  /**
   * Create a default user mapping table and extension row if either does not
   * exist. When not created, there is no guarantee that an existing table has
   * the same schema as the provided tabled.
   *
   * @param mappingTableName
   *            user mapping table name
   * @return true if table was created, false if the table already existed
   */
  public createUserMappingTable(mappingTableName: string): boolean {
    const userMappingTable: UserMappingTable = UserMappingTable.create(mappingTableName);
    return this.createUserMappingTableWithMappingTable(userMappingTable);
  }

  /**
   * Create a user mapping table and extension row if either does not exist.
   * When not created, there is no guarantee that an existing table has the
   * same schema as the provided tabled.
   *
   * @param userMappingTable
   *            user mapping table
   * @return true if table was created, false if the table already existed
   */
  public createUserMappingTableWithMappingTable(userMappingTable: UserMappingTable): boolean {
    let created = false;

    const userMappingTableName = userMappingTable.getTableName();
    this.getOrCreateWithMappingTable(userMappingTableName);

    if (!this.geoPackage.isTableOrView(userMappingTableName)) {
      this.geoPackage.createUserTable(userMappingTable);

      created = true;
    }

    return created;
  }

  /**
   * Create a user related table if it does not exist. When not created, there
   * is no guarantee that an existing table has the same schema as the
   * provided tabled.
   *
   * @param relatedTable
   *            user related table
   * @return true if created, false if the table already existed
   */
  public createRelatedTable(relatedTable: UserTable<UserColumn>): boolean {
    let created = false;

    const relatedTableName = relatedTable.getTableName();
    if (!this.geoPackage.isTableOrView(relatedTableName)) {
      this.geoPackage.createUserTable(relatedTable);

      try {
        // Create the contents
        const contents = new Contents();
        contents.setTableName(relatedTableName);
        contents.setDataTypeName(relatedTable.getDataType());
        contents.setIdentifier(relatedTableName);
        const contentsDao = this.geoPackage.getContentsDao();
        contentsDao.create(contents);
        contentsDao.refresh(contents);

        relatedTable.setContents(contents);
      } catch (e) {
        this.geoPackage.deleteTableQuietly(relatedTableName);
        throw new GeoPackageException('Failed to create table and metadata: ' + relatedTableName);
      }

      created = true;
    }

    return created;
  }

  /**
   * Remove a specific relationship from the GeoPackage
   * @param baseTableName base table name
   * @param relatedTableName related table name
   * @param relationType relation type
   */
  public removeRelationshipWithRelationType(
    baseTableName: string,
    relatedTableName: string,
    relationType: RelationType,
  ): void {
    this.removeRelationship(baseTableName, relatedTableName, relationType.getName());
  }

  /**
   * Remove a specific relationship from the GeoPackage
   *
   * @param baseTableName base table name
   * @param relatedTableName related table name
   * @param relationAuthor relation author
   * @param relationName relation name
   */
  public removeRelationshipWithRelationAuthorAndRelationName(
    baseTableName: string,
    relatedTableName: string,
    relationAuthor: string,
    relationName: string,
  ): void {
    this.removeRelationship(baseTableName, relatedTableName, this.buildRelationName(relationAuthor, relationName));
  }

  /**
   * Remove a specific relationship from the GeoPackage
   *
   * @param extendedRelation
   *            extended relation
   */
  public removeRelationshipWithExtendedRelation(extendedRelation: ExtendedRelation): void {
    try {
      if (this.extendedRelationsDao.isTableExists()) {
        this.geoPackage.deleteTable(extendedRelation.getMappingTableName());
        this.extendedRelationsDao.delete(extendedRelation);
      }
    } catch (e) {
      throw new GeoPackageException(
        "Failed to remove relationship '" +
          extendedRelation.getRelationName() +
          "' between " +
          extendedRelation.getBaseTableName() +
          ' and ' +
          extendedRelation.getRelatedTableName() +
          ' with mapping table ' +
          extendedRelation.getMappingTableName(),
      );
    }
  }

  /**
   * Remove a specific relationship from the GeoPackage
   * @param baseTableName base table name
   * @param relatedTableName related table name
   * @param relationName relation name
   */
  public removeRelationship(baseTableName: string, relatedTableName: string, relationName: string): void {
    try {
      if (this.extendedRelationsDao.isTableExists()) {
        const extendedRelations = this.getRelations(baseTableName, null, relatedTableName, null, relationName, null);
        for (const extendedRelation of extendedRelations) {
          this.removeRelationshipWithExtendedRelation(extendedRelation);
        }
      }
    } catch (e) {
      throw new GeoPackageException(
        "Failed to remove relationship '" + relationName + "' between " + baseTableName + ' and ' + relatedTableName,
      );
    }
  }

  /**
   * Remove all relationships that include the table
   * @param table base or related table name
   */
  public removeRelationships(table: string): void {
    try {
      if (this.extendedRelationsDao.isTableExists()) {
        const extendedRelations = this.extendedRelationsDao.getTableRelations(table);
        for (const extendedRelation of extendedRelations) {
          this.removeRelationshipWithExtendedRelation(extendedRelation);
        }
      }
    } catch (e) {
      throw new GeoPackageException('Failed to remove relationships for table: ' + table);
    }
  }

  /**
   * Remove all relationships with the mapping table
   *
   * @param mappingTable
   *            mapping table
   */
  public removeRelationshipsWithMappingTable(mappingTable: string): void {
    try {
      if (this.extendedRelationsDao.isTableExists()) {
        const extendedRelations = this.getRelations(null, null, null, null, null, mappingTable);
        for (const extendedRelation of extendedRelations) {
          this.removeRelationshipWithExtendedRelation(extendedRelation);
        }
      }
    } catch (e) {
      throw new GeoPackageException('Failed to remove relationships for mapping table: ' + mappingTable);
    }
  }

  /**
   * Remove all trace of the extension
   */
  public removeExtension(): void {
    try {
      if (this.extendedRelationsDao.isTableExists()) {
        const extendedRelations = this.extendedRelationsDao.queryForAllAndCreateObjects();
        for (const extendedRelation of extendedRelations) {
          this.geoPackage.deleteTable(extendedRelation.getMappingTableName());
        }
        this.geoPackage.dropTable(this.extendedRelationsDao.getTableName());
      }
      if (this.extensionsDao.isTableExists()) {
        this.extensionsDao.deleteByExtension(RelatedTablesExtension.EXTENSION_NAME);
      }
    } catch (e) {
      throw new GeoPackageException(
        'Failed to delete Related Tables extension and table. GeoPackage: ' + this.geoPackage.getName(),
      );
    }
  }

  /**
   * Determine if has one or more relations matching the base table and
   * related table
   *
   * @param baseTable base table name
   * @param relatedTable related table name
   */
  public hasRelationsWithBaseTableAndRelatedTable(baseTable: string, relatedTable: string): boolean {
    return this.hasRelations(baseTable, null, relatedTable, null, null, null);
  }

  /**
   * Get the relations to the base table and related table
   *
   * @param baseTable base table name
   * @param relatedTable related table name
   * @return extended relations
   */
  public getRelationsWithBaseTableAndRelatedTable(baseTable: string, relatedTable: string): ExtendedRelation[] {
    return this.getRelations(baseTable, null, relatedTable, null, null, null);
  }

  /**
   * Determine if has one or more relations matching the non null provided
   * values
   *
   * @param baseTable
   *            base table name
   * @param relatedTable
   *            related table name
   * @param mappingTable
   *            mapping table name
   * @return true if has relations
   */
  public hasRelationsWithBaseTableAndRelatedTableAndMappingTable(
    baseTable: string,
    relatedTable: string,
    mappingTable: string,
  ): boolean {
    return this.hasRelations(baseTable, null, relatedTable, null, null, mappingTable);
  }

  /**
   * Get the relations matching the non null provided values
   *
   * @param baseTable
   *            base table name
   * @param relatedTable
   *            related table name
   * @param mappingTable
   *            mapping table name
   * @return extended relations
   */
  public getRelationsWithBaseTableAndRelatedTableAndMappingTable(
    baseTable: string,
    relatedTable: string,
    mappingTable: string,
  ): ExtendedRelation[] {
    return this.getRelations(baseTable, null, relatedTable, null, null, mappingTable);
  }

  /**
   * Determine if has one or more relations matching the non null provided
   * values
   *
   * @param baseTable base table name
   * @param relatedTable related table name
   * @param relation relation name
   * @param mappingTable mapping table name
   * @return true if has relations
   */
  public hasRelationsWithBaseTableAndRelatedTableAndRelationAndMappingTable(
    baseTable: string,
    relatedTable: string,
    relation: string,
    mappingTable: string,
  ): boolean {
    return this.hasRelations(baseTable, null, relatedTable, null, relation, mappingTable);
  }

  /**
   * Get the relations matching the non null provided values
   *
   * @param baseTable base table name
   * @param relatedTable related table name
   * @param relation relation name
   * @param mappingTable mapping table name
   * @return extended relations
   */
  public getRelationsWithBaseTableAndRelatedTableAndRelationAndMappingTable(
    baseTable: string,
    relatedTable: string,
    relation: string,
    mappingTable: string,
  ): ExtendedRelation[] {
    return this.getRelations(baseTable, null, relatedTable, null, relation, mappingTable);
  }

  /**
   * Determine if has one or more relations matching the non null provided
   * values
   * @param baseTable  base table name
   * @param baseColumn base primary column name
   * @param relatedTable related table name
   * @param relatedColumn related primary column name
   * @param relation relation name
   * @param mappingTable mapping table name
   * @return true if has relations
   */
  public hasRelations(
    baseTable: string,
    baseColumn: string,
    relatedTable: string,
    relatedColumn: string,
    relation: string,
    mappingTable: string,
  ): boolean {
    return this.getRelations(baseTable, baseColumn, relatedTable, relatedColumn, relation, mappingTable).length !== 0;
  }

  /**
   * Get the relations matching the non null provided values
   *
   * @param baseTable base table name
   * @param baseColumn base primary column name
   * @param relatedTable related table name
   * @param relatedColumn related primary column name
   * @param relation relation name
   * @param mappingTable  mapping table name
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
    let relations = null;

    try {
      if (this.extendedRelationsDao.isTableExists()) {
        relations = this.extendedRelationsDao.getRelations(
          baseTable,
          baseColumn,
          relatedTable,
          relatedColumn,
          relation,
          mappingTable,
        );
      } else {
        relations = [];
      }
    } catch (e) {
      throw new GeoPackageException(
        'Failed to get relationships. Base Table: ' +
          baseTable +
          ', Base Column: ' +
          baseColumn +
          ', Related Table: ' +
          relatedTable +
          ', Related Column: ' +
          relatedColumn +
          ', Relation: ' +
          relation +
          ', Mapping Table: ' +
          mappingTable,
      );
    }

    return relations;
  }

  /**
   * Build the custom relation name with author
   * @param author relation author
   * @param name base relation name
   * @return custom relation name
   */
  public buildRelationName(author: string, name: string): string {
    return 'x-' + author + '_' + name;
  }

  /**
   * Get the relations to the base table
   * @param baseTable base table name
   * @return extended relations
   */
  public getBaseTableRelations(baseTable: string): ExtendedRelation[] {
    let extendedRelations = null;
    const dao = this.getExtendedRelationsDao();
    if (dao.isTableExists()) {
      extendedRelations = this.getExtendedRelationsDao().getBaseTableRelations(baseTable);
    }
    return extendedRelations;
  }

  /**
   * Determine if there are relations to the base table
   * @param baseTable base table name
   * @return true if has extended relations
   */
  public hasBaseTableRelations(baseTable: string): boolean {
    const extendedRelations = this.getBaseTableRelations(baseTable);
    return extendedRelations != null && extendedRelations.length !== 0;
  }

  /**
   * Get the relations to the related table
   * @param relatedTable related table name
   * @return extended relations
   */
  public getRelatedTableRelations(relatedTable: string): ExtendedRelation[] {
    let extendedRelations = null;
    const dao = this.getExtendedRelationsDao();
    if (dao.isTableExists()) {
      extendedRelations = this.getExtendedRelationsDao().getRelatedTableRelations(relatedTable);
    }
    return extendedRelations;
  }

  /**
   * Determine if there are relations to the related table
   * @param relatedTable related table name
   * @return true if has extended relations
   */
  public hasRelatedTableRelations(relatedTable: string): boolean {
    const extendedRelations = this.getRelatedTableRelations(relatedTable);
    return extendedRelations != null && extendedRelations.length !== 0;
  }

  /**
   * Get the relations to the table
   * @param table table name
   * @return extended relations
   */
  public getTableRelations(table: string): ExtendedRelation[] {
    let extendedRelations = null;
    const dao = this.getExtendedRelationsDao();
    if (dao.isTableExists()) {
      extendedRelations = this.getExtendedRelationsDao().getTableRelations(table);
    }
    return extendedRelations;
  }

  /**
   * Determine if there are relations to the table
   * @param table table name
   * @return true if has extended relations
   */
  public hasTableRelations(table: string): boolean {
    const extendedRelations = this.getTableRelations(table);
    return extendedRelations != null && extendedRelations.length !== 0;
  }
}

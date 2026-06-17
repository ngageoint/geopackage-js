import { BaseExtension } from '../../baseExtension';
import { Extensions } from '../../extensions';
import { ContentsIdDao } from './contentsIdDao';
import { Contents } from '../../../contents/contents';
import { ContentsId } from './contentsId';
import { ExtensionScopeType } from '../../extensionScopeType';
import { GeoPackageException } from '../../../geoPackageException';
import { GeoPackageTableCreator } from '../../../db/geoPackageTableCreator';
import { NGAExtensionsConstants } from '../ngaExtensionsConstants';
import type { GeoPackage } from '../../../geoPackage';
import { ContentsDataType } from '../../../contents/contentsDataType';

/**
 * Contents ID extension
 */
export class ContentsIdExtension extends BaseExtension {
  /**
   * Extension author
   */
  public static readonly EXTENSION_AUTHOR = NGAExtensionsConstants.EXTENSION_AUTHOR;

  /**
   * Extension name without the author
   */
  public static readonly EXTENSION_NAME_NO_AUTHOR = 'contents_id';

  /**
   * Extension, with author and name
   */
  public static readonly EXTENSION_NAME = Extensions.buildExtensionName(
    ContentsIdExtension.EXTENSION_AUTHOR,
    ContentsIdExtension.EXTENSION_NAME_NO_AUTHOR,
  );

  /**
   * Extension definition URL
   */
  public static readonly EXTENSION_DEFINITION =
    'http://ngageoint.github.io/GeoPackage/docs/extensions/contents-id.html';

  contentsIdDao: ContentsIdDao;

  /**
   * Constructor
   * @param geoPackage
   */
  constructor(geoPackage: GeoPackage) {
    super(geoPackage);
    this.contentsIdDao = geoPackage.getContentsIdDao();
  }
  /**
   * Get or create the contents id extension
   * @return {Extensions}
   */
  getOrCreateExtension(): Extensions {
    // Create table
    this.createContentsIdTable();

    const extension = this.getOrCreate(
      ContentsIdExtension.EXTENSION_NAME,
      null,
      null,
      ContentsIdExtension.EXTENSION_DEFINITION,
      ExtensionScopeType.READ_WRITE,
    );

    const contentsDao = this.geoPackage.getContentsDao();
    try {
      if (contentsDao.queryForId(ContentsId.TABLE_NAME) == null) {
        const contents = new Contents();
        contents.setTableName(ContentsId.TABLE_NAME);
        contents.setDataTypeName(Extensions.TABLE_NAME);
        contents.setIdentifier(ContentsId.TABLE_NAME);
        contentsDao.create(contents);
      }
    } catch (e) {
      throw new GeoPackageException(
        'Failed to create contents entry for contents id. GeoPackage: ' + this.geoPackage.getName(),
      );
    }

    return extension;
  }
  /**
   * Get the ContentsIdDao
   * @returns {ContentsIdDao}
   */
  getDao(): ContentsIdDao {
    return this.contentsIdDao;
  }
  has(): boolean {
    return this.hasExtension(ContentsIdExtension.EXTENSION_NAME, null, null) && this.contentsIdDao.isTableExists();
  }
  /**
   * Get the ContentsId object
   * @param {Contents} contents
   * @returns {ContentsId}
   */
  getWithContents(contents: Contents): ContentsId {
    let contentsId = null;
    if (contents && contents.getTableName()) {
      contentsId = this.getWithTableName(contents.getTableName());
    }
    return contentsId;
  }
  /**
   * Get the ContentsId object
   * @param tableName
   * @returns {ContentsId}
   */
  getWithTableName(tableName: string): ContentsId {
    let contentsId = null;
    if (this.contentsIdDao.isTableExists()) {
      contentsId = this.contentsIdDao.queryForTableName(tableName);
    }
    return contentsId;
  }
  /**
   * Get the contents id
   * @param {Contents} contents
   * @returns {number} id
   */
  getId(contents: Contents): number {
    let contentsId = null;
    if (contents && contents.getTableName()) {
      contentsId = this.getIdByTableName(contents.getTableName());
    }
    return contentsId;
  }
  /**
   * Get the ContentsId id
   * @param tableName
   * @returns {Number}
   */
  getIdByTableName(tableName: string): number {
    let id = null;
    if (this.contentsIdDao.isTableExists()) {
      const contentsId = this.contentsIdDao.queryForTableName(tableName);
      if (contentsId) {
        id = contentsId.getId();
      }
    }
    return id;
  }
  /**
   * Creates contentsId for contents
   * @param {Contents} contents
   * @returns {ContentsId} contents id
   */
  create(contents: Contents): ContentsId {
    return this.createWithTableName(contents.getTableName());
  }
  /**
   * Creates contentsId for contents
   * @param {string} tableName
   * @returns {ContentsId}
   */
  createWithTableName(tableName: string): ContentsId {
    if (!this.has()) {
      this.getOrCreateExtension();
    }

    const contentsId = new ContentsId();
    // verify the contents exist before setting the table name
    const contents = this.geoPackage.getTableContents(tableName);
    contentsId.setTableName(contents.getTableName());
    try {
      const id = this.contentsIdDao.create(contentsId);
      contentsId.setId(id);
    } catch (e) {
      throw new GeoPackageException(
        'Failed to create contents id for GeoPackage: ' + this.geoPackage.getName() + ', Table Name: ' + tableName,
      );
    }
    return contentsId;
  }

  /**
   * Creates contentsId for contents
   * @param {Contents} contents
   * @returns number
   */
  createId(contents: Contents): number {
    let contentsId = null;
    if (contents != null && contents.getTableName() != null) {
      contentsId = this.createIdWithTableName(contents.getTableName());
    }
    return contentsId;
  }
  /**
   * Creates contentsId for contents
   * @param {string} tableName
   * @returns number
   */
  createIdWithTableName(tableName: string): number {
    return this.createWithTableName(tableName).getId();
  }

  /**
   * Get or create a contents id
   * @param contents contents
   * @return new or existing contents id
   */
  public getOrCreateContentsId(contents: Contents): ContentsId {
    return this.getOrCreateContentsIdWithTableName(contents.getTableName());
  }

  /**
   * Get or create a contents id
   * @param tableName table name
   * @return new or existing contents id
   */
  public getOrCreateContentsIdWithTableName(tableName: string): ContentsId {
    let contentsId = this.getWithTableName(tableName);
    if (contentsId == null) {
      contentsId = this.createWithTableName(tableName);
    }
    return contentsId;
  }

  /**
   * Get or create a contents id
   * @param contents contents
   * @return new or existing contents id
   */
  public getOrCreateId(contents: Contents): number {
    return this.getOrCreateIdWithTableName(contents.getTableName());
  }

  /**
   * Get or create a contents id
   * @param tableName table name
   * @return new or existing contents id
   */
  public getOrCreateIdWithTableName(tableName: string): number {
    const contentsId = this.getOrCreateContentsIdWithTableName(tableName);
    return contentsId.getId();
  }
  /**
   * Deletes contentsId for contents
   * @param {Contents} contents
   */
  deleteId(contents: Contents): number {
    let deleted = 0;
    if (contents != null && contents.getTableName() != null) {
      deleted = this.deleteIdByTableName(contents.getTableName());
    }
    return deleted;
  }
  /**
   * Deletes contentId for table name
   * @param {string} tableName
   */
  deleteIdByTableName(tableName: string): number {
    return this.contentsIdDao.deleteByTableName(tableName);
  }
  /**
   * Number of contentsIds
   * @returns {number}
   */
  count(): number {
    let count = 0;
    if (this.has()) {
      count = this.contentsIdDao.count();
    }
    return count;
  }
  /**
   * Create contentsIds for contents of type passed in
   * @param type defaults to ""
   * @returns {number} the number of contentsIds created
   */
  createIds(type: string | ContentsDataType = ''): number {
    const typeString = typeof type === 'string' ? type : ContentsDataType.nameFromType(type);

    const missing = this.getMissing(typeString);
    for (let i = 0; i < missing.length; i++) {
      this.getOrCreateIdWithTableName(missing[i]);
    }
    return missing.length;
  }
  /**
   * Deletes ids by type
   * @param type
   * @returns {number}
   */
  deleteIds(type: string | ContentsDataType = ''): number {
    const typeString = typeof type === 'string' ? type : ContentsDataType.nameFromType(type);

    let deleted = 0;
    if (this.has()) {
      if (typeString.length === 0) {
        deleted = this.contentsIdDao.deleteAll();
      } else {
        const ids = this.getIds(typeString);
        for (let i = 0; i < ids.length; i++) {
          deleted += this.contentsIdDao.deleteById(ids[i].getId());
        }
      }
    }
    return deleted;
  }
  getIds(type: string | ContentsDataType = ''): ContentsId[] {
    const typeString = typeof type === 'string' ? type : ContentsDataType.nameFromType(type);
    let contentIds = [];
    if (this.has()) {
      let query = 'SELECT ';
      query += ContentsId.COLUMN_ID;
      query += ', ';
      query += ContentsId.COLUMN_TABLE_NAME;
      query += ' FROM ' + ContentsId.TABLE_NAME;
      query += ' WHERE ';
      query += ContentsId.COLUMN_TABLE_NAME;
      query += ' IN (SELECT ';
      query += Contents.COLUMN_TABLE_NAME;
      query += ' FROM ';
      query += Contents.TABLE_NAME;
      let where = '';
      const params = [];
      if (typeString != null && typeString.length > 0) {
        where += Contents.COLUMN_DATA_TYPE;
        where += ' = ?';
        params.push(typeString);
      }
      if (where.length > 0) {
        query += ' WHERE ' + where;
      }
      query += ')';
      contentIds = this.connection.all(query, params).map((result) => this.contentsIdDao.createObject(result));
    }
    return contentIds;
  }

  /**
   * @typedef ContentsTableName
   * @type {Object}
   * @property {string} table_name the table name
   *
   * Get contents without contents ids
   * @param type
   * @returns {string[]} contentsTableNames
   */
  getMissing(type: string | ContentsDataType = ''): string[] {
    const typeString = typeof type === 'string' ? type : ContentsDataType.nameFromType(type);
    let query = 'SELECT ' + Contents.COLUMN_TABLE_NAME + ' FROM ' + Contents.TABLE_NAME;
    let where = '';
    const params = [];
    if (typeString != null && typeString.length > 0) {
      where += Contents.COLUMN_DATA_TYPE;
      where += ' = ?';
      params.push(typeString);
    }
    if (this.contentsIdDao.isTableExists()) {
      if (where.length > 0) {
        where += ' AND ';
      }
      where += Contents.COLUMN_TABLE_NAME;
      where += ' NOT IN (SELECT ';
      where += ContentsId.COLUMN_TABLE_NAME;
      where += ' FROM ';
      where += ContentsId.TABLE_NAME;
      where += ')';
    }
    if (where.length > 0) {
      query += ' WHERE ' + where;
    }

    return this.connection.all(query, params).map((result) => result.table_name);
  }

  /**
   * Remove contents id extension
   */
  removeExtension(): void {
    if (this.contentsIdDao.isTableExists()) {
      this.geoPackage.deleteTable(ContentsId.TABLE_NAME);
    }
    if (this.extensionsDao.isTableExists()) {
      this.extensionsDao.deleteByExtension(ContentsIdExtension.EXTENSION_NAME);
    }
  }

  /**
   * Create the Contents Id Table if it does not exist
   *
   * @return true if created
   */
  public createContentsIdTable(): boolean {
    this.verifyWritable();

    let created = false;

    try {
      if (!this.contentsIdDao.isTableExists()) {
        const tableCreator = new GeoPackageTableCreator(this.geoPackage);
        created = tableCreator.execScript('contents_id');
      }
    } catch (e) {
      throw new GeoPackageException('Failed to check if ContentsId table exists and create it');
    }

    return created;
  }
}

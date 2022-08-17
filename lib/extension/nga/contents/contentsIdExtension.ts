/**
 * @module extension/nga/contents
 */
import { BaseExtension } from '../../baseExtension';
import { GeoPackage } from '../../../geoPackage';
import { Extensions } from '../../extensions';
import { ContentsIdDao } from './contentsIdDao';
import { Contents } from '../../../contents/contents';
import { ContentsId } from './contentsId';
import { ExtensionScopeType } from '../../extensionScopeType';
import { ContentsIdTableCreator } from './contentsIdTableCreator';
import { GeoPackageException } from '../../../geoPackageException';
import { NGAExtensions } from '../ngaExtensions';

/**
 * Contents ID extension
 */
export class ContentsIdExtension extends BaseExtension {
  /**
   * Extension author
   */
  public static readonly EXTENSION_AUTHOR = NGAExtensions.EXTENSION_AUTHOR;

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
    this.contentsIdDao = ContentsIdDao.createDao(geoPackage.getConnection());
  }
  /**
   * Get or create the contents id extension
   * @return {Promise}
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
   * @returns {module:extension/nga/contents.ContentsIdDao}
   */
  get dao(): ContentsIdDao {
    return this.contentsIdDao;
  }
  has(): boolean {
    return this.hasExtension(ContentsIdExtension.EXTENSION_NAME, null, null) && this.contentsIdDao.isTableExists();
  }
  /**
   * Get the ContentsId object
   * @param contents {module:core/contents.Contents}
   * @returns {module:extension/nga/contents.ContentsId}
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
   * @returns {module:extension/nga/contents.ContentsId}
   */
  getWithTableName(tableName: string): ContentsId {
    let contentsId = null;
    if (this.contentsIdDao.isTableExists()) {
      contentsId = this.contentsIdDao.queryForTableName(tableName);
    }
    return contentsId;
  }
  /**
   * Get the ContentsId id
   * @param contents {module:core/contents.Contents}
   * @returns {Number}
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
   * @param contents {module:core/contents.Contents}
   * @returns {module:extension/nga/contents.ContentsId}
   */
  create(contents: Contents): ContentsId {
    return this.createWithTableName(contents.getTableName());
  }
  /**
   * Creates contentsId for contents
   * @param tableName
   * @returns {module:extension/nga/contents.ContentsId}
   */
  createWithTableName(tableName: string): ContentsId {
    if (!this.has()) {
      this.getOrCreateExtension();
    }

    const contentsId = new ContentsId();
    const contents = this.geoPackage.getTableContents(tableName);
    contentsId.setContents(contents);
    try {
      this.contentsIdDao.create(contentsId);
    } catch (e) {
      throw new GeoPackageException(
        'Failed to create contents id for GeoPackage: ' + this.geoPackage.getName() + ', Table Name: ' + tableName,
      );
    }
    return contentsId;
  }

  /**
   * Creates contentsId for contents
   * @param contents {module:core/contents.Contents}
   * @returns {module:extension/nga/contents.ContentsId}
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
   * @param tableName {string}
   * @returns {module:extension/nga/contents.ContentsId}
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
   * @param contents {module:core/contents.Contents}
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
   * @param tableName {string}
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
   * @returns {number}
   */
  createIds(type = ''): number {
    const missing = this.getMissing(type);
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
  deleteIds(type = ''): number {
    let deleted = 0;
    if (this.has()) {
      if (type.length === 0) {
        deleted = this.contentsIdDao.deleteAll();
      } else {
        const ids = this.getIdsByType(type);
        for (let i = 0; i < ids.length; i++) {
          deleted += this.contentsIdDao.deleteById(ids[i].getId());
        }
      }
    }
    return deleted;
  }
  getIdsByType(type = ''): ContentsId[] {
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
      if (type != null && type.length > 0) {
        where += Contents.COLUMN_DATA_TYPE;
        where += ' = ?';
        params.push(type);
      }
      if (where.length > 0) {
        query += ' WHERE ' + where;
      }
      query += ')';
      contentIds = this.connection.all(query, params);
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
  getMissing(type = ''): string[] {
    let query = 'SELECT ' + Contents.COLUMN_TABLE_NAME + ' FROM ' + Contents.TABLE_NAME;
    let where = '';
    const params = [];
    if (type != null && type.length > 0) {
      where += Contents.COLUMN_DATA_TYPE;
      where += ' = ?';
      params.push(type);
    }
    if (this.has()) {
      if (where.length > 0) {
        where += ' AND ';
      }
      where += Contents.COLUMN_TABLE_NAME;
      where += ' NOT IN (SELECT ';
      where += Contents.COLUMN_TABLE_NAME;
      where += ' FROM ';
      where += Contents.TABLE_NAME;
      where += ')';
    }
    if (where.length > 0) {
      query += ' WHERE ' + where;
    }
    return this.connection.all(query, params).map(result => result.table_name);
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
        const tableCreator = new ContentsIdTableCreator(this.geoPackage);
        created = tableCreator.createContentsId();
      }
    } catch (e) {
      throw new GeoPackageException('Failed to check if ContentsId table exists and create it');
    }

    return created;
  }
}

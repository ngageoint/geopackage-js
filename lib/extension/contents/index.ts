/**
 * @module extension/contents
 */

import BaseExtension from '../baseExtension';
import GeoPackage from '../../geoPackage';
import Extension from '../extension';
import ContentsIdDao from './contentsIdDao';
import ContentsDao from '../../core/contents/contentsDao';
import Contents from '../../core/contents/contents';
import ContentsId from './contentsId';

/**
 * Style extension
 */
export default class ContentsIdExtension extends BaseExtension {

  public static readonly EXTENSION_NAME = 'nga_contents_id';
  public static readonly EXTENSION_AUTHOR = 'nga';
  public static readonly EXTENSION_NAME_NO_AUTHOR = 'contents_id';
  public static readonly EXTENSION_DEFINITION = 'http://ngageoint.github.io/GeoPackage/docs/extensions/contents-id.html';

  contentsIdDao: ContentsIdDao;
  constructor(geoPackage: GeoPackage) {
    super(geoPackage);
    this.contentsIdDao = geoPackage.getContentsIdDao();
  }
  /**
	 * Get or create the contents id extension
	 * @return {Promise}
	 */
  getOrCreateExtension(): Promise<Extension> {
    return this.getOrCreate(ContentsIdExtension.EXTENSION_NAME, null, null, ContentsIdExtension.EXTENSION_DEFINITION, Extension.READ_WRITE)
      .then(function () {
        return this.contentsIdDao.createTable();
      }.bind(this));
  }
  /**
	 * Get the ContentsIdDao
	 * @returns {module:extension/contents.ContentsIdDao}
	 */
  getDao(): ContentsIdDao {
    return this.contentsIdDao;
  }
  has(): Boolean {
    return this.hasExtension(ContentsIdExtension.EXTENSION_NAME, null, null) && this.contentsIdDao.isTableExists();
  }
  /**
	 * Get the ContentsId object
	 * @param contents {module:core/contents.Contents}
	 * @returns {module:extension/contents.ContentsId}
	 */
  get(contents: Contents): ContentsId {
    var contentsId = null;
    if (contents && contents.table_name) {
      contentsId = this.getByTableName(contents.table_name);
    }
    return contentsId;
  }
  /**
	 * Get the ContentsId object
	 * @param tableName
	 * @returns {module:extension/contents.ContentsId}
	 */
  getByTableName(tableName: string): ContentsId {
    var contentsId = null;
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
    if (contents && contents.table_name) {
      contentsId = this.getIdByTableName(contents.table_name);
    }
    return contentsId;
  }
  /**
	 * Get the ContentsId id
	 * @param tableName
	 * @returns {Number}
	 */
  getIdByTableName(tableName: string): number {
    var id = null;
    if (this.contentsIdDao.isTableExists()) {
      var contentsId = this.contentsIdDao.queryForTableName(tableName);
      if (contentsId) {
        id = contentsId.id;
      }
    }
    return id;
  }
  /**
	 * Creates contentsId for contents
	 * @param contents {module:core/contents.Contents}
	 * @returns {module:extension/contents.ContentsId}
	 */
  create(contents: Contents): ContentsId {
    var contentsId = null;
    if (contents && contents.table_name) {
      contentsId = this.createWithTableName(contents.table_name);
    }
    return contentsId;
  }
  /**
	 * Creates contentsId for contents
	 * @param tableName
	 * @returns {module:extension/contents.ContentsId}
	 */
  createWithTableName(tableName: string): ContentsId {
    var contentsId = this.contentsIdDao.createObject();
    contentsId.table_name = tableName;
    contentsId.id = this.contentsIdDao.create(contentsId);
    return contentsId;
  }
  /**
	 * Creates contentsId for contents
	 * @param contents {module:core/contents.Contents}
	 * @returns {module:extension/contents.ContentsId}
	 */
  createId(contents: Contents): ContentsId {
    var contentsId = null;
    if (contents && contents.table_name) {
      contentsId = this.createIdWithTableName(contents.table_name);
    }
    return contentsId;
  }
  /**
	 * Creates contentsId for contents
	 * @param tableName {string}
	 * @returns {module:extension/contents.ContentsId}
	 */
  createIdWithTableName(tableName: string): ContentsId {
    return this.createWithTableName(tableName);
  }
  /**
	 * Gets or creates contentsId for contents
	 * @param contents {module:core/contents.Contents}
	 * @returns {module:extension/contents.ContentsId}
	 */
  getOrCreateId(contents: Contents): ContentsId {
    var contentsId = null;
    if (contents && contents.table_name) {
      contentsId = this.getOrCreateIdByTableName(contents.table_name);
    }
    return contentsId;
  }
  /**
	 * Gets or creates contentsId for table name
	 * @param tableName {string}
	 * @returns {module:extension/contents.ContentsId}
	 */
  getOrCreateIdByTableName(tableName: string): ContentsId {
    var contentId = this.getByTableName(tableName);
    if (contentId == null) {
      contentId = this.createWithTableName(tableName);
    }
    return contentId;
  }
  /**
	 * Deletes contentsId for contents
	 * @param contents {module:core/contents.Contents}
	 */
  deleteId(contents: Contents): number {
    var deleted = 0;
    if (contents && contents.table_name) {
      deleted = this.deleteIdByTableName(contents.table_name);
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
    var count = 0;
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
  createIds(type = ""): number {
    var missing = this.getMissing(type);
    for (var i = 0; i < missing.length; i++) {
      this.getOrCreateIdByTableName(missing[i].table_name);
    }
    return missing.length;
  }
  /**
	 * Deletes ids by type
	 * @param type
	 * @returns {number}
	 */
  deleteIds(type = ""): number {
    var deleted = 0;
    if (this.has()) {
      if (type.length === 0) {
        deleted = this.contentsIdDao.deleteAll();
      }
      else {
        var ids = this.getIdsByType(type);
        for (var i = 0; i < ids.length; i++) {
          deleted += this.contentsIdDao.deleteById(ids[i].id);
        }
      }
    }
    return deleted;
  }
  getIdsByType(type = ""): ContentsId[] {
    var contentIds = [];
    if (this.has()) {
      var query = "SELECT ";
      query += ContentsIdDao.COLUMN_ID;
      query += ", ";
      query += ContentsIdDao.COLUMN_TABLE_NAME;
      query += " FROM " + ContentsIdDao.TABLE_NAME;
      query += " WHERE ";
      query += ContentsIdDao.COLUMN_TABLE_NAME;
      query += " IN (SELECT ";
      query += ContentsDao.COLUMN_TABLE_NAME;
      query += " FROM ";
      query += ContentsDao.TABLE_NAME;
      var where = "";
      var params = [];
      if (type != null && type.length > 0) {
        where += ContentsDao.COLUMN_DATA_TYPE;
        where += " = ?";
        params.push(type);
      }
      if (where.length > 0) {
        query += " WHERE " + where;
      }
      query += ")";
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
	 * @returns {ContentsTableName[]} contentsTableNames
	 */
  getMissing(type = ""): { table_name: string }[] {
    var query = "SELECT " + ContentsDao.COLUMN_TABLE_NAME + " FROM " + ContentsDao.TABLE_NAME;
    var where = "";
    var params = [];
    if (type != null && type.length > 0) {
      where += ContentsDao.COLUMN_DATA_TYPE;
      where += " = ?";
      params.push(type);
    }
    if (this.has()) {
      if (where.length > 0) {
        where += " AND ";
      }
      where += ContentsDao.COLUMN_TABLE_NAME;
      where += " NOT IN (SELECT ";
      where += ContentsIdDao.COLUMN_TABLE_NAME;
      where += " FROM ";
      where += ContentsIdDao.TABLE_NAME;
      where += ")";
    }
    if (where.length > 0) {
      query += " WHERE " + where;
    }
    return this.connection.all(query, params);
  }
  /**
	 * Remove contents id extension
	 */
  removeExtension(): void {
    if (this.contentsIdDao.isTableExists()) {
      this.geoPackage.deleteTable(ContentsIdDao.TABLE_NAME);
    }
    if (this.extensionsDao.isTableExists()) {
      this.extensionsDao.deleteByExtension(ContentsIdExtension.EXTENSION_NAME);
    }
  }
}


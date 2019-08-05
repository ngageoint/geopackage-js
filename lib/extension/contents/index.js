/**
 * ContentsIdExtension module.
 * @module extension/style
 */

var BaseExtension = require('../baseExtension')
	, Extension = require('../.').Extension
	, ContentsDao = require('../../core/contents').ContentsDao
	, ContentsIdDao = require('./contentsId').ContentsIdDao;

var util = require('util');

/**
 * Style extension
 * @param  {module:geoPackage~GeoPackage} geoPackage GeoPackage object
 * @class
 * @extends {module:extension/baseExtension~BaseExtension}
 */
var ContentsIdExtension = function(geoPackage) {
	BaseExtension.call(this, geoPackage);
	this.contentsIdDao = geoPackage.getContentsIdDao();
};

util.inherits(ContentsIdExtension, BaseExtension);

/**
 * Get or create the contents id extension
 * @return {Promise}
 */
ContentsIdExtension.prototype.getOrCreateExtension = function() {
	return this.getOrCreate(ContentsIdExtension.EXTENSION_NAME, null, null, ContentsIdExtension.EXTENSION_DEFINITION, Extension.READ_WRITE)
		.then(function() {
			return this.contentsIdDao.createTable();
		}.bind(this));
};

/**
 * Get the ContentsIdDao
 * @returns {*}
 */
ContentsIdExtension.prototype.getDao = function() {
	return this.contentsIdDao;
};

ContentsIdExtension.prototype.has = function () {
	return this.hasExtension(ContentsIdExtension.EXTENSION_NAME, null, null) && this.contentsIdDao.isTableExists();
};

/**
 * Get the ContentsId object
 * @param contents {module:core/contents~Contents}
 * @returns {module:extension/contents~ContentsId}
 */
ContentsIdExtension.prototype.get = function (contents) {
	var contentsId = null;
	if (contents && contents.table_name) {
		contentsId = this.getByTableName(contents.table_name);
	}
	return contentsId;
};

/**
 * Get the ContentsId object
 * @param tableName
 * @returns {module:extension/contents~ContentsId}
 */
ContentsIdExtension.prototype.getByTableName = function (tableName) {
	var contentsId = null;
	if (this.contentsIdDao.isTableExists()) {
		contentsId = this.contentsIdDao.queryForTableName(tableName);
	}
	return contentsId;
};

/**
 * Get the ContentsId id
 * @param contents {module:core/contents~Contents}
 * @returns {Number}
 */
ContentsIdExtension.prototype.getId = function (contents) {
	let contentsId = null;
	if (contents && contents.table_name) {
		contentsId = this.getIdByTableName(contents.table_name);
	}
	return contentsId;
};

/**
 * Get the ContentsId id
 * @param tableName
 * @returns {Number}
 */
ContentsIdExtension.prototype.getIdByTableName = function (tableName) {
	var id = null;
	if (this.contentsIdDao.isTableExists()) {
		var contentsId = this.contentsIdDao.queryForTableName(tableName);
		if (contentsId) {
			id = contentsId.id;
		}
	}
	return id;
};

/**
 * Creates contentsId for contents
 * @param contents {module:core/contents~Contents}
 * @returns {module:extension/contents~ContentsId}
 */
ContentsIdExtension.prototype.create = function (contents) {
	var contentsId = null;
	if (contents && contents.table_name) {
		contentsId = this.createWithTableName(contents.table_name);
	}
	return contentsId;
};

/**
 * Creates contentsId for contents
 * @param tableName
 * @returns {module:extension/contents~ContentsId}
 */
ContentsIdExtension.prototype.createWithTableName = function (tableName) {
	if (!this.has()) {
		this.getOrCreateExtension();
	}
	var contentsId = this.contentsIdDao.createObject();
	contentsId.table_name = tableName;
	this.contentsIdDao.create(contentsId);
	return contentsId;
};

/**
 * Creates contentsId for contents
 * @param contents {module:core/contents~Contents}
 * @returns {module:extension/contents~ContentsId}
 */
ContentsIdExtension.prototype.createId = function (contents) {
	var contentsId = null;
	if (contents && contents.table_name) {
		contentsId = this.createIdWithTableName(contents.table_name);
	}
	return contentsId;
};

/**
 * Creates contentsId for contents
 * @param tableName {string}
 * @returns {module:extension/contents~ContentsId}
 */
ContentsIdExtension.prototype.createIdWithTableName = function (tableName) {
	return this.createWithTableName(tableName);
};

/**
 * Gets or creates contentsId for contents
 * @param contents {module:core/contents~Contents}
 * @returns {module:extension/contents~ContentsId}
 */
ContentsIdExtension.prototype.getOrCreateId = function (contents) {
	var contentsId = null;
	if (contents && contents.table_name) {
		contentsId = this.getOrCreateIdByTableName(contents.table_name);
	}
	return contentsId;
};

/**
 * Gets or creates contentsId for table name
 * @param tableName {string}
 * @returns {module:extension/contents~ContentsId}
 */
ContentsIdExtension.prototype.getOrCreateIdByTableName = function (tableName) {
	var contentId = this.getByTableName(tableName);
	if (contentId == null) {
		contentId = this.createWithTableName(tableName);
	}
	return contentId;
};

/**
 * Deletes contentsId for contents
 * @param contents {module:core/contents~Contents}
 * @returns {number} number of deleted rows
 */
ContentsIdExtension.prototype.deleteId = function (contents) {
	var deleted = false;
	if (contents && contents.table_name) {
		deleted = this.deleteIdByTableName(contents.table_name);
	}
	return deleted;
};

/**
 * Deletes contentId for table name
 * @param tableName {string}
 * @returns {number} number of deleted rows
 */
ContentsIdExtension.prototype.deleteIdByTableName = function (tableName) {
	return this.contentsIdDao.deleteByTableName(tableName);
};

/**
 * Number of contentsIds
 * @returns {number}
 */
ContentsIdExtension.prototype.count = function () {
	var count = 0;
	if (this.has()) {
		count = this.contentsIdDao.count();
	}
	return count;
};

/**
 * Create contentsIds for contents of type passed in
 * @param type {string} defaults to ""
 * @returns {number}
 */
ContentsIdExtension.prototype.createIds = function (type = "") {
	var missing = this.getMissing(type);
	for (var i = 0; i < missing.length; i++) {
		this.getOrCreateIdByTableName(missing[i].table_name);
	}
	return missing.length;
};

/**
 * Deletes ids by type
 * @param type
 * @returns {number}
 */
ContentsIdExtension.prototype.deleteIds = function (type = "") {
	var deleted = 0;
	if (this.has()) {
		if (type.length === 0) {
			deleted = this.contentsIdDao.deleteAll();
		} else {
			var ids = this.getIdsByType(type);
			for (var i = 0; i < ids.length; i++) {
				deleted += this.contentsIdDao.deleteById(ids[i].id);
			}
		}
	}
	return deleted;
};

ContentsIdExtension.prototype.getIdsByType = function (type = "") {
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
};

/**
 * Get contents without contents ids
 * @param type
 * @returns {string[]}
 */
ContentsIdExtension.prototype.getMissing = function (type = "") {
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
};

ContentsIdExtension.EXTENSION_NAME = 'nga_contents_id';
ContentsIdExtension.EXTENSION_AUTHOR = 'nga';
ContentsIdExtension.EXTENSION_NAME_NO_AUTHOR = 'contents_id';
ContentsIdExtension.EXTENSION_DEFINITION = 'http://ngageoint.github.io/GeoPackage/docs/extensions/contents-id.html';

module.exports.ContentsIdExtension = ContentsIdExtension;

/**
 * @module extension/style
 */

var BaseExtension = require('../baseExtension')
	, Extension = require('../.').Extension
	, ContentsIdDao = require('../contents/contentsIdDao')
	, IconTable = require('./iconTable')
	, IconDao = require('./iconDao')
	, StyleTable = require('./styleTable')
	, StyleDao = require('./styleDao')
	, StyleMappingTable = require('./styleMappingTable')
	, StyleMappingDao = require('./styleMappingDao')
	, UserMappingTable = require('../relatedTables/userMappingTable')
	, FeatureStyles = require('./featureStyles')
	, FeatureStyle = require('./featureStyle')
	, Styles = require('./styles')
	, Icons = require('./icons')
	, StyleTableReader = require('./styleTableReader')
	, UserTableReader = require('../../user/userTableReader');

var util = require('util');

/**
 * Style extension
 * @param  {module:geoPackage~GeoPackage} geoPackage GeoPackage object
 * @extends {module:extension/baseExtension~BaseExtension}
 * @constructor
 */
var FeatureStyleExtension = function(geoPackage) {
	BaseExtension.call(this, geoPackage);
	this.relatedTablesExtension = geoPackage.getRelatedTablesExtension();
	this.contentsIdExtension = geoPackage.getContentsIdExtension();
};

util.inherits(FeatureStyleExtension, BaseExtension);

/**
 * Get or create the metadata extension
 *  @param {module:features/user/featureTable|String} featureTable, defaults to null
 * @return {Promise}
 */
FeatureStyleExtension.prototype.getOrCreateExtension = function(featureTable) {
	return this.getOrCreate(FeatureStyleExtension.EXTENSION_NAME, this.getFeatureTableName(featureTable), null, FeatureStyleExtension.EXTENSION_DEFINITION, Extension.READ_WRITE);
};

/**
 * Determine if the GeoPackage has the extension or has the extension for the feature table
 * @param {module:features/user/featureTable|String} featureTable feature table
 * @returns {Boolean}
 */
FeatureStyleExtension.prototype.has = function (featureTable) {
	return this.hasExtension(FeatureStyleExtension.EXTENSION_NAME, this.getFeatureTableName(featureTable), null);
};

/**
 * Gets featureTables
 * @returns {String[]}
 */
FeatureStyleExtension.prototype.getTables = function() {
	var tables = [];
	if (this.extensionsDao.isTableExists()) {
		var extensions = this.extensionsDao.queryAllByExtension(FeatureStyleExtension.EXTENSION_NAME);
		for (var i = 0; i < extensions.length; i++) {
			tables.push(extensions[i].table_name);
		}
	}
	return tables;
};

/**
 * Get the related tables extension
 * @returns {module:extension/relatedTables~RelatedTablesExtension}
 */
FeatureStyleExtension.prototype.getRelatedTables = function () {
	return this.relatedTablesExtension;
};

/**
 * Get the contentsId extension
 * @returns {module:extension/contents~ContentsIdExtension}
 */
FeatureStyleExtension.prototype.getContentsId = function () {
	return this.contentsIdExtension;
};

/**
 * Create style, icon, table style, and table icon relationships for the
 * feature table
 * @param {module:features/user/featureTable|String} featureTable feature table
 * @return {Promise}
 */
FeatureStyleExtension.prototype.createRelationships = function(featureTable) {
	var promises = [];
	promises.push(this.createStyleRelationship(featureTable));
	promises.push(this.createTableStyleRelationship(featureTable));
	promises.push(this.createIconRelationship(featureTable));
	promises.push(this.createTableIconRelationship(featureTable));
	return Promise.all(promises);
};

/**
 * Check if feature table has a style, icon, table style, or table icon
 * relationships
 * @param {module:features/user/featureTable|String} featureTable feature table
 * @returns {boolean}
 */
FeatureStyleExtension.prototype.hasRelationship = function(featureTable) {
	return this.hasStyleRelationship(featureTable)
		|| this.hasTableStyleRelationship(featureTable)
		|| this.hasIconRelationship(featureTable)
		|| this.hasTableIconRelationship(featureTable);
};

/**
 * Create a style relationship for the feature table
 * @param {module:features/user/featureTable|String} featureTable feature table
 * @return {Promise}
 */
FeatureStyleExtension.prototype.createStyleRelationship = function(featureTable) {
	return this._createStyleRelationship(this.getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_STYLE, featureTable), this.getFeatureTableName(featureTable), this.getFeatureTableName(featureTable), StyleTable.TABLE_NAME);
};

/**
 * Determine if a style relationship exists for the feature table
 * @param {module:features/user/featureTable|String} featureTable feature table
 * @returns {boolean}
 */
FeatureStyleExtension.prototype.hasStyleRelationship = function(featureTable) {
	return this._hasStyleRelationship(this.getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_STYLE, featureTable), this.getFeatureTableName(featureTable), StyleTable.TABLE_NAME);
};

/**
 * Create a feature table style relationship
 * @param {module:features/user/featureTable|String} featureTable feature table
 * @return {Promise}
 */
FeatureStyleExtension.prototype.createTableStyleRelationship = function(featureTable) {
	return this._createStyleRelationship(this.getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_TABLE_STYLE, featureTable), this.getFeatureTableName(featureTable), ContentsIdDao.TABLE_NAME, StyleTable.TABLE_NAME);
};

/**
 * Determine if a feature table style relationship exists
 * @param {module:features/user/featureTable|String} featureTable feature table
 * @returns {boolean} true if relationship exists
 */
FeatureStyleExtension.prototype.hasTableStyleRelationship = function(featureTable) {
	return this._hasStyleRelationship(this.getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_TABLE_STYLE, featureTable), ContentsIdDao.TABLE_NAME, StyleTable.TABLE_NAME);
};

/**
 * Create an icon relationship for the feature table
 * @param {module:features/user/featureTable|String} featureTable feature table
 * @return {Promise}
 */
FeatureStyleExtension.prototype.createIconRelationship = function(featureTable) {
	return this._createStyleRelationship(this.getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_ICON, featureTable), this.getFeatureTableName(featureTable), this.getFeatureTableName(featureTable), IconTable.TABLE_NAME);
};

/**
 * Determine if an icon relationship exists for the feature table
 * @param {module:features/user/featureTable|String} featureTable feature table
 * @returns {boolean} true if relationship exists
 */
FeatureStyleExtension.prototype.hasIconRelationship = function(featureTable) {
	return this._hasStyleRelationship(this.getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_ICON, featureTable), this.getFeatureTableName(featureTable), IconTable.TABLE_NAME);
};

/**
 * Create a feature table icon relationship
 * @param {module:features/user/featureTable|String} featureTable feature table
 * @return {Promise}
 */
FeatureStyleExtension.prototype.createTableIconRelationship = function(featureTable) {
	return this._createStyleRelationship(this.getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_TABLE_ICON, featureTable), this.getFeatureTableName(featureTable), ContentsIdDao.TABLE_NAME, IconTable.TABLE_NAME);
};

/**
 * Determine if a feature table icon relationship exists
 * @param {module:features/user/featureTable|String} featureTable feature table
 * @returns {Boolean} true if relationship exists
 */
FeatureStyleExtension.prototype.hasTableIconRelationship = function(featureTable) {
	return this._hasStyleRelationship(this.getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_TABLE_ICON, featureTable), ContentsIdDao.TABLE_NAME, IconTable.TABLE_NAME);
};

/**
 * Get the mapping table name
 * @param tablePrefix table name prefix
 * @param {module:features/user/featureTable|String} featureTable feature table name
 * @returns {String} mapping table name
 */
FeatureStyleExtension.prototype.getMappingTableName = function(tablePrefix, featureTable) {
	return tablePrefix + this.getFeatureTableName(featureTable);
};

/**
 * Check if the style extension relationship between a feature table and
 * style extension table exists
 * @param {String} mappingTableName mapping table name
 * @param {String} baseTable base table name
 * @param {String} relatedTable related table name
 * @returns {boolean} true if relationship exists
 */
FeatureStyleExtension.prototype._hasStyleRelationship = function(mappingTableName, baseTable, relatedTable) {
	return this.relatedTablesExtension.hasRelations(baseTable, relatedTable, mappingTableName).length !== 0;
};

/**
 * Create a style extension relationship between a feature table and style
 * extension table
 * @param {String} mappingTableName mapping table name
 * @param {String} featureTable feature table
 * @param {String} baseTable base table name
 * @param {String} relatedTable related table name
 * @return {Promise}
 * @private
 */
FeatureStyleExtension.prototype._createStyleRelationship = function(mappingTableName, featureTable, baseTable, relatedTable) {
	if (!this._hasStyleRelationship(mappingTableName, baseTable, relatedTable)) {
		// Create the extension
		return this.getOrCreateExtension(featureTable).then(function () {
			if (baseTable === ContentsIdDao.TABLE_NAME && !this.contentsIdExtension.has()) {
				return this.contentsIdExtension.getOrCreateExtension().then(function () {
					return this._handleCreateStyleRelationship(mappingTableName, baseTable, relatedTable);
				}.bind(this));
			} else {
				return this._handleCreateStyleRelationship(mappingTableName, baseTable, relatedTable);
			}
		}.bind(this));
	} else {
		return Promise.resolve();
	}
};

/**
 * Private function to aid in creation of the a style extension relationship between a feature table and style extension table
 * @param {String} mappingTableName
 * @param {String} baseTable
 * @param {String} relatedTable
 * @return {Promise}
 * @private
 */
FeatureStyleExtension.prototype._handleCreateStyleRelationship = function(mappingTableName, baseTable, relatedTable) {
	if (relatedTable === StyleTable.TABLE_NAME) {
		return this.relatedTablesExtension.addAttributesRelationship(this.geoPackage.getRelatedTablesExtension().getRelationshipBuilder()
			.setBaseTableName(baseTable)
			.setUserMappingTable(StyleMappingTable.create(mappingTableName))
			.setRelatedTable(StyleTable.create()));
	} else {
		return this.relatedTablesExtension.addMediaRelationship(this.geoPackage.getRelatedTablesExtension().getRelationshipBuilder()
			.setBaseTableName(baseTable)
			.setUserMappingTable(StyleMappingTable.create(mappingTableName))
			.setRelatedTable(IconTable.create()));
	}
};

/**
 * Delete the style and icon table and row relationships for all feature
 * tables
 */
FeatureStyleExtension.prototype.deleteAllRelationships = function() {
	var tables = this.getTables();
	for (var i = 0; i < tables.length; i++) {
		this.deleteRelationships(tables[i]);
	}
};

/**
 * Delete the style and icon table and row relationships for the feature
 * table
 * @param {module:features/user/featureTable|String} featureTable feature table
 */
FeatureStyleExtension.prototype.deleteRelationships = function(featureTable) {
	this.deleteStyleRelationship(featureTable);
	this.deleteTableStyleRelationship(featureTable);
	this.deleteIconRelationship(featureTable);
	this.deleteTableIconRelationship(featureTable);
};

/**
 * Delete a style relationship for the feature table
 * @param {module:features/user/featureTable|String} featureTable feature table
 */
FeatureStyleExtension.prototype.deleteStyleRelationship = function(featureTable) {
	this._deleteStyleRelationship(this.getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_STYLE, featureTable), featureTable);
};

/**
 * Delete a table style relationship for the feature table
 * @param {module:features/user/featureTable|String} featureTable feature table
 */
FeatureStyleExtension.prototype.deleteTableStyleRelationship = function(featureTable) {
	this._deleteStyleRelationship(this.getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_TABLE_STYLE, featureTable), featureTable);
};

/**
 * Delete a icon relationship for the feature table
 * @param {module:features/user/featureTable|String} featureTable feature table
 */
FeatureStyleExtension.prototype.deleteIconRelationship = function(featureTable) {
	this._deleteStyleRelationship(this.getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_ICON, featureTable), featureTable);
};

/**
 * Delete a table icon relationship for the feature table
 * @param {module:features/user/featureTable|String} featureTable feature table
 */
FeatureStyleExtension.prototype.deleteTableIconRelationship = function(featureTable) {
	this._deleteStyleRelationship(this.getMappingTableName(FeatureStyleExtension.TABLE_MAPPING_TABLE_ICON, featureTable), featureTable);
};

/**
 * Delete a style extension feature table relationship and the mapping table
 * @param {String} mappingTableName
 * @param {module:features/user/featureTable|String} featureTable feature table
 * @private
 */
FeatureStyleExtension.prototype._deleteStyleRelationship = function(mappingTableName, featureTable) {
	var relationships = this.geoPackage.getExtendedRelationDao().queryByMappingTableName(mappingTableName);
	for (var i = 0; i < relationships.length; i++) {
		this.relatedTablesExtension.removeRelationship(relationships[i]);
	}
	if (!this.hasRelationship(featureTable)) {
		if (this.extensionsDao.isTableExists()) {
			this.extensionsDao.deleteByExtension(FeatureStyleExtension.EXTENSION_NAME, this.getFeatureTableName(featureTable));
		}
	}
};

/**
 * Get a Style Mapping DAO
 * @param {module:features/user/featureTable|String} featureTable feature table
 * @return {module:extension/style.StyleMappingDao} style mapping DAO
 */
FeatureStyleExtension.prototype.getStyleMappingDao = function (featureTable) {
	return this._getMappingDao(FeatureStyleExtension.TABLE_MAPPING_STYLE, featureTable);
};

/**
 * Get a Table Style Mapping DAO
 * @param {module:features/user/featureTable|String} featureTable feature table
 * @return {module:extension/style.StyleMappingDao} table style mapping DAO
 */
FeatureStyleExtension.prototype.getTableStyleMappingDao = function (featureTable) {
	return this._getMappingDao(FeatureStyleExtension.TABLE_MAPPING_TABLE_STYLE, featureTable);
};

/**
 * Get a Icon Mapping DAO
 * @param {module:features/user/featureTable|String} featureTable feature table
 * @return {module:extension/style.StyleMappingDao} icon mapping DAO
 */
FeatureStyleExtension.prototype.getIconMappingDao = function (featureTable) {
	return this._getMappingDao(FeatureStyleExtension.TABLE_MAPPING_ICON, featureTable);
};

/**
 * Get a Table Icon Mapping DAO
 * @param {module:features/user/featureTable|String} featureTable feature table
 * @return {module:extension/style.StyleMappingDao} table icon mapping DAO
 */
FeatureStyleExtension.prototype.getTableIconMappingDao = function (featureTable) {
	return this._getMappingDao(FeatureStyleExtension.TABLE_MAPPING_TABLE_ICON, featureTable);
};

/**
 * Get a Style Mapping DAO from a table name
 * @param {String} tablePrefix table name prefix
 * @param {module:features/user/featureTable|String} featureTable feature table
 * @return {module:extension/style.StyleMappingDao} style mapping dao
 * @private
 */
FeatureStyleExtension.prototype._getMappingDao = function (tablePrefix, featureTable) {
	var featureTableName = this.getFeatureTableName(featureTable);
	var tableName = tablePrefix + featureTableName;
	var dao = null;
	if (this.geoPackage.isTable(tableName)) {
		dao = new StyleMappingDao(this.relatedTablesExtension.getUserDao(tableName, UserMappingTable.requiredColumns()), this.geoPackage);
	}
	return dao;
};

/**
 * Get a style DAO
 * @return {module:extension/style.StyleDao} style DAO
 */
FeatureStyleExtension.prototype.getStyleDao = function () {
	var styleDao = null;
	if (this.geoPackage.isTable(StyleTable.TABLE_NAME)) {
		var dao = this.geoPackage.getContentsDao();
		var contents = dao.queryForId(StyleTable.TABLE_NAME);
		if (contents) {
			var reader = new StyleTableReader(contents.table_name);
			var table = reader.readTable(this.geoPackage.connection);
			this.relatedTablesExtension.setContents(table);
			styleDao = new StyleDao(this.geoPackage, table);
		}
	}
	return styleDao;
};

/**
 * Get a icon DAO
 * @return {module:extension/style.IconDao}
 */
FeatureStyleExtension.prototype.getIconDao = function() {
	var iconDao = null;
	if (this.geoPackage.isTable(IconTable.TABLE_NAME)) {
		var reader = new UserTableReader(IconTable.TABLE_NAME, IconTable.requiredColumns());
		var userTable = reader.readTable(this.geoPackage.getDatabase());
		var table = new IconTable(userTable.table_name, userTable.columns, IconTable.requiredColumns());
		table.setContents(this.geoPackage.getContentsDao().queryForId(IconTable.TABLE_NAME));
		iconDao = new IconDao(this.geoPackage, table);
	}
	return iconDao;
};

/**
 * Get the feature table default feature styles
 * @param {module:features/user/featureTable|String} featureTable feature table
 * @return {module:extension/style.FeatureStyles} table feature styles or null
 */
FeatureStyleExtension.prototype.getTableFeatureStyles = function(featureTable) {
	var featureStyles = null;
	var id = this.contentsIdExtension.getIdByTableName(this.getFeatureTableName(featureTable));
	if (id !== null) {
		var styles = this.getTableStyles(featureTable);
		var icons = this.getTableIcons(featureTable);
		if (styles !== null || icons !== null) {
			featureStyles = new FeatureStyles(styles, icons);
		}
	}
	return featureStyles;
};

/**
 * Get the default style of the feature table
 * @param {module:features/user/featureTable|String} featureTable feature table
 * @return {module:extension/style.StyleRow} style row
 */
FeatureStyleExtension.prototype.getTableStyleDefault = function(featureTable) {
	return this.getTableStyle(featureTable, null);
};

/**
 * Get the style of the feature table and geometry type
 * @param {module:features/user/featureTable|String} featureTable feature table
 * @param {String} geometryType geometry type
 * @return {module:extension/style.StyleRow} style row
 */
FeatureStyleExtension.prototype.getTableStyle = function(featureTable, geometryType) {
	var style = null;
	var styles = this.getTableStyles(featureTable);
	if (styles !== null) {
		if (geometryType === null) {
			style = styles.getDefault();
		} else {
			style = styles.getStyle(geometryType);
		}
	}
	return style;
};

/**
 * Get the feature table default styles
 * @param {module:features/user/featureTable|String} featureTable feature table
 * @return {module:extension/style.Styles} table styles or null
 */
FeatureStyleExtension.prototype.getTableStyles = function(featureTable) {
	var styles = null;
	var id = this.contentsIdExtension.getIdByTableName(this.getFeatureTableName(featureTable));
	if (id !== null) {
		styles = this.getStyles(id, this.getTableStyleMappingDao(featureTable));
	}
	return styles;
};

/**
 * Get the default icon of the feature table
 * @param {module:features/user/featureTable|String} featureTable feature table
 * @return {module:extension/style.IconRow} icon row
 */
FeatureStyleExtension.prototype.getTableIconDefault = function(featureTable) {
	return this.getTableIcon(featureTable, null);
};

/**
 * Get the icon of the feature table and geometry type
 * @param {module:features/user/featureTable|String} featureTable feature table
 * @param {String} geometryType geometry type
 * @return {module:extension/style.IconRow} icon row
 */
FeatureStyleExtension.prototype.getTableIcon = function(featureTable, geometryType) {
	var icon = null;
	var icons = this.getTableIcons(featureTable);
	if (icons !== null) {
		if (geometryType === null) {
			icon = icons.getDefault();
		} else {
			icon = icons.getIcon(geometryType);
		}
	}
	return icon;
};

/**
 * Get the feature table default icons
 * @param {module:features/user/featureTable|String} featureTable feature table
 * @return {module:extension/style.Icons} table icons or null
 */
FeatureStyleExtension.prototype.getTableIcons = function(featureTable) {
	var icons = null;
	var id = this.contentsIdExtension.getIdByTableName(this.getFeatureTableName(featureTable));
	if (id !== null) {
		icons = this.getIcons(id, this.getTableIconMappingDao(featureTable));
	}
	return icons;
};

/**
 * Gets Icons for featureId and mappingDao
 * @param {Number} featureId
 * @param mappingDao
 * @returns {module:extension/style.Icons}
 * @private
 */
FeatureStyleExtension.prototype.getIcons = function(featureId, mappingDao) {
	var icons = new Icons();
	if (mappingDao !== null) {
		var iconDao = this.getIconDao();
		var styleMappingRows = mappingDao.queryByBaseId(featureId);
		for (var i = 0; i < styleMappingRows.length; i++) {
			var styleMappingRow = mappingDao.createObject(styleMappingRows[i]);
			var iconRow = iconDao.queryForId(styleMappingRow.getRelatedId());
			if (styleMappingRow.getGeometryTypeName() === null) {
				icons.setDefault(iconRow);
			} else {
				icons.setIcon(iconRow, styleMappingRow.getGeometryTypeName());
			}
		}
	}
	if (icons.isEmpty()) {
		icons = null;
	}
	return icons;
};

/**
 * Gets Styles for featureId and mappingDao
 * @param {Number} featureId
 * @param {module:extension/style.StyleMappingDao} mappingDao
 * @returns {module:extension/style.Styles}
 */
FeatureStyleExtension.prototype.getStyles = function(featureId, mappingDao) {
	var styles = new Styles();
	if (mappingDao !== null) {
		var styleDao = this.getStyleDao();
		var styleMappingRows = mappingDao.queryByBaseId(featureId);
		for (var i = 0; i < styleMappingRows.length; i++) {
			var styleMappingRow = mappingDao.createObject(styleMappingRows[i]);
			var styleRow = styleDao.queryForId(styleMappingRow.getRelatedId());
			if (styleMappingRow.getGeometryTypeName() === null) {
				styles.setDefault(styleRow);
			} else {
				styles.setStyle(styleRow, styleMappingRow.getGeometryTypeName());
			}
		}
	}
	if (styles.isEmpty()) {
		styles = null;
	}
	return styles;
};

/**
 * Get the feature styles for the feature row
 * @param {module:features/user/featureRow} featureRow feature row
 * @return {module:extension/style.FeatureStyles} feature styles or null
 */
FeatureStyleExtension.prototype.getFeatureStylesForFeatureRow = function(featureRow) {
	return this.getFeatureStyles(featureRow.featureTable, featureRow.getId());
};
/**
 * Get the feature styles for the feature row
 * @param {module:features/user/featureTable|String} featureTable feature table
 * @param {Number} featureId feature id
 * @return {module:extension/style.FeatureStyles} feature styles or null
 */
FeatureStyleExtension.prototype.getFeatureStyles = function(featureTable, featureId) {
	var styles = this.getStyles(featureId, this.getStyleMappingDao(featureTable));
	var icons = this.getIcons(featureId, this.getIconMappingDao(featureTable));
	var featureStyles = null;
	if (styles !== null || icons !== null) {
		featureStyles = new FeatureStyles(styles, icons);
	}
	return featureStyles;
};

/**
 * Get the styles for the feature row
 * @param {module:features/user/featureRow} featureRow feature row
 * @return {module:extension/style.Styles} styles or null
 */
FeatureStyleExtension.prototype.getStylesForFeatureRow = function(featureRow) {
	return this.getStyles(featureRow.getId(), this.getStyleMappingDao(featureRow.featureTable.table_name));
};
/**
 * Get the styles for the feature id
 * @param {String} tableName table name
 * @param {Number} featureId feature id
 * @return {module:extension/style.Styles} styles or null
 */
FeatureStyleExtension.prototype.getStylesForFeatureId = function(tableName, featureId) {
	return this.getStyles(featureId, this.getStyleMappingDao(tableName));
};

/**
 * Get the icons for the feature row
 * @param {module:features/user/featureRow} featureRow feature row
 * @return {module:extension/style.Icons} icons or null
 */
FeatureStyleExtension.prototype.getIconsForFeatureRow = function(featureRow) {
	return this.getIcons(featureRow.getId(), this.getIconMappingDao(featureRow.featureTable.table_name));
};

/**
 * Get the icons for the feature id
 * @param {String} tableName table name
 * @param {Number} featureId feature id
 * @return {module:extension/style.Icons} icons or null
 */
FeatureStyleExtension.prototype.getIconsForFeatureId = function(tableName, featureId) {
	return this.getIcons(featureId, this.getIconMappingDao(tableName));
};

/**
 * Get the feature style (style and icon) of the feature row, searching in
 * order: feature geometry type style or icon, feature default style or
 * icon, table geometry type style or icon, table default style or icon
 * @param {module:features/user/featureRow} featureRow feature row
 * @return {module:extension/style.FeatureStyle} feature style
 */
FeatureStyleExtension.prototype.getFeatureStyleForFeatureRow = function(featureRow) {
	return new FeatureStyle(this.getStyle(featureRow.featureTable.table_name, featureRow.getId(), featureRow.getGeometryType(), true), this.getIcon(featureRow.featureTable.table_name, featureRow.getId(), featureRow.getGeometryType(), true));
};

/**
 * Get the feature style (style and icon) of the feature, searching in
 * order: feature geometry type style or icon, feature default style or
 * icon, table geometry type style or icon, table default style or icon
 * @param {module:features/user/featureRow} featureRow feature row
 * @return {module:extension/style.FeatureStyle} feature style
 */
FeatureStyleExtension.prototype.getFeatureStyleDefault = function(featureRow) {
	return new FeatureStyle(this.getStyle(featureRow.featureTable.table_name, featureRow.getId(), null, true), this.getIcon(featureRow.featureTable.table_name, featureRow.getId(), null, true));
};

/**
 * Get the icon of the feature, searching in order: feature geometry type
 * icon, feature default icon, when tableIcon enabled continue searching:
 * table geometry type icon, table default icon
 * @param {module:features/user/featureTable|String} featureTable
 * @param {Number} featureId
 * @param {String} geometryType
 * @param {Boolean} tableIcon
 * @returns {module:extension/style.IconRow}
 * @private
 */
FeatureStyleExtension.prototype.getIcon = function(featureTable, featureId, geometryType, tableIcon) {
	var iconRow = null;
	var icons = this.getIcons(featureId, this.getIconMappingDao(featureTable));
	if (icons !== null) {
		iconRow = icons.getIcon(geometryType);
	}
	if (iconRow === null && tableIcon) {
		iconRow = this.getTableIcon(featureTable, geometryType);
	}
	return iconRow;
};

/**
 * Get the style of the feature, searching in order: feature geometry type
 * style, feature default style, when tableStyle enabled continue searching:
 * table geometry type style, table default style
 * @param {module:features/user/featureTable|String} featureTable
 * @param {Number} featureId
 * @param {String} geometryType
 * @param {Boolean} tableStyle
 * @returns {module:extension/style.StyleRow}
 * @private
 */
FeatureStyleExtension.prototype.getStyle = function(featureTable, featureId, geometryType, tableStyle) {
	var styleRow = null;
	var styles = this.getStyles(featureId, this.getStyleMappingDao(featureTable));
	if (styles !== null) {
		styleRow = styles.getStyle(geometryType);
	}
	if (styleRow === null && tableStyle) {
		styleRow = this.getTableStyle(featureTable, geometryType);
	}
	return styleRow;
};

/**
 * Set the feature table default feature styles
 * @param {module:features/user/featureTable~FeatureTable|String} featureTable feature table
 * @param {module:extension/style.FeatureStyles} featureStyles feature styles
 * @return {Promise}
 */
FeatureStyleExtension.prototype.setTableFeatureStyles = function(featureTable, featureStyles) {
	if (featureStyles !== null) {
		var promises = [];
		promises.push(this.setTableStyles(featureTable, featureStyles.getStyles()));
		promises.push(this.setTableIcons(featureTable, featureStyles.getIcons()));
		return Promise.all(promises);
	} else {
		this.deleteTableFeatureStyles(featureTable);
		return Promise.resolve();
	}
};

/**
 * Set the feature table default styles
 * @param {module:features/user/featureTable~FeatureTable|String} featureTable feature table
 * @param {module:extension/style.Styles} styles default styles
 * @return {Promise}
 */
FeatureStyleExtension.prototype.setTableStyles = function(featureTable, styles) {
	// var tableName = featureTable.table_name ? featureTable.table_name : featureTable;
	this.deleteTableStyles(featureTable);
	if (styles !== null) {
		var promises = [];
		if (styles.getDefault() !== null) {
			promises.push(this.setTableStyleDefault(featureTable, styles.getDefault()));
		}
		var keys = Object.keys(styles.styles);
		for (var i = 0; i < keys.length; i++) {
			var key = keys[i];
			var value = styles.styles[key];
			promises.push(this.setTableStyle(featureTable, key, value));
		}
		return Promise.all(promises);
	} else {
		return Promise.resolve();
	}
};

/**
 * Set the feature table style default
 * @param {module:features/user/featureTable~FeatureTable|String} featureTable feature table
 * @param {module:extension/style.StyleRow} style style row
 * @return {Promise}
 */
FeatureStyleExtension.prototype.setTableStyleDefault = function(featureTable, style) {
	return this.setTableStyle(featureTable, null, style);
};

/**
 * Set the feature table style for the geometry type
 * @param {module:features/user/featureTable~FeatureTable|String} featureTable feature table
 * @param {String} geometryType geometry type
 * @param {module:extension/style.StyleRow} style style row
 * @return {Promise}
 */
FeatureStyleExtension.prototype.setTableStyle = function(featureTable, geometryType, style) {
	this.deleteTableStyle(featureTable, geometryType);
	if (style !== null) {
		return this.createTableStyleRelationship(featureTable).then(function () {
			var featureContentsId = this.contentsIdExtension.getOrCreateIdByTableName(this.getFeatureTableName(featureTable));
			var styleId = this.getOrInsertStyle(style);
			var mappingDao = this.getTableStyleMappingDao(featureTable);
			this.insertStyleMapping(mappingDao, featureContentsId.id, styleId, geometryType);
		}.bind(this));
	} else {
		return Promise.resolve();
	}
};

/**
 * Set the feature table default icons
 * @param {module:features/user/featureTable~FeatureTable|String} featureTable feature table
 * @param {module:extension/style.Icons} icons default icons
 * @return {Promise}
 */
FeatureStyleExtension.prototype.setTableIcons = function(featureTable, icons) {
	this.deleteTableIcons(featureTable);
	if (icons !== null) {
		var promises = [];
		if (icons.getDefault() !== null) {
			promises.push(this.setTableIconDefault(featureTable, icons.getDefault()));
		}
		var keys = Object.keys(icons.icons);
		for (var i = 0; i < keys.length; i++) {
			var key = keys[i];
			var value = icons.icons[key];
			promises.push(this.setTableIcon(featureTable, key, value));
		}
		return Promise.all(promises);
	} else {
		return Promise.resolve();
	}
};
/**
 * Set the feature table icon default
 * @param {module:features/user/featureTable~FeatureTable|String} featureTable feature table
 * @param {module:extension/style.IconRow} icon icon row
 * @return {Promise}
 */
FeatureStyleExtension.prototype.setTableIconDefault = function(featureTable, icon) {
	return this.setTableIcon(featureTable, null, icon);
};

/**
 * Set the feature table icon for the geometry type
 * @param {module:features/user/featureTable~FeatureTable|String} featureTable feature table
 * @param {String} geometryType geometry type
 * @param {module:extension/style.IconRow} icon icon row
 * @return {Promise}
 */
FeatureStyleExtension.prototype.setTableIcon = function(featureTable, geometryType, icon) {
	this.deleteTableIcon(featureTable, geometryType);
	if (icon !== null) {
		return this.createTableIconRelationship(featureTable).then(function () {
			var featureContentsId = this.contentsIdExtension.getOrCreateIdByTableName(this.getFeatureTableName(featureTable));
			var iconId = this.getOrInsertIcon(icon);
			var mappingDao = this.getTableIconMappingDao(featureTable);
			this.insertStyleMapping(mappingDao, featureContentsId.id, iconId, geometryType);
		}.bind(this));
	} else {
		return Promise.resolve();
	}
};

/**
 * Set the feature styles for the feature row
 * @param {module:features/user/featureRow} featureRow feature row
 * @param {module:extension/style.FeatureStyles} featureStyles feature styles
 * @return {Promise}
 */
FeatureStyleExtension.prototype.setFeatureStylesForFeatureRow = function(featureRow, featureStyles) {
	return this.setFeatureStyles(featureRow.featureTable.table_name, featureRow.getId(), featureStyles);
};

/**
 * Set the feature styles for the feature table and feature id
 * @param {module:features/user/featureTable~FeatureTable|String} featureTable feature table
 * @param {Number} featureId feature id
 * @param {module:extension/style.FeatureStyles} featureStyles feature styles
 * @return {Promise}
 */
FeatureStyleExtension.prototype.setFeatureStyles = function(featureTable, featureId, featureStyles) {
	if (featureStyles !== null) {
		var promises = [];
		promises.push(this.setStyles(featureTable, featureId, featureStyles.getStyles()));
		promises.push(this.setIcons(featureTable, featureId, featureStyles.getIcons()));
		return Promise.all(promises);
	} else {
		this.deleteStyles(featureTable, featureId);
		this.deleteIcons(featureTable, featureId);
		return Promise.resolve();
	}
};

/**
 * Set the feature style (style and icon) of the feature row
 * @param {module:features/user/featureRow} featureRow feature row
 * @param {module:extension/style.FeatureStyle} featureStyle feature style
 * @return {Promise}
 */
FeatureStyleExtension.prototype.setFeatureStyleForFeatureRow = function(featureRow, featureStyle) {
	return this.setFeatureStyleForFeatureRowAndGeometryType(featureRow, featureRow.getGeometryType(), featureStyle);
};

/**
 * Set the feature style (style and icon) of the feature row for the
 * specified geometry type
 * @param {module:features/user/featureRow} featureRow feature row
 * @param {String} geometryType geometry type
 * @param {module:extension/style.FeatureStyle} featureStyle feature style
 * @return {Promise}
 */
FeatureStyleExtension.prototype.setFeatureStyleForFeatureRowAndGeometryType = function(featureRow, geometryType, featureStyle) {
	return this.setFeatureStyle(featureRow.featureTable.table_name, featureRow.getId(), geometryType, featureStyle);
};

/**
 * Set the feature style default (style and icon) of the feature row
 * @param {module:features/user/featureRow} featureRow feature row
 * @param {module:extension/style.FeatureStyle} featureStyle feature style
 * @return {Promise}
 */
FeatureStyleExtension.prototype.setFeatureStyleDefaultForFeatureRow = function(featureRow, featureStyle) {
	return this.setFeatureStyle(featureRow.featureTable.table_name, featureRow.getId(), null, featureStyle);
};

/**
 * Set the feature style (style and icon) of the feature
 * @param {module:features/user/featureTable~FeatureTable|String} featureTable feature table
 * @param {Number} featureId feature id
 * @param {String} geometryType geometry type
 * @param {module:extension/style.FeatureStyle} featureStyle feature style
 * @return {Promise}
 */
FeatureStyleExtension.prototype.setFeatureStyle = async function(featureTable, featureId, geometryType, featureStyle) {
	if (featureStyle !== null) {
		var promises = [];
		promises.push(this.setStyle(featureTable, featureId, geometryType, featureStyle.getStyle()));
		promises.push(this.setIcon(featureTable, featureId, geometryType, featureStyle.getIcon()));
		return Promise.all(promises);
	} else {
		this.deleteStyle(featureTable, featureId, geometryType);
		this.deleteIcon(featureTable, featureId, geometryType);
		return Promise.resolve();
	}
};

/**
 * Set the feature style (style and icon) of the feature
 * @param {module:features/user/featureTable~FeatureTable|String} featureTable feature table
 * @param {Number} featureId feature id
 * @param {module:extension/style.FeatureStyle} featureStyle feature style
 * @return {Promise}
 */
FeatureStyleExtension.prototype.setFeatureStyleDefault = function(featureTable, featureId, featureStyle) {
	return this.setFeatureStyle(featureTable, featureId, null, featureStyle);
};

/**
 * Set the styles for the feature row
 * @param {module:features/user/featureRow} featureRow feature row
 * @param {module:extension/style.Styles} styles styles
 * @return {Promise}
 */
FeatureStyleExtension.prototype.setStylesForFeatureRow = function(featureRow, styles) {
	return this.setStyles(featureRow.featureTable.table_name, featureRow.getId(), styles);
};

/**
 * Set the styles for the feature table and feature id
 * @param {module:features/user/featureTable~FeatureTable|String} featureTable feature table
 * @param {Number} featureId feature id
 * @param {module:extension/style.Styles} styles styles
 * @return {Promise}
 */
FeatureStyleExtension.prototype.setStyles = function(featureTable, featureId, styles) {
	this.deleteStylesForFeatureId(featureTable, featureId);
	if (styles !== null) {
		var promises = [];
		if (styles.getDefault() !== null) {
			promises.push(this.setStyleDefault(featureTable, featureId, styles.getDefault()));
		}
		var keys = Object.keys(styles.styles);
		for (var i = 0; i < keys.length; i++) {
			promises.push(this.setStyle(featureTable, featureId, keys[i], styles.styles[keys[i]]));
		}
		return Promise.all(promises);
	} else {
		return Promise.resolve();
	}
};

/**
 * Set the style of the feature row
 * @param {module:features/user/featureRow} featureRow feature row
 * @param {module:extension/style.StyleRow} style style row
 * @return {Promise}
 */
FeatureStyleExtension.prototype.setStyleForFeatureRow = function(featureRow, style) {
	return this.setStyleForFeatureRowAndGeometryType(featureRow, featureRow.getGeometryType(), style);
};

/**
 * Set the style of the feature row for the specified geometry type
 * @param {module:features/user/featureRow} featureRow feature row
 * @param {String} geometryType geometry type
 * @param {module:extension/style.StyleRow} style style row
 * @return {Promise}
 */
FeatureStyleExtension.prototype.setStyleForFeatureRowAndGeometryType = function(featureRow, geometryType, style) {
	return this.setStyle(featureRow.featureTable.table_name, featureRow.getId(), geometryType, style);
};

/**
 * Set the default style of the feature row
 * @param {module:features/user/featureRow} featureRow feature row
 * @param {module:extension/style.StyleRow} style style row
 * @return {Promise}
 */
FeatureStyleExtension.prototype.setStyleDefaultForFeatureRow = function(featureRow, style) {
	return this.setStyle(featureRow.featureTable.table_name, featureRow.getId(), null, style);
};

/**
 * Set the style of the feature
 * @param {module:features/user/featureTable~FeatureTable|String} featureTable feature table
 * @param {Number} featureId feature id
 * @param {String} geometryType geometry type
 * @param {module:extension/style.StyleRow} style style row
 * @return {Promise}
 */
FeatureStyleExtension.prototype.setStyle = function(featureTable, featureId, geometryType, style) {
	this.deleteStyle(featureTable, featureId, geometryType);
	if (style !== null) {
		return this.createStyleRelationship(featureTable).then(function () {
			var styleId = this.getOrInsertStyle(style);
			var mappingDao = this.getStyleMappingDao(featureTable);
			this.insertStyleMapping(mappingDao, featureId, styleId, geometryType);
		}.bind(this));
	} else {
		return Promise.resolve();
	}
};

/**
 * Set the default style of the feature
 * @param {module:features/user/featureTable~FeatureTable|String} featureTable feature table
 * @param {Number} featureId feature id
 * @param {module:extension/style.StyleRow} style style row
 * @return {Promise}
 */
FeatureStyleExtension.prototype.setStyleDefault = function(featureTable, featureId, style) {
	return this.setStyle(featureTable, featureId, null, style);
};

/**
 * Set the icons for the feature row
 * @param {module:features/user/featureRow} featureRow feature row
 * @param {module:extension/style.Icons} icons icons
 * @return {Promise}
 */
FeatureStyleExtension.prototype.setIconsForFeatureRow = function(featureRow, icons) {
	return this.setIcons(featureRow.featureTable.table_name, featureRow.getId(), icons);
};

/**
 * Set the icons for the feature table and feature id
 * @param {module:features/user/featureTable~FeatureTable|String} featureTable feature table
 * @param {Number} featureId feature id
 * @param {module:extension/style.Icons} icons icons
 * @return {Promise}
 */
FeatureStyleExtension.prototype.setIcons = function(featureTable, featureId, icons) {
	this.deleteIconsForFeatureId(featureTable, featureId);
	if (icons !== null) {
		var promises = [];
		if (icons.getDefault() !== null) {
			promises.push(this.setIconDefault(featureTable, featureId, icons.getDefault()));
		}
		var keys = Object.keys(icons.icons);
		for (var i = 0; i < keys.length; i++) {
			promises.push(this.setIcon(featureTable, featureId, keys[i], icons.icons[keys[i]]));
		}
		return Promise.all(promises);
	} else {
		return Promise.resolve();
	}
};

/**
 * Set the icon of the feature row
 * @param {module:features/user/featureRow} featureRow feature row
 * @param {module:extension/style.IconRow} icon icon row
 * @return {Promise}
 */
FeatureStyleExtension.prototype.setIconForFeatureRow = function(featureRow, icon) {
	return this.setIconForFeatureRowAndGeometryType(featureRow, featureRow.getGeometryType(), icon);
};

/**
 * Set the icon of the feature row for the specified geometry type
 * @param {module:features/user/featureRow} featureRow feature row
 * @param {String} geometryType geometry type
 * @param {module:extension/style.IconRow} icon icon row
 * @return {Promise}
 */
FeatureStyleExtension.prototype.setIconForFeatureRowAndGeometryType = function(featureRow, geometryType, icon) {
	return this.setIcon(featureRow.featureTable.table_name, featureRow.getId(), geometryType, icon);
};

/**
 * Set the default icon of the feature row
 * @param {module:features/user/featureRow} featureRow feature row
 * @param {module:extension/style.IconRow} icon icon row
 * @return {Promise}
 */
FeatureStyleExtension.prototype.setIconDefaultForFeatureRow = function(featureRow, icon) {
	return this.setIcon(featureRow.featureTable.table_name, featureRow.getId(), null, icon);
};

/**
 * Get the icon of the feature, searching in order: feature geometry type
 * icon, feature default icon, table geometry type icon, table default icon
 * @param {module:features/user/featureTable~FeatureTable|String} featureTable feature table
 * @param {Number} featureId feature id
 * @param {String} geometryType geometry type
 * @param {module:extension/style.IconRow} icon icon row
 * @return {Promise}
 */
FeatureStyleExtension.prototype.setIcon = function(featureTable, featureId, geometryType, icon) {
	this.deleteIcon(featureTable, featureId, geometryType);
	if (icon !== null) {
		return this.createIconRelationship(featureTable).then(function () {
			var iconId = this.getOrInsertIcon(icon);
			var mappingDao = this.getIconMappingDao(featureTable);
			this.insertStyleMapping(mappingDao, featureId, iconId, geometryType);
		}.bind(this));
	} else {
		return Promise.resolve();
	}
};

/**
 * Set the default icon of the feature
 * @param {module:features/user/featureTable|String} featureTable feature table
 * @param {Number} featureId feature id
 * @param {module:extension/style.IconRow} icon icon row
 * @return {Promise}
 */
FeatureStyleExtension.prototype.setIconDefault = function(featureTable, featureId, icon) {
	return this.setIcon(featureTable, featureId, null, icon);
};

/**
 * Get the style id, either from the existing style or by inserting a new one
 * @param {module:extension/style.StyleRow} style style row
 * @return {Number} style id
 */
FeatureStyleExtension.prototype.getOrInsertStyle = function(style) {
	var styleId;
	if (style.hasId()) {
		styleId = style.getId();
	} else {
		var styleDao = this.getStyleDao();
		if (styleDao !== null) {
			styleId = styleDao.create(style);
			style.setId(styleId);
		}
	}
	return styleId;
};

/**
 * Get the icon id, either from the existing icon or by inserting a new one
 * @param {module:extension/style.IconRow} icon icon row
 * @return {Number} icon id
 */
FeatureStyleExtension.prototype.getOrInsertIcon = function(icon) {
	var iconId;
	if (icon.hasId()) {
		iconId = icon.getId();
	} else {
		var iconDao = this.getIconDao();
		if (iconDao != null) {
			iconId = iconDao.create(icon);
			icon.setId(iconId);
		}
	}
	return iconId;
};

/**
 * Insert a style mapping row
 * @param {module:extension/style.StyleMappingDao} mappingDao mapping dao
 * @param {Number} baseId base id, either contents id or feature id
 * @param {Number} relatedId related id, either style or icon id
 * @param {String} geometryType geometry type or null
 */
FeatureStyleExtension.prototype.insertStyleMapping = function(mappingDao, baseId, relatedId, geometryType) {
	var row = mappingDao.newRow();
	row.setBaseId(baseId);
	row.setRelatedId(relatedId);
	row.setGeometryTypeName(geometryType);
	mappingDao.create(row);
};

/**
 * Delete all feature styles including table styles, table icons, style, and icons
 * @param {module:features/user/featureTable~FeatureTable|String} featureTable feature table
 */
FeatureStyleExtension.prototype.deleteAllFeatureStyles = function(featureTable) {
	this.deleteTableFeatureStyles(featureTable);
	this.deleteFeatureStyles(featureTable);
};

/**
 * Delete all styles including table styles and feature row style
 * @param {module:features/user/featureTable|String} featureTable feature table
 */
FeatureStyleExtension.prototype.deleteAllStyles = function(featureTable) {
	this.deleteTableStyles(featureTable);
	this.deleteStyles(featureTable);
};

/**
 * Delete all icons including table icons and feature row icons
 * @param {module:features/user/featureTable|String} featureTable feature table
 */
FeatureStyleExtension.prototype.deleteAllIcons = function(featureTable) {
	this.deleteTableIcons(featureTable);
	this.deleteIcons(featureTable);
};

/**
 * Delete the feature table feature styles
 * @param {module:features/user/featureTable|String} featureTable feature table
 */
FeatureStyleExtension.prototype.deleteTableFeatureStyles = function(featureTable) {
	this.deleteTableStyles(featureTable);
	this.deleteTableIcons(featureTable);
};

/**
 * Delete the feature table styles
 * @param {module:features/user/featureTable|String} featureTable feature table
 */
FeatureStyleExtension.prototype.deleteTableStyles = function(featureTable) {
	this.deleteTableMappings(this.getTableStyleMappingDao(featureTable), featureTable);
};

/**
 * Delete the feature table default style
 * @param {module:features/user/featureTable|String} featureTable feature table
 */
FeatureStyleExtension.prototype.deleteTableStyleDefault = function(featureTable) {
	this.deleteTableStyle(featureTable, null);
};

/**
 * Delete the feature table style for the geometry type
 * @param {module:features/user/featureTable|String} featureTable feature table
 * @param {String} geometryType geometry type
 */
FeatureStyleExtension.prototype.deleteTableStyle = function(featureTable, geometryType) {
	this.deleteTableMapping(this.getTableStyleMappingDao(featureTable), featureTable, geometryType);
};

/**
 * Delete the feature table icons
 * @param {module:features/user/featureTable|String} featureTable feature table
 */
FeatureStyleExtension.prototype.deleteTableIcons = function(featureTable) {
	this.deleteTableMappings(this.getTableIconMappingDao(featureTable), featureTable);
};

/**
 * Delete the feature table default icon
 * @param {module:features/user/featureTable|String} featureTable feature table
 */
FeatureStyleExtension.prototype.deleteTableIconDefault = function(featureTable) {
	this.deleteTableIcon(featureTable, null);
};

/**
 * Delete the feature table icon for the geometry type
 * @param {module:features/user/featureTable|String} featureTable feature table
 * @param {String} geometryType geometry type
 */
FeatureStyleExtension.prototype.deleteTableIcon = function(featureTable, geometryType) {
	this.deleteTableMapping(this.getTableIconMappingDao(featureTable), featureTable, geometryType);
};

/**
 * Delete the table style mappings
 * @param {module:extension/style.StyleMappingDao} mappingDao  mapping dao
 * @param {module:features/user/featureTable|String} featureTable feature table
 */
FeatureStyleExtension.prototype.deleteTableMappings = function(mappingDao, featureTable) {
	if (mappingDao !== null) {
		var featureContentsId = this.contentsIdExtension.getIdByTableName(this.getFeatureTableName(featureTable));
		if (featureContentsId !== null) {
			mappingDao.deleteByBaseId(featureContentsId);
		}
	}
};

/**
 * Delete the table style mapping with the geometry type value
 * @param {module:extension/style.StyleMappingDao} mappingDao  mapping dao
 * @param {module:features/user/featureTable|String} featureTable feature table
 * @param {String} geometryType geometry type
 */
FeatureStyleExtension.prototype.deleteTableMapping = function(mappingDao, featureTable, geometryType) {
	if (mappingDao !== null) {
		var featureContentsId = this.contentsIdExtension.getIdByTableName(this.getFeatureTableName(featureTable));
		if (featureContentsId !== null) {
			mappingDao.deleteByBaseIdAndGeometryType(featureContentsId, geometryType);
		}
	}
};

/**
 * Delete all feature styles
 * @param {module:features/user/featureTable|String} featureTable feature table
 */
FeatureStyleExtension.prototype.deleteFeatureStyles = function(featureTable) {
	this.deleteStyles(featureTable);
	this.deleteIcons(featureTable);
};

/**
 * Delete all styles
 * @param {module:features/user/featureTable|String} featureTable feature table
 */
FeatureStyleExtension.prototype.deleteStyles = function(featureTable) {
	this.deleteMappings(this.getStyleMappingDao(featureTable));
};

/**
 * Delete feature row styles
 * @param {module:features/user/featureRow} featureRow feature row
 */
FeatureStyleExtension.prototype.deleteStylesForFeatureRow = function(featureRow) {
	this.deleteStylesForFeatureId(featureRow.featureTable.table_name, featureRow.getId());
};

/**
 * Delete feature row styles
 * @param {module:features/user/featureTable|String} featureTable feature table
 * @param {Number} featureId feature id
 */
FeatureStyleExtension.prototype.deleteStylesForFeatureId = function(featureTable, featureId) {
	this.deleteMappingsForFeatureId(this.getStyleMappingDao(featureTable), featureId);
};

/**
 * Delete the feature row default style
 * @param {module:features/user/featureRow} featureRow feature row
 */
FeatureStyleExtension.prototype.deleteStyleDefaultForFeatureRow = function(featureRow) {
	this.deleteStyleForFeatureRowAndGeometryType(featureRow, null);
};

/**
 * Delete the feature row default style
 * @param {module:features/user/featureTable|String} featureTable feature table
 * @param {Number} featureId feature id
 */
FeatureStyleExtension.prototype.deleteStyleDefault = function(featureTable, featureId) {
	this.deleteStyle(featureTable, featureId, null);
};

/**
 * Delete the feature row style for the feature row geometry type
 * @param {module:features/user/featureRow} featureRow feature row
 */
FeatureStyleExtension.prototype.deleteStyleForFeatureRow = function(featureRow) {
	this.deleteStyleForFeatureRowAndGeometryType(featureRow, featureRow.getGeometryType());
};

/**
 * Delete the feature row style for the geometry type
 * @param {module:features/user/featureRow} featureRow feature row
 * @param {String} geometryType geometry type
 */
FeatureStyleExtension.prototype.deleteStyleForFeatureRowAndGeometryType = function(featureRow, geometryType) {
	this.deleteStyle(featureRow.featureTable, featureRow.getId(), geometryType);
};

/**
 * Delete the feature row style for the geometry type
 * @param {module:features/user/featureTable|String} featureTable feature table
 * @param {Number} featureId feature id
 * @param {String} geometryType geometry type
 */
FeatureStyleExtension.prototype.deleteStyle = function(featureTable, featureId, geometryType) {
	this.deleteMapping(this.getStyleMappingDao(featureTable), featureId, geometryType);
};

/**
 * Delete all icons
 * @param {module:features/user/featureTable|String} featureTable feature table
 */
FeatureStyleExtension.prototype.deleteIcons = function(featureTable) {
	this.deleteMappings(this.getIconMappingDao(featureTable));
};

/**
 * Delete feature row icons
 * @param {module:features/user/featureRow} featureRow feature row
 */
FeatureStyleExtension.prototype.deleteIconsForFeatureRow = function(featureRow) {
	this.deleteIconsForFeatureId(featureRow.featureTable.table_name, featureRow.getId());
};

/**
 * Delete feature row icons
 * @param {module:features/user/featureTable|String} featureTable feature table
 * @param {Number} featureId feature id
 */
FeatureStyleExtension.prototype.deleteIconsForFeatureId = function(featureTable, featureId) {
	this.deleteMappingsForFeatureId(this.getIconMappingDao(featureTable), featureId);
};

/**
 * Delete the feature row default icon
 * @param {module:features/user/featureRow} featureRow feature row
 */
FeatureStyleExtension.prototype.deleteIconDefaultForFeatureRow = function(featureRow) {
	this.deleteIconDefault(featureRow.featureTable.table_name, featureRow.getId());
};

/**
 * Delete the feature row default icon
 * @param {module:features/user/featureTable|String} featureTable feature table
 * @param {Number} featureId feature id
 */
FeatureStyleExtension.prototype.deleteIconDefault = function(featureTable, featureId) {
	this.deleteIcon(featureTable, featureId, null);
};

/**
 * Delete the feature row icon for the feature row geometry type
 * @param {module:features/user/featureRow} featureRow feature row
 */
FeatureStyleExtension.prototype.deleteIconForFeatureRow = function(featureRow) {
	this.deleteIconForFeatureRowAndGeometryType(featureRow, featureRow.getGeometryType());
};

/**
 * Delete the feature row icon for the geometry type
 * @param {module:features/user/featureRow} featureRow feature row
 * @param {String} geometryType geometry type
 */
FeatureStyleExtension.prototype.deleteIconForFeatureRowAndGeometryType = function(featureRow, geometryType) {
	this.deleteIcon(featureRow.featureTable, featureRow.getId(), geometryType);
};

/**
 * Delete the feature row icon for the geometry type
 * @param {module:features/user/featureTable|String} featureTable feature table
 * @param {Number} featureId feature id
 * @param {String} geometryType geometry type
 */
FeatureStyleExtension.prototype.deleteIcon = function(featureTable, featureId, geometryType) {
	this.deleteMapping(this.getIconMappingDao(featureTable), featureId, geometryType);
};

/**
 * Delete all style mappings
 * @param {module:extension/style.StyleMappingDao} mappingDao  mapping dao
 */
FeatureStyleExtension.prototype.deleteMappings = function(mappingDao) {
	if (mappingDao !== null) {
		mappingDao.deleteAll();
	}
};

/**
 * Delete the style mappings
 * @param {module:extension/style.StyleMappingDao} mappingDao  mapping dao
 * @param {Number} featureId feature id
 */
FeatureStyleExtension.prototype.deleteMappingsForFeatureId = function(mappingDao, featureId) {
	if (mappingDao !== null) {
		mappingDao.deleteByBaseId(featureId);
	}
};

/**
 * Delete the style mapping with the geometry type value
 * @param {module:extension/style.StyleMappingDao} mappingDao  mapping dao
 * @param {Number} featureId feature id
 * @param {String} geometryType geometry type
 */
FeatureStyleExtension.prototype.deleteMapping = function(mappingDao, featureId, geometryType) {
	if (mappingDao !== null) {
		mappingDao.deleteByBaseIdAndGeometryType(featureId, geometryType);
	}
};

/**
 * Get all the unique style row ids the table maps to
 * @param {module:features/user/featureTable|String} featureTable feature table
 * @return style row ids
 */
FeatureStyleExtension.prototype.getAllTableStyleIds = function(featureTable) {
	var styleIds = null;
	var mappingDao = this.getTableStyleMappingDao(featureTable);
	if (mappingDao !== null) {
		styleIds = mappingDao.uniqueRelatedIds();
	}
	return styleIds;
};

/**
 * Get all the unique icon row ids the table maps to
 * @param {module:features/user/featureTable|String} featureTable feature table
 * @return icon row ids
 */
FeatureStyleExtension.prototype.getAllTableIconIds = function(featureTable) {
	var styleIds = null;
	var mappingDao = this.getTableIconMappingDao(featureTable);
	if (mappingDao !== null) {
		styleIds = mappingDao.uniqueRelatedIds();
	}
	return styleIds;
};

/**
 * Get all the unique style row ids the features map to
 * @param {module:features/user/featureTable|String} featureTable feature table
 * @return {Number[]} style row ids
 */
FeatureStyleExtension.prototype.getAllStyleIds = function(featureTable) {
	var styleIds = null;
	var mappingDao = this.getStyleMappingDao(featureTable);
	if (mappingDao !== null) {
		styleIds = mappingDao.uniqueRelatedIds();
	}
	return styleIds;
};

/**
 * Get all the unique icon row ids the features map to
 * @param {module:features/user/featureTable|String} featureTable feature table
 * @return {Number[]} icon row ids
 */
FeatureStyleExtension.prototype.getAllIconIds = function(featureTable) {
	var styleIds = null;
	var mappingDao = this.getIconMappingDao(featureTable);
	if (mappingDao !== null) {
		styleIds = mappingDao.uniqueRelatedIds();
	}
	return styleIds;
};

/**
 * Get name of feature table
 * @param featureTable
 * @returns {String}
 */
FeatureStyleExtension.prototype.getFeatureTableName = function(featureTable) {
	return featureTable.table_name ? featureTable.table_name : featureTable;
};

/**
 * Remove all traces of the extension
 */
FeatureStyleExtension.prototype.removeExtension = function() {
	this.deleteAllRelationships();
	this.geoPackage.deleteTable(StyleTable.TABLE_NAME);
	this.geoPackage.deleteTable(IconTable.TABLE_NAME);
	if (this.extensionsDao.isTableExists()) {
		this.extensionsDao.deleteByExtension(FeatureStyleExtension.EXTENSION_NAME);
	}
};

FeatureStyleExtension.EXTENSION_NAME = 'nga_feature_style';
FeatureStyleExtension.EXTENSION_AUTHOR = 'nga';
FeatureStyleExtension.EXTENSION_NAME_NO_AUTHOR = 'feature_style';
FeatureStyleExtension.EXTENSION_DEFINITION = 'http://ngageoint.github.io/GeoPackage/docs/extensions/feature-style.html';
FeatureStyleExtension.TABLE_MAPPING_STYLE = FeatureStyleExtension.EXTENSION_AUTHOR + "_style_";
FeatureStyleExtension.TABLE_MAPPING_TABLE_STYLE = FeatureStyleExtension.EXTENSION_AUTHOR + "_style_default_";
FeatureStyleExtension.TABLE_MAPPING_ICON = FeatureStyleExtension.EXTENSION_AUTHOR + "_icon_";
FeatureStyleExtension.TABLE_MAPPING_TABLE_ICON = FeatureStyleExtension.EXTENSION_AUTHOR + "_icon_default_";

module.exports = FeatureStyleExtension;

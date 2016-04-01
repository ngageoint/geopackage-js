/**
 * Contents module.
 * @module dao/contents
 * @see module:dao/dao
 */

var Dao = require('./dao');

/**
 * Contents object. Provides identifying and descriptive information that an
 * application can display to a user in a menu of geospatial data that is
 * available for access and/or update.
 * @class
 * @extends {module:dao/dao~Dao}
 */
var Contents = Dao;

Contents.prototype.tableName = Contents.tableName = 'gpkg_contents';

module.exports = Contents;

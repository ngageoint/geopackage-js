/**
 * @module extension/relatedTables
 */

var ContentsDao = require('../../core/contents').ContentsDao;

/**
 * Spec supported User-Defined Related Data Tables
 * @class
 */
var RelationType = function() {}

module.exports = RelationType;

/**
 * Link features with other features
 * @type {Object}
 */
RelationType.FEATURES = {
  name: 'features',
  dataType: ContentsDao.GPKG_CDT_FEATURES_NAME
};

/**
 * Relate sets of tabular text or numeric data
 * @type {Object}
 */
RelationType.SIMPLE_ATTRIBUTES = {
  name: 'simple_attributes',
  dataType: ContentsDao.GPKG_CDT_ATTRIBUTES_NAME
};

/**
 * Relate features or attributes to multimedia files such as pictures and videos
 * @type {Object}
 */
RelationType.MEDIA = {
  name: 'media',
  dataType: ContentsDao.GPKG_CDT_ATTRIBUTES_NAME
};

/**
 * Get the relation type from the name
 * @param  {string} name name
 * @return {module:extension/relatedTables~RelationType}
 */
RelationType.fromName = function(name) {
  return RelationType[name.toUpperCase()];
}

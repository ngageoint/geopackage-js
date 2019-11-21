/**
 * @module extension/relatedTables
 */

var ContentsDao = require('../../core/contents/contentsDao');

/**
 * Spec supported User-Defined Related Data Tables
 * @class
 */
class RelationType {
  constructor() { }
  /**
   * Get the relation type from the name
   * @param  {string} name name
   * @return {module:extension/relatedTables~RelationType}
   */
  static fromName(name) {
    return RelationType[name.toUpperCase()];
  }
}

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
 * Attribute type relation
 * @type {Object}
 */
RelationType.ATTRIBUTES = {
  name: 'attributes',
  dataType: ContentsDao.GPKG_CDT_ATTRIBUTES_NAME
};

/**
 * Tile type relation
 * @type {Object}
 */
RelationType.TILES = {
  name: 'tiles',
  dataType: ContentsDao.GPKG_CDT_TILES_NAME
};



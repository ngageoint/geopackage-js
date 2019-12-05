/**
 * @module extension/relatedTables
 */

import ContentsDao from '../../core/contents/contentsDao';

/**
 * Spec supported User-Defined Related Data Tables
 * @class
 */
export default class RelationType {
  /**
   * Link features with other features
   * @type {Object}
   */
  public static readonly FEATURES = new RelationType('features', ContentsDao.GPKG_CDT_FEATURES_NAME);

  /**
   * Relate sets of tabular text or numeric data
   * @type {Object}
   */
  public static readonly SIMPLE_ATTRIBUTES = new RelationType('simple_attributes', ContentsDao.GPKG_CDT_ATTRIBUTES_NAME);

  /**
   * Relate features or attributes to multimedia files such as pictures and videos
   * @type {Object}
   */
  public static readonly MEDIA = new RelationType('media', ContentsDao.GPKG_CDT_ATTRIBUTES_NAME);

  /**
   * Attribute type relation
   * @type {Object}
   */
  public static readonly ATTRIBUTES = new RelationType('attributes', ContentsDao.GPKG_CDT_ATTRIBUTES_NAME);

  /**
   * Tile type relation
   * @type {Object}
   */
  public static readonly TILES = new RelationType('tiles', ContentsDao.GPKG_CDT_TILES_NAME);

  name: string;
  dataType: string;

  constructor(name: string, dataType: string) {
    this.name = name;
    this.dataType = dataType;
  }
  /**
   * Get the relation type from the name
   * @param  {string} name name
   * @return {module:extension/relatedTables~RelationType}
   */
  static fromName(name: string): RelationType {
    return RelationType[name.toUpperCase()];
  }
}

/**
 * @module extension/relatedTables
 */

import {ContentsDao} from '../../core/contents/contentsDao';

/**
 * Spec supported User-Defined Related Data Tables
 * @class
 */
export default class RelationType {
  /**
   * Link features with other features
   * @type {Object}
   */
  public static readonly FEATURES: RelationType = new RelationType('features', ContentsDao.GPKG_CDT_FEATURES_NAME);

  /**
   * Relate sets of tabular text or numeric data
   * @type {Object}
   */
  public static readonly SIMPLE_ATTRIBUTES: RelationType = new RelationType('simple_attributes', ContentsDao.GPKG_CDT_ATTRIBUTES_NAME);

  /**
   * Relate features or attributes to multimedia files such as pictures and videos
   * @type {Object}
   */
  public static readonly MEDIA: RelationType = new RelationType('media', ContentsDao.GPKG_CDT_ATTRIBUTES_NAME);

  /**
   * Attribute type relation
   * @type {Object}
   */
  public static readonly ATTRIBUTES: RelationType = new RelationType('attributes', ContentsDao.GPKG_CDT_ATTRIBUTES_NAME);

  /**
   * Tile type relation
   * @type {Object}
   */
  public static readonly TILES: RelationType = new RelationType('tiles', ContentsDao.GPKG_CDT_TILES_NAME);

  constructor(public name: string, public dataType: string) { }
  /**
   * Get the relation type from the name
   * @param  {string} name name
   * @return {module:extension/relatedTables~RelationType}
   */
  static fromName(name: string): RelationType {
    return RelationType[name.toUpperCase()];
  }
}

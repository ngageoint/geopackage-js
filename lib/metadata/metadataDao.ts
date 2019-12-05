/**
 * Metadata module.
 * @module metadata
 * @see module:dao/dao
 */
import Dao from '../dao/dao';

var Metadata = require('./metadata');

/**
 * Metadata Data Access Object
 * @class
 * @extends Dao
 */
export default class MetadataDao extends Dao<typeof Metadata> {
  public static readonly TABLE_NAME = "gpkg_metadata";
  public static readonly COLUMN_ID = "id";
  public static readonly COLUMN_MD_SCOPE = "md_scope";
  public static readonly COLUMN_MD_STANDARD_URI = "md_standard_uri";
  public static readonly COLUMN_MIME_TYPE = "mime_type";
  public static readonly COLUMN_METADATA = "metadata";

  readonly gpkgTableName = MetadataDao.TABLE_NAME;
  readonly idColumns = [MetadataDao.COLUMN_ID];

  createObject() {
    return new Metadata();
  }
}
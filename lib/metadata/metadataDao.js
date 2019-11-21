/**
 * Metadata module.
 * @module metadata
 * @see module:dao/dao
 */

var Dao = require('../dao/dao')
  , Metadata = require('./metadata');

/**
 * Metadata Data Access Object
 * @class
 * @extends Dao
 */
class MetadataDao extends Dao {
  createObject() {
    return new Metadata();
  }
}

MetadataDao.TABLE_NAME = "gpkg_metadata";
MetadataDao.COLUMN_ID = "id";
MetadataDao.COLUMN_MD_SCOPE = "md_scope";
MetadataDao.COLUMN_MD_STANDARD_URI = "md_standard_uri";
MetadataDao.COLUMN_MIME_TYPE = "mime_type";
MetadataDao.COLUMN_METADATA = "metadata";

MetadataDao.prototype.gpkgTableName = MetadataDao.TABLE_NAME;
MetadataDao.prototype.idColumns = [MetadataDao.COLUMN_ID];

module.exports = MetadataDao;

/**
 * Metadata module.
 * @module metadata
 * @see module:dao/dao
 */

var Dao = require('../dao/dao');

var util = require('util');

/**
 * Contains metadata in MIME encodings structured in accordance with any
 * authoritative metadata specification
 * @class Metadata
 */
var Metadata = function() {

  /**
   * Metadata primary key
   * @member {Number}
   */
  this.id;

  /**
   * Case sensitive name of the data scope to which this metadata applies; see Metadata Scopes below
   * @member {string}
   */
  this.md_scope;

  /**
   * URI reference to the metadata structure definition authority
   * @member {string}
   */
  this.md_standard_uri;

  /**
   * MIME encoding of metadata
   * @member {string}
   */
  this.mime_type;

  /**
   * metadata
   * @member {string}
   */
  this.metadata;
}

Metadata.UNDEFINED_NAME = "undefined";
Metadata.FIELD_SESSION_NAME = "fieldSession";
Metadata.COLLECTION_SESSION_NAME = "collectionSession";
Metadata.SERIES_NAME = "series";
Metadata.DATASET_NAME = "dataset";
Metadata.FEATURE_TYPE_NAME = "featureType";
Metadata.FEATURE_NAME = "feature";
Metadata.ATTRIBUTE_TYPE_NAME = "attributeType";
Metadata.ATTRIBUTE_NAME = "attribute";
Metadata.TILE_NAME = "tile";
Metadata.MODEL_NAME = "model";
Metadata.CATALOG_NAME = "catalog";
Metadata.SCHEMA_NAME = "schema";
Metadata.TAXONOMY_NAME = "taxonomy";
Metadata.SOFTWARE_NAME = "software";
Metadata.SERVICE_NAME = "service";
Metadata.COLLECTION_HARDWARE_NAME = "collectionHardware";
Metadata.NON_GEOGRAPHIC_DATASET_NAME = "nonGeographicDataset";
Metadata.DIMENSION_GROUP_NAME = "dimensionGroup";

Metadata.prototype.getScopeInformation = function(type) {
  switch(type) {
    case Metadata.UNDEFINED_NAME:
      return {
        name: Metadata.UNDEFINED_NAME,
        code: 'NA',
        definition: 'Metadata information scope is undefined'
      };
    break;
    case Metadata.FIELD_SESSION_NAME:
      return {
        name: Metadata.FIELD_SESSION_NAME,
        code: '012',
        definition: 'Information applies to the field session'
      };
    break;
    case Metadata.COLLECTION_SESSION_NAME:
      return {
        name: Metadata.COLLECTION_SESSION_NAME,
        code: '004',
        definition: 'Information applies to the collection session'
      };
    break;
    case Metadata.SERIES_NAME:
      return {
        name: Metadata.SERIES_NAME,
        code: '006',
        definition: 'Information applies to the (dataset) series'
      };
    break;
    case Metadata.DATASET_NAME:
      return {
        name: Metadata.DATASET_NAME,
        code: '005',
        definition: 'Information applies to the (geographic feature) dataset'
      };
    break;
    case Metadata.FEATURE_TYPE_NAME:
      return {
        name: Metadata.FEATURE_TYPE_NAME,
        code: '010',
        definition: 'Information applies to a feature type (class)'
      };
    break;
    case Metadata.FEATURE_NAME:
      return {
        name: Metadata.FEATURE_NAME,
        code: '009',
        definition: 'Information applies to a feature (instance)'
      };
    break;
    case Metadata.ATTRIBUTE_TYPE_NAME:
      return {
        name: Metadata.ATTRIBUTE_TYPE_NAME,
        code: '002',
        definition: 'Information applies to the attribute class'
      };
    break;
    case Metadata.ATTRIBUTE_NAME:
      return {
        name: Metadata.ATTRIBUTE_NAME,
        code: '001',
        definition: 'Information applies to the characteristic of a feature (instance)'
      };
    break;
    case Metadata.TILE_NAME:
      return {
        name: Metadata.TILE_NAME,
        code: '016',
        definition: 'Information applies to a tile, a spatial subset of geographic data'
      };
    break;
    case Metadata.MODEL_NAME:
      return {
        name: Metadata.MODEL_NAME,
        code: '015',
        definition: 'Information applies to a copy or imitation of an existing or hypothetical object'
      };
    break;
    case Metadata.CATALOG_NAME:
      return {
        name: Metadata.CATALOG_NAME,
        code: 'NA',
        definition: 'Metadata applies to a feature catalog'
      };
    break;
    case Metadata.SCHEMA_NAME:
      return {
        name: Metadata.SCHEMA_NAME,
        code: 'NA',
        definition: 'Metadata applies to an application schema'
      };
    break;
    case Metadata.TAXONOMY_NAME:
      return {
        name: Metadata.TAXONOMY_NAME,
        code: 'NA',
        definition: 'Metadata applies to a taxonomy or knowledge system'
      };
    break;
    case Metadata.SOFTWARE_NAME:
      return {
        name: Metadata.SOFTWARE_NAME,
        code: '013',
        definition: 'Information applies to a computer program or routine'
      };
    break;
    case Metadata.SERVICE_NAME:
      return {
        name: Metadata.SERVICE_NAME,
        code: '014',
        definition: 'Information applies to a capability which a service provider entity makes available to a service user entity through a set of interfaces that define a behaviour, such as a use case'
      };
    break;
    case Metadata.COLLECTION_HARDWARE_NAME:
      return {
        name: Metadata.COLLECTION_HARDWARE_NAME,
        code: '003',
        definition: 'Information applies to the collection hardware class'
      };
    break;
    case Metadata.NON_GEOGRAPHIC_DATASET_NAME:
      return {
        name: Metadata.NON_GEOGRAPHIC_DATASET_NAME,
        code: '007',
        definition: 'Information applies to non-geographic data'
      };
    break;
    case Metadata.DIMENSION_GROUP_NAME:
      return {
        name: Metadata.DIMENSION_GROUP_NAME,
        code: '008',
        definition: 'Information applies to a dimension group'
      };
    break;
  }
}

/**
 * Metadata Data Access Object
 * @class
 * @extends {module:dao/dao~Dao}
 */
var MetadataDao = function(connection) {
  Dao.call(this, connection);
};

util.inherits(MetadataDao, Dao);

MetadataDao.prototype.createObject = function() {
  return new Metadata();
};

MetadataDao.TABLE_NAME = "gpkg_metadata";
MetadataDao.COLUMN_ID = "id";
MetadataDao.COLUMN_MD_SCOPE = "md_scope";
MetadataDao.COLUMN_MD_STANDARD_URI = "md_standard_uri";
MetadataDao.COLUMN_MIME_TYPE = "mime_type";
MetadataDao.COLUMN_METADATA = "metadata";

MetadataDao.prototype.gpkgTableName = MetadataDao.TABLE_NAME;
MetadataDao.prototype.idColumns = [MetadataDao.COLUMN_ID];

module.exports.MetadataDao = MetadataDao;
module.exports.Metadata = Metadata;

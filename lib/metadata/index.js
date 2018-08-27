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

Metadata.UNDEFINED = "undefined";
Metadata.FIELD_SESSION = "fieldSession";
Metadata.COLLECTION_SESSION = "collectionSession";
Metadata.SERIES = "series";
Metadata.DATASET = "dataset";
Metadata.FEATURE_TYPE = "featureType";
Metadata.FEATURE = "feature";
Metadata.ATTRIBUTE_TYPE = "attributeType";
Metadata.ATTRIBUTE = "attribute";
Metadata.TILE = "tile";
Metadata.MODEL = "model";
Metadata.CATALOG = "catalog";
Metadata.SCHEMA = "schema";
Metadata.TAXONOMY = "taxonomy";
Metadata.SOFTWARE = "software";
Metadata.SERVICE = "service";
Metadata.COLLECTION_HARDWARE = "collectionHardware";
Metadata.NON_GEOGRAPHIC_DATASET = "nonGeographicDataset";
Metadata.DIMENSION_GROUP = "dimensionGroup";

Metadata.prototype.getScopeInformation = function(type) {
  switch(type) {
    case Metadata.UNDEFINED:
      return {
        name: Metadata.UNDEFINED,
        code: 'NA',
        definition: 'Metadata information scope is undefined'
      };
    case Metadata.FIELD_SESSION:
      return {
        name: Metadata.FIELD_SESSION,
        code: '012',
        definition: 'Information applies to the field session'
      };
    case Metadata.COLLECTION_SESSION:
      return {
        name: Metadata.COLLECTION_SESSION,
        code: '004',
        definition: 'Information applies to the collection session'
      };
    case Metadata.SERIES:
      return {
        name: Metadata.SERIES,
        code: '006',
        definition: 'Information applies to the (dataset) series'
      };
    case Metadata.DATASET:
      return {
        name: Metadata.DATASET,
        code: '005',
        definition: 'Information applies to the (geographic feature) dataset'
      };
    case Metadata.FEATURE_TYPE:
      return {
        name: Metadata.FEATURE_TYPE,
        code: '010',
        definition: 'Information applies to a feature type (class)'
      };
    case Metadata.FEATURE:
      return {
        name: Metadata.FEATURE,
        code: '009',
        definition: 'Information applies to a feature (instance)'
      };
    case Metadata.ATTRIBUTE_TYPE:
      return {
        name: Metadata.ATTRIBUTE_TYPE,
        code: '002',
        definition: 'Information applies to the attribute class'
      };
    case Metadata.ATTRIBUTE:
      return {
        name: Metadata.ATTRIBUTE,
        code: '001',
        definition: 'Information applies to the characteristic of a feature (instance)'
      };
    case Metadata.TILE:
      return {
        name: Metadata.TILE,
        code: '016',
        definition: 'Information applies to a tile, a spatial subset of geographic data'
      };
    case Metadata.MODEL:
      return {
        name: Metadata.MODEL,
        code: '015',
        definition: 'Information applies to a copy or imitation of an existing or hypothetical object'
      };
    case Metadata.CATALOG:
      return {
        name: Metadata.CATALOG,
        code: 'NA',
        definition: 'Metadata applies to a feature catalog'
      };
    case Metadata.SCHEMA:
      return {
        name: Metadata.SCHEMA,
        code: 'NA',
        definition: 'Metadata applies to an application schema'
      };
    case Metadata.TAXONOMY:
      return {
        name: Metadata.TAXONOMY,
        code: 'NA',
        definition: 'Metadata applies to a taxonomy or knowledge system'
      };
    case Metadata.SOFTWARE:
      return {
        name: Metadata.SOFTWARE,
        code: '013',
        definition: 'Information applies to a computer program or routine'
      };
    case Metadata.SERVICE:
      return {
        name: Metadata.SERVICE,
        code: '014',
        definition: 'Information applies to a capability which a service provider entity makes available to a service user entity through a set of interfaces that define a behaviour, such as a use case'
      };
    case Metadata.COLLECTION_HARDWARE:
      return {
        name: Metadata.COLLECTION_HARDWARE,
        code: '003',
        definition: 'Information applies to the collection hardware class'
      };
    case Metadata.NON_GEOGRAPHIC_DATASET:
      return {
        name: Metadata.NON_GEOGRAPHIC_DATASET,
        code: '007',
        definition: 'Information applies to non-geographic data'
      };
    case Metadata.DIMENSION_GROUP:
      return {
        name: Metadata.DIMENSION_GROUP,
        code: '008',
        definition: 'Information applies to a dimension group'
      };
  }
}

/**
 * Metadata Data Access Object
 * @class
 * @extends {module:dao/dao~Dao}
 */
var MetadataDao = function(geoPackage) {
  Dao.call(this, geoPackage);
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

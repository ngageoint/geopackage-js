import CrsWktExtension from './lib/extension/crsWkt';
import GeoPackageConnection from './lib/db/geoPackageConnection';
import WebPExtension from './lib/extension/webp';

var proj4Defs = require('./lib/proj4Defs');
var GeoPackageTileRetriever = require('./lib/tiles/retriever');
var TableCreator = require('./lib/db/tableCreator');
var MediaTable = require('./lib/extension/relatedTables/mediaTable');
var UserMappingTable = require('./lib/extension/relatedTables/userMappingTable');
var DublinCoreType = require('./lib/extension/relatedTables/dublinCoreType');

var TileColumn = require('./lib/tiles/user/tileColumn');
var BoundingBox = require('./lib/boundingBox');
var TileUtilities = require('./lib/tiles/creator/tileUtilities');
var FeatureColumn = require('./lib/features/user/featureColumn');
var UserColumn = require('./lib/user/userColumn');
var GeometryColumns = require('./lib/features/columns/geometryColumns');
var GeometryData = require('./lib/geom/geometryData');
var DataColumns = require('./lib/dataColumns/dataColumns');
var DataTypes = require('./lib/db/dataTypes');
var Metadata = require('./lib/metadata/metadata');
var MetadataReference = require('./lib/metadata/reference/metadataReference');
var RTreeIndex = require('./lib/extension/rtree/rtreeIndex');
var SchemaExtension = require('./lib/extension/schema');
var MetadataExtension = require('./lib/extension/metadata').MetadataExtension;
var DataColumnsDao = require('./lib/dataColumns/dataColumnsDao');
var DataColumnConstraintsDao = require('./lib/dataColumnConstraints/dataColumnConstraintsDao');
var FeatureTiles = require('./lib/tiles/features');
var NumberFeaturesTile = require('./lib/tiles/features/custom/numberFeaturesTile');
var ShadedFeaturesTile = require('./lib/tiles/features/custom/shadedFeaturesTile');

export { default } from './lib/api';
export {
  proj4Defs,
  GeoPackageTileRetriever,
  GeoPackageConnection,
  TableCreator,
  MediaTable,
  UserMappingTable,
  DublinCoreType,
  TileColumn,
  TileUtilities,
  FeatureColumn,
  UserColumn,
  GeometryColumns,
  GeometryData,
  DataColumns,
  Metadata,
  MetadataReference,
  RTreeIndex,
  CrsWktExtension,
  SchemaExtension,
  MetadataExtension,
  WebPExtension,
  DataColumnsDao,
  DataColumnConstraintsDao,
  FeatureTiles,
  NumberFeaturesTile,
  ShadedFeaturesTile,
  BoundingBox,
  DataTypes
}
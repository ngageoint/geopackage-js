
module.exports = require('./lib/api');
var proj4Defs = require('./lib/proj4Defs');
module.exports.proj4Defs = proj4Defs;

module.exports.GeoPackageTileRetriever = require('./lib/tiles/retriever');
module.exports.GeoPackageConnection = require('./lib/db/geoPackageConnection');
module.exports.TableCreator = require('./lib/db/tableCreator');
module.exports.MediaTable = require('./lib/extension/relatedTables/mediaTable');
module.exports.UserMappingTable = require('./lib/extension/relatedTables/userMappingTable');
module.exports.DublinCoreType = require('./lib/extension/relatedTables/dublinCoreType');

module.exports.TileColumn = require('./lib/tiles/user/tileColumn');
module.exports.BoundingBox = require('./lib/boundingBox');
module.exports.TileUtilities = require('./lib/tiles/creator/tileUtilities');
module.exports.FeatureColumn = require('./lib/features/user/featureColumn');
module.exports.UserColumn = require('./lib/user/userColumn');
module.exports.GeometryColumns = require('./lib/features/columns/geometryColumns');
module.exports.GeometryData = require('./lib/geom/geometryData');
module.exports.DataColumns = require('./lib/dataColumns/dataColumns');
module.exports.DataTypes = require('./lib/db/dataTypes');
module.exports.Metadata = require('./lib/metadata/metadata');
module.exports.MetadataReference = require('./lib/metadata/reference/metadataReference');
module.exports.RTreeIndex = require('./lib/extension/rtree/rtreeIndex');
module.exports.CrsWktExtension = require('./lib/extension/crsWkt').CrsWktExtension;
module.exports.SchemaExtension = require('./lib/extension/schema');
module.exports.MetadataExtension = require('./lib/extension/metadata').MetadataExtension;
module.exports.WebPExtension = require('./lib/extension/webp').WebPExtension;
module.exports.DataColumnsDao = require('./lib/dataColumns/dataColumnsDao');
module.exports.DataColumnConstraintsDao = require('./lib/dataColumnConstraints/dataColumnConstraintsDao');
module.exports.FeatureTiles = require('./lib/tiles/features');
module.exports.NumberFeaturesTile = require('./lib/tiles/features/custom/numberFeaturesTile');
module.exports.ShadedFeaturesTile = require('./lib/tiles/features/custom/shadedFeaturesTile');

module.exports = require('./lib/api');

var proj4Defs = require('./lib/proj4Defs');
module.exports.proj4Defs = proj4Defs;

module.exports.GeoPackageTileRetriever = require('./lib/tiles/retriever');
module.exports.GeoPackageConnection = require('./lib/db/geoPackageConnection');
module.exports.TableCreator = require('./lib/db/tableCreator');

module.exports.TileColumn = require('./lib/tiles/user/tileColumn');
module.exports.BoundingBox = require('./lib/boundingBox');
module.exports.TileUtilities = require('./lib/tiles/creator/tileUtilities');
module.exports.FeatureColumn = require('./lib/features/user/featureColumn');
module.exports.UserColumn = require('./lib/user/userColumn');
module.exports.GeometryColumns = require('./lib/features/columns').GeometryColumns;
module.exports.GeometryData = require('./lib/geom/geometryData');
module.exports.DataColumns = require('./lib/dataColumns').DataColumns;
module.exports.DataTypes = require('./lib/db/dataTypes');
module.exports.Metadata = require('./lib/metadata').Metadata;
module.exports.MetadataReference = require('./lib/metadata/reference').MetadataReference;
module.exports.RTreeIndex = require('./lib/extension/rtree').RTreeIndex;
module.exports.CrsWktExtension = require('./lib/extension/crsWkt').CrsWktExtension;
module.exports.SchemaExtension = require('./lib/extension/schema').SchemaExtension;
module.exports.MetadataExtension = require('./lib/extension/metadata').MetadataExtension;
module.exports.WebPExtension = require('./lib/extension/webp').WebPExtension;
module.exports.DataColumnsDao = require('./lib/dataColumns').DataColumnsDao;
module.exports.DataColumnConstraintsDao = require('./lib/dataColumnConstraints').DataColumnConstraintsDao;

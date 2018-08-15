
module.exports = require('./lib/api');

var proj4Defs = require('./lib/proj4Defs');
module.exports.proj4Defs = proj4Defs;

module.exports.GeoPackageTileRetriever = require('./lib/tiles/retriever');
module.exports.GeoPackageConnection = require('./lib/db/geoPackageConnection');

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

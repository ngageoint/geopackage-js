## 1.x to 2.x Migration Guide

This will highlight all API changes that were made between 1.x and 2.x for GeoPackage-JS

### GeoPackageAPI methods changed

GeoPackageAPI.openGeoPackage -> GeoPackageAPI.open
GeoPackageAPI.openGeoPackageByteArray -> GeoPackageAPI.open
GeoPackageAPI.createGeoPackage -> GeoPackageAPI.create

### Methods moved from GeoPackageAPI

#### Methods moved to the GeoPackage object

GeoPackageAPI.addTileToGeoPackage -> geopackage.addTile
GeoPackageAPI.createTileTable -> geopackage.createTileTableWithTableName
GeoPackageAPI.getTables -> geopackage.getTables
GeoPackageAPI.getFeatureTables -> geopackage.getFeatureTables
GeoPackageAPI.getTileTables -> geopackage.getTileTables
GeoPackageAPI.hasTileTable -> geopackage.hasTileTable
GeoPackageAPI.hasFeatureTable -> geopackage.hasFeatureTable

### GeoPackageManager has been removed
GeoPackageManager.open -> GeoPackageAPI.open
GeoPackageManager.create -> GeoPackageAPI.create

### Methods with callbacks that also now return Promises

All of the following methods take an optional callback but also return a promise which resolves to the same value that the callback is called with.

GeoPackageAPI.open
GeoPackageAPI.create

### Callbacks that have been moved to Promises

All of the following methods have had their callback parameters removed and they return a promise

GeoPackageConnection constructor
GeoPackageConnection.connect
GeoPackageConnection.connectWithDatabase
sqliteAdapter.createAdapter
GeoPackageConnection.prototype.setApplicationId
TableCreator.prototype.createRequired
GeoPackageValidate.hasMinimumTables

### Methods with Callbacks that now return results
Adapter.prototype.run
GeoPackage.prototype.getApplicationId
GeoPackage.prototype.createFeatureTable
GeoPackage.prototype.createTileTable
GeoPackage.prototype.getSrs
GeoPackageConnection.prototype.getApplicationId
GeoPackageConnection.prototype.get
GeoPackageConnection.prototype.tableExists
GeoPackageConnection.prototype.setApplicationId
SqliteAdapter.prototype.get
ContentsDao.prototype.getSrs
Dao.prototype.queryForIdObject
Dao.prototype.queryForSameId
Dao.prototype.queryForMultiIdObject
Dao.prototype.isTableExists
SpatialReferenceSystemDao.prototype.getBySrsId
DataColumnsDao.prototype.getContents
DataColumnConstraintsDao.prototype.queryUnique
GeometryColumnsDao.prototype.getSrs
GeometryColumnsDao.prototype.getContents
GeometryColumnsDao.prototype.getProjection
TileDao constructor
TileDao.prototype.initialize
TileDao.prototype.getSrs
TileMatrixSetDao.prototype.getSrs
TileMatrixSetDao.prototype.getProjection
TileMatrixSetDao.prototype.getContents
TileMatrixDao.prototype.getTileMatrixSet
FeatureDao.prototype.getSrs
FeatureTableIndex.prototype.getTableIndex
GeometryIndexDao.prototype.getTableIndex
TableCreator.prototype.createUserTable
GeoPackageValidate.hasMinimumTables

### New methods
GeoPackage.prototype.createRequiredTables

### Other changes
GeoPackageConnection.prototype.run now explicitly calls out parameters that may be passed

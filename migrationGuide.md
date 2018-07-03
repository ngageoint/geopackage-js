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

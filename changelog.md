### Changelog

##### 5.0.1
- Added in FeatureTileGenerator
- Added in UrlTileGenerator
- Rebuilt CanvasKit to add support for webp and jpeg

##### 5.0.0
- GeoPackage JS's API has been updated to more closely match GeoPackage Java v6.4.0
  - Not yet implemented: 2D Gridded Tile Coverage Extension and OGC API Feature Generator
- GeoPackageExtensions is now ExtensionManager
- GeoPackageAPI is now GeoPackageManager
- Added FeatureTileTableLink extension
- Added support for extended geometry types
- Added Properties extension
- Added ZoomOther extension
- Added support for drawing extended geometry types
- Updated to use NGA simple features javascript libraries
- Updated to use NGA projections javascript library
- Added UserCustomRow
- Reworked UserRow, UserTable, and UserColumn and updated all super types
- Added in FeatureConnection, TileConnection, AttributesConnection and UserCustomConnections.
- Added GeoPackageCache

##### 4.2.6
- Upgrade the [`file-type`](https://www.npmjs.com/package/file-type) dependency to address [CVE-2022-36313](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-36313).

##### 4.2.5

- Fix a bug that set `undefined` on sql.js prepared statement values causing sql.js to throw an error.
- Update `better-sqlite3` dependency to 9.x.
- Make `properties` parameter to optional in signature of `createMediaTable()` method.
- Add stack trace to error log when loading SQLite adapter.

##### 4.2.4

- Update CanvasKit libs with libs from develop to fix runtime error in Node 18

##### 4.2.3

- fix cached geometry error

##### 4.2.2

- fix simplify error

##### 4.2.1

- Fix for drawing geometries outside of the 3857 bounds

##### 4.2.0

- Support for drawing vector data into EPSG:4326 tiles
- Added createStandardWGS84TileTable

##### 4.1.0

- Typescript updates
- Extract converters, leaflet plugin, mobile optimizer, and viewer into their own packages

##### 4.0.0

- Alter tables functions (copy, rename for table and columns)
- Publish separate node and browser module
- GeoPackageJS can now be run in Node.js worker_threads and Web Workers

##### 2.1.0

- Implementation of the Feature Style Extension and Contents ID Extension

##### 2.0.8

- Checks for Electron when returning a tile creator

##### 2.0

- All new API utilizing Promises

##### 1.1.4

- Adds a method to retrieve tiles in EPSG:4326

##### 1.1.3

- Fixes issue #115

##### 1.1.2

- fix case where GeoPackage Zoom does not correspond to the web map zoom

##### 1.1.1

- fix more instances of proj4 bug for react
- fixed tile generation for images with different x and y pixel densities

##### 1.1.0

- accept pull request adding support for react
- fix bug with projected tiles that spanned the date line

##### 1.0.25

- ensure we use proj4 2.4.3 instead of 2.4.4

##### 1.0.22

- Fixed bug where querying for indexed features only returned the geometry instead of the entire feature

##### 1.0.19

- Remove dependency on Lwip
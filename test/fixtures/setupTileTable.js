// +(void) setUpCreateTilesWithGeoPackage: (GPKGGeoPackage *) geoPackage{
//
//     // Get existing SRS objects
//     GPKGSpatialReferenceSystemDao * srsDao = [geoPackage getSpatialReferenceSystemDao];
//
//     GPKGSpatialReferenceSystem * epsgSrs = (GPKGSpatialReferenceSystem *)[srsDao queryForIdObject:[NSNumber numberWithInt:4326]];
//
//     [GPKGTestUtils assertNotNil:epsgSrs];
//
//     // Create the Tile Matrix Set and Tile Matrix tables
//     [geoPackage createTileMatrixSetTable];
//     [geoPackage createTileMatrixTable];
//
//     // Create new Contents
//     GPKGContentsDao * contentsDao = [geoPackage getContentsDao];
//
//
//     GPKGContents * contents = [[GPKGContents alloc] init];
//     [contents setTableName:@"test_tiles"];
//     [contents setContentsDataType:GPKG_CDT_TILES];
//     [contents setIdentifier:@"test_tiles"];
//     //[contents setTheDescription:@""];
//     [contents setLastChange:[NSDate date]];
//     [contents setMinX:[[NSDecimalNumber alloc] initWithDouble:-180.0]];
//     [contents setMinY:[[NSDecimalNumber alloc] initWithDouble:-90.0]];
//     [contents setMaxX:[[NSDecimalNumber alloc] initWithDouble:180.0]];
//     [contents setMaxY:[[NSDecimalNumber alloc] initWithDouble:90.0]];
//     [contents setSrs:epsgSrs];
//
//     // Create the user tile table
//     GPKGTileTable * tileTable = [GPKGTestUtils buildTileTableWithTableName:contents.tableName];
//     [geoPackage createTileTable:tileTable];
//
//     // Create the contents
//     [contentsDao create:contents];
//
//     // Create the new Tile Matrix Set
//     GPKGTileMatrixSetDao * tileMatrixSetDao = [geoPackage getTileMatrixSetDao];
//
//     GPKGTileMatrixSet * tileMatrixSet = [[GPKGTileMatrixSet alloc] init];
//     [tileMatrixSet setContents:contents];
//     [tileMatrixSet setSrs:epsgSrs];
//     [tileMatrixSet setMinX:contents.minX];
//     [tileMatrixSet setMinY:contents.minY];
//     [tileMatrixSet setMaxX:contents.maxX];
//     [tileMatrixSet setMaxY:contents.maxY];
//     [tileMatrixSetDao create:tileMatrixSet];
//
//     // Create new Tile Matrix rows
//     GPKGTileMatrixDao * tileMatrixDao = [geoPackage getTileMatrixDao];
//
//     int matrixWidthAndHeight = 2;
//     double pixelXSize = 69237.2;
//     double pixelYSize = 68412.1;
//
//     // Read the asset tile to bytes and convert to bitmap
//     NSString *tilePath  = [[[NSBundle bundleForClass:[GPKGTestSetupTeardown class]] resourcePath] stringByAppendingPathComponent:GPKG_TEST_TILE_FILE_NAME];
//     NSData *tilePathData = [[NSFileManager defaultManager] contentsAtPath:tilePath];
//     UIImage * image = [GPKGImageConverter toImage:tilePathData];
//
//     // Get the width and height of the bitmap
//     int tileWidth = image.size.width;
//     int tileHeight = image.size.height;
//
//     // Compress the bitmap back to bytes and use those for the test
//     NSData * tileData = [GPKGImageConverter toData:image andFormat:[GPKGCompressFormats fromName:GPKG_TEST_TILE_FILE_NAME_EXTENSION]];
//
//     for(int zoom = 0; zoom < GPKG_TEST_SETUP_CREATE_TILE_MATRIX_COUNT; zoom++){
//
//         GPKGTileMatrix * tileMatrix = [[GPKGTileMatrix alloc] init];
//         [tileMatrix setContents:contents];
//         [tileMatrix setZoomLevel:[NSNumber numberWithInt:zoom]];
//         [tileMatrix setMatrixWidth:[NSNumber numberWithInt:matrixWidthAndHeight]];
//         [tileMatrix setMatrixHeight:[NSNumber numberWithInt:matrixWidthAndHeight]];
//         [tileMatrix setTileWidth:[NSNumber numberWithInt:tileWidth]];
//         [tileMatrix setTileHeight:[NSNumber numberWithInt:tileHeight]];
//         [tileMatrix setPixelXSize:[[NSDecimalNumber alloc] initWithDouble:pixelXSize]];
//         [tileMatrix setPixelYSize:[[NSDecimalNumber alloc] initWithDouble:pixelYSize]];
//         [tileMatrixDao create:tileMatrix];
//
//         matrixWidthAndHeight *= 2;
//         pixelXSize /= 2.0;
//         pixelYSize /= 2.0;
//
//         // Populate the tile table with rows
//         [GPKGTestUtils addRowsToTileTableWithGeoPackage:geoPackage andTileMatrix:tileMatrix andData:tileData];
//     }
//
// }

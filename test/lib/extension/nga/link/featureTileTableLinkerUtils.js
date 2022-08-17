// export class FeatureTileTableLinkerUtils {
//
// 	/**
// 	 * Test link
// 	 *
// 	 * @param geoPackage
// 	 * @throws SQLException
// 	 */
// 	public static void testLink(GeoPackage geoPackage) throws SQLException {
//
// 		geoPackage.getExtensionManager().deleteExtensions();
//
// 		FeatureTileTableLinker linker = new FeatureTileTableLinker(geoPackage);
// 		TestCase.assertNull(linker.getExtension());
//
// 		// Test linking feature and tile tables
// 		List<String> featureTables = geoPackage.getFeatureTables();
// 		List<String> tileTables = geoPackage.getTileTables();
//
// 		if (!featureTables.isEmpty() && !tileTables.isEmpty()) {
//
// 			FeatureTileLinkDao dao = linker.getDao();
//
// 			Set<String> linkedFeatureTables = new HashSet<String>();
//
// 			for (String featureTable : featureTables) {
//
// 				linkedFeatureTables.add(featureTable);
//
// 				Set<String> linkedTileTables = new HashSet<String>();
//
// 				for (String tileTable : tileTables) {
//
// 					linkedTileTables.add(tileTable);
//
// 					TestCase.assertFalse(linker.isLinked(featureTable,
// 							tileTable));
//
// 					long count = 0;
// 					if (dao.isTableExists()) {
// 						count = dao.countOf();
// 					}
//
// 					// Link the tables
// 					linker.link(featureTable, tileTable);
// 					TestCase.assertTrue(linker
// 							.isLinked(featureTable, tileTable));
// 					TestCase.assertEquals(count + 1, dao.countOf());
// 					TestCase.assertNotNull(linker.getExtension());
//
// 					// Shouldn't hurt to link it twice
// 					linker.link(featureTable, tileTable);
// 					TestCase.assertTrue(linker
// 							.isLinked(featureTable, tileTable));
// 					TestCase.assertEquals(count + 1, dao.countOf());
// 					TestCase.assertNotNull(linker.getExtension());
//
// 					// Verify linked feature tables
// 					List<FeatureTileLink> links = linker
// 							.queryForTileTable(tileTable);
// 					TestCase.assertEquals(linkedFeatureTables.size(),
// 							links.size());
// 					for (FeatureTileLink link : links) {
// 						TestCase.assertTrue(linkedFeatureTables.contains(link
// 								.getFeatureTableName()));
// 					}
//
// 					// Verify linked tile tables
// 					links = linker.queryForFeatureTable(featureTable);
// 					TestCase.assertEquals(linkedTileTables.size(), links.size());
// 					for (FeatureTileLink link : links) {
// 						TestCase.assertTrue(linkedTileTables.contains(link
// 								.getTileTableName()));
// 					}
//
// 				}
//
// 			}
//
// 			Extensions extension = linker.getExtension();
// 			TestCase.assertEquals(FeatureTileTableLinker.EXTENSION_NAME,
// 					extension.getExtensionName());
// 			TestCase.assertEquals(FeatureTileTableLinker.EXTENSION_AUTHOR,
// 					extension.getAuthor());
// 			TestCase.assertEquals(
// 					FeatureTileTableLinker.EXTENSION_NAME_NO_AUTHOR,
// 					extension.getExtensionNameNoAuthor());
// 			TestCase.assertEquals(FeatureTileTableLinker.EXTENSION_DEFINITION,
// 					extension.getDefinition());
// 			TestCase.assertNull(extension.getTableName());
// 			TestCase.assertNull(extension.getColumnName());
//
// 			// Delete a single link
// 			long count = dao.countOf();
// 			String featureTable = featureTables.get(0);
// 			String tileTable = tileTables.get(0);
// 			TestCase.assertTrue(linker.isLinked(featureTable, tileTable));
// 			linker.deleteLink(featureTable, tileTable);
// 			TestCase.assertFalse(linker.isLinked(featureTable, tileTable));
// 			TestCase.assertEquals(count - 1, dao.countOf());
//
// 			// Delete all links from a feature table
// 			if (tileTables.size() > 1) {
// 				int linkedTables = linker.queryForFeatureTable(featureTable)
// 						.size();
// 				TestCase.assertTrue(linkedTables > 0);
// 				int deletedCount = linker.deleteLinks(featureTable);
// 				TestCase.assertEquals(linkedTables, deletedCount);
// 				TestCase.assertEquals(0,
// 						linker.queryForFeatureTable(featureTable).size());
// 			}
//
// 			// Delete all links from a tile table
// 			if (featureTables.size() > 1) {
// 				int linkedTables = linker.queryForTileTable(tileTable).size();
// 				TestCase.assertTrue(linkedTables > 0);
// 				int deletedCount = linker.deleteLinks(tileTable);
// 				TestCase.assertEquals(linkedTables, deletedCount);
// 				TestCase.assertEquals(0, linker.queryForTileTable(tileTable)
// 						.size());
// 			}
//
// 			TestCase.assertTrue(dao.isTableExists());
// 			TestCase.assertNotNull(linker.getExtension());
//
// 			// Test deleting all NGA extensions
// 			geoPackage.getExtensionManager().deleteExtensions();
//
// 			TestCase.assertFalse(dao.isTableExists());
// 			TestCase.assertNull(linker.getExtension());
//
// 			for (String ft : featureTables) {
// 				for (String tt : tileTables) {
// 					TestCase.assertFalse(linker.isLinked(ft, tt));
// 				}
// 			}
// 			TestCase.assertFalse(dao.isTableExists());
// 			TestCase.assertNull(linker.getExtension());
// 		}
//
// 	}
//
// }

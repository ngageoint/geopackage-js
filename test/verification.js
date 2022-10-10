module.exports.verifySRS = function(geoPackage) {
  var db = geoPackage.getDatabase();
  return !!db.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['gpkg_spatial_ref_sys'])
    && !!db.get("SELECT name FROM sqlite_master WHERE type='view' AND name=?", ['st_spatial_ref_sys'])
    && !!db.get("SELECT name FROM sqlite_master WHERE type='view' AND name=?", ['spatial_ref_sys']);
}

module.exports.verifyContents = function(geoPackage) {
  return !!geoPackage.getDatabase().get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['gpkg_contents']);
}

module.exports.verifyContentsForTable = function(geoPackage, tableName) {
  // this is empty, so the gpkg_contents was not added for my table
  return module.exports.verifyContents(geoPackage)
    && !!geoPackage.getDatabase().get("SELECT * from gpkg_contents where table_name = ?", [tableName]);
}

module.exports.verifyGeometryColumns = function(geoPackage) {
  var db = geoPackage.getDatabase();
  return !!db.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['gpkg_geometry_columns'])
    && !!db.get("SELECT name FROM sqlite_master WHERE type='view' AND name=?", ['st_geometry_columns'])
    && !!db.get("SELECT name FROM sqlite_master WHERE type='view' AND name=?", ['geometry_columns']);
}

module.exports.verifyGeometryColumnsForTable = function(geoPackage, tableName) {
  return module.exports.verifyGeometryColumns(geoPackage)
    && !!geoPackage.getDatabase().get("SELECT * from gpkg_geometry_columns where table_name = ?", [tableName]);
}


module.exports.verifyTileMatrixSet = function(geoPackage) {
  return !!geoPackage.getDatabase().get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['gpkg_tile_matrix_set']);
}

module.exports.verifyTileMatrix = function(geoPackage) {
  var db = geoPackage.getDatabase();
  return !!db.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['gpkg_tile_matrix'])
    && !!db.get("SELECT name FROM sqlite_master WHERE type='trigger' AND name=?", ['gpkg_tile_matrix_zoom_level_insert'])
    && !!db.get("SELECT name FROM sqlite_master WHERE type='trigger' AND name=?", ['gpkg_tile_matrix_zoom_level_update'])
    && !!db.get("SELECT name FROM sqlite_master WHERE type='trigger' AND name=?", ['gpkg_tile_matrix_matrix_width_insert'])
    && !!db.get("SELECT name FROM sqlite_master WHERE type='trigger' AND name=?", ['gpkg_tile_matrix_matrix_width_update'])
    && !!db.get("SELECT name FROM sqlite_master WHERE type='trigger' AND name=?", ['gpkg_tile_matrix_matrix_height_insert'])
    && !!db.get("SELECT name FROM sqlite_master WHERE type='trigger' AND name=?", ['gpkg_tile_matrix_matrix_height_update'])
    && !!db.get("SELECT name FROM sqlite_master WHERE type='trigger' AND name=?", ['gpkg_tile_matrix_pixel_x_size_insert'])
    && !!db.get("SELECT name FROM sqlite_master WHERE type='trigger' AND name=?", ['gpkg_tile_matrix_pixel_x_size_update'])
    && !!db.get("SELECT name FROM sqlite_master WHERE type='trigger' AND name=?", ['gpkg_tile_matrix_pixel_y_size_insert'])
    && !!db.get("SELECT name FROM sqlite_master WHERE type='trigger' AND name=?", ['gpkg_tile_matrix_pixel_y_size_update']);
}

module.exports.verifyDataColumns = function(geoPackage) {
  return !!geoPackage.getDatabase().get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['gpkg_data_columns']);
}

module.exports.verifyDataColumnConstraints = function(geoPackage) {
  return !!geoPackage.getDatabase().get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['gpkg_data_column_constraints']);
}

module.exports.verifyMetadata = function(geoPackage) {
  var db = geoPackage.getDatabase();
  return !!db.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['gpkg_metadata'])
    && !!db.get("SELECT name FROM sqlite_master WHERE type='trigger' AND name=?", ['gpkg_metadata_md_scope_insert'])
    && !!db.get("SELECT name FROM sqlite_master WHERE type='trigger' AND name=?", ['gpkg_metadata_md_scope_update']);
}

module.exports.verifyMetadataReference = function(geoPackage) {

  var db = geoPackage.getDatabase();
  return !!db.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['gpkg_metadata_reference'])
    && !!db.get("SELECT name FROM sqlite_master WHERE type='trigger' AND name=?", ['gpkg_metadata_reference_reference_scope_insert'])
    && !!db.get("SELECT name FROM sqlite_master WHERE type='trigger' AND name=?", ['gpkg_metadata_reference_reference_scope_update'])
    && !!db.get("SELECT name FROM sqlite_master WHERE type='trigger' AND name=?", ['gpkg_metadata_reference_column_name_update'])
    && !!db.get("SELECT name FROM sqlite_master WHERE type='trigger' AND name=?", ['gpkg_metadata_reference_column_name_insert'])
    && !!db.get("SELECT name FROM sqlite_master WHERE type='trigger' AND name=?", ['gpkg_metadata_reference_row_id_value_insert'])
    && !!db.get("SELECT name FROM sqlite_master WHERE type='trigger' AND name=?", ['gpkg_metadata_reference_row_id_value_update'])
    && !!db.get("SELECT name FROM sqlite_master WHERE type='trigger' AND name=?", ['gpkg_metadata_reference_timestamp_insert'])
    && !!db.get("SELECT name FROM sqlite_master WHERE type='trigger' AND name=?", ['gpkg_metadata_reference_timestamp_update']);
}

module.exports.verifyContentsId = function(geoPackage) {
  return !!geoPackage.getDatabase().get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['nga_contents_id']);
}

module.exports.verifyExtensions = function(geoPackage) {
  return !!geoPackage.getDatabase().get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['gpkg_extensions']);
}

module.exports.verifyTableIndex = function(geoPackage) {
  return !!geoPackage.getDatabase().get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['nga_table_index']);
}

module.exports.verifyGeometryIndex = function(geoPackage) {
  return !!geoPackage.getDatabase().get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['nga_geometry_index']);
}

module.exports.verifyFeatureTileLink = function(geoPackage) {
  return !!geoPackage.getDatabase().get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['nga_feature_tile_link']);
}

module.exports.verifyTableExists = function(geoPackage, table) {
  return !!geoPackage.getDatabase().get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", [table]);
}

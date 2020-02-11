
module.exports.verifySRS = function(geopackage) {
  var db = geopackage.database;
  return !!db.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['gpkg_spatial_ref_sys'])
    && !!db.get("SELECT name FROM sqlite_master WHERE type='view' AND name=?", ['st_spatial_ref_sys'])
    && !!db.get("SELECT name FROM sqlite_master WHERE type='view' AND name=?", ['spatial_ref_sys']);
}

module.exports.verifyContents = function(geopackage) {
  return !!geopackage.database.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['gpkg_contents']);
}

module.exports.verifyContentsForTable = function(geopackage, tableName) {
  return module.exports.verifyContents(geopackage)
    && !!geopackage.database.get("SELECT * from gpkg_contents where table_name = ?", [tableName]);
}

module.exports.verifyGeometryColumns = function(geopackage) {
  var db = geopackage.database;
  return !!db.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['gpkg_geometry_columns'])
    && !!db.get("SELECT name FROM sqlite_master WHERE type='view' AND name=?", ['st_geometry_columns'])
    && !!db.get("SELECT name FROM sqlite_master WHERE type='view' AND name=?", ['geometry_columns']);
}

module.exports.verifyGeometryColumnsForTable = function(geopackage, tableName) {
  return module.exports.verifyGeometryColumns(geopackage)
    && !!geopackage.database.get("SELECT * from gpkg_geometry_columns where table_name = ?", [tableName]);
}


module.exports.verifyTileMatrixSet = function(geopackage) {
  return !!geopackage.database.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['gpkg_tile_matrix_set']);
}

module.exports.verifyTileMatrix = function(geopackage) {
  var db = geopackage.database;
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

module.exports.verifyDataColumns = function(geopackage) {
  return !!geopackage.database.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['gpkg_data_columns']);
}

module.exports.verifyDataColumnConstraints = function(geopackage) {
  return !!geopackage.database.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['gpkg_data_column_constraints']);
}

module.exports.verifyMetadata = function(geopackage) {
  var db = geopackage.database;
  return !!db.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['gpkg_metadata'])
    && !!db.get("SELECT name FROM sqlite_master WHERE type='trigger' AND name=?", ['gpkg_metadata_md_scope_insert'])
    && !!db.get("SELECT name FROM sqlite_master WHERE type='trigger' AND name=?", ['gpkg_metadata_md_scope_update']);
}

module.exports.verifyMetadataReference = function(geopackage) {

  var db = geopackage.database;
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

module.exports.verifyContentsId = function(geopackage) {
  return !!geopackage.database.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['nga_contents_id']);
}

module.exports.verifyExtensions = function(geopackage) {
  return !!geopackage.database.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['gpkg_extensions']);
}

module.exports.verifyTableIndex = function(geopackage) {
  return !!geopackage.database.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['nga_table_index']);
}

module.exports.verifyGeometryIndex = function(geopackage) {
  return !!geopackage.database.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['nga_geometry_index']);
}

module.exports.verifyFeatureTileLink = function(geopackage) {
  return !!geopackage.database.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['nga_feature_tile_link']);
}

module.exports.verifyTableExists = function(geopackage, table) {
  return !!geopackage.database.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", [table]);
}

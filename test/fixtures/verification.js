var async = require('async');

module.exports.verifySRS = function(geopackage, done) {
  geopackage.getDatabase().get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['gpkg_spatial_ref_sys'], function(err, results) {
    if(!results) {
      return done(new Error('Table gpkg_spatial_ref_sys does not exist'), false);
    }
    geopackage.getDatabase().get("SELECT name FROM sqlite_master WHERE type='view' AND name=?", ['st_spatial_ref_sys'], function(err, results) {
      if(!results) {
        return done(new Error('View st_spatial_ref_sys does not exist'), false);
      }
      geopackage.getDatabase().get("SELECT name FROM sqlite_master WHERE type='view' AND name=?", ['spatial_ref_sys'], function(err, results) {
        if(!results) {
          return done(new Error('View spatial_ref_sys does not exist'), false);
        }
        done();
      });
    });
  });
}

module.exports.verifyContents = function(geopackage, done) {
  geopackage.getDatabase().get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['gpkg_contents'], function(err, results) {
    if(!results) {
      return done(new Error('Table gpkg_contents does not exist'), false);
    }
    done();
  });
}

module.exports.verifyContentsForTable = function(geopackage, tableName, done) {
  module.exports.verifyContents(geopackage, function(err, results) {
    if(err) {
      return done(err, false);
    }
    geopackage.getDatabase().get("SELECT * from gpkg_contents where table_name = ?", [tableName], function(err, results) {
      if (!results) {
        return done(new Error('Contents do not exist for the table "' + tableName + '"'), false);
      }
      done();
    });
  });
}

module.exports.verifyGeometryColumns = function(geopackage, done) {
  geopackage.getDatabase().get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['gpkg_geometry_columns'], function(err, results) {
    if(!results) {
      return done(new Error('Table gpkg_geometry_columns does not exist'), false);
    }
    geopackage.getDatabase().get("SELECT name FROM sqlite_master WHERE type='view' AND name=?", ['st_geometry_columns'], function(err, results) {
      if(!results) {
        return done(new Error('View st_geometry_columns does not exist'), false);
      }
      geopackage.getDatabase().get("SELECT name FROM sqlite_master WHERE type='view' AND name=?", ['geometry_columns'], function(err, results) {
        if(!results) {
          return done(new Error('View geometry_columns does not exist'), false);
        }
        done();
      });
    });
  });
}

module.exports.verifyGeometryColumnsForTable = function(geopackage, tableName, done) {
  module.exports.verifyGeometryColumns(geopackage, function(err) {
    if (err) return done(err, false);
    geopackage.getDatabase().get("SELECT * from gpkg_geometry_columns where table_name = ?", [tableName], function(err, results) {
      if (!results) {
        return done(new Error('Geometry Columns do not exist for the table"' + tableName + '"'), false);
      }
      done();
    });
  });
}


module.exports.verifyTileMatrixSet = function(geopackage, done) {
  geopackage.getDatabase().get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['gpkg_tile_matrix_set'], function(err, results) {
    if(!results) {
      return done(new Error('Table gpkg_tile_matrix_set does not exist'), false);
    }
    done();
  });
}

module.exports.verifyTileMatrix = function(geopackage, done) {
  geopackage.getDatabase().get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['gpkg_tile_matrix'], function(err, results) {
    if(!results) {
      return done(new Error('Table gpkg_tile_matrix does not exist'), false);
    }
    async.eachSeries(['gpkg_tile_matrix_zoom_level_insert',
    'gpkg_tile_matrix_zoom_level_update',
    'gpkg_tile_matrix_matrix_width_insert',
    'gpkg_tile_matrix_matrix_width_update',
    'gpkg_tile_matrix_matrix_height_insert',
    'gpkg_tile_matrix_matrix_height_update',
    'gpkg_tile_matrix_pixel_x_size_insert',
    'gpkg_tile_matrix_pixel_x_size_update',
    'gpkg_tile_matrix_pixel_y_size_insert',
    'gpkg_tile_matrix_pixel_y_size_update'
  ], function(trigger, callback) {
      geopackage.getDatabase().get("SELECT name FROM sqlite_master WHERE type='trigger' AND name=?", [trigger], function(err, results) {
        if(!results) {
          return callback(new Error('Trigger ' + trigger + ' does not exist'), false);
        }
        callback();
      });
    }, done);
  });
}

module.exports.verifyDataColumns = function(geopackage, done) {
  geopackage.getDatabase().get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['gpkg_data_columns'], function(err, results) {
    if(!results) {
      return done(new Error('Table gpkg_data_columns does not exist'), false);
    }
    done();
  });
}

module.exports.verifyDataColumnConstraints = function(geopackage, done) {
  geopackage.getDatabase().get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['gpkg_data_column_constraints'], function(err, results) {
    if(!results) {
      return done(new Error('Table gpkg_data_column_constraints does not exist'), false);
    }
    done();
  });
}

module.exports.verifyMetadata = function(geopackage, done) {
  geopackage.getDatabase().get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['gpkg_metadata'], function(err, results) {
    if(!results) {
      return done(new Error('Table gpkg_metadata does not exist'), false);
    }
    geopackage.getDatabase().get("SELECT name FROM sqlite_master WHERE type='trigger' AND name=?", ['gpkg_metadata_md_scope_insert'], function(err, results) {
      if(!results) {
        return done(new Error('Trigger gpkg_metadata_md_scope_insert does not exist'), false);
      }
      geopackage.getDatabase().get("SELECT name FROM sqlite_master WHERE type='trigger' AND name=?", ['gpkg_metadata_md_scope_update'], function(err, results) {
        if(!results) {
          return done(new Error('Trigger gpkg_metadata_md_scope_update does not exist'), false);
        }
        done();
      });
    });
  });
}

module.exports.verifyMetadataReference = function(geopackage, done) {
  geopackage.getDatabase().get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['gpkg_metadata_reference'], function(err, results) {
    if(!results) {
      return done(new Error('Table gpkg_metadata_reference does not exist'), false);
    }
    async.eachSeries(['gpkg_metadata_reference_reference_scope_insert',
    'gpkg_metadata_reference_reference_scope_update',
    'gpkg_metadata_reference_column_name_insert',
    'gpkg_metadata_reference_column_name_update',
    'gpkg_metadata_reference_row_id_value_insert',
    'gpkg_metadata_reference_row_id_value_update',
    'gpkg_metadata_reference_timestamp_insert',
    'gpkg_metadata_reference_timestamp_update'
  ], function(trigger, callback) {
      geopackage.getDatabase().get("SELECT name FROM sqlite_master WHERE type='trigger' AND name=?", [trigger], function(err, results) {
        if(!results) {
          return callback(new Error('Trigger ' + trigger + ' does not exist'), false);
        }
        callback();
      });
    }, done);
  });
}

module.exports.verifyExtensions = function(geopackage, done) {
  geopackage.getDatabase().get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['gpkg_extensions'], function(err, results) {
    if(!results) {
      return done(new Error('Table gpkg_extensions does not exist'), false);
    }
    done();
  });
}

module.exports.verifyTableIndex = function(geopackage, done) {
  geopackage.getDatabase().get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['nga_table_index'], function(err, results) {
    if(!results) {
      return done(new Error('Table nga_table_index does not exist'), false);
    }
    done();
  });
}

module.exports.verifyGeometryIndex = function(geopackage, done) {
  geopackage.getDatabase().get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['nga_geometry_index'], function(err, results) {
    if(!results) {
      return done(new Error('Table nga_geometry_index does not exist'), false);
    }
    done();
  });
}

module.exports.verifyFeatureTileLink = function(geopackage, done) {
  geopackage.getDatabase().get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['nga_feature_tile_link'], function(err, results) {
    if(!results) {
      return done(new Error('Table nga_feature_tile_link does not exist'), false);
    }
    done();
  });
}

module.exports.verifyTableExists = function(geopackage, table, done) {
  geopackage.getDatabase().get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", [table], function(err, results) {
    if(!results) {
      return done(new Error('Table ' + table + ' does not exist'), false);
    }
    done();
  });
}

var GeoPackageConnection = require('../../../lib/db/geoPackageConnection')
  , GeoPackage = require('../../../lib/geoPackage')
  , TableCreator = require('../../../lib/db/tableCreator')
  , TileTable = require('../../../lib/tiles/user/tileTable')
  , TileDao = require('../../../lib/tiles/user/tileDao')
  , should = require('chai').should()
  , path = require('path')
  , async = require('async')
  , fs = require('fs');

describe.only('TableCreator tests', function() {

  var testGeoPackage = path.join('/tmp', 'test.gpkg');
  var geopackage;

  beforeEach(function(done) {
    fs.unlink(testGeoPackage, function() {
      fs.closeSync(fs.openSync(testGeoPackage, 'w'));
      GeoPackageConnection.connect(testGeoPackage, function(err, connection) {
        geopackage = new GeoPackage(path.basename(testGeoPackage), testGeoPackage, connection);
        done();
      });
    });
  });

  function verifySRS(done) {
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

  it('should create the spatial reference system table', function(done) {
    var tc = new TableCreator(geopackage);
    tc.createSpatialReferenceSystem(function(err, result) {
      should.not.exist(err);
      verifySRS(done);
    });
  });

  function verifyContents(done) {
    geopackage.getDatabase().get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['gpkg_contents'], function(err, results) {
      if(!results) {
        return done(new Error('Table gpkg_contents does not exist'), false);
      }
      done();
    });
  }

  it('should create the contents table', function(done) {
    var tc = new TableCreator(geopackage);
    tc.createContents(function(err, result) {
      should.not.exist(err);
      verifyContents(done);
    });
  });

  function verifyGeometryColumns(done) {
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

  it('should create the geometry columns table', function(done) {
    var tc = new TableCreator(geopackage);
    tc.createGeometryColumns(function(err, result) {
      should.not.exist(err);
      verifyGeometryColumns(done);
    });
  });

  function verifyTileMatrixSet(done) {
    geopackage.getDatabase().get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['gpkg_tile_matrix_set'], function(err, results) {
      if(!results) {
        return done(new Error('Table gpkg_tile_matrix_set does not exist'), false);
      }
      done();
    });
  }

  it('should create the tile matrix set table', function(done) {
    var tc = new TableCreator(geopackage);
    tc.createTileMatrixSet(function(err, result) {
      should.not.exist(err);
      verifyTileMatrixSet(done);
    });
  });

  function verifyTileMatrix(done) {
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

  it('should create the tile matrix table', function(done) {
    var tc = new TableCreator(geopackage);
    tc.createTileMatrix(function(err, result) {
      should.not.exist(err);
      verifyTileMatrix(done);
    });
  });

  function verifyDataColumns(done) {
    geopackage.getDatabase().get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['gpkg_data_columns'], function(err, results) {
      if(!results) {
        return done(new Error('Table gpkg_data_columns does not exist'), false);
      }
      done();
    });
  }

  it('should create the data columns table', function(done) {
    var tc = new TableCreator(geopackage);
    tc.createDataColumns(function(err, result) {
      should.not.exist(err);
      verifyDataColumns(done);
    });
  });

  function verifyDataColumnConstraints(done) {
    geopackage.getDatabase().get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['gpkg_data_column_constraints'], function(err, results) {
      if(!results) {
        return done(new Error('Table gpkg_data_column_constraints does not exist'), false);
      }
      done();
    });
  }

  it('should create the data column constraints table', function(done) {
    var tc = new TableCreator(geopackage);
    tc.createDataColumnConstraints(function(err, result) {
      should.not.exist(err);
      verifyDataColumnConstraints(done);
    });
  });

  function verifyMetadata(done) {
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

  it('should create the metadata table', function(done) {
    var tc = new TableCreator(geopackage);
    tc.createMetadata(function(err, result) {
      should.not.exist(err);
      verifyMetadata(done);
    });
  });

  function verifyMeatadataReference(done) {
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

  it('should create the metadata reference', function(done) {
    var tc = new TableCreator(geopackage);
    tc.createMetadataReference(function(err, result) {
      should.not.exist(err);
      verifyMeatadataReference(done);
    });
  });

  function verifyExtensions(done) {
    geopackage.getDatabase().get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['gpkg_extensions'], function(err, results) {
      if(!results) {
        return done(new Error('Table gpkg_extensions does not exist'), false);
      }
      done();
    });
  }

  it('should create the extensions table', function(done) {
    var tc = new TableCreator(geopackage);
    tc.createExtensions(function(err, result) {
      should.not.exist(err);
      verifyExtensions(done);
    });
  });

  function verifyTableIndex(done) {
    geopackage.getDatabase().get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['nga_table_index'], function(err, results) {
      if(!results) {
        return done(new Error('Table nga_table_index does not exist'), false);
      }
      done();
    });
  }

  it('should create the table index table', function(done) {
    var tc = new TableCreator(geopackage);
    tc.createTableIndex(function(err, result) {
      should.not.exist(err);
      verifyTableIndex(done);
    });
  });

  function verifyGeometryIndex(done) {
    geopackage.getDatabase().get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['nga_geometry_index'], function(err, results) {
      if(!results) {
        return done(new Error('Table nga_geometry_index does not exist'), false);
      }
      done();
    });
  }

  it('should create the geometry index table', function(done) {
    var tc = new TableCreator(geopackage);
    tc.createGeometryIndex(function(err, result) {
      should.not.exist(err);
      verifyGeometryIndex(done);
    });
  });

  function verifyFeatureTileLink(done) {
    geopackage.getDatabase().get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['nga_feature_tile_link'], function(err, results) {
      if(!results) {
        return done(new Error('Table nga_feature_tile_link does not exist'), false);
      }
      done();
    });
  }

  it('should create the feature tile link table', function(done) {
    var tc = new TableCreator(geopackage);
    tc.createFeatureTileLink(function(err, result) {
      should.not.exist(err);
      verifyFeatureTileLink(done);
    });
  });

  it('should create the required tables', function(done) {
    var tc = new TableCreator(geopackage);
    tc.createRequired(function(err, result) {
      async.series([
        verifyContents,
        verifySRS,
        function(callback) {
          geopackage.getDatabase().count('gpkg_spatial_ref_sys', function(err, count) {
            count.should.be.equal(3);
            callback();
          });
        }
      ], function() {
        done();
      });
    });
  });

  function verifyTableExists(table, done) {
    geopackage.getDatabase().get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", [table], function(err, results) {
      if(!results) {
        return done(new Error('Table ' + table + ' does not exist'), false);
      }
      done();
    });
  }

  it('should create a user table', function(done) {
    var columns = TileTable.createRequiredColumns();
    var tileTable = new TileTable('test_tiles', columns);
    var tc = new TableCreator(geopackage);
    tc.createUserTable(tileTable, function(err, result) {
      verifyTableExists('test_tiles', done);
    });
  });

});

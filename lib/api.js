/**
 * GeoPackage module.
 * @module GeoPackage
 */

var wkx = require('wkx')
  , reproject = require('reproject')
  , path = require('path')
  , fs = require('fs')
  , geojsonvt = require('geojson-vt')
  , vtpbf = require('vt-pbf')
  , Pbf = require('pbf')
  , VectorTile = require('@mapbox/vector-tile');

var GeoPackage = require('./geoPackage')
  , GeoPackageValidate = require('./validate/geoPackageValidate')
  , GeoPackageTileRetriever = require('./tiles/retriever')
  , GeoPackageConnection = require('./db/geoPackageConnection')
  , BoundingBox = require('./boundingBox')
  , GeometryData = require('./geom/geometryData')
  , TableCreator = require('./db/tableCreator')
  , TileBoundingBoxUtils = require('./tiles/tileBoundingBoxUtils')
  , FeatureTile = require('./tiles/features')
  , FeatureTableIndex = require('./extension/index/featureTableIndex')
  , DataColumnsDao = require('./dataColumns').DataColumnsDao
  , DataColumns = require('./dataColumns').DataColumns
  , DataTypes = require('./db/dataTypes')
  , GeometryColumns = require('./features/columns').GeometryColumns
  , FeatureColumn = require('./features/user/featureColumn')
  , RelationType = require('./extension/relatedTables/relationType')
  , MediaTable = require('./extension/relatedTables/mediaTable')
  , SimpleAttributesTable = require('./extension/relatedTables/simpleAttributesTable')
  , UserColumn = require('./user/userColumn');

/**
 * GeoPackageAPI
 * @constructor
 */
function GeoPackageAPI() {
}

module.exports = GeoPackageAPI;

/**
 * Open a GeoPackage at the path specified
 * @param  {String}   gppathOrByteArray   path where the GeoPackage exists or Uint8Array of GeoPackage bytes
 * @param  {Function} callback optional called with an error and the GeoPackage object if opened
 * @return {Promise} promise that will resolve with the open geoPackage object
 */
GeoPackageAPI.open = function(gppathOrByteArray, callback) {
  return new Promise(function(resolve, reject) {
    var valid = (typeof gppathOrByteArray !== 'string') || (typeof gppathOrByteArray === 'string' && !GeoPackageValidate.validateGeoPackageExtension(gppathOrByteArray));

    if (!valid) {
      reject(new Error('Invalid GeoPackage - Invalid GeoPackage Extension'));
    } else {
      resolve(gppathOrByteArray);
    }
  }).then(function() {
    return GeoPackageConnection.connect(gppathOrByteArray);
  }).then(function(connection) {
    if (gppathOrByteArray && typeof gppathOrByteArray === 'string') {
      return new GeoPackage(path.basename(gppathOrByteArray), gppathOrByteArray, connection);
    } else {
      return new GeoPackage('geopackage', undefined, connection);
    }
  })
  .then(function(geoPackage) {
    if (GeoPackageValidate.hasMinimumTables(geoPackage)) {
      return geoPackage;
    } else {
      throw new Error('Invalid GeoPackage - GeoPackage does not have the minimum required tables');
    }
  })
  .then(function(geoPackage) {
    if(callback) callback(null, geoPackage);
    return geoPackage;
  })
  .catch(function(error){
    if(callback) {
      callback(error);
    } else {
      return error;
    }
  });
};

/**
 * Creates a GeoPackage file at the path specified in node or opens an in memory GeoPackage on the browser
 * @param  {String}   gppath   path to GeoPackage fileType
 * @param  {Function} callback called with an error if one occurred and the open GeoPackage object
 * @return {Promise} promise that will resolve with the open geoPackage object
 */
GeoPackageAPI.create = function(gppath, callback) {
  if (typeof gppath == 'function') {
    callback = gppath;
    gppath = undefined;
  }
  var valid = (typeof gppath !== 'string') || (typeof gppath === 'string' && !GeoPackageValidate.validateGeoPackageExtension(gppath));
  if (!valid) {
    if (callback) {
      return callback(new Error('Invalid GeoPackage'));
    }
    return Promise.reject(new Error('Invalid GeoPackage'));
  }

  var promise = new Promise(function(resolve, reject) {
    if (typeof(process) !== 'undefined' && process.version && gppath) {
      fs.mkdirSync(path.dirname(gppath));
    }
    resolve(gppath);
  })
  .catch(function(error) {
    // could not create directory, just move on
  })
  .then(function() {
    return GeoPackageConnection.connect(gppath);
  })
  .then(function(connection) {
    connection.setApplicationId();
    return connection;
  })
  .then(function(connection) {
    if (gppath) {
      return new GeoPackage(path.basename(gppath), gppath, connection);
    } else {
      return new GeoPackage('geopackage', undefined, connection);
    }
  })
  .then(function(geopackage) {
    return geopackage.createRequiredTables();
  })
  .then(function(geopackage) {
    return geopackage.createSupportedExtensions();
  })
  .then(function(geopackage) {
    if(callback) callback(null, geopackage);
    return geopackage;
  })
  .catch(function(error){
    if(callback) {
      callback(error);
    } else {
      return error;
    }
  });

  return promise;
};

GeoPackageAPI.createStandardWebMercatorTileTable = function(geopackage, tableName, contentsBoundingBox, contentsSrsId, tileMatrixSetBoundingBox, tileMatrixSetSrsId, minZoom, maxZoom) {
  return geopackage.createTileTableWithTableName(tableName, contentsBoundingBox, contentsSrsId, tileMatrixSetBoundingBox, tileMatrixSetSrsId)
  .then(function(tileMatrixSet) {
    geopackage.createStandardWebMercatorTileMatrix(tileMatrixSetBoundingBox, tileMatrixSet, minZoom, maxZoom)
    return tileMatrixSet;
  });
}

GeoPackageAPI.createFeatureTable = function(geopackage, tableName, geometryColumn, featureColumns) {
  return GeoPackageAPI.createFeatureTableWithDataColumns(geopackage, tableName, geometryColumn, featureColumns, null);
};

GeoPackageAPI.createFeatureTableWithDataColumns = function(geopackage, tableName, geometryColumn, featureColumns, dataColumns) {
  var boundingBox = new BoundingBox(-180, 180, -90, 90);
  return GeoPackageAPI.createFeatureTableWithDataColumnsAndBoundingBox(geopackage, tableName, geometryColumn, featureColumns, dataColumns, boundingBox, 4326);
};

GeoPackageAPI.createFeatureTableWithDataColumnsAndBoundingBox = function(geopackage, tableName, geometryColumn, featureColumns, dataColumns, boundingBox, boundingBoxSrsId) {
  return geopackage.createFeatureTableWithGeometryColumnsAndDataColumns(geometryColumn, boundingBox, boundingBoxSrsId, featureColumns, dataColumns)
  .then(function() {
    return geopackage.getFeatureDao(tableName);
  });
};

/**
 * Create a feature table with the properties specified.
 * @param {module:geoPackage~GeoPackage} geopackage the geopackage object
 * @param {Object[]} properties properties to create columns from
 * @param {string} properties.name name of the column
 * @param {string} properties.dataType name of the data type
 * @return {Promise}
 */
GeoPackageAPI.createFeatureTableWithProperties = function(geopackage, tableName, properties) {
  var geometryColumns = new GeometryColumns();
  geometryColumns.table_name = tableName;
  geometryColumns.column_name = 'geometry';
  geometryColumns.geometry_type_name = 'GEOMETRY';
  geometryColumns.z = 0;
  geometryColumns.m = 0;

  var boundingBox = new BoundingBox(-180, 180, -80, 80);

  var columns = [];
  var columnNumber = 0;
  columns.push(FeatureColumn.createPrimaryKeyColumnWithIndexAndName(columnNumber++, 'id'));
  columns.push(FeatureColumn.createGeometryColumn(columnNumber++, 'geometry', 'GEOMETRY', false, null));

  for (var i = 0; i < properties.length; i++) {
    var property = properties[i];
    columns.push(FeatureColumn.createColumnWithIndex(columnNumber++, property.name, DataTypes.fromName(property.dataType)));
  }

  return geopackage.createFeatureTableWithGeometryColumns(geometryColumns, boundingBox, 4326, columns);
};

/**
 * Create a feature table with the properties specified.
 * @param {module:geoPackage~GeoPackage} geopackage the geopackage object
 * @param {Object[]} properties properties to create columns from
 * @param {string} properties.name name of the column
 * @param {string} properties.dataType name of the data type
 * @return {Promise}
 */
GeoPackageAPI.createAttributeTableWithProperties = function(geopackage, tableName, properties) {
  var columns = [];
  var columnNumber = 0;
  columns.push(UserColumn.createPrimaryKeyColumnWithIndexAndName(columnNumber++, 'id'));

  var dataColumns = [];

  for (var i = 0; i < properties.length; i++) {
    var property = properties[i];
    columns.push(UserColumn.createColumnWithIndex(columnNumber++, property.name, DataTypes.fromName(property.dataType)));
    if (property.dataColumn) {
      var dc = new DataColumns();
      dc.table_name = property.dataColumn.table_name;
      dc.column_name = property.dataColumn.column_name;
      dc.name = property.dataColumn.name;
      dc.title = property.dataColumn.title;
      dc.description = property.dataColumn.description;
      dc.mime_type = property.dataColumn.mime_type;
      dc.constraint_name = property.dataColumn.constraint_name;
      dataColumns.push(dc);
    }
  }

  return geopackage.createAttributeTable(tableName, columns, dataColumns.length ? dataColumns : undefined);
};

GeoPackageAPI.addAttributeRow = function(geopackage, tableName, row) {
  var attributeDao = geopackage.getAttributeDaoWithTableName(tableName);
  var attributeRow = attributeDao.newRow(row);
  return attributeDao.create(attributeRow);
}

/**
 * Create a simple attributes table with the properties specified.
 * @param {module:geoPackage~GeoPackage} geopackage the geopackage object
 * @param {Object[]} properties properties to create columns from
 * @param {string} properties.name name of the column
 * @param {string} properties.dataType name of the data type
 * @return {Promise}
 */
GeoPackageAPI.createSimpleAttributesTableWithProperties = function(geopackage, tableName, properties) {
  var relatedTables = geopackage.getRelatedTablesExtension();
  var columns = [];
  var columnNumber = SimpleAttributesTable.numRequiredColumns();
  if (properties) {
    for (var i = 0; i < properties.length; i++) {
      var property = properties[i];
      columns.push(UserColumn.createColumnWithIndex(columnNumber++, property.name, DataTypes.fromName(property.dataType), true));
    }
  }
  var simpleAttributesTable = SimpleAttributesTable.create(tableName, columns);
  relatedTables.createRelatedTable(simpleAttributesTable);
  return relatedTables.getSimpleAttributesDao(simpleAttributesTable);
};

/**
 * Create a media table with the properties specified.  These properties are added to the required columns
 * @param {module:geoPackage~GeoPackage} geopackage the geopackage object
 * @param {Object[]} properties properties to create columns from
 * @param {string} properties.name name of the column
 * @param {string} properties.dataType name of the data type
 * @return {Promise}
 */
GeoPackageAPI.createMediaTableWithProperties = function(geopackage, tableName, properties) {
  var relatedTables = geopackage.getRelatedTablesExtension();
  var columns = [];
  var columnNumber = MediaTable.numRequiredColumns();
  if (properties) {
    for (var i = 0; i < properties.length; i++) {
      var property = properties[i];
      columns.push(UserColumn.createColumnWithIndex(columnNumber++, property.name, DataTypes.fromName(property.dataType)));
    }
  }
  var mediaTable = MediaTable.create(tableName, columns)
  relatedTables.createRelatedTable(mediaTable);
  return relatedTables.getMediaDao(mediaTable);
};

GeoPackageAPI.addMedia = function(geopackage, tableName, dataBuffer, contentType, additionalProperties) {
  var relatedTables = geopackage.getRelatedTablesExtension();
  var mediaDao = relatedTables.getMediaDao(tableName);
  var row = mediaDao.newRow();
  row.setContentType(contentType);
  row.setData(dataBuffer);
  for (var key in additionalProperties) {
    row.setValueWithColumnName(key, additionalProperties[key]);
  }
  return mediaDao.create(row);
}

GeoPackageAPI.linkMedia = function(geopackage, baseTableName, baseId, mediaTableName, mediaId) {
  var relatedTables = geopackage.getRelatedTablesExtension();
  return relatedTables.linkRelatedIds(baseTableName, baseId, mediaTableName, mediaId, RelationType.MEDIA);
}

GeoPackageAPI.getLinkedMedia = function(geopackage, baseTableName, baseId) {
  var relationships = GeoPackageAPI.getRelatedRows(geopackage, baseTableName, baseId);
  var mediaRelationships = [];
  for (var i = 0; i < relationships.length; i++) {
    var relationship = relationships[i];
    if (relationship.relation_name === RelationType.MEDIA.name) {
      for (var r = 0; r < relationship.mappingRows.length; r++) {
        var row = relationship.mappingRows[r].row;
        mediaRelationships.push(row);
      }
    }
  }

  return mediaRelationships;
}

GeoPackageAPI.getRelatedRows = function(geopackage, baseTableName, baseId) {
  return geopackage.getRelatedTablesExtension().getRelatedRows(baseTableName, baseId);
}

/**
 * Adds a GeoJSON feature to the GeoPackage
 * @param  {GeoPackage}   geopackage open GeoPackage object
 * @param  {object}   feature    GeoJSON feature to add
 * @param  {String}   tableName  Table name to add the tile to
 */
GeoPackageAPI.addGeoJSONFeatureToGeoPackage = function(geopackage, feature, tableName) {
  var featureDao = geopackage.getFeatureDao(tableName);
  var srs = featureDao.getSrs();
  var featureRow = featureDao.newRow();
  var geometryData = new GeometryData();
  geometryData.setSrsId(srs.srs_id);
  var srs = featureDao.getSrs();
  if (!(srs.organization === 'EPSG' && srs.organization_coordsys_id === 4326)) {
    feature = reproject.reproject(feature, 'EPSG:4326', featureDao.projection);
  }

  var featureGeometry = typeof feature.geometry === 'string' ? JSON.parse(feature.geometry) : feature.geometry;
  var geometry = wkx.Geometry.parseGeoJSON(featureGeometry);
  geometryData.setGeometry(geometry);
  featureRow.setGeometry(geometryData);
  for (var propertyKey in feature.properties) {
    if (feature.properties.hasOwnProperty(propertyKey)) {
      featureRow.setValueWithColumnName(propertyKey, feature.properties[propertyKey]);
    }
  }

  return featureDao.create(featureRow);
};

/**
 * Adds a GeoJSON feature to the GeoPackage and updates the FeatureTableIndex extension if it exists
 * @param  {GeoPackage}   geopackage open GeoPackage object
 * @param  {object}   feature    GeoJSON feature to add
 * @param  {String}   tableName  Table name to add the tile to
 */
GeoPackageAPI.addGeoJSONFeatureToGeoPackageAndIndex = function(geopackage, feature, tableName) {
  var featureDao = geopackage.getFeatureDao(tableName);
  if (!featureDao) throw new Error('No feature Dao for table ', + tableName);
  var srs = featureDao.getSrs();
  var featureRow = featureDao.newRow();
  var geometryData = new GeometryData();
  geometryData.setSrsId(srs.srs_id);

  var reprojectedFeature = reproject.reproject(feature, 'EPSG:4326', featureDao.projection);

  var featureGeometry = typeof reprojectedFeature.geometry === 'string' ? JSON.parse(reprojectedFeature.geometry) : reprojectedFeature.geometry;
  var geometry = wkx.Geometry.parseGeoJSON(featureGeometry);
  geometryData.setGeometry(geometry);
  featureRow.setGeometry(geometryData);
  for (var propertyKey in feature.properties) {
    if (feature.properties.hasOwnProperty(propertyKey)) {
      featureRow.setValueWithColumnName(propertyKey, feature.properties[propertyKey]);
    }
  }

  var id = featureDao.create(featureRow);
  var fti = featureDao.featureTableIndex;
  var tableIndex = fti.getTableIndex();
  if (!tableIndex) return id;
  fti.indexRow(tableIndex, id, geometryData);
  fti.updateLastIndexed(tableIndex);
  return id;
};

/**
 * Queries for GeoJSON features in a feature tables
 * @param  {String}   geoPackagePath  path to the GeoPackage file
 * @param  {String}   tableName   Table name to query
 * @param  {BoundingBox}   boundingBox BoundingBox to query
 * @param  {Function} callback    Caled with err, featureArray
 */
GeoPackageAPI.queryForGeoJSONFeaturesInTableFromPath = function(geoPackagePath, tableName, boundingBox) {
  return GeoPackageAPI.open(geoPackagePath)
  .then(function(geoPackage) {
    var features = geoPackage.queryForGeoJSONFeaturesInTable(tableName, boundingBox);
    geoPackage.close();
    return features;
  });
}

/**
 * Queries for GeoJSON features in a feature tables
 * @param  {GeoPackage}   geoPackage  open GeoPackage object
 * @param  {String}   tableName   Table name to query
 * @param  {BoundingBox}   boundingBox BoundingBox to query
 * @param  {Function} callback    Caled with err, featureArray
 */
GeoPackageAPI.queryForGeoJSONFeaturesInTable = function(geoPackage, tableName, boundingBox) {
  return geoPackage.queryForGeoJSONFeaturesInTable(tableName, boundingBox);
}

/**
 * Iterates GeoJSON features in a feature table that matches the bounding box
 * @param  {GeoPackage}   geoPackage  open GeoPackage object
 * @param  {String}   tableName   Table name to query
 * @param  {BoundingBox}   boundingBox BoundingBox to query
 * @param  {Function} rowCallback    Caled with err, and GeoJSON feature
 * @param  {Function} doneCallback    Caled with err if one occurred
 */
GeoPackageAPI.iterateGeoJSONFeaturesInTableWithinBoundingBox = function(geoPackage, tableName, boundingBox) {
  return geoPackage.iterateGeoJSONFeaturesInTableWithinBoundingBox(tableName, boundingBox);
}


/**
 * Iterates GeoJSON features in a feature table that matches the bounding box
 * @param  {String}   geoPackagePath  path to the GeoPackage file
 * @param  {String}   tableName   Table name to query
 * @param  {BoundingBox}   boundingBox BoundingBox to query
 * @param  {Function} rowCallback    Caled with err, and GeoJSON feature
 * @param  {Function} doneCallback    Caled with err if one occurred
 */
GeoPackageAPI.iterateGeoJSONFeaturesFromPathInTableWithinBoundingBox = function(geoPackagePath, tableName, boundingBox) {
  return GeoPackageAPI.open(geoPackagePath)
  .then(function(geoPackage) {
    return geoPackage.iterateGeoJSONFeaturesInTableWithinBoundingBox(tableName, boundingBox);
  });
}

GeoPackageAPI.createDataColumnMap = function(featureDao) {
  var columnMap = {};
  var dcd = new DataColumnsDao(featureDao.geoPackage);
  featureDao.table.columns.forEach(function(column) {
    var dataColumn = dcd.getDataColumns(featureDao.table.table_name, column.name);
    columnMap[column.name] = {
      index: column.index,
      name: column.name,
      max: column.max,
      min: column.min,
      notNull: column.notNull,
      primaryKey: column.primaryKey,
      dataType: column.dataType ? DataTypes.name(column.dataType) : '',
      displayName: dataColumn && dataColumn.name ? dataColumn.name : column.name,
      dataColumn: dataColumn
    };
  }.bind(this));
  return columnMap;
}

/**
 * Iterate GeoJSON features from table
 * @param  {GeoPackage} geopackage      open GeoPackage object
 * @param  {String} table           Table name to Iterate
 * @return {Iterator<module:user/feature/featureRow~FeatureRow>}
 */
GeoPackageAPI.iterateGeoJSONFeaturesFromTable = function(geopackage, table) {
  var featureDao = geopackage.getFeatureDao(table);
  if (!featureDao) {
    throw new Error('No Table exists with the name ' + table);
  }

  var columnMap = GeoPackageAPI.createDataColumnMap(featureDao);

  var srs = featureDao.getSrs();

  var iterator = featureDao.queryForEach();

  return {
    srs: srs,
    featureDao: featureDao,
    results: {
      [Symbol.iterator]() {
        return this;
      },
      next: function() {
        var nextRow = iterator.next();
        if (!nextRow.done) {
          var featureRow;
          var geometry;

          while(!nextRow.done && !geometry) {
            featureRow = featureDao.getRow(nextRow.value);
            return {
              value: GeoPackageAPI.parseFeatureRowIntoGeoJSON(featureRow, srs, columnMap),
              done: false
            };
          }
        }
        return {
          done: true
        }
      }.bind(this)
    }
  };
};

/**
 * Gets a GeoJSON feature from the table by id
 * @param  {GeoPackage}   geopackage open GeoPackage object
 * @param  {String}   table      name of the table to get the feature from
 * @param  {Number}   featureId  ID of the feature
 * @param  {Function} callback   called with an error if one occurred and the GeoJSON feature
 */
GeoPackageAPI.getFeature = function(geopackage, table, featureId) {
  var srs;
  var featureDao = geopackage.getFeatureDao(table)
  srs = featureDao.getSrs();
  var feature = featureDao.queryForId(featureId);
  if (!feature) {
    var features = featureDao.queryForAllEq('_feature_id', featureId)
    if (features.length) {
      feature = featureDao.getRow(features[0]);
    } else {
      var features = featureDao.queryForAllEq('_properties_id', featureId)
      if (features.length) {
        feature = featureDao.getRow(features[0]);
      }
    }
  }
  if (feature) {
    return GeoPackageAPI.parseFeatureRowIntoGeoJSON(feature, srs);
  }
};

GeoPackageAPI.parseFeatureRowIntoGeoJSON = function(featureRow, srs, columnMap) {
  var geoJson = {
    type: 'Feature',
    properties: {}
  };
  var geometry = featureRow.getGeometry();
  if (geometry && geometry.geometry) {
    var geom = geometry.geometry;
    var geoJsonGeom = geometry.geometry.toGeoJSON();
    if (srs.definition && srs.definition !== 'undefined' && (srs.organization.toUpperCase() + ':' + srs.organization_coordsys_id) != 'EPSG:4326') {
      // geoJsonGeom = reproject.reproject(geoJsonGeom, srs.organization.toUpperCase() + ':' + srs.organization_coordsys_id, 'EPSG:4326');
      geoJsonGeom = reproject.reproject(geoJsonGeom, srs.getProjection(), 'EPSG:4326');

    }
    geoJson.geometry = geoJsonGeom;
  }

  for (var key in featureRow.values) {
    if(featureRow.values.hasOwnProperty(key) && key != featureRow.getGeometryColumn().name && key != 'id') {
      if (key.toLowerCase() == '_feature_id') {
        geoJson.id = featureRow.values[key];
      } else if (key.toLowerCase() == '_properties_id') {
        geoJson.properties[key.substring(12)] = featureRow.values[key];
      } else if (columnMap && columnMap[key]) {
        geoJson.properties[columnMap[key].displayName] = featureRow.values[key];
      } else {
        geoJson.properties[key] = featureRow.values[key];
      }
    } else if (featureRow.getGeometryColumn().name === key) {
      // geoJson.properties[key] = geometry && !geometry.geometryError ? 'Valid' : geometry.geometryError;
    }
  }
  geoJson.id = geoJson.id || featureRow.getId();
  return geoJson;
}


/**
 * Gets a tile from the specified table
 * @param  {GeoPackage}   geopackage open GeoPackage object
 * @param  {String}   table      name of the table to get the tile from
 * @param  {Number}   zoom       zoom level of the tile
 * @param  {Number}   tileRow    row of the tile
 * @param  {Number}   tileColumn column of the tile
 * @param  {Function} callback   called with an error if one occurred and the TileRow object
 */
GeoPackageAPI.getTileFromTable = function(geopackage, table, zoom, tileRow, tileColumn) {
  var tileDao = geopackage.getTileDao(table);
  return tileDao.queryForTile(tileColumn, tileRow, zoom);
};

/**
 * Gets the tiles in the EPSG:4326 bounding box
 * @param  {GeoPackage}   geopackage open GeoPackage object
 * @param  {String}   table      name of the tile table
 * @param  {Number}   zoom       Zoom of the tiles to query for
 * @param  {Number}   west       EPSG:4326 western boundary
 * @param  {Number}   east       EPSG:4326 eastern boundary
 * @param  {Number}   south      EPSG:4326 southern boundary
 * @param  {Number}   north      EPSG:4326 northern boundary
 * @param  {Function} callback   called with an error if one occurred and a tiles object describing the tiles
 */
GeoPackageAPI.getTilesInBoundingBox = function(geopackage, table, zoom, west, east, south, north) {
  var tiles = {};

  var tileDao = geopackage.getTileDao(table);
  if (zoom < tileDao.minZoom || zoom > tileDao.maxZoom) {
    return
  }
  tiles.columns = [];
  for (var i = 0; i < tileDao.table.columns.length; i++) {
    var column = tileDao.table.columns[i];
    tiles.columns.push({
      index: column.index,
      name: column.name,
      max: column.max,
      min: column.min,
      notNull: column.notNull,
      primaryKey: column.primaryKey
    });
  }
  var srs = tileDao.getSrs();
  tiles.srs = srs;
  tiles.tiles = [];

  var tms = tileDao.tileMatrixSet;
  var tm = tileDao.getTileMatrixWithZoomLevel(zoom);
  if (!tm) {
    return tiles;
  }
  var mapBoundingBox = new BoundingBox(Math.max(-180, west), Math.min(east, 180), south, north);
  tiles.west = Math.max(-180, west).toFixed(2);
  tiles.east = Math.min(east, 180).toFixed(2);
  tiles.south = south.toFixed(2);
  tiles.north = north.toFixed(2);
  tiles.zoom = zoom;
  mapBoundingBox = mapBoundingBox.projectBoundingBox('EPSG:4326', tileDao.srs.organization.toUpperCase() + ':' + tileDao.srs.organization_coordsys_id);

  var grid = TileBoundingBoxUtils.getTileGridWithTotalBoundingBox(tms.getBoundingBox(), tm.matrix_width, tm.matrix_height, mapBoundingBox);

  var iterator = tileDao.queryByTileGrid(grid, zoom);

  for (var row of iterator ) {
    var tile = {};
    tile.tableName = table;
    tile.id = row.getId();

    var tileBB = TileBoundingBoxUtils.getTileBoundingBox(tms.getBoundingBox(), tm, row.getTileColumn(), row.getRow());
    tile.minLongitude = tileBB.minLongitude;
    tile.maxLongitude = tileBB.maxLongitude;
    tile.minLatitude = tileBB.minLatitude;
    tile.maxLatitude = tileBB.maxLatitude;
    tile.projection = tileDao.srs.organization.toUpperCase() + ':' + tileDao.srs.organization_coordsys_id;
    tile.values = [];
    for (var i = 0; i < tiles.columns.length; i++) {
      var value = row.values[tiles.columns[i].name];
      if (tiles.columns[i].name === 'tile_data') {
        tile.values.push('data');
      } else
      if (value === null || value === 'null') {
        tile.values.push('');
      } else {
        tile.values.push(value.toString());
        tile[tiles.columns[i].name] = value;
      }
    }
    tiles.tiles.push(tile);
  }
  return tiles;
};

/**
 * Gets the tiles in the EPSG:4326 bounding box
 * @param  {GeoPackage}   geopackage open GeoPackage object
 * @param  {String}   table      name of the tile table
 * @param  {Number}   zoom       Zoom of the tiles to query for
 * @param  {Number}   west       EPSG:4326 western boundary
 * @param  {Number}   east       EPSG:4326 eastern boundary
 * @param  {Number}   south      EPSG:4326 southern boundary
 * @param  {Number}   north      EPSG:4326 northern boundary
 * @param  {Function} callback   called with an error if one occurred and a tiles object describing the tiles
 */
GeoPackageAPI.getTilesInBoundingBoxWebZoom = function(geopackage, table, webZoom, west, east, south, north) {
  var tiles = {};

  var tileDao = geopackage.getTileDao(table);
  if (webZoom < tileDao.minWebZoom || webZoom > tileDao.maxWebZoom) {
    return;
  }
  tiles.columns = [];
  for (var i = 0; i < tileDao.table.columns.length; i++) {
    var column = tileDao.table.columns[i];
    tiles.columns.push({
      index: column.index,
      name: column.name,
      max: column.max,
      min: column.min,
      notNull: column.notNull,
      primaryKey: column.primaryKey
    });
  }
  var srs = tileDao.getSrs();
  tiles.srs = srs;
  tiles.tiles = [];

  var zoom = tileDao.webZoomToGeoPackageZoom(webZoom);

  var tms = tileDao.tileMatrixSet;
  var tm = tileDao.getTileMatrixWithZoomLevel(zoom);
  if (!tm) {
    return tiles;
  }
  var mapBoundingBox = new BoundingBox(Math.max(-180, west), Math.min(east, 180), south, north);
  tiles.west = Math.max(-180, west).toFixed(2);
  tiles.east = Math.min(east, 180).toFixed(2);
  tiles.south = south.toFixed(2);
  tiles.north = north.toFixed(2);
  tiles.zoom = zoom;
  mapBoundingBox = mapBoundingBox.projectBoundingBox('EPSG:4326', tileDao.srs.organization.toUpperCase() + ':' + tileDao.srs.organization_coordsys_id);

  var grid = TileBoundingBoxUtils.getTileGridWithTotalBoundingBox(tms.getBoundingBox(), tm.matrix_width, tm.matrix_height, mapBoundingBox);

  var iterator = tileDao.queryByTileGrid(grid, zoom);
  for (var row of iterator) {
    var tile = {};
    tile.tableName = table;
    tile.id = row.getId();

    var tileBB = TileBoundingBoxUtils.getTileBoundingBox(tms.getBoundingBox(), tm, row.getTileColumn(), row.getRow());
    tile.minLongitude = tileBB.minLongitude;
    tile.maxLongitude = tileBB.maxLongitude;
    tile.minLatitude = tileBB.minLatitude;
    tile.maxLatitude = tileBB.maxLatitude;
    tile.projection = tileDao.srs.organization.toUpperCase() + ':' + tileDao.srs.organization_coordsys_id;
    tile.values = [];
    for (var i = 0; i < tiles.columns.length; i++) {
      var value = row.values[tiles.columns[i].name];
      if (tiles.columns[i].name === 'tile_data') {
        tile.values.push('data');
      } else
      if (value === null || value === 'null') {
        tile.values.push('');
      } else {
        tile.values.push(value.toString());
        tile[tiles.columns[i].name] = value;
      }
    }
    tiles.tiles.push(tile);
  }
  return tiles;
};

GeoPackageAPI.getFeatureTileFromXYZ = function(geopackage, table, x, y, z, width, height) {
  x = Number(x);
  y = Number(y);
  z = Number(z);
  width = Number(width);
  height = Number(height);
  var featureDao = geopackage.getFeatureDao(table)
  if (!featureDao) return;
  var ft = new FeatureTile(featureDao, width, height);
  return ft.drawTile(x, y, z);
}

/**
 * Gets the features in the EPSG:4326 bounding box
 * @param  {GeoPackage}   geopackage open GeoPackage object
 * @param  {String}   table      name of the feature table
 * @param  {Number}   west       EPSG:4326 western boundary
 * @param  {Number}   east       EPSG:4326 eastern boundary
 * @param  {Number}   south      EPSG:4326 southern boundary
 * @param  {Number}   north      EPSG:4326 northern boundary
 */
GeoPackageAPI.getGeoJSONFeaturesInTile = function(geopackage, table, x, y, z, skipVerification) {
  var webMercatorBoundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, z);
  var bb = webMercatorBoundingBox.projectBoundingBox('EPSG:3857', 'EPSG:4326');
  return geopackage.indexFeatureTable(table)
  .then(function(indexed) {
    return geopackage.getFeatureDao(table);
  })
  .then(function(featureDao) {
    if (!featureDao) return;
    var features = [];
    var iterator = featureDao.queryForGeoJSONIndexedFeaturesWithBoundingBox(bb, skipVerification);
    for (var feature of iterator) {
      features.push(feature);
    }
    return features;
  })
  .catch(function(error) {
    console.log('error', error);
  });
}

GeoPackageAPI.convertPBFToVectorTile = function(pbf) {
  return new VectorTile.VectorTile(new Pbf(pbf));
}

/**
 * Gets a mapbox VectorTile for the x y z web mercator tile specified
 * @param  {module:geoPackage~GeoPackage} geopackage open GeoPackage object
 * @param  {String} table      table name
 * @param  {Number} x          x tile
 * @param  {Number} y          y tile
 * @param  {Number} z          web zoom
 * @return {VectorTile}
 */
GeoPackageAPI.getVectorTile = function(geopackage, table, x, y, z) {
  return GeoPackageAPI.getVectorTileProtobuf(geopackage, table, x, y, z)
  .then(function(pbf) {
    return new VectorTile.VectorTile(new Pbf(pbf));
  });
}

/**
 * Gets a protobuf for the x y z web mercator tile specified
 * @param  {module:geoPackage~GeoPackage} geopackage open GeoPackage object
 * @param  {String} table      table name
 * @param  {Number} x          x tile
 * @param  {Number} y          y tile
 * @param  {Number} z          web zoom
 * @return {Protobuf}
 */
GeoPackageAPI.getVectorTileProtobuf = function(geopackage, table, x, y, z) {
  return GeoPackageAPI.getGeoJSONFeaturesInTile(geopackage, table, x, y, z, true)
  .then(function(features) {
    var featureCollection = {
      type: 'FeatureCollection',
      features: features
    };
    var tileBuffer = 8;
    var tileIndex = geojsonvt(featureCollection, {buffer: tileBuffer * 8, maxZoom: z});
    var layer = {};
    var tile = tileIndex.getTile(z, x, y);

    var gjvt = {};

    if (tile) {
      gjvt[table] = tile;
    } else {
      gjvt[table] = {features:[]};
    }

    return vtpbf.fromGeojsonVt(gjvt);
  });
}

/**
 * Gets the features in the EPSG:4326 bounding box
 * @param  {GeoPackage}   geopackage open GeoPackage object
 * @param  {String}   table      name of the feature table
 * @param  {Number}   west       EPSG:4326 western boundary
 * @param  {Number}   east       EPSG:4326 eastern boundary
 * @param  {Number}   south      EPSG:4326 southern boundary
 * @param  {Number}   north      EPSG:4326 northern boundary
 */
GeoPackageAPI.getFeaturesInBoundingBox = function(geopackage, table, west, east, south, north) {
  return geopackage.indexFeatureTable(table)
  .then(function(indexed) {
    var featureDao = geopackage.getFeatureDao(table);
    if (!featureDao) throw new Error('Unable to find table ' + table);
    var features = [];
    var bb = new BoundingBox(west, east, south, north);
    var iterator = featureDao.queryIndexedFeaturesWithBoundingBox(bb);
    return iterator;
  });
}

/**
 * Gets a tile image for an XYZ tile pyramid location
 * @param  {GeoPackage}   geopackage open GeoPackage object
 * @param  {String}   table      name of the table containing the tiles
 * @param  {Number}   x          x index of the tile
 * @param  {Number}   y          y index of the tile
 * @param  {Number}   z          zoom level of the tile
 * @param  {Number}   width      width of the resulting tile
 * @param  {Number}   height     height of the resulting tile
 * @return {Promise}
 */
GeoPackageAPI.getTileFromXYZ = function(geopackage, table, x, y, z, width, height) {
  x = Number(x);
  y = Number(y);
  z = Number(z);
  width = Number(width);
  height = Number(height);
  var tileDao = geopackage.getTileDao(table);
  var retriever = new GeoPackageTileRetriever(tileDao, width, height);
  return retriever.getTile(x, y, z);
};

/**
 * Draws an XYZ tile pyramid location into the provided canvas
 * @param  {GeoPackage}   geopackage open GeoPackage object
 * @param  {String}   table      name of the table containing the tiles
 * @param  {Number}   x          x index of the tile
 * @param  {Number}   y          y index of the tile
 * @param  {Number}   z          zoom level of the tile
 * @param  {Number}   width      width of the resulting tile
 * @param  {Number}   height     height of the resulting tile
 * @param  {Canvas}   canvas     canvas element to draw the tile into
 */
GeoPackageAPI.drawXYZTileInCanvas = function(geopackage, table, x, y, z, width, height, canvas) {
  x = Number(x);
  y = Number(y);
  z = Number(z);
  width = Number(width);
  height = Number(height);
  var tileDao = geopackage.getTileDao(table)
  var retriever = new GeoPackageTileRetriever(tileDao, width, height);
  return retriever.drawTileIn(x, y, z, canvas);
};

/**
 * Draws a tile specified by the bounds in EPSG:4326 into the canvas
 * @param  {GeoPackage}   geopackage open GeoPackage object
 * @param  {String}   table      name of the table containing the tiles
 * @param  {Number}   minLat     minimum latitude bounds of tile
 * @param  {Number}   minLon     minimum longitude bounds of tile
 * @param  {Number}   maxLat     maximum latitude bounds of tile
 * @param  {Number}   maxLon     maximum longitude bounds of tile
 * @param  {Number}   z          zoom level of the tile
 * @param  {Number}   width      width of the resulting tile
 * @param  {Number}   height     height of the resulting tile
 * @param  {Canvas}   canvas     canvas element to draw the tile into
 */
GeoPackageAPI.draw4326TileInCanvas = function(geopackage, table, minLat, minLon, maxLat, maxLon, z, width, height, canvas) {
  z = Number(z);
  width = Number(width);
  height = Number(height);
  var tileDao = geopackage.getTileDao(table);
  var retriever = new GeoPackageTileRetriever(tileDao, width, height);
  var bounds = new BoundingBox(minLon, maxLon, minLat, maxLat);
  return retriever.drawTileWithWgs84BoundsInProjection(bounds, z, 'EPSG:4326', canvas);
}

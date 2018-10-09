/**
 * featureDao module.
 * @module features/user/featureDao
 */

var UserDao = require('../../user/userDao')
  , GeometryColumnsDao = require('../columns').GeometryColumnsDao
  , ContentsDao = require('../../core/contents').ContentsDao
  , DataColumnsDao = require('../../dataColumns').DataColumnsDao
  , FeatureRow = require('./featureRow')
  , DataTypes = require('../../db/dataTypes')
  , FeatureTableIndex = require('../../extension/index/featureTableIndex');

var util = require('util')
  , reproject = require('reproject')
  , LineIntersect = require('@turf/line-intersect').default
  , Intersect = require('@turf/intersect').default
  , BooleanWithin = require('@turf/boolean-within').default;

/**
 * Feature DAO for reading feature user data tables
 * @class FeatureDao
 * @extends {module:user/userDao~UserDao}
 * @param  {sqlite3} db              database connection
 * @param  {FeatureTable} table           feature table
 * @param  {GeometryColumns} geometryColumns geometry columns
 * @param  {MetadataDb} metadataDb      metadata db
 */
var FeatureDao = function(geoPackage, table, geometryColumns, metadataDb) {
  UserDao.call(this, geoPackage, table);
  this.geometryColumns = geometryColumns;
  this.metadataDb = metadataDb;
  this.dataColumnsDao = new DataColumnsDao(geoPackage);
  this.featureTableIndex = new FeatureTableIndex(geoPackage, this);
  var dao = geoPackage.getGeometryColumnsDao();
  if (!dao.getContents(geometryColumns)) {
    throw new Error('Geometry Columns ' + dao.getId(geometryColumns) + ' has null Contents');
  }
  if (!dao.getSrs(geometryColumns)) {
    throw new Error('Geometry Columns ' + dao.getId(geometryColumns) + ' has null Spatial Reference System');
  }
  this.projection = dao.getProjection(geometryColumns);
}

util.inherits(FeatureDao, UserDao);

FeatureDao.prototype.createObject = function (results) {
  if (results) {
    return this.getRow(results);
  }
  return this.newRow();
};

FeatureDao.prototype.getContents = function() {
  var dao = this.geoPackage.getGeometryColumnsDao();
  return dao.getContents(this.geometryColumns);
}

/**
 * Get the feature table
 * @return {FeatureTable} the feature table
 */
FeatureDao.prototype.getFeatureTable = function () {
  return this.table;
};

/**
 * Create a new feature row with the column types and values
 * @param  {Array} columnTypes column types
 * @param  {Array} values      values
 * @return {FeatureRow}             feature row
 */
FeatureDao.prototype.newRowWithColumnTypes = function (columnTypes, values) {
  return new FeatureRow(this.getFeatureTable(), columnTypes, values);
};

/**
 * Create a new feature row
 * @return {FeatureRow} feature row
 */
FeatureDao.prototype.newRow = function () {
  return new FeatureRow(this.getFeatureTable());
};

/**
 * Get the geometry column name
 * @return {string} the geometry column name
 */
FeatureDao.prototype.getGeometryColumnName = function () {
  return this.geometryColumns.column_name;
};

/**
 * Get the geometry types
 * @return {WKBGeometryType} well known binary geometry type
 */
FeatureDao.prototype.getGeometryType = function () {
  return this.geometryColumns.getGeometryType();
};

FeatureDao.prototype.getSrs = function() {
  return this.geoPackage.getGeometryColumnsDao().getSrs(this.geometryColumns);
};

/**
 * Determine if the feature table is indexed
 * @param  {Function} callback called with err if one occurred and true or false indicating the indexed status
 */
FeatureDao.prototype.isIndexed = function() {
  return this.featureTableIndex.isIndexed();
}

FeatureDao.prototype.fastQueryWebMercatorBoundingBox = function(boundingBox, featureRowCallback) {
  var srs = this.getSrs();

  var iterator = this.featureTableIndex.queryWithBoundingBox(boundingBox, 'EPSG:3857');
  var thisgetRow = this.getRow.bind(this);

  return {
    [Symbol.iterator]() {
      return this;
    },
    next: function() {
      var nextRow = iterator.next();
      if (!nextRow.done) {
        var featureRow = thisgetRow(nextRow.value);

        return {
          value: featureRow,
          done: false
        };
      } else {
        return {
          done: true
        }
      }
    }
  }
}

FeatureDao.prototype.queryIndexedFeaturesWithWebMercatorBoundingBox = function(boundingBox) {
  var srs = this.getSrs();
  var projection = this.projection;

  var iterator = this.featureTableIndex.queryWithBoundingBox(boundingBox, 'EPSG:3857');
  var thisgetRow = this.getRow.bind(this);
  var projectedBoundingBox = boundingBox.projectBoundingBox('EPSG:3857', 'EPSG:4326');
  return {
    [Symbol.iterator]() {
      return this;
    },
    next: function() {
      var nextRow = iterator.next();
      if (!nextRow.done) {
        var featureRow;
        var geometry;

        while(!nextRow.done && !geometry) {
          featureRow = thisgetRow(nextRow.value);
          geometry = reprojectFeature(featureRow, srs, projection);
          geometry = verifyFeature(geometry, projectedBoundingBox);
          if (geometry) {
            geometry.properties = featureRow.values;
            return {
              value: featureRow,
              done: false
            };
          } else {
            nextRow = iterator.next();
          }
        }
      }
      return {
        done: true
      }
    }
  }
}

/**
 * Calls geoJSONFeatureCallback with the geoJSON of each matched feature (always in 4326 projection)
 * @param  {BoundingBox} boundingBox        4326 bounding box to query
 * @param  {function} geoJSONFeatureCallback called with err, geoJSON, doneCallback
 * @param  {function} doneCallback       called when all rows have been returned
 */
FeatureDao.prototype.queryForGeoJSONIndexedFeaturesWithBoundingBox = function(boundingBox, skipVerification) {

  var columns = [];
  var columnMap = {};

  var srs = this.getSrs();
  var projection = this.projection;
  this.table.columns.forEach(function(column) {
    var dataColumn = this.dataColumnsDao.getDataColumns(this.table.table_name, column.name);
    columns.push({
      index: column.index,
      name: column.name,
      max: column.max,
      min: column.min,
      notNull: column.notNull,
      primaryKey: column.primaryKey,
      dataType: column.dataType ? DataTypes.name(column.dataType) : '',
      displayName: dataColumn && dataColumn.name ? dataColumn.name : column.name,
      dataColumn: dataColumn
    });
    columnMap[column.name] = columns[columns.length-1];
  }.bind(this));

  var verifiedCount = 0;
  var iterator = this.featureTableIndex.queryWithBoundingBox(boundingBox, 'EPSG:4326')[Symbol.iterator]();
  var thisgetRow = this.getRow.bind(this);
  return {
    [Symbol.iterator]() {
      return this;
    },
    next: function() {
      var nextRow = iterator.next();
      if (!nextRow.done) {
        var featureRow;
        var geometry;

        while(!nextRow.done && !geometry) {
          featureRow = thisgetRow(nextRow.value);
          geometry = reprojectFeature(featureRow, srs, projection);
          if (!skipVerification) {
            geometry = verifyFeature(geometry, boundingBox);
          }
          if (geometry) {
            var geoJson = {
              properties: {},
              geometry: geometry
            };
            for (var key in featureRow.values) {
              if(featureRow.values.hasOwnProperty(key) && key != featureRow.getGeometryColumn().name && key != 'id') {
                if (key.toLowerCase() == '_feature_id') {
                  geoJson.id = featureRow.values[key];
                } else if (key.toLowerCase() == '_properties_id') {
                  geoJson.properties[key.substring(12)] = featureRow.values[key];
                } else {
                  geoJson.properties[columnMap[key].displayName] = featureRow.values[key];
                }
              }
            }
            geoJson.id = geoJson.id || featureRow.getId();
            return {
              value: geoJson,
              done: false
            };
          } else {
            nextRow = iterator.next();
          }
        }
      }
      return {
        done: true
      }
    }.bind(this)
  }
}

function reprojectFeature(featureRow, srs, projection) {
  var geometry = featureRow.getGeometry().toGeoJSON();
  if (srs.organization + ':' + srs.organization_coordsys_id != 'EPSG:4326') {
    geometry = reproject.reproject(geometry, projection, 'EPSG:4326');
  }
  return geometry;
}

function verifyFeature(geometry, boundingBox) {
  try {
    if (geometry.type == 'Point') {
      return geometry;
    } else if (geometry.type == 'LineString') {
      var intersect = LineIntersect(geometry, boundingBox.toGeoJSON().geometry);
      if (intersect.features.length) {
        return geometry;
      } else if (BooleanWithin(geometry, boundingBox.toGeoJSON().geometry)) {
        return geometry;
      }
    } else if (geometry.type == 'Polygon') {
      var polyIntersect = Intersect(geometry, boundingBox.toGeoJSON().geometry);
      if (polyIntersect) {
        return geometry;
      } else if (BooleanWithin(geometry, boundingBox.toGeoJSON().geometry)) {
        return geometry;
      }
    }
  } catch (e) {}
}

FeatureDao.prototype.queryIndexedFeaturesWithBoundingBox = function(boundingBox) {
  var srs = this.getSrs();
  var projection = this.projection;

  var iterator = this.featureTableIndex.queryWithBoundingBox(boundingBox, 'EPSG:4326');
  var thisgetRow = this.getRow.bind(this);
  return {
    [Symbol.iterator]() {
      return this;
    },
    next: function() {
      var nextRow = iterator.next();
      if (!nextRow.done) {
        var featureRow;
        var geometry;

        while(!nextRow.done && !geometry) {
          featureRow = thisgetRow(nextRow.value);
          geometry = reprojectFeature(featureRow, srs, projection);
          geometry = verifyFeature(geometry, boundingBox);
          if (geometry) {
            geometry.properties = featureRow.values;
            return {
              value: featureRow,
              done: false
            };
          } else {
            nextRow = iterator.next();
          }
        }
      }
      return {
        done: true
      }
    }.bind(this)
  }
}

FeatureDao.prototype.getBoundingBox = function () {
  return undefined;
  // TODO
  // GPKGGeometryColumnsDao * geometryColumnsDao = [self getGeometryColumnsDao];
  // GPKGContents * contents = [geometryColumnsDao getContents:self.geometryColumns];
  // GPKGContentsDao * contentsDao = [self getContentsDao];
  // GPKGProjection * contentsProjection = [contentsDao getProjection:contents];
  //
  // GPKGBoundingBox * boundingBox = [contents getBoundingBox];
  // if([self.projection.epsg compare:contentsProjection.epsg] != NSOrderedSame){
  //     GPKGProjectionTransform * transform = [[GPKGProjectionTransform alloc] initWithFromProjection:contentsProjection andToProjection:self.projection];
  //     boundingBox = [transform transformWithBoundingBox:boundingBox];
  // }
  //
  // return boundingBox;
};

module.exports = FeatureDao;

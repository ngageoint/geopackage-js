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
  , async = require('async')
  , reproject = require('reproject')
  , LineIntersect = require('@turf/line-intersect').default
  , Intersect = require('@turf/intersect').default
  , BooleanWithin = require('@turf/boolean-within').default
  , Polygon = require('@turf/helpers').polygon
  , MultiPolygon = require('@turf/helpers').multiPolygon
  , LineString = require('@turf/helpers').lineString
  , MultiLineString = require('@turf/helpers').multiLineString
  , proj4 = require('proj4');

proj4 = 'default' in proj4 ? proj4['default'] : proj4; // Module loading hack

var defs = require('../../proj4Defs');
for (var name in defs) {
  if (defs[name]) {
    proj4.defs(name, defs[name]);
  }
}

/**
 * Feature DAO for reading feature user data tables
 * @class FeatureDao
 * @extends {module:user/userDao~UserDao}
 * @param  {sqlite3} db              database connection
 * @param  {FeatureTable} table           feature table
 * @param  {GeometryColumns} geometryColumns geometry columns
 * @param  {MetadataDb} metadataDb      metadata db
 */
var FeatureDao = function(db, table, geometryColumns, metadataDb) {
  UserDao.call(this, db, table);
  this.geometryColumns = geometryColumns;
  this.metadataDb = metadataDb;
  this.dataColumnsDao = new DataColumnsDao(db);
  this.featureTableIndex = new FeatureTableIndex(this.connection, this);
  var dao = this.getGeometryColumnsDao();
  // TODO figure out how to async Initialize
  // if (!dao.getContents(geometryColumns)) {
  //   throw new Error('Geometry Columns ' + dao.getId(geometryColumns) + ' has null Contents');
  // }
  // if (!dao.getSrs(geometryColumns)) {
  //   throw new Error('Geometry Columns ' + dao.getId(geometryColumns) + ' has null Spatial Reference System');
  // }
  // this.projection = dao.getProjection(geometryColumns);
}

util.inherits(FeatureDao, UserDao);

FeatureDao.prototype.createObject = function (results) {
  if (results) {
    return this.getRow(results);
  }
  return this.newRow();
};

/**
 * Get the feature table
 * @return {FeatureTable} the feature table
 */
FeatureDao.prototype.getFeatureTable = function () {
  return this.table;
};

/**
 * Get the feature row for the current result in the result set
 * @param  {object} results results
 * @return {FeatureRow}         feature row
 */
FeatureDao.prototype.getFeatureRow = function (results) {
  return this.getRow(results);
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

/**
 * Get the Geometry Columns DAO
 * @return {GeometryColumnsDao} geometry columns dao
 */
FeatureDao.prototype.getGeometryColumnsDao = function () {
  return new GeometryColumnsDao(this.connection);
};

/**
 * Get the ContentsDao
 * @return {ContentsDao} contents dao
 */
FeatureDao.prototype.getContentsDao = function () {
  return new ContentsDao(this.connection);
};

FeatureDao.prototype.getSrs = function(callback) {
  this.getGeometryColumnsDao().getSrs(this.geometryColumns, callback);
};

/**
 * Determine if the feature table is indexed
 * @param  {Function} callback called with err if one occurred and true or false indicating the indexed status
 */
FeatureDao.prototype.isIndexed = function(callback) {
  return this.featureTableIndex.isIndexed(callback);
}

FeatureDao.prototype.fastQueryWebMercatorBoundingBox = function(boundingBox, featureRowCallback, doneCallback) {
  this.getSrs(function(err, srs) {
    this.featureTableIndex.queryWithBoundingBox(boundingBox, 'EPSG:3857', function(err, row, rowCallback) {
      var featureRow = this.getFeatureRow(row);
      featureRowCallback(err, featureRow, rowCallback);
    }.bind(this), doneCallback);
  }.bind(this));
}

FeatureDao.prototype.queryIndexedFeaturesWithWebMercatorBoundingBox = function(boundingBox, featureRowCallback, doneCallback) {
  this.getSrs(function(err, srs) {
    var projection = this.getProjection(srs);
    this.featureTableIndex.queryWithBoundingBox(boundingBox, 'EPSG:3857', function(err, row, rowCallback) {
      var featureRow = this.getFeatureRow(row);
      var geometry = verifyFeature(featureRow, srs, boundingBox.projectBoundingBox('EPSG:3857', 'EPSG:4326'), projection);
      if (geometry) {
        geometry.properties = featureRow.values;
        return featureRowCallback(err, featureRow, rowCallback);
      }
      rowCallback();
    }.bind(this), doneCallback);
  }.bind(this));
}

FeatureDao.prototype.getProjection = function(srs) {
  if(srs.organization_coordsys_id === 4326 && (srs.organization === 'EPSG' || srs.organization === 'epsg')) {
    return proj4('EPSG:4326');
  } else if (srs.definition && srs.definition !== '' && srs.definition !== 'undefined') {
      return proj4(srs.definition);
  } else if (srs.organization && srs.organization_coordsys_id) {
    return proj4(srs.organization.toUpperCase() + ':' + srs.organization_coordsys_id);
  } else {
    return {};
  }
}

/**
 * Calls geoJSONFeatureCallback with the geoJSON of each matched feature (always in 4326 projection)
 * @param  {BoundingBox} boundingBox        4326 bounding box to query
 * @param  {function} geoJSONFeatureCallback called with err, geoJSON, doneCallback
 * @param  {function} doneCallback       called when all rows have been returned
 */
FeatureDao.prototype.queryForGeoJSONIndexedFeaturesWithBoundingBox = function(boundingBox, geoJSONFeatureCallback, doneCallback) {

  var columns = [];
  var columnMap = {};
  async.eachSeries(this.table.columns, function(column, columnDone) {
    this.dataColumnsDao.getDataColumns(this.table.table_name, column.name, function(err, dataColumn) {
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
      columnDone();
    });
  }.bind(this), function(err) {
    this.getSrs(function(err, srs) {
      this.featureTableIndex.queryWithBoundingBox(boundingBox, 'EPSG:4326', function(err, row, rowCallback) {
        console.log('bounding box', boundingBox);
        // this row's geometry bounding box intersects with the bounding box we were querying for
        // now we need to determine if the actual feature is within the bounds
        var featureRow = this.getFeatureRow(row);
        var geometry = verifyFeature(featureRow, srs, boundingBox, this.getProjection(srs));
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
          return geoJSONFeatureCallback(err, geoJson, rowCallback);
        }
        rowCallback();
      }.bind(this), doneCallback);
    }.bind(this));
  }.bind(this));
}

function verifyFeature(featureRow, srs, boundingBox, projection) {

  var geometry = featureRow.getGeometry().toGeoJSON();
  if (srs.organization + ':' + srs.organization_coordsys_id != 'EPSG:4326') {
    try {
      geometry = reproject.reproject(geometry, projection, 'EPSG:4326');
    } catch (e) {
      console.log('e', e);
    }
  }

  var bbPolygon = Polygon(boundingBox.toGeoJSON().geometry.coordinates);
  try {
    if (geometry.type == 'Point') {
      return geometry;
    } else if (geometry.type == 'LineString') {
      var featureLine = LineString(geometry.coordinates);
      var intersect = LineIntersect(featureLine, bbPolygon);
      if (intersect.features.length) {
        return geometry;
      } else if (BooleanWithin(featureLine, bbPolygon)) {
        return geometry;
      }
    } else if (geometry.type == 'Polygon') {
      var featurePolygon = Polygon(geometry.coordinates);
      var testIntersect = Intersect(bbPolygon, featurePolygon);
      if (testIntersect) {
        return geometry;
      } else if (BooleanWithin(featurePolygon, bbPolygon)) {
        return geometry;
      }
    } else if (geometry.type == 'MultiLineString') {
      var multiLine = MultiLineString(geometry.coordinates);
      for (var i = 0; i < multiLine.geometry.coordinates.length; i++) {
        var line = LineString(multiLine.geometry.coordinates[i]);
        var intersect = LineIntersect(line, bbPolygon);
        if (intersect.features.length) {
          return geometry;
        } else if (BooleanWithin(line, bbPolygon)) {
          return geometry;
        }
      }
    } else if (geometry.type == 'MultiPolygon') {
      var multiPoly = MultiPolygon(geometry.coordinates);
      for (var i = 0; i < multiPoly.geometry.coordinates.length; i++) {
        var featurePolygon = Polygon(multiPoly.geometry.coordinates[i]);
        var testIntersect = Intersect(bbPolygon, featurePolygon);
        if (testIntersect) {
          return geometry;
        } else if (BooleanWithin(featurePolygon, bbPolygon)) {
          return geometry;
        }
      }
    }
  } catch (e) {
    console.log('Skipping geometry due to error:', e);
    return;
  }
}

FeatureDao.prototype.queryIndexedFeaturesWithBoundingBox = function(boundingBox, featureRowCallback, doneCallback) {
  this.getSrs(function(err, srs) {
    var projection = this.getProjection(srs)
    this.featureTableIndex.queryWithBoundingBox(boundingBox, 'EPSG:4326', function(err, row, rowCallback) {
      var featureRow = this.getFeatureRow(row);
      var geometry = verifyFeature(featureRow, srs, boundingBox, projection);
      if (geometry) {
        return featureRowCallback(err, featureRow, rowCallback);
      }
      rowCallback();
    }.bind(this), doneCallback);
  }.bind(this));
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

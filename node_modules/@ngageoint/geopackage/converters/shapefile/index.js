var GeoPackage = require('@ngageoint/geopackage');

var FeatureColumn = GeoPackage.FeatureColumn;
var GeometryColumns = GeoPackage.GeometryColumns;
var DataTypes = GeoPackage.DataTypes;
var BoundingBox = GeoPackage.BoundingBox;

var fs = require('fs')
  , path = require('path')
  , stream = require('stream')
  , shp = require('shp-stream')
  , shpwrite = require('shp-write')
  , proj4 = require('proj4')
  , reproject = require('reproject')
  , jszip = require('jszip');

proj4 = 'default' in proj4 ? proj4['default'] : proj4;

/**
 * Add a Shapefile to the GeoPackage
 * | option       | type    |  |
 * | ------------ | ------- | -------------- |
 * | `geopackage`     | varies  | This option can either be a string or a GeoPackage object.  If the option is a string it is interpreted as a path to a GeoPackage file.  If that file exists, it is opened.  If it does not exist, a new file is created and opened. |
 * | `shapezipData`   | Buffer  | Buffer with the data for a zip file containing a shapefile and it's associated files |
 * | `shapeData` | Buffer | Buffer with the data for a shapefile (.shp) |
 * | `shapefile` | String | Interpreted as a path to a .shp or .zip file |
 * | `dbfData` | String | Only used if the 'shapeData' parameter was provided.  Buffer with the data for a dbf file (.dbf) |
 * @param  {object} options          object describing the operation, see function description
 * @param  {Function} progressCallback called with an object describing the progress and a done function to be called when the handling of progress is completed
 */
module.exports.addLayer = function(options, progressCallback) {
  progressCallback = progressCallback || function() { return Promise.resolve(); };
  options.append = true;

  return setupConversion(options, progressCallback);
};

module.exports.convert = function(options, progressCallback) {
  progressCallback = progressCallback || function() { return Promise.resolve(); };

  options.append = false;

  return setupConversion(options, progressCallback);
};

module.exports.extract = function(geopackage, tableName, callback) {
  if (!tableName) {
    var tables = geopackage.getFeatureTables();
    return createShapefile(geopackage, tables);
  } else {
    return createShapefile(geopackage, tableName);
  }
};

function createShapefile(geopackage, tableName, callback) {
  var geoJson = {
    type: 'FeatureCollection',
    features: []
  };
  if (!(tableName instanceof Array)) {
    tableName = [tableName];
  }

  return tableName.reduce(function(sequence, name) {
    return sequence.then(function() {
      var iterator = GeoPackage.iterateGeoJSONFeaturesFromTable(geopackage, name);
      for (var feature of iterator.results) {
        geoJson.features.push(feature);
      }
    });
  }, Promise.resolve())
  .then(function() {
    return shpwrite.zip(geoJson);
  });
}

function determineTableName(preferredTableName, geopackage) {
  var name = preferredTableName;
  var tables = geopackage.getFeatureTables();
  var count = 1;
  while(tables.indexOf(name) !== -1) {
    name = name + '_' + count;
    count++;
  }
  return name;
}

function readRecord(builder) {
  return new Promise(function(resolve, reject) {
    setTimeout(function(){
      builder.reader.readRecord(function(err, r) {
        var feature = r;
        if (feature === shp.end) {
          return resolve(builder);
        }
        if (!feature) {
          return resolve(readRecord(builder));
        }
        builder.features.push(feature);
        for (var key in feature.properties) {
          if (!builder.properties[key]) {
            builder.properties[key] = builder.properties[key] || {
              name: key
            };

            var type = typeof feature.properties[key];
            if (feature.properties[key] !== undefined && feature.properties[key] !== null && type !== 'undefined') {
              if (type === 'object') {
                if (feature.properties[key] instanceof Date) {
                  type = 'Date';
                }
              }
              switch(type) {
                case 'Date':
                  type = 'DATETIME';
                  break;
                case 'number':
                  type = 'DOUBLE';
                  break;
                case 'string':
                  type = 'TEXT';
                  break;
                case 'boolean':
                  type = 'BOOLEAN';
                  break;
              }
              builder.properties[key] = {
                name: key,
                type: type
              };
            }
          }
        }
        return resolve(readRecord(builder));
      });
    });
  });
}

function determineFeatureTableColumns(builder) {
  var geometryColumns = new GeometryColumns();
  geometryColumns.table_name = builder.tableName;
  geometryColumns.column_name = 'geometry';
  geometryColumns.geometry_type_name = 'GEOMETRY';
  geometryColumns.z = 0;
  geometryColumns.m = 0;

  var columns = [];
  columns.push(FeatureColumn.createPrimaryKeyColumnWithIndexAndName(0, 'id'));
  columns.push(FeatureColumn.createGeometryColumn(1, 'geometry', 'GEOMETRY', false, null));
  var index = 2;
  for (var key in builder.properties) {
    var prop = builder.properties[key];
    if (prop.name.toLowerCase() !== 'id') {
      columns.push(FeatureColumn.createColumnWithIndex(index, prop.name, DataTypes.fromName(prop.type), false, null));
      index++;
    }
  }
  builder.columns = columns;
  builder.geometryColumns = geometryColumns;
  return builder;
}

function createFeatureTable(geopackage, builder) {
  var boundingBox = new BoundingBox(-180, 180, -90, 90);
  if (builder.projection && builder.bbox) {
    // bbox is xmin, ymin, xmax, ymax
    var ll = proj4(builder.projection).inverse([builder.bbox[0], builder.bbox[1]]);
    var ur = proj4(builder.projection).inverse([builder.bbox[2], builder.bbox[3]]);
    boundingBox = new BoundingBox(ll[0], ur[0], ll[1], ur[1]);
  }
  return GeoPackage.createFeatureTableWithDataColumnsAndBoundingBox(geopackage, builder.tableName, builder.geometryColumns, builder.columns, null, boundingBox, 4326)
  .then(function(featureDao) {
    builder.featureDao = featureDao;
    return builder;
  });
}

function addFeaturesToTable(geopackage, builder, progressCallback) {
  var count = 0;
  var featureCount = builder.features.length;
  var fivePercent = Math.floor(featureCount / 20);

  return builder.features.reduce(function(featureSequence, feature) {
    return featureSequence.then(function() {
      if (builder.projection) {
        feature = reproject.reproject(feature, builder.projection, 'EPSG:4326');
      }
      return GeoPackage.addGeoJSONFeatureToGeoPackage(geopackage, feature, builder.tableName)
      if (count++ % fivePercent === 0) {
        return progressCallback({
          status: 'Inserting features into table "' + builder.tableName + '"',
          completed: count,
          total: featureCount
        });
      }
    });
  }, Promise.resolve())
  .then(function() {
    return progressCallback({
      status: 'Done inserting features into table "' + builder.tableName + '"'
    });
  });
}

function convertShapefileReaders(readers, geopackage, progressCallback) {
  return readers.reduce(function(sequence, shapefile) {
    return sequence.then(function() {
      var builder = {
        tableName : shapefile.tableName,
        reader : shapefile.reader,
        projection : shapefile.projection,
        features : []
      };

      builder.tableName = determineTableName(builder.tableName, geopackage);
      return new Promise(function(resolve, reject) {
        shapefile.reader.readHeader(function(err, header) {
          builder.bbox = header ? header.bbox : undefined;
          resolve(builder);
        });
      })
      .then(function(builder) {
        return progressCallback({status: 'Reading Shapefile properties'})
        .then(function() {
          return builder;
        })
      })
      .then(function(builder) {
        builder.properties = {};
        return readRecord(builder);
      })
      .then(function(builder) {
        return builder;
      })
      .then(determineFeatureTableColumns)
      .then(function(builder) {
        return progressCallback({status: 'Creating table "' + builder.tableName + '"'})
        .then(function() {
          return createFeatureTable(geopackage, builder);
        });
      })
      .then(function(builder) {
        return addFeaturesToTable(geopackage, builder, progressCallback);
      })
      .then(function() {
        return new Promise(function(resolve, reject) {
          if (shapefile.reader) {
            shapefile.reader.close(resolve);
          } else {
            resolve();
          }
        });
      });
    });
  }, Promise.resolve())
  .then(function() {
    return geopackage;
  });
}

function getReadersFromZip(zip) {
  var readers = [];
  var shpfileArray = zip.filter(function (relativePath, file){
    return path.extname(relativePath) === '.shp' && relativePath.indexOf('__MACOSX') == -1;
  });
  var dbffileArray = zip.filter(function (relativePath, file){
    return path.extname(relativePath) === '.dbf' && relativePath.indexOf('__MACOSX') == -1;
  });
  var prjfileArray = zip.filter(function (relativePath, file){
    return path.extname(relativePath) === '.prj' && relativePath.indexOf('__MACOSX') == -1;
  });

  for (var i = 0; i < shpfileArray.length; i++) {
    var shapeZipObject = shpfileArray[i];
    var shpBuffer = shapeZipObject.asNodeBuffer();
    var shpStream = new stream.PassThrough();
    shpStream.end(shpBuffer);

    var basename = path.basename(shapeZipObject.name, path.extname(shapeZipObject.name));

    var dbfStream;

    for (var d = 0; d < dbffileArray.length; d++) {
      var dbfZipObject = dbffileArray[d];
      if (dbfZipObject.name == basename + '.dbf') {
        var dbfBuffer = dbfZipObject.asNodeBuffer();
        dbfStream = new stream.PassThrough();
        dbfStream.end(dbfBuffer);
        break;
      }
    }

    var projection;

    for (var p = 0; p < prjfileArray.length; p++) {
      var prjZipObject = prjfileArray[p];
      if (prjZipObject.name == basename + '.prj') {
        var prjBuffer = prjZipObject.asNodeBuffer();
        projection = proj4.Proj(prjBuffer.toString());
        break;
      }
    }
    readers.push({
      tableName: basename,
      projection: projection,
      reader: shp.reader({
        shp: shpStream,
        dbf: dbfStream,
        'ignore-properties': !!dbfStream
      })
    });
  }
  return readers;
}

function setupConversion(options, progressCallback) {
  var geopackage = options.geopackage;

  return Promise.resolve()
  .then(function() {
    if (options.shapezipData) {
      var zip = new jszip();
      zip.load(options.shapezipData);
      return getReadersFromZip(zip);
    } else if (options.shapeData) {
      var shpStream = new stream.PassThrough();
      var shpBuffer = new Buffer(options.shapeData);
      shpStream.end(shpBuffer);

      var dbfStream;
      if (options.dbfData) {
        dbfStream = new stream.PassThrough();
        var dbfBuffer = new Buffer(options.dbfData);
        dbfStream.end(dbfBuffer);
      }

      return [{
        tableName: 'features',
        reader: shp.reader({
          dbf: dbfStream,
          "ignore-properties": !!options.dbfData,
          shp: shpStream
        })
      }];
    } else {
      var extension = path.extname(options.shapefile);
      if (extension.toLowerCase() === '.zip') {
        return new Promise(function(resolve, reject) {
          fs.readFile(options.shapefile, function(err, data) {
            var zip = new jszip();
            zip.load(data);
            resolve(getReadersFromZip(zip));
          });
        });
      } else {
        dbf = path.basename(options.shapefile, path.extname(options.shapefile)) + '.dbf';
        try {
          var stats = fs.statSync(dbf);
          return [{
            tableName: path.basename(options.shapefile, path.extname(options.shapefile)),
            reader: shp.reader(options.shapefile)
          }];
        } catch (e) {
          return [{
            tableName: path.basename(options.shapefile, path.extname(options.shapefile)),
            reader: shp.reader(options.shapefile, {
              "ignore-properties": true
            })
          }];
        }
      }
    }
  })
  .then(function(readers) {
    return createOrOpenGeoPackage(geopackage, options, progressCallback)
    .then(function(geopackage) {
      return convertShapefileReaders(readers, geopackage, progressCallback);
    });
  });
};

function createOrOpenGeoPackage(geopackage, options, progressCallback) {
  return Promise.resolve()
  .then(function() {
    if (typeof geopackage === 'object') {
      return progressCallback({status: 'Opening GeoPackage'})
      .then(function() {
        return geopackage;
      });
    } else {
      try {
        var stats = fs.statSync(geopackage);
        if (!options.append) {
          console.log('GeoPackage file already exists, refusing to overwrite ' + geopackage);
          throw new Error('GeoPackage file already exists, refusing to overwrite ' + geopackage);
        } else {
          console.log('open geopackage');
          return GeoPackage.open(geopackage);
        }
      } catch (e) {}
      return progressCallback({status: 'Creating GeoPackage'})
      .then(function() {
        console.log('Create new geopackage', geopackage);
        return GeoPackage.create(geopackage);
      });
    }
  });
}

var path = require('path')
  , Canvas = require('../lib/canvas/canvas').Canvas
  , GeoPackage = require('../lib/geoPackage').GeoPackage
  , crypto = require('crypto')
  , ImageUtils = require('../lib/image/imageUtils').ImageUtils
  , CanvasCompare = require('canvas-compare')
  , GeoPackageManager = require('../').GeoPackageManager
  , isNode = typeof(process) !== 'undefined' && process.version
  , TestConstants = require('./testConstants')
  , SchemaExtension = require('../lib/extension/schema/schemaExtension').SchemaExtension
  , DataColumnConstraints = require('../lib/extension/schema/constraints/dataColumnConstraints').DataColumnConstraints
  , DataColumns = require('../lib/extension/schema/columns/dataColumns').DataColumns
  , ProjectionConstants = require('@ngageoint/projections-js').ProjectionConstants
  , FeatureColumn = require('../lib/features/user/featureColumn').FeatureColumn
  , FeatureTable = require('../lib/features/user/featureTable').FeatureTable
  , GeoPackageDataType = require('../lib/db/geoPackageDataType').GeoPackageDataType
  , TileTable = require('../lib/tiles/user/tileTable').TileTable
  , GeoPackageGeometryData = require('../lib/geom/geoPackageGeometryData').GeoPackageGeometryData
  , { GeometryType, UnsupportedOperationException, Point, LineString, Polygon } = require('@ngageoint/simple-features-js')
  , DateConverter = require('../lib/db/dateConverter').DateConverter;

var module = {
  exports: {},
};

if (isNode) {
  process.on('uncaughtException', function() {
    console.log('Caught exception');
  });
} else {
  window.onerror = function () {
    console.log('Caught exception');
  }
}

/**
 * Sample range data column constraint
 */
module.exports.SAMPLE_RANGE_CONSTRAINT = "sampleRange";

/**
 * Sample enum data column constraint
 */
module.exports.SAMPLE_ENUM_CONSTRAINT = "sampleEnum";

/**
 * Sample glob data column constraint
 */
module.exports.SAMPLE_GLOB_CONSTRAINT = "sampleGlob";

/**
 * Test integer column name
 */
module.exports.TEST_INTEGER_COLUMN = "test_integer";

module.exports.createTempName = function() {
  return 'gp_'+crypto.randomBytes(4).readUInt32LE(0)+'.gpkg';
};

module.exports.copyGeopackage = function(original) {
  var copy = path.join(__dirname, 'tmp', module.exports.createTempName());

  return new Promise(function(resolve, reject) {
    if (isNode) {
      var fs = require('fs-extra');
      fs.copy(original, copy, function(err) {
        resolve(copy);
      });
    } else {
      resolve(copy);
    }
  })
};

module.exports.createTmpGeoPackage = async function() {
  var tmpGpPath = path.join(__dirname, 'tmp', module.exports.createTempName());
  var geoPackage = await module.exports.createGeoPackage(tmpGpPath)
  return {
    geoPackage,
    path: tmpGpPath
  }
};

module.exports.createGeoPackage = async function(gppath) {
  if (isNode) {
    var fs = require('fs-extra');
    await fs.mkdirp(path.dirname(gppath));
    await fs.open(gppath, 'w');
    return GeoPackageManager.create(gppath)
  } else {
    return GeoPackageManager.create();
  }
};

/**
 * Creates
 * @param gppath
 * @returns {Promise<GeoPackage>}
 */
module.exports.createBareGeoPackage = async function(gppath) {
  if (isNode) {
    var fs = require('fs-extra');
    await fs.mkdirp(path.dirname(gppath))
    await fs.open(gppath, 'w');
    let connection = await GeoPackageManager.connect(gppath);
    return new GeoPackage(path.basename(gppath), gppath, connection);
  }
  else {
    let connection = await GeoPackageManager.connect();
    return new GeoPackage('geoPackage', undefined, connection);
  }
};

module.exports.deleteGeoPackage = async function(gppath) {
  if (isNode) {
    var fs = require('fs-extra');
    try {
      await fs.unlink(gppath);
    } catch (e) {}
  }
};

global.loadTile = module.exports.loadTile = async function(tilePath) {
  if (isNode) {
    var fs = require('fs-extra');
    return fs.readFile(tilePath);
  } else {
    return new Promise((resolve, reject) => {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', tilePath, true);
      xhr.responseType = 'arraybuffer';

      xhr.onload = function(e) {
        if (xhr.status !== 200) {
          return resolve();
        }
        return resolve(Buffer.from(this.response));
      };
      xhr.onerror = function(e) {
        reject(e);
      };
      xhr.send();
    });
  }
};

module.exports.diffImages = function(actualTile, expectedTilePath, callback) {
  module.exports.diffImagesWithDimensions(actualTile, expectedTilePath, 256, 256, callback);
};

module.exports.diffCanvas = async function(actualCanvas, expectedTilePath, callback) {
  if (isNode) {
    return ImageUtils.getImage(expectedTilePath).then(img => {
      var expectedCanvas = Canvas.create(256, 256);
      expectedCanvas.getContext('2d').drawImage(img.image, 0, 0);
      let same = actualCanvas.toDataURL() === expectedCanvas.toDataURL();
      Canvas.disposeCanvas(expectedCanvas);
      Canvas.disposeImage(img);
      if (callback) {
        callback(null, same);
      }
      return same;
    });
  } else {
    module.exports.loadTile(expectedTilePath, function(err, expectedTile) {
      var expectedBase64 = Buffer.from(expectedTile).toString('base64');
      CanvasCompare.setImageData(ImageData);
      CanvasCompare.canvasCompare({
        baseImageUrl: actualCanvas.toDataURL(),
        targetImageUrl: 'data:image/png;base64,' + expectedBase64
      })
        .then(function(result) {
          if (callback) {
            callback(null, true);
          }
          return true;
        })
        .catch(function(reason) {
          if (callback) {
            callback(null, false);
          }
          return false;
        });
    });
  }

};

module.exports.diffCanvasesContexts = function(actualCtx, expectedCtx, width, height) {
  var actualData = actualCtx.getImageData(0, 0, width, height);
  var expectedData = expectedCtx.getImageData(0, 0, width, height);
  if(actualData.data.length != expectedData.data.length)
    return false;
  for(var i = 0; i < actualData.data.length; ++i){
    if(actualData.data[i] != expectedData.data[i]) {
      return false;
    }
  }
  return true;
};

module.exports.diffImagesWithDimensions = function(actualTile, expectedTilePath, width, height, callback) {
  ImageUtils.getImage(actualTile).then(actualImage => {
    const actual = Canvas.create(width, height);
    let actualCtx = actual.getContext('2d');
    actualCtx.drawImage(actualImage.image, 0, 0);
    const actualDataUrl = actual.toDataURL();
    new Promise(resolve => {
      if (!isNode) {
        module.exports.loadTile(expectedTilePath).then(expectedTileFileData => {
          ImageUtils.getImage(Buffer.from(expectedTileFileData)).then(expectedImage => {
            resolve(expectedImage);
          });
        });
      } else {
        ImageUtils.getImage(expectedTilePath).then(expectedImage => {
          resolve(expectedImage);
        });
      }
    }).then(expectedImage => {
      const expected = Canvas.create(width, height);
      let expectedCtx = expected.getContext('2d');
      expectedCtx.drawImage(expectedImage.image, 0, 0);
      const expectedDataUrl = expected.toDataURL();
      const same = actualDataUrl === expectedDataUrl;
      if (!same) {
        console.log('actual');
        console.log(actualDataUrl);
        console.log('expected');
        console.log(expectedDataUrl);
      }

      // if web, let's show on browser page
      if (!isNode) {
        if (!same) {
          var h1Tags = document.getElementsByTagName('h1');
          var h2Tags = document.getElementsByTagName('li');
          var currentTag;
          if (h2Tags.length === 0) {
            currentTag = h1Tags.item(h1Tags.length - 1);
          } else {
            currentTag = h2Tags.item(h2Tags.length -1).parentNode;
          }
          var div = document.createElement('div');
          var span1 = document.createElement('span');
          span1.style.width = width + 'px';
          span1.style.display = 'inline-block';
          span1.innerHTML = 'Actual';
          var span2 = document.createElement('span');
          span2.style.width = width + 'px';
          span2.style.display = 'inline-block';
          span2.innerHTML = 'Expected';
          var span3 = document.createElement('span');
          span3.style.width = width + 'px';
          span3.style.display = 'inline-block';
          span3.innerHTML = 'Diff';

          div.appendChild(span1);
          div.appendChild(span2);
          div.appendChild(span3);
          currentTag.appendChild(div);
          currentTag.appendChild(actual);
          currentTag.appendChild(expected);

          CanvasCompare.setImageData(ImageData);
          CanvasCompare.canvasCompare({
            baseImageUrl: actual.toDataURL(),
            targetImageUrl: expected.toDataURL()
          })
            .then(function(result) {
              currentTag.appendChild(result.producePreview());
              callback(null, false);
            })
            .catch(function(reason) {
              console.error(reason);
              callback(null, false);
            });
        } else {
          callback(null, same);
        }
      } else if (isNode) {
        // cleanup
        actualCtx = null;
        Canvas.disposeCanvas(actual);
        Canvas.disposeImage(expectedImage);
        // cleanup
        expectedCtx = null;
        Canvas.disposeCanvas(expected);

        callback(null, same);
      }
    });
  });
};

/**
 * Create the feature table with data columns entry
 * @param geoPackage
 * @param contents
 * @param geometryColumn
 * @param geometryType
 * @return feature table
 * @throws SQLException
 */
module.exports.createFeatureTable = function(geoPackage, contents, geometryColumn, geometryType) {
  const table = module.exports.buildFeatureTable(contents.getTableName(), geometryColumn, geometryType);
  geoPackage.createFeatureTable(table);
  const random = Math.random();
  const dataColumnsDao = SchemaExtension.getDataColumnsDao(geoPackage);
  const dataColumns = new DataColumns();
  dataColumns.setTableName(contents.getId());
  dataColumns.setColumnName(module.exports.TEST_INTEGER_COLUMN);
  dataColumns.setName(contents.getTableName());
  dataColumns.setTitle("TEST_TITLE");
  dataColumns.setDescription("TEST_DESCRIPTION");
  dataColumns.setMimeType("TEST_MIME_TYPE");
  if (random < (1.0 / 3.0)) {
    dataColumns.setConstraintName(module.exports.SAMPLE_RANGE_CONSTRAINT);
  } else if (random < (2.0 / 3.0)) {
    dataColumns.setConstraintName(module.exports.SAMPLE_ENUM_CONSTRAINT);
  } else {
    dataColumns.setConstraintName(module.exports.SAMPLE_GLOB_CONSTRAINT);
  }
  dataColumnsDao.create(dataColumns);

  return table;
}

/**
 * Build an example feature table
 *
 * @param tableName
 * @param geometryColumn
 * @param geometryType
 * @return feature table
 */
module.exports.buildFeatureTable = function(tableName, geometryColumn, geometryType) {
  const columns = [];
  columns.push(FeatureColumn.createPrimaryKeyColumn(0, 'id'));
  columns.push(FeatureColumn.createColumn(7, "test_text_limited", GeoPackageDataType.TEXT, 5));
  columns.push(FeatureColumn.createColumn(8, "test_blob_limited", GeoPackageDataType.BLOB, 7));
  columns.push(FeatureColumn.createColumn(9, "test_date", GeoPackageDataType.DATE));
  columns.push(FeatureColumn.createColumn(10, "test_datetime", GeoPackageDataType.DATETIME));
  columns.push(FeatureColumn.createGeometryColumn(1, geometryColumn, geometryType));
  columns.push(FeatureColumn.createColumn(2, "test_text", GeoPackageDataType.TEXT, false, ""));
  columns.push(FeatureColumn.createColumn(3, "test_real", GeoPackageDataType.REAL));
  columns.push(FeatureColumn.createColumn(4, "test_boolean", GeoPackageDataType.BOOLEAN));
  columns.push(FeatureColumn.createColumn(5, "test_blob", GeoPackageDataType.BLOB));
  columns.push(FeatureColumn.createColumn(6, module.exports.TEST_INTEGER_COLUMN, GeoPackageDataType.INTEGER));
  return new FeatureTable(tableName, geometryColumn, columns);
}

/**
 * Build an example tile table
 *
 * @param tableName
 * @return tile table
 */
module.exports.buildTileTable = function(tableName) {
  const columns = TileTable.createRequiredColumns();
  return new TileTable(tableName, columns);
}

/**
 * Add rows to the feature table
 * @param geoPackage
 * @param geometryColumns
 * @param table
 * @param numRows
 * @param hasZ
 * @param hasM
 * @param allowEmptyFeatures
 */
module.exports.addRowsToFeatureTable = function(geoPackage, geometryColumns, table, numRows, hasZ, hasM, allowEmptyFeatures) {
  const dao = geoPackage.getFeatureDaoWithGeometryColumns(geometryColumns);
  for (let i = 0; i < numRows; i++) {
    const newRow = dao.newRow();
    for (const column of table.getColumns()) {
      if (!column.isPrimaryKey()) {
        // Leave nullable columns null 20% of the time
        if (!column.isNotNull()) {
          if (allowEmptyFeatures && Math.random() < 0.2) {
            continue;
          }
        }
        if (column.isGeometry()) {
          let geometry = null;
          switch (column.getGeometryType()) {
            case GeometryType.POINT:
              geometry = module.exports.createPoint(hasZ, hasM);
              break;
            case GeometryType.LINESTRING:
              geometry = module.exports.createLineString(hasZ, hasM, false);
              break;
            case GeometryType.POLYGON:
              geometry = module.exports.createPolygon(hasZ, hasM);
              break;
            default:
              throw new UnsupportedOperationException("Not implemented for geometry type: " + column.getGeometryType());
          }
          const geometryData = GeoPackageGeometryData.createWithSrsId(geometryColumns.getSrsId(), geometry);
          newRow.setGeometry(geometryData);
        } else {
          let value = null;
          switch (column.getDataType()) {
            case GeoPackageDataType.TEXT:
              let text = crypto.randomUUID();
              if (column.getMax() != null && text.length > column.getMax()) {
                text = text.substring(0, column.getMax());
              }
              value = text;
              break;
            case GeoPackageDataType.REAL:
            case GeoPackageDataType.DOUBLE:
              value = Math.random() * 5000.0;
              break;
            case GeoPackageDataType.BOOLEAN:
              value = Math.random() < .5;
              break;
            case GeoPackageDataType.INTEGER:
            case GeoPackageDataType.INT:
              value = Math.round(Math.random() * 500);
              break;
            case GeoPackageDataType.BLOB:
              let blob = crypto.randomBytes(16);
              if (column.getMax() != null && blob.length > column.getMax()) {
                blob = crypto.randomBytes(column.getMax());
              }
              value = blob;
              break;
            case GeoPackageDataType.DATE:
            case GeoPackageDataType.DATETIME:
              const date = new Date();
              if (Math.random() < .5) {
                value = date;
              } else {
                value = DateConverter.stringValue(date, column.getDataType());
              }
              break;
            default:
              throw new UnsupportedOperationException("Not implemented for data type: " + GeoPackageDataType.nameFromType(column.getDataType()));
          }
          newRow.setValue(column.getName(), value);
        }
      }
    }
    dao.create(newRow);
  }
}

/**
 * Add rows to the tile table
 * @param geoPackage
 * @param tileMatrix
 * @param tileData
 */
module.exports.addRowsToTileTable = function(geoPackage, tileMatrix, tileData) {
  const dao = geoPackage.getTileDao(tileMatrix.getTableName());
  for (let column = 0; column < tileMatrix.getMatrixWidth(); column++) {
    for (let row = 0; row < tileMatrix.getMatrixHeight(); row++) {
      const newRow = dao.newRow();
      newRow.setZoomLevel(tileMatrix.getZoomLevel());
      newRow.setTileColumn(column);
      newRow.setTileRow(row);
      newRow.setTileData(tileData);
      dao.create(newRow);
    }
  }
}

/**
 * Create a random point
 *
 * @param hasZ
 * @param hasM
 * @return Point
 */
module.exports.createPoint = function(hasZ, hasM) {
  const x = Math.random() * 180.0 * (Math.random() < .5 ? 1 : -1);
  const y = Math.random() * ProjectionConstants.WEB_MERCATOR_MIN_LAT_RANGE * (Math.random() < .5 ? 1 : -1);
  const point = new Point(hasZ, hasM, x, y);
  if (hasZ) {
    point.z =  Math.random() * 1000.0;
  }
  if (hasM) {
    point.m = Math.random() * 1000.0;
  }
  return point;
}

/**
 * Create a random line string
 *
 * @param hasZ
 * @param hasM
 * @param ring
 * @return LineString
 */
module.exports.createLineString = function(hasZ, hasM, ring) {
  const lineString = new LineString(hasZ, hasM);
  const numPoints = 2 + (Math.round(Math.random() * 9));
  for (let i = 0; i < numPoints; i++) {
    lineString.addPoint(module.exports.createPoint(hasZ, hasM));
  }
  if (ring) {
    lineString.addPoint(lineString.points[0]);
  }
  return lineString;
}

/**
 * Create a random polygon
 *
 * @param hasZ
 * @param hasM
 * @return Polygon
 */
module.exports.createPolygon = function(hasZ, hasM) {
  const polygon = new Polygon(hasZ, hasM);
  const numLineStrings = 1 + (Math.round(Math.random() * 5));
  for (let i = 0; i < numLineStrings; i++) {
    polygon.addRing(module.exports.createLineString(hasZ, hasM, true));
  }
  return polygon;
}

/**
 * Validate the integer value with the data type
 *
 * @param value
 * @param dataType
 */
module.exports.validateIntegerValue = function(value, dataType) {
  if (dataType != null) {

    switch (dataType) {

      case BOOLEAN:
        TestCase.assertTrue(value instanceof Boolean);
        break;
      case TINYINT:
        TestCase.assertTrue(value instanceof Byte);
        break;
      case SMALLINT:
        TestCase.assertTrue(value instanceof Short);
        break;
      case MEDIUMINT:
        TestCase.assertTrue(value instanceof Integer);
        break;
      case INT:
      case INTEGER:
        TestCase.assertTrue(value instanceof Long);
        break;
      default:
        throw new GeoPackageException(
          "Data Type " + dataType + " is not an integer type");
    }

  }
}

/**
 * Validate the float value with the data type
 *
 * @param value
 * @param dataType
 */
module.exports.validateFloatValue = function(value, dataType) {
  if (dataType != null) {
    switch (dataType) {
      case FLOAT:
        TestCase.assertTrue(value instanceof Float);
        break;
      case DOUBLE:
      case REAL:
        TestCase.assertTrue(value instanceof Double);
        break;
      default:
        throw new GeoPackageException(
          "Data Type " + dataType + " is not a float type");
    }

  }
}

/**
 * Create Data Column Constraints
 *
 * @param geoPackage
 * @throws SQLException
 */
module.exports.createConstraints = function(geoPackage) {
  const schemaExtension = new SchemaExtension(geoPackage);
  schemaExtension.createDataColumnConstraintsTable();

  const dao = schemaExtension.getDataColumnConstraintsDao();

  const sampleRange = new DataColumnConstraints();
  sampleRange.setConstraintName(SAMPLE_RANGE_CONSTRAINT);
  sampleRange.setConstraintType(DataColumnConstraintType.RANGE);
  sampleRange.setMin(BigDecimal.ONE);
  sampleRange.setMinIsInclusive(true);
  sampleRange.setMax(BigDecimal.TEN);
  sampleRange.setMaxIsInclusive(true);
  dao.create(sampleRange);

  const sampleEnum1 = new DataColumnConstraints();
  sampleEnum1.setConstraintName(SAMPLE_ENUM_CONSTRAINT);
  sampleEnum1.setConstraintType(DataColumnConstraintType.ENUM);
  sampleEnum1.setValue("1");
  dao.create(sampleEnum1);

  const sampleEnum3 = new DataColumnConstraints();
  sampleEnum3.setConstraintName(SAMPLE_ENUM_CONSTRAINT);
  sampleEnum3.setConstraintType(DataColumnConstraintType.ENUM);
  sampleEnum3.setValue("3");
  dao.create(sampleEnum3);

  const sampleEnum5 = new DataColumnConstraints();
  sampleEnum5.setConstraintName(SAMPLE_ENUM_CONSTRAINT);
  sampleEnum5.setConstraintType(DataColumnConstraintType.ENUM);
  sampleEnum5.setValue("5");
  dao.create(sampleEnum5);

  const sampleEnum7 = new DataColumnConstraints();
  sampleEnum7.setConstraintName(SAMPLE_ENUM_CONSTRAINT);
  sampleEnum7.setConstraintType(DataColumnConstraintType.ENUM);
  sampleEnum7.setValue("7");
  dao.create(sampleEnum7);

  const sampleEnum9 = new DataColumnConstraints();
  sampleEnum9.setConstraintName(SAMPLE_ENUM_CONSTRAINT);
  sampleEnum9.setConstraintType(DataColumnConstraintType.ENUM);
  sampleEnum9.setValue("9");
  dao.create(sampleEnum9);

  const sampleGlob = new DataColumnConstraints();
  sampleGlob.setConstraintName(SAMPLE_GLOB_CONSTRAINT);
  sampleGlob.setConstraintType(DataColumnConstraintType.GLOB);
  sampleGlob.setValue("[1-2][0-9][0-9][0-9]");
  dao.create(sampleGlob);
}

/**
 * Get the import db file
 *
 * @return file
 */
module.exports.getImportDbFile = function() {
  return module.exports.getTestFile(TestConstants.IMPORT_DB_FILE_NAME);
}

/**
 * Get the import db corrupt file
 * @return file
 */
module.exports.getImportDbCorruptFile = function() {
  return module.exports.getTestFile(TestConstants.IMPORT_CORRUPT_DB_FILE_NAME);
}

/**
 * Get the tile file
 *
 * @return file
 */
module.exports.getTileFile = function() {
  return module.exports.getTestFile(TestConstants.TILE_FILE_NAME);
}

/**
 * Get the file
 * @param fileName  file name
 * @return file
 */
module.exports.getTestFile = function(fileName) {
 return module.exports.createGeoPackage(fileName);
}

/**
 * Validate the integrity and keys of the GeoPackage
 * @param geoPackage
 */
module.exports.validateGeoPackage = function(geoPackage) {
  geoPackage.foreignKeyCheck().should.not.be.null;
  geoPackage.integrityCheck().should.not.be.null;
  geoPackage.quickCheck().should.not.be.null;
}


export default module.exports;

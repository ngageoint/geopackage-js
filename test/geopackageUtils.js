var GeoPackageAPI = require('../index')
  , DataTypes = GeoPackageAPI.DataTypes
  , GeometryColumns = GeoPackageAPI.GeometryColumns
  , GeometryData = GeoPackageAPI.GeometryData
  , BoundingBox = GeoPackageAPI.BoundingBox
  , FeatureColumn = GeoPackageAPI.FeatureColumn
  , DataColumns = GeoPackageAPI.DataColumns
  , UserColumn = GeoPackageAPI.UserColumn
  , Metadata = GeoPackageAPI.Metadata
  , MetadataReference = GeoPackageAPI.MetadataReference
  , RTreeIndex = GeoPackageAPI.RTreeIndex
  , CrsWktExtension = GeoPackageAPI.CrsWktExtension
  , SchemaExtension = GeoPackageAPI.SchemaExtension
  , MetadataExtension = GeoPackageAPI.MetadataExtension
  , WebPExtension = GeoPackageAPI.WebPExtension
  , DataColumnsDao = GeoPackageAPI.DataColumnsDao
  , DataColumnConstraintsDao = GeoPackageAPI.DataColumnConstraintsDao
  , TableCreator = GeoPackageAPI.TableCreator
  , MediaTable = GeoPackageAPI.MediaTable
  , UserMappingTable = GeoPackageAPI.UserMappingTable
  , DublinCoreType = GeoPackageAPI.DublinCoreType
  , wkb = require('../lib/wkb/index');

var wkx = require('wkx')
  , path = require('path')
  , fs = require('fs');

var GeoPackageUtils = {};

module.exports = GeoPackageUtils;

GeoPackageUtils.createCRSWKTExtension = function(geopackage) {
  console.log('Creating CRS WKT Extension');
  var crs = new CrsWktExtension(geopackage);
  crs.getOrCreateExtension();
  return geopackage;
}

GeoPackageUtils.createFeatures = function(geopackage) {
  console.log('Creating Features');
  var bitSystems = {
    "type": "Point",
    "coordinates": [
      -104.801918, 39.720014
    ]
  };

  var nga = {
    "type": "Point",
    "coordinates": [
      -77.196736, 38.753370
    ]
  };

  var lockheedDrive = {
    "type": "LineString",
    "coordinates": [
      [-104.800614, 39.720721],
      [-104.802174, 39.720726],
      [-104.802584, 39.720660],
      [-104.803088, 39.720477],
      [-104.803474, 39.720209]
    ]
  };

  var ngaLine = {
    "type": "LineString",
    "coordinates": [
      [-77.196650, 38.756501],
      [-77.196414, 38.755979],
      [-77.195518, 38.755208],
      [-77.195303, 38.755272],
      [-77.195351, 38.755459],
      [-77.195863, 38.755697],
      [-77.196328, 38.756069],
      [-77.196568, 38.756526]
    ]
  };

  var bitsPolygon = {
    "type": "Polygon",
    "coordinates": [
      [
        [-104.802246, 39.720343],
        [-104.802246, 39.719753],
        [-104.802183, 39.719754],
        [-104.802184, 39.719719],
        [-104.802138, 39.719694],
        [-104.802097, 39.719691],
        [-104.802096, 39.719648],
        [-104.801646, 39.719648],
        [-104.801644, 39.719722],
        [-104.801550, 39.719723],
        [-104.801549, 39.720207],
        [-104.801648, 39.720207],
        [-104.801648, 39.720341],
        [-104.802246, 39.720343]
      ]
    ]
  };

  var ngaVisitorCenterPolygon = {
    "type": "Polygon",
    "coordinates": [
      [
        [-77.195299, 38.755159],
        [-77.195203, 38.755080],
        [-77.195410, 38.754930],
        [-77.195350, 38.754884],
        [-77.195228, 38.754966],
        [-77.195135, 38.754889],
        [-77.195048, 38.754956],
        [-77.194986, 38.754906],
        [-77.194897, 38.754976],
        [-77.194953, 38.755025],
        [-77.194763, 38.755173],
        [-77.194827, 38.755224],
        [-77.195012, 38.755082],
        [-77.195041, 38.755104],
        [-77.195028, 38.755116],
        [-77.195090, 38.755167],
        [-77.195106, 38.755154],
        [-77.195205, 38.755233],
        [-77.195299, 38.755159]
      ]
    ]
  };

  var point1 = {
    geoJson: bitSystems,
    name: 'BIT Systems'
  };
  var point2 = {
    geoJson: nga,
    name: 'NGA'
  };
  var line1 = {
    geoJson: lockheedDrive,
    name: 'East Lockheed Drive'
  };
  var line2 = {
    geoJson: ngaLine,
    name: 'NGA'
  };
  var poly1 = {
    geoJson: bitsPolygon,
    name: 'BIT Systems'
  };
  var poly2 = {
    geoJson: ngaVisitorCenterPolygon,
    name: 'NGA Visitor Center'
  };

  return GeoPackageUtils.createFeatureTableAndAddFeatures(geopackage, 'point1', [point1], wkb.typeMap.wkt.Point)
  .then(function() {
    return GeoPackageUtils.createFeatureTableAndAddFeatures(geopackage, 'point2', [point2], wkb.typeMap.wkt.Point);
  })
  .then(function() {
    return GeoPackageUtils.createFeatureTableAndAddFeatures(geopackage, 'line1', [line1], wkb.typeMap.wkt.LineString);
  })
  .then(function() {
    return GeoPackageUtils.createFeatureTableAndAddFeatures(geopackage, 'line2', [line2],wkb.typeMap.wkt.LineString);
  })
  .then(function() {
    return GeoPackageUtils.createFeatureTableAndAddFeatures(geopackage, 'polygon1', [poly1], wkb.typeMap.wkt.Polygon);
  })
  .then(function() {
    return GeoPackageUtils.createFeatureTableAndAddFeatures(geopackage, 'polygon2', [poly2], wkb.typeMap.wkt.Polygon);
  })
  .then(function() {
    return GeoPackageUtils.createFeatureTableAndAddFeatures(geopackage, 'geometry1', [point1, line1, poly1], 'GEOMETRY');
  })
  .then(function() {
    return GeoPackageUtils.createFeatureTableAndAddFeatures(geopackage, 'geometry2', [point2, line2, poly2], 'GEOMETRY');
  })
  .then(function() {
    return geopackage;
  });
}

GeoPackageUtils.createFeatureTableAndAddFeatures = function(geopackage, tableName, features, type) {
  console.log('Creating Feature Table ' + tableName);
  var geometryColumns = new GeometryColumns();
  geometryColumns.table_name = tableName;
  geometryColumns.column_name = 'geometry';
  geometryColumns.geometry_type_name = type;
  geometryColumns.z = 0;
  geometryColumns.m = 0;

  var boundingBox = new BoundingBox(-180, 180, -80, 80);

  var columns = [];
  var columnNumber = 0;
  columns.push(FeatureColumn.createPrimaryKeyColumnWithIndexAndName(columnNumber++, 'id'));
  columns.push(FeatureColumn.createGeometryColumn(columnNumber++, 'geometry', type, false, null));
  columns.push(FeatureColumn.createColumnWithIndex(columnNumber++, 'text', DataTypes.GPKGDataType.GPKG_DT_TEXT, false, ""));
  columns.push(FeatureColumn.createColumnWithIndex(columnNumber++, 'real', DataTypes.GPKGDataType.GPKG_DT_REAL, false, null));
  columns.push(FeatureColumn.createColumnWithIndex(columnNumber++, 'boolean', DataTypes.GPKGDataType.GPKG_DT_BOOLEAN, false, null));
  columns.push(FeatureColumn.createColumnWithIndex(columnNumber++, 'blob', DataTypes.GPKGDataType.GPKG_DT_BLOB, false, null));
  columns.push(FeatureColumn.createColumnWithIndex(columnNumber++, 'integer', DataTypes.GPKGDataType.GPKG_DT_INTEGER, false, null));
  columns.push(FeatureColumn.createColumnWithIndex(columnNumber++, 'text_limited', DataTypes.GPKGDataType.GPKG_DT_TEXT, false, null));
  columns.push(FeatureColumn.createColumnWithIndex(columnNumber++, 'blob_limited', DataTypes.GPKGDataType.GPKG_DT_BLOB, false, null));
  columns.push(FeatureColumn.createColumnWithIndex(columnNumber++, 'date', DataTypes.GPKGDataType.GPKG_DT_DATE, false, null));
  columns.push(FeatureColumn.createColumnWithIndex(columnNumber++, 'datetime', DataTypes.GPKGDataType.GPKG_DT_DATETIME, false, null));

  return geopackage.createFeatureTableWithGeometryColumns(geometryColumns, boundingBox, 4326, columns)
  .then(function(result) {
    var featureDao = geopackage.getFeatureDao(tableName);
    for (var i = 0; i < features.length; i++) {
      var feature = features[i];
      GeoPackageUtils.createFeature(geopackage, feature.geoJson, feature.name, featureDao);
    }
  })
  .then(function() {
    return geopackage;
  });
}

GeoPackageUtils.createFeature = function(geopackage, geoJson, name, featureDao) {
  var srs = featureDao.getSrs();
  var featureRow = featureDao.newRow();
  var geometryData = new GeometryData();
  geometryData.setSrsId(srs.srs_id);
  var geometry = wkx.Geometry.parseGeoJSON(geoJson);
  geometryData.setGeometry(geometry);
  featureRow.setGeometry(geometryData);
  featureRow.setValueWithColumnName('text', name);
  featureRow.setValueWithColumnName('real', Math.random() * 5000.0);
  featureRow.setValueWithColumnName('boolean', Math.random() < .5 ? false : true);
  featureRow.setValueWithColumnName('blob', Buffer.from(Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5)));
  featureRow.setValueWithColumnName('integer', Math.round(Math.random() * 500));
  featureRow.setValueWithColumnName('text_limited', Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5));
  featureRow.setValueWithColumnName('blob_limited', Buffer.from(Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5)));
  featureRow.setValueWithColumnName('date', new Date());
  featureRow.setValueWithColumnName('datetime', new Date());
  return featureDao.create(featureRow);
}

GeoPackageUtils.createSchemaExtension = function(geopackage) {
  console.log('Create Schema Extension');
  var schema = new SchemaExtension(geopackage);
  schema.getOrCreateExtension();

  var tc = new TableCreator(geopackage);
  return tc.createDataColumnConstraints()
  .then(function() {
    return tc.createDataColumns();
  })
  .then(function() {
    var dcd = geopackage.getDataColumnConstraintsDao();
    var sampleRange = dcd.createObject();
    sampleRange.constraint_name = 'sampleRange';
    sampleRange.constraint_type = DataColumnConstraintsDao.RANGE_TYPE;
    sampleRange.min = 1;
    sampleRange.min_is_inclusive = true;
    sampleRange.max = 10;
    sampleRange.max_is_inclusive = true;
    sampleRange.description = 'sampleRange description';
    dcd.create(sampleRange);

    var sampleEnum1 = dcd.createObject();
    sampleEnum1.constraint_name = 'sampleEnum';
    sampleEnum1.constraint_type = DataColumnConstraintsDao.ENUM_TYPE;
    sampleEnum1.value = '1';
    sampleEnum1.description = 'sampleEnum description';
    dcd.create(sampleEnum1);

    var sampleEnum3 = dcd.createObject();
    sampleEnum3.constraint_name = sampleEnum1.constraint_name;
    sampleEnum3.constraint_type = DataColumnConstraintsDao.ENUM_TYPE;
    sampleEnum3.value = '3';
    sampleEnum3.description = 'sampleEnum description';
    dcd.create(sampleEnum3);

    var sampleEnum5 = dcd.createObject();
    sampleEnum5.constraint_name = sampleEnum1.constraint_name;
    sampleEnum5.constraint_type = DataColumnConstraintsDao.ENUM_TYPE;
    sampleEnum5.value = '5';
    sampleEnum5.description = 'sampleEnum description';
    dcd.create(sampleEnum5);

    var sampleEnum7 = dcd.createObject();
    sampleEnum7.constraint_name = sampleEnum1.constraint_name;
    sampleEnum7.constraint_type = DataColumnConstraintsDao.ENUM_TYPE;
    sampleEnum7.value = '7';
    sampleEnum7.description = 'sampleEnum description';
    dcd.create(sampleEnum7);

    var sampleEnum9 = dcd.createObject();
    sampleEnum9.constraint_name = sampleEnum1.constraint_name;
    sampleEnum9.constraint_type = DataColumnConstraintsDao.ENUM_TYPE;
    sampleEnum9.value = '9';
    sampleEnum9.description = 'sampleEnum description';
    dcd.create(sampleEnum9);

    var sampleGlob = dcd.createObject();
    sampleGlob.constraint_name = 'sampleGlob';
    sampleGlob.constraint_type = DataColumnConstraintsDao.GLOB_TYPE;
    sampleGlob.value = '[1-2][0-9][0-9][0-9]';
    sampleGlob.description = 'sampleGlob description';
    dcd.create(sampleGlob);

    var dc = geopackage.getDataColumnsDao();
    var featureTables = geopackage.getFeatureTables();
    for (var i = 0; i < featureTables.length; i++) {
      var tableName = featureTables[i];
      var featureDao = geopackage.getFeatureDao(tableName);
      var table = featureDao.getFeatureTable();

      for (var c = 0; c < table.columns.length; c++) {
        var column = table.columns[c];
        if (column.primaryKey || column.getTypeName() !== 'INTEGER') continue;
        var dataColumns = dc.createObject();
        dataColumns.table_name = tableName;
        dataColumns.column_name = column.name;
        dataColumns.name = tableName+'_'+column.name;
        dataColumns.title = 'Test Title';
        dataColumns.description = 'Test Description';
        dataColumns.mime_type = 'test mime type';
        dataColumns.constraint_name = 'test constraint';

        var constraintType = c % 3;
        var constraintName;
        var value = 0;
        if (constraintType === 0) {
          constraintName = sampleRange.constraint_name;
          value = 1 + Math.round(Math.random() * 10);
        } else if (constraintType === 1) {
          constraintName = sampleEnum1.constraint_name;
          value = 1 + (Math.round(Math.random() * 5) * 2);
        } else if (constraintType === 2) {
          constraintName = sampleGlob.constraint_name;
          value = 1000 + Math.round(Math.random() * 2000);
        }
        dataColumns.constraint_name = constraintName;
        var update = {};
        update[column.name] = value;
        featureDao.update(update);

        dc.create(dataColumns);
        break;
      }
    }
  })
  .then(function() {
    return geopackage;
  });
}

GeoPackageUtils.createGeometryIndexExtension = function(geopackage) {
  console.log('Create Geometry Index Extension');
  var tables = geopackage.getFeatureTables();

  return tables.reduce(function(sequence, table) {
    return sequence.then(function() {
      console.log('Index table ' + table);
      var featureDao = geopackage.getFeatureDao(table);
      var fti = featureDao.featureTableIndex;
      var tableIndex = fti.getTableIndex();
      return fti.index();
    });
  }, Promise.resolve())
  .then(function() {
    return geopackage;
  });
}

GeoPackageUtils.createFeatureTileLinkExtension = function(geopackage) {
  return geopackage;
}

GeoPackageUtils.createNonLinearGeometryTypesExtension = function(geopackage) {
  return geopackage;
}

GeoPackageUtils.createRTreeSpatialIndexExtension = function(geopackage) {
  var tables = geopackage.getFeatureTables();

  return tables.reduce(function(sequence, table) {
    return sequence.then(function() {
      var featureDao = geopackage.getFeatureDao(table);
      var rtreeIndex = new RTreeIndex(geopackage, featureDao);
      return rtreeIndex.create();
    });
  }, Promise.resolve())
  .then(function() {
    return geopackage;
  });
}

GeoPackageUtils.createRelatedTablesMediaExtension = function(geopackage) {
  var relatedTables = geopackage.getRelatedTablesExtension();
  var mediaTable = MediaTable.create('media');
  relatedTables.createRelatedTable(mediaTable);

  var mediaDao = relatedTables.getMediaDao(mediaTable);
  mediaTable = mediaDao.mediaTable;


  return GeoPackageUtils.loadFile(path.join(__dirname, 'fixtures', 'BITSystems_Logo.png'))
  .then(function(bitsLogoBuffer) {
    var bitsLogo = mediaDao.newRow();
    bitsLogo.setContentType('image/png');
    bitsLogo.setData(bitsLogoBuffer);
    var bitsRowId = mediaDao.create(bitsLogo);
    bitsLogo = mediaDao.queryForId(bitsRowId);

    var featureDao = geopackage.getFeatureDao('geometry1');
    var rows = featureDao.queryForLike('text', 'BIT Systems%');

    return rows.reduce(function(sequence, row) {
      return sequence.then(function() {
        var featureRow = featureDao.getRow(row);
        return featureDao.linkMediaRow(featureRow, bitsLogo);
      });
    }, Promise.resolve())
  })
  .then(function() {
    return GeoPackageUtils.loadFile(path.join(__dirname, 'fixtures', 'NGA_Logo.png'));
  })
  .then(function(ngaLogoBuffer) {

    var ngaRowId = GeoPackageAPI.addMedia(geopackage, 'media', ngaLogoBuffer, 'image/png');
    var ngaLogo = mediaDao.queryForId(ngaRowId);

    var featureDao = geopackage.getFeatureDao('geometry2');
    var rows = featureDao.queryForLike('text', 'NGA%');

    return rows.reduce(function(sequence, row) {
      return sequence.then(function() {
        var featureRow = featureDao.getRow(row);
        GeoPackageAPI.linkMedia(geopackage, 'geometry2', featureRow.getId(), 'media', ngaRowId)
        .then(function() {
          var relationships = GeoPackageAPI.getLinkedMedia(geopackage, 'geometry2', featureRow.getId());
          relationships.length.should.be.equal(1);
          relationships[0].id.should.be.equal(ngaRowId);
        });

      });
    }, Promise.resolve())
  })
  .then(function() {
    return geopackage;
  });
}

GeoPackageUtils.createRelatedTablesFeaturesExtension = function(geopackage) {
  var point1FeatureDao = geopackage.getFeatureDao('point1');
  var polygon1FeatureDao = geopackage.getFeatureDao('polygon1');
  var point2FeatureDao = geopackage.getFeatureDao('point2');
  var polygon2FeatureDao = geopackage.getFeatureDao('polygon2');

  // relate the point1 feature to the polygon1 feature
  var point1Row = point1FeatureDao.getRow(point1FeatureDao.queryForAll()[0]);
  var polygon1Row = polygon1FeatureDao.getRow(polygon1FeatureDao.queryForAll()[0]);

  var columns = [];
  var columnIndex = UserMappingTable.numRequiredColumns();
  columns.push(UserColumn.createColumnWithIndex(columnIndex++, DublinCoreType.DATE.name, DataTypes.GPKGDataType.GPKG_DT_DATETIME));
  columns.push(UserColumn.createColumnWithIndex(columnIndex++, DublinCoreType.DESCRIPTION.name, DataTypes.GPKGDataType.GPKG_DT_TEXT));
  columns.push(UserColumn.createColumnWithIndex(columnIndex++, DublinCoreType.SOURCE.name, DataTypes.GPKGDataType.GPKG_DT_TEXT));
  columns.push(UserColumn.createColumnWithIndex(columnIndex++, DublinCoreType.TITLE.name, DataTypes.GPKGDataType.GPKG_DT_TEXT));

  var userMappingTable = UserMappingTable.create('point1_to_polygon1', columns);
  var mappingColumnValues = {};
  mappingColumnValues[DublinCoreType.DATE.name] = new Date();
  mappingColumnValues[DublinCoreType.DESCRIPTION.name] = 'Description';
  mappingColumnValues[DublinCoreType.SOURCE.name] = 'Source';
  mappingColumnValues[DublinCoreType.TITLE.name] = 'Title';

  return point1FeatureDao.linkFeatureRow(point1Row, polygon1Row, userMappingTable, mappingColumnValues)
  .then(function() {
    // relate the point2 feature to the polygon2 feature
    var point2Row = point2FeatureDao.getRow(point2FeatureDao.queryForAll()[0]);
    var polygon2Row = polygon2FeatureDao.getRow(polygon2FeatureDao.queryForAll()[0]);
    return point2FeatureDao.linkFeatureRow(point2Row, polygon2Row);
  })
  .then(function() {
    return geopackage;
  });
}

GeoPackageUtils.createRelatedTablesSimpleAttributesExtension = function(geopackage) {
  return geopackage;
}

GeoPackageUtils.loadFile = function(filePath) {
  return new Promise(function(resolve, reject) {
    if (typeof(process) !== 'undefined' && process.version) {
      fs.readFile(filePath, function(err, data) {
        if (err) {
          return reject(err);
        }
        resolve(data);
      });
    } else {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', filePath, true);
      xhr.responseType = 'arraybuffer';

      xhr.onload = function(e) {
        if (xhr.status !== 200) {
          reject();
        }
        resolve(Buffer.from(this.response));
      };
      xhr.onerror = reject;
      xhr.send();
    }
  });
}

GeoPackageUtils.createTiles = function(geopackage) {
  return GeoPackageUtils.addWebMercatorTilesFromPath(geopackage, 'OSM', path.join(__dirname, 'fixtures', 'tiles'), 0, 3)
  .then(function() {
    return geopackage;
  });
}

GeoPackageUtils.addWebMercatorTilesFromPath = function(geopackage, tableName, tileBaseDir, minZoom, maxZoom) {
  tableName = tableName || 'OSM';
  var tileMatrixSetBoundingBox = new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.342789244, 20037508.342789244);
  var contentsBoundingBox = new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.342789244, 20037508.342789244);
  var contentsSrsId = 3857;
  var tileMatrixSetSrsId = 3857;
  geopackage.getSpatialReferenceSystemDao().createWebMercator();
  return geopackage.createTileTableWithTableName(tableName, contentsBoundingBox, contentsSrsId, tileMatrixSetBoundingBox, tileMatrixSetSrsId)
  .then(function(tileMatrixSet) {
    geopackage.createStandardWebMercatorTileMatrix(tileMatrixSetBoundingBox, tileMatrixSet, minZoom, maxZoom);
    var zooms = [];
    for (var i = minZoom; i <= maxZoom; i++) {
      zooms.push(i);
    }

    return zooms.reduce(function(zoomSequence, zoom) {
      return zoomSequence.then(function() {
        var xfilenames = fs.readdirSync(path.join(tileBaseDir, zoom.toString()));
        return xfilenames.reduce(function(xSequence, xFilename) {
          return xSequence.then(function() {
            var x = Number(xFilename);
            if (Number.isNaN(x)) return;
            var yfilenames = fs.readdirSync(path.join(tileBaseDir, zoom.toString(), x.toString()));
            return yfilenames.reduce(function(ySequence, yFilename) {
              return ySequence.then(function() {
                var y = Number(yFilename.slice(0, yFilename.lastIndexOf('.')));
                if (Number.isNaN(y)) return;
                return GeoPackageUtils.loadFile(path.join(__dirname, 'fixtures', 'tiles', zoom.toString(), x.toString(), y.toString()+'.png'))
                .then(function(image) {
                  console.log('Adding tile z: %s x: %s y: %s to %s', zoom, x, y, tableName);
                  return geopackage.addTile(image, tableName, zoom, y, x);
                });
              });
            }, Promise.resolve());
          });
        }, Promise.resolve());
      });
    }, Promise.resolve());
  })
  .then(function() {
    return geopackage;
  });
}

GeoPackageUtils.createWebPExtension = function(geopackage) {
  console.log('Creating WebP Extension');
  var tableName = 'webp_tiles';

  var webpExtension = new WebPExtension(geopackage, tableName);
  webpExtension.getOrCreateExtension();

  var tileMatrixSetBoundingBox = new BoundingBox(-11667347.997449303,
      4824705.2253603265, -11666125.00499674, 4825928.217812888);
  var contentsBoundingBox = new BoundingBox(-11667347.997449303,
      4824705.2253603265, -11666125.00499674, 4825928.217812888);

  var contentsSrsId = 3857;
  var tileMatrixSetSrsId = 3857;
  geopackage.getSpatialReferenceSystemDao().createWebMercator();
  return geopackage.createTileTableWithTableName(tableName, contentsBoundingBox, contentsSrsId, tileMatrixSetBoundingBox, tileMatrixSetSrsId)
  .then(function(tileMatrixSet) {
    geopackage.createStandardWebMercatorTileMatrix(tileMatrixSetBoundingBox, tileMatrixSet, 15, 15);
    return GeoPackageUtils.loadFile(path.join(__dirname, 'fixtures', 'tiles', '15', '6844', '12438.webp'));
  })
  .then(function(image) {
    return geopackage.addTile(image, tableName, 15, 12438, 6844);
  })
  .then(function() {
    return geopackage;
  });
}

GeoPackageUtils.createAttributes = function(geopackage) {
  console.log('Creating Attributes table');
  var tableName = 'attributes';

  var columns = [];
  var columnNumber = 0;
  columns.push(UserColumn.createPrimaryKeyColumnWithIndexAndName(columnNumber++, 'id'));
  columns.push(UserColumn.createColumnWithIndex(columnNumber++, 'text', DataTypes.GPKGDataType.GPKG_DT_TEXT, false, ""));
  columns.push(UserColumn.createColumnWithIndex(columnNumber++, 'real', DataTypes.GPKGDataType.GPKG_DT_REAL, false, null));
  columns.push(UserColumn.createColumnWithIndex(columnNumber++, 'boolean', DataTypes.GPKGDataType.GPKG_DT_BOOLEAN, false, null));
  columns.push(UserColumn.createColumnWithIndex(columnNumber++, 'blob', DataTypes.GPKGDataType.GPKG_DT_BLOB, false, null));
  columns.push(UserColumn.createColumnWithIndex(columnNumber++, 'integer', DataTypes.GPKGDataType.GPKG_DT_INTEGER, false, null));
  columns.push(UserColumn.createColumnWithIndex(columnNumber++, 'text_limited', DataTypes.GPKGDataType.GPKG_DT_TEXT, false, null));
  columns.push(UserColumn.createColumnWithIndex(columnNumber++, 'blob_limited', DataTypes.GPKGDataType.GPKG_DT_BLOB, false, null));
  columns.push(UserColumn.createColumnWithIndex(columnNumber++, 'date', DataTypes.GPKGDataType.GPKG_DT_DATE, false, null));
  columns.push(UserColumn.createColumnWithIndex(columnNumber++, 'datetime', DataTypes.GPKGDataType.GPKG_DT_DATETIME, false, null));

  var dc = new DataColumns();
  dc.table_name = tableName;
  dc.column_name = 'text';
  dc.name = 'Test Name';
  dc.title = 'Test';
  dc.description = 'Test Description';
  dc.mime_type = 'text/html';
  dc.constraint_name = 'test constraint';

  return geopackage.createAttributeTable(tableName, columns, [dc])
  .then(function(result) {
    var attributeDao = geopackage.getAttributeDaoWithTableName(tableName);

    for (var i = 0; i < 10; i++) {
      var attributeRow = attributeDao.newRow();
      attributeRow.setValueWithColumnName('text', tableName);
      attributeRow.setValueWithColumnName('real', Math.random() * 5000.0);
      attributeRow.setValueWithColumnName('boolean', Math.random() < .5 ? false : true);
      attributeRow.setValueWithColumnName('blob', Buffer.from(Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5)));
      attributeRow.setValueWithColumnName('integer', Math.round(Math.random() * 500));
      attributeRow.setValueWithColumnName('text_limited', Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5));
      attributeRow.setValueWithColumnName('blob_limited', Buffer.from(Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5)));
      attributeRow.setValueWithColumnName('date', new Date());
      attributeRow.setValueWithColumnName('datetime', new Date());
      attributeDao.create(attributeRow);
    }
    return geopackage;
  });
}

GeoPackageUtils.createMetadataExtension = function(geopackage) {
  var metadataExtension = new MetadataExtension(geopackage);
  metadataExtension.getOrCreateExtension();

  return geopackage.createMetadataTable()
  .then(function() {
    return geopackage.createMetadataReferenceTable();
  })
  .then(function() {
    var metadataDao = geopackage.getMetadataDao();

    var md1 = metadataDao.createObject();
    md1.id = 1;
    md1.md_scope = Metadata.DATASET;
    md1.md_standard_uri = 'TEST_URI_1';
    md1.mime_type = 'text/xml';
    md1.metadata = 'TEST METADATA 1';
    metadataDao.create(md1);

    var md2 = metadataDao.createObject();
    md2.id = 2;
    md2.md_scope = Metadata.FEATURE_TYPE;
    md2.md_standard_uri = 'TEST_URI_2';
    md2.mime_type = 'text/xml';
    md2.metadata = 'TEST METADATA 2';
    metadataDao.create(md2);

    var md3 = metadataDao.createObject();
    md3.id = 3;
    md3.md_scope = Metadata.TILE;
    md3.md_standard_uri = 'TEST_URI_3';
    md3.mime_type = 'text/xml';
    md3.metadata = 'TEST METADATA 3';
    metadataDao.create(md3);

    var metadataReferenceDao = geopackage.getMetadataReferenceDao();

    var ref1 = metadataReferenceDao.createObject();
    ref1.setReferenceScopeType(MetadataReference.GEOPACKAGE);
    ref1.setMetadata(md1);
    metadataReferenceDao.create(ref1);

    var tileTables = geopackage.getTileTables();
    if (tileTables.length) {
      var ref2 = metadataReferenceDao.createObject();
      ref2.setReferenceScopeType(MetadataReference.TABLE);
      ref2.table_name = tileTables[0];
      ref2.setMetadata(md2);
      ref2.setParentMetadata(md1);
      metadataReferenceDao.create(ref2);
    }

    var featureTables = geopackage.getFeatureTables();
    if (featureTables.length) {
      var ref3 = metadataReferenceDao.createObject();
      ref3.setReferenceScopeType(MetadataReference.ROW_COL);
      ref3.table_name = featureTables[0];
      ref3.column_name = 'geom';
      ref3.row_id_value = 1;
      ref3.setMetadata(md3);
      metadataReferenceDao.create(ref3);
    }
    return geopackage;
  });
}

GeoPackageUtils.createCoverageDataExtension = function(geopackage) {
  return geopackage;
}

GeoPackageUtils.createPropertiesExtension = function(geopackage) {
  return geopackage;
}

import * as GP from '../index';
const GeoPackageDataType = GP.GeoPackageDataType,
  GeometryColumns = GP.GeometryColumns,
  GeometryData = GP.GeometryData,
  BoundingBox = GP.BoundingBox,
  FeatureColumn = GP.FeatureColumn,
  DataColumns = GP.DataColumns,
  UserColumn = GP.UserColumn,
  Metadata = GP.Metadata,
  MetadataReference = GP.MetadataReference,
  RTreeIndex = GP.RTreeIndex,
  CrsWktExtension = GP.CrsWktExtension,
  SchemaExtension = GP.SchemaExtension,
  MetadataExtension = GP.MetadataExtension,
  WebPExtension = GP.WebPExtension,
  DataColumnConstraintsDao = GP.DataColumnConstraintsDao,
  Constraints = GP.Constraints,
  TableCreator = GP.TableCreator,
  MediaTable = GP.MediaTable,
  UserMappingTable = GP.UserMappingTable,
  DublinCoreType = GP.DublinCoreType,
  GeometryType = GP.GeometryType;

const wkx = require('wkx'),
  path = require('path'),
  fs = require('fs');

const GeoPackageUtils = {};

module.exports = GeoPackageUtils;
export default GeoPackageUtils;

GeoPackageUtils.createCRSWKTExtension = function(geopackage) {
  console.log('Creating CRS WKT Extension');
  const crs = new CrsWktExtension(geopackage);
  crs.getOrCreateExtension();
  return geopackage;
};

GeoPackageUtils.createFeatures = function(geopackage) {
  console.log('Creating Features');
  const bitSystems = {
    type: 'Point',
    coordinates: [-104.801918, 39.720014],
  };

  const nga = {
    type: 'Point',
    coordinates: [-77.196736, 38.75337],
  };

  const lockheedDrive = {
    type: 'LineString',
    coordinates: [
      [-104.800614, 39.720721],
      [-104.802174, 39.720726],
      [-104.802584, 39.72066],
      [-104.803088, 39.720477],
      [-104.803474, 39.720209],
    ],
  };

  const ngaLine = {
    type: 'LineString',
    coordinates: [
      [-77.19665, 38.756501],
      [-77.196414, 38.755979],
      [-77.195518, 38.755208],
      [-77.195303, 38.755272],
      [-77.195351, 38.755459],
      [-77.195863, 38.755697],
      [-77.196328, 38.756069],
      [-77.196568, 38.756526],
    ],
  };

  const bitsPolygon = {
    type: 'Polygon',
    coordinates: [
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
        [-104.80155, 39.719723],
        [-104.801549, 39.720207],
        [-104.801648, 39.720207],
        [-104.801648, 39.720341],
        [-104.802246, 39.720343],
      ],
    ],
  };

  const ngaVisitorCenterPolygon = {
    type: 'Polygon',
    coordinates: [
      [
        [-77.195299, 38.755159],
        [-77.195203, 38.75508],
        [-77.19541, 38.75493],
        [-77.19535, 38.754884],
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
        [-77.19509, 38.755167],
        [-77.195106, 38.755154],
        [-77.195205, 38.755233],
        [-77.195299, 38.755159],
      ],
    ],
  };

  const point1 = {
    geoJson: bitSystems,
    name: 'BIT Systems',
  };
  const point2 = {
    geoJson: nga,
    name: 'NGA',
  };
  const line1 = {
    geoJson: lockheedDrive,
    name: 'East Lockheed Drive',
  };
  const line2 = {
    geoJson: ngaLine,
    name: 'NGA',
  };
  const poly1 = {
    geoJson: bitsPolygon,
    name: 'BIT Systems',
  };
  const poly2 = {
    geoJson: ngaVisitorCenterPolygon,
    name: 'NGA Visitor Center',
  };

  GeoPackageUtils.createFeatureTableAndAddFeatures(geopackage, 'point1', [point1], GeometryType.POINT);
  GeoPackageUtils.createFeatureTableAndAddFeatures(geopackage, 'point2', [point2], GeometryType.POINT);
  GeoPackageUtils.createFeatureTableAndAddFeatures(geopackage, 'line1', [line1], GeometryType.LINESTRING);
  GeoPackageUtils.createFeatureTableAndAddFeatures(geopackage, 'line2', [line2], GeometryType.LINESTRING);
  GeoPackageUtils.createFeatureTableAndAddFeatures(geopackage, 'polygon1', [poly1], GeometryType.POLYGON);
  GeoPackageUtils.createFeatureTableAndAddFeatures(geopackage, 'polygon2', [poly2], GeometryType.POLYGON);
  GeoPackageUtils.createFeatureTableAndAddFeatures(geopackage, 'geometry1', [point1, line1, poly1], GeometryType.GEOMETRY);
  GeoPackageUtils.createFeatureTableAndAddFeatures(geopackage, 'geometry2', [point2, line2, poly2], GeometryType.GEOMETRY);
  return geopackage;
};

GeoPackageUtils.createFeatureTableAndAddFeatures = function(geopackage, tableName, features, type) {
  console.log('Creating Feature Table ' + tableName);
  const geometryColumns = new GeometryColumns();
  geometryColumns.table_name = tableName;
  geometryColumns.column_name = 'geometry';
  geometryColumns.geometry_type_name = GeometryType.nameFromType(type);
  geometryColumns.z = 0;
  geometryColumns.m = 0;

  const boundingBox = new BoundingBox(-180, 180, -80, 80);

  const columns = [];
  let columnNumber = 0;
  columns.push(FeatureColumn.createPrimaryKeyColumn(columnNumber++, 'id'));
  columns.push(FeatureColumn.createGeometryColumn(columnNumber++, 'geometry', type, false, null));
  columns.push(
    FeatureColumn.createColumn(columnNumber++, 'text', GeoPackageDataType.TEXT, false, ''),
  );
  columns.push(
    FeatureColumn.createColumn(columnNumber++, 'real', GeoPackageDataType.REAL, false, null),
  );
  columns.push(
    FeatureColumn.createColumn(columnNumber++, 'boolean', GeoPackageDataType.BOOLEAN, false, null),
  );
  columns.push(
    FeatureColumn.createColumn(columnNumber++, 'blob', GeoPackageDataType.BLOB, false, null),
  );
  columns.push(
    FeatureColumn.createColumn(columnNumber++, 'integer', GeoPackageDataType.INTEGER, false, null),
  );
  columns.push(
    FeatureColumn.createColumn(
      columnNumber++,
      'text_limited',
      GeoPackageDataType.TEXT,
      false,
      null,
    ),
  );
  columns.push(
    FeatureColumn.createColumn(
      columnNumber++,
      'blob_limited',
      GeoPackageDataType.BLOB,
      false,
      null,
    ),
  );
  columns.push(
    FeatureColumn.createColumn(columnNumber++, 'date', GeoPackageDataType.DATE, false, null),
  );
  columns.push(
    FeatureColumn.createColumn(
      columnNumber++,
      'datetime',
      GeoPackageDataType.DATETIME,
      false,
      null,
    ),
  );

  geopackage.createFeatureTable(tableName, geometryColumns, columns, boundingBox, 4326);
  const featureDao = geopackage.getFeatureDao(tableName);
  for (let i = 0; i < features.length; i++) {
    const feature = features[i];
    GeoPackageUtils.createFeature(geopackage, feature.geoJson, feature.name, featureDao);
  }
  return geopackage;
};

GeoPackageUtils.createFeature = function(geopackage, geoJson, name, featureDao) {
  const srs = featureDao.srs;
  const featureRow = featureDao.newRow();
  const geometryData = new GeometryData();
  geometryData.setSrsId(srs.srs_id);
  const geometry = wkx.Geometry.parseGeoJSON(geoJson);
  geometryData.setGeometry(geometry);
  featureRow.geometry = geometryData;
  featureRow.setValueWithColumnName('text', name);
  featureRow.setValueWithColumnName('real', Math.random() * 5000.0);
  featureRow.setValueWithColumnName('boolean', Math.random() < 0.5 ? false : true);
  featureRow.setValueWithColumnName(
    'blob',
    Buffer.from(
      Math.random()
        .toString(36)
        .replace(/[^a-z]+/g, '')
        .substr(0, 5),
    ),
  );
  featureRow.setValueWithColumnName('integer', Math.round(Math.random() * 500));
  featureRow.setValueWithColumnName(
    'text_limited',
    Math.random()
      .toString(36)
      .replace(/[^a-z]+/g, '')
      .substr(0, 5),
  );
  featureRow.setValueWithColumnName(
    'blob_limited',
    Buffer.from(
      Math.random()
        .toString(36)
        .replace(/[^a-z]+/g, '')
        .substr(0, 5),
    ),
  );
  featureRow.setValueWithColumnName('date', new Date());
  featureRow.setValueWithColumnName('datetime', new Date());
  return featureDao.create(featureRow);
};

GeoPackageUtils.createSchemaExtension = function(geopackage) {
  console.log('Create Schema Extension');
  const schema = new SchemaExtension(geopackage);
  schema.getOrCreateExtension();

  const tc = new TableCreator(geopackage);
  tc.createDataColumnConstraints();
  tc.createDataColumns();
  const dcd = geopackage.dataColumnConstraintsDao;
  const sampleRange = dcd.createObject();
  sampleRange.constraint_name = 'sampleRange';
  sampleRange.constraint_type = DataColumnConstraintsDao.RANGE_TYPE;
  sampleRange.min = 1;
  sampleRange.min_is_inclusive = true;
  sampleRange.max = 10;
  sampleRange.max_is_inclusive = true;
  sampleRange.description = 'sampleRange description';
  dcd.create(sampleRange);

  const sampleEnum1 = dcd.createObject();
  sampleEnum1.constraint_name = 'sampleEnum';
  sampleEnum1.constraint_type = DataColumnConstraintsDao.ENUM_TYPE;
  sampleEnum1.value = '1';
  sampleEnum1.description = 'sampleEnum description';
  dcd.create(sampleEnum1);

  const sampleEnum3 = dcd.createObject();
  sampleEnum3.constraint_name = sampleEnum1.constraint_name;
  sampleEnum3.constraint_type = DataColumnConstraintsDao.ENUM_TYPE;
  sampleEnum3.value = '3';
  sampleEnum3.description = 'sampleEnum description';
  dcd.create(sampleEnum3);

  const sampleEnum5 = dcd.createObject();
  sampleEnum5.constraint_name = sampleEnum1.constraint_name;
  sampleEnum5.constraint_type = DataColumnConstraintsDao.ENUM_TYPE;
  sampleEnum5.value = '5';
  sampleEnum5.description = 'sampleEnum description';
  dcd.create(sampleEnum5);

  const sampleEnum7 = dcd.createObject();
  sampleEnum7.constraint_name = sampleEnum1.constraint_name;
  sampleEnum7.constraint_type = DataColumnConstraintsDao.ENUM_TYPE;
  sampleEnum7.value = '7';
  sampleEnum7.description = 'sampleEnum description';
  dcd.create(sampleEnum7);

  const sampleEnum9 = dcd.createObject();
  sampleEnum9.constraint_name = sampleEnum1.constraint_name;
  sampleEnum9.constraint_type = DataColumnConstraintsDao.ENUM_TYPE;
  sampleEnum9.value = '9';
  sampleEnum9.description = 'sampleEnum description';
  dcd.create(sampleEnum9);

  const sampleGlob = dcd.createObject();
  sampleGlob.constraint_name = 'sampleGlob';
  sampleGlob.constraint_type = DataColumnConstraintsDao.GLOB_TYPE;
  sampleGlob.value = '[1-2][0-9][0-9][0-9]';
  sampleGlob.description = 'sampleGlob description';
  dcd.create(sampleGlob);

  const dc = geopackage.dataColumnsDao;
  const featureTables = geopackage.getFeatureTables();
  for (let i = 0; i < featureTables.length; i++) {
    const tableName = featureTables[i];
    const featureDao = geopackage.getFeatureDao(tableName);
    const table = featureDao.getFeatureTable();

    for (let c = 0; c < table.getUserColumns().getColumns().length; c++) {
      const column = table.getUserColumns().getColumns()[c];
      if (column.primaryKey || column.getType() !== 'INTEGER') continue;
      const dataColumns = dc.createObject();
      dataColumns.table_name = tableName;
      dataColumns.column_name = column.name;
      dataColumns.name = tableName + '_' + column.name;
      dataColumns.title = 'Test Title';
      dataColumns.description = 'Test Description';
      dataColumns.mime_type = 'test mime type';
      dataColumns.constraint_name = 'test constraint';

      const constraintType = c % 3;
      var constraintName;
      let value = 0;
      if (constraintType === 0) {
        constraintName = sampleRange.constraint_name;
        value = 1 + Math.round(Math.random() * 10);
      } else if (constraintType === 1) {
        constraintName = sampleEnum1.constraint_name;
        value = 1 + Math.round(Math.random() * 5) * 2;
      } else if (constraintType === 2) {
        constraintName = sampleGlob.constraint_name;
        value = 1000 + Math.round(Math.random() * 2000);
      }
      dataColumns.constraint_name = constraintName;
      const update = {};
      update[column.name] = value;
      featureDao.update(update);

      dc.create(dataColumns);
      break;
    }
  }
  return geopackage;
};

GeoPackageUtils.createGeometryIndexExtension = function(geopackage) {
  console.log('Create Geometry Index Extension');
  const tables = geopackage.getFeatureTables();

  return tables
    .reduce(function(sequence, table) {
      return sequence.then(function() {
        console.log('Index table ' + table);
        const featureDao = geopackage.getFeatureDao(table);
        const fti = featureDao.featureTableIndex;
        return fti.index();
      });
    }, Promise.resolve())
    .then(function() {
      return geopackage;
    });
};

GeoPackageUtils.createFeatureTileLinkExtension = function(geopackage) {
  return geopackage;
};

GeoPackageUtils.createNonLinearGeometryTypesExtension = function(geopackage) {
  return geopackage;
};

GeoPackageUtils.createRTreeSpatialIndexExtension = function(geopackage) {
  const tables = geopackage.getFeatureTables();

  return tables
    .reduce(function(sequence, table) {
      return sequence.then(function() {
        const featureDao = geopackage.getFeatureDao(table);
        const rtreeIndex = new RTreeIndex(geopackage, featureDao);
        return rtreeIndex.create();
      });
    }, Promise.resolve())
    .then(function() {
      return geopackage;
    });
};

GeoPackageUtils.createRelatedTablesMediaExtension = function(geopackage) {
  const relatedTables = geopackage.relatedTablesExtension;
  let mediaTable = MediaTable.create('media');
  relatedTables.createRelatedTable(mediaTable);

  const mediaDao = relatedTables.getMediaDao(mediaTable);
  mediaTable = mediaDao.mediaTable;

  return GeoPackageUtils.loadFile(path.join(__dirname, 'fixtures', 'BITSystems_Logo.png'))
    .then(function(bitsLogoBuffer) {
      let bitsLogo = mediaDao.newRow();
      bitsLogo.contentType = 'image/png';
      bitsLogo.data = bitsLogoBuffer;
      const bitsRowId = mediaDao.create(bitsLogo);
      bitsLogo = mediaDao.queryForId(bitsRowId);

      const featureDao = geopackage.getFeatureDao('geometry1');
      const rows = featureDao.queryForLike('text', 'BIT Systems%');

      return rows.reduce(function(sequence, row) {
        return sequence.then(function() {
          const featureRow = featureDao.getRow(row);
          return featureDao.linkMediaRow(featureRow, bitsLogo);
        });
      }, Promise.resolve());
    })
    .then(function() {
      return GeoPackageUtils.loadFile(path.join(__dirname, 'fixtures', 'NGA_Logo.png'));
    })
    .then(function(ngaLogoBuffer) {
      const ngaRowId = geopackage.addMedia('media', ngaLogoBuffer, 'image/png');
      const ngaLogo = mediaDao.queryForId(ngaRowId);

      const featureDao = geopackage.getFeatureDao('geometry2');
      const rows = featureDao.queryForLike('text', 'NGA%');

      return rows.reduce(function(sequence, row) {
        return sequence.then(function() {
          const featureRow = featureDao.getRow(row);
          geopackage.linkMedia('geometry2', featureRow.id, 'media', ngaRowId);
          const relationships = geopackage.getLinkedMedia('geometry2', featureRow.id);
          relationships.length.should.be.equal(1);
          relationships[0].id.should.be.equal(ngaRowId);
        });
      }, Promise.resolve());
    })
    .then(function() {
      return geopackage;
    });
};

GeoPackageUtils.createRelatedTablesFeaturesExtension = function(geopackage) {
  const point1FeatureDao = geopackage.getFeatureDao('point1');
  const polygon1FeatureDao = geopackage.getFeatureDao('polygon1');
  const point2FeatureDao = geopackage.getFeatureDao('point2');
  const polygon2FeatureDao = geopackage.getFeatureDao('polygon2');

  // relate the point1 feature to the polygon1 feature
  const point1Row = point1FeatureDao.getRow(point1FeatureDao.queryForAll()[0]);
  const polygon1Row = polygon1FeatureDao.getRow(polygon1FeatureDao.queryForAll()[0]);

  const columns = [];
  let columnIndex = UserMappingTable.numRequiredColumns();
  columns.push(
    UserColumn.createColumn(columnIndex++, DublinCoreType.DATE.name, GeoPackageDataType.DATETIME),
  );
  columns.push(
    UserColumn.createColumn(
      columnIndex++,
      DublinCoreType.DESCRIPTION.name,
      GeoPackageDataType.TEXT,
    ),
  );
  columns.push(
    UserColumn.createColumn(columnIndex++, DublinCoreType.SOURCE.name, GeoPackageDataType.TEXT),
  );
  columns.push(
    UserColumn.createColumn(columnIndex++, DublinCoreType.TITLE.name, GeoPackageDataType.TEXT),
  );

  const userMappingTable = UserMappingTable.create('point1_to_polygon1', columns);
  const mappingColumnValues = {};
  mappingColumnValues[DublinCoreType.DATE.name] = new Date();
  mappingColumnValues[DublinCoreType.DESCRIPTION.name] = 'Description';
  mappingColumnValues[DublinCoreType.SOURCE.name] = 'Source';
  mappingColumnValues[DublinCoreType.TITLE.name] = 'Title';

  point1FeatureDao.linkFeatureRow(point1Row, polygon1Row, userMappingTable, mappingColumnValues);
  const point2Row = point2FeatureDao.getRow(point2FeatureDao.queryForAll()[0]);
  const polygon2Row = polygon2FeatureDao.getRow(polygon2FeatureDao.queryForAll()[0]);
  point2FeatureDao.linkFeatureRow(point2Row, polygon2Row);
  return geopackage;
};

GeoPackageUtils.createRelatedTablesSimpleAttributesExtension = function(geopackage) {
  return geopackage;
};

GeoPackageUtils.loadFile = function(filePath) {
  return new Promise(function(resolve, reject) {
    if (typeof process !== 'undefined' && process.version) {
      fs.readFile(filePath, function(err, data) {
        if (err) {
          return reject(err);
        }
        resolve(data);
      });
    } else {
      const xhr = new XMLHttpRequest();
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
};

GeoPackageUtils.createTiles = function(geopackage) {
  return GeoPackageUtils.addWebMercatorTilesFromPath(
    geopackage,
    'OSM',
    path.join(__dirname, 'fixtures', 'tiles'),
    0,
    3,
  ).then(function() {
    return geopackage;
  });
};

GeoPackageUtils.addWebMercatorTilesFromPath = function(geopackage, tableName, tileBaseDir, minZoom, maxZoom) {
  tableName = tableName || 'OSM';
  const tileMatrixSetBoundingBox = new BoundingBox(
    -20037508.342789244,
    20037508.342789244,
    -20037508.342789244,
    20037508.342789244,
  );
  const contentsBoundingBox = new BoundingBox(
    -20037508.342789244,
    20037508.342789244,
    -20037508.342789244,
    20037508.342789244,
  );
  const contentsSrsId = 3857;
  const tileMatrixSetSrsId = 3857;
  geopackage.spatialReferenceSystemDao.createWebMercator();
  const tileMatrixSet = geopackage.createTileTableWithTableName(tableName, contentsBoundingBox, contentsSrsId, tileMatrixSetBoundingBox, tileMatrixSetSrsId,);
  geopackage.createStandardWebMercatorTileMatrix(tileMatrixSetBoundingBox, tileMatrixSet, minZoom, maxZoom);
  const zooms = [];
  for (let i = minZoom; i <= maxZoom; i++) {
    zooms.push(i);
  }

  return zooms.reduce(function(zoomSequence, zoom) {
    return zoomSequence.then(function() {
      const xfilenames = fs.readdirSync(path.join(tileBaseDir, zoom.toString()));
      return xfilenames.reduce(function(xSequence, xFilename) {
        return xSequence.then(function() {
          const x = Number(xFilename);
          if (Number.isNaN(x)) return;
          const yfilenames = fs.readdirSync(path.join(tileBaseDir, zoom.toString(), x.toString()));
          return yfilenames.reduce(function(ySequence, yFilename) {
            return ySequence.then(function() {
              const y = Number(yFilename.slice(0, yFilename.lastIndexOf('.')));
              if (Number.isNaN(y)) return;
              return GeoPackageUtils.loadFile(
                path.join(__dirname, 'fixtures', 'tiles', zoom.toString(), x.toString(), y.toString() + '.png'),
              ).then(function(image) {
                console.log('Adding tile z: %s x: %s y: %s to %s', zoom, x, y, tableName);
                return geopackage.addTile(image, tableName, zoom, y, x);
              });
            });
          }, Promise.resolve());
        });
      }, Promise.resolve());
    });
  }, Promise.resolve())
    .then(function() {
      return geopackage;
    });
};

GeoPackageUtils.createWebPExtension = function(geopackage) {
  console.log('Creating WebP Extension');
  const tableName = 'webp_tiles';

  const webpExtension = new WebPExtension(geopackage, tableName);
  webpExtension.getOrCreateExtension();

  const tileMatrixSetBoundingBox = new BoundingBox(
    -11667347.997449303,
    4824705.2253603265,
    -11666125.00499674,
    4825928.217812888,
  );
  const contentsBoundingBox = new BoundingBox(
    -11667347.997449303,
    4824705.2253603265,
    -11666125.00499674,
    4825928.217812888,
  );

  const contentsSrsId = 3857;
  const tileMatrixSetSrsId = 3857;
  geopackage.spatialReferenceSystemDao.createWebMercator();
  let tileMatrixSet = geopackage.createTileTableWithTableName(tableName, contentsBoundingBox, contentsSrsId, tileMatrixSetBoundingBox, tileMatrixSetSrsId);
  geopackage.createStandardWebMercatorTileMatrix(tileMatrixSetBoundingBox, tileMatrixSet, 15, 15);
  return GeoPackageUtils.loadFile(path.join(__dirname, 'fixtures', 'tiles', '15', '6844', '12438.webp'))
    .then(function(image) {
      return geopackage.addTile(image, tableName, 15, 12438, 6844);
    })
    .then(function() {
      return geopackage;
    });
};

GeoPackageUtils.createAttributes = function(geopackage) {
  console.log('Creating Attributes table');
  const tableName = 'attributes';

  const columns = [];
  let columnNumber = 0;
  columns.push(UserColumn.createPrimaryKeyColumn(columnNumber++, 'id'));
  columns.push(
    UserColumn.createColumn(columnNumber++, 'text', GeoPackageDataType.TEXT, false, ''),
  );
  columns.push(
    UserColumn.createColumn(columnNumber++, 'real', GeoPackageDataType.REAL, false, null),
  );
  columns.push(
    UserColumn.createColumn(columnNumber++, 'boolean', GeoPackageDataType.BOOLEAN, false, null),
  );
  columns.push(
    UserColumn.createColumn(columnNumber++, 'blob', GeoPackageDataType.BLOB, false, null),
  );
  columns.push(
    UserColumn.createColumn(columnNumber++, 'integer', GeoPackageDataType.INTEGER, false, null),
  );
  columns.push(
    UserColumn.createColumn(columnNumber++, 'text_limited', GeoPackageDataType.TEXT, false, null),
  );
  columns.push(
    UserColumn.createColumn(columnNumber++, 'blob_limited', GeoPackageDataType.BLOB, false, null),
  );
  columns.push(
    UserColumn.createColumn(columnNumber++, 'date', GeoPackageDataType.DATE, false, null),
  );
  columns.push(
    UserColumn.createColumn(columnNumber++, 'datetime', GeoPackageDataType.DATETIME, false, null),
  );

  const dc = new DataColumns();
  dc.table_name = tableName;
  dc.column_name = 'text';
  dc.name = 'Test Name';
  dc.title = 'Test';
  dc.description = 'Test Description';
  dc.mime_type = 'text/html';
  dc.constraint_name = 'test constraint';

  geopackage.createAttributesTable(tableName, columns, new Constraints(), [dc]);
  const attributeDao = geopackage.getAttributeDao(tableName);

  for (let i = 0; i < 10; i++) {
    const attributeRow = attributeDao.newRow();
    attributeRow.setValueWithColumnName('text', tableName);
    attributeRow.setValueWithColumnName('real', Math.random() * 5000.0);
    attributeRow.setValueWithColumnName('boolean', Math.random() < 0.5 ? false : true);
    attributeRow.setValueWithColumnName(
      'blob',
      Buffer.from(
        Math.random()
          .toString(36)
          .replace(/[^a-z]+/g, '')
          .substr(0, 5),
      ),
    );
    attributeRow.setValueWithColumnName('integer', Math.round(Math.random() * 500));
    attributeRow.setValueWithColumnName(
      'text_limited',
      Math.random()
        .toString(36)
        .replace(/[^a-z]+/g, '')
        .substr(0, 5),
    );
    attributeRow.setValueWithColumnName(
      'blob_limited',
      Buffer.from(
        Math.random()
          .toString(36)
          .replace(/[^a-z]+/g, '')
          .substr(0, 5),
      ),
    );
    attributeRow.setValueWithColumnName('date', new Date());
    attributeRow.setValueWithColumnName('datetime', new Date());
    attributeDao.create(attributeRow);
  }

  const row = {
    text: tableName,
    real: Math.random() * 5000.0,
    boolean: Math.random() < 0.5 ? 0 : 1,
    blob: Buffer.from(
      Math.random()
        .toString(36)
        .replace(/[^a-z]+/g, '')
        .substr(0, 5),
    ),
    integer: Math.round(Math.random() * 500),
    text_limited: Math.random()
      .toString(36)
      .replace(/[^a-z]+/g, '')
      .substr(0, 5),
    blob_limited: Buffer.from(
      Math.random()
        .toString(36)
        .replace(/[^a-z]+/g, '')
        .substr(0, 5),
    ),
    date: new Date().toISOString().slice(0, 10),
    datetime: new Date().toISOString(),
  };
  geopackage.addAttributeRow(tableName, row);

  attributeDao.queryForAll().length.should.be.equal(11);
  return geopackage;
};

GeoPackageUtils.createMetadataExtension = function(geopackage) {
  const metadataExtension = new MetadataExtension(geopackage);
  metadataExtension.getOrCreateExtension();

  geopackage.createMetadataTable();
  geopackage.createMetadataReferenceTable();
  const metadataDao = geopackage.metadataDao;

  const md1 = metadataDao.createObject();
  md1.id = 1;
  md1.md_scope = Metadata.DATASET;
  md1.md_standard_uri = 'TEST_URI_1';
  md1.mime_type = 'text/xml';
  md1.metadata = 'TEST METADATA 1';
  metadataDao.create(md1);

  const md2 = metadataDao.createObject();
  md2.id = 2;
  md2.md_scope = Metadata.FEATURE_TYPE;
  md2.md_standard_uri = 'TEST_URI_2';
  md2.mime_type = 'text/xml';
  md2.metadata = 'TEST METADATA 2';
  metadataDao.create(md2);

  const md3 = metadataDao.createObject();
  md3.id = 3;
  md3.md_scope = Metadata.TILE;
  md3.md_standard_uri = 'TEST_URI_3';
  md3.mime_type = 'text/xml';
  md3.metadata = 'TEST METADATA 3';
  metadataDao.create(md3);

  const metadataReferenceDao = geopackage.metadataReferenceDao;

  const ref1 = metadataReferenceDao.createObject();
  ref1.setReferenceScopeType(MetadataReference.GEOPACKAGE);
  ref1.setMetadata(md1);
  metadataReferenceDao.create(ref1);

  const tileTables = geopackage.getTileTables();
  if (tileTables.length) {
    const ref2 = metadataReferenceDao.createObject();
    ref2.setReferenceScopeType(MetadataReference.TABLE);
    ref2.table_name = tileTables[0];
    ref2.setMetadata(md2);
    ref2.setParentMetadata(md1);
    metadataReferenceDao.create(ref2);
  }

  const featureTables = geopackage.getFeatureTables();
  if (featureTables.length) {
    const ref3 = metadataReferenceDao.createObject();
    ref3.setReferenceScopeType(MetadataReference.ROW_COL);
    ref3.table_name = featureTables[0];
    ref3.column_name = 'geom';
    ref3.row_id_value = 1;
    ref3.setMetadata(md3);
    metadataReferenceDao.create(ref3);
  }
  return geopackage;
};

GeoPackageUtils.createCoverageDataExtension = function(geopackage) {
  return geopackage;
};

GeoPackageUtils.createPropertiesExtension = function(geopackage) {
  return geopackage;
};

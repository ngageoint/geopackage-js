import * as GP from '../index';
import { FeatureConverter } from "@ngageoint/simple-features-geojson-js";
import { GeometryType } from "@ngageoint/simple-features-js";
import {
  AttributesTableMetadata,
  DataColumnConstraintType,
  FeatureIndexManager,
  FeatureIndexType,
  FeatureTableMetadata, FeatureTileTableLinker, MediaTableMetadata, MetadataScopeType, ReferenceScopeType, RelationType,
  RTreeIndexExtension, UserCustomColumn
} from "../index";
import { ContentValues } from "../lib/user/contentValues";
const GeoPackageDataType = GP.GeoPackageDataType,
  GeometryColumns = GP.GeometryColumns,
  GeoPackageGeometryData = GP.GeoPackageGeometryData,
  BoundingBox = GP.BoundingBox,
  FeatureColumn = GP.FeatureColumn,
  DataColumns = GP.DataColumns,
  Metadata = GP.Metadata,
  MetadataReference = GP.MetadataReference,
  CrsWktExtension = GP.CrsWktExtension,
  SchemaExtension = GP.SchemaExtension,
  MetadataExtension = GP.MetadataExtension,
  WebPExtension = GP.WebPExtension,
  Constraints = GP.Constraints,
  TableCreator = GP.GeoPackageTableCreator,
  MediaTable = GP.MediaTable,
  UserMappingTable = GP.UserMappingTable,
  DublinCoreType = GP.DublinCoreType;

const path = require('path'),
  fs = require('fs')
  should = require('chai').should();

const GeoPackageUtils = {};

module.exports = GeoPackageUtils;
export default GeoPackageUtils;

GeoPackageUtils.createCRSWKTExtension = function(geoPackage) {
  console.log('Creating CRS WKT Extension');
  const crs = new CrsWktExtension(geoPackage);
  crs.getOrCreateExtension();
  return geoPackage;
};

GeoPackageUtils.createFeatures = function(geoPackage) {
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

  GeoPackageUtils.createFeatureTableAndAddFeatures(geoPackage, 'point1', [point1], GeometryType.POINT);
  GeoPackageUtils.createFeatureTableAndAddFeatures(geoPackage, 'point2', [point2], GeometryType.POINT);
  GeoPackageUtils.createFeatureTableAndAddFeatures(geoPackage, 'line1', [line1], GeometryType.LINESTRING);
  GeoPackageUtils.createFeatureTableAndAddFeatures(geoPackage, 'line2', [line2], GeometryType.LINESTRING);
  GeoPackageUtils.createFeatureTableAndAddFeatures(geoPackage, 'polygon1', [poly1], GeometryType.POLYGON);
  GeoPackageUtils.createFeatureTableAndAddFeatures(geoPackage, 'polygon2', [poly2], GeometryType.POLYGON);
  GeoPackageUtils.createFeatureTableAndAddFeatures(geoPackage, 'geometry1', [point1, line1, poly1], GeometryType.GEOMETRY);
  GeoPackageUtils.createFeatureTableAndAddFeatures(geoPackage, 'geometry2', [point2, line2, poly2], GeometryType.GEOMETRY);
  return geoPackage;
};

GeoPackageUtils.createFeatureTableAndAddFeatures = function(geoPackage, tableName, features, type) {
  console.log('Creating Feature Table ' + tableName);
  const geometryColumns = new GeometryColumns();
  geometryColumns.setTableName(tableName);
  geometryColumns.setColumnName('geometry');
  geometryColumns.setGeometryType(type);
  geometryColumns.setZ(0);
  geometryColumns.setM(0);
  geometryColumns.setSrsId(4326);

  const boundingBox = new BoundingBox(-180, -80, 180, 80);

  const columns = [];
  let columnNumber = 0;
  columns.push(
    FeatureColumn.createColumnWithIndex(columnNumber++, 'text', GeoPackageDataType.TEXT, false, ''),
  );
  columns.push(
    FeatureColumn.createColumnWithIndex(columnNumber++, 'real', GeoPackageDataType.REAL, false, null),
  );
  columns.push(
    FeatureColumn.createColumnWithIndex(columnNumber++, 'boolean', GeoPackageDataType.BOOLEAN, false, null),
  );
  columns.push(
    FeatureColumn.createColumnWithIndex(columnNumber++, 'blob', GeoPackageDataType.BLOB, false, null),
  );
  columns.push(
    FeatureColumn.createColumnWithIndex(columnNumber++, 'integer', GeoPackageDataType.INTEGER, false, null),
  );
  columns.push(
    FeatureColumn.createColumnWithIndex(
      columnNumber++,
      'text_limited',
      GeoPackageDataType.TEXT,
      false,
      null
    ),
  );
  columns.push(
    FeatureColumn.createColumnWithIndex(
      columnNumber++,
      'blob_limited',
      GeoPackageDataType.BLOB,
      false,
      null,
    ),
  );
  columns.push(
    FeatureColumn.createColumnWithIndex(columnNumber++, 'date', GeoPackageDataType.DATE, false, null),
  );
  columns.push(
    FeatureColumn.createColumnWithIndex(
      columnNumber++,
      'datetime',
      GeoPackageDataType.DATETIME,
      false,
      null,
    ),
  );

  geoPackage.createFeatureTableWithFeatureTableMetadata(FeatureTableMetadata.create(geometryColumns, columns, undefined, boundingBox));
  const featureDao = geoPackage.getFeatureDao(tableName);
  for (let i = 0; i < features.length; i++) {
    const feature = features[i];
    GeoPackageUtils.createFeature(geoPackage, {
      type: 'Feature',
      geometry: feature.geoJson,
      properties: {}
    }, feature.name, featureDao);
  }
  return geoPackage;
};

GeoPackageUtils.createFeature = function(geoPackage, geoJson, name, featureDao) {
  const srs = featureDao.getSrs();
  const featureRow = featureDao.newRow();
  const geometryData = new GeoPackageGeometryData();
  geometryData.setSrsId(srs.getSrsId());
  const geometry = FeatureConverter.toSimpleFeaturesGeometry(geoJson);
  geometryData.setGeometry(geometry);
  featureRow.geometry = geometryData;
  featureRow.setValue('text', name);
  featureRow.setValue('real', Math.random() * 5000.0);
  featureRow.setValue('boolean', Math.random() < 0.5 ? false : true);
  featureRow.setValue(
    'blob',
    Buffer.from(
      Math.random()
        .toString(36)
        .replace(/[^a-z]+/g, '')
        .substr(0, 5),
    ),
  );
  featureRow.setValue('integer', Math.round(Math.random() * 500));
  featureRow.setValue(
    'text_limited',
    Math.random()
      .toString(36)
      .replace(/[^a-z]+/g, '')
      .substr(0, 5),
  );
  featureRow.setValue(
    'blob_limited',
    Buffer.from(
      Math.random()
        .toString(36)
        .replace(/[^a-z]+/g, '')
        .substr(0, 5),
    ),
  );
  featureRow.setValue('date', new Date());
  featureRow.setValue('datetime', new Date());
  return featureDao.create(featureRow);
};

GeoPackageUtils.createSchemaExtension = function(geoPackage) {
  console.log('Create Schema Extension');
  const schema = new SchemaExtension(geoPackage);
  schema.getOrCreateExtension();

  const tc = new TableCreator(geoPackage);
  tc.createDataColumnConstraints();
  tc.createDataColumns();
  const dcd = geoPackage.getDataColumnConstraintsDao();
  const sampleRange = dcd.createObject();
  sampleRange.setConstraintName('sampleRange');
  sampleRange.setConstraintType(DataColumnConstraintType.RANGE);
  sampleRange.setMin(1);
  sampleRange.setMinIsInclusive(true);
  sampleRange.setMax(10);
  sampleRange.setMaxIsInclusive(true);
  sampleRange.setDescription('sampleRange description');
  dcd.create(sampleRange);

  const sampleEnum1 = dcd.createObject();
  sampleEnum1.setConstraintName('sampleEnum');
  sampleEnum1.setConstraintType(DataColumnConstraintType.ENUM);
  sampleEnum1.setValue('1');
  sampleEnum1.setDescription('sampleEnum description');
  dcd.create(sampleEnum1);

  const sampleEnum3 = dcd.createObject();
  sampleEnum3.setConstraintName(sampleEnum1.getConstraintName());
  sampleEnum3.setConstraintType(DataColumnConstraintType.ENUM);
  sampleEnum3.setValue('3');
  sampleEnum3.setDescription('sampleEnum description');
  dcd.create(sampleEnum3);

  const sampleEnum5 = dcd.createObject();
  sampleEnum5.setConstraintName(sampleEnum1.getConstraintName());
  sampleEnum5.setConstraintType(DataColumnConstraintType.ENUM);
  sampleEnum5.setValue('5');
  sampleEnum5.setDescription('sampleEnum description');
  dcd.create(sampleEnum5);

  const sampleEnum7 = dcd.createObject();
  sampleEnum7.setConstraintName(sampleEnum1.getConstraintName());
  sampleEnum7.setConstraintType(DataColumnConstraintType.ENUM);
  sampleEnum7.setValue('7');
  sampleEnum7.setDescription('sampleEnum description');
  dcd.create(sampleEnum7);

  const sampleEnum9 = dcd.createObject();
  sampleEnum9.setConstraintName(sampleEnum1.getConstraintName());
  sampleEnum9.setConstraintType(DataColumnConstraintType.ENUM);
  sampleEnum9.setValue('9');
  sampleEnum9.setDescription('sampleEnum description');
  dcd.create(sampleEnum9);

  const sampleGlob = dcd.createObject();
  sampleGlob.setConstraintName('sampleGlob');
  sampleGlob.setConstraintType(DataColumnConstraintType.GLOB);
  sampleGlob.setValue('[1-2][0-9][0-9][0-9]');
  sampleGlob.setDescription('sampleGlob description');
  dcd.create(sampleGlob);

  const dc = geoPackage.getDataColumnsDao();
  const featureTables = geoPackage.getFeatureTables();
  for (let i = 0; i < featureTables.length; i++) {
    const tableName = featureTables[i];
    const featureDao = geoPackage.getFeatureDao(tableName);
    const table = featureDao.getTable();

    for (let c = 0; c < table.getUserColumns().getColumns().length; c++) {
      const column = table.getUserColumns().getColumns()[c];
      if (column.isPrimaryKey() || column.getType() !== 'INTEGER') continue;
      const dataColumns = dc.createObject();
      dataColumns.setTableName(tableName);
      dataColumns.setColumnName(column.getName());
      dataColumns.setName(tableName + '_' + column.getName());
      dataColumns.setTitle('Test Title');
      dataColumns.setDescription('Test Description');
      dataColumns.setMimeType('test mime type');
      dataColumns.setConstraintName('test constraint');

      const constraintType = c % 3;
      var constraintName;
      let value = 0;
      if (constraintType === 0) {
        constraintName = sampleRange.getConstraintName();
        value = 1 + Math.round(Math.random() * 10);
      } else if (constraintType === 1) {
        constraintName = sampleEnum1.getConstraintName();
        value = 1 + Math.round(Math.random() * 5) * 2;
      } else if (constraintType === 2) {
        constraintName = sampleGlob.getConstraintName();
        value = 1000 + Math.round(Math.random() * 2000);
      }
      dataColumns.setConstraintName(constraintName);

      const update = new ContentValues();
      update.put(column.getName(), value);
      featureDao.updateWithContentValues(update);

      dc.create(dataColumns);
      break;
    }
  }
  return geoPackage;
};

GeoPackageUtils.createGeometryIndexExtension = function(geoPackage) {
  console.log('Create Geometry Index Extension');
  const tables = geoPackage.getFeatureTables();
  tables.forEach(table => {
    const featureDao = geoPackage.getFeatureDao(table);
    const indexManager = new FeatureIndexManager(geoPackage, featureDao);
    indexManager.setIndexLocation(FeatureIndexType.GEOPACKAGE)
    indexManager.index();
  })
  return geoPackage;
};

GeoPackageUtils.createFeatureTileLinkExtension = function(geoPackage) {
  const featureTileLinker = new FeatureTileTableLinker(geoPackage);
  featureTileLinker.link('point1', 'OSM');
  featureTileLinker.getFeatureTablesForTileTable('OSM')[0].should.be.equal('point1');
  featureTileLinker.getTileTablesForFeatureTable('point1')[0].should.be.equal('OSM');
  return geoPackage;
};

GeoPackageUtils.createNonLinearGeometryTypesExtension = function(geoPackage) {
  return geoPackage;
};

GeoPackageUtils.createRTreeSpatialIndexExtension = function(geoPackage) {
  const tables = geoPackage.getFeatureTables();
  tables.forEach(table => {
    const featureDao = geoPackage.getFeatureDao(table);
    const rtreeIndex = new RTreeIndexExtension(geoPackage);
    return rtreeIndex.createWithFeatureTable(featureDao.getTable());
  });
  return geoPackage;
};

GeoPackageUtils.createRelatedTablesMediaExtension = async function(geoPackage) {
  const relatedTables = geoPackage.getRelatedTablesExtension();
  let mediaTable = MediaTable.create(MediaTableMetadata.create('media'));
  relatedTables.createRelatedTable(mediaTable);
  const mediaDao = relatedTables.getMediaDaoWithMediaTable(mediaTable);
  const bitsLogoBuffer = await GeoPackageUtils.loadFile(path.join(__dirname, 'fixtures', 'BITSystems_Logo.png'));

  let bitsLogo = mediaDao.newRow();
  bitsLogo.setContentType('image/png');
  bitsLogo.setData(bitsLogoBuffer);
  const bitsRowId = mediaDao.create(bitsLogo);
  should.exist(mediaDao.queryForIdRow(bitsRowId));
  let featureDao = geoPackage.getFeatureDao('geometry1');
  let rows = featureDao.queryForLike('text', 'BIT Systems%');
  let featureRows = [];
  while (rows.moveToNext()) {
    featureRows.push(rows.getRow());
  }
  rows.close();
  for (const featureRow of featureRows) {
    geoPackage.linkMedia(featureDao.getTableName(), featureRow.getId(), mediaDao.getTableName(), bitsRowId);
  }

  const ngaLogoBuffer = await  GeoPackageUtils.loadFile(path.join(__dirname, 'fixtures', 'NGA_Logo.png'));
  const ngaRowId = geoPackage.addMedia('media', ngaLogoBuffer, 'image/png');
  should.exist(mediaDao.queryForIdRow(ngaRowId));
  featureDao = geoPackage.getFeatureDao('geometry2');
  featureRows = [];
  rows = featureDao.queryForLike('text', 'NGA%');
  while (rows.moveToNext()) {
    featureRows.push(rows.getRow());
  }
  rows.close();
  for (const featureRow of featureRows) {
    geoPackage.linkMedia('geometry2', featureRow.getId(), 'media', ngaRowId);
    const relationships = geoPackage.getLinkedMedia('geometry2', featureRow.getId());
    relationships.length.should.be.equal(1);
    relationships[0].getId().should.be.equal(ngaRowId);
  }
  return geoPackage;
};

GeoPackageUtils.createRelatedTablesFeaturesExtension = function(geoPackage) {
  const point1FeatureDao = geoPackage.getFeatureDao('point1');
  const polygon1FeatureDao = geoPackage.getFeatureDao('polygon1');
  const point2FeatureDao = geoPackage.getFeatureDao('point2');
  const polygon2FeatureDao = geoPackage.getFeatureDao('polygon2');

  // relate the point1 feature to the polygon1 feature
  const point1ResultSet = point1FeatureDao.queryForAll();
  point1ResultSet.moveToNext();
  const point1Row = point1ResultSet.getRow();
  point1ResultSet.close()
  const polygon1ResultSet = polygon1FeatureDao.queryForAll();
  polygon1ResultSet.moveToNext();
  const polygon1Row = polygon1ResultSet.getRow();
  polygon1ResultSet.close();

  const rte = geoPackage.getRelatedTablesExtension();
  rte.getOrCreateExtension();

  const columns = [];
  columns.push(UserCustomColumn.createColumn(DublinCoreType.DATE.getName(), GeoPackageDataType.DATETIME));
  columns.push(UserCustomColumn.createColumn(DublinCoreType.DESCRIPTION.getName(), GeoPackageDataType.TEXT));
  columns.push(UserCustomColumn.createColumn(DublinCoreType.SOURCE.getName(), GeoPackageDataType.TEXT));
  columns.push(UserCustomColumn.createColumn(DublinCoreType.TITLE.getName(), GeoPackageDataType.TEXT));

  const userMappingTable = UserMappingTable.create('point1_to_polygon1', columns);
  const mappingColumnValues = {};
  mappingColumnValues[DublinCoreType.DATE.getName()] = new Date();
  mappingColumnValues[DublinCoreType.DESCRIPTION.getName()] = 'Description';
  mappingColumnValues[DublinCoreType.SOURCE.getName()] = 'Source';
  mappingColumnValues[DublinCoreType.TITLE.getName()] = 'Title';

  geoPackage.linkRelatedRows(point1FeatureDao.getTableName(), point1Row.getId(), polygon1FeatureDao.getTableName(), polygon1Row.getId(), RelationType.FEATURES, userMappingTable, mappingColumnValues);
  // relate the point1 feature to the polygon1 feature
  const point2ResultSet = point1FeatureDao.queryForAll();
  point2ResultSet.moveToNext();
  const point2Row = point2ResultSet.getRow();
  point2ResultSet.close()
  const polygon2ResultSet = polygon1FeatureDao.queryForAll();
  polygon2ResultSet.moveToNext();
  const polygon2Row = polygon2ResultSet.getRow();
  polygon2ResultSet.close();
  geoPackage.linkFeature(point2FeatureDao.getTableName(), point2Row.getId(), polygon2FeatureDao.getTableName(), polygon2Row.getId());
  return geoPackage;
};

GeoPackageUtils.createRelatedTablesSimpleAttributesExtension = function(geoPackage) {
  return geoPackage;
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

GeoPackageUtils.createTiles = async function(geoPackage) {
  await GeoPackageUtils.addWebMercatorTilesFromPath(
    geoPackage,
    'OSM',
    path.join(__dirname, 'fixtures', 'tiles'),
    0,
    3,
  )
  return geoPackage;
};

GeoPackageUtils.addWebMercatorTilesFromPath = async function(geoPackage, tableName, tileBaseDir, minZoom, maxZoom) {
  tableName = tableName || 'OSM';
  const tileMatrixSetBoundingBox = new BoundingBox(
    -20037508.342789244,
    -20037508.342789244,
    20037508.342789244,
    20037508.342789244,
  );
  const contentsBoundingBox = new BoundingBox(
    -20037508.342789244,
    -20037508.342789244,
    20037508.342789244,
    20037508.342789244,
  );
  const contentsSrsId = 3857;
  const tileMatrixSetSrsId = 3857;
  geoPackage.getSpatialReferenceSystemDao().createWebMercator();
  const tileMatrixSet = geoPackage.createTileTableWithTableName(tableName, contentsBoundingBox, contentsSrsId, tileMatrixSetBoundingBox, tileMatrixSetSrsId,);
  geoPackage.createStandardWebMercatorTileMatrix(tileMatrixSetBoundingBox, tileMatrixSet, minZoom, maxZoom);
  for (let zoom = minZoom; zoom <= maxZoom; zoom++) {
    const xfilenames = fs.readdirSync(path.join(tileBaseDir, zoom.toString()));
    for (const xFilename of xfilenames) {
      const x = Number(xFilename);
      if (Number.isNaN(x)) continue;
      const yfilenames = fs.readdirSync(path.join(tileBaseDir, zoom.toString(), x.toString()));
      for (const yFilename of yfilenames) {
        const y = Number(yFilename);
        if (Number.isNaN(y)) continue;
        const image = await GeoPackageUtils.loadFile(path.join(__dirname, 'fixtures', 'tiles', zoom.toString(), x.toString(), y.toString() + '.png'))
        return geoPackage.addTile(image, tableName, zoom, y, x);
      }
    }
  }
  return geoPackage;
};

GeoPackageUtils.createWebPExtension = function(geoPackage) {
  console.log('Creating WebP Extension');
  const tableName = 'webp_tiles';

  const webpExtension = new WebPExtension(geoPackage, tableName);
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
  geoPackage.spatialReferenceSystemDao.createWebMercator();
  let tileMatrixSet = geoPackage.createTileTableWithTableName(tableName, contentsBoundingBox, contentsSrsId, tileMatrixSetBoundingBox, tileMatrixSetSrsId);
  geoPackage.createStandardWebMercatorTileMatrix(tileMatrixSetBoundingBox, tileMatrixSet, 15, 15);
  return GeoPackageUtils.loadFile(path.join(__dirname, 'fixtures', 'tiles', '15', '6844', '12438.webp'))
    .then(function(image) {
      return geoPackage.addTile(image, tableName, 15, 12438, 6844);
    })
    .then(function() {
      return geoPackage;
    });
};

GeoPackageUtils.createAttributes = function(geoPackage) {
  console.log('Creating Attributes table');
  const tableName = 'attributes';

  const columns = [];
  columns.push(UserCustomColumn.createColumn('text', GeoPackageDataType.TEXT, false, ''));
  columns.push(UserCustomColumn.createColumn('real', GeoPackageDataType.REAL, false, null));
  columns.push(UserCustomColumn.createColumn('boolean', GeoPackageDataType.BOOLEAN, false, null));
  columns.push(UserCustomColumn.createColumn('blob', GeoPackageDataType.BLOB, false, null));
  columns.push(UserCustomColumn.createColumn('integer', GeoPackageDataType.INTEGER, false, null));
  columns.push(UserCustomColumn.createColumn('text_limited', GeoPackageDataType.TEXT, false, null));
  columns.push(UserCustomColumn.createColumn('blob_limited', GeoPackageDataType.BLOB, false, null));
  columns.push(UserCustomColumn.createColumn('date', GeoPackageDataType.DATE, false, null));
  columns.push(UserCustomColumn.createColumn('datetime', GeoPackageDataType.DATETIME, false, null));

  const schemaExtension = new SchemaExtension(geoPackage);
  schemaExtension.getOrCreateExtension();
  schemaExtension.createDataColumnsTable();
  schemaExtension.createDataColumnConstraintsTable();

  const dc = new DataColumns();
  dc.setTableName(tableName);
  dc.setColumnName('text');
  dc.setName('Test Name');
  dc.setTitle('Test');
  dc.setDescription('Test Description');
  dc.setMimeType('text/html');
  dc.setConstraintName('test constraint');

  geoPackage.createAttributesTableWithMetadata(AttributesTableMetadata.create(tableName, columns, new Constraints(), 'id', false));

  const dataColumnsDao = schemaExtension.getDataColumnsDao();
  dataColumnsDao.create(dc);

  const attributeDao = geoPackage.getAttributesDao(tableName);

  for (let i = 0; i < 10; i++) {
    const attributeRow = attributeDao.newRow();
    attributeRow.setValue('text', tableName);
    attributeRow.setValue('real', Math.random() * 5000.0);
    attributeRow.setValue('boolean', Math.random() < 0.5 ? false : true);
    attributeRow.setValue(
      'blob',
      Buffer.from(
        Math.random()
          .toString(36)
          .replace(/[^a-z]+/g, '')
          .substr(0, 5),
      ),
    );
    attributeRow.setValue('integer', Math.round(Math.random() * 500));
    attributeRow.setValue(
      'text_limited',
      Math.random()
        .toString(36)
        .replace(/[^a-z]+/g, '')
        .substr(0, 5),
    );
    attributeRow.setValue(
      'blob_limited',
      Buffer.from(
        Math.random()
          .toString(36)
          .replace(/[^a-z]+/g, '')
          .substr(0, 5),
      ),
    );
    attributeRow.setValue('date', new Date());
    attributeRow.setValue('datetime', new Date());
    attributeDao.create(attributeRow);
  }

  const row = attributeDao.newRow();
  row.setValue('text', tableName);
  row.setValue('real', Math.random() * 5000.0);
  row.setValue('boolean', Math.random() < 0.5 ? 0 : 1);
  row.setValue('blob', Buffer.from(
    Math.random()
      .toString(36)
      .replace(/[^a-z]+/g, '')
      .substr(0, 5),
  ));
  row.setValue('integer', Math.round(Math.random() * 500));
  row.setValue('text_limited', Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, '')
    .substr(0, 5));
  row.setValue('blob_limited', Buffer.from(
    Math.random()
      .toString(36)
      .replace(/[^a-z]+/g, '')
      .substr(0, 5),
  ));
  row.setValue('date', new Date());
  row.setValue('datetime', new Date());
  attributeDao.create(row);
  const attributesResultSet = attributeDao.queryForAll();
  attributesResultSet.getCount().should.be.equal(11);
  attributesResultSet.close();
  return geoPackage;
};

GeoPackageUtils.createMetadataExtension = function(geoPackage) {
  const metadataExtension = new MetadataExtension(geoPackage);
  metadataExtension.getOrCreateExtension();

  geoPackage.createMetadataTable();
  geoPackage.createMetadataReferenceTable();
  const metadataDao = geoPackage.getMetadataDao();

  const md1 = metadataDao.newRow();
  md1.setId(1);
  md1.setMetadataScopeType(MetadataScopeType.DATASET);
  md1.setStandardUri('TEST_URI_1');
  md1.setMimeType('text/xml');
  md1.setMetadata('TEST METADATA 1');
  metadataDao.create(md1);

  const md2 = metadataDao.newRow();
  md2.setId(2);
  md2.setMetadataScopeType(MetadataScopeType.FEATURE_TYPE);
  md2.setStandardUri('TEST_URI_2');
  md2.setMimeType('text/xml');
  md2.setMetadata('TEST METADATA 2');
  metadataDao.create(md2);

  const md3 = metadataDao.newRow();
  md3.setId(3);
  md3.setMetadataScopeType(MetadataScopeType.TILE);
  md3.setStandardUri('TEST_URI_3');
  md3.setMimeType('text/xml');
  md3.setMetadata('TEST METADATA 3');
  metadataDao.create(md3);

  const metadataReferenceDao = geoPackage.metadataReferenceDao;

  const ref1 = metadataReferenceDao.createObject();
  ref1.setReferenceScopeType(ReferenceScopeType.GEOPACKAGE);
  ref1.setMetadata(md1);
  metadataReferenceDao.create(ref1);

  const tileTables = geoPackage.getTileTables();
  if (tileTables.length) {
    const ref2 = metadataReferenceDao.createObject();
    ref2.setReferenceScopeType(ReferenceScopeType.TABLE);
    ref2.setTableName(tileTables[0]);
    ref2.setMetadata(md2);
    ref2.setParentMetadata(md1);
    metadataReferenceDao.create(ref2);
  }

  const featureTables = geoPackage.getFeatureTables();
  if (featureTables.length) {
    const ref3 = metadataReferenceDao.createObject();
    ref3.setReferenceScopeType(ReferenceScopeType.ROW_COL);
    ref3.setTableName(featureTables[0]);
    ref3.setColumnName('geom');
    ref3.setRowIdValue(1);
    ref3.setMetadata(md3);
    metadataReferenceDao.create(ref3);
  }
  return geoPackage;
};

GeoPackageUtils.createCoverageDataExtension = function(geoPackage) {
  return geoPackage;
};

GeoPackageUtils.createPropertiesExtension = function(geoPackage) {
  return geoPackage;
};

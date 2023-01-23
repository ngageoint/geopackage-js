import * as GP from '../index';
import { FeatureConverter } from "@ngageoint/simple-features-geojson-js";
import {
  CompoundCurve,
  CurvePolygon,
  GeometryCollection,
  GeometryType, LineString, MultiLineString, MultiPoint,
  MultiPolygon,
  Point, Polygon, PolyhedralSurface, TIN, Triangle
} from "@ngageoint/simple-features-js";
import {
  AttributesTableMetadata,
  DataColumnConstraintType,
  FeatureIndexManager,
  FeatureIndexType,
  FeatureTableMetadata,
  FeatureTileTableLinker,
  GeometryExtensions,
  MediaTableMetadata,
  MetadataScopeType,
  ReferenceScopeType,
  RelationType,
  RTreeIndexExtension,
  SimpleAttributesTableMetadata,
  UserCustomColumn
} from "../index";
import { ContentValues } from "../lib/user/contentValues";
const GeoPackageDataType = GP.GeoPackageDataType,
  GeometryColumns = GP.GeometryColumns,
  GeoPackageGeometryData = GP.GeoPackageGeometryData,
  BoundingBox = GP.BoundingBox,
  FeatureColumn = GP.FeatureColumn,
  DataColumns = GP.DataColumns,
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
  const bitSystems = new Point(-104.801918, 39.720014);
  const nga = new Point(-77.196736, 38.75337);

  const lockheedDrive = new LineString();
  lockheedDrive.addPoint(new Point(-104.800614, 39.720721));
  lockheedDrive.addPoint(new Point(-104.802174, 39.720726));
  lockheedDrive.addPoint(new Point(-104.802584, 39.72066));
  lockheedDrive.addPoint(new Point(-104.803088, 39.720477));
  lockheedDrive.addPoint(new Point(-104.803474, 39.720209));

  const ngaLine = new LineString();
  ngaLine.addPoints([
    new Point(-77.19665, 38.756501),
    new Point(-77.196414, 38.755979),
    new Point(-77.195518, 38.755208),
    new Point(-77.195303, 38.755272),
    new Point(-77.195351, 38.755459),
    new Point(-77.195863, 38.755697),
    new Point(-77.196328, 38.756069),
    new Point(-77.196568, 38.756526),
  ]);

  const bitsPolygon = new Polygon();
  bitsPolygon.addRing(new LineString([
    new Point(-104.802246, 39.720343),
    new Point(-104.802246, 39.719753),
    new Point(-104.802183, 39.719754),
    new Point(-104.802184, 39.719719),
    new Point(-104.802138, 39.719694),
    new Point(-104.802097, 39.719691),
    new Point(-104.802096, 39.719648),
    new Point(-104.801646, 39.719648),
    new Point(-104.801644, 39.719722),
    new Point(-104.80155, 39.719723),
    new Point(-104.801549, 39.720207),
    new Point(-104.801648, 39.720207),
    new Point(-104.801648, 39.720341),
    new Point(-104.802246, 39.720343),
  ]));

  const ngaVisitorCenterPolygon = new Polygon();
  ngaVisitorCenterPolygon.addRing(new LineString([
    new Point(-77.195299, 38.755159),
    new Point(-77.195203, 38.75508),
    new Point(-77.19541, 38.75493),
    new Point(-77.19535, 38.754884),
    new Point(-77.195228, 38.754966),
    new Point(-77.195135, 38.754889),
    new Point(-77.195048, 38.754956),
    new Point(-77.194986, 38.754906),
    new Point(-77.194897, 38.754976),
    new Point(-77.194953, 38.755025),
    new Point(-77.194763, 38.755173),
    new Point(-77.194827, 38.755224),
    new Point(-77.195012, 38.755082),
    new Point(-77.195041, 38.755104),
    new Point(-77.195028, 38.755116),
    new Point(-77.19509, 38.755167),
    new Point(-77.195106, 38.755154),
    new Point(-77.195205, 38.755233),
    new Point(-77.195299, 38.755159),
  ]));

  const point1 = {
    geometry: bitSystems,
    name: 'BIT Systems',
  };
  const point2 = {
    geometry: nga,
    name: 'NGA',
  };
  const line1 = {
    geometry: lockheedDrive,
    name: 'East Lockheed Drive',
  };
  const line2 = {
    geometry: ngaLine,
    name: 'NGA',
  };
  const poly1 = {
    geometry: bitsPolygon,
    name: 'BIT Systems',
  };
  const poly2 = {
    geometry: ngaVisitorCenterPolygon,
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

GeoPackageUtils.createNonLinearFeatures = function(geoPackage) {
  console.log('Creating Non-Linear Features');

  GeoPackageUtils.createFeatureTableAndAddFeatures(geoPackage, "table_" + GeometryType.nameFromType(GeometryType.CIRCULARSTRING), [{
    geometry: GeoPackageUtils.createCompoundCurve(GeoPackageUtils.coinFlip(), GeoPackageUtils.coinFlip()),
    name: 'Circular String'
  }], GeometryType.CIRCULARSTRING);
  GeoPackageUtils.createFeatureTableAndAddFeatures(geoPackage, "table_" + GeometryType.nameFromType(GeometryType.COMPOUNDCURVE), [{
    geometry: GeoPackageUtils.createCompoundCurve(GeoPackageUtils.coinFlip(), GeoPackageUtils.coinFlip()),
    name: 'Compound Curve'
  }], GeometryType.COMPOUNDCURVE);
  GeoPackageUtils.createFeatureTableAndAddFeatures(geoPackage, "table_" + GeometryType.nameFromType(GeometryType.CURVEPOLYGON), [{
    geometry: GeoPackageUtils.createCurvePolygon(GeoPackageUtils.coinFlip(), GeoPackageUtils.coinFlip()),
    name: 'Curve Polygon'
  }], GeometryType.CURVEPOLYGON);
  GeoPackageUtils.createFeatureTableAndAddFeatures(geoPackage, "table_" + GeometryType.nameFromType(GeometryType.MULTICURVE), [{
    geometry: GeoPackageUtils.createMultiLineString(GeoPackageUtils.coinFlip(), GeoPackageUtils.coinFlip()),
    name: 'Multi Curve'
  }], GeometryType.MULTICURVE);
  GeoPackageUtils.createFeatureTableAndAddFeatures(geoPackage, "table_" + GeometryType.nameFromType(GeometryType.MULTISURFACE), [{
    geometry: GeoPackageUtils.createMultiPolygon(GeoPackageUtils.coinFlip(), GeoPackageUtils.coinFlip()),
    name: 'Multi Surface'
  }], GeometryType.MULTISURFACE);
  GeoPackageUtils.createFeatureTableAndAddFeatures(geoPackage, "table_" + GeometryType.nameFromType(GeometryType.CURVE), [{
    geometry: GeoPackageUtils.createCompoundCurve(GeoPackageUtils.coinFlip(), GeoPackageUtils.coinFlip()),
    name: 'Curve'
  }], GeometryType.CURVE);
  GeoPackageUtils.createFeatureTableAndAddFeatures(geoPackage, "table_" + GeometryType.nameFromType(GeometryType.SURFACE), [
    {
      geometry: GeoPackageUtils.createPolygon(GeoPackageUtils.coinFlip(), GeoPackageUtils.coinFlip()),
      name: 'Surface'
    },
    {
      geometry: GeoPackageUtils.createPolyhedralSurface(),
      name: 'Surface'
    },
    {
      geometry: GeoPackageUtils.createTin(),
      name: 'SURFACE'
    },
    {
      geometry: GeoPackageUtils.createTriangle(),
      name: 'Surface'
    }], GeometryType.SURFACE);
  return geoPackage;
};

GeoPackageUtils.createFeatureTableAndAddFeatures = function(geoPackage, tableName, features, type) {
  console.log('Creating Feature Table ' + tableName);
  const geometryColumns = new GeometryColumns();
  geometryColumns.setTableName(tableName);
  geometryColumns.setColumnName('geometry');
  geometryColumns.setGeometryType(type);
  let hasZ = false;
  let hasM = false
  for (let i = 0; i < features.length; i++) {
    const feature = features[i];
    hasZ = feature.geometry.hasZ || hasZ;
    hasM = feature.geometry.hasM || hasM;
  }
  geometryColumns.setZ(hasZ ? 1 : 0);
  geometryColumns.setM(hasM ? 1 : 0);
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
    GeoPackageUtils.createFeature(geoPackage, feature.geometry, feature.name, featureDao);
  }
  return geoPackage;
};

GeoPackageUtils.createFeature = function(geoPackage, geometry, name, featureDao) {
  const srs = featureDao.getSrs();
  const featureRow = featureDao.newRow();
  const geometryData = new GeoPackageGeometryData();
  geometryData.setSrsId(srs.getSrsId());
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
  const geometryTypeExtension = new GeometryExtensions(geoPackage);
  const geometryTypes = [GeometryType.CIRCULARSTRING, GeometryType.COMPOUNDCURVE, GeometryType.CURVEPOLYGON, GeometryType.MULTICURVE, GeometryType.MULTISURFACE, GeometryType.CURVE, GeometryType.SURFACE];
  geometryTypes.forEach(geometryType => {
    const tableName = "table_" + GeometryType.nameFromType(geometryType);
    const columnName = "geometry";
    geometryTypeExtension.getOrCreateGeometryExtension(tableName, columnName, geometryType, 'nga');
  });

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
  console.log('Creating Related Tables Media Extension');

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
  console.log('Creating Related Tables Tiles Feature Extension');

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

GeoPackageUtils.createRelatedTablesTilesExtension = function(geoPackage) {
  console.log('Creating Related Tables Tiles Extension');
  const tilesA = geoPackage.getTileDao('OSM');
  const tilesB = geoPackage.getTileDao('OSM_2');

  const rte = geoPackage.getRelatedTablesExtension();
  rte.getOrCreateExtension();

  const columns = [];
  columns.push(UserCustomColumn.createColumn(DublinCoreType.DATE.getName(), GeoPackageDataType.DATETIME));
  columns.push(UserCustomColumn.createColumn(DublinCoreType.DESCRIPTION.getName(), GeoPackageDataType.TEXT));
  columns.push(UserCustomColumn.createColumn(DublinCoreType.SOURCE.getName(), GeoPackageDataType.TEXT));
  columns.push(UserCustomColumn.createColumn(DublinCoreType.TITLE.getName(), GeoPackageDataType.TEXT));

  UserMappingTable.create('OSM_OSM_2', columns);
  const mappingColumnValues = {};
  mappingColumnValues[DublinCoreType.DATE.getName()] = new Date();
  mappingColumnValues[DublinCoreType.DESCRIPTION.getName()] = 'Description';
  mappingColumnValues[DublinCoreType.SOURCE.getName()] = 'Source';
  mappingColumnValues[DublinCoreType.TITLE.getName()] = 'Title';

  const tileResultSet = tilesA.queryForAll();
  const tileRowIds = [];
  while (tileResultSet.moveToNext()) {
    const tileRow = tileResultSet.getRow();
    tileRowIds.push(tileRow.getId());
  }
  tileResultSet.close();

  for (let i = 0; i < tileRowIds.length; i++) {
    const id = tileRowIds[i];
    geoPackage.linkTile('OSM', id, 'OSM_2', id);
    const relationships = geoPackage.getLinkedTiles('OSM', id);
    relationships.length.should.be.equal(1);
    relationships[0].getId().should.be.equal(id);
  }

  return geoPackage;
};

GeoPackageUtils.createRelatedTablesAttributesExtension = function(geoPackage) {
  console.log('Creating Related Tables Attributes Extension');

  const point1FeatureDao = geoPackage.getFeatureDao('point1');
  // relate the point1 feature to the polygon1 feature
  const point1ResultSet = point1FeatureDao.queryForAll();
  point1ResultSet.moveToNext();
  const point1Row = point1ResultSet.getRow();
  point1ResultSet.close()

  const rte = geoPackage.getRelatedTablesExtension();
  rte.getOrCreateExtension();

  const columns = [];
  columns.push(UserCustomColumn.createColumn(DublinCoreType.DATE.getName(), GeoPackageDataType.DATETIME));
  columns.push(UserCustomColumn.createColumn(DublinCoreType.DESCRIPTION.getName(), GeoPackageDataType.TEXT));
  columns.push(UserCustomColumn.createColumn(DublinCoreType.SOURCE.getName(), GeoPackageDataType.TEXT));
  columns.push(UserCustomColumn.createColumn(DublinCoreType.TITLE.getName(), GeoPackageDataType.TEXT));

  UserMappingTable.create('point1_to_attributes', columns);
  const mappingColumnValues = {};
  mappingColumnValues[DublinCoreType.DATE.getName()] = new Date();
  mappingColumnValues[DublinCoreType.DESCRIPTION.getName()] = 'Description';
  mappingColumnValues[DublinCoreType.SOURCE.getName()] = 'Source';
  mappingColumnValues[DublinCoreType.TITLE.getName()] = 'Title';

  const attributesDao = geoPackage.getAttributesDao('attributes');
  const resultSet = attributesDao.queryForAll();
  resultSet.moveToNext();
  const row = resultSet.getRow();
  resultSet.close();

  geoPackage.linkAttributes('point1', point1Row.getId(), 'attributes', row.getId());
  const relationships = geoPackage.getLinkedAttributes('point1', point1Row.getId());
  relationships.length.should.be.equal(1);
  relationships[0].getId().should.be.equal(row.getId());

  return geoPackage;
};


GeoPackageUtils.createRelatedTablesSimpleAttributesExtension = function(geoPackage) {
  console.log('Creating Related Tables Simple Attributes Extension');

  const point1FeatureDao = geoPackage.getFeatureDao('point1');
  // relate the point1 feature to the polygon1 feature
  const point1ResultSet = point1FeatureDao.queryForAll();
  point1ResultSet.moveToNext();
  const point1Row = point1ResultSet.getRow();
  point1ResultSet.close()

  const rte = geoPackage.getRelatedTablesExtension();
  rte.getOrCreateExtension();

  const columns = [];
  columns.push(UserCustomColumn.createColumn(DublinCoreType.DATE.getName(), GeoPackageDataType.DATETIME));
  columns.push(UserCustomColumn.createColumn(DublinCoreType.DESCRIPTION.getName(), GeoPackageDataType.TEXT));
  columns.push(UserCustomColumn.createColumn(DublinCoreType.SOURCE.getName(), GeoPackageDataType.TEXT));
  columns.push(UserCustomColumn.createColumn(DublinCoreType.TITLE.getName(), GeoPackageDataType.TEXT));

  UserMappingTable.create('point1_to_simple_attributes', columns);
  const mappingColumnValues = {};
  mappingColumnValues[DublinCoreType.DATE.getName()] = new Date();
  mappingColumnValues[DublinCoreType.DESCRIPTION.getName()] = 'Description';
  mappingColumnValues[DublinCoreType.SOURCE.getName()] = 'Source';
  mappingColumnValues[DublinCoreType.TITLE.getName()] = 'Title';

  const simpleAttributesDao = geoPackage.getSimpleAttributesDao('simple_attributes');
  const resultSet = simpleAttributesDao.queryForAll();
  resultSet.moveToNext();
  const row = resultSet.getRow();
  resultSet.close();

  geoPackage.linkSimpleAttributes('point1', point1Row.getId(), 'simple_attributes', row.getId());
  const relationships = geoPackage.getLinkedSimpleAttributes('point1', point1Row.getId());
  relationships.length.should.be.equal(1);
  relationships[0].getId().should.be.equal(row.getId());

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
  await GeoPackageUtils.addWebMercatorTilesFromPath(
    geoPackage,
    'OSM_2',
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
  const tileMatrixSet = geoPackage.createTileTableWithTableName(tableName, contentsBoundingBox, contentsSrsId, tileMatrixSetBoundingBox, tileMatrixSetSrsId);
  geoPackage.createStandardWebMercatorTileMatrix(tileMatrixSetBoundingBox, tileMatrixSet, minZoom, maxZoom);
  for (let zoom = minZoom; zoom <= maxZoom; zoom++) {
    const xfilenames = fs.readdirSync(path.join(tileBaseDir, zoom.toString()));
    for (const xFilename of xfilenames) {
      const x = Number(xFilename);
      if (Number.isNaN(x)) continue;
      const yfilenames = fs.readdirSync(path.join(tileBaseDir, zoom.toString(), xFilename));
      for (const yFilename of yfilenames) {
        const y = Number(yFilename.substring(0, 1));
        if (Number.isNaN(y)) continue;
        const data = await GeoPackageUtils.loadFile(path.join(__dirname, 'fixtures', 'tiles', zoom.toString(), x.toString(), y.toString() + '.png'))
        geoPackage.addTile(data, tableName, zoom, y, x);
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

GeoPackageUtils.createSimpleAttributes = function(geoPackage) {
  console.log('Creating Simple Attributes table');
  const tableName = 'simple_attributes';

  const columns = [];
  columns.push(UserCustomColumn.createColumn('text', GeoPackageDataType.TEXT, true));
  columns.push(UserCustomColumn.createColumn('real', GeoPackageDataType.REAL, true));
  columns.push(UserCustomColumn.createColumn('integer', GeoPackageDataType.INTEGER, true));
  columns.push(UserCustomColumn.createColumn('text_limited', GeoPackageDataType.TEXT, true));

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

  geoPackage.createSimpleAttributesWithMetadata(SimpleAttributesTableMetadata.create(tableName, columns));

  const dataColumnsDao = schemaExtension.getDataColumnsDao();
  dataColumnsDao.create(dc);

  const simpleAttributesDao = geoPackage.getSimpleAttributesDao(tableName);

  for (let i = 0; i < 10; i++) {
    const simpleAttributesRow = simpleAttributesDao.newRow();
    simpleAttributesRow.setValue('text', tableName);
    simpleAttributesRow.setValue('real', Math.random() * 5000.0);
    simpleAttributesRow.setValue('integer', Math.round(Math.random() * 500));
    simpleAttributesRow.setValue(
      'text_limited',
      Math.random()
        .toString(36)
        .replace(/[^a-z]+/g, '')
        .substr(0, 5),
    );
    simpleAttributesDao.create(simpleAttributesRow);
  }

  const row = simpleAttributesDao.newRow();
  row.setValue('text', tableName);
  row.setValue('real', Math.random() * 5000.0);
  row.setValue('integer', Math.round(Math.random() * 500));
  row.setValue('text_limited', Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, '')
    .substr(0, 5));
  simpleAttributesDao.create(row);
  const attributesResultSet = simpleAttributesDao.queryForAll();
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



/**
 * Create a random point
 *
 * @param hasZ
 * @param hasM
 * @return Point
 */
GeoPackageUtils.createPoint = function(hasZ, hasM) {
  let x = Math.random() * 180.0 * (Math.random() < .5 ? 1 : -1);
  let y = Math.random() * 90.0 * (Math.random() < .5 ? 1 : -1);
  let point = new Point(hasZ, hasM, x, y);
  if (hasZ) {
    point.z = Math.random() * 1000.0;
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
GeoPackageUtils.createLineString = function(hasZ, hasM, ring = false) {
  const lineString = new LineString(hasZ, hasM);
  const num = 2 + Math.round(Math.random() * 9);
  for (let i = 0; i < num; i++) {
    lineString.addPoint(GeoPackageUtils.createPoint(hasZ, hasM));
  }
  if (ring) {
    lineString.addPoint(lineString.points[0]);
  }
  return lineString;
}

/**
 * Create a random polygon
 * @param hasZ
 * @param hasM
 * @return Polygon
 */
GeoPackageUtils.createPolygon = function(hasZ, hasM) {
  const polygon = new Polygon(hasZ, hasM);
  const num = 1 + Math.round(Math.random() * 5);
  for (let i = 0; i < num; i++) {
    polygon.addRing(GeoPackageUtils.createLineString(hasZ, hasM, true));
  }
  return polygon;
}

/**
 * Create a triangle
 * @return {Triangle}
 */
GeoPackageUtils.createTriangle = function() {
  const triangle = new Triangle();
  const line = new LineString();
  const firstPoint = new Point(0, 0);
  const secondPoint = new Point(1, 1);
  const thirdPoint = new Point(1, 0);
  line.addPoints([firstPoint, secondPoint, thirdPoint, firstPoint.copy()]);
  triangle.addRing(line);
  return triangle;
}

/**
 * Create a polyhedral
 * @return {PolyhedralSurface}
 */
GeoPackageUtils.createPolyhedralSurface = function() {
  const faces = [];
  const base = new Triangle(new LineString([new Point(0, 0), new Point(1, 1), new Point(1, 0), new Point(0, 0)]));
  const side = new Triangle(new LineString([new Point(0, 0), new Point(1, 1), new Point(0, 1), new Point(0, 0)]));
  faces.push(base);
  faces.push(side);
  return new PolyhedralSurface(faces);
}

/**
 * Create a random polygon
 * @return {TIN}
 */
GeoPackageUtils.createTin = function() {
  const faces = [];
  const base = new Triangle(new LineString([new Point(0, 0), new Point(1, 1), new Point(1, 0), new Point(0, 0)]));
  const sideA = new Triangle(new LineString([new Point(0, 0), new Point(1, 1), new Point(0, 1), new Point(0, 0)]));
  const sideB = new Triangle(new LineString([new Point(0, 0), new Point(1, 0), new Point(1, -1), new Point(0, 0)]));
  const sideC = new Triangle(new LineString([new Point(1, 0), new Point(1, 1), new Point(2, 1), new Point(1, 0)]));
  faces.push(base);
  faces.push(sideA);
  faces.push(sideB);
  faces.push(sideC);
  return new TIN(faces);
}

/**
 * Create a random multi point
 *
 * @param hasZ
 * @param hasM
 * @return MultiPoint
 */
GeoPackageUtils.createMultiPoint = function(hasZ, hasM) {
  const multiPoint = new MultiPoint(hasZ, hasM);
  const num = 1 + Math.round(Math.random() * 5);
  for (let i = 0; i < num; i++) {
    multiPoint.addPoint(GeoPackageUtils.createPoint(hasZ, hasM));
  }
  return multiPoint;
}

/**
 * Create a random multi line string
 *
 * @param hasZ
 * @param hasM
 * @return MultiLineString
 */
GeoPackageUtils.createMultiLineString = function(hasZ, hasM) {
  const multiLineString = new MultiLineString(hasZ, hasM);
  const num = 1 + Math.round(Math.random() * 5);
  for (let i = 0; i < num; i++) {
    multiLineString.addLineString(GeoPackageUtils.createLineString(hasZ, hasM));
  }
  return multiLineString;
}

/**
 * Create a random multi polygon
 *
 * @param hasZ
 * @param hasM
 * @return MultiPolygon
 */
GeoPackageUtils.createMultiPolygon = function(hasZ, hasM) {
  const multiPolygon = new MultiPolygon(hasZ, hasM);
  const num = 1 + Math.round(Math.random() * 5);
  for (let i = 0; i < num; i++) {
    multiPolygon.addPolygon(GeoPackageUtils.createPolygon(hasZ, hasM));
  }
  return multiPolygon;
}

/**
 * Create a random geometry collection
 *
 * @param hasZ
 * @param hasM
 * @return GeometryCollection
 */
GeoPackageUtils.createGeometryCollection = function(hasZ, hasM) {
  const geometryCollection = new GeometryCollection(hasZ, hasM);
  const num = 1 + Math.round(Math.random() * 5);
  for (let i = 0; i < num; i++) {
    let geometry = null;
    let randomGeometry = Math.floor(Math.random() * 6);
    switch (randomGeometry) {
      case 0:
        geometry = GeoPackageUtils.createPoint(hasZ, hasM);
        break;
      case 1:
        geometry = GeoPackageUtils.createLineString(hasZ, hasM);
        break;
      case 2:
        geometry = GeoPackageUtils.createPolygon(hasZ, hasM);
        break;
      case 3:
        geometry = GeoPackageUtils.createMultiPoint(hasZ, hasM);
        break;
      case 4:
        geometry = GeoPackageUtils.createMultiLineString(hasZ, hasM);
        break;
      case 5:
        geometry = GeoPackageUtils.createMultiPolygon(hasZ, hasM);
        break;
    }

    geometryCollection.addGeometry(geometry);
  }

  return geometryCollection;
}

/**
 * Creates a random point
 * @param minX
 * @param minY
 * @param xRange
 * @param yRange
 * @returns Point
 */
GeoPackageUtils.createRandomPoint = function(minX, minY, xRange, yRange) {
  const x = minX + (Math.random() * xRange);
  const y = minY + (Math.random() * yRange);
  return new Point(x, y);
}

/**
 * Create a random compound curve
 *
 * @param hasZ
 * @param hasM
 * @param ring
 * @return CompoundCurve
 */
GeoPackageUtils.createCompoundCurve = function(hasZ, hasM, ring = false) {
  const compoundCurve = new CompoundCurve(hasZ, hasM);
  const num = 2 + Math.round(Math.random() * 9);
  for (let i = 0; i < num; i++) {
    compoundCurve.addLineString(GeoPackageUtils.createLineString(hasZ, hasM));
  }
  if (ring) {
    compoundCurve.getLineString(num - 1).addPoint(compoundCurve.getLineString(0).startPoint());
  }
  return compoundCurve;
}

/**
 * Create a random curve polygon
 *
 * @param hasZ
 * @param hasM
 * @return CurvePolygon
 */
GeoPackageUtils.createCurvePolygon = function(hasZ, hasM) {
  const curvePolygon = new CurvePolygon(hasZ, hasM);
  const num = 1 + Math.round(Math.random() * 5);
  for (let i = 0; i < num; i++) {
    curvePolygon.addRing(GeoPackageUtils.createCompoundCurve(hasZ, hasM, true));
  }
  return curvePolygon;
}

/**
 * Randomly return true or false
 * @return true or false
 */
GeoPackageUtils.coinFlip = module.exports.coinFlip = function() {
  return Math.random() < 0.5;
}
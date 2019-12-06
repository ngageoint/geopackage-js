
/**
 * @module geoPackage
 */
import GeoPackageConnection from './db/geoPackageConnection';
import CrsWktExtension from './extension/crsWkt';
import RelatedTablesExtension from './extension/relatedTables';
import FeatureStyleExtension from './extension/style/.';
import ContentsIdExtension from './extension/contents/.';
import SpatialReferenceSystemDao from './core/srs/spatialReferenceSystemDao'
import GeometryColumnsDao from './features/columns/geometryColumnsDao'
import FeatureDao from './features/user/featureDao'
import FeatureTableReader from './features/user/featureTableReader'
import ContentsDao from './core/contents/contentsDao'
import TileMatrixSetDao from './tiles/matrixset/tileMatrixSetDao'
import TileMatrixDao from './tiles/matrix/tileMatrixDao'
import DataColumnsDao from './dataColumns/dataColumnsDao'
import DataColumnConstraintsDao from './dataColumnConstraints/dataColumnConstraintsDao'
import MetadataDao from './metadata/metadataDao'
import MetadataReferenceDao from './metadata/reference/metadataReferenceDao'
import ExtensionDao from './extension/extensionDao'
import TableIndexDao from './extension/index/tableIndexDao'
import GeometryIndexDao from './extension/index/geometryIndexDao'
import ExtendedRelationDao from './extension/relatedTables/extendedRelationDao'
import AttributeDao from './attributes/attributeDao'
import TileDao from './tiles/user/tileDao'
import ContentsIdDao from './extension/contents/contentsIdDao'
import AttributeTable from './attributes/attributeTable'
import TileTableReader from './tiles/user/tileTableReader'
import AttributeTableReader from './attributes/attributeTableReader'
import UserTable from './user/userTable'
import FeatureTable from './features/user/featureTable'
import StyleMappingTable from './extension/style/styleMappingTable'
import TileTable from './tiles/user/tileTable'
import Contents from './core/contents/contents';
import DataTypes from './db/dataTypes';
var TileMatrixSet = require('./tiles/matrixset/tileMatrixSet')
  , TileMatrix = require('./tiles/matrix/tileMatrix')
  , TileBoundingBoxUtils = require('./tiles/tileBoundingBoxUtils')
  , TableCreator = require('./db/tableCreator')
  , SchemaExtension = require('./extension/schema')
  // eslint-disable-next-line no-unused-vars
  , BoundingBox = require('./boundingBox')
  // eslint-disable-next-line no-unused-vars
  , GeometryColumns = require('./features/columns/geometryColumns');

var proj4 = require('proj4');

// proj4 = 'default' in proj4 ? proj4['default'] : proj4; // Module loading hack

var defs = require('./proj4Defs');
for (var def in defs) {
  if (defs[def]) {
    proj4.defs(def, defs[def]);
  }
}

/**
 * A `GeoPackage` instance is the interface to a physical GeoPackage SQLite
 * database.
 */
export default class GeoPackage {
  name: any;
  path: any;
  connection: any;
  tableCreator: any;
  spatialReferenceSystemDao: any;
  contentsDao: any;
  tileMatrixSetDao: any;
  tileMatrixDao: any;
  dataColumnsDao: any;
  extensionDao: any;
  tableIndexDao: any;
  geometryColumnsDao: any;
  dataColumnConstraintsDao: any;
  metadataReferenceDao: any;
  metadataDao: any;
  extendedRelationDao: any;
  contentsIdDao: any;
  contentsIdExtension: any;
  featureStyleExtension: any;
  relatedTablesExtension: any;

  /**
   * Construct a new GeoPackage object
   * @param name name to give to this GeoPackage
   * @param path path to the GeoPackage
   * @param connection database connection to the GeoPackage
   */
  constructor(name: String, path: String, connection: GeoPackageConnection) {
    this.name = name;
    this.path = path;
    this.connection = connection;
    this.tableCreator = new TableCreator(this);
  }
  close() {
    this.connection.close();
  }
  getDatabase() {
    return this.connection;
  }
  getPath() {
    return this.path;
  }
  export(callback) {
    this.connection.export(callback);
  }
  /**
   * Get the GeoPackage name
   * @return {String} the GeoPackage name
   */
  getName() {
    return this.name;
  }
  /**
   * @returns {module:core/srs~SpatialReferenceSystemDao} the DAO to access the [SRS table]{@link module:core/srs~SpatialReferenceSystem} in this `GeoPackage`
   */
  getSpatialReferenceSystemDao() {
    return this.spatialReferenceSystemDao || (this.spatialReferenceSystemDao = new SpatialReferenceSystemDao(this));
  }
  /**
   * @returns {module:core/contents~ContentsDao} the DAO to access the [contents table]{@link module:core/contents~Contents} in this `GeoPackage`
   */
  getContentsDao() {
    return this.contentsDao || (this.contentsDao = new ContentsDao(this));
  }
  /**
   * @returns {module:tiles/matrixset~TileMatrixSetDao} the DAO to access the [tile matrix set]{@link module:tiles/matrixset~TileMatrixSet} in this `GeoPackage`
   */
  getTileMatrixSetDao() {
    return this.tileMatrixSetDao || (this.tileMatrixSetDao = new TileMatrixSetDao(this));
  }
  /**
   * @returns {module:tiles/matrixset~TileMatrixDao} the DAO to access the [tile matrix]{@link module:tiles/matrixset~TileMatrix} in this `GeoPackage`
   */
  getTileMatrixDao() {
    return this.tileMatrixDao || (this.tileMatrixDao = new TileMatrixDao(this));
  }
  getDataColumnsDao() {
    return this.dataColumnsDao || (this.dataColumnsDao = new DataColumnsDao(this));
  }
  getExtensionDao() {
    return this.extensionDao || (this.extensionDao = new ExtensionDao(this));
  }
  getTableIndexDao() {
    return this.tableIndexDao || (this.tableIndexDao = new TableIndexDao(this));
  }
  getGeometryColumnsDao() {
    return this.geometryColumnsDao || (this.geometryColumnsDao = new GeometryColumnsDao(this));
  }
  getDataColumnConstraintsDao() {
    return this.dataColumnConstraintsDao || (this.dataColumnConstraintsDao = new DataColumnConstraintsDao(this));
  }
  getMetadataReferenceDao() {
    return this.metadataReferenceDao || (this.metadataReferenceDao = new MetadataReferenceDao(this));
  }
  getMetadataDao() {
    return this.metadataDao || (this.metadataDao = new MetadataDao(this));
  }
  getExtendedRelationDao() {
    return this.extendedRelationDao || (this.extendedRelationDao = new ExtendedRelationDao(this));
  }
  getContentsIdDao() {
    return this.contentsIdDao || (this.contentsIdDao = new ContentsIdDao(this));
  }
  getContentsIdExtension() {
    return this.contentsIdExtension || (this.contentsIdExtension = new ContentsIdExtension(this));
  }
  getFeatureStyleExtension() {
    return this.featureStyleExtension || (this.featureStyleExtension = new FeatureStyleExtension(this));
  }
  getGeometryIndexDao(featureDao) {
    return new GeometryIndexDao(this, featureDao);
  }
  getRelatedTablesExtension() {
    return this.relatedTablesExtension || (this.relatedTablesExtension = new RelatedTablesExtension(this));
  }
  getSrs(srsId) {
    var dao = this.getSpatialReferenceSystemDao();
    return dao.queryForId(srsId);
  }
  createRequiredTables() {
    var geopackage = this;
    return this.tableCreator.createRequired()
      .then(function () {
        return geopackage;
      });
  }
  createSupportedExtensions() {
    var crs = new CrsWktExtension(this);
    crs.getOrCreateExtension();
    var schema = new SchemaExtension(this);
    schema.getOrCreateExtension();
    return this;
  }
  /**
   * @returns {module:tiles/user/tileDao~TileDao} the `TileDao` to access [tiles]{@link module:tiles/user/tileTable}
   */
  getTileDaoWithTileMatrixSet(tileMatrixSet) {
    var tileMatrices = [];
    var tileMatrixDao = this.getTileMatrixDao();
    var results = tileMatrixDao.queryForAllEq(TileMatrixDao.COLUMN_TABLE_NAME, tileMatrixSet.table_name, null, null, TileMatrixDao.COLUMN_ZOOM_LEVEL + ' ASC, ' + TileMatrixDao.COLUMN_PIXEL_X_SIZE + ' DESC, ' + TileMatrixDao.COLUMN_PIXEL_Y_SIZE + ' DESC');
    results.forEach(function (result) {
      var tm = new TileMatrix();
      tileMatrixDao.populateObjectFromResult(tm, result);
      tileMatrices.push(tm);
    });
    var tableReader = new TileTableReader(tileMatrixSet);
    var tileTable = tableReader.readTileTable(this);
    return new TileDao(this, tileTable, tileMatrixSet, tileMatrices);
  }
  getTileDaoWithContents(contents) {
    var dao = this.getContentsDao();
    var tileMatrixSet = dao.getTileMatrixSet(contents);
    return this.getTileDaoWithTileMatrixSet(tileMatrixSet);
  }
  getTileDao(tableName) {
    var tms = this.getTileMatrixSetDao();
    var results = tms.queryForAllEq(TileMatrixSetDao.COLUMN_TABLE_NAME, tableName);
    if (results.length > 1) {
      throw new Error('Unexpected state. More than one Tile Matrix Set matched for table name: ' + tableName + ', count: ' + results.length);
    }
    else if (results.length === 0) {
      throw new Error('No Tile Matrix found for table name: ' + tableName);
    }
    var tileMatrixSet = new TileMatrixSet();
    tms.populateObjectFromResult(tileMatrixSet, results[0]);
    return this.getTileDaoWithTileMatrixSet(tileMatrixSet);
  }
  /**
   * Return a hash containing arrays of table names grouped under keys `features`,
   * `tiles`, and `attributes`.
   * @return {{features: string[], tiles: string[], attributes: string[]}}
   */
  getTables() {
    var tables = {
      features: this.getFeatureTables(),
      tiles: this.getTileTables(),
      attributes: this.getAttributesTables()
    };
    return tables;
  }
  getAttributesTables() {
    return this.getContentsDao().getTables(ContentsDao.GPKG_CDT_ATTRIBUTES_NAME);
  }
  hasAttributeTable(attributeTableName) {
    var tables = this.getAttributesTables();
    return tables && tables.indexOf(attributeTableName) != -1;
  }
  /**
   *  Get the tile tables
   *  @returns {String[]} tile table names
   */
  getTileTables() {
    var cd = this.getContentsDao();
    if (!cd.isTableExists()) {
      return [];
    }
    return cd.getTables(ContentsDao.GPKG_CDT_TILES_NAME);
  }
  /**
   * Checks if the tile table exists in the GeoPackage
   * @param  {String} tileTableName name of the table to query for
   * @returns {Boolean} indicates the existence of the tile table
   */
  hasTileTable(tileTableName) {
    var tables = this.getTileTables();
    return tables && tables.indexOf(tileTableName) !== -1;
  }
  /**
   * Checks if the feature table exists in the GeoPackage
   * @param  {String} featureTableName name of the table to query for
   * @returns {Boolean} indicates the existence of the feature table
   */
  hasFeatureTable(featureTableName) {
    var tables = this.getFeatureTables();
    return tables && tables.indexOf(featureTableName) != -1;
  }
  /**
   *  Get the feature tables
   *  @returns {String[]} feature table names
   */
  getFeatureTables() {
    var cd = this.getContentsDao();
    if (!cd.isTableExists()) {
      return [];
    }
    return cd.getTables(ContentsDao.GPKG_CDT_FEATURES_NAME);
  }
  isTable(tableName) {
    return !!this.connection.tableExists(tableName);
  }
  isTableType(type, tableName) {
    return type === this.getTableType(tableName);
  }
  getTableType(tableName) {
    var contents = this.getTableContents(tableName);
    if (contents) {
      return contents.data_type;
    }
  }
  getTableContents(tableName) {
    return this.getContentsDao().queryForId(tableName);
  }
  deleteTable(tableName) {
    this.connection.dropTable(tableName);
  }
  getTableCreator() {
    return this.tableCreator;
  }
  index() {
    var tables = this.getFeatureTables();
    return tables.reduce(function (sequence, table) {
      return sequence.then(function () {
        return this.indexFeatureTable(table)
          .then(function (indexed) {
            if (indexed) {
              return true;
            }
            else {
              throw new Error('Unable to index table ' + table);
            }
          });
      }.bind(this));
    }.bind(this), Promise.resolve());
  }
  indexFeatureTable(table, progress) {
    var featureDao = this.getFeatureDao(table);
    var fti = featureDao.featureTableIndex;
    return new Promise(function (resolve) {
      var tableIndex = fti.getTableIndex();
      if (tableIndex) {
        return resolve(true);
      }
      resolve(fti.index(progress));
    });
  }
  /**
   *  Get a Feature DAO from Geometry Columns
   *
   *  @param {GeometryColumns} geometryColumns Geometry Columns
   *  @returns {FeatureDao}
   */
  getFeatureDaoWithGeometryColumns(geometryColumns) {
    if (!geometryColumns) {
      throw new Error('Non null Geometry Columns is required to create Feature DAO');
    }
    var tableReader = new FeatureTableReader(geometryColumns);
    var featureTable = tableReader.readFeatureTable(this);
    var dao = new FeatureDao(this, featureTable, geometryColumns, this.metadataDao);
    return dao;
  }
  /**
   * Get a Feature DAO from Contents
   * @param  {Contents}   contents Contents
   *  @returns {FeatureDao}
   */
  getFeatureDaoWithContents(contents) {
    var dao = this.getContentsDao();
    var columns = dao.getGeometryColumns(contents);
    return this.getFeatureDaoWithGeometryColumns(columns);
  }
  /**
   * Get a Feature DAO from Contents
   * @param  {string}   tableName table name
   *  @returns {FeatureDao}
   */
  getFeatureDao(tableName) {
    var dao = this.getGeometryColumnsDao();
    var geometryColumns = dao.queryForTableName(tableName);
    if (!geometryColumns) {
      throw new Error('No Feature Table exists for table name: ' + tableName);
    }
    return this.getFeatureDaoWithGeometryColumns(geometryColumns);
  }
  /**
   * Queries for GeoJSON features in a feature table
   * @param  {String}   tableName   Table name to query
   * @param  {BoundingBox}   boundingBox BoundingBox to query
   * @returns {Object[]} array of GeoJSON features
   */
  queryForGeoJSONFeaturesInTable(tableName, boundingBox) {
    var featureDao = this.getFeatureDao(tableName);
    var features = [];
    var iterator = featureDao.queryForGeoJSONIndexedFeaturesWithBoundingBox(boundingBox);
    for (var feature of iterator) {
      features.push(feature);
    }
    return features;
  }
  /**
   * iterates GeoJSON features in a feature table within a bounding box
   * @param  {String}   tableName   Table name to query
   * @param  {BoundingBox}   boundingBox BoundingBox to query
   * @returns {Iterable<Object>} iterable of GeoJSON features
   */
  iterateGeoJSONFeaturesInTableWithinBoundingBox(tableName, boundingBox) {
    var featureDao = this.getFeatureDao(tableName);
    return featureDao.queryForGeoJSONIndexedFeaturesWithBoundingBox(boundingBox);
  }
  /**
   * Create the Geometry Columns table if it does not already exist
   * @returns {Promise}
   */
  createGeometryColumnsTable() {
    var dao = this.getGeometryColumnsDao();
    if (dao.isTableExists()) {
      return Promise.resolve().then(function () { return true; });
    }
    return this.tableCreator.createGeometryColumns();
  }
  /**
   * Get a Attribute DAO
   * @param  {string}   tableName table name
   * @returns {AttributeDao}
   */
  getAttributeDaoWithTableName(tableName) {
    var dao = this.getContentsDao();
    var contents = dao.queryForId(tableName);
    return this.getAttributeDaoWithContents(contents);
  }
  /**
   * Get a Attribute DAO
   * @param  {Contents}   contents Contents
   * @returns {AttributeDao}
   */
  getAttributeDaoWithContents(contents) {
    if (!contents) {
      throw new Error('Non null Contents is required to create an Attributes DAO');
    }
    var reader = new AttributeTableReader(contents.table_name);
    var table = reader.readTable(this.connection);
    table.setContents(contents);
    return new AttributeDao(this, table);
  }
  createAttributeTable(tableName, columns, dataColumns) {
    return Promise.resolve()
      .then(function () {
        var attributeTable = new AttributeTable(tableName, columns);
        this.tableCreator.createUserTable(attributeTable);
        var contents = new Contents();
        contents.table_name = tableName;
        contents.data_type = ContentsDao.GPKG_CDT_ATTRIBUTES_NAME;
        contents.identifier = tableName;
        contents.last_change = new Date().toISOString();
        return this.getContentsDao().create(contents);
      }.bind(this))
      .then(function () {
        if (dataColumns) {
          return this.createDataColumns()
            .then(function () {
              var dataColumnsDao = this.getDataColumnsDao();
              dataColumns.forEach(function (dataColumn) {
                dataColumnsDao.create(dataColumn);
              });
            }.bind(this));
        }
      }.bind(this))
      .then(function () {
        return true;
      });
  }
  /**
   * Create the given {@link module:features/user/featureTable~FeatureTable}
   * @param  {FeatureTable}   featureTable    feature table
   */
  createFeatureTable(featureTable) {
    return this.tableCreator.createUserTable(featureTable);
  }
  createFeatureTableWithGeometryColumns(geometryColumns, boundingBox, srsId, columns) {
    return this.createFeatureTableWithGeometryColumnsAndDataColumns(geometryColumns, boundingBox, srsId, columns, undefined);
  }
  createFeatureTableWithGeometryColumnsAndDataColumns(geometryColumns, boundingBox, srsId, columns, dataColumns) {
    return this.createGeometryColumnsTable()
      .then(function () {
        var featureTable = new FeatureTable(geometryColumns.table_name, columns);
        this.createFeatureTable(featureTable);
        var contents = new Contents();
        contents.table_name = geometryColumns.table_name;
        contents.data_type = ContentsDao.GPKG_CDT_FEATURES_NAME;
        contents.identifier = geometryColumns.table_name;
        contents.last_change = new Date().toISOString();
        contents.min_x = boundingBox.minLongitude;
        contents.min_y = boundingBox.minLatitude;
        contents.max_x = boundingBox.maxLongitude;
        contents.max_y = boundingBox.maxLatitude;
        contents.srs_id = srsId;
        this.getContentsDao().create(contents);
        geometryColumns.srs_id = srsId;
        return this.getGeometryColumnsDao().create(geometryColumns);
      }.bind(this))
      .then(function () {
        if (dataColumns) {
          return this.createDataColumns()
            .then(function () {
              var dataColumnsDao = this.getDataColumnsDao();
              dataColumns.forEach(function (dataColumn) {
                dataColumnsDao.create(dataColumn);
              });
            }.bind(this));
        }
      }.bind(this))
      .then(function () {
        return true;
      });
  }
  /**
   * Create the Tile Matrix Set table if it does not already exist
   * @returns {Promise} resolves when the table is created
   */
  createTileMatrixSetTable() {
    var dao = this.getTileMatrixSetDao();
    if (dao.isTableExists()) {
      return Promise.resolve().then(function () { return true; });
    }
    return this.tableCreator.createTileMatrixSet();
  }
  /**
   * Create the Tile Matrix table if it does not already exist
   * @returns {Promise} resolves when the table is created
   */
  createTileMatrixTable() {
    var dao = this.getTileMatrixDao();
    if (dao.isTableExists()) {
      return Promise.resolve().then(function () { return true; });
    }
    return this.tableCreator.createTileMatrix();
  }
  /**
   * Create the given tile table in this GeoPackage.
   *
   * @param  {module:tiles/user/tileTable~TileTable} tileTable
   * @return {object} the result of {@link module:db/geoPackageConnection~GeoPackageConnection#run}
   */
  createTileTable(tileTable) {
    return this.tableCreator.createUserTable(tileTable);
  }
  /**
   * Create a new [tile table]{@link module:tiles/user/tileTable~TileTable} in this GeoPackage.
   *
   * @param {String} tableName tile table name
   * @param {BoundingBox} contentsBoundingBox bounding box of the contents table
   * @param {Number} contentsSrsId srs id of the contents table
   * @param {BoundingBox} tileMatrixSetBoundingBox bounding box of the matrix set
   * @param {Number} tileMatrixSetSrsId srs id of the matrix set
   * @returns {Promise<TileMatrixSet>} `Promise` of the created {@link module:tiles/matrixset~TileMatrixSet}
   */
  createTileTableWithTableName(tableName, contentsBoundingBox, contentsSrsId, tileMatrixSetBoundingBox, tileMatrixSetSrsId) {
    const columns = TileTable.createRequiredColumns();
    const tileTable = new TileTable(tableName, columns);
    const contents = new Contents();
    contents.table_name = tableName;
    contents.data_type = ContentsDao.GPKG_CDT_TILES_NAME;
    contents.identifier = tableName;
    contents.last_change = new Date().toISOString();
    contents.min_x = contentsBoundingBox.minLongitude;
    contents.min_y = contentsBoundingBox.minLatitude;
    contents.max_x = contentsBoundingBox.maxLongitude;
    contents.max_y = contentsBoundingBox.maxLatitude;
    contents.srs_id = contentsSrsId;
    const tileMatrixSet = new TileMatrixSet();
    tileMatrixSet.setContents(contents);
    tileMatrixSet.srs_id = tileMatrixSetSrsId;
    tileMatrixSet.min_x = tileMatrixSetBoundingBox.minLongitude;
    tileMatrixSet.min_y = tileMatrixSetBoundingBox.minLatitude;
    tileMatrixSet.max_x = tileMatrixSetBoundingBox.maxLongitude;
    tileMatrixSet.max_y = tileMatrixSetBoundingBox.maxLatitude;
    return this.createTileMatrixSetTable()
      .then(function () {
        return this.createTileMatrixTable();
      }.bind(this))
      .then(function () {
        return this.createTileTable(tileTable);
      }.bind(this))
      .then(function () {
        return this.getContentsDao().create(contents);
      }.bind(this))
      .then(function () {
        return this.getTileMatrixSetDao().create(tileMatrixSet);
      }.bind(this))
      .then(function () {
        return tileMatrixSet;
      });
  }
  /**
   * Create the tables and rows necessary to store tiles in a {@link module:tiles/matrixset~TileMatrixSet}.
   * This will create a [tile matrix row]{@link module:tiles/matrix~TileMatrix}
   * for every integral zoom level in the range `[minZoom..maxZoom]`.
   *
   * @param {BoundingBox} epsg3857TileBoundingBox
   * @param {module:tiles/matrixset~TileMatrixSet} tileMatrixSet
   * @param {number} minZoom
   * @param {number} maxZoom
   * @param {number} [tileSize=256] optional tile size in pixels
   * @returns {module:geoPackage~GeoPackage} `this` `GeoPackage`
   */
  createStandardWebMercatorTileMatrix(epsg3857TileBoundingBox, tileMatrixSet, minZoom, maxZoom, tileSize) {
    tileSize = tileSize || 256;
    var tileMatrixDao = this.getTileMatrixDao();
    for (var zoom = minZoom; zoom <= maxZoom; zoom++) {
      var box = TileBoundingBoxUtils.webMercatorTileBox(epsg3857TileBoundingBox, zoom);
      var matrixWidth = (box.maxX - box.minX) + 1;
      var matrixHeight = (box.maxY - box.minY) + 1;
      var pixelXSize = ((epsg3857TileBoundingBox.maxLongitude - epsg3857TileBoundingBox.minLongitude) / matrixWidth) / tileSize;
      var pixelYSize = ((epsg3857TileBoundingBox.maxLatitude - epsg3857TileBoundingBox.minLatitude) / matrixHeight) / tileSize;
      var tileMatrix = new TileMatrix();
      tileMatrix.table_name = tileMatrixSet.table_name;
      tileMatrix.zoom_level = zoom;
      tileMatrix.matrix_width = matrixWidth;
      tileMatrix.matrix_height = matrixHeight;
      tileMatrix.tile_width = tileSize;
      tileMatrix.tile_height = tileSize;
      tileMatrix.pixel_x_size = pixelXSize;
      tileMatrix.pixel_y_size = pixelYSize;
      tileMatrixDao.create(tileMatrix);
    }
    return this;
  }
  /**
   * Adds a tile to the GeoPackage
   * @param  {object}   tileStream       Byte array or Buffer containing the tile bytes
   * @param  {String}   tableName  Table name to add the tile to
   * @param  {Number}   zoom       zoom level of this tile
   * @param  {Number}   tileRow    row of this tile
   * @param  {Number}   tileColumn column of this tile
   */
  addTile(tileStream, tableName, zoom, tileRow, tileColumn) {
    var tileDao = this.getTileDao(tableName);
    var newRow = tileDao.newRow();
    newRow.setZoomLevel(zoom);
    newRow.setTileColumn(tileColumn);
    newRow.setTileRow(tileRow);
    newRow.setTileData(tileStream);
    return tileDao.create(newRow);
  }
  /**
   * Create the Data Columns table if it does not already exist
   */
  createDataColumns() {
    var dao = this.getDataColumnsDao();
    if (dao.isTableExists()) {
      return Promise.resolve().then(function () { return true; });
    }
    return this.tableCreator.createDataColumns();
  }
  /**
   * Create the Data Column Constraints table if it does not already exist
   */
  createDataColumnConstraintsTable() {
    var dao = this.getDataColumnConstraintsDao();
    if (dao.isTableExists()) {
      return Promise.resolve().then(function () { return true; });
    }
    return this.tableCreator.createDataColumnConstraints();
  }
  createMetadataTable() {
    var dao = this.getMetadataDao();
    if (dao.isTableExists()) {
      return Promise.resolve().then(function () { return true; });
    }
    return this.tableCreator.createMetadata();
  }
  createMetadataReferenceTable() {
    var dao = this.getMetadataReferenceDao();
    if (dao.isTableExists()) {
      return Promise.resolve().then(function () { return true; });
    }
    return this.tableCreator.createMetadataReference();
  }
  createExtensionTable() {
    var dao = this.getExtensionDao();
    if (dao.isTableExists()) {
      return Promise.resolve().then(function () { return true; });
    }
    return this.tableCreator.createExtensions();
  }
  createTableIndexTable() {
    var dao = this.getTableIndexDao();
    if (dao.isTableExists()) {
      return Promise.resolve().then(function () { return true; });
    }
    return this.tableCreator.createTableIndex();
  }
  createGeometryIndexTable(featureDao) {
    var dao = this.getGeometryIndexDao(featureDao);
    if (dao.isTableExists()) {
      return Promise.resolve().then(function () { return true; });
    }
    return this.tableCreator.createGeometryIndex();
  }
  createStyleMappingTable(tableName, columns, dataColumns) {
    return Promise.resolve()
      .then(function () {
        var attributeTable = new StyleMappingTable(tableName, columns);
        this.tableCreator.createUserTable(attributeTable);
        var contents = new Contents();
        contents.table_name = tableName;
        contents.data_type = ContentsDao.GPKG_CDT_ATTRIBUTES_NAME;
        contents.identifier = tableName;
        contents.last_change = new Date().toISOString();
        return this.getContentsDao().create(contents);
      }.bind(this))
      .then(function () {
        if (dataColumns) {
          return this.createDataColumns()
            .then(function () {
              var dataColumnsDao = this.getDataColumnsDao();
              dataColumns.forEach(function (dataColumn) {
                dataColumnsDao.create(dataColumn);
              });
            }.bind(this));
        }
      }.bind(this))
      .then(function () {
        return true;
      });
  }
  /**
   * Get the application id of the GeoPackage
   * @returns {string} application id
   */
  getApplicationId() {
    var connection = this.getDatabase();
    return connection.getApplicationId();
  }
  getInfoForTable(tableDao) {
    var info = {
      tableName: tableDao.table_name,
      tableType: tableDao.table.getTableType(),
      count: tableDao.getCount(),
      geometryColumns: undefined,
      minZoom: Number,
      maxZoom: Number,
      minWebMapZoom: Number,
      maxWebMapZoom: Number,
      zoomLevels: Number,
      tileMatrixSet: undefined,
      contents: undefined,
      srs: undefined,
      columns: undefined,
      columnMap: undefined,
    };
    if (info.tableType === UserTable.FEATURE_TABLE) {
      info.geometryColumns = {};
      info.geometryColumns.tableName = tableDao.geometryColumns.table_name;
      info.geometryColumns.geometryColumn = tableDao.geometryColumns.column_name;
      info.geometryColumns.geometryTypeName = tableDao.geometryColumns.geometry_type_name;
      info.geometryColumns.z = tableDao.geometryColumns.z;
      info.geometryColumns.m = tableDao.geometryColumns.m;
    }
    if (info.tableType === UserTable.TILE_TABLE) {
      info.minZoom = tableDao.minZoom;
      info.maxZoom = tableDao.maxZoom;
      info.minWebMapZoom = tableDao.minWebMapZoom;
      info.maxWebMapZoom = tableDao.maxWebMapZoom;
      info.zoomLevels = tableDao.tileMatrices.length;
    }
    var dao;
    var contentsRetriever;
    if (info.tableType === UserTable.FEATURE_TABLE) {
      dao = this.getGeometryColumnsDao();
      contentsRetriever = tableDao.geometryColumns;
    }
    else if (info.tableType === UserTable.TILE_TABLE) {
      dao = this.getTileMatrixSetDao();
      contentsRetriever = tableDao.tileMatrixSet;
      info.tileMatrixSet = {};
      info.tileMatrixSet.srsId = tableDao.tileMatrixSet.srs_id;
      info.tileMatrixSet.minX = tableDao.tileMatrixSet.min_x;
      info.tileMatrixSet.maxX = tableDao.tileMatrixSet.max_x;
      info.tileMatrixSet.minY = tableDao.tileMatrixSet.min_y;
      info.tileMatrixSet.maxY = tableDao.tileMatrixSet.max_y;
    }
    var contents = dao.getContents(contentsRetriever);
    info.contents = {};
    info.contents.tableName = contents.table_name;
    info.contents.dataType = contents.data_type;
    info.contents.identifier = contents.identifier;
    info.contents.description = contents.description;
    info.contents.lastChange = contents.last_change;
    info.contents.minX = contents.min_x;
    info.contents.maxX = contents.max_x;
    info.contents.minY = contents.min_y;
    info.contents.maxY = contents.max_y;
    var contentsDao = this.getContentsDao();
    var contentsSrs = contentsDao.getSrs(contents);
    info.contents.srs = {
      name: contentsSrs.srs_name,
      id: contentsSrs.srs_id,
      organization: contentsSrs.organization,
      organization_coordsys_id: contentsSrs.organization_coordsys_id,
      definition: contentsSrs.definition,
      description: contentsSrs.description
    };
    var srs = tableDao.getSrs();
    info.srs = {
      name: srs.srs_name,
      id: srs.srs_id,
      organization: srs.organization,
      organization_coordsys_id: srs.organization_coordsys_id,
      definition: srs.definition,
      description: srs.description
    };
    info.columns = [];
    info.columnMap = {};
    var dcd = this.getDataColumnsDao();
    tableDao.table.columns.forEach(function (column) {
      var dataColumn = dcd.getDataColumns(tableDao.table.table_name, column.name);
      info.columns.push({
        index: column.index,
        name: column.name,
        max: column.max,
        min: column.min,
        notNull: column.notNull,
        primaryKey: column.primaryKey,
        dataType: column.dataType ? DataTypes.nameFromType(column.dataType) : '',
        displayName: dataColumn && dataColumn.name ? dataColumn.name : column.name,
        dataColumn: dataColumn
      });
      info.columnMap[column.name] = info.columns[info.columns.length - 1];
    }.bind(this));
    return info;
  }
  static loadProjections(items) {
    if (!(items instanceof Array))
      throw new Error('Invalid array of projections');
    for (var i = 0; i < items.length; i++) {
      if (!defs[items[i]])
        throw new Error('Projection not found');
      this.addProjection(items[i], defs[items[i]]);
    }
  }
  static addProjection(name, definition) {
    if (!name || !definition)
      throw new Error('Invalid projection name/definition');
    proj4.defs('' + name, '' + definition);
  }
  static hasProjection(name) {
    return proj4.defs('' + name);
  }
}

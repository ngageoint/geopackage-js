import wkx from 'wkx';
// @ts-ignore
import reproject from 'reproject';
import pointToLineDistance from '@turf/point-to-line-distance';
import polygonToLine from '@turf/polygon-to-line';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
// @ts-ignore
import pointDistance from '@turf/distance';
import * as helpers from '@turf/helpers';
import { Feature, FeatureCollection, Point, Geometry, LineString, Polygon, MultiPolygon } from 'geojson';

import { GeometryData } from './geom/geometryData';
import { GeoPackageConnection } from './db/geoPackageConnection';
import { CrsWktExtension } from './extension/crsWkt';
import { RelatedTablesExtension } from './extension/relatedTables';
import { FeatureStyleExtension } from './extension/style/.';
import { ContentsIdExtension } from './extension/contents/.';
import { SpatialReferenceSystemDao } from './core/srs/spatialReferenceSystemDao';
import { GeometryColumnsDao } from './features/columns/geometryColumnsDao';
import { FeatureDao } from './features/user/featureDao';
import { FeatureTableReader } from './features/user/featureTableReader';
import { ContentsDao } from './core/contents/contentsDao';
import { TileMatrixSetDao } from './tiles/matrixset/tileMatrixSetDao';
import { TileMatrixDao } from './tiles/matrix/tileMatrixDao';
import { DataColumnsDao } from './dataColumns/dataColumnsDao';
import { DataColumnConstraintsDao } from './dataColumnConstraints/dataColumnConstraintsDao';
import { MetadataDao } from './metadata/metadataDao';
import { MetadataReferenceDao } from './metadata/reference/metadataReferenceDao';
import { ExtensionDao } from './extension/extensionDao';
import { TableIndexDao } from './extension/index/tableIndexDao';
import { GeometryIndexDao } from './extension/index/geometryIndexDao';
import { ExtendedRelationDao } from './extension/relatedTables/extendedRelationDao';
import { AttributeDao } from './attributes/attributeDao';
import { TileDao } from './tiles/user/tileDao';
import { ContentsIdDao } from './extension/contents/contentsIdDao';
import { AttributeTable } from './attributes/attributeTable';
import { TileTableReader } from './tiles/user/tileTableReader';
import { AttributeTableReader } from './attributes/attributeTableReader';
import { FeatureTable } from './features/user/featureTable';
import { StyleMappingTable } from './extension/style/styleMappingTable';
import { TileTable } from './tiles/user/tileTable';
import { Contents } from './core/contents/contents';
import { DataTypes } from './db/dataTypes';
import { SchemaExtension } from './extension/schema';
import { GeometryColumns } from './features/columns/geometryColumns';
import { TableCreator } from './db/tableCreator';
import { TileMatrix } from './tiles/matrix/tileMatrix';
import { TileBoundingBoxUtils } from './tiles/tileBoundingBoxUtils';
import { BoundingBox } from './boundingBox';
import { TileMatrixSet } from './tiles/matrixset/tileMatrixSet';

import proj4 from 'proj4';
import { UserColumn } from './user/userColumn';
import { DataColumns } from './dataColumns/dataColumns';
import { AttributeRow } from './attributes/attributeRow';
import { SpatialReferenceSystem } from './core/srs/spatialReferenceSystem';
import * as defs from './proj4Defs';
import { FeatureRow } from './features/user/featureRow';
import { GeoPackageValidationError, GeoPackageValidate } from './validate/geoPackageValidate';
import { FeatureColumn } from './features/user/featureColumn';
import { DBValue } from './db/dbAdapter';
import { MediaDao } from './extension/relatedTables/mediaDao';
import { MediaRow } from './extension/relatedTables/mediaRow';
import { MediaTable } from './extension/relatedTables/mediaTable';
import { ExtendedRelation } from './extension/relatedTables/extendedRelation';
import { RelationType } from './extension/relatedTables/relationType';
import { SimpleAttributesDao } from './extension/relatedTables/simpleAttributesDao';
import { SimpleAttributesRow } from './extension/relatedTables/simpleAttributesRow';
import { SimpleAttributesTable } from './extension/relatedTables/simpleAttributesTable';
import { TileRow } from './tiles/user/tileRow';
import { FeatureTiles } from './tiles/features';
import { GeoPackageTileRetriever } from './tiles/retriever';

type ColumnMap = {
  [key: string]: {
    index: number;
    name: string;
    max?: number;
    min?: number;
    notNull?: boolean;
    primaryKey?: boolean;
    dataType?: DataTypes;
    displayName: string;
    dataColumn?: DataColumns;
  };
};

interface ClosestFeature {
  feature_count: number;
  coverage: boolean;
  gp_table: string;
  gp_name: string;
  distance?: number;
}

const anyDefs = defs as any;
for (const def in anyDefs) {
  if (anyDefs[def]) {
    proj4.defs(def, anyDefs[def]);
  }
}

/**
 * A `GeoPackage` instance is the interface to a physical GeoPackage SQLite
 * database.
 */
export class GeoPackage {
  /** name of the GeoPackage */
  name: string;
  /** path to the GeoPackage */
  path: string;
  connection: GeoPackageConnection;
  tableCreator: TableCreator;
  private _spatialReferenceSystemDao: SpatialReferenceSystemDao;
  private _contentsDao: ContentsDao;
  private _tileMatrixSetDao: TileMatrixSetDao;
  private _tileMatrixDao: TileMatrixDao;
  private _dataColumnsDao: DataColumnsDao;
  private _extensionDao: ExtensionDao;
  private _tableIndexDao: TableIndexDao;
  private _geometryColumnsDao: GeometryColumnsDao;
  private _dataColumnConstraintsDao: DataColumnConstraintsDao;
  private _metadataReferenceDao: MetadataReferenceDao;
  private _metadataDao: MetadataDao;
  private _extendedRelationDao: ExtendedRelationDao;
  private _contentsIdDao: ContentsIdDao;
  private _contentsIdExtension: ContentsIdExtension;
  private _featureStyleExtension: FeatureStyleExtension;
  private _relatedTablesExtension: RelatedTablesExtension;

  /**
   * Construct a new GeoPackage object
   * @param name name to give to this GeoPackage
   * @param path path to the GeoPackage
   * @param connection database connection to the GeoPackage
   */
  constructor(name: string, path: string, connection: GeoPackageConnection) {
    this.name = name;
    this.path = path;
    this.connection = connection;
    this.tableCreator = new TableCreator(this);
  }
  close(): void {
    this.connection.close();
  }
  get database(): GeoPackageConnection {
    return this.connection;
  }
  async export(): Promise<any> {
    return this.connection.export();
  }

  async validate(): Promise<GeoPackageValidationError[]> {
    let errors: GeoPackageValidationError[] = [];
    errors = errors.concat(GeoPackageValidate.validateMinimumTables(this));
    return errors;
  }
  /**
   * @returns {module:core/srs~SpatialReferenceSystemDao} the DAO to access the [SRS table]{@link module:core/srs~SpatialReferenceSystem} in this `GeoPackage`
   */
  get spatialReferenceSystemDao(): SpatialReferenceSystemDao {
    return this._spatialReferenceSystemDao || (this._spatialReferenceSystemDao = new SpatialReferenceSystemDao(this));
  }
  /**
   * @returns {module:core/contents~ContentsDao} the DAO to access the [contents table]{@link module:core/contents~Contents} in this `GeoPackage`
   */
  get contentsDao(): ContentsDao {
    return this._contentsDao || (this._contentsDao = new ContentsDao(this));
  }
  /**
   * @returns {module:tiles/matrixset~TileMatrixSetDao} the DAO to access the [tile matrix set]{@link module:tiles/matrixset~TileMatrixSet} in this `GeoPackage`
   */
  get tileMatrixSetDao(): TileMatrixSetDao {
    return this._tileMatrixSetDao || (this._tileMatrixSetDao = new TileMatrixSetDao(this));
  }
  /**
   * @returns {module:tiles/matrixset~TileMatrixDao} the DAO to access the [tile matrix]{@link module:tiles/matrixset~TileMatrix} in this `GeoPackage`
   */
  get tileMatrixDao(): TileMatrixDao {
    return this._tileMatrixDao || (this._tileMatrixDao = new TileMatrixDao(this));
  }
  get dataColumnsDao(): DataColumnsDao {
    return this._dataColumnsDao || (this._dataColumnsDao = new DataColumnsDao(this));
  }
  get extensionDao(): ExtensionDao {
    return this._extensionDao || (this._extensionDao = new ExtensionDao(this));
  }
  get tableIndexDao(): TableIndexDao {
    return this._tableIndexDao || (this._tableIndexDao = new TableIndexDao(this));
  }
  get geometryColumnsDao(): GeometryColumnsDao {
    return this._geometryColumnsDao || (this._geometryColumnsDao = new GeometryColumnsDao(this));
  }
  get dataColumnConstraintsDao(): DataColumnConstraintsDao {
    return this._dataColumnConstraintsDao || (this._dataColumnConstraintsDao = new DataColumnConstraintsDao(this));
  }
  get metadataReferenceDao(): MetadataReferenceDao {
    return this._metadataReferenceDao || (this._metadataReferenceDao = new MetadataReferenceDao(this));
  }
  get metadataDao(): MetadataDao {
    return this._metadataDao || (this._metadataDao = new MetadataDao(this));
  }
  get extendedRelationDao(): ExtendedRelationDao {
    return this._extendedRelationDao || (this._extendedRelationDao = new ExtendedRelationDao(this));
  }
  get contentsIdDao(): ContentsIdDao {
    return this._contentsIdDao || (this._contentsIdDao = new ContentsIdDao(this));
  }
  get contentsIdExtension(): ContentsIdExtension {
    return this._contentsIdExtension || (this._contentsIdExtension = new ContentsIdExtension(this));
  }
  get featureStyleExtension(): FeatureStyleExtension {
    return this._featureStyleExtension || (this._featureStyleExtension = new FeatureStyleExtension(this));
  }
  getGeometryIndexDao(featureDao: FeatureDao<FeatureRow>): GeometryIndexDao {
    return new GeometryIndexDao(this, featureDao);
  }
  get relatedTablesExtension(): RelatedTablesExtension {
    return this._relatedTablesExtension || (this._relatedTablesExtension = new RelatedTablesExtension(this));
  }
  getSrs(srsId: number): SpatialReferenceSystem {
    const dao = this.spatialReferenceSystemDao;
    return dao.queryForId(srsId);
  }
  async createRequiredTables(): Promise<GeoPackage> {
    await this.tableCreator.createRequired();
    return this;
  }
  createSupportedExtensions(): GeoPackage {
    const crs = new CrsWktExtension(this);
    crs.getOrCreateExtension();
    const schema = new SchemaExtension(this);
    schema.getOrCreateExtension();
    return this;
  }
  /**
   * @returns {module:tiles/user/tileDao~TileDao} the `TileDao` to access [tiles]{@link module:tiles/user/tileTable}
   */
  getTileDaoWithTileMatrixSet(tileMatrixSet: TileMatrixSet): TileDao {
    const tileMatrices: TileMatrix[] = [];
    const tileMatrixDao = this.tileMatrixDao;
    const results = tileMatrixDao.queryForAllEq(
      TileMatrixDao.COLUMN_TABLE_NAME,
      tileMatrixSet.table_name,
      null,
      null,
      TileMatrixDao.COLUMN_ZOOM_LEVEL +
        ' ASC, ' +
        TileMatrixDao.COLUMN_PIXEL_X_SIZE +
        ' DESC, ' +
        TileMatrixDao.COLUMN_PIXEL_Y_SIZE +
        ' DESC',
    );
    results.forEach(function(result) {
      const tm = new TileMatrix();
      tileMatrixDao.populateObjectFromResult(tm, result);
      tileMatrices.push(tm);
    });
    const tableReader = new TileTableReader(tileMatrixSet);
    const tileTable = tableReader.readTileTable(this);
    return new TileDao(this, tileTable, tileMatrixSet, tileMatrices);
  }
  getTileDaoWithContents(contents: Contents): TileDao {
    const tileMatrixSet = this.contentsDao.getTileMatrixSet(contents);
    return this.getTileDaoWithTileMatrixSet(tileMatrixSet);
  }
  getTileDao(tableName: string): TileDao {
    const tms = this.tileMatrixSetDao;
    const results = tms.queryForAllEq(TileMatrixSetDao.COLUMN_TABLE_NAME, tableName);
    if (results.length > 1) {
      throw new Error(
        'Unexpected state. More than one Tile Matrix Set matched for table name: ' +
          tableName +
          ', count: ' +
          results.length,
      );
    } else if (results.length === 0) {
      throw new Error('No Tile Matrix found for table name: ' + tableName);
    }
    const tileMatrixSet = new TileMatrixSet();
    tms.populateObjectFromResult(tileMatrixSet, results[0]);
    return this.getTileDaoWithTileMatrixSet(tileMatrixSet);
  }
  /**
   * Return a hash containing arrays of table names grouped under keys `features`,
   * `tiles`, and `attributes`.
   * @return {{features: string[], tiles: string[], attributes: string[]}}
   */
  getTables(): { features: string[]; tiles: string[]; attributes: string[] } {
    const tables = {
      features: this.getFeatureTables(),
      tiles: this.getTileTables(),
      attributes: this.getAttributesTables(),
    };
    return tables;
  }
  getAttributesTables(): string[] {
    return this.contentsDao.getTables(ContentsDao.GPKG_CDT_ATTRIBUTES_NAME);
  }
  hasAttributeTable(attributeTableName: string): boolean {
    const tables = this.getAttributesTables();
    return tables && tables.indexOf(attributeTableName) != -1;
  }
  /**
   *  Get the tile tables
   *  @returns {String[]} tile table names
   */
  getTileTables(): string[] {
    const cd = this.contentsDao;
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
  hasTileTable(tileTableName: string): boolean {
    const tables = this.getTileTables();
    return tables && tables.indexOf(tileTableName) !== -1;
  }
  /**
   * Checks if the feature table exists in the GeoPackage
   * @param  {String} featureTableName name of the table to query for
   * @returns {Boolean} indicates the existence of the feature table
   */
  hasFeatureTable(featureTableName: string): boolean {
    const tables = this.getFeatureTables();
    return tables && tables.indexOf(featureTableName) != -1;
  }
  /**
   *  Get the feature tables
   *  @returns {String[]} feature table names
   */
  getFeatureTables(): string[] {
    const cd = this.contentsDao;
    if (!cd.isTableExists()) {
      return [];
    }
    return cd.getTables(ContentsDao.GPKG_CDT_FEATURES_NAME);
  }
  isTable(tableName: string): boolean {
    return !!this.connection.tableExists(tableName);
  }
  isTableType(type: string, tableName: string): boolean {
    return type === this.getTableType(tableName);
  }
  getTableType(tableName: string): string {
    const contents = this.getTableContents(tableName);
    if (contents) {
      return contents.data_type;
    }
  }
  getTableContents(tableName: string): Contents {
    return this.contentsDao.queryForId(tableName);
  }
  deleteTable(tableName: string): boolean {
    return this.connection.dropTable(tableName);
  }
  getTableCreator(): TableCreator {
    return this.tableCreator;
  }
  async index(): Promise<boolean> {
    const tables = this.getFeatureTables();
    for (let i = 0; i < tables.length; i++) {
      if (!(await this.indexFeatureTable(tables[i]))) {
        throw new Error('Unable to index table ' + tables[i]);
      }
    }
    return true;
  }
  async indexFeatureTable(table: string, progress?: Function): Promise<boolean> {
    const featureDao = this.getFeatureDao(table);
    const fti = featureDao.featureTableIndex;
    if (fti.isIndexed()) {
      return true;
    }
    return await fti.index(progress);
  }
  /**
   *  Get a Feature DAO from Geometry Columns
   *
   *  @param {GeometryColumns} geometryColumns Geometry Columns
   *  @returns {FeatureDao}
   */
  getFeatureDaoWithGeometryColumns(geometryColumns: GeometryColumns): FeatureDao<FeatureRow> {
    if (!geometryColumns) {
      throw new Error('Non null Geometry Columns is required to create Feature DAO');
    }
    const tableReader = new FeatureTableReader(geometryColumns);
    const featureTable = tableReader.readFeatureTable(this);
    const dao = new FeatureDao(this, featureTable, geometryColumns, this.metadataDao);
    return dao;
  }
  /**
   * Get a Feature DAO from Contents
   * @param  {Contents}   contents Contents
   *  @returns {FeatureDao}
   */
  getFeatureDaoWithContents(contents: Contents): FeatureDao<FeatureRow> {
    const columns = this.contentsDao.getGeometryColumns(contents);
    return this.getFeatureDaoWithGeometryColumns(columns);
  }
  /**
   * Get a Feature DAO from Contents
   * @param  {string}   tableName table name
   *  @returns {FeatureDao}
   */
  getFeatureDao(tableName: string): FeatureDao<FeatureRow> {
    const geometryColumns = this.geometryColumnsDao.queryForTableName(tableName);
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
  queryForGeoJSONFeaturesInTable(tableName: string, boundingBox: BoundingBox): Feature[] {
    const featureDao = this.getFeatureDao(tableName);
    const features = [];
    const iterator = featureDao.queryForGeoJSONIndexedFeaturesWithBoundingBox(boundingBox);
    for (const feature of iterator) {
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
  iterateGeoJSONFeaturesInTableWithinBoundingBox(
    tableName: string,
    boundingBox: BoundingBox,
  ): IterableIterator<Feature> {
    const featureDao = this.getFeatureDao(tableName);
    return featureDao.queryForGeoJSONIndexedFeaturesWithBoundingBox(boundingBox);
  }
  /**
   * Create the Geometry Columns table if it does not already exist
   * @returns {Promise}
   */
  async createGeometryColumnsTable(): Promise<boolean> {
    if (this.geometryColumnsDao.isTableExists()) {
      return true;
    }
    return this.tableCreator.createGeometryColumns();
  }
  /**
   * Get a Attribute DAO
   * @param  {string}   tableName table name
   * @returns {AttributeDao}
   */
  getAttributeDaoWithTableName(tableName: string): AttributeDao<AttributeRow> {
    const contents = this.contentsDao.queryForId(tableName);
    return this.getAttributeDaoWithContents(contents);
  }
  /**
   * Get a Attribute DAO
   * @param  {Contents}   contents Contents
   * @returns {AttributeDao}
   */
  getAttributeDaoWithContents(contents: Contents): AttributeDao<AttributeRow> {
    if (!contents) {
      throw new Error('Non null Contents is required to create an Attributes DAO');
    }
    const reader = new AttributeTableReader(contents.table_name);
    const table: AttributeTable = reader.readTable(this.connection) as AttributeTable;
    table.setContents(contents);
    return new AttributeDao(this, table);
  }
  /**
   * Create an attribute table with the properties specified.
   * @param {module:geoPackage~GeoPackage} geopackage the geopackage object
   * @param tableName name of the table to create
   * @param {Object[]} properties properties to create columns from
   * @param {string} properties.name name of the column
   * @param {string} properties.dataType name of the data type
   * @param {DataColumns} [properties.dataColumn] data column for the property
   * @return {Promise}
   */
  async createAttributeTable(
    tableName: string,
    columns:
      | UserColumn[]
      | {
          name: string;
          dataType: string;
          dataColumn?: {
            table_name: string;
            column_name: string;
            name?: string;
            title?: string;
            description?: string;
            mime_type?: string;
            constraint_name?: string;
          };
        }[],
    dataColumns?: DataColumns[],
  ): Promise<boolean> {
    let attributeCoulmns: UserColumn[] = [];
    if (columns && columns.length > 0 && columns[0] instanceof UserColumn) {
      attributeCoulmns = columns as UserColumn[];
    } else {
      let columnNumber = 0;
      attributeCoulmns.push(UserColumn.createPrimaryKeyColumnWithIndexAndName(columnNumber++, 'id'));

      dataColumns = [];

      for (let i = 0; i < columns.length; i++) {
        const property = columns[i] as {
          name: string;
          dataType: string;
          dataColumn?: {
            table_name: string;
            column_name: string;
            name?: string;
            title?: string;
            description?: string;
            mime_type?: string;
            constraint_name?: string;
          };
        };
        attributeCoulmns.push(
          UserColumn.createColumn(columnNumber++, property.name, DataTypes.fromName(property.dataType)),
        );
        if (property.dataColumn) {
          const dc = new DataColumns();
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
    }
    const attributeTable = new AttributeTable(tableName, attributeCoulmns);
    this.tableCreator.createUserTable(attributeTable);
    const contents = new Contents();
    contents.table_name = tableName;
    contents.data_type = ContentsDao.GPKG_CDT_ATTRIBUTES_NAME;
    contents.identifier = tableName;
    contents.last_change = new Date().toISOString();
    this.contentsDao.create(contents);
    if (dataColumns && dataColumns.length) {
      await this.createDataColumns();
      const dataColumnsDao = this.dataColumnsDao;
      dataColumns.forEach(function(dataColumn) {
        dataColumnsDao.create(dataColumn);
      });
    }
    return true;
  }

  /**
   * Create a media table with the properties specified.  These properties are added to the required columns
   * @param {module:geoPackage~GeoPackage} geopackage the geopackage object
   * @param {Object[]} properties properties to create columns from
   * @param {string} properties.name name of the column
   * @param {string} properties.dataType name of the data type
   * @return {Promise}
   */
  createMediaTable(
    tableName: string,
    properties: { name: string; dataType: string; notNull?: boolean; defaultValue?: DBValue; max?: number }[],
  ): MediaDao<MediaRow> {
    const relatedTables = this.relatedTablesExtension;
    const columns = [];
    let columnNumber = MediaTable.numRequiredColumns();
    if (properties) {
      for (let i = 0; i < properties.length; i++) {
        const property = properties[i];
        columns.push(
          UserColumn.createColumn(
            columnNumber++,
            property.name,
            DataTypes.fromName(property.dataType),
            property.notNull,
            property.defaultValue,
            property.max,
          ),
        );
      }
    }
    const mediaTable = MediaTable.create(tableName, columns);
    relatedTables.createRelatedTable(mediaTable);
    return relatedTables.getMediaDao(mediaTable);
  }

  async linkMedia(baseTableName: string, baseId: number, mediaTableName: string, mediaId: number): Promise<number> {
    const relatedTables = this.relatedTablesExtension;
    return relatedTables.linkRelatedIds(baseTableName, baseId, mediaTableName, mediaId, RelationType.MEDIA);
  }

  getLinkedMedia(baseTableName: string, baseId: number): MediaRow[] {
    const relationships = this.getRelatedRows(baseTableName, baseId);
    const mediaRelationships = [];
    for (let i = 0; i < relationships.length; i++) {
      const relationship = relationships[i];
      if (relationship.relation_name === RelationType.MEDIA.name) {
        for (let r = 0; r < relationship.mappingRows.length; r++) {
          const row = relationship.mappingRows[r].row;
          mediaRelationships.push(row);
        }
      }
    }

    return mediaRelationships;
  }

  /**
   * Adds a GeoJSON feature to the GeoPackage
   * @param  {module:geoPackage~GeoPackage}   geopackage open GeoPackage object
   * @param  {object}   feature    GeoJSON feature to add
   * @param  {string}   tableName  name of the table that will store the feature
   * @param {boolean} index updates the FeatureTableIndex extension if it exists
   */
  addGeoJSONFeatureToGeoPackage(feature: Feature, tableName: string, index = false): number {
    const featureDao = this.getFeatureDao(tableName);
    const srs = featureDao.getSrs();
    const featureRow = featureDao.newRow();
    const geometryData = new GeometryData();
    geometryData.setSrsId(srs.srs_id);
    if (!(srs.organization === 'EPSG' && srs.organization_coordsys_id === 4326)) {
      feature = reproject.reproject(feature, 'EPSG:4326', featureDao.projection);
    }

    const featureGeometry = typeof feature.geometry === 'string' ? JSON.parse(feature.geometry) : feature.geometry;
    const geometry = wkx.Geometry.parseGeoJSON(featureGeometry);
    geometryData.setGeometry(geometry);
    featureRow.setGeometry(geometryData);
    for (const propertyKey in feature.properties) {
      if (Object.prototype.hasOwnProperty.call(feature.properties, propertyKey)) {
        featureRow.setValueWithColumnName(propertyKey, feature.properties[propertyKey]);
      }
    }

    const id = featureDao.create(featureRow);
    if (index) {
      const fti = featureDao.featureTableIndex;
      const tableIndex = fti.getTableIndex();
      if (!tableIndex) return id;
      fti.indexRow(tableIndex, id, geometryData);
      fti.updateLastIndexed(tableIndex);
    }
    return id;
  }

  addAttributeRow(tableName: string, row: Record<string, DBValue>): number {
    const attributeDao = this.getAttributeDaoWithTableName(tableName);
    const attributeRow = attributeDao.getRow(row);
    return attributeDao.create(attributeRow);
  }

  /**
   * Create a simple attributes table with the properties specified.
   * @param {Object[]} properties properties to create columns from
   * @param {string} properties.name name of the column
   * @param {string} properties.dataType name of the data type
   * @return {Promise}
   */
  createSimpleAttributesTable(
    tableName: string,
    properties: { name: string; dataType: string }[],
  ): SimpleAttributesDao<SimpleAttributesRow> {
    const relatedTables = this.relatedTablesExtension;
    const columns = [];
    let columnNumber = SimpleAttributesTable.numRequiredColumns();
    if (properties) {
      for (let i = 0; i < properties.length; i++) {
        const property = properties[i];
        columns.push(
          UserColumn.createColumn(columnNumber++, property.name, DataTypes.fromName(property.dataType), true),
        );
      }
    }
    const simpleAttributesTable = SimpleAttributesTable.create(tableName, columns);
    relatedTables.createRelatedTable(simpleAttributesTable);
    return relatedTables.getSimpleAttributesDao(simpleAttributesTable);
  }

  addMedia(
    tableName: string,
    dataBuffer: Buffer,
    contentType: string,
    additionalProperties?: Record<string, DBValue>,
  ): number {
    const relatedTables = this.relatedTablesExtension;
    const mediaDao = relatedTables.getMediaDao(tableName);
    const row = mediaDao.newRow();
    row.setContentType(contentType);
    row.setData(dataBuffer);
    for (const key in additionalProperties) {
      row.setValueWithColumnName(key, additionalProperties[key]);
    }
    return mediaDao.create(row);
  }

  getRelatedRows(baseTableName: string, baseId: number): ExtendedRelation[] {
    return this.relatedTablesExtension.getRelatedRows(baseTableName, baseId);
  }

  /**
   * Create the given {@link module:features/user/featureTable~FeatureTable}
   * @param  {FeatureTable}   featureTable    feature table
   */
  createUserFeatureTable(featureTable: FeatureTable): { lastInsertRowid: number; changes: number } {
    return this.tableCreator.createUserTable(featureTable);
  }
  async createFeatureTableFromProperties(
    tableName: string,
    properties: { name: string; dataType: string }[],
  ): Promise<boolean> {
    const geometryColumn = new GeometryColumns();
    geometryColumn.table_name = tableName;
    geometryColumn.column_name = 'geometry';
    geometryColumn.geometry_type_name = 'GEOMETRY';
    geometryColumn.z = 0;
    geometryColumn.m = 0;

    const columns: UserColumn[] = [];
    let columnNumber = 0;
    columns.push(FeatureColumn.createPrimaryKeyColumnWithIndexAndName(columnNumber++, 'id'));
    columns.push(
      FeatureColumn.createGeometryColumn(
        columnNumber++,
        geometryColumn.column_name,
        geometryColumn.geometry_type_name,
        false,
        null,
      ),
    );

    for (let i = 0; properties && i < properties.length; i++) {
      const property = properties[i] as { name: string; dataType: string };
      columns.push(FeatureColumn.createColumn(columnNumber++, property.name, DataTypes.fromName(property.dataType)));
    }
    return this.createFeatureTable(tableName, geometryColumn, columns);
  }
  async createFeatureTable(
    tableName: string,
    geometryColumns?: GeometryColumns,
    featureColumns?: UserColumn[] | { name: string; dataType: string }[],
    boundingBox: BoundingBox = new BoundingBox(-180, 180, -90, 90),
    srsId = 4326,
    dataColumns?: DataColumns[],
  ): Promise<boolean> {
    await this.createGeometryColumnsTable();

    let geometryColumn;
    if (geometryColumns) {
      geometryColumn = geometryColumns;
    } else {
      geometryColumn = new GeometryColumns();
      geometryColumn.table_name = tableName;
      geometryColumn.column_name = 'geometry';
      geometryColumn.geometry_type_name = 'GEOMETRY';
      geometryColumn.z = 0;
      geometryColumn.m = 0;
    }

    let columns: UserColumn[] = [];
    if (featureColumns && featureColumns.length > 0 && featureColumns[0] instanceof UserColumn) {
      columns = featureColumns as UserColumn[];
    } else {
      let columnNumber = 0;
      columns.push(FeatureColumn.createPrimaryKeyColumnWithIndexAndName(columnNumber++, 'id'));
      columns.push(
        FeatureColumn.createGeometryColumn(
          columnNumber++,
          geometryColumn.column_name,
          geometryColumn.geometry_type_name,
          false,
          null,
        ),
      );

      for (let i = 0; featureColumns && i < featureColumns.length; i++) {
        const property = featureColumns[i] as { name: string; dataType: string };
        columns.push(FeatureColumn.createColumn(columnNumber++, property.name, DataTypes.fromName(property.dataType)));
      }
    }

    const featureTable = new FeatureTable(geometryColumn.table_name, columns);
    this.createUserFeatureTable(featureTable);
    const contents = new Contents();
    contents.table_name = geometryColumn.table_name;
    contents.data_type = ContentsDao.GPKG_CDT_FEATURES_NAME;
    contents.identifier = geometryColumn.table_name;
    contents.last_change = new Date().toISOString();
    contents.min_x = boundingBox.minLongitude;
    contents.min_y = boundingBox.minLatitude;
    contents.max_x = boundingBox.maxLongitude;
    contents.max_y = boundingBox.maxLatitude;
    contents.srs_id = srsId;
    this.contentsDao.create(contents);
    geometryColumn.srs_id = srsId;
    this.geometryColumnsDao.create(geometryColumn);
    if (dataColumns) {
      await this.createDataColumns();
      const dataColumnsDao = this.dataColumnsDao;
      dataColumns.forEach(function(dataColumn) {
        dataColumnsDao.create(dataColumn);
      });
    }
    return true;
  }

  /**
   * Create the Tile Matrix Set table if it does not already exist
   * @returns {Promise} resolves when the table is created
   */
  async createTileMatrixSetTable(): Promise<boolean> {
    if (this.tileMatrixSetDao.isTableExists()) {
      return true;
    }
    return this.tableCreator.createTileMatrixSet();
  }
  /**
   * Create the Tile Matrix table if it does not already exist
   * @returns {Promise} resolves when the table is created
   */
  async createTileMatrixTable(): Promise<boolean> {
    if (this.tileMatrixDao.isTableExists()) {
      return true;
    }
    return this.tableCreator.createTileMatrix();
  }
  /**
   * Create the given tile table in this GeoPackage.
   *
   * @param  {module:tiles/user/tileTable~TileTable} tileTable
   * @return {object} the result of {@link module:db/geoPackageConnection~GeoPackageConnection#run}
   */
  createTileTable(tileTable: TileTable): { lastInsertRowid: number; changes: number } {
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
  async createTileTableWithTableName(
    tableName: string,
    contentsBoundingBox: BoundingBox,
    contentsSrsId: number,
    tileMatrixSetBoundingBox: BoundingBox,
    tileMatrixSetSrsId: number,
  ): Promise<TileMatrixSet> {
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
    tileMatrixSet.contents = contents;
    tileMatrixSet.srs_id = tileMatrixSetSrsId;
    tileMatrixSet.min_x = tileMatrixSetBoundingBox.minLongitude;
    tileMatrixSet.min_y = tileMatrixSetBoundingBox.minLatitude;
    tileMatrixSet.max_x = tileMatrixSetBoundingBox.maxLongitude;
    tileMatrixSet.max_y = tileMatrixSetBoundingBox.maxLatitude;
    await this.createTileMatrixSetTable();
    await this.createTileMatrixTable();
    this.createTileTable(tileTable);
    this.contentsDao.create(contents);
    this.tileMatrixSetDao.create(tileMatrixSet);
    return tileMatrixSet;
  }

  /**
   * Create the [tables and rows](https://www.geopackage.org/spec121/index.html#tiles)
   * necessary to store tiles according to the ubiquitous [XYZ web/slippy-map tiles](https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames) scheme.
   * The extent for the [contents table]{@link module:core/contents~Contents} row,
   * `contentsBoundingBox`, is [informational only](https://www.geopackage.org/spec121/index.html#gpkg_contents_cols),
   * and need not match the [tile matrix set]{@link module:tiles/matrixset~TileMatrixSet}
   * extent, `tileMatrixSetBoundingBox`, which should be the precise bounding box
   * used to calculate the tile row and column coordinates of all tiles in the
   * tile set.  The two SRS ID parameters, `contentsSrsId` and `tileMatrixSetSrsId`,
   * must match, however.  See {@link module:tiles/matrixset~TileMatrixSet} for
   * more information about how GeoPackage consumers use the bouding boxes for a
   * tile set.
   *
   * @param {string} tableName the name of the table that will store the tiles
   * @param {BoundingBox} contentsBoundingBox the bounds stored in the [`gpkg_contents`]{@link module:core/contents~Contents} table row for the tile matrix set
   * @param {SRSRef} contentsSrsId the ID of a [spatial reference system]{@link module:core/srs~SpatialReferenceSystem}; must match `tileMatrixSetSrsId`
   * @param {BoundingBox} tileMatrixSetBoundingBox the bounds stored in the [`gpkg_tile_matrix_set`]{@link module:tiles/matrixset~TileMatrixSet} table row
   * @param {SRSRef} tileMatrixSetSrsId the ID of a [spatial reference system]{@link module:core/srs~SpatialReferenceSystem}
   *   for the [tile matrix set](https://www.geopackage.org/spec121/index.html#_tile_matrix_set) table; must match `contentsSrsId`
   * @param {number} minZoom the zoom level of the lowest resolution [tile matrix]{@link module:tiles/matrix~TileMatrix} in the tile matrix set
   * @param {number} maxZoom the zoom level of the highest resolution [tile matrix]{@link module:tiles/matrix~TileMatrix} in the tile matrix set
   * @param tileSize the width and height in pixels of the tile images; defaults to 256
   * @returns {Promise} a `Promise` that resolves with the created {@link module:tiles/matrixset~TileMatrixSet} object, or rejects with an `Error`
   *
   * @todo make `tileMatrixSetSrsId` optional because it always has to be the same anyway
   */
  async createStandardWebMercatorTileTable(
    tableName: string,
    contentsBoundingBox: BoundingBox,
    contentsSrsId: number,
    tileMatrixSetBoundingBox: BoundingBox,
    tileMatrixSetSrsId: number,
    minZoom: number,
    maxZoom: number,
    tileSize = 256,
  ): Promise<TileMatrixSet> {
    const tileMatrixSet = await this.createTileTableWithTableName(
      tableName,
      contentsBoundingBox,
      contentsSrsId,
      tileMatrixSetBoundingBox,
      tileMatrixSetSrsId,
    );
    this.createStandardWebMercatorTileMatrix(tileMatrixSetBoundingBox, tileMatrixSet, minZoom, maxZoom, tileSize);
    return tileMatrixSet;
  }

  /**
   * Create the tables and rows necessary to store tiles in a {@link module:tiles/matrixset~TileMatrixSet}.
   * This will create a [tile matrix row]{@link module:tiles/matrix~TileMatrix}
   * for every integral zoom level in the range `[minZoom..maxZoom]`.
   *
   * @param {BoundingBox} epsg3857TileBoundingBox
   * @param {TileMatrixSet} tileMatrixSet
   * @param {number} minZoom
   * @param {number} maxZoom
   * @param {number} [tileSize=256] optional tile size in pixels
   * @returns {module:geoPackage~GeoPackage} `this` `GeoPackage`
   */
  createStandardWebMercatorTileMatrix(
    epsg3857TileBoundingBox: BoundingBox,
    tileMatrixSet: TileMatrixSet,
    minZoom: number,
    maxZoom: number,
    tileSize = 256,
  ): GeoPackage {
    tileSize = tileSize || 256;
    const tileMatrixDao = this.tileMatrixDao;
    for (let zoom = minZoom; zoom <= maxZoom; zoom++) {
      const box = TileBoundingBoxUtils.webMercatorTileBox(epsg3857TileBoundingBox, zoom);
      const matrixWidth = box.maxLongitude - box.minLongitude + 1;
      const matrixHeight = box.maxLatitude - box.minLatitude + 1;
      const pixelXSize =
        (epsg3857TileBoundingBox.maxLongitude - epsg3857TileBoundingBox.minLongitude) / matrixWidth / tileSize;
      const pixelYSize =
        (epsg3857TileBoundingBox.maxLatitude - epsg3857TileBoundingBox.minLatitude) / matrixHeight / tileSize;
      const tileMatrix = new TileMatrix();
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
  addTile(tileStream: any, tableName: string, zoom: number, tileRow: number, tileColumn: number): number {
    const tileDao = this.getTileDao(tableName);
    const newRow = tileDao.newRow();
    newRow.zoomLevel = zoom;
    newRow.tileColumn = tileColumn;
    newRow.tileRow = tileRow;
    newRow.tileData = tileStream;
    return tileDao.create(newRow);
  }

  /**
   * Gets a tile from the specified table
   * @param  {string}   table      name of the table to get the tile from
   * @param  {Number}   zoom       zoom level of the tile
   * @param  {Number}   tileRow    row of the tile
   * @param  {Number}   tileColumn column of the tile
   *
   * @todo jsdoc return value
   */
  getTileFromTable(table: string, zoom: number, tileRow: number, tileColumn: number): TileRow {
    const tileDao = this.getTileDao(table);
    return tileDao.queryForTile(tileColumn, tileRow, zoom);
  }

  /**
   * Gets the tiles in the EPSG:4326 bounding box
   * @param  {module:geoPackage~GeoPackage}   geopackage open GeoPackage object
   * @param  {string}   table      name of the tile table
   * @param  {Number}   zoom       Zoom of the tiles to query for
   * @param  {Number}   west       EPSG:4326 western boundary
   * @param  {Number}   east       EPSG:4326 eastern boundary
   * @param  {Number}   south      EPSG:4326 southern boundary
   * @param  {Number}   north      EPSG:4326 northern boundary
   */
  getTilesInBoundingBox(
    table: string,
    zoom: number,
    west: number,
    east: number,
    south: number,
    north: number,
  ): {
    columns: {
      index: number;
      name: string;
      max?: number;
      min?: number;
      notNull?: boolean;
      primaryKey?: boolean;
    }[];
    srs: SpatialReferenceSystem;
    tiles: {
      tableName: string;
      id: number;
      minLongitude: number;
      maxLongitude: number;
      minLatitude: number;
      maxLatitude: number;
      projection: string;
      values: string[];
    }[];
    west?: string;
    east?: string;
    south?: string;
    north?: string;
    zoom?: number;
  } {
    const tiles = {
      columns: [],
      srs: undefined,
      tiles: [],
      west: undefined,
      east: undefined,
      south: undefined,
      north: undefined,
      zoom: undefined,
    } as {
      columns: {
        index: number;
        name: string;
        max: number;
        min: number;
        notNull: boolean;
        primaryKey: boolean;
      }[];
      srs: SpatialReferenceSystem;
      tiles: {
        tableName: string;
        id: number;
        minLongitude: number;
        maxLongitude: number;
        minLatitude: number;
        maxLatitude: number;
        projection: string;
        values: string[];
      }[];
      west?: string;
      east?: string;
      south?: string;
      north?: string;
      zoom?: number;
    };

    const tileDao = this.getTileDao(table);
    if (zoom < tileDao.minZoom || zoom > tileDao.maxZoom) {
      return;
    }
    for (let i = 0; i < tileDao.table.columns.length; i++) {
      const column = tileDao.table.columns[i];
      tiles.columns.push({
        index: column.index,
        name: column.name,
        max: column.max,
        min: column.min,
        notNull: column.notNull,
        primaryKey: column.primaryKey,
      });
    }
    const srs = tileDao.getSrs();
    tiles.srs = srs;
    tiles.tiles = [];

    const tms = tileDao.tileMatrixSet;
    const tm = tileDao.getTileMatrixWithZoomLevel(zoom);
    if (!tm) {
      return tiles;
    }
    let mapBoundingBox = new BoundingBox(Math.max(-180, west), Math.min(east, 180), south, north);
    tiles.west = Math.max(-180, west).toFixed(2);
    tiles.east = Math.min(east, 180).toFixed(2);
    tiles.south = south.toFixed(2);
    tiles.north = north.toFixed(2);
    tiles.zoom = zoom;
    mapBoundingBox = mapBoundingBox.projectBoundingBox(
      'EPSG:4326',
      tileDao.srs.organization.toUpperCase() + ':' + tileDao.srs.organization_coordsys_id,
    );

    const grid = TileBoundingBoxUtils.getTileGridWithTotalBoundingBox(
      tms.boundingBox,
      tm.matrix_width,
      tm.matrix_height,
      mapBoundingBox,
    );

    const iterator = tileDao.queryByTileGrid(grid, zoom);

    for (const row of iterator) {
      const tile = {} as {
        tableName: string;
        id: number;
        minLongitude: number;
        maxLongitude: number;
        minLatitude: number;
        maxLatitude: number;
        projection: string;
        values: string[];
      } & Record<string, any>;
      tile.tableName = table;
      tile.id = row.getId();

      const tileBB = TileBoundingBoxUtils.getTileBoundingBox(tms.boundingBox, tm, row.tileColumn, row.row);
      tile.minLongitude = tileBB.minLongitude;
      tile.maxLongitude = tileBB.maxLongitude;
      tile.minLatitude = tileBB.minLatitude;
      tile.maxLatitude = tileBB.maxLatitude;
      tile.projection = tileDao.srs.organization.toUpperCase() + ':' + tileDao.srs.organization_coordsys_id;
      tile.values = [];
      for (let i = 0; i < tiles.columns.length; i++) {
        const value = row.values[tiles.columns[i].name];
        if (tiles.columns[i].name === 'tile_data') {
          tile.values.push('data');
        } else if (value === null || value === 'null') {
          tile.values.push('');
        } else {
          tile.values.push(value.toString());
          tile[tiles.columns[i].name] = value;
        }
      }
      tiles.tiles.push(tile);
    }
    return tiles;
  }

  /**
   * Gets the tiles in the EPSG:4326 bounding box
   * @param  {module:geoPackage~GeoPackage}   geopackage open GeoPackage object
   * @param  {string}   table      name of the tile table
   * @param  {Number}   webZoom       Zoom of the tiles to query for
   * @param  {Number}   west       EPSG:4326 western boundary
   * @param  {Number}   east       EPSG:4326 eastern boundary
   * @param  {Number}   south      EPSG:4326 southern boundary
   * @param  {Number}   north      EPSG:4326 northern boundary
   */
  getTilesInBoundingBoxWebZoom(
    table: string,
    webZoom: number,
    west: number,
    east: number,
    south: number,
    north: number,
  ): {
    columns: {
      index: number;
      name: string;
      max?: number;
      min?: number;
      notNull?: boolean;
      primaryKey?: boolean;
    }[];
    srs: SpatialReferenceSystem;
    tiles: {
      tableName: string;
      id: number;
      minLongitude: number;
      maxLongitude: number;
      minLatitude: number;
      maxLatitude: number;
      projection: string;
      values: string[];
    }[];
    west?: string;
    east?: string;
    south?: string;
    north?: string;
    zoom?: number;
  } {
    const tiles = {
      columns: [],
      srs: undefined,
      tiles: [],
      west: undefined,
      east: undefined,
      south: undefined,
      north: undefined,
      zoom: undefined,
    } as {
      columns: {
        index: number;
        name: string;
        max: number;
        min: number;
        notNull: boolean;
        primaryKey: boolean;
      }[];
      srs: SpatialReferenceSystem;
      tiles: {
        tableName: string;
        id: number;
        minLongitude: number;
        maxLongitude: number;
        minLatitude: number;
        maxLatitude: number;
        projection: string;
        values: string[];
      }[];
      west?: string;
      east?: string;
      south?: string;
      north?: string;
      zoom?: number;
    };

    const tileDao = this.getTileDao(table);
    if (webZoom < tileDao.minWebMapZoom || webZoom > tileDao.maxWebMapZoom) {
      return;
    }
    tiles.columns = [];
    for (let i = 0; i < tileDao.table.columns.length; i++) {
      const column = tileDao.table.columns[i];
      tiles.columns.push({
        index: column.index,
        name: column.name,
        max: column.max,
        min: column.min,
        notNull: column.notNull,
        primaryKey: column.primaryKey,
      });
    }
    const srs = tileDao.getSrs();
    tiles.srs = srs;
    tiles.tiles = [];

    const zoom = tileDao.webZoomToGeoPackageZoom(webZoom);

    const tms = tileDao.tileMatrixSet;
    const tm = tileDao.getTileMatrixWithZoomLevel(zoom);
    if (!tm) {
      return tiles;
    }
    let mapBoundingBox = new BoundingBox(Math.max(-180, west), Math.min(east, 180), south, north);
    tiles.west = Math.max(-180, west).toFixed(2);
    tiles.east = Math.min(east, 180).toFixed(2);
    tiles.south = south.toFixed(2);
    tiles.north = north.toFixed(2);
    tiles.zoom = zoom;
    mapBoundingBox = mapBoundingBox.projectBoundingBox(
      'EPSG:4326',
      tileDao.srs.organization.toUpperCase() + ':' + tileDao.srs.organization_coordsys_id,
    );

    const grid = TileBoundingBoxUtils.getTileGridWithTotalBoundingBox(
      tms.boundingBox,
      tm.matrix_width,
      tm.matrix_height,
      mapBoundingBox,
    );

    const iterator = tileDao.queryByTileGrid(grid, zoom);
    for (const row of iterator) {
      const tile = {
        tableName: undefined,
        id: undefined,
        minLongitude: undefined,
        maxLongitude: undefined,
        minLatitude: undefined,
        maxLatitude: undefined,
        projection: undefined as string,
        values: [],
      } as {
        tableName: string;
        id: number;
        minLongitude: number;
        maxLongitude: number;
        minLatitude: number;
        maxLatitude: number;
        projection: string;
        values: any[];
      } & Record<string, any>;
      tile.tableName = table;
      tile.id = row.getId();

      const tileBB = TileBoundingBoxUtils.getTileBoundingBox(tms.boundingBox, tm, row.tileColumn, row.row);
      tile.minLongitude = tileBB.minLongitude;
      tile.maxLongitude = tileBB.maxLongitude;
      tile.minLatitude = tileBB.minLatitude;
      tile.maxLatitude = tileBB.maxLatitude;
      tile.projection = tileDao.srs.organization.toUpperCase() + ':' + tileDao.srs.organization_coordsys_id;
      tile.values = [];
      for (let i = 0; i < tiles.columns.length; i++) {
        const value = row.values[tiles.columns[i].name];
        if (tiles.columns[i].name === 'tile_data') {
          tile.values.push('data');
        } else if (value === null || value === 'null') {
          tile.values.push('');
        } else {
          tile.values.push(value.toString());
          tile[tiles.columns[i].name] = value;
        }
      }
      tiles.tiles.push(tile);
    }
    return tiles;
  }

  async getFeatureTileFromXYZ(
    table: string,
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
  ): Promise<any> {
    x = Number(x);
    y = Number(y);
    z = Number(z);
    width = Number(width);
    height = Number(height);
    const featureDao = this.getFeatureDao(table);
    if (!featureDao) return;
    const ft = new FeatureTiles(featureDao, width, height);
    return ft.drawTile(x, y, z);
  }

  getClosestFeatureInXYZTile(
    table: string,
    x: number,
    y: number,
    z: number,
    latitude: number,
    longitude: number,
  ): Feature & ClosestFeature {
    x = Number(x);
    y = Number(y);
    z = Number(z);

    const featureDao = this.getFeatureDao(table);
    if (!featureDao) return;
    const ft = new FeatureTiles(featureDao, 256, 256);
    const tileCount = ft.getFeatureCountXYZ(x, y, z);
    let boundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, z);
    boundingBox = boundingBox.projectBoundingBox('EPSG:3857', 'EPSG:4326');

    if (tileCount > 10000) {
      // too many, send back the entire tile
      // add the goepackage name and table
      const gj = boundingBox.toGeoJSON() as Feature & ClosestFeature;
      gj.feature_count = tileCount;
      gj.coverage = true;
      gj.gp_table = table;
      gj.gp_name = this.name;
      return gj;
    }
    const ne = [boundingBox.maxLongitude, boundingBox.maxLatitude];
    const sw = [boundingBox.minLongitude, boundingBox.minLatitude];
    const width = ne[0] - sw[0];
    const widthPerPixel = width / 256;
    const tolerance = 10 * widthPerPixel;
    boundingBox.maxLongitude = longitude + tolerance;
    boundingBox.minLongitude = longitude - tolerance;
    boundingBox.maxLatitude = latitude + tolerance;
    boundingBox.minLatitude = latitude - tolerance;
    const iterator = featureDao.queryForGeoJSONIndexedFeaturesWithBoundingBox(boundingBox);
    const features = [];
    let closestDistance = 100000000000;
    let closest: ClosestFeature & Feature;

    const centerPoint = helpers.point([longitude, latitude]);

    for (const feature of iterator) {
      feature.type = 'Feature';
      const distance = GeoPackage.determineDistance(centerPoint.geometry, feature);
      if (distance < closestDistance) {
        closest = feature as ClosestFeature & Feature;
        closestDistance = distance;
      } else if (distance === closestDistance && closest.geometry.type !== 'Point') {
        closest = feature as ClosestFeature & Feature;
        closestDistance = distance;
      }
      features.push(feature);
    }
    if (closest) {
      closest.gp_table = table;
      closest.gp_name = this.name;
      closest.distance = closestDistance;
    }
    return closest;
  }

  static determineDistance(point: Point, feature: Feature | FeatureCollection): number {
    if (feature.type === 'FeatureCollection') {
      feature.features.forEach(feature => {
        GeoPackage.determineDistance(point, feature);
      });
    } else {
      const geometry: Geometry = feature.geometry;
      if (geometry.type === 'Point') {
        return pointDistance(point, geometry);
      }
      if (geometry.type === 'LineString') {
        return this.determineDistanceFromLine(point, geometry);
      }
      if (geometry.type === 'MultiLineString') {
        let distance = Number.MAX_SAFE_INTEGER;
        geometry.coordinates.forEach(lineStringCoordinate => {
          const lineString: Feature = helpers.lineString(lineStringCoordinate);
          distance = Math.min(distance, GeoPackage.determineDistance(point, lineString));
        });
        return distance;
      }
      if (geometry.type === 'Polygon') {
        return GeoPackage.determineDistanceFromPolygon(point, geometry);
      }
      if (geometry.type === 'MultiPolygon') {
        return GeoPackage.determineDistanceFromPolygon(point, geometry);
      }
      return Number.MAX_SAFE_INTEGER;
    }
  }

  static determineDistanceFromLine(point: Point, lineString: LineString): number {
    return pointToLineDistance(point, lineString);
  }

  static determineDistanceFromPolygon(point: Point, polygon: Polygon | MultiPolygon): number {
    if (booleanPointInPolygon(point, polygon)) {
      return 0;
    }
    return GeoPackage.determineDistance(point, polygonToLine(polygon));
  }

  /**
   * Create the Data Columns table if it does not already exist
   */
  async createDataColumns(): Promise<boolean> {
    if (this.dataColumnsDao.isTableExists()) {
      return true;
    }
    return this.tableCreator.createDataColumns();
  }
  /**
   * Create the Data Column Constraints table if it does not already exist
   */
  async createDataColumnConstraintsTable(): Promise<boolean> {
    if (this.dataColumnConstraintsDao.isTableExists()) {
      return true;
    }
    return this.tableCreator.createDataColumnConstraints();
  }
  async createMetadataTable(): Promise<boolean> {
    if (this.metadataDao.isTableExists()) {
      return true;
    }
    return this.tableCreator.createMetadata();
  }
  async createMetadataReferenceTable(): Promise<boolean> {
    if (this.metadataReferenceDao.isTableExists()) {
      return true;
    }
    return this.tableCreator.createMetadataReference();
  }
  async createExtensionTable(): Promise<boolean> {
    if (this.extensionDao.isTableExists()) {
      return true;
    }
    return this.tableCreator.createExtensions();
  }
  async createTableIndexTable(): Promise<boolean> {
    if (this.tableIndexDao.isTableExists()) {
      return true;
    }
    return this.tableCreator.createTableIndex();
  }
  async createGeometryIndexTable(featureDao: FeatureDao<FeatureRow>): Promise<boolean> {
    const dao = this.getGeometryIndexDao(featureDao);
    if (dao.isTableExists()) {
      return true;
    }
    return this.tableCreator.createGeometryIndex();
  }
  async createStyleMappingTable(
    tableName: string,
    columns?: UserColumn[],
    dataColumns?: DataColumns[],
  ): Promise<boolean> {
    const attributeTable = new StyleMappingTable(tableName, columns);
    this.tableCreator.createUserTable(attributeTable);
    const contents = new Contents();
    contents.table_name = tableName;
    contents.data_type = ContentsDao.GPKG_CDT_ATTRIBUTES_NAME;
    contents.identifier = tableName;
    contents.last_change = new Date().toISOString();
    this.contentsDao.create(contents);
    if (dataColumns) {
      await this.createDataColumns();
      const dataColumnsDao = this.dataColumnsDao;
      dataColumns.forEach(function(dataColumn) {
        dataColumnsDao.create(dataColumn);
      });
    }
    return true;
  }
  /**
   * Get the application id of the GeoPackage
   * @returns {string} application id
   */
  getApplicationId(): string {
    return this.database.getApplicationId();
  }

  static createDataColumnMap(featureDao: FeatureDao<FeatureRow>): ColumnMap {
    const columnMap: Record<string, any> = {};
    const dcd = new DataColumnsDao(featureDao.geoPackage);
    featureDao.table.columns.forEach(
      function(column: UserColumn): void {
        const dataColumn = dcd.getDataColumns(featureDao.table.table_name, column.name);
        columnMap[column.name] = {
          index: column.index,
          name: column.name,
          max: column.max,
          min: column.min,
          notNull: column.notNull,
          primaryKey: column.primaryKey,
          dataType: column.dataType ? DataTypes.nameFromType(column.dataType) : '',
          displayName: dataColumn && dataColumn.name ? dataColumn.name : column.name,
          dataColumn: dataColumn,
        };
      }.bind(this),
    );
    return columnMap;
  }

  /**
   * @typedef {Object} GeoJSONFeatureIterator
   * @property {SpatialReferenceSystem} srs SRS of the iterator
   * @property {FeatureDao} featureDao featureDao of the iterator objects
   * @property {IterableIterator<FeatureRow>} results iterator of results
   */

  /**
   * Iterate GeoJSON features from table
   * @param  {module:geoPackage~GeoPackage} geopackage      open GeoPackage object
   * @param  {string} table           Table name to Iterate
   * @return {GeoJSONFeatureIterator}
   */
  iterateGeoJSONFeaturesFromTable(
    table: string,
  ): { srs: SpatialReferenceSystem; featureDao: FeatureDao<FeatureRow>; results: IterableIterator<Feature> } {
    const featureDao = this.getFeatureDao(table);
    if (!featureDao) {
      throw new Error('No Table exists with the name ' + table);
    }

    const columnMap = GeoPackage.createDataColumnMap(featureDao);

    const srs = featureDao.getSrs();

    const iterator = featureDao.queryForEach();

    return {
      srs: srs,
      featureDao: featureDao,
      results: {
        [Symbol.iterator](): IterableIterator<Feature> {
          return this;
        },
        next: function(): IteratorResult<Feature> {
          const nextRow = iterator.next();
          if (!nextRow.done) {
            let featureRow;
            let geometry;

            while (!nextRow.done && !geometry) {
              featureRow = featureDao.getRow(nextRow.value);
              return {
                value: GeoPackage.parseFeatureRowIntoGeoJSON(featureRow, srs, columnMap),
                done: false,
              };
            }
          }
          return {
            value: undefined,
            done: true,
          };
        }.bind(this),
      },
    };
  }

  /**
   * Gets a GeoJSON feature from the table by id
   * @param  {module:geoPackage~GeoPackage}   geopackage open GeoPackage object
   * @param  {string}   table      name of the table to get the feature from
   * @param  {Number}   featureId  ID of the feature
   */
  getFeature(table: string, featureId: number): Feature {
    const featureDao = this.getFeatureDao(table);
    const srs = featureDao.getSrs();
    let feature = featureDao.queryForId(featureId) as FeatureRow;
    if (!feature) {
      let features = featureDao.queryForAllEq('_feature_id', featureId);
      if (features.length) {
        feature = featureDao.getRow(features[0]) as FeatureRow;
      } else {
        features = featureDao.queryForAllEq('_properties_id', featureId);
        if (features.length) {
          feature = featureDao.getRow(features[0]) as FeatureRow;
        }
      }
    }
    if (feature) {
      return GeoPackage.parseFeatureRowIntoGeoJSON(feature, srs);
    }
  }

  // eslint-disable-next-line complexity
  static parseFeatureRowIntoGeoJSON(
    featureRow: FeatureRow,
    srs: SpatialReferenceSystem,
    columnMap?: ColumnMap,
  ): Feature {
    const geoJson: Feature = {
      type: 'Feature',
      properties: {},
      id: undefined,
      geometry: undefined,
    };
    const geometry = featureRow.getGeometry();
    if (geometry && geometry.geometry) {
      let geoJsonGeom = geometry.geometry.toGeoJSON() as Geometry;
      if (
        srs.definition &&
        srs.definition !== 'undefined' &&
        srs.organization.toUpperCase() + ':' + srs.organization_coordsys_id !== 'EPSG:4326'
      ) {
        geoJsonGeom = reproject.reproject(geoJsonGeom, srs.projection, 'EPSG:4326');
      }
      geoJson.geometry = geoJsonGeom;
    }

    for (const key in featureRow.values) {
      if (
        Object.prototype.hasOwnProperty.call(featureRow.values, key) &&
        key !== featureRow.getGeometryColumn().name &&
        key !== 'id'
      ) {
        if (key.toLowerCase() === '_feature_id') {
          geoJson.id = featureRow.values[key] as string | number;
        } else if (key.toLowerCase() === '_properties_id') {
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
   * Gets the features in the EPSG:3857 tile
   * @param  {string}   table      name of the feature table
   * @param  {Number}   x       x tile number
   * @param  {Number}   y       y tile number
   * @param  {Number}   z      z tile number
   * @param  {Boolean}   [skipVerification]      skip the extra verification to determine if the feature really is within the tile
   */
  async getGeoJSONFeaturesInTile(
    table: string,
    x: number,
    y: number,
    z: number,
    skipVerification = false,
  ): Promise<Feature[]> {
    const webMercatorBoundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, z);
    const bb = webMercatorBoundingBox.projectBoundingBox('EPSG:3857', 'EPSG:4326');
    await this.indexFeatureTable(table);
    const featureDao = this.getFeatureDao(table);
    if (!featureDao) return;
    const features = [];
    const iterator = featureDao.queryForGeoJSONIndexedFeaturesWithBoundingBox(bb, skipVerification);
    for (const feature of iterator) {
      features.push(feature);
    }
    return features;
  }

  /**
   * Gets the features in the EPSG:4326 bounding box
   * @param  {string}   table      name of the feature table
   * @param  {Number}   west       EPSG:4326 western boundary
   * @param  {Number}   east       EPSG:4326 eastern boundary
   * @param  {Number}   south      EPSG:4326 southern boundary
   * @param  {Number}   north      EPSG:4326 northern boundary
   */
  async getFeaturesInBoundingBox(
    table: string,
    west: number,
    east: number,
    south: number,
    north: number,
  ): Promise<IterableIterator<FeatureRow>> {
    await this.indexFeatureTable(table);
    const featureDao = this.getFeatureDao(table);
    if (!featureDao) throw new Error('Unable to find table ' + table);
    const bb = new BoundingBox(west, east, south, north);
    const iterator = featureDao.queryIndexedFeaturesWithBoundingBox(bb);
    return iterator;
  }

  /**
   * Get the standard 3857 XYZ tile from the GeoPackage.  If a canvas is provided, the tile will be drawn in the canvas
   * @param  {string}   table      name of the table containing the tiles
   * @param  {Number}   x          x index of the tile
   * @param  {Number}   y          y index of the tile
   * @param  {Number}   z          zoom level of the tile
   * @param  {Number}   width      width of the resulting tile
   * @param  {Number}   height     height of the resulting tile
   * @param  {any}   canvas     canvas element to draw the tile into
   */
  async xyzTile(table: string, x: number, y: number, z: number, width = 256, height = 256, canvas?: any): Promise<any> {
    width = Number(width);
    height = Number(height);
    const tileDao = this.getTileDao(table);
    const retriever = new GeoPackageTileRetriever(tileDao, width, height);
    if (!canvas) {
      return retriever.getTile(x, y, z);
    } else {
      return retriever.drawTileIn(x, y, z, canvas);
    }
  }

  /**
   * Draws a tile projected into the specified projection, bounded by the specified by the bounds in EPSG:4326 into the canvas or the image is returned if no canvas is passed in
   * @param  {string}   table      name of the table containing the tiles
   * @param  {Number}   minLat     minimum latitude bounds of tile
   * @param  {Number}   minLon     minimum longitude bounds of tile
   * @param  {Number}   maxLat     maximum latitude bounds of tile
   * @param  {Number}   maxLon     maximum longitude bounds of tile
   * @param  {Number}   z          zoom level of the tile
   * @param  {Number}   width      width of the resulting tile
   * @param  {Number}   height     height of the resulting tile
   * @param  {any}   canvas     canvas element to draw the tile into
   */
  async projectedTile(
    table: string,
    minLat: number,
    minLon: number,
    maxLat: number,
    maxLon: number,
    z: number,
    projection: 'EPSG:4326',
    width = 256,
    height = 256,
    canvas?: any,
  ): Promise<any> {
    const tileDao = this.getTileDao(table);
    const retriever = new GeoPackageTileRetriever(tileDao, width, height);
    const bounds = new BoundingBox(minLon, maxLon, minLat, maxLat);
    return retriever.getTileWithWgs84BoundsInProjection(bounds, z, projection, canvas);
  }

  getInfoForTable(tableDao: TileDao | FeatureDao<FeatureRow>): any {
    const info = {
      tableName: tableDao.table_name,
      tableType: tableDao.table.getTableType(),
      count: tableDao.getCount(),
      geometryColumns: undefined as {
        tableName: string;
        geometryColumn: string;
        geometryTypeName: string;
        z?: number;
        m?: number;
      },
      minZoom: undefined as number,
      maxZoom: undefined as number,
      minWebMapZoom: undefined as number,
      maxWebMapZoom: undefined as number,
      zoomLevels: undefined as number,
      tileMatrixSet: undefined as {
        srsId: number;
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
      },
      contents: undefined as {
        tableName: string;
        dataType: string;
        identifier: string;
        description: string;
        lastChange: string;
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
        srs: {
          name: string;
          id: number;
          organization: string;
          organization_coordsys_id: number;
          definition: string;
          description: string;
        };
      },
      srs: undefined as {
        name: string;
        id: number;
        organization: string;
        organization_coordsys_id: number;
        definition: string;
        description: string;
      },
      columns: undefined as {
        index: number;
        name: string;
        max?: number;
        min?: number;
        notNull?: boolean;
        primaryKey?: boolean;
        dataType?: DataTypes;
        displayName: string;
        dataColumn?: DataColumns;
      }[],
      columnMap: undefined as ColumnMap,
    };
    if (tableDao instanceof FeatureDao) {
      info.geometryColumns = {
        tableName: tableDao.geometryColumns.table_name,
        geometryColumn: tableDao.geometryColumns.column_name,
        geometryTypeName: tableDao.geometryColumns.geometry_type_name,
        z: tableDao.geometryColumns.z,
        m: tableDao.geometryColumns.m,
      };
    }
    if (tableDao instanceof TileDao) {
      info.minZoom = tableDao.minZoom;
      info.maxZoom = tableDao.maxZoom;
      info.minWebMapZoom = tableDao.minWebMapZoom;
      info.maxWebMapZoom = tableDao.maxWebMapZoom;
      info.zoomLevels = tableDao.tileMatrices.length;
    }
    let contents: Contents;
    if (tableDao instanceof FeatureDao) {
      contents = this.geometryColumnsDao.getContents(tableDao.geometryColumns);
    } else if (tableDao instanceof TileDao) {
      contents = this.tileMatrixSetDao.getContents(tableDao.tileMatrixSet);
      info.tileMatrixSet = {
        srsId: tableDao.tileMatrixSet.srs_id,
        minX: tableDao.tileMatrixSet.min_x,
        maxX: tableDao.tileMatrixSet.max_x,
        minY: tableDao.tileMatrixSet.min_y,
        maxY: tableDao.tileMatrixSet.max_y,
      };
    }

    const contentsSrs = this.contentsDao.getSrs(contents);
    info.contents = {
      tableName: contents.table_name,
      dataType: contents.data_type,
      identifier: contents.identifier,
      description: contents.description,
      lastChange: contents.last_change,
      minX: contents.min_x,
      maxX: contents.max_x,
      minY: contents.min_y,
      maxY: contents.max_y,
      srs: {
        name: contentsSrs.srs_name,
        id: contentsSrs.srs_id,
        organization: contentsSrs.organization,
        organization_coordsys_id: contentsSrs.organization_coordsys_id,
        definition: contentsSrs.definition,
        description: contentsSrs.description,
      },
    };
    info.contents.srs = {
      name: contentsSrs.srs_name,
      id: contentsSrs.srs_id,
      organization: contentsSrs.organization,
      organization_coordsys_id: contentsSrs.organization_coordsys_id,
      definition: contentsSrs.definition,
      description: contentsSrs.description,
    };
    const srs = tableDao.getSrs();
    info.srs = {
      name: srs.srs_name,
      id: srs.srs_id,
      organization: srs.organization,
      organization_coordsys_id: srs.organization_coordsys_id,
      definition: srs.definition,
      description: srs.description,
    };
    info.columns = [];
    info.columnMap = {};
    const dcd = this.dataColumnsDao;
    tableDao.table.columns.forEach(
      function(column: UserColumn): any {
        const dataColumn = dcd.getDataColumns(tableDao.table.table_name, column.name);
        info.columns.push({
          index: column.index,
          name: column.name,
          max: column.max,
          min: column.min,
          notNull: column.notNull,
          primaryKey: column.primaryKey,
          dataType: column.dataType,
          displayName: dataColumn && dataColumn.name ? dataColumn.name : column.name,
          dataColumn: dataColumn,
        });
        info.columnMap[column.name] = info.columns[info.columns.length - 1];
      }.bind(this),
    );
    return info;
  }

  static loadProjections(items: string[]): void {
    if (!items) throw new Error('Invalid array of projections');
    for (let i = 0; i < items.length; i++) {
      if (!anyDefs[items[i]]) throw new Error('Projection not found');
      this.addProjection(items[i], anyDefs[items[i]]);
    }
  }
  static addProjection(name: string, definition: string): void {
    if (!name || !definition) throw new Error('Invalid projection name/definition');
    proj4.defs('' + name, '' + definition);
  }
  static hasProjection(name: string): proj4.ProjectionDefinition {
    return proj4.defs('' + name);
  }
}

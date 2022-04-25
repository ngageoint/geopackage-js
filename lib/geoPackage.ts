import wkx from 'wkx';
// @ts-ignore
import reproject from 'reproject';
import pointToLineDistance from '@turf/point-to-line-distance';
import polygonToLine from '@turf/polygon-to-line';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
// @ts-ignore
import pointDistance from '@turf/distance';
import * as helpers from '@turf/helpers';
import proj4 from 'proj4';
import { Feature, FeatureCollection, Geometry, LineString, MultiPolygon, Point, Polygon } from 'geojson';

import { GeometryData } from './geom/geometryData';
import { GeoPackageConnection } from './db/geoPackageConnection';
import { CrsWktExtension } from './extension/crsWkt';
import { RelatedTablesExtension } from './extension/relatedTables';
import { FeatureStyleExtension } from './extension/style';
import { ContentsIdExtension } from './extension/contents';
import { TileScalingExtension } from './extension/scale';
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
import { AttributesDao } from './attributes/attributesDao';
import { TileDao } from './tiles/user/tileDao';
import { ContentsIdDao } from './extension/contents/contentsIdDao';
import { TileScalingDao } from './extension/scale/tileScalingDao';
import { AttributesTable } from './attributes/attributesTable';
import { TileTableReader } from './tiles/user/tileTableReader';
import { AttributesTableReader } from './attributes/attributesTableReader';
import { FeatureTable } from './features/user/featureTable';
import { StyleMappingTable } from './extension/style/styleMappingTable';
import { TileTable } from './tiles/user/tileTable';
import { Contents } from './core/contents/contents';
import { GeoPackageDataType } from './db/geoPackageDataType';
import { SchemaExtension } from './extension/schema';
import { GeometryColumns } from './features/columns/geometryColumns';
import { TableCreator } from './db/tableCreator';
import { TileMatrix } from './tiles/matrix/tileMatrix';
import { TileBoundingBoxUtils } from './tiles/tileBoundingBoxUtils';
import { BoundingBox } from './boundingBox';
import { TileMatrixSet } from './tiles/matrixset/tileMatrixSet';
import { UserColumn } from './user/userColumn';
import { DataColumns } from './dataColumns/dataColumns';
import { AttributesRow } from './attributes/attributesRow';
import { SpatialReferenceSystem } from './core/srs/spatialReferenceSystem';
import { FeatureRow } from './features/user/featureRow';
import { GeoPackageValidate, GeoPackageValidationError } from './validate/geoPackageValidate';
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
import { TileScaling } from './extension/scale/tileScaling';
import { TileScalingType } from './extension/scale/tileScalingType';
import { AttributesColumn } from './attributes/attributesColumn';
import { AlterTable } from './db/alterTable';
import { GeoPackageExtensions } from './extension/geoPackageExtensions';
import { ContentsDataType } from './core/contents/contentsDataType';
import { UserMappingTable } from './extension/relatedTables/userMappingTable';
import { GeometryType } from './features/user/geometryType';
import { Constraints } from './db/table/constraints';
import { Projection } from './projection/projection';
import { ProjectionConstants } from './projection/projectionConstants';
import {SqliteQueryBuilder} from "./db/sqliteQueryBuilder";

type ColumnMap = {
  [key: string]: {
    index: number;
    name: string;
    max?: number;
    min?: number;
    notNull?: boolean;
    primaryKey?: boolean;
    dataType?: GeoPackageDataType;
    displayName: string;
    dataColumn?: DataColumns;
  };
};

export interface ClosestFeature {
  feature_count: number;
  coverage: boolean;
  gp_table: string;
  gp_name: string;
  distance?: number;
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
  private _tileScalingDao: TileScalingDao;
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
    this.loadSpatialReferenceSystemsIntoProj4();
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
  loadSpatialReferenceSystemsIntoProj4(): void {
    this.spatialReferenceSystemDao.getAllSpatialReferenceSystems().forEach(spatialReferenceSystem => {
      try {
        if (spatialReferenceSystem.srs_id > 0 && (spatialReferenceSystem.organization !== ProjectionConstants.EPSG ||
          (spatialReferenceSystem.organization_coordsys_id !== ProjectionConstants.EPSG_CODE_4326 &&
          spatialReferenceSystem.organization_coordsys_id !== ProjectionConstants.EPSG_CODE_3857)))
        Projection.loadProjection([spatialReferenceSystem.organization, spatialReferenceSystem.organization_coordsys_id].join(':'), spatialReferenceSystem.definition)
      } catch (e) {}
    })
  }
  validate(): GeoPackageValidationError[] {
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
  get tileScalingDao(): TileScalingDao {
    return this._tileScalingDao || (this._tileScalingDao = new TileScalingDao(this));
  }
  get contentsIdExtension(): ContentsIdExtension {
    return this._contentsIdExtension || (this._contentsIdExtension = new ContentsIdExtension(this));
  }
  get featureStyleExtension(): FeatureStyleExtension {
    return this._featureStyleExtension || (this._featureStyleExtension = new FeatureStyleExtension(this));
  }
  getTileScalingExtension(tableName: string): TileScalingExtension {
    return new TileScalingExtension(this, tableName);
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
  createRequiredTables(): GeoPackage {
    this.tableCreator.createRequired();
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
   * Get a Tile DAO
   * @param table
   * @returns {TileDao}
   */
  getTileDao(table: string | Contents | TileMatrixSet): TileDao<TileRow> {
    if (table instanceof Contents) {
      table = this.contentsDao.getTileMatrixSet(table);
    } else if (!(table instanceof TileMatrixSet)) {
      const tms = this.tileMatrixSetDao;
      const results = tms.queryForAllEq(TileMatrixSetDao.COLUMN_TABLE_NAME, table);
      if (results.length > 1) {
        throw new Error(
          'Unexpected state. More than one Tile Matrix Set matched for table name: ' +
            table +
            ', count: ' +
            results.length,
        );
      } else if (results.length === 0) {
        throw new Error('No Tile Matrix found for table name: ' + table);
      }
      table = tms.createObject(results[0]);
    }

    if (!table) {
      throw new Error('Non null TileMatrixSet is required to create Tile DAO');
    }
    const tileMatrices: TileMatrix[] = [];
    const tileMatrixDao = this.tileMatrixDao;
    const results = tileMatrixDao.queryForAllEq(
      TileMatrixDao.COLUMN_TABLE_NAME,
      table.table_name,
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
      const tm = tileMatrixDao.createObject(result);
      // verify first that there are actual tiles at this zoom level due to QGIS doing weird things and
      // creating tile matrix entries for zoom levels that have no tiles
      if (tileMatrixDao.hasTiles(tm)) {
        tileMatrices.push(tm);
      }
    });
    const tableReader = new TileTableReader(table);
    const tileTable = tableReader.readTileTable(this);
    return new TileDao(this, tileTable, table, tileMatrices);
  }

  /**
   * Return a hash containing arrays of table names grouped under keys `features`,
   * `tiles`, and `attributes`.
   * @return {{features: string[], tiles: string[], attributes: string[]}}
   */
  getTables(): { features: string[]; tiles: string[]; attributes: string[] };

  getTables(
    fullInformation = false,
  ):
    | { features: Contents[]; tiles: Contents[]; attributes: Contents[] }
    | { features: string[]; tiles: string[]; attributes: string[] } {
    if (!fullInformation) {
      const tables = {
        features: this.getFeatureTables(),
        tiles: this.getTileTables(),
        attributes: this.getAttributesTables(),
      };
      return tables;
    } else {
      const tables = {
        features: this.contentsDao.getContentsForTableType(ContentsDataType.FEATURES),
        tiles: this.contentsDao.getContentsForTableType(ContentsDataType.TILES),
        attributes: this.contentsDao.getContentsForTableType(ContentsDataType.ATTRIBUTES),
      };
      return tables;
    }
  }

  getAttributesTables(): string[] {
    return this.contentsDao.getTables(ContentsDataType.ATTRIBUTES);
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
    return cd.getTables(ContentsDataType.TILES);
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
    return cd.getTables(ContentsDataType.FEATURES);
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

  dropTable(tableName: string): boolean {
    return this.connection.dropTable(tableName);
  }
  /**
   * {@inheritDoc}
   */
  deleteTable(table: string) {
    GeoPackageExtensions.deleteTableExtensions(this, table);
    this.contentsDao.deleteTable(table);
  }

  /**
   * {@inheritDoc}
   */
  deleteTableQuietly(tableName: string) {
    try {
      this.deleteTable(tableName);
    } catch (e) {
      // eat
    }
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
   * Get a Feature DAO from Contents
   *  @returns {FeatureDao}
   * @param table
   */
  getFeatureDao(table: string | Contents | GeometryColumns): FeatureDao<FeatureRow> {
    if (table instanceof Contents) {
      table = this.contentsDao.getGeometryColumns(table);
    } else if (!(table instanceof GeometryColumns)) {
      table = this.geometryColumnsDao.queryForTableName(table);
    }

    if (!table) {
      throw new Error('Non null Geometry Columns is required to create Feature DAO');
    }
    const tableReader = new FeatureTableReader(table);
    const featureTable = tableReader.readFeatureTable(this);
    return new FeatureDao(this, featureTable, table, this.metadataDao);
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
   * Create the Geometry Columns table if it does not already exist
   * @returns {Promise}
   */
  createGeometryColumnsTable(): boolean {
    if (this.geometryColumnsDao.isTableExists()) {
      return true;
    }
    return this.tableCreator.createGeometryColumns();
  }
  /**
   * Get a Attribute DAO
   * @param  {Contents}   contents Contents
   * @returns {AttributesDao}
   */
  getAttributeDao(table: Contents | string): AttributesDao<AttributesRow> {
    if (!(table instanceof Contents)) {
      table = this.contentsDao.queryForId(table);
    }
    if (!table) {
      throw new Error('Non null Contents is required to create an Attributes DAO');
    }
    const reader = new AttributesTableReader(table.table_name);
    const attributeTable: AttributesTable = reader.readTable(this.connection) as AttributesTable;
    attributeTable.setContents(table);
    return new AttributesDao(this, attributeTable);
  }

  /**
   * Create AttributesTable from properties
   * @param tableName
   * @param properties
   */
  createAttributesTableFromProperties(
    tableName: string,
    properties: {
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
        }[]
  ): boolean {
    let attributeColumns: AttributesColumn[] = [];
    let columnNumber = 0;
    let dataColumns = [];
    attributeColumns.push(UserColumn.createPrimaryKeyColumn(columnNumber++, 'id'));
    for (let i = 0; i < properties.length; i++) {
      const property = properties[i] as {
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
      attributeColumns.push(
        UserColumn.createColumn(columnNumber++, property.name, GeoPackageDataType.fromName(property.dataType)),
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
    return this.createAttributesTable(tableName, attributeColumns, new Constraints(), dataColumns);
  }

  /**
   * Create attributes table for these columns, will add id column if no primary key column is defined
   * @param tableName
   * @param additionalColumns
   * @param constraints
   * @param dataColumns
   */
  createAttributesTable(tableName: string, additionalColumns: AttributesColumn[], constraints?: Constraints, dataColumns?: DataColumns[]): boolean {
    let columns = [];

    // Check for primary key field
    if (additionalColumns.findIndex(c => c.isPrimaryKey()) === -1) {
      columns.push(AttributesColumn.createPrimaryKeyColumn(AttributesColumn.NO_INDEX, 'id'))
    }

    additionalColumns.forEach(c => {
      columns.push(c.copy());
    });

    // Build the user attributes table
    let table = new AttributesTable(tableName, columns);

    // Add unique constraints
    if (constraints !== null && constraints !== undefined) {
      table.addConstraints(constraints);
    }

    // Create the user attributes table
    this.tableCreator.createUserTable(table);

    try {
      // Create the contents
      let contents = new Contents();
      contents.table_name = tableName;
      contents.data_type = ContentsDataType.ATTRIBUTES;
      contents.identifier = tableName;
      contents.last_change = new Date().toISOString();
      this.contentsDao.create(contents);
      table.setContents(contents);

      // create passed in data columns
      if (dataColumns && dataColumns.length) {
        this.createDataColumns();
        const dataColumnsDao = this.dataColumnsDao;
        dataColumns.forEach(dataColumn => {
          dataColumnsDao.create(dataColumn);
        });
      }
    } catch (e) {
      this.deleteTableQuietly(tableName);
      throw new Error("Failed to create table and metadata: " + tableName);
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
            GeoPackageDataType.fromName(property.dataType),
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

  linkMedia(baseTableName: string, baseId: number, mediaTableName: string, mediaId: number): number {
    return this.linkRelatedRows(baseTableName, baseId, mediaTableName, mediaId, RelationType.MEDIA);
  }

  /**
   * Links related rows together
   * @param baseId
   * @param baseTableName
   * @param relatedId
   * @param relatedTableName
   * @param  {string} relationType        relation type
   * @param  {string|UserMappingTable} [mappingTable]        mapping table
   * @param  {module:dao/columnValues~ColumnValues} [mappingColumnValues] column values
   * @return {number}
   */
  linkRelatedRows(
    baseTableName: string,
    baseId: number,
    relatedTableName: string,
    relatedId: number,
    relationType: RelationType,
    mappingTable?: string | UserMappingTable,
    mappingColumnValues?: Record<string, any>,
  ): number {
    const rte = this.relatedTablesExtension;
    const relationship = rte
      .getRelationshipBuilder()
      .setBaseTableName(baseTableName)
      .setRelatedTableName(relatedTableName)
      .setRelationType(relationType);
    let mappingTableName: string;
    if (!mappingTable || typeof mappingTable === 'string') {
      mappingTable = mappingTable || baseTableName + '_' + relatedTableName;
      relationship.setMappingTableName(mappingTable);
      mappingTableName = mappingTable as string;
    } else {
      relationship.setUserMappingTable(mappingTable);
      mappingTableName = mappingTable.getTableName();
    }
    rte.addRelationship(relationship);
    const userMappingDao = rte.getMappingDao(mappingTableName);
    const userMappingRow = userMappingDao.newRow();
    userMappingRow.baseId = baseId;
    userMappingRow.relatedId = relatedId;
    for (const column in mappingColumnValues) {
      userMappingRow.setValueWithColumnName(column, mappingColumnValues[column]);
    }
    return userMappingDao.create(userMappingRow);
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
   * Adds a list of features to a FeatureTable. Inserts features from the list in batches, providing progress updates
   * after each batch completes.
   * @param  {module:geoPackage~GeoPackage}   geopackage open GeoPackage object
   * @param  {object}   features    GeoJSON features to add
   * @param  {string}   tableName  name of the table that will store the feature
   * @param {boolean} index updates the FeatureTableIndex extension if it exists
   * @param {number} batchSize how many features are inserted in a single transaction,
   * progress is published after each batch is inserted. 1000 is recommended, 100 is about 25% slower,
   * but provides more updates and keeps the thread open.
   * @param  {function}  progress  optional progress function that is called after a batch of features has been
   * processed. The number of features added is sent as an argument to that function.
   * @return {Promise<number>} number of features inserted
   */
  async addGeoJSONFeaturesToGeoPackage (features: Feature[], tableName: string, index = false, batchSize = 1000,  progress?: (featuresAdded: number) => void): Promise<number> {
    let inserted = 0;
    const featureDao = this.getFeatureDao(tableName);
    const srs = featureDao.srs;
    let geometryData;
    let featureRow = featureDao.newRow();

    // empty geometry when none is present
    const emptyPoint = wkx.Geometry.parse('POINT EMPTY');

    // determine if we need to reproject to the srs of the table
    const reprojectionNeeded = !(srs.organization === ProjectionConstants.EPSG && srs.organization_coordsys_id === ProjectionConstants.EPSG_CODE_4326);

    // progress is called after each step
    const progressFunction = function(featuresAdded: any): void {
      setTimeout((progress || function(): void {}), 0, featuresAdded);
    };

    const insertSql = SqliteQueryBuilder.buildInsert("'" + featureDao.gpkgTableName + "'", featureRow);

    const stepFunction = async (start: number, end: number, resolve: Function) => {
      // execute step if there are still features
      if (start < end) {
        featureDao.connection.transaction(() => {
          // builds the insert sql statement
          const insertStatement = featureDao.connection.adapter.prepareStatement(insertSql);

          // determine if indexing is needed
          let fti;
          let tableIndex;
          if (index) {
            fti = featureDao.featureTableIndex;
            tableIndex = fti.tableIndex;
          }

          for (let i = start; i < end; i++) {
            let feature = features[i];
            featureRow = featureDao.newRow();
            geometryData = new GeometryData();
            geometryData.setSrsId(srs.srs_id);
            if (reprojectionNeeded) {
              feature = reproject.reproject(feature, ProjectionConstants.EPSG_4326, featureDao.projection);
            }
            const featureGeometry = typeof feature.geometry === 'string' ? JSON.parse(feature.geometry) : feature.geometry;
            geometryData.setGeometry(featureGeometry ? wkx.Geometry.parseGeoJSON(featureGeometry) : emptyPoint);
            featureRow.geometry = geometryData;
            for (const propertyKey in feature.properties) {
              if (Object.prototype.hasOwnProperty.call(feature.properties, propertyKey)) {
                featureRow.setValueWithColumnName(propertyKey, feature.properties[propertyKey]);
              }
            }
            // bind this feature's data to the insert statement and insert into the table
            const id = featureDao.connection.adapter.bindAndInsert(insertStatement, SqliteQueryBuilder.buildUpdateOrInsertObject(featureRow));
            inserted++;
            // if table index exists, be sure to index the row (note, rtree will run using a trigger)
            if (tableIndex != null) {
              fti.indexRow(tableIndex, id, geometryData);
            }
          }
          if (tableIndex != null) {
            fti.updateLastIndexed(tableIndex);
          }

          // close the prepared statement
          featureDao.connection.adapter.closeStatement(insertStatement);
        });
        progressFunction(end);
        setTimeout(() => {
          stepFunction(end, Math.min(end + batchSize, features.length), resolve);
        })
      } else {
        resolve(inserted);
      }
    }

    return new Promise ((resolve) => {
      setTimeout(() => {
        stepFunction(0, Math.min(batchSize, features.length), resolve);
      });
    });
  }

  addGeoJSONFeatureToGeoPackage(feature: Feature, tableName: string, index = false): number {
    const featureDao = this.getFeatureDao(tableName);
    return this.addGeoJSONFeatureToGeoPackageWithFeatureDaoAndSrs(feature, featureDao, featureDao.srs, index);
  }

  /**
   * Adds a GeoJSON feature to the GeoPackage
   * @param  {module:geoPackage~GeoPackage}   geopackage open GeoPackage object
   * @param  {object}   feature    GeoJSON feature to add
   * @param  {string}   featureDao  feature dao for the table
   * @param  {string}   srs  srs of the table
   * @param {boolean} index updates the FeatureTableIndex extension if it exists
   */
  addGeoJSONFeatureToGeoPackageWithFeatureDaoAndSrs(feature: Feature, featureDao: FeatureDao<FeatureRow>, srs: SpatialReferenceSystem, index = false): number {
    const featureRow = featureDao.newRow();
    const geometryData = new GeometryData();
    geometryData.setSrsId(srs.srs_id);
    if (!(srs.organization === ProjectionConstants.EPSG && srs.organization_coordsys_id === ProjectionConstants.EPSG_CODE_4326)) {
      feature = reproject.reproject(feature, ProjectionConstants.EPSG_4326, featureDao.projection);
    }

    const featureGeometry = typeof feature.geometry === 'string' ? JSON.parse(feature.geometry) : feature.geometry;
    if (featureGeometry !== null) {
      const geometry = wkx.Geometry.parseGeoJSON(featureGeometry);
      geometryData.setGeometry(geometry);
    } else {
      const temp = wkx.Geometry.parse('POINT EMPTY');
      geometryData.setGeometry(temp);
    }
    featureRow.geometry = geometryData;
    for (const propertyKey in feature.properties) {
      if (Object.prototype.hasOwnProperty.call(feature.properties, propertyKey)) {
        featureRow.setValueWithColumnName(propertyKey, feature.properties[propertyKey]);
      }
    }

    const id = featureDao.create(featureRow);
    if (index) {
      const fti = featureDao.featureTableIndex;
      const tableIndex = fti.tableIndex;
      if (!tableIndex) return id;
      fti.indexRow(tableIndex, id, geometryData);
      fti.updateLastIndexed(tableIndex);
    }
    return id;
  }

  addAttributeRow(tableName: string, row: Record<string, DBValue>): number {
    const attributeDao = this.getAttributeDao(tableName);
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
          UserColumn.createColumn(columnNumber++, property.name, GeoPackageDataType.fromName(property.dataType), true),
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
    row.contentType = contentType;
    row.data = dataBuffer;
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
  createFeatureTableFromProperties(
    tableName: string,
    properties: { name: string; dataType: string }[],
  ): boolean {
    const geometryColumn = new GeometryColumns();
    geometryColumn.table_name = tableName;
    geometryColumn.column_name = 'geometry';
    geometryColumn.geometry_type_name = 'GEOMETRY';
    geometryColumn.z = 0;
    geometryColumn.m = 0;

    const columns: UserColumn[] = [];
    let columnNumber = 0;
    columns.push(FeatureColumn.createPrimaryKeyColumn(columnNumber++, 'id'));
    columns.push(
      FeatureColumn.createGeometryColumn(
        columnNumber++,
        geometryColumn.column_name,
        GeometryType.GEOMETRY,
        false,
        null,
      ),
    );

    for (let i = 0; properties && i < properties.length; i++) {
      const property = properties[i] as { name: string; dataType: string };
      columns.push(FeatureColumn.createColumn(columnNumber++, property.name, GeoPackageDataType.fromName(property.dataType)));
    }
    return this.createFeatureTable(tableName, geometryColumn, columns);
  }

  createFeatureTable(
    tableName: string,
    geometryColumns?: GeometryColumns,
    featureColumns?: UserColumn[] | { name: string; dataType: string }[],
    boundingBox: BoundingBox = new BoundingBox(-180, 180, -90, 90),
    srsId: number = ProjectionConstants.EPSG_CODE_4326,
    dataColumns?: DataColumns[],
  ): boolean {
    const srs = this.spatialReferenceSystemDao.getBySrsId(srsId);
    if (!srs) {
      throw new Error('Spatial reference system (' + srsId + ') is not defined.');
    }

    this.createGeometryColumnsTable();

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

    let columns: FeatureColumn[] = [];
    if (featureColumns && featureColumns.length > 0 && featureColumns[0] instanceof UserColumn) {
      columns = featureColumns as FeatureColumn[];
    } else {
      let columnNumber = 0;
      columns.push(FeatureColumn.createPrimaryKeyColumn(columnNumber++, 'id'));
      columns.push(FeatureColumn.createGeometryColumn(columnNumber++, geometryColumn.column_name, GeometryType.GEOMETRY, false, null));

      for (let i = 0; featureColumns && i < featureColumns.length; i++) {
        const property = featureColumns[i] as { name: string; dataType: string };
        columns.push(FeatureColumn.createColumn(columnNumber++, property.name, GeoPackageDataType.fromName(property.dataType)));
      }
    }

    const featureTable = new FeatureTable(geometryColumn.table_name, geometryColumn.column_name, columns);
    this.createUserFeatureTable(featureTable);
    const contents = new Contents();
    contents.table_name = geometryColumn.table_name;
    contents.data_type = ContentsDataType.FEATURES;
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
      this.createDataColumns();
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
  createTileMatrixSetTable(): boolean {
    if (this.tileMatrixSetDao.isTableExists()) {
      return true;
    }
    return this.tableCreator.createTileMatrixSet();
  }
  /**
   * Create the Tile Matrix table if it does not already exist
   * @returns {Promise} resolves when the table is created
   */
  createTileMatrixTable(): boolean {
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
   * Adds a spatial reference system to the gpkg_spatial_ref_sys table to be used by feature and tile tables.
   * @param spatialReferenceSystem
   */
  createSpatialReferenceSystem(spatialReferenceSystem: SpatialReferenceSystem) {
    Projection.loadProjection([spatialReferenceSystem.organization.toUpperCase(), spatialReferenceSystem.organization_coordsys_id].join(':'), spatialReferenceSystem.definition)
    this.spatialReferenceSystemDao.create(spatialReferenceSystem)
  }

  /**
   * Create a new [tile table]{@link module:tiles/user/tileTable~TileTable} in this GeoPackage.
   *
   * @param {String} tableName tile table name
   * @param {BoundingBox} contentsBoundingBox bounding box of the contents table
   * @param {Number} contentsSrsId srs id of the contents table
   * @param {BoundingBox} tileMatrixSetBoundingBox bounding box of the matrix set
   * @param {Number} tileMatrixSetSrsId srs id of the matrix set
   * @returns {TileMatrixSet} `Promise` of the created {@link module:tiles/matrixset~TileMatrixSet}
   */
  createTileTableWithTableName(
    tableName: string,
    contentsBoundingBox: BoundingBox,
    contentsSrsId: number,
    tileMatrixSetBoundingBox: BoundingBox,
    tileMatrixSetSrsId: number,
  ): TileMatrixSet {
    let srs = this.spatialReferenceSystemDao.getBySrsId(contentsSrsId);
    if (!srs) {
      throw new Error('Spatial reference system (' + contentsSrsId + ') is not defined.');
    }
    srs = this.spatialReferenceSystemDao.getBySrsId(tileMatrixSetSrsId);
    if (!srs) {
      throw new Error('Spatial reference system (' + tileMatrixSetSrsId + ') is not defined.');
    }
    const columns = TileTable.createRequiredColumns(0);
    const tileTable = new TileTable(tableName, columns);
    const contents = new Contents();
    contents.table_name = tableName;
    contents.data_type = ContentsDataType.TILES;
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
    this.createTileMatrixSetTable();
    this.createTileMatrixTable();
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
   * @returns {TileMatrixSet} the created {@link module:tiles/matrixset~TileMatrixSet} object, or rejects with an `Error`
   *
   * @todo make `tileMatrixSetSrsId` optional because it always has to be the same anyway
   */
  createStandardWebMercatorTileTable(
    tableName: string,
    contentsBoundingBox: BoundingBox,
    contentsSrsId: number,
    tileMatrixSetBoundingBox: BoundingBox,
    tileMatrixSetSrsId: number,
    minZoom: number,
    maxZoom: number,
    tileSize = 256,
  ): TileMatrixSet {
    let webMercator = this.spatialReferenceSystemDao.getByOrganizationAndCoordSysId(ProjectionConstants.EPSG, ProjectionConstants.EPSG_CODE_3857);
    if (!webMercator) {
      this.spatialReferenceSystemDao.createWebMercator();
      webMercator = this.spatialReferenceSystemDao.getByOrganizationAndCoordSysId(ProjectionConstants.EPSG, ProjectionConstants.EPSG_CODE_3857);
    }
    const webMercatorSrsId = webMercator.srs_id;

    let srs = this.spatialReferenceSystemDao.getBySrsId(contentsSrsId);
    if (!srs) {
      throw new Error('Spatial reference system (' + contentsSrsId + ') is not defined.');
    }
    srs = this.spatialReferenceSystemDao.getBySrsId(tileMatrixSetSrsId);
    if (!srs) {
      throw new Error('Spatial reference system (' + tileMatrixSetSrsId + ') is not defined.');
    }

    if (contentsSrsId !== webMercatorSrsId) {
      const srsDao = new SpatialReferenceSystemDao(this);
      const from = srsDao.getBySrsId(contentsSrsId).projection;
      contentsBoundingBox = contentsBoundingBox.projectBoundingBox(from, ProjectionConstants.EPSG_3857);
    }
    if (tileMatrixSetSrsId !== webMercatorSrsId) {
      const srsDao = new SpatialReferenceSystemDao(this);
      const from = srsDao.getBySrsId(tileMatrixSetSrsId).projection;
      tileMatrixSetBoundingBox = tileMatrixSetBoundingBox.projectBoundingBox(from, ProjectionConstants.EPSG_3857);
    }
    const tileMatrixSet = this.createTileTableWithTableName(
      tableName,
      contentsBoundingBox,
      webMercatorSrsId,
      tileMatrixSetBoundingBox,
      webMercatorSrsId,
    );

    this.createStandardWebMercatorTileMatrix(tileMatrixSetBoundingBox, tileMatrixSet, minZoom, maxZoom, tileSize);
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
   * tile set.
   *
   * @param {string} tableName the name of the table that will store the tiles
   * @param {BoundingBox} contentsBoundingBox the bounds stored in the [`gpkg_contents`]{@link module:core/contents~Contents} table row for the tile matrix set. MUST BE EPSG:3857
   * @param {BoundingBox} tileMatrixSetBoundingBox the bounds stored in the [`gpkg_tile_matrix_set`]{@link module:tiles/matrixset~TileMatrixSet} table row. MUST BE EPSG:3857
   * @param {Set<number>} zoomLevels create tile of all resolutions in the set.
   * @param tileSize the width and height in pixels of the tile images; defaults to 256
   * @returns {Promise} a `Promise` that resolves with the created {@link module:tiles/matrixset~TileMatrixSet} object, or rejects with an `Error`
   *
   * @todo make `tileMatrixSetSrsId` optional because it always has to be the same anyway
   */
  async createStandardWebMercatorTileTableWithZoomLevels(
    tableName: string,
    contentsBoundingBox: BoundingBox,
    tileMatrixSetBoundingBox: BoundingBox,
    zoomLevels: Set<number>,
    tileSize = 256,
  ): Promise<TileMatrixSet> {
    let webMercator = this.spatialReferenceSystemDao.getByOrganizationAndCoordSysId(ProjectionConstants.EPSG, ProjectionConstants.EPSG_CODE_3857);
    if (!webMercator) {
      this.spatialReferenceSystemDao.createWebMercator();
      webMercator = this.spatialReferenceSystemDao.getByOrganizationAndCoordSysId(ProjectionConstants.EPSG, ProjectionConstants.EPSG_CODE_3857);
    }
    const webMercatorSrsId = webMercator.srs_id;
    const tileMatrixSet = await this.createTileTableWithTableName(
      tableName,
      contentsBoundingBox,
      webMercatorSrsId,
      tileMatrixSetBoundingBox,
      webMercatorSrsId,
    );
    this.createStandardWebMercatorTileMatrixWithZoomLevels(
      tileMatrixSetBoundingBox,
      tileMatrixSet,
      zoomLevels,
      tileSize,
    );
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
      this.createTileMatrixRow(epsg3857TileBoundingBox, tileMatrixSet, tileMatrixDao, zoom, tileSize);
    }
    return this;
  }
  /**
   * Create the tables and rows necessary to store tiles in a {@link module:tiles/matrixset~TileMatrixSet}.
   * This will create a [tile matrix row]{@link module:tiles/matrix~TileMatrix}
   * for every item in the set zoomLevels.
   *
   * @param {BoundingBox} epsg3857TileBoundingBox
   * @param {TileMatrixSet} tileMatrixSet
   * @param {Set<number>} zoomLevels
   * @param {number} [tileSize=256] optional tile size in pixels
   * @returns {module:geoPackage~GeoPackage} `this` `GeoPackage`
   */
  createStandardWebMercatorTileMatrixWithZoomLevels(
    epsg3857TileBoundingBox: BoundingBox,
    tileMatrixSet: TileMatrixSet,
    zoomLevels: Set<number>,
    tileSize = 256,
  ): GeoPackage {
    tileSize = tileSize || 256;
    const tileMatrixDao = this.tileMatrixDao;
    zoomLevels.forEach(zoomLevel => {
      this.createTileMatrixRow(epsg3857TileBoundingBox, tileMatrixSet, tileMatrixDao, zoomLevel, tileSize);
    });
    return this;
  }

  /**
   * Adds row to tileMatrixDao
   *
   * @param {BoundingBox} epsg3857TileBoundingBox
   * @param {TileMatrixSet} tileMatrixSet
   * @param {TileMatrixDao} tileMatrixDao
   * @param {number} zoomLevel
   * @param {number} [tileSize=256]
   * @returns {number}
   * @memberof GeoPackage
   */
  createTileMatrixRow(
    epsg3857TileBoundingBox: BoundingBox,
    tileMatrixSet: TileMatrixSet,
    tileMatrixDao: TileMatrixDao,
    zoomLevel: number,
    tileSize = 256,
  ): number {
    const box = TileBoundingBoxUtils.webMercatorTileBox(epsg3857TileBoundingBox, zoomLevel);
    const matrixWidth = box.maxLongitude - box.minLongitude + 1;
    const matrixHeight = box.maxLatitude - box.minLatitude + 1;
    const pixelXSize = (epsg3857TileBoundingBox.maxLongitude - epsg3857TileBoundingBox.minLongitude) / matrixWidth / tileSize;
    const pixelYSize = (epsg3857TileBoundingBox.maxLatitude - epsg3857TileBoundingBox.minLatitude) / matrixHeight / tileSize;
    const tileMatrix = new TileMatrix();
    tileMatrix.table_name = tileMatrixSet.table_name;
    tileMatrix.zoom_level = zoomLevel;
    tileMatrix.matrix_width = matrixWidth;
    tileMatrix.matrix_height = matrixHeight;
    tileMatrix.tile_width = tileSize;
    tileMatrix.tile_height = tileSize;
    tileMatrix.pixel_x_size = pixelXSize;
    tileMatrix.pixel_y_size = pixelYSize;
    return tileMatrixDao.create(tileMatrix);
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
    for (let i = 0; i < tileDao.table.getUserColumns().getColumns().length; i++) {
      const column = tileDao.table.getUserColumns().getColumns()[i];
      tiles.columns.push({
        index: column.index,
        name: column.name,
        max: column.max,
        min: column.min,
        notNull: column.notNull,
        primaryKey: column.primaryKey,
      });
    }
    const srs = tileDao.srs;
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
      ProjectionConstants.EPSG_4326,
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
      tile.id = row.id;

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
    for (let i = 0; i < tileDao.table.getUserColumns().getColumns().length; i++) {
      const column = tileDao.table.getUserColumns().getColumns()[i];
      tiles.columns.push({
        index: column.index,
        name: column.name,
        max: column.max,
        min: column.min,
        notNull: column.notNull,
        primaryKey: column.primaryKey,
      });
    }
    const srs = tileDao.srs;
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
      ProjectionConstants.EPSG_4326,
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
      tile.id = row.id;

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
    boundingBox = boundingBox.projectBoundingBox(ProjectionConstants.EPSG_3857, ProjectionConstants.EPSG_4326);

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
      } else if (distance === closestDistance && closest != null &&  closest.geometry.type !== 'Point') {
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
  createDataColumns(): boolean {
    if (this.dataColumnsDao.isTableExists()) {
      return true;
    }
    return this.tableCreator.createDataColumns();
  }
  /**
   * Create the Data Column Constraints table if it does not already exist
   */
  createDataColumnConstraintsTable(): boolean {
    if (this.dataColumnConstraintsDao.isTableExists()) {
      return true;
    }
    return this.tableCreator.createDataColumnConstraints();
  }
  createMetadataTable(): boolean {
    if (this.metadataDao.isTableExists()) {
      return true;
    }
    return this.tableCreator.createMetadata();
  }
  createMetadataReferenceTable(): boolean {
    if (this.metadataReferenceDao.isTableExists()) {
      return true;
    }
    return this.tableCreator.createMetadataReference();
  }
  createExtensionTable(): boolean {
    if (this.extensionDao.isTableExists()) {
      return true;
    }
    return this.tableCreator.createExtensions();
  }
  createTableIndexTable(): boolean {
    if (this.tableIndexDao.isTableExists()) {
      return true;
    }
    return this.tableCreator.createTableIndex();
  }
  createGeometryIndexTable(): boolean {
    const dao = this.getGeometryIndexDao(null);
    if (dao.isTableExists()) {
      return true;
    }
    return this.tableCreator.createGeometryIndex();
  }
  createStyleMappingTable(
    tableName: string,
    columns?: UserColumn[],
    dataColumns?: DataColumns[],
  ): boolean {
    const attributeTable = new StyleMappingTable(tableName, columns, null);
    this.tableCreator.createUserTable(attributeTable);
    const contents = new Contents();
    contents.table_name = tableName;
    contents.data_type = ContentsDataType.ATTRIBUTES;
    contents.identifier = tableName;
    contents.last_change = new Date().toISOString();
    this.contentsDao.create(contents);
    if (dataColumns) {
      this.createDataColumns();
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
    featureDao.table.getUserColumns().getColumns().forEach(
      function(column: UserColumn): void {
        const dataColumn = dcd.getDataColumns(featureDao.table.getTableName(), column.name);
        columnMap[column.name] = {
          index: column.index,
          name: column.name,
          max: column.max,
          min: column.min,
          notNull: column.notNull,
          primaryKey: column.primaryKey,
          dataType: column.dataType ? GeoPackageDataType.nameFromType(column.dataType) : '',
          displayName: dataColumn && dataColumn.name ? dataColumn.name : column.name,
          dataColumn: dataColumn,
        };
      }.bind(this),
    );
    return columnMap;
  }

  iterateGeoJSONFeatures(
    tableName: string,
    boundingBox?: BoundingBox,
  ): IterableIterator<Feature> & { srs: SpatialReferenceSystem; featureDao: FeatureDao<FeatureRow> } {
    const featureDao = this.getFeatureDao(tableName);
    return featureDao.queryForGeoJSONIndexedFeaturesWithBoundingBox(boundingBox);
  }

  /**
   * Gets a GeoJSON feature from the table by id
   * @param  {module:geoPackage~GeoPackage}   geopackage open GeoPackage object
   * @param  {string}   table      name of the table to get the feature from
   * @param  {Number}   featureId  ID of the feature
   */
  getFeature(table: string, featureId: number): Feature {
    const featureDao = this.getFeatureDao(table);
    const srs = featureDao.srs;
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
    const geometry = featureRow.geometry;
    if (geometry && geometry.geometry) {
      let geoJsonGeom = geometry.geometry.toGeoJSON() as Geometry;
      if (
        srs.definition &&
        srs.definition !== 'undefined' &&
        srs.organization.toUpperCase() + ':' + srs.organization_coordsys_id !== ProjectionConstants.EPSG_4326
      ) {
        geoJsonGeom = reproject.reproject(geoJsonGeom, srs.projection, ProjectionConstants.EPSG_4326);
      }
      geoJson.geometry = geoJsonGeom;
    }

    for (const key in featureRow.values) {
      if (
        Object.prototype.hasOwnProperty.call(featureRow.values, key) &&
        key !== featureRow.geometryColumn.name &&
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
      } else if (featureRow.geometryColumn.name === key) {
        // geoJson.properties[key] = geometry && !geometry.geometryError ? 'Valid' : geometry.geometryError;
      }
    }
    geoJson.id = geoJson.id || featureRow.id;
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
    const bb = webMercatorBoundingBox.projectBoundingBox(ProjectionConstants.EPSG_3857, ProjectionConstants.EPSG_4326);
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
    if (this.getTileScalingExtension(table).has()) {
      const tileScaling = this.getTileScalingExtension(table).dao.queryForTableName(table);
      if (tileScaling) {
        retriever.setScaling(tileScaling);
      }
    }
    if (!canvas) {
      return retriever.getTile(x, y, z);
    } else {
      return retriever.drawTileIn(x, y, z, canvas);
    }
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
  async xyzTileScaled(
    table: string,
    x: number,
    y: number,
    z: number,
    width = 256,
    height = 256,
    canvas?: any,
    zoomIn?: 2,
    zoomOut?: 2,
  ): Promise<any> {
    width = Number(width);
    height = Number(height);
    const tileDao = this.getTileDao(table);
    const retriever = new GeoPackageTileRetriever(tileDao, width, height);
    await this.getTileScalingExtension(table).getOrCreateExtension();
    const tileScaling = this.getTileScalingExtension(table).dao.queryForTableName(table);
    if (tileScaling) {
      retriever.setScaling(tileScaling);
    } else {
      // } else {
      const tileScaling = new TileScaling();
      tileScaling.zoom_in = zoomIn;
      tileScaling.zoom_out = zoomOut;
      tileScaling.table_name = table;
      tileScaling.scaling_type = TileScalingType.CLOSEST_IN_OUT;
      const tileScalingExtension = this.getTileScalingExtension(table);
      // await tileScalingExtension.getOrCreateExtension();
      tileScalingExtension.createOrUpdate(tileScaling);

      retriever.setScaling(tileScaling);
    }
    if (!canvas) {
      return retriever.getTile(x, y, z);
    } else {
      return retriever.drawTileIn(x, y, z, canvas);
    }
  }

  /**
   * Draws a tile projected into the specified projection, bounded by the specified by the bounds in EPSG:4326 into the canvas or the image is returned if no canvas is passed in.
   * @param  {string}   table      name of the table containing the tiles
   * @param  {Number}   minLat     minimum latitude bounds of tile
   * @param  {Number}   minLon     minimum longitude bounds of tile
   * @param  {Number}   maxLat     maximum latitude bounds of tile
   * @param  {Number}   maxLon     maximum longitude bounds of tile
   * @param  {Number}   z          zoom level of the tile
   * @param  {string}   projection project from tile's projection to this one.
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
    projection: string = ProjectionConstants.EPSG_4326,
    width = 256,
    height = 256,
    canvas?: any,
  ): Promise<any> {
    const tileDao = this.getTileDao(table);
    const retriever = new GeoPackageTileRetriever(tileDao, width, height);
    const bounds = new BoundingBox(minLon, maxLon, minLat, maxLat);
    return retriever.getTileWithWgs84BoundsInProjection(bounds, z, projection, canvas);
  }

  getInfoForTable(tableDao: TileDao<TileRow> | FeatureDao<FeatureRow>): any {
    const info = {
      tableName: tableDao.table_name,
      tableType: tableDao.table.tableType,
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
        dataType?: GeoPackageDataType;
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
    const srs = tableDao.srs;
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
    tableDao.table.getUserColumns().getColumns().forEach(
      function(column: UserColumn): any {
        const dataColumn = dcd.getDataColumns(tableDao.table.getTableName(), column.name);
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

  static addProjection(name: string, definition: string): void {
    if (!name || !definition) throw new Error('Invalid projection name/definition');
    proj4.defs(name, definition);
  }
  static hasProjection(name: string): proj4.ProjectionDefinition {
    return proj4.defs(name);
  }

  renameTable (tableName, newTableName) {
    const tableDataType = this.getTableDataType(tableName);
    if (tableDataType !== null && tableDataType !== undefined) {
      this.copyTableAndExtensions(tableName, newTableName);
      this.deleteTable(tableName);
    } else {
      AlterTable.renameTable(this.connection, tableName, newTableName)
    }
  }

  copyTableAndExtensions (tableName, newTableName) {
    this.copyTable(tableName, newTableName, true, true);
  }

  copyTableNoExtensions (tableName, newTableName) {
    this.copyTable(tableName, newTableName, true, false);
  }

  copyTableAsEmpty (tableName, newTableName) {
    this.copyTable(tableName, newTableName, false, false)
  }

  getTableDataType (tableName) {
    let tableType = null;
    const contentsDao = this.contentsDao;
    const contents = contentsDao.queryForId(tableName);
    if (contents !== null && contents !== undefined) {
      tableType = contents.data_type;
    }
    return tableType;
  }

  /**
   * Copy the table
   * @param tableName table name
   * @param newTableName new table name
   * @param transferContent transfer content flag
   * @param extensions extensions copy flag
   */
  copyTable (tableName, newTableName, transferContent, extensions) {
    const dataType = this.getTableDataType(tableName);
    if (dataType !== null && dataType !== undefined) {
      switch (dataType) {
        case ContentsDataType.ATTRIBUTES:
          this.copyAttributeTable(tableName, newTableName, transferContent);
          break;
        case ContentsDataType.FEATURES:
          this.copyFeatureTable(tableName, newTableName, transferContent);
          break;
        case ContentsDataType.TILES:
          this.copyTileTable(tableName, newTableName, transferContent);
          break;
        default:
          throw new Error('Unsupported data type: ' + dataType);
      }
    } else {
      this.copyUserTable(tableName, newTableName, transferContent, false);
    }

    // Copy extensions
    if (extensions) {
      GeoPackageExtensions.copyTableExtensions(this, tableName, newTableName)
    }
  }

  /**
   * Copy the attribute table
   * @param tableName table name
   * @param newTableName new table name
   * @param transferContent transfer content flag
   */
  copyAttributeTable (tableName, newTableName, transferContent) {
    this.copyUserTable(tableName, newTableName, transferContent);
  }

  /**
   * Copy the feature table
   * @param tableName table name
   * @param newTableName new table name
   * @param transferContent transfer content flag
   */
  copyFeatureTable (tableName, newTableName, transferContent) {
    const geometryColumnsDao = this.geometryColumnsDao;
    let geometryColumns = null;
    try {
      geometryColumns = geometryColumnsDao.queryForTableName(tableName);
    } catch (e) {
      throw new Error('Failed to retrieve table geometry columns: ' + tableName)
    }
    if (geometryColumns === null || geometryColumns === undefined) {
      throw new Error('No geometry columns for table: ' + tableName);
    }
    const contents = this.copyUserTable(tableName, newTableName, transferContent);
    geometryColumns.setContents(contents);
    try {
      geometryColumnsDao.create(geometryColumns);
    } catch (e) {
      throw new Error('Failed to create geometry columns for feature table: ' + newTableName);
    }
  }

  /**
   * Copy the tile table
   * @param tableName table name
   * @param newTableName new table name
   * @param transferContent transfer content flag
   */
  copyTileTable(tableName, newTableName, transferContent) {
    const tileMatrixSetDao = this.tileMatrixSetDao;
    let tileMatrixSet: TileMatrixSet = null;
    try {
      tileMatrixSet = tileMatrixSetDao.queryForId(tableName);
    } catch (e) {
      throw new Error('Failed to retrieve table tile matrix set: ' + tableName);
    }
    if (tileMatrixSet === null || tileMatrixSet === undefined) {
      throw new Error('No tile matrix set for table: ' + tableName);
    }
    const tileMatrixDao = this.tileMatrixDao;
    let tileMatrices: TileMatrix[] = null;
    try {
      tileMatrices = tileMatrixDao.queryForAllEq(TileMatrixDao.COLUMN_TABLE_NAME, tableName).map(results => tileMatrixDao.createObject(results));
    } catch (e) {
      throw new Error('Failed to retrieve table tile matrices: ' + tableName);
    }
    let contents = this.copyUserTable(tableName, newTableName, transferContent);
    tileMatrixSet.contents = contents;
    try {
      tileMatrixSetDao.create(tileMatrixSet);
    } catch (e) {
      throw new Error('Failed to create tile matrix set for tile table: ' + newTableName);
    }

    tileMatrices.forEach(tileMatrix => {
      tileMatrix.contents = contents;
      try {
        tileMatrixDao.create(tileMatrix);
      } catch (e) {
        throw new Error('Failed to create tile matrix for tile table: ' + newTableName);
      }
    });
  }

  /**
   * Copy the user table
   *
   * @param tableName table name
   * @param newTableName new table name
   * @param transferContent  transfer user table content flag
   * @param validateContents true to validate a contents was copied
   * @return copied contents
   * @since 3.3.0
   */
  copyUserTable(tableName, newTableName, transferContent, validateContents = true) {
    AlterTable.copyTableWithName(this.database, tableName, newTableName, transferContent);
    let contents = this.copyContents(tableName, newTableName);
    if ((contents === null || contents === undefined) && validateContents) {
      throw new Error('No table contents found for table: ' + tableName);
    }
    return contents;
  }

/**
 * Copy the contents
 * @param tableName table name
 * @param newTableName new table name
 * @return copied contents
 */
  copyContents(tableName: string, newTableName: string): Contents {
    let contents = this.getTableContents(tableName);

    if (contents !== null && contents !== undefined) {
      contents.table_name = newTableName;
      contents.identifier = newTableName;
      try {
        this.contentsDao.create(contents);
      } catch (e) {
        throw new Error('Failed to create contents for table: ' + newTableName + ', copied from table: ' + tableName);
      }
    }

    return contents;
  }
}

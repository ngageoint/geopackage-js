import { GeoPackage } from './geoPackage';
import { GeoPackageConnection } from './db/geoPackageConnection';
import { DataColumnsDao } from './dataColumns/dataColumnsDao';
import { MediaTable } from './extension/relatedTables/mediaTable';
import { SimpleAttributesTable } from './extension/relatedTables/simpleAttributesTable';
import { FeatureRow } from './features/user/featureRow';
import { RelationType } from './extension/relatedTables/relationType';
import { UserColumn } from './user/userColumn';
import { FeatureColumn } from './features/user/featureColumn';
import { SpatialReferenceSystem } from './core/srs/spatialReferenceSystem';
import { DataColumns } from './dataColumns/dataColumns';
import { DataTypes } from './db/dataTypes';
import { GeometryColumns } from './features/columns/geometryColumns';
import { GeometryData } from './geom/geometryData';
import { GeoPackageTileRetriever } from './tiles/retriever';
import { TileBoundingBoxUtils } from './tiles/tileBoundingBoxUtils';
import { BoundingBox } from './boundingBox';
import { GeoPackageValidate } from './validate/geoPackageValidate';
import { FeatureTiles } from './tiles/features';

import wkx from 'wkx';
import reproject from 'reproject';
import path from 'path';
import fs from 'fs';
import geojsonvt from 'geojson-vt';
import vtpbf from 'vt-pbf';
import Pbf from 'pbf';
// import VectorTile from '@mapbox/vector-tile';
import pointToLineDistance from '@turf/point-to-line-distance';
import polygonToLine from '@turf/polygon-to-line';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import pointDistance from '@turf/distance';
import * as helpers from '@turf/helpers';
import { TileMatrixSet } from './tiles/matrixset/tileMatrixSet';
import { FeatureDao } from './features/user/featureDao';
import { SimpleAttributesDao } from './extension/relatedTables/simpleAttributesDao';
import { SimpleAttributesRow } from './extension/relatedTables/simpleAttributesRow';
import { MediaDao } from './extension/relatedTables/mediaDao';
import { MediaRow } from './extension/relatedTables/mediaRow';
import { ExtendedRelation } from './extension/relatedTables/extendedRelation';
import { Feature, FeatureCollection, Point, Geometry, LineString, Polygon, MultiPolygon } from 'geojson';
import { TileRow } from './tiles/user/tileRow';

interface ClosestFeature extends Feature {
  gp_table?: string;
  gp_name?: string;
  distance?: number;
}

/**
 * This module is the entry point to the GeoPackage API, providing static
 * methods for opening and building GeoPackage files.
 */

export class GeoPackageAPI {
  static readonly version: string = '3.0.0';
  /**
   * In Node, open a GeoPackage file at the given path, or in a browser, load an
   * in-memory GeoPackage from the given byte array.
   * @param  {string|Uint8Array|Buffer} gppathOrByteArray path to the GeoPackage file or `Uint8Array` of GeoPackage bytes
   * @return {Promise<GeoPackage>} promise that resolves with the open {@link module:geoPackage~GeoPackage} object or rejects with an `Error`
   */
  static async open(gppathOrByteArray: string | Uint8Array | Buffer): Promise<GeoPackage> {
    const valid =
      typeof gppathOrByteArray !== 'string' ||
      (typeof gppathOrByteArray === 'string' &&
        (gppathOrByteArray.indexOf('http') === 0 ||
          !GeoPackageValidate.validateGeoPackageExtension(gppathOrByteArray)));
    if (!valid) {
      throw new Error('Invalid GeoPackage - Invalid GeoPackage Extension');
    }
    const connection = await GeoPackageConnection.connect(gppathOrByteArray);
    let geoPackage;
    if (gppathOrByteArray && typeof gppathOrByteArray === 'string') {
      geoPackage = new GeoPackage(path.basename(gppathOrByteArray), gppathOrByteArray, connection);
    } else {
      geoPackage = new GeoPackage('geopackage', undefined, connection);
    }
    if (GeoPackageValidate.hasMinimumTables(geoPackage)) {
      return geoPackage;
    } else {
      throw new Error('Invalid GeoPackage - GeoPackage does not have the minimum required tables');
    }
  }

  /**
   * In Node, create a GeoPackage file at the given file path, or in a browser,
   * create an in-memory GeoPackage.
   * @param  {string} gppath path of the created GeoPackage file; ignored in the browser
   * @return {Promise<typeof GeoPackage>} promise that resolves with the open {@link module:geoPackage~GeoPackage} object or rejects with an  `Error`
   */
  static async create(gppath?: string): Promise<GeoPackage> {
    const valid =
      typeof gppath !== 'string' ||
      (typeof gppath === 'string' && !GeoPackageValidate.validateGeoPackageExtension(gppath));
    if (!valid) {
      throw new Error('Invalid GeoPackage');
    }

    if (typeof process !== 'undefined' && process.version && gppath) {
      try {
        fs.mkdirSync(path.dirname(gppath));
      } catch (e) {
        // it's fine if we can't create the directory
      }
    }

    const connection = await GeoPackageConnection.connect(gppath);
    connection.setApplicationId();
    let geopackage: GeoPackage;
    if (gppath) {
      geopackage = new GeoPackage(path.basename(gppath), gppath, connection);
    } else {
      geopackage = new GeoPackage('geopackage', undefined, connection);
    }
    await geopackage.createRequiredTables();
    geopackage.createSupportedExtensions();

    return geopackage;
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
   * @param {module:geoPackage~GeoPackage} geopackage the GeoPackage that will store the tiles
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
  static async createStandardWebMercatorTileTable(
    geopackage: GeoPackage,
    tableName: string,
    contentsBoundingBox: BoundingBox,
    contentsSrsId: number,
    tileMatrixSetBoundingBox: BoundingBox,
    tileMatrixSetSrsId: number,
    minZoom: number,
    maxZoom: number,
    tileSize = 256,
  ): Promise<TileMatrixSet> {
    const tileMatrixSet = await geopackage.createTileTableWithTableName(
      tableName,
      contentsBoundingBox,
      contentsSrsId,
      tileMatrixSetBoundingBox,
      tileMatrixSetSrsId,
    );
    geopackage.createStandardWebMercatorTileMatrix(tileMatrixSetBoundingBox, tileMatrixSet, minZoom, maxZoom, tileSize);
    return tileMatrixSet;
  }

  static async createFeatureTable(
    geopackage: GeoPackage,
    tableName: string,
    geometryColumn: GeometryColumns,
    featureColumns?: UserColumn[],
  ): Promise<FeatureDao<FeatureRow>> {
    return GeoPackageAPI.createFeatureTableWithDataColumns(geopackage, tableName, geometryColumn, featureColumns, null);
  }

  static async createFeatureTableWithDataColumns(
    geopackage: GeoPackage,
    tableName: string,
    geometryColumn: GeometryColumns,
    featureColumns?: UserColumn[],
    dataColumns?: DataColumns[],
  ): Promise<FeatureDao<FeatureRow>> {
    const boundingBox = new BoundingBox(-180, 180, -90, 90);
    return GeoPackageAPI.createFeatureTableWithDataColumnsAndBoundingBox(
      geopackage,
      tableName,
      geometryColumn,
      featureColumns,
      dataColumns,
      boundingBox,
      4326,
    );
  }

  static async createFeatureTableWithDataColumnsAndBoundingBox(
    geopackage: GeoPackage,
    tableName: string,
    geometryColumn: GeometryColumns,
    featureColumns?: UserColumn[],
    dataColumns?: DataColumns[],
    boundingBox?: BoundingBox,
    boundingBoxSrsId?: number,
  ): Promise<FeatureDao<FeatureRow>> {
    await geopackage.createFeatureTableWithGeometryColumnsAndDataColumns(
      geometryColumn,
      boundingBox,
      boundingBoxSrsId,
      featureColumns,
      dataColumns,
    );
    return geopackage.getFeatureDao(tableName);
  }

  /**
   * Create a feature table with the properties specified.
   * @param {module:geoPackage~GeoPackage} geopackage the geopackage object
   * @param {Object[]} properties properties to create columns from
   * @param {string} properties.name name of the column
   * @param {string} properties.dataType name of the data type
   * @return {Promise}
   */
  static async createFeatureTableWithProperties(
    geopackage: GeoPackage,
    tableName: string,
    properties: { name: string; dataType: string }[],
  ): Promise<boolean> {
    const geometryColumns = new GeometryColumns();
    geometryColumns.table_name = tableName;
    geometryColumns.column_name = 'geometry';
    geometryColumns.geometry_type_name = 'GEOMETRY';
    geometryColumns.z = 0;
    geometryColumns.m = 0;

    const boundingBox = new BoundingBox(-180, 180, -80, 80);

    const columns = [];
    let columnNumber = 0;
    columns.push(FeatureColumn.createPrimaryKeyColumnWithIndexAndName(columnNumber++, 'id'));
    columns.push(FeatureColumn.createGeometryColumn(columnNumber++, 'geometry', 'GEOMETRY', false, null));

    for (let i = 0; i < properties.length; i++) {
      const property = properties[i];
      columns.push(
        FeatureColumn.createColumnWithIndex(columnNumber++, property.name, DataTypes.fromName(property.dataType)),
      );
    }

    return geopackage.createFeatureTableWithGeometryColumns(geometryColumns, boundingBox, 4326, columns);
  }

  /**
   * Create a feature table with the properties specified.
   * @param {module:geoPackage~GeoPackage} geopackage the geopackage object
   * @param tableName name of the table to create
   * @param {Object[]} properties properties to create columns from
   * @param {string} properties.name name of the column
   * @param {string} properties.dataType name of the data type
   * @param {DataColumns} [properties.dataColumn] data column for the property
   * @return {Promise}
   */
  static async createAttributeTableWithProperties(
    geopackage: GeoPackage,
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
    }[],
  ): Promise<boolean> {
    const columns = [];
    let columnNumber = 0;
    columns.push(UserColumn.createPrimaryKeyColumnWithIndexAndName(columnNumber++, 'id'));

    const dataColumns = [];

    for (let i = 0; i < properties.length; i++) {
      const property = properties[i];
      columns.push(
        UserColumn.createColumnWithIndex(columnNumber++, property.name, DataTypes.fromName(property.dataType)),
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

    return geopackage.createAttributeTable(tableName, columns, dataColumns);
  }

  static addAttributeRow(geopackage: GeoPackage, tableName: string, row: any): number {
    const attributeDao = geopackage.getAttributeDaoWithTableName(tableName);
    const attributeRow = attributeDao.getRow(row);
    return attributeDao.create(attributeRow);
  }

  /**
   * Create a simple attributes table with the properties specified.
   * @param {module:geoPackage~GeoPackage} geopackage the geopackage object
   * @param {Object[]} properties properties to create columns from
   * @param {string} properties.name name of the column
   * @param {string} properties.dataType name of the data type
   * @return {Promise}
   */
  static createSimpleAttributesTableWithProperties(
    geopackage: GeoPackage,
    tableName: string,
    properties: { name: string; dataType: string }[],
  ): SimpleAttributesDao<SimpleAttributesRow> {
    const relatedTables = geopackage.getRelatedTablesExtension();
    const columns = [];
    let columnNumber = SimpleAttributesTable.numRequiredColumns();
    if (properties) {
      for (let i = 0; i < properties.length; i++) {
        const property = properties[i];
        columns.push(
          UserColumn.createColumnWithIndex(columnNumber++, property.name, DataTypes.fromName(property.dataType), true),
        );
      }
    }
    const simpleAttributesTable = SimpleAttributesTable.create(tableName, columns);
    relatedTables.createRelatedTable(simpleAttributesTable);
    return relatedTables.getSimpleAttributesDao(simpleAttributesTable);
  }

  /**
   * Create a media table with the properties specified.  These properties are added to the required columns
   * @param {module:geoPackage~GeoPackage} geopackage the geopackage object
   * @param {Object[]} properties properties to create columns from
   * @param {string} properties.name name of the column
   * @param {string} properties.dataType name of the data type
   * @return {Promise}
   */
  static createMediaTableWithProperties(
    geopackage: GeoPackage,
    tableName: string,
    properties: { name: string; dataType: string }[],
  ): MediaDao<MediaRow> {
    const relatedTables = geopackage.getRelatedTablesExtension();
    const columns = [];
    let columnNumber = MediaTable.numRequiredColumns();
    if (properties) {
      for (let i = 0; i < properties.length; i++) {
        const property = properties[i];
        columns.push(
          UserColumn.createColumnWithIndex(columnNumber++, property.name, DataTypes.fromName(property.dataType)),
        );
      }
    }
    const mediaTable = MediaTable.create(tableName, columns);
    relatedTables.createRelatedTable(mediaTable);
    return relatedTables.getMediaDao(mediaTable);
  }

  static addMedia(
    geopackage: GeoPackage,
    tableName: string,
    dataBuffer: Buffer,
    contentType: string,
    additionalProperties?: {},
  ): number {
    const relatedTables = geopackage.getRelatedTablesExtension();
    const mediaDao = relatedTables.getMediaDao(tableName);
    const row = mediaDao.newRow();
    row.setContentType(contentType);
    row.setData(dataBuffer);
    for (const key in additionalProperties) {
      row.setValueWithColumnName(key, additionalProperties[key]);
    }
    return mediaDao.create(row);
  }

  static async linkMedia(
    geopackage: GeoPackage,
    baseTableName: string,
    baseId: number,
    mediaTableName: string,
    mediaId: number,
  ): Promise<number> {
    const relatedTables = geopackage.getRelatedTablesExtension();
    return relatedTables.linkRelatedIds(baseTableName, baseId, mediaTableName, mediaId, RelationType.MEDIA);
  }

  static getLinkedMedia(geopackage: GeoPackage, baseTableName: string, baseId: number): any[] {
    const relationships = GeoPackageAPI.getRelatedRows(geopackage, baseTableName, baseId);
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

  static getRelatedRows(geopackage: GeoPackage, baseTableName: string, baseId: number): ExtendedRelation[] {
    return geopackage.getRelatedTablesExtension().getRelatedRows(baseTableName, baseId);
  }

  /**
   * Adds a GeoJSON feature to the GeoPackage
   * @param  {module:geoPackage~GeoPackage}   geopackage open GeoPackage object
   * @param  {object}   feature    GeoJSON feature to add
   * @param  {string}   tableName  name of the table that will store the feature
   */
  static addGeoJSONFeatureToGeoPackage(geopackage: GeoPackage, feature: Feature, tableName: string): number {
    const featureDao = geopackage.getFeatureDao(tableName);
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

    return featureDao.create(featureRow);
  }

  /**
   * Adds a GeoJSON feature to the GeoPackage and updates the FeatureTableIndex extension if it exists
   * @param  {module:geoPackage~GeoPackage}   geopackage open GeoPackage object
   * @param  {object}   feature    GeoJSON feature to add
   * @param  {string}   tableName  name of the table that will store the feature
   */
  static addGeoJSONFeatureToGeoPackageAndIndex(
    geopackage: GeoPackage,
    feature: helpers.Feature,
    tableName: string,
  ): number {
    const featureDao = geopackage.getFeatureDao(tableName);
    if (!featureDao) throw new Error('No feature Dao for table ' + tableName);
    const srs = featureDao.getSrs();
    const featureRow = featureDao.newRow();
    const geometryData = new GeometryData();
    geometryData.setSrsId(srs.srs_id);

    const reprojectedFeature = reproject.reproject(feature, 'EPSG:4326', featureDao.projection);

    const featureGeometry =
      typeof reprojectedFeature.geometry === 'string'
        ? JSON.parse(reprojectedFeature.geometry)
        : reprojectedFeature.geometry;
    const geometry = wkx.Geometry.parseGeoJSON(featureGeometry);
    geometryData.setGeometry(geometry);
    featureRow.setGeometry(geometryData);
    for (const propertyKey in feature.properties) {
      if (Object.prototype.hasOwnProperty.call(feature.properties, propertyKey)) {
        featureRow.setValueWithColumnName(propertyKey, feature.properties[propertyKey]);
      }
    }

    const id = featureDao.create(featureRow);
    const fti = featureDao.featureTableIndex;
    const tableIndex = fti.getTableIndex();
    if (!tableIndex) return id;
    fti.indexRow(tableIndex, id, geometryData);
    fti.updateLastIndexed(tableIndex);
    return id;
  }

  /**
   * Queries for GeoJSON features in a feature tables
   * @param  {string}   geoPackagePath  path to the GeoPackage file
   * @param  {string}   tableName   Table name to query
   * @param  {BoundingBox}   boundingBox BoundingBox to query
   */
  static async queryForGeoJSONFeaturesInTableFromPath(
    geoPackagePath: string,
    tableName: string,
    boundingBox: BoundingBox,
  ): Promise<Feature[]> {
    const geoPackage = await GeoPackageAPI.open(geoPackagePath);
    const features = geoPackage.queryForGeoJSONFeaturesInTable(tableName, boundingBox);
    geoPackage.close();
    return features;
  }

  /**
   * Queries for GeoJSON features in a feature tables
   * @param  {module:geoPackage~GeoPackage}   geoPackage  open GeoPackage object
   * @param  {string}   tableName   Table name to query
   * @param  {BoundingBox}   boundingBox BoundingBox to query
   */
  static queryForGeoJSONFeaturesInTable(
    geoPackage: GeoPackage,
    tableName: string,
    boundingBox: BoundingBox,
  ): Feature[] {
    return geoPackage.queryForGeoJSONFeaturesInTable(tableName, boundingBox);
  }

  /**
   * Iterates GeoJSON features in a feature table that matches the bounding box
   * @param  {module:geoPackage~GeoPackage}   geoPackage  open GeoPackage object
   * @param  {string}   tableName   Table name to query
   * @param  {BoundingBox}   boundingBox BoundingBox to query
   */
  static iterateGeoJSONFeaturesInTableWithinBoundingBox(
    geoPackage: GeoPackage,
    tableName: string,
    boundingBox: BoundingBox,
  ): IterableIterator<Feature> {
    return geoPackage.iterateGeoJSONFeaturesInTableWithinBoundingBox(tableName, boundingBox);
  }

  /**
   * Iterates GeoJSON features in a feature table that matches the bounding box
   * @param  {string}   geoPackagePath  path to the GeoPackage file
   * @param  {string}   tableName   Table name to query
   * @param  {BoundingBox}   boundingBox BoundingBox to query
   */
  static async iterateGeoJSONFeaturesFromPathInTableWithinBoundingBox(
    geoPackagePath: string,
    tableName: string,
    boundingBox: BoundingBox,
  ): Promise<IterableIterator<Feature>> {
    const geoPackage = await GeoPackageAPI.open(geoPackagePath);
    return geoPackage.iterateGeoJSONFeaturesInTableWithinBoundingBox(tableName, boundingBox);
  }

  static createDataColumnMap(featureDao: FeatureDao<FeatureRow>): any {
    const columnMap = {};
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
  static iterateGeoJSONFeaturesFromTable(
    geopackage: GeoPackage,
    table: string,
  ): { srs: SpatialReferenceSystem; featureDao: FeatureDao<FeatureRow>; results: IterableIterator<Feature> } {
    const featureDao = geopackage.getFeatureDao(table);
    if (!featureDao) {
      throw new Error('No Table exists with the name ' + table);
    }

    const columnMap = GeoPackageAPI.createDataColumnMap(featureDao);

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
                value: GeoPackageAPI.parseFeatureRowIntoGeoJSON(featureRow, srs, columnMap),
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
  static getFeature(geopackage: GeoPackage, table: string, featureId: any): Feature {
    const featureDao = geopackage.getFeatureDao(table);
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
      return GeoPackageAPI.parseFeatureRowIntoGeoJSON(feature, srs);
    }
  }

  // eslint-disable-next-line complexity
  static parseFeatureRowIntoGeoJSON(featureRow: FeatureRow, srs: SpatialReferenceSystem, columnMap?: any): Feature {
    const geoJson: Feature = {
      type: 'Feature',
      properties: {},
      id: undefined,
      geometry: undefined,
    };
    const geometry = featureRow.getGeometry();
    if (geometry && geometry.geometry) {
      let geoJsonGeom = geometry.geometry.toGeoJSON();
      if (
        srs.definition &&
        srs.definition !== 'undefined' &&
        srs.organization.toUpperCase() + ':' + srs.organization_coordsys_id !== 'EPSG:4326'
      ) {
        geoJsonGeom = reproject.reproject(geoJsonGeom, srs.getProjection(), 'EPSG:4326');
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
          geoJson.id = featureRow.values[key];
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
   * Gets a tile from the specified table
   * @param  {module:geoPackage~GeoPackage}   geopackage open GeoPackage object
   * @param  {string}   table      name of the table to get the tile from
   * @param  {Number}   zoom       zoom level of the tile
   * @param  {Number}   tileRow    row of the tile
   * @param  {Number}   tileColumn column of the tile
   *
   * @todo jsdoc return value
   */
  static getTileFromTable(
    geopackage: GeoPackage,
    table: string,
    zoom: number,
    tileRow: number,
    tileColumn: number,
  ): TileRow {
    const tileDao = geopackage.getTileDao(table);
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
  static getTilesInBoundingBox(
    geopackage: GeoPackage,
    table: string,
    zoom: number,
    west: number,
    east: number,
    south: number,
    north: number,
  ): {
    columns: any;
    srs: SpatialReferenceSystem;
    tiles: any[];
    west: number;
    east: number;
    south: number;
    north: number;
    zoom: number;
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
    };

    const tileDao = geopackage.getTileDao(table);
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
      tms.getBoundingBox(),
      tm.matrix_width,
      tm.matrix_height,
      mapBoundingBox,
    );

    const iterator = tileDao.queryByTileGrid(grid, zoom);

    for (const row of iterator) {
      const tile = {} as any;
      tile.tableName = table;
      tile.id = row.getId();

      const tileBB = TileBoundingBoxUtils.getTileBoundingBox(
        tms.getBoundingBox(),
        tm,
        row.getTileColumn(),
        row.getRow(),
      );
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
  static getTilesInBoundingBoxWebZoom(
    geopackage: GeoPackage,
    table: string,
    webZoom: number,
    west: number,
    east: number,
    south: number,
    north: number,
  ): {
    columns: any;
    srs: SpatialReferenceSystem;
    tiles: any[];
    west: number;
    east: number;
    south: number;
    north: number;
    zoom: number;
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
    };

    const tileDao = geopackage.getTileDao(table);
    if (webZoom < tileDao.minWebMapZoom || webZoom > tileDao.minWebMapZoom) {
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
      tms.getBoundingBox(),
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
      };
      tile.tableName = table;
      tile.id = row.getId();

      const tileBB = TileBoundingBoxUtils.getTileBoundingBox(
        tms.getBoundingBox(),
        tm,
        row.getTileColumn(),
        row.getRow(),
      );
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

  static getFeatureTileFromXYZ(
    geopackage: GeoPackage,
    table: string,
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
  ): any {
    x = Number(x);
    y = Number(y);
    z = Number(z);
    width = Number(width);
    height = Number(height);
    const featureDao = geopackage.getFeatureDao(table);
    if (!featureDao) return;
    const ft = new FeatureTiles(featureDao, width, height);
    return ft.drawTile(x, y, z);
  }

  static getClosestFeatureInXYZTile(
    geopackage: GeoPackage,
    table: string,
    x: number,
    y: number,
    z: number,
    latitude: number,
    longitude: number,
  ): ClosestFeature {
    x = Number(x);
    y = Number(y);
    z = Number(z);

    const featureDao = geopackage.getFeatureDao(table);
    if (!featureDao) return;
    const ft = new FeatureTiles(featureDao, 256, 256);
    const tileCount = ft.getFeatureCountXYZ(x, y, z);
    let boundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, z);
    boundingBox = boundingBox.projectBoundingBox('EPSG:3857', 'EPSG:4326');

    if (tileCount > 10000) {
      // too many, send back the entire tile
      // add the goepackage name and table
      const gj = boundingBox.toGeoJSON();
      gj.feature_count = tileCount;
      gj.coverage = true;
      gj.gp_table = table;
      gj.gp_name = geopackage.name;
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
    let closest;

    const centerPoint = helpers.point([longitude, latitude]);

    for (const feature of iterator) {
      feature.type = 'Feature';
      const distance = GeoPackageAPI.determineDistance(centerPoint.geometry, feature);
      if (distance < closestDistance) {
        closest = feature;
        closestDistance = distance;
      } else if (distance === closestDistance && closest.type !== 'Point') {
        closest = feature;
        closestDistance = distance;
      }
      features.push(feature);
    }
    if (closest) {
      closest.gp_table = table;
      closest.gp_name = geopackage.name;
      closest.distance = closestDistance;
    }
    return closest;
  }

  static determineDistance(point: Point, feature: Feature | FeatureCollection): number {
    if (feature.type === 'FeatureCollection') {
      feature.features.forEach(feature => {
        GeoPackageAPI.determineDistance(point, feature);
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
          distance = Math.min(distance, GeoPackageAPI.determineDistance(point, lineString));
        });
        return distance;
      }
      if (geometry.type === 'Polygon') {
        return GeoPackageAPI.determineDistanceFromPolygon(point, geometry);
      }
      if (geometry.type === 'MultiPolygon') {
        return GeoPackageAPI.determineDistanceFromPolygon(point, geometry);
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
    return GeoPackageAPI.determineDistance(point, polygonToLine(polygon));
  }
  /**
   * Gets the features in the EPSG:3857 tile
   * @param  {module:geoPackage~GeoPackage}   geopackage open GeoPackage object
   * @param  {string}   table      name of the feature table
   * @param  {Number}   x       x tile number
   * @param  {Number}   y       y tile number
   * @param  {Number}   z      z tile number
   * @param  {Boolean}   [skipVerification]      skip the extra verification to determine if the feature really is within the tile
   */
  static async getGeoJSONFeaturesInTile(
    geopackage: GeoPackage,
    table: string,
    x: number,
    y: number,
    z: number,
    skipVerification = false,
  ): Promise<Feature[]> {
    const webMercatorBoundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, z);
    const bb = webMercatorBoundingBox.projectBoundingBox('EPSG:3857', 'EPSG:4326');
    await geopackage.indexFeatureTable(table);
    const featureDao = geopackage.getFeatureDao(table);
    if (!featureDao) return;
    const features = [];
    const iterator = featureDao.queryForGeoJSONIndexedFeaturesWithBoundingBox(bb, skipVerification);
    for (const feature of iterator) {
      features.push(feature);
    }
    return features;
  }

  // static convertPBFToVectorTile(pbf: Uint8Array | ArrayBuffer): VectorTile {
  //   return new VectorTile.VectorTile(new Pbf(pbf));
  // }

  // /**
  //  * Gets a mapbox VectorTile for the x y z web mercator tile specified
  //  * @param  {module:geoPackage~GeoPackage} geopackage open GeoPackage object
  //  * @param  {string} table      table name
  //  * @param  {Number} x          x tile
  //  * @param  {Number} y          y tile
  //  * @param  {Number} z          web zoom
  //  * @return {typeof VectorTile}
  //  */
  // static async getVectorTile(
  //   geopackage: GeoPackage,
  //   table: string,
  //   x: number,
  //   y: number,
  //   z: number,
  // ): Promise<VectorTile> {
  //   const pbf = await GeoPackageAPI.getVectorTileProtobuf(geopackage, table, x, y, z);
  //   return new VectorTile.VectorTile(new Pbf(pbf));
  // }

  /**
   * Gets a protobuf for the x y z web mercator tile specified
   * @param  {module:geoPackage~GeoPackage} geopackage open GeoPackage object
   * @param  {string} table      table name
   * @param  {Number} x          x tile
   * @param  {Number} y          y tile
   * @param  {Number} z          web zoom
   * @return {any}
   */
  static async getVectorTileProtobuf(
    geopackage: GeoPackage,
    table: string,
    x: number,
    y: number,
    z: number,
  ): Promise<Uint8Array | ArrayBuffer> {
    const features = await GeoPackageAPI.getGeoJSONFeaturesInTile(geopackage, table, x, y, z, true);
    const featureCollection = {
      type: 'FeatureCollection',
      features: features,
    };
    const tileBuffer = 8;
    const tileIndex = geojsonvt(featureCollection, { buffer: tileBuffer * 8, maxZoom: z });
    const tile = tileIndex.getTile(z, x, y);

    const gjvt = {};

    if (tile) {
      gjvt[table] = tile;
    } else {
      gjvt[table] = { features: [] };
    }

    return vtpbf.fromGeojsonVt(gjvt);
  }

  /**
   * Gets the features in the EPSG:4326 bounding box
   * @param  {module:geoPackage~GeoPackage}   geopackage open GeoPackage object
   * @param  {string}   table      name of the feature table
   * @param  {Number}   west       EPSG:4326 western boundary
   * @param  {Number}   east       EPSG:4326 eastern boundary
   * @param  {Number}   south      EPSG:4326 southern boundary
   * @param  {Number}   north      EPSG:4326 northern boundary
   */
  static async getFeaturesInBoundingBox(
    geopackage: GeoPackage,
    table: string,
    west: number,
    east: number,
    south: number,
    north: number,
  ): Promise<IterableIterator<FeatureRow>> {
    await geopackage.indexFeatureTable(table);
    const featureDao = geopackage.getFeatureDao(table);
    if (!featureDao) throw new Error('Unable to find table ' + table);
    const bb = new BoundingBox(west, east, south, north);
    const iterator = featureDao.queryIndexedFeaturesWithBoundingBox(bb);
    return iterator;
  }

  /**
   * Gets a tile image for an XYZ tile pyramid location
   * @param  {module:geoPackage~GeoPackage}   geopackage open GeoPackage object
   * @param  {string}   table      name of the table containing the tiles
   * @param  {Number}   x          x index of the tile
   * @param  {Number}   y          y index of the tile
   * @param  {Number}   z          zoom level of the tile
   * @param  {Number}   width      width of the resulting tile
   * @param  {Number}   height     height of the resulting tile
   * @return {Promise}
   */
  static async getTileFromXYZ(
    geopackage: GeoPackage,
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
    const tileDao = geopackage.getTileDao(table);
    const retriever = new GeoPackageTileRetriever(tileDao, width, height);
    return retriever.getTile(x, y, z);
  }

  /**
   * Draws an XYZ tile pyramid location into the provided canvas
   * @param  {module:geoPackage~GeoPackage}   geopackage open GeoPackage object
   * @param  {string}   table      name of the table containing the tiles
   * @param  {Number}   x          x index of the tile
   * @param  {Number}   y          y index of the tile
   * @param  {Number}   z          zoom level of the tile
   * @param  {Number}   width      width of the resulting tile
   * @param  {Number}   height     height of the resulting tile
   * @param  {any}   canvas     canvas element to draw the tile into
   */
  static async drawXYZTileInCanvas(
    geopackage: GeoPackage,
    table: string,
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
    canvas: any,
  ): Promise<any> {
    x = Number(x);
    y = Number(y);
    z = Number(z);
    width = Number(width);
    height = Number(height);
    const tileDao = geopackage.getTileDao(table);
    const retriever = new GeoPackageTileRetriever(tileDao, width, height);
    return retriever.drawTileIn(x, y, z, canvas);
  }

  /**
   * Draws a tile specified by the bounds in EPSG:4326 into the canvas
   * @param  {module:geoPackage~GeoPackage}   geopackage open GeoPackage object
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
  static async draw4326TileInCanvas(
    geopackage: GeoPackage,
    table: string,
    minLat: number,
    minLon: number,
    maxLat: number,
    maxLon: number,
    z: number,
    width: number,
    height: number,
    canvas: any,
  ): Promise<any> {
    z = Number(z);
    width = Number(width);
    height = Number(height);
    const tileDao = geopackage.getTileDao(table);
    const retriever = new GeoPackageTileRetriever(tileDao, width, height);
    const bounds = new BoundingBox(minLon, maxLon, minLat, maxLat);
    return retriever.getTileWithWgs84BoundsInProjection(bounds, z, 'EPSG:4326', canvas);
  }
}

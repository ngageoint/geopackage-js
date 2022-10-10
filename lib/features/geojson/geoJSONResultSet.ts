import { Feature, GeoJsonObject } from 'geojson';
import { FeatureIndexResults } from '../index/featureIndexResults';
import { FeatureRow } from '../user/featureRow';
import { FeatureConverter } from '@ngageoint/simple-features-geojson-js';
import { GeometryTransform } from '@ngageoint/simple-features-proj-js';
import { FeatureDao } from '../user/featureDao';
import { DataColumnsDao } from '../../extension/schema/columns/dataColumnsDao';
import { Projection, Projections } from '@ngageoint/projections-js';
import { FeatureTable } from '../user/featureTable';
import { GeoJSONUtils } from './geoJSONUtils';

/**
 * GeoJSON Results is a wrapper for FeatureIndexResults and handles the conversion to GeoJSON
 */
export class GeoJSONResultSet implements IterableIterator<Feature> {

  /**
   * FeatureIndexResults
   * @private
   */
  private featureIndexResultSet: FeatureIndexResults;

  /**
   * Geometry transform needed to convert coordinates to WGS84
   * @private
   */
  private geometryTransform: GeometryTransform;

  /**
   * Data columns map
   * @private
   */
  private dataColumnsMap: any;

  constructor(featureIndexResultSet: FeatureIndexResults, featureDao: FeatureDao, dataColumnsDao: DataColumnsDao) {
    this.featureIndexResultSet = featureIndexResultSet;
    this.geometryTransform = this.getGeometryTransform(featureDao);
    this.dataColumnsMap = GeoJSONResultSet.getColumnToDataColumnMap(featureDao, dataColumnsDao);
  }


  /**
   * Gets the column name mapping
   * @param featureDao
   * @param dataColumnsDao
   * @private
   */
  public static getColumnToDataColumnMap (featureDao: FeatureDao, dataColumnsDao: DataColumnsDao): any {
    const dataColumns = dataColumnsDao.queryByTable(featureDao.getTableName());
    const columnMap = {};
    featureDao.getColumnNames().forEach(columnName => {
      const dataColumn = dataColumns.find(dc => dc.getColumnName() === columnName);
      columnMap[columnName] = dataColumn != null ? dataColumn.getName() : columnName;
    })
    return columnMap
  }

  /**
   * Get the geometry transform needed to convert the geometries into the WGS84 projection
   * @param featureDao
   * @private
   */
  private getGeometryTransform(featureDao: FeatureDao): GeometryTransform {
    let geometryTransform = null;
    if (!featureDao.getProjection().equalsProjection(Projections.getWGS84Projection())) {
      geometryTransform = GeometryTransform.create(featureDao.getProjection(), Projections.getWGS84Projection());
    }
    return geometryTransform;
  }

  [Symbol.iterator](): IterableIterator<Feature> {
    return this;
  }

  next(...args: [] | [undefined]): IteratorResult<Feature> {
    let nextRow = this.featureIndexResultSet.next();
    if (!nextRow.done) {
      let featureRow: FeatureRow = nextRow.value;
      let geometry: GeoJsonObject;
      while (!nextRow.done && !geometry) {
        const feature = GeoJSONUtils.convertFeatureRowIntoGeoJSONFeature(featureRow, this.geometryTransform, this.dataColumnsMap);
        if (feature != null) {
          return {
            value: feature,
            done: false,
          };
        } else {
          nextRow = this.featureIndexResultSet.next();
        }
      }
    }
    return {
      done: true,
      value: undefined,
    };
  }

  /**
   * Close the result set
   */
  public close(): void {
    this.featureIndexResultSet.close();
  }

}
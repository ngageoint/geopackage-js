import { Feature } from 'geojson';
import { FeatureIndexResults } from '../index/featureIndexResults';
import { FeatureRow } from '../user/featureRow';
import { GeometryTransform } from '@ngageoint/simple-features-proj-js';
import { FeatureDao } from '../user/featureDao';
import { DataColumnsDao } from '../../extension/schema/columns/dataColumnsDao';
import { Projections } from '@ngageoint/projections-js';
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
    this.dataColumnsMap = featureDao.getGeoPackage().getColumnToDataColumnMap(featureDao, dataColumnsDao);
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next(...args: [] | [undefined]): IteratorResult<Feature> {
    let nextRow = this.featureIndexResultSet.next();
    let feature: Feature;
    let done = true;
    if (!nextRow.done) {
      const featureRow: FeatureRow = nextRow.value;
      while (!nextRow.done && !feature) {
        feature = GeoJSONUtils.convertFeatureRowIntoGeoJSONFeature(
          featureRow,
          this.geometryTransform,
          this.dataColumnsMap,
        );
        if (feature != null) {
          done = nextRow.done;
          break;
        } else {
          nextRow = this.featureIndexResultSet.next();
        }
      }
    }
    return {
      done,
      value: feature,
    };
  }

  /**
   * Close the result set
   */
  public close(): void {
    this.featureIndexResultSet.close();
  }
}

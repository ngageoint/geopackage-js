import { FeatureRow } from '../user/featureRow';
import { Feature } from 'geojson';
import { FeatureConverter } from '@ngageoint/simple-features-geojson-js';
import { GeometryTransform } from '@ngageoint/simple-features-proj-js';

/**
 * GeoJSON Utilities
 */
export class GeoJSONUtils {
  /**
   * Converts a FeatureRow into a GeoJSON Feature
   * @param featureRow
   * @param geometryTransform
   * @param dataColumnsMap
   */
  public static convertFeatureRowIntoGeoJSONFeature(featureRow: FeatureRow, geometryTransform: GeometryTransform, dataColumnsMap?: Map<string, string>): Feature {
    const geoJson = {
      id: undefined,
      type: 'Feature',
      properties: {},
      geometry: null,
    } as Feature;
    try {
      let sfGeom = featureRow.getGeometry().getOrReadGeometry();
      if (geometryTransform != null) {
        sfGeom = geometryTransform.transformGeometry(sfGeom);
      }
      geoJson.geometry = FeatureConverter.toFeatureGeometry(sfGeom);
    } catch (e) {
      console.log('Error parsing Geometry', e);
    }
    if (geoJson.geometry != null) {
      for (const columnName in featureRow.getColumns().getColumnNames()) {
        if (columnName !== featureRow.getGeometryColumnName()) {
          if (columnName.toLowerCase() === '_feature_id') {
            geoJson.id = featureRow.getValueWithColumnName(columnName) as string | number;
          } else if (columnName.toLowerCase() === 'id') {
            geoJson.properties[columnName] = featureRow.getValueWithColumnName(columnName);
          } else if (columnName.toLowerCase() === '_properties_id') {
            geoJson.properties[columnName.substring(12)] = featureRow.getValueWithColumnName(columnName);
          } else {
            geoJson.properties[dataColumnsMap ? dataColumnsMap.get(columnName) : columnName ] = featureRow.getValueWithColumnName(columnName);
          }
        }
      }
      geoJson.id = geoJson.id || featureRow.id;
    }
    return geoJson
  }
}
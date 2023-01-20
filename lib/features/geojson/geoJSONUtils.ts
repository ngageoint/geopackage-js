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
      const geoPackageGeometryData = featureRow.getGeometry();
      if (geoPackageGeometryData != null) {
        let sfGeom = geoPackageGeometryData.getOrReadGeometry();
        if (geometryTransform != null) {
          sfGeom = geometryTransform.transformGeometry(sfGeom);
        }
        geoJson.geometry = FeatureConverter.toFeatureGeometry(sfGeom);
      }
    } catch (e) {
      console.log('Error parsing Geometry');
    }
    if (geoJson.geometry != null) {
      for (const columnName of featureRow.getColumns().getColumnNames()) {
        const value = featureRow.getValue(columnName);
        if (columnName !== featureRow.getGeometryColumnName()) {
          if (columnName.toLowerCase() === '_feature_id') {
            geoJson.id = value as string | number;
          } else if (columnName.toLowerCase() === 'id') {
            geoJson.properties[columnName] = value;
          } else if (columnName.toLowerCase() === '_properties_id') {
            geoJson.properties[columnName.substring(12)] = value;
          } else {
            geoJson.properties[dataColumnsMap != null && dataColumnsMap.has(columnName) ? dataColumnsMap.get(columnName) : columnName] = value;
          }
        }
      }
      geoJson.id = geoJson.id || featureRow.getId();
    }
    return geoJson
  }
}
import { GeoPackageDataType } from './geoPackageDataType';

/**
 * Date converter between database date strings and javascript Dates
 */
export class DateConverter {
  public static convert(date: string): Date {
    try {
      return new Date(date);
    } catch (e) {
      return null;
    }
  }
  public static stringValue(date: Date, dataType: GeoPackageDataType): string {
    return dataType === GeoPackageDataType.DATE ? date.toISOString().substring(0, 10) : date.toISOString();
  }
}

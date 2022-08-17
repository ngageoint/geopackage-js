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
  public static stringValue(date: Date): string {
    return date.toISOString();
  }
}

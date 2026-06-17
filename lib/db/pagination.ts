import { GeoPackageException } from '../geoPackageException';

/**
 * Query pagination configuration
 */
export class Pagination {
  /**
   * Limit SQL statement
   */
  private static readonly LIMIT = 'LIMIT';

  /**
   * Offset SQL statement
   */
  private static readonly OFFSET = 'OFFSET';

  /**
   * Expression 1 pattern group
   */
  private static readonly EXPRESSION1 = 'expr1';

  /**
   * Expression Separator pattern group
   */
  private static readonly SEPARATOR = 'separator';

  /**
   * Expression 1 pattern group
   */
  private static readonly EXPRESSION2 = 'expr2';

  /**
   * Limit pattern
   */
  private static readonly limitPattern = new RegExp(
    '\\s' +
      Pagination.LIMIT +
      '\\s+(?<' +
      Pagination.EXPRESSION1 +
      '>-?\\d+)(\\s*(?<' +
      Pagination.SEPARATOR +
      '>(' +
      Pagination.OFFSET +
      '|,))\\s*(?<' +
      Pagination.EXPRESSION2 +
      '>-?\\d+))?',
    'i',
  );

  /**
   * Find the pagination offset and limit from the SQL statement
   * @param sql SQL statement
   * @return pagination or null if not found
   */
  public static find(sql: string): Pagination {
    let pagination = null;
    const matcher = sql.match(Pagination.limitPattern);
    if (matcher != null && matcher.groups != null) {
      let limit;
      let offset;
      const expr1 = matcher.groups[Pagination.EXPRESSION1];
      const separator = matcher.groups[Pagination.SEPARATOR];
      if (separator != null) {
        const expr2 = matcher.groups[Pagination.EXPRESSION2];
        if (separator.toUpperCase() === Pagination.OFFSET) {
          limit = Number.parseInt(expr1);
          offset = Number.parseInt(expr2);
        } else {
          limit = Number.parseInt(expr2);
          offset = Number.parseInt(expr1);
        }
      } else {
        limit = Number.parseInt(expr1);
      }
      pagination = new Pagination(limit, offset);
    }
    return pagination;
  }

  /**
   * Replace the pagination limit and offset in the SQL statement
   * @param pagination pagination settings
   * @param sql SQL statement
   * @return modified SQL statement
   */
  public static replace(pagination: Pagination, sql: string): string {
    let replaced = null;
    const matcher = sql.match(Pagination.limitPattern);
    if (matcher != null && matcher.groups != null) {
      replaced = sql.replace(Pagination.limitPattern, pagination.toString());
    } else {
      throw new GeoPackageException('SQL statement is not a paginated query: ' + sql);
    }
    return replaced;
  }

  /**
   * Limit
   */
  private limit: number;

  /**
   * Offset
   */
  private offset: number;

  /**
   * Constructor
   *
   * @param limit
   *            upper bound number of rows
   * @param offset
   *            row result starting offset
   */
  public constructor(limit: number, offset: number) {
    this.setLimit(limit);
    this.setOffset(offset);
  }

  /**
   * Get the limit
   * @return upper bound number of rows
   */
  public getLimit(): number {
    return this.limit;
  }

  /**
   * Set the limit
   * @param limit upper bound number of rows
   */
  public setLimit(limit: number): void {
    this.limit = limit;
  }

  /**
   * Is there positive limit
   * @return true if limit above 0
   */
  public hasLimit(): boolean {
    return this.limit > 0;
  }

  /**
   * Get the offset
   * @return row result starting offset
   */
  public getOffset(): number {
    return this.offset;
  }

  /**
   * Is there an offset
   * @return true if has an offset
   */
  public hasOffset(): boolean {
    return this.offset != null;
  }

  /**
   * Set the offset
   * @param offset row result starting offset
   */
  public setOffset(offset: number): void {
    if (offset != null && offset < 0) {
      offset = 0;
    }
    this.offset = offset;
  }

  /**
   * If the limit is positive, increment the offset
   */
  public incrementOffset(): void {
    if (this.limit > 0) {
      this.incrementOffsetBy(this.limit);
    }
  }

  /**
   * Increment the offset by the count
   * @param count count to increment
   */
  public incrementOffsetBy(count: number): void {
    if (this.offset == null) {
      this.offset = 0;
    }
    this.offset += count;
  }

  /**
   * Replace the limit and offset in the SQL statement with the pagination
   * values
   * @param sql SQL statement
   * @return modified SQL statement
   */
  public replace(sql: string): string {
    return Pagination.replace(this, sql);
  }

  /**
   * @inheritDoc
   */
  public toString(): string {
    const sql = [' '];
    sql.push(Pagination.LIMIT);
    sql.push(' ');
    sql.push(this.limit.toString());
    if (this.hasOffset()) {
      sql.push(' ');
      sql.push(Pagination.OFFSET);
      sql.push(' ');
      sql.push(this.offset.toString());
    }
    return sql.join('');
  }
}

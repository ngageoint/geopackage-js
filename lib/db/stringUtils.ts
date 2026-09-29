/**
 * String Utility methods
 */

export class StringUtils {
  /**
   * Wrap the name in double quotes
   * @param name  name
   * @return quoted name
   */
  static quoteWrap(name: string): string {
    let quoteName = null;
    if (name != null) {
      if (name.startsWith('"') && name.endsWith('"')) {
        quoteName = name;
      } else {
        // A double quote inside an SQL identifier is escaped by doubling it, otherwise the
        // quoting ends at that character and the rest of the name is read as SQL.
        quoteName = '"' + name.replace(/"/g, '""') + '"';
      }
    }
    return quoteName;
  }

  /**
   * Remove double quotes from the name
   * @param name name
   * @return unquoted name
   */
  static quoteUnwrap(name: string): string {
    let unquotedName = null;
    if (name != null) {
      if (name.length > 1 && name.startsWith('"') && name.endsWith('"')) {
        unquotedName = name.substring(1, name.length - 1).replace(/""/g, '"');
      } else {
        unquotedName = name;
      }
    }
    return unquotedName;
  }
}

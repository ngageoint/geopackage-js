/**
 * Core SQL Utility methods
 */
import { StringUtils } from './stringUtils';
import { UserColumn } from '../user/userColumn';
import { UserTable } from '../user/userTable';
import { GeoPackageConnection } from './geoPackageConnection';
import { TableMapping } from './tableMapping';
import { TableInfo } from './table/tableInfo';
import { SQLiteMaster } from './master/sqliteMaster';
import { SQLiteMasterQuery } from './master/sqliteMasterQuery';
import { SQLiteMasterColumn } from './master/sqliteMasterColumn';

export class CoreSQLUtils {

  /**
   * Pattern for matching numbers
   */
  static NUMBER_PATTERN = '\\d+';

  /**
   * Create the user defined table SQL
   *
   * @param table user table
   * @param <TColumn> column type
   * @return create table SQL
   */
  static createTableSQL(table: UserTable<UserColumn>): string {

    // Build the create table sql
    let sql = '';
    sql = sql.concat('CREATE TABLE ')
      .concat(StringUtils.quoteWrap(table.getTableName()))
      .concat(' (');

    // Add each column to the sql
    let columns = table.getUserColumns().getColumns();
    for (let i = 0; i < columns.length; i++) {
      let column = columns[i];
      if (i > 0) {
        sql = sql.concat(',');
      }
      sql = sql.concat('\n  ');
      sql = sql.concat(CoreSQLUtils.columnSQL(column));
    }

    // Add unique constraints
    table.getConstraints().all().forEach(constraint => {
      sql = sql.concat(',\n  ');
      sql = sql.concat(constraint.buildSql());
    });

    sql = sql.concat('\n);');
    return sql;
  }

  /**
   * Create the column SQL in the format:
   * "column_name" column_type[(max)] [NOT NULL] [PRIMARY KEY AUTOINCREMENT]
   * @param column user column
   * @return column SQL
   */
  static columnSQL(column: UserColumn): string {
    return StringUtils.quoteWrap(column.getName()) + ' ' + CoreSQLUtils.columnDefinition(column);
  }

  /**
   * Create the column definition SQL in the format:
   * column_type[(max)] [NOT NULL] [PRIMARY KEY AUTOINCREMENT]
   * @param column  user column
   * @return column definition SQL
   */
  static columnDefinition(column: UserColumn): string {
    let sql = '';

    sql = sql.concat(column.getType());
    if (column.hasMax()) {
      sql = sql.concat('(').concat(column.getMax().toString()).concat(')');
    }

    column.getConstraints().all().forEach(constraint => {
      sql = sql.concat(' ');
      sql = sql.concat(column.buildConstraintSql(constraint));
    });

    return sql.toString();
  }

  /**
   * Query for the foreign keys value
   *
   * @param db
   *            connection
   * @return true if enabled, false if disabled
   * @since 3.3.0
   */
  static foreignKeys(db: GeoPackageConnection): boolean {
    let foreignKeys = db.get('PRAGMA foreign_keys', null)[0] as boolean;
    return foreignKeys !== null && foreignKeys !== undefined && foreignKeys;
  }

  /**
   * Change the foreign keys state
   * @param db connection
   * @param on true to turn on, false to turn off
   * @return previous foreign keys value
   */
  static setForeignKeys(db: GeoPackageConnection, on: boolean): boolean {
    let foreignKeys = CoreSQLUtils.foreignKeys(db);
    if (foreignKeys !== on) {
      let sql = CoreSQLUtils.foreignKeysSQL(on);
      db.run(sql);
    }
    return foreignKeys;
  }

  /**
   * Create the foreign keys SQL
   * @param on true to turn on, false to turn off
   * @return foreign keys SQL
   */
  static foreignKeysSQL(on: boolean): string {
    return 'PRAGMA foreign_keys = ' + on;
  }

  /**
   * Perform a foreign key check
   * @param db connection
   * @return empty list if valid or violation errors, 4 column values for each violation. see SQLite PRAGMA foreign_key_check
   */
  static foreignKeyCheck(db: GeoPackageConnection): any[] {
    let sql = CoreSQLUtils.foreignKeyCheckSQL(null);
    return db.all(sql, null);
  }

  /**
   * Perform a foreign key check
   * @param db connection
   * @param tableName table name
   * @return empty list if valid or violation errors, 4 column values for each violation. see SQLite PRAGMA foreign_key_check
   */
  static foreignKeyCheckForTable(db: GeoPackageConnection, tableName: string): any[] {
    let sql = CoreSQLUtils.foreignKeyCheckSQL(tableName);
    return db.all(sql, null);
  }

  /**
   * Create the foreign key check SQL
   * @param tableName table name
   * @return foreign key check SQL
   */
  static foreignKeyCheckSQL(tableName: string): string {
    return 'PRAGMA foreign_key_check' + (tableName !== null && tableName !== undefined ? '(' + StringUtils.quoteWrap(tableName) + ')' : '');
  }

  /**
   * Create the integrity check SQL
   * @return integrity check SQL
   */
  static integrityCheckSQL(): string {
    return 'PRAGMA integrity_check';
  }

  /**
   * Create the quick check SQL
   * @return quick check SQL
   */
  static quickCheckSQL(): string {
    return 'PRAGMA quick_check';
  }

  /**
   * Drop the table if it exists
   * @param db connection
   * @param tableName table name
   */
  static dropTable(db: GeoPackageConnection, tableName: string) {
    const sql = CoreSQLUtils.dropTableSQL(tableName);
    db.run(sql);
  }

  /**
   * Create the drop table if exists SQL
   * @param tableName table name
   * @return drop table SQL
   */
  static dropTableSQL(tableName: string): string {
    return 'DROP TABLE IF EXISTS ' + StringUtils.quoteWrap(tableName);
  }

  /**
   * Drop the view if it exists
   * @param db connection
   * @param viewName view name
   */
  static dropView(db: GeoPackageConnection, viewName: string) {
    const sql = CoreSQLUtils.dropViewSQL(viewName);
    db.run(sql);
  }

  /**
   * Create the drop view if exists SQL
   * @param viewName view name
   * @return drop view SQL
   */
  static dropViewSQL(viewName: string): string {
    return 'DROP VIEW IF EXISTS ' + StringUtils.quoteWrap(viewName);
  }

  /**
   * Transfer table content from one table to another
   * @param db connection
   * @param tableMapping table mapping
   */
  static transferTableContentForTableMapping(db: GeoPackageConnection, tableMapping: TableMapping) {
    const sql = CoreSQLUtils.transferTableContentSQL(tableMapping);
    db.run(sql);
  }

  /**
   * Create insert SQL to transfer table content from one table to another
   * @param tableMapping table mapping
   * @return transfer SQL
   */
  static transferTableContentSQL(tableMapping: TableMapping): string {
    let insert = 'INSERT INTO ';
    insert = insert.concat(StringUtils.quoteWrap(tableMapping.toTable));
    insert = insert.concat(' (');
    let selectColumns = '';
    let where = '';
    if (tableMapping.hasWhere()) {
      where = where.concat(tableMapping.where);
    }
    const columns = tableMapping.getColumns();
    tableMapping.getColumnNames().forEach((key: string) => {
      let toColumn = key;
      let column = columns[key];
      if (selectColumns.length > 0) {
        insert = insert.concat(', ');
        selectColumns = selectColumns.concat(', ');
      }
      insert = insert.concat(StringUtils.quoteWrap(toColumn));

      if (column.hasConstantValue()) {
        selectColumns = selectColumns.concat(column.getConstantValueAsString());
      } else {
        if (column.hasDefaultValue()) {
          selectColumns = selectColumns.concat('ifnull(');
        }
        selectColumns = selectColumns.concat(StringUtils.quoteWrap(column.fromColumn));
        if (column.hasDefaultValue()) {
          selectColumns = selectColumns.concat(',');
          selectColumns = selectColumns.concat(column.getDefaultValueAsString());
          selectColumns = selectColumns.concat(')');
        }
      }

      if (column.hasWhereValue()) {
        if (where.length > 0) {
          where = where.concat(' AND ');
        }
        where = where.concat(StringUtils.quoteWrap(column.fromColumn));
        where = where.concat(' ');
        where = where.concat(column.whereOperator);
        where = where.concat(' ');
        where = where.concat(column.getWhereValueAsString());
      }
    });

    insert = insert.concat(') SELECT ');
    insert = insert.concat(selectColumns);
    insert = insert.concat(' FROM ');
    insert = insert.concat(StringUtils.quoteWrap(tableMapping.fromTable));

    if (where.length > 0) {
      insert = insert.concat(' WHERE ');
      insert = insert.concat(where);
    }

    return insert.toString();
  }

  /**
   * Transfer table content to itself with new rows containing a new column
   * value. All rows containing the current column value are inserted as new
   * rows with the new column value.
   * @param db connection
   * @param tableName table name
   * @param columnName column name
   * @param newColumnValue new column value for new rows
   * @param currentColumnValue column value for rows to insert as new rows
   * @param idColumnName id column name
   */
  static transferTableContent(db: GeoPackageConnection, tableName: string, columnName: string, newColumnValue: any, currentColumnValue: any, idColumnName?: string) {
    let tableInfo = TableInfo.info(db, tableName);
    let tableMapping = TableMapping.fromTableInfo(tableInfo);
    if (idColumnName != null) {
      tableMapping.removeColumn(idColumnName);
    }
    let column = tableMapping.getColumn(columnName);
    column.constantValue = newColumnValue;
    column.whereValue = currentColumnValue;
    CoreSQLUtils.transferTableContentForTableMapping(db, tableMapping);
  }

  /**
   * Get an available temporary table name. Starts with prefix_baseName and
   * then continues with prefix#_baseName starting at 1 and increasing.
   * @param db connection
   * @param prefix name prefix
   * @param baseName base name
   * @return unused table name
   */
  static tempTableName(db: GeoPackageConnection, prefix: string, baseName: string) {
    let name = prefix + '_' + baseName;
    let nameNumber = 0;
    while (db.tableExists(name)) {
      name = prefix + (++nameNumber) + '_' + baseName;
    }
    return name;
  }


  /**
   * Modify the SQL with a name change and the table mapping modifications
   * @param db optional connection, used for SQLite Master name conflict detection
   * @param name statement name
   * @param sql SQL statement
   * @param tableMapping table mapping
   * @return updated SQL, null if SQL contains a deleted column
   */
  static modifySQL(db: GeoPackageConnection, name: string, sql: string, tableMapping: TableMapping): string {
    let updatedSql = sql;
    if (name !== null && name !== undefined && tableMapping.isNewTable()) {
      let newName = CoreSQLUtils.createName(db, name, tableMapping.fromTable, tableMapping.toTable);
      let updatedName = CoreSQLUtils.replaceName(updatedSql, name, newName);
      if (updatedName !== null && updatedName !== undefined) {
        updatedSql = updatedName;
      }
      let updatedTable = CoreSQLUtils.replaceName(updatedSql, tableMapping.fromTable, tableMapping.toTable);
      if (updatedTable !== null && updatedTable !== undefined) {
        updatedSql = updatedTable;
      }
    }
    updatedSql = CoreSQLUtils.modifySQLWithTableMapping(updatedSql, tableMapping);
    return updatedSql;
  }

  /**
   * Modify the SQL with table mapping modifications
   * @param sql SQL statement
   * @param tableMapping table mapping
   * @return updated SQL, null if SQL contains a deleted column
   */
  static modifySQLWithTableMapping(sql: string, tableMapping: TableMapping): string {
    let updatedSql = sql;

    let droppedColumns = Array.from(tableMapping.droppedColumns);
    for (let i = 0; i < droppedColumns.length; i++) {
      let column = droppedColumns[i];
      let updated = CoreSQLUtils.replaceName(updatedSql, column, ' ');
      if (updated !== null && updated !== undefined) {
        updatedSql = null;
        break;
      }
    }

    if (updatedSql !== null && updatedSql !== undefined) {
      tableMapping.getMappedColumns().forEach(column => {
        if (column.hasNewName()) {
          let updated = CoreSQLUtils.replaceName(updatedSql, column.fromColumn, column.toColumn);
          if (updated !== null && updated !== undefined) {
            updatedSql = updated;
          }
        }
      });
    }
    return updatedSql;
  }

  /**
   * Replace the name (table, column, etc) in the SQL with the replacement.
   * The name must be surrounded by non word characters (i.e. not a subset of
   * another name).
   * @param sql SQL statement
   * @param name name
   * @param replacement replacement value
   * @return null if not modified, SQL value if replaced at least once
   */
  static replaceName(sql: string, name: string, replacement: string): string {

    let updatedSql = null;

    // Quick check if contained in the SQL
    if (sql.indexOf(name) >= 0) {

      let updated = false;
      let updatedSqlBuilder = '';

      // Split the SQL apart by the name
      let parts = sql.split(name);

      for (let i = 0; i <= parts.length; i++) {
        if (i > 0) {
          // Find the character before the name
          let before = '_';
          let beforePart = parts[i - 1];
          if (beforePart.length === 0) {
            if (i == 1) {
              // SQL starts with the name, allow
              before = ' ';
            }
          } else {
            before = beforePart.substring(beforePart.length - 1);
          }

          // Find the character after the name
          let after = '_';
          if (i < parts.length) {
            let afterPart = parts[i];
            if (afterPart.length !== 0) {
              after = afterPart.substring(0, 1);
            }
          } else if (sql.endsWith(name)) {
            // SQL ends with the name, allow
            after = ' ';
          } else {
            break;
          }

          // Check the before and after characters for non word
          // characters
          if (before.match('\\W').length > 0 && after.match('\\W').length > 0) {
            // Replace the name
            updatedSqlBuilder = updatedSqlBuilder.concat(replacement);
            updated = true;
          } else {
            // Preserve the name
            updatedSqlBuilder = updatedSqlBuilder.concat(name);
          }
        }

        // Add the part to the SQL
        if (i < parts.length) {
          updatedSqlBuilder = updatedSqlBuilder.concat(parts[i]);
        }
      }
      // Set if the SQL was modified
      if (updated) {
        updatedSql = updatedSqlBuilder.toString();
      }
    }
    return updatedSql;
  }

  /**
   * Create a new name by replacing a case insensitive value with a new value.
   * If no replacement is done, create a new name in the form name_#, where #
   * is either 2 or one greater than an existing name number suffix. When a db
   * connection is provided, check for conflicting SQLite Master names and
   * increment # until an available name is found.
   * @param db optional connection, used for SQLite Master name conflict detection
   * @param name current name
   * @param replace value to replace
   * @param replacement replacement value
   * @return new name
   */
  static createName(db: GeoPackageConnection, name: string, replace: string, replacement: string): string {
    // Attempt the replacement
    let newName = name.replace(new RegExp(replace), replacement);

    // If no name change was made
    if (newName === name) {
      let baseName = newName;
      let count = 1;
      // Find any existing end number: name_#
      let index = baseName.lastIndexOf('_');
      if (index >= 0 && index + 1 < baseName.length) {
        let numberPart = baseName.substring(index + 1);
        if (numberPart.match(CoreSQLUtils.NUMBER_PATTERN).length > 0) {
          baseName = baseName.substring(0, index);
          count = parseInt(numberPart);
        }
      }
      // Set the new name to name_2 or name_(#+1)
      newName = baseName + '_' + (++count);

      if (db !== null && db !== undefined) {
        // Check for conflicting SQLite Master table names
        while (SQLiteMaster.count(db, null, SQLiteMasterQuery.createForColumnValue(SQLiteMasterColumn.NAME, newName)) > 0) {
          newName = baseName + '_' + (++count);
        }
      }

    }
    return newName;
  }

  /**
   * Rebuild the GeoPackage, repacking it into a minimal amount of disk space
   * @param db connection
   */
  static vacuum(db: GeoPackageConnection) {
    db.run('VACUUM');
  }

}

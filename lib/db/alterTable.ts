import { GeoPackageConnection } from './geoPackageConnection';
import { UserTable } from '../user/userTable';
import { UserCustomTableReader } from '../user/custom/userCustomTableReader';
import { SQLUtils } from './sqlUtils';
import { StringUtils } from './stringUtils';
import { UserCustomTable } from '../user/custom/userCustomTable';
import { TableMapping } from './tableMapping';
import { UserColumn } from '../user/userColumn';
import { Constraint } from './table/constraint';
import { RawConstraint } from './table/rawConstraint';
import { ConstraintParser } from './table/constraintParser';
import { SQLiteMaster } from './master/sqliteMaster';
import { SQLiteMasterColumn } from './master/sqliteMasterColumn';
import { SQLiteMasterType } from './master/sqliteMasterType';
import { SQLiteMasterQuery } from './master/sqliteMasterQuery';
import { RTreeIndexDao } from '../extension/rtree/rtreeIndexDao';
/**
 * Builds and performs alter table statements
 */
export class AlterTable {
  /**
   * Create the ALTER TABLE SQL command prefix
   * @param table table name
   * @return alter table SQL prefix
   */
  static alterTableSQL(table: string) {
    return 'ALTER TABLE ' + StringUtils.quoteWrap(table);
  }

  /**
   * Rename a table
   * @param db connection
   * @param tableName table name
   * @param newTableName  new table name
   */
  static renameTable(db: GeoPackageConnection, tableName: string, newTableName: string) {
    const sql = AlterTable.renameTableSQL(tableName, newTableName);
    db.run(sql);
  }

  /**
   * Create the rename table SQL
   * @param tableName table name
   * @param newTableName new table name
   * @return rename table SQL
   */
  static renameTableSQL(tableName: string, newTableName: string) {
    return AlterTable.alterTableSQL(tableName) + ' RENAME TO ' + StringUtils.quoteWrap(newTableName);
  }

  /**
   * Rename a column
   * @param db connection
   * @param tableName table name
   * @param columnName column name
   * @param newColumnName new column name
   */
  static renameColumn(db: GeoPackageConnection, tableName: string, columnName: string, newColumnName: string) {
    const sql = AlterTable.renameColumnSQL(tableName, columnName, newColumnName);
    db.run(sql);
  }

  /**
   * Create the rename column SQL
   * @param tableName table name
   * @param columnName column name
   * @param newColumnName new column name
   * @return rename table SQL
   */
  static renameColumnSQL(tableName: string, columnName: string, newColumnName: string) {
    return (
      AlterTable.alterTableSQL(tableName) +
      ' RENAME COLUMN ' +
      StringUtils.quoteWrap(columnName) +
      ' TO ' +
      StringUtils.quoteWrap(newColumnName)
    );
  }

  /**
   * Add a column
   * @param db connection
   * @param tableName table name
   * @param columnName column name
   * @param columnDef column definition
   */
  static addColumn(db: GeoPackageConnection, tableName: string, columnName: string, columnDef: string) {
    const sql = AlterTable.addColumnSQL(tableName, columnName, columnDef);
    db.run(sql);
  }

  /**
   * Create the add column SQL
   * @param tableName table name
   * @param columnName column name
   * @param columnDef column definition
   * @return add column SQL
   */
  static addColumnSQL(tableName: string, columnName: string, columnDef: string) {
    return AlterTable.alterTableSQL(tableName) + ' ADD COLUMN ' + StringUtils.quoteWrap(columnName) + ' ' + columnDef;
  }

  /**
   * Drop a column
   * @param db connection
   * @param table table
   * @param columnName  column name
   */
  static dropColumnForUserTable(db: GeoPackageConnection, table: UserTable<UserColumn>, columnName: string) {
    AlterTable.dropColumnsForUserTable(db, table, [columnName]);
  }

  /**
   * Drop columns
   *
   * @param db connection
   * @param table table
   * @param columnNames column names
   */
  static dropColumnsForUserTable(db: GeoPackageConnection, table: UserTable<UserColumn>, columnNames: string[]) {
    const newTable: UserTable<UserColumn> = table.copy();
    columnNames.forEach(columnName => {
      newTable.dropColumnWithName(columnName);
    });
    // Build the table mapping
    const tableMapping = new TableMapping(
      newTable.getTableName(),
      newTable.getTableName(),
      newTable.getUserColumns().getColumns(),
    );
    columnNames.forEach(columnName => {
      tableMapping.addDroppedColumn(columnName);
    });

    AlterTable.alterTableWithTableMapping(db, newTable, tableMapping);

    columnNames.forEach(columnName => {
      table.dropColumnWithName(columnName);
    });
  }

  /**
   * Drop a column
   * @param db connection
   * @param tableName table name
   * @param columnName column name
   */
  static dropColumn(db: GeoPackageConnection, tableName: string, columnName: string) {
    AlterTable.dropColumns(db, tableName, [columnName]);
  }

  /**
   * Drop columns
   *
   * @param db connection
   * @param tableName table name
   * @param columnNames column names
   */
  static dropColumns(db: GeoPackageConnection, tableName: string, columnNames: string[]): void {
    const userTable: UserTable<UserColumn> = new UserCustomTableReader(tableName).readTable(db);
    AlterTable.dropColumnsForUserTable(db, userTable, columnNames);
  }

  /**
   * Alter a column
   * @param db connection
   * @param table table
   * @param column column
   * @param user column type
   */
  static alterColumnForTable(db: GeoPackageConnection, table: UserTable<UserColumn>, column: any) {
    AlterTable.alterColumnsForTable(db, table, [column]);
  }

  /**
   * Alter columns
   * @param db connection
   * @param table table
   * @param columns columns
   */
  static alterColumnsForTable(db: GeoPackageConnection, table: UserTable<UserColumn>, columns: UserColumn[]) {
    const newTable: UserTable<UserColumn> = table.copy();

    columns.forEach(column => {
      newTable.alterColumn(column);
    });

    AlterTable.alterTable(db, newTable);

    columns.forEach(column => {
      table.alterColumn(column);
    });
  }

  /**
   * Alter a column
   * @param db connection
   * @param tableName table name
   * @param column column
   */
  static alterColumn(db: GeoPackageConnection, tableName: string, column: UserColumn) {
    AlterTable.alterColumns(db, tableName, [column]);
  }

  /**
   * Alter columns
   * @param db connection
   * @param tableName table name
   * @param columns columns
   */
  static alterColumns(db: GeoPackageConnection, tableName: string, columns: UserColumn[]) {
    const userTable: UserCustomTable = new UserCustomTableReader(tableName).readTable(db);
    AlterTable.alterColumnsForTable(db, userTable, columns);
  }

  /**
   * Copy the table
   * @param db connection
   * @param table table
   * @param newTableName new table name
   * @param transferContent transfer row content to the new table
   */
  static copyTable(
    db: GeoPackageConnection,
    table: UserTable<UserColumn>,
    newTableName: string,
    transferContent = true,
  ) {
    // Build the table mapping
    const tableMapping = new TableMapping(table.getTableName(), newTableName, table.getUserColumns().getColumns());
    tableMapping.transferContent = transferContent;
    AlterTable.alterTableWithTableMapping(db, table, tableMapping);
  }

  /**
   * Copy the table
   * @param db connection
   * @param tableName table name
   * @param newTableName new table name
   * @param transferContent transfer row content to the new table
   */
  static copyTableWithName(db: GeoPackageConnection, tableName: string, newTableName: string, transferContent = true) {
    const userTable: UserCustomTable = new UserCustomTableReader(tableName).readTable(db);
    AlterTable.copyTable(db, userTable, newTableName, transferContent);
  }

  /**
   * Alter a table with a new table schema assuming a default table mapping.
   * This removes views on the table, creates a new table, transfers the old
   * table data to the new, drops the old table, and renames the new table to
   * the old. Indexes, triggers, and views that reference deleted columns are
   * not recreated. An attempt is made to recreate the others including any
   * modifications for renamed columns.
   *
   * Making Other Kinds Of Table Schema Changes:
   * https://www.sqlite.org/lang_altertable.html
   *
   * @param db connection
   * @param newTable  new table schema
   */
  static alterTable(db: GeoPackageConnection, newTable: UserTable<UserColumn>) {
    // Build the table mapping
    const tableMapping = new TableMapping(
      newTable.getTableName(),
      newTable.getTableName(),
      newTable.getUserColumns().getColumns(),
    );
    AlterTable.alterTableWithTableMapping(db, newTable, tableMapping);
  }

  /**
   * Alter a table with a new table schema and table mapping.
   *
   * Altering a table: Removes views on the table, creates a new table,
   * transfers the old table data to the new, drops the old table, and renames
   * the new table to the old. Indexes, triggers, and views that reference
   * deleted columns are not recreated. An attempt is made to recreate the
   * others including any modifications for renamed columns.
   *
   * Creating a new table: Creates a new table and transfers the table data to
   * the new. Triggers are not created on the new table. Indexes and views
   * that reference deleted columns are not recreated. An attempt is made to
   * create the others on the new table.
   *
   * Making Other Kinds Of Table Schema Changes:
   * https://www.sqlite.org/lang_altertable.html
   *
   * @param db connection
   * @param newTable new table schema
   * @param tableMapping table mapping
   */
  static alterTableWithTableMapping(
    db: GeoPackageConnection,
    newTable: UserTable<UserColumn>,
    tableMapping: TableMapping,
  ) {
    // Update column constraints
    newTable
      .getUserColumns()
      .getColumns()
      .forEach((column: UserColumn) => {
        const columnConstraints = column.clearConstraints();
        columnConstraints.forEach((columnConstraint: Constraint) => {
          const updatedSql = SQLUtils.modifySQL(null, columnConstraint.name, columnConstraint.buildSql(), tableMapping);
          if (updatedSql !== null && updatedSql !== undefined) {
            column.addConstraint(
              new RawConstraint(columnConstraint.type, ConstraintParser.getName(updatedSql), updatedSql),
            );
          }
        });
      });

    // Update table constraints
    const tableConstraints = newTable.clearConstraints();
    tableConstraints.forEach((tableConstraint: Constraint) => {
      const updatedSql = SQLUtils.modifySQL(null, tableConstraint.name, tableConstraint.buildSql(), tableMapping);
      if (updatedSql !== null && updatedSql !== undefined) {
        newTable.addConstraint(new RawConstraint(tableConstraint.type, tableConstraint.name, updatedSql));
      }
    });

    // Build the create table sql
    const sql = SQLUtils.createTableSQL(newTable);
    AlterTable.alterTableWithSQLAndTableMapping(db, sql, tableMapping);
  }

  /**
   * Alter a table with a new table SQL creation statement and table mapping.
   *
   * Altering a table: Removes views on the table, creates a new table,
   * transfers the old table data to the new, drops the old table, and renames
   * the new table to the old. Indexes, triggers, and views that reference
   * deleted columns are not recreated. An attempt is made to recreate the
   * others including any modifications for renamed columns.
   *
   * Creating a new table: Creates a new table and transfers the table data to
   * the new. Triggers are not created on the new table. Indexes and views
   * that reference deleted columns are not recreated. An attempt is made to
   * create the others on the new table.
   *
   * Making Other Kinds Of Table Schema Changes:
   * https://www.sqlite.org/lang_altertable.html
   *
   * @param db
   *            connection
   * @param sql
   *            new table SQL
   * @param tableMapping
   *            table mapping
   */
  static alterTableWithSQLAndTableMapping(db: GeoPackageConnection, sql: string, tableMapping: TableMapping) {
    const tableName = tableMapping.fromTable;

    // Determine if a new table copy vs an alter table
    const newTable = tableMapping.isNewTable();

    // 1. Disable foreign key constraints
    const enableForeignKeys = SQLUtils.setForeignKeys(db, false);

    // 2. Start a transaction
    let successful = true;
    db.transaction(() => {
      try {
        // 9a. Query for views
        const views = SQLiteMaster.queryViewsOnTable(db, [SQLiteMasterColumn.NAME, SQLiteMasterColumn.SQL], tableName);
        // Remove the views if not a new table
        if (!newTable) {
          for (let i = 0; i < views.count(); i++) {
            const viewName = views.getName(i);
            try {
              SQLUtils.dropView(db, viewName);
            } catch (error) {
              console.warn('Failed to drop view: ' + viewName + ', table: ' + tableName, error);
            }
          }
        }

        // 3. Query indexes and triggers
        const indexesAndTriggers = SQLiteMaster.query(
          db,
          [SQLiteMasterColumn.NAME, SQLiteMasterColumn.TYPE, SQLiteMasterColumn.SQL],
          [SQLiteMasterType.INDEX, SQLiteMasterType.TRIGGER],
          SQLiteMasterQuery.createForColumnValue(SQLiteMasterColumn.TBL_NAME, tableName),
        );

        // Get the temporary or new table name
        let transferTable;
        if (newTable) {
          transferTable = tableMapping.toTable;
        } else {
          transferTable = SQLUtils.tempTableName(db, 'new', tableName);
          tableMapping.toTable = transferTable;
        }

        // 4. Create the new table
        sql = sql.replace('"' + tableName + '"', '"' + transferTable + '"');

        db.run(sql);

        // If transferring content
        if (tableMapping.isTransferContent()) {
          // 5. Transfer content to new table
          SQLUtils.transferTableContentForTableMapping(db, tableMapping);
        }
        // If altering a table
        if (!newTable) {
          // 6. Drop the old table
          SQLUtils.dropTable(db, tableName);
          // 7. Rename the new table
          AlterTable.renameTable(db, transferTable, tableName);
          tableMapping.toTable = tableName;
        }
        // 8. Create the indexes and triggers
        for (let i = 0; i < indexesAndTriggers.count(); i++) {
          let create = !newTable;
          if (!create) {
            // Don't create rtree triggers for new tables
            create =
              indexesAndTriggers.getType(i) != SQLiteMasterType.TRIGGER ||
              !indexesAndTriggers.getName(i).startsWith(RTreeIndexDao.PREFIX);
          }
          if (create) {
            let tableSql = indexesAndTriggers.getSql(i);
            if (tableSql != null) {
              tableSql = SQLUtils.modifySQL(db, indexesAndTriggers.getName(i), tableSql, tableMapping);
              if (tableSql != null) {
                try {
                  db.run(tableSql);
                } catch (e) {
                  console.warn(
                    'Failed to recreate ' +
                      indexesAndTriggers.getType(i) +
                      ' after table alteration. table: ' +
                      tableMapping.toTable +
                      ', sql: ' +
                      tableSql,
                    e,
                  );
                }
              }
            }
          }
        }
        // 9b. Recreate views
        for (let i = 0; i < views.count(); i++) {
          let viewSql = views.getSql(i);
          if (viewSql !== null && viewSql !== undefined) {
            viewSql = SQLUtils.modifySQL(db, views.getName(i), viewSql, tableMapping);
            if (viewSql !== null && viewSql !== undefined) {
              try {
                db.run(viewSql);
              } catch (e) {
                console.warn(
                  'Failed to recreate view: ' +
                    views.getName(i) +
                    ', table: ' +
                    tableMapping.toTable +
                    ', sql: ' +
                    viewSql,
                  e,
                );
              }
            }
          }
        }

        // 10. Foreign key check
        if (enableForeignKeys) {
          AlterTable.foreignKeyCheck(db);
        }
      } catch (e) {
        successful = false;
      }
    });

    // 12. Re-enable foreign key constraints
    if (enableForeignKeys) {
      SQLUtils.setForeignKeys(db, true);
    }
  }

  /**
   * Perform a foreign key check for violations
   * @param db connection
   */
  static foreignKeyCheck(db: GeoPackageConnection) {
    const violations = SQLUtils.foreignKeyCheck(db);

    if (violations.length > 0) {
      let violationsMessage = [];
      for (let i = 0; i < violations.length; i++) {
        if (i > 0) {
          violationsMessage = violationsMessage.concat(' ');
        }
        violationsMessage = violationsMessage.concat(i + 1).concat(': ');
        const violation = violations[i];
        for (let j = 0; j < violation.length; j++) {
          if (j > 0) {
            violationsMessage = violationsMessage.concat(', ');
          }
          violationsMessage = violationsMessage.concat(violation.get(j));
        }
      }
      throw new Error('Foreign Key Check Violations: ' + violationsMessage);
    }
  }
}

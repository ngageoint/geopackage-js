/**
 * SQLite Master table queries (sqlite_master)
 */
import { SQLiteMasterColumn } from './sqliteMasterColumn';
import { SQLiteMasterType } from './sqliteMasterType';
import { TableConstraints } from '../table/tableConstraints';
import { ConstraintParser } from '../table/constraintParser';
import { GeoPackageConnection } from '../geoPackageConnection';
import { SQLiteMasterQuery } from './sqliteMasterQuery';

export class SQLiteMaster {

	/**
	 * Table Name
	 */
	static TABLE_NAME = 'sqlite_master';

	/**
	 * SQLiteMaster query results
	 */
	_results: any[];

	/**
	 * Mapping between result columns and indices
	 */
	_columns = new Map<SQLiteMasterColumn, number>();

	/**
	 * Query result count
	 */
	_count: number;

	/**
	 * Constructor
	 * @param results query results
	 * @param columns query columns
	 */
	constructor(results: any[], columns: SQLiteMasterColumn[]) {
		if (columns !== null && columns !== undefined) {
			this._results = results;
			this._count = results.length;
			for (let i = 0; i < columns.length; i++) {
				this._columns.set(columns[i], i);
			}
		} else {
			// Count only result
			this._results = [];
			this._count = results[0][0];
		}
	}

	/**
	 * Result count
	 * @return count
	 */
	count(): number {
		return this._count;
	}

	/**
	 * Get the columns in the result
	 * @return columns
	 */
	columns(): Set<SQLiteMasterColumn>  {
		return new Set(this._columns.keys());
	}

	/**
	 * Get the type
	 * @param row row index
	 * @return type
	 */
	getType(row: number): SQLiteMasterType {
		return SQLiteMasterType.fromName(this.getTypeString(row).toUpperCase());
	}

	/**
	 * Get the type string
	 * @param row row index
	 * @return type string
	 */
	getTypeString(row: number): string {
		return  this.getValueForRowAndColumn(row, SQLiteMasterColumn.TYPE);
	}

	/**
	 * Get the name
	 * @param row row index
	 * @return name
	 */
	getName(row: number): string {
		return this.getValueForRowAndColumn(row, SQLiteMasterColumn.NAME);
	}

	/**
	 * Get the table name
	 * @param row row index
	 * @return name
	 */
	getTableName(row: number): string {
		return this.getValueForRowAndColumn(row, SQLiteMasterColumn.TBL_NAME);
	}

	/**
	 * Get the rootpage
	 * @param row row index
	 * @return name
	 */
	getRootpage(row: number): number {
		return this.getValueForRowAndColumn(row, SQLiteMasterColumn.ROOTPAGE);
	}

	/**
	 * Get the sql
	 * @param row row index
	 * @return name
	 */
	getSql(row: number): string {
		return this.getValueForRowAndColumn(row, SQLiteMasterColumn.SQL);
	}

	/**
	 * Get the value of the column at the row index
	 *
	 * @param row
	 *            row index
	 * @param column
	 *            column type
	 * @return value
	 */
	getValueForRowAndColumn(row: number, column: SQLiteMasterColumn): any {
		return this.getValue(this.getRow(row), column);
	}

	/**
	 * Get the row at the row index
	 * @param row row index
	 * @return row column values
	 */
	getRow(row: number): any[] {
		if (row < 0 || row >= this._results.length) {
			let message;
			if (this._results.length === 0) {
				message = 'Results are empty';
			} else {
				message = 'Row index: ' + row + ', not within range 0 to ' + (this._results.length - 1);
			}
			throw new Error(message);
		}
		return this._results[row];
	}

	/**
	 * Get the value in the row at the column index
	 * @param row row
	 * @param column column type
	 * @return value
	 */
	getValue(row: any[], column: SQLiteMasterColumn): any {
		return row[this.getColumnIndex(column)];
	}

	/**
	 * Get the column index of the column type
	 * @param column column type
	 * @return column index
	 */
	getColumnIndex(column: SQLiteMasterColumn): number {
		let index = this._columns.get(column);
		if (index == null) {
			throw new Error('Column does not exist in row values: ' + column);
		}
		return index;
	}

	/**
	 * Get the constraints from table SQL
	 * @param row row index
	 * @return constraints
	 */
	getConstraints(row: number): TableConstraints {
		let constraints = new TableConstraints();
		if (this.getType(row) === SQLiteMasterType.TABLE) {
			let sql = this.getSql(row);
			if (sql !== null && sql !== undefined) {
				constraints = ConstraintParser.getConstraints(sql);
			}
		}
		return constraints;
	}

	/**
	 * Shortcut to build columns into an array
	 * @param columns columns
	 * @return columns
	 */
	static columnsToArray(...columns: SQLiteMasterColumn[]): SQLiteMasterColumn[] {
		return columns;
	}

	/**
	 * Shortcut to build types into an array
	 * @param types types
	 * @return types
	 */
	static typesToArray(...types: SQLiteMasterType[]) {
		return types;
	}

	/**
	 * Count the sqlite_master table
	 *
	 * @param db
	 *            connection
	 * @param types
	 *            result types
	 * @param query
	 *            query
	 * @return count
	 */
	static count(db: GeoPackageConnection, types: SQLiteMasterType[], query: SQLiteMasterQuery): number {
		return SQLiteMaster.query(db, null, types, query).count();
	}

	/**
	 * Query the sqlite_master table
	 *
	 * @param db connection
	 * @param columns result columns
	 * @param types result types
	 * @param query query
	 * @return SQLiteMaster result
	 */
	static query(db: GeoPackageConnection, columns: SQLiteMasterColumn[], types: SQLiteMasterType[], query: SQLiteMasterQuery): SQLiteMaster {
		let sql = 'SELECT ';
		let args = [];

		if (columns !== null && columns !== undefined && columns.length > 0) {
			for (let i = 0; i < columns.length; i++) {
				if (i > 0) {
					sql = sql.concat(', ');
				}
				sql = sql.concat(SQLiteMasterColumn.nameFromType(columns[i]).toLowerCase());
			}

		} else {
			sql = sql.concat('count(*)');
		}

		sql = sql.concat(' FROM ');
		sql = sql.concat(SQLiteMaster.TABLE_NAME);

		let hasQuery = query !== null && query !== undefined && query.has();
		let hasTypes = types !== null && types !== undefined && types.length > 0;

		if (hasQuery || hasTypes) {
			sql = sql.concat(" WHERE ");

			if (hasQuery) {
				sql = sql.concat(query.buildSQL());
				args.push(...query.getArguments());
			}

			if (hasTypes) {

				if (hasQuery) {
					sql = sql.concat(" AND");
				}

				sql = sql.concat(" type IN (");
				for (let i = 0; i < types.length; i++) {
					if (i > 0) {
						sql = sql.concat(", ");
					}
					sql = sql.concat("?");
					args.push(SQLiteMasterType.nameFromType(types[i]).toLowerCase());
				}
				sql = sql.concat(")");
			}
		}

		let results = db.all(sql.toString(), args);
		return new SQLiteMaster(results, columns);
	}

	/**
	 * Query the sqlite_master views on the table
	 * @param db connection
	 * @param columns result columns
	 * @param tableName table name
	 * @return SQLiteMaster result
	 */
	static queryViewsOnTable(db: GeoPackageConnection, columns: SQLiteMasterColumn[], tableName: string): SQLiteMaster {
		return SQLiteMaster.query(db, columns, [SQLiteMasterType.VIEW], SQLiteMasterQuery.createTableViewQuery(tableName));
	}

	/**
	 * Count the sqlite_master views on the table
	 * @param db connection
	 * @param tableName table name
	 * @return count
	 */
	static countViewsOnTable(db: GeoPackageConnection, tableName: string): number {
		return SQLiteMaster.count(db, [SQLiteMasterType.VIEW], SQLiteMasterQuery.createTableViewQuery(tableName));
	}

	/**
	 * Query for the table constraints
	 * @param db  connection
	 * @param tableName able name
	 * @return SQL constraints
	 */
	static queryForConstraints(db: GeoPackageConnection, tableName: string): TableConstraints {
		let constraints = new TableConstraints();
		let tableMaster = SQLiteMaster.query(db, null, [SQLiteMasterType.TABLE], SQLiteMasterQuery.createForColumnValue(SQLiteMasterColumn.TBL_NAME, tableName));
		for (let i = 0; i < tableMaster.count(); i++) {
			constraints.addTableConstraints(tableMaster.getConstraints(i).constraints);
		}
		return constraints;
	}

}

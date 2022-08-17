import { FeatureDao } from "../../features/user/featureDao";
import { FeatureResultSet } from "../../features/user/featureResultSet";
import { GeoPackageProgress } from "../../io/geoPackageProgress";
import { UserCustomDao } from "../../user/custom/userCustomDao";
import { RTreeIndexExtension } from "./rtreeIndexExtension";
import { Extensions } from "../extensions";
import { UserCustomResultSet } from "../../user/custom/userCustomResultSet";
import { FeatureRow } from "../../features/user/featureRow";
import { RTreeIndexTableRow } from "./rTreeIndexTableRow";
import { UserCustomRow } from "../../user/custom/userCustomRow";
import { GeoPackageException } from "../../geoPackageException";
import { ColumnValues } from "../../dao/columnValues";
import { BoundingBox } from "../../boundingBox";
import { Projection } from "@ngageoint/projections-js";
import { GeometryTransform } from "@ngageoint/simple-features-proj-js";
import { SQLUtils } from "../../db/sqlUtils";

/**
 * RTree Index Table DAO for reading geometry index ranges
 */
export class RTreeIndexTableDao extends UserCustomDao {

	/**
	 * RTree index extension
	 */
	private readonly rTree: RTreeIndexExtension;

	/**
	 * Feature DAO
	 */
	private readonly featureDao: FeatureDao;

	/**
	 * Progress
	 */
	protected progress: GeoPackageProgress;

	/**
	 * Query range tolerance
	 */
	protected tolerance: number = .00000000000001;

	/**
	 * Constructor
	 * 
	 * @param rTree RTree extension
	 * @param dao user custom data access object
	 * @param featureDao feature DAO
	 */
	constructor(rTree: RTreeIndexExtension, dao: UserCustomDao, featureDao: FeatureDao) {
		super(dao, dao.getTable());
		this.rTree = rTree;
		this.featureDao = featureDao;
		this.projection = featureDao.getProjection();
	}

	/**
	 * Set the progress tracker
	 *
	 * @param progress progress tracker
	 */
	public setProgress(progress: GeoPackageProgress): void {
		this.progress = progress;
	}

	/**
	 * Get the query range tolerance
	 * 
	 * @return query range tolerance
	 */
	public getTolerance(): number {
		return this.tolerance;
	}

	/**
	 * Set the query range tolerance
	 * 
	 * @param tolerance query range tolerance
	 */
	public setTolerance(tolerance: number): void {
		this.tolerance = tolerance;
	}

	/**
	 * Determine if this feature table has the RTree extension
	 * 
	 * @return true if has extension
	 */
	public has(): boolean {
		return this.rTree.has(this.featureDao.getTable());
	}

	/**
	 * Create the RTree extension for the feature table
	 * @return extension
	 */
	public create(): Extensions {
		let extension = null;
		if (!this.has()) {
			extension = this.rTree.create(this.featureDao.getTable());
			if (this.progress != null) {
				this.progress.addProgress(this.count(false, undefined));
			}
		}
		return extension;
	}

	/**
	 * Delete the RTree extension for the feature table
	 */
	public delete(): void {
		this.rTree.delete(featureDao.getTable());
	}

	/**
	 * Get the RTree index extension
	 * 
	 * @return RTree index extension
	 */
	public getRTreeIndexExtension(): RTreeIndexExtension {
		return this.rTree;
	}

	/**
	 * Get the feature DAO
	 * 
	 * @return feature DAO
	 */
	public getFeatureDao(): FeatureDao {
		return this.featureDao;
	}

	/**
	 * Get the RTree Index Table row from the current result set location
	 * 
	 * @param resultSet result set
	 * @return RTree Index Table row
	 */
	public getRowWithUserCustomResultSet(resultSet: UserCustomResultSet): RTreeIndexTableRow {
		return this.getRow(resultSet.getRow());
	}

	/**
	 * Get the RTree Index Table row from the user custom row
	 * 
	 * @param row custom row
	 * @return RTree Index Table row
	 */
	public getRow(row: UserCustomRow): RTreeIndexTableRow {
		return new RTreeIndexTableRow(row);
	}

	/**
	 * Get the feature row from the RTree Index Table row
	 * 
	 * @param row RTree Index Table row
	 * @return feature row
	 */
	public getFeatureRow(row: RTreeIndexTableRow): FeatureRow {
		return this.featureDao.queryForIdRow(row.getId());
	}

	/**
	 * Get the feature row from the RTree Index Table row
	 * 
	 * @param resultSet result set
	 * @return feature row
	 */
	public getFeatureRowWithUserCustomResultSet(resultSet: UserCustomResultSet): FeatureRow {
		const row = this.getRowWithUserCustomResultSet(resultSet);
		return this.getFeatureRow(row);
	}

	/**
	 * Get the feature row from the user custom row
	 * 
	 * @param row custom row
	 * @return feature row
	 */
	public getFeatureRowWithUserCustomRow(row: UserCustomRow): FeatureRow {
		return this.getFeatureRow(this.getRow(row));
	}

	/**
	 * {@inheritDoc}
	 */
	public query(distinct: boolean, columns: string[], where: string, whereArgs: string[], groupBy: string, having: string, orderBy: string, limit: string): UserCustomResultSet {
		this.validateRTree();
		return super.query(distinct, columns, where, whereArgs, groupBy, having, orderBy, limit);
	}

	/**
	 * {@inheritDoc}
	 */
	public count(distinct: boolean, column: string, where?: string, args?: string[]): number {
		this.validateRTree();
		return super.countColumn(distinct, column, where, args);
	}

	/**
	 * Query for all features
	 *
	 * @return feature results
	 * @since 3.4.0
	 */
	public queryAllFeatures(): FeatureResultSet {
		this.validateRTree();
		return this.featureDao.queryIn(this.queryIdsSQL());
	}

	/**
	 * Query for all features
	 *
	 * @param distinct distinct rows
	 * @return feature results
	 * @since 4.0.0
	 */
	public queryFeatures(distinct: boolean): FeatureResultSet {
		this.validateRTree();
		return featureDao.queryIn(distinct, queryIdsSQL());
	}

	/**
	 * Query for all features
	 *
	 * @param columns columns
	 *
	 * @return feature results
	 * @since 3.5.0
	 */
	public queryFeatures(columns: string[]): FeatureResultSet {
		this.validateRTree();
		return featureDao.queryIn(columns, queryIdsSQL());
	}

	/**
	 * Query for all features
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 *
	 * @return feature results
	 * @since 4.0.0
	 */
	public queryFeatures(distinct: boolean, columns: string[]): FeatureResultSet {
		this.validateRTree();
		return featureDao.queryIn(distinct, columns, queryIdsSQL());
	}

	/**
	 * Count features
	 *
	 * @return count
	 * @since 4.0.0
	 */
	public countFeatures(): number {
		this.validateRTree();
		return featureDao.countIn(queryIdsSQL());
	}

	/**
	 * Count features
	 *
	 * @param column count column name
	 *
	 * @return count
	 * @since 4.0.0
	 */
	public countColumnFeatures(column: string): number {
		this.validateRTree();
		return featureDao.countIn(column, queryIdsSQL());
	}

	/**
	 * Count features
	 *
	 * @param distinct distinct column values
	 * @param column count column name
	 *
	 * @return count
	 * @since 4.0.0
	 */
	public countFeatures(distinct: boolean, column: string): number {
		this.validateRTree();
		return featureDao.countIn(distinct, column, queryIdsSQL());
	}

	/**
	 * Query for features
	 *
	 * @param fieldValues field values
	 *
	 * @return feature results
	 * @since 3.4.0
	 */
	public queryFeatures(fieldValues: ColumnValues): FeatureResultSet {
		this.validateRTree();
		return featureDao.queryIn(queryIdsSQL(), fieldValues);
	}

	/**
	 * Query for features
	 *
	 * @param distinct distinct rows
	 * @param fieldValues field values
	 *
	 * @return feature results
	 * @since 4.0.0
	 */
	public queryFeatures(distinct: boolean, fieldValues: ColumnValues): FeatureResultSet {
		this.validateRTree();
		return featureDao.queryIn(distinct, queryIdsSQL(), fieldValues);
	}

	/**
	 * Query for features
	 *
	 * @param columns columns
	 * @param fieldValues field values
	 *
	 * @return feature results
	 * @since 3.5.0
	 */
	public queryFeatures(columns: string[], fieldValues: ColumnValues): FeatureResultSet {
		this.validateRTree();
		return featureDao.queryIn(columns, queryIdsSQL(), fieldValues);
	}

	/**
	 * Query for features
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param fieldValues field values
	 *
	 * @return feature results
	 * @since 4.0.0
	 */
	public queryFeatures(distinct: boolean, columns: string[], fieldValues: ColumnValues): FeatureResultSet {
		this.validateRTree();
		return featureDao.queryIn(distinct, columns, queryIdsSQL(), fieldValues);
	}

	/**
	 * Count features
	 *
	 * @param fieldValues field values
	 *
	 * @return count
	 * @since 3.4.0
	 */
	public countFeatures(fieldValues: ColumnValues): number {
		this.validateRTree();
		return featureDao.countIn(queryIdsSQL(), fieldValues);
	}

	/**
	 * Count features
	 *
	 * @param column count column value
	 * @param fieldValues field values
	 *
	 * @return count
	 * @since 4.0.0
	 */
	public countFeatures(column: string, fieldValues: ColumnValues): number {
		this.validateRTree();
		return featureDao.countIn(column, queryIdsSQL(), fieldValues);
	}

	/**
	 * Count features
	 *
	 * @param distinct distinct column values
	 * @param column count column value
	 * @param fieldValues field values
	 *
	 * @return count
	 * @since 4.0.0
	 */
	public countFeatures(distinct: boolean, column: string, fieldValues: ColumnValues): number {
		this.validateRTree();
		return featureDao.countIn(distinct, column, queryIdsSQL(), fieldValues);
	}

	/**
	 * Query for features
	 *
	 * @param where where clause
	 *
	 * @return feature results
	 * @since 3.4.0
	 */
	public queryFeatures(where: string): FeatureResultSet {
		return queryFeatures(false, where);
	}

	/**
	 * Query for features
	 *
	 * @param distinct distinct rows
	 * @param where where clause
	 *
	 * @return feature results
	 * @since 4.0.0
	 */
	public queryFeatures(distinct: boolean, where: string): FeatureResultSet {
		return queryFeatures(distinct, where, null);
	}

	/**
	 * Query for features
	 *
	 * @param columns columns
	 * @param where where clause
	 *
	 * @return feature results
	 * @since 3.5.0
	 */
	public queryFeatures(columns: string[], where: string): FeatureResultSet {
		return queryFeatures(false, columns, where);
	}

	/**
	 * Query for features
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param where where clause
	 *
	 * @return feature results
	 * @since 4.0.0
	 */
	public queryFeatures(distinct: boolean, columns: string[], where: string): FeatureResultSet {
		return queryFeatures(distinct, columns, where, null);
	}

	/**
	 * Count features
	 *
	 * @param where where clause
	 *
	 * @return count
	 * @since 3.4.0
	 */
	public countFeatures(where: string): number {
		return countFeatures(false, null, where);
	}

	/**
	 * Count features
	 *
	 * @param column count column name
	 * @param where where clause
	 *
	 * @return count
	 * @since 4.0.0
	 */
	public countFeatures(column: string, where: string): number {
		return countFeatures(false, column, where);
	}

	/**
	 * Count features
	 *
	 * @param distinct distinct column values
	 * @param column count column name
	 * @param where where clause
	 *
	 * @return count
	 * @since 4.0.0
	 */
	public countFeatures(distinct: boolean, column: string, where: string): number {
		return countFeatures(distinct, column, where, null);
	}

	/**
	 * Query for features
	 *
	 * @param where where clause
	 * @param whereArgs where arguments
	 *
	 * @return feature results
	 * @since 3.4.0
	 */
	public queryFeatures(where: string, whereArgs: string[]): FeatureResultSet {
		this.validateRTree();
		return featureDao.queryIn(queryIdsSQL(), where, whereArgs);
	}

	/**
	 * Query for features
	 *
	 * @param distinct distinct rows
	 * @param where where clause
	 * @param whereArgs where arguments
	 *
	 * @return feature results
	 * @since 4.0.0
	 */
	public queryFeatures(distinct: boolean, where: string, whereArgs: string[]): FeatureResultSet {
		this.validateRTree();
		return featureDao.queryIn(distinct, queryIdsSQL(), where, whereArgs);
	}

	/**
	 * Query for features
	 *
	 * @param columns columns
	 * @param where where clause
	 * @param whereArgs where arguments
	 *
	 * @return feature results
	 * @since 3.5.0
	 */
	public queryFeatures(columns: string[], where: string, whereArgs: string[]): FeatureResultSet {
		this.validateRTree();
		return featureDao.queryIn(columns, queryIdsSQL(), where, whereArgs);
	}

	/**
	 * Query for features
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param where where clause
	 * @param whereArgs where arguments
	 *
	 * @return feature results
	 * @since 4.0.0
	 */
	public queryFeatures(distinct: boolean, columns: string[], where: string, whereArgs: string[]): FeatureResultSet {
		this.validateRTree();
		return featureDao.queryIn(distinct, columns, queryIdsSQL(), where, whereArgs);
	}

	/**
	 * Count features
	 *
	 * @param where where clause
	 * @param whereArgs where arguments
	 *
	 * @return count
	 * @since 3.4.0
	 */
	public countFeatures(where: string, whereArgs: string[]): number {
		this.validateRTree();
		return featureDao.countIn(queryIdsSQL(), where, whereArgs);
	}

	/**
	 * Count features
	 *
	 * @param column count column name
	 * @param where where clause
	 * @param whereArgs where arguments
	 *
	 * @return count
	 * @since 4.0.0
	 */
	public countFeatures(column: string, where: string, whereArgs: string[]): number {
		this.validateRTree();
		return featureDao.countIn(column, queryIdsSQL(), where, whereArgs);
	}

	/**
	 * Count features
	 *
	 * @param distinct distinct column values
	 * @param column count column name
	 * @param where where clause
	 * @param whereArgs where arguments
	 *
	 * @return count
	 * @since 4.0.0
	 */
	public countFeatures(distinct: boolean, column: string, where: string, whereArgs: string[]): number {
		this.validateRTree();
		return featureDao.countIn(distinct, column, queryIdsSQL(), where, whereArgs);
	}

	/**
	 * {@inheritDoc}
	 */
	public getBoundingBox(): BoundingBox {
		const values = this.querySingleRowTypedResults(
				"SELECT MIN(" + RTreeIndexExtension.COLUMN_MIN_X + "), MIN("
						+ RTreeIndexExtension.COLUMN_MIN_Y + "), MAX("
						+ RTreeIndexExtension.COLUMN_MAX_X + "), MAX("
						+ RTreeIndexExtension.COLUMN_MAX_Y + ") FROM "
						+ SQLUtils.quoteWrap(this.getTableName()), null);
		const boundingBox = new BoundingBox(values.get(0), values.get(1), values.get(2), values.get(3));
		return boundingBox;
	}

	/**
	 * {@inheritDoc}
	 */
	public getBoundingBoxWithProjection(projection: Projection): BoundingBox {
		let boundingBox = this.getBoundingBox();
		if (boundingBox != null && projection != null) {
			const projectionTransform = GeometryTransform.create(this.featureDao.getProjection(), projection);
			boundingBox = boundingBox.transform(projectionTransform);
		}
		return boundingBox;
	}

	/**
	 * Query for rows within the bounding box
	 *
	 * @param boundingBox bounding box
	 * @return results
	 */
	public query(boundingBox: BoundingBox): UserCustomResultSet {
		return query(false, boundingBox);
	}

	/**
	 * Query for rows within the bounding box
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @return results
	 * @since 4.0.0
	 */
	public query(distinct: boolean, boundingBox: BoundingBox): UserCustomResultSet {
		return query(distinct, boundingBox.buildEnvelope());
	}

	/**
	 * Query for rows within the bounding box
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @return results
	 * @since 3.5.0
	 */
	public query(columns: string[], boundingBox: BoundingBox): UserCustomResultSet {
		return query(false, columns, boundingBox);
	}

	/**
	 * Query for rows within the bounding box
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @return results
	 * @since 4.0.0
	 */
	public query(distinct: boolean, columns: string[], boundingBox: BoundingBox): UserCustomResultSet {
		return query(distinct, columns, boundingBox.buildEnvelope());
	}

	/**
	 * Count the rows within the bounding box
	 *
	 * @param boundingBox bounding box
	 * @return count
	 */
	public count(boundingBox: BoundingBox): number {
		return count(false, null, boundingBox);
	}

	/**
	 * Count the rows within the bounding box
	 *
	 * @param column count column name
	 * @param boundingBox bounding box
	 * @return count
	 * @since 4.0.0
	 */
	public count(column: string, boundingBox: BoundingBox): number {
		return count(false, column, boundingBox);
	}

	/**
	 * Count the rows within the bounding box
	 *
	 * @param distinct distinct column values
	 * @param column count column name
	 * @param boundingBox bounding box
	 * @return count
	 * @since 4.0.0
	 */
	public count(distinct: boolean, column: string, boundingBox: BoundingBox): number {
		return count(distinct, column, boundingBox.buildEnvelope());
	}

	/**
	 * Query for features within the bounding box
	 *
	 * @param boundingBox bounding box
	 * @return feature results
	 * @since 3.4.0
	 */
	public queryFeatures(boundingBox: BoundingBox): FeatureResultSet {
		return queryFeatures(false, boundingBox);
	}

	/**
	 * Query for features within the bounding box
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @return feature results
	 * @since 4.0.0
	 */
	public queryFeatures(distinct: boolean, boundingBox: BoundingBox): FeatureResultSet {
		return queryFeatures(distinct, boundingBox.buildEnvelope());
	}

	/**
	 * Query for features within the bounding box
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @return feature results
	 * @since 3.5.0
	 */
	public queryFeatures(columns: string[], boundingBox: BoundingBox): FeatureResultSet {
		return queryFeatures(false, columns, boundingBox);
	}

	/**
	 * Query for features within the bounding box
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @return feature results
	 * @since 4.0.0
	 */
	public queryFeatures(distinct: boolean, columns: string[], boundingBox: BoundingBox): FeatureResultSet {
		return queryFeatures(distinct, columns, boundingBox.buildEnvelope());
	}

	/**
	 * Count the features within the bounding box
	 *
	 * @param boundingBox bounding box
	 * @return count
	 * @since 3.4.0
	 */
	public countFeatures(boundingBox: BoundingBox): number {
		return countFeatures(false, null, boundingBox);
	}

	/**
	 * Count the features within the bounding box
	 *
	 * @param column count column values
	 * @param boundingBox bounding box
	 * @return count
	 * @since 4.0.0
	 */
	public countFeatures(column: string, boundingBox: BoundingBox): number {
		return countFeatures(false, column, boundingBox);
	}

	/**
	 * Count the features within the bounding box
	 *
	 * @param distinct distinct column values
	 * @param column count column values
	 * @param boundingBox bounding box
	 * @return count
	 * @since 4.0.0
	 */
	public countFeatures(distinct: boolean, column: string, boundingBox: BoundingBox): number {
		return countFeatures(distinct, column, boundingBox.buildEnvelope());
	}

	/**
	 * Query for features within the bounding box
	 *
	 * @param boundingBox bounding box
	 * @param fieldValues field values
	 * @return feature results
	 * @since 3.4.0
	 */
	public queryFeatures(boundingBox: BoundingBox, fieldValues: ColumnValues): FeatureResultSet {
		return queryFeatures(false, boundingBox, fieldValues);
	}

	/**
	 * Query for features within the bounding box
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param fieldValues field values
	 * @return feature results
	 * @since 4.0.0
	 */
	public queryFeatures(distinct: boolean, boundingBox: BoundingBox, fieldValues: ColumnValues): FeatureResultSet {
		return queryFeatures(distinct, boundingBox.buildEnvelope(), fieldValues);
	}

	/**
	 * Query for features within the bounding box
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param fieldValues field values
	 * @return feature results
	 * @since 3.5.0
	 */
	public queryFeatures(columns: string[], boundingBox: BoundingBox, fieldValues: ColumnValues): FeatureResultSet {
		return queryFeatures(false, columns, boundingBox, fieldValues);
	}

	/**
	 * Query for features within the bounding box
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param fieldValues field values
	 * @return feature results
	 * @since 4.0.0
	 */
	public queryFeatures(distinct: boolean, columns: string[], boundingBox: BoundingBox, fieldValues: ColumnValues): FeatureResultSet {
		return queryFeatures(distinct, columns, boundingBox.buildEnvelope(), fieldValues);
	}

	/**
	 * Count the features within the bounding box
	 *
	 * @param boundingBox bounding box
	 * @param fieldValues field values
	 * @return count
	 * @since 3.4.0
	 */
	public countFeatures(boundingBox: BoundingBox, fieldValues: ColumnValues): number {
		return countFeatures(false, null, boundingBox, fieldValues);
	}

	/**
	 * Count the features within the bounding box
	 *
	 * @param column count column name
	 * @param boundingBox bounding box
	 * @param fieldValues field values
	 * @return count
	 * @since 4.0.0
	 */
	public countFeatures(column: string, boundingBox: BoundingBox, fieldValues: ColumnValues): number {
		return countFeatures(false, column, boundingBox, fieldValues);
	}

	/**
	 * Count the features within the bounding box
	 *
	 * @param distinct distinct column values
	 * @param column count column name
	 * @param boundingBox bounding box
	 * @param fieldValues field values
	 * @return count
	 * @since 4.0.0
	 */
	public countFeatures(distinct: boolean, column: string, boundingBox: BoundingBox, fieldValues: ColumnValues): number {
		return countFeatures(distinct, column, boundingBox.buildEnvelope(), fieldValues);
	}

	/**
	 * Query for features within the bounding box
	 *
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @return feature results
	 * @since 3.4.0
	 */
	public queryFeatures(boundingBox: BoundingBox, where: string): FeatureResultSet {
		return queryFeatures(false, boundingBox, where);
	}

	/**
	 * Query for features within the bounding box
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @return feature results
	 * @since 4.0.0
	 */
	public queryFeatures(distinct: boolean, boundingBox: BoundingBox, where: string): FeatureResultSet {
		return queryFeatures(distinct, boundingBox, where, null);
	}

	/**
	 * Query for features within the bounding box
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @return feature results
	 * @since 3.5.0
	 */
	public queryFeatures(columns: string[], boundingBox: BoundingBox, where: string): FeatureResultSet {
		return queryFeatures(false, columns, boundingBox, where);
	}

	/**
	 * Query for features within the bounding box
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @return feature results
	 * @since 4.0.0
	 */
	public queryFeatures(distinct: boolean, columns: string[], boundingBox: BoundingBox, where: string): FeatureResultSet {
		return queryFeatures(distinct, columns, boundingBox, where, null);
	}

	/**
	 * Count the features within the bounding box
	 *
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @return count
	 * @since 3.4.0
	 */
	public countFeatures(boundingBox: BoundingBox, where: string): number {
		return countFeatures(false, null, boundingBox, where);
	}

	/**
	 * Count the features within the bounding box
	 *
	 * @param column count column name
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @return count
	 * @since 4.0.0
	 */
	public countFeatures(column: string, boundingBox: BoundingBox, where: string): number {
		return countFeatures(false, column, boundingBox, where);
	}

	/**
	 * Count the features within the bounding box
	 *
	 * @param distinct distinct column values
	 * @param column count column name
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @return count
	 * @since 4.0.0
	 */
	public countFeatures(distinct: boolean, column: string, boundingBox: BoundingBox, where: string): number {
		return countFeatures(distinct, column, boundingBox, where, null);
	}

	/**
	 * Query for features within the bounding box
	 *
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @return feature results
	 * @since 3.4.0
	 */
	public queryFeatures(boundingBox: BoundingBox, where: string, whereArgs: string[]): FeatureResultSet {
		return queryFeatures(false, boundingBox, where, whereArgs);
	}

	/**
	 * Query for features within the bounding box
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @return feature results
	 * @since 4.0.0
	 */
	public queryFeatures(distinct: boolean, boundingBox: BoundingBox, where: string, whereArgs: string[]): FeatureResultSet {
		return queryFeatures(distinct, boundingBox.buildEnvelope(), where, whereArgs);
	}

	/**
	 * Query for features within the bounding box
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @return feature results
	 * @since 3.5.0
	 */
	public queryFeatures(columns: string[], boundingBox: BoundingBox, where: string, whereArgs: string[]): FeatureResultSet {
		return queryFeatures(false, columns, boundingBox, where, whereArgs);
	}

	/**
	 * Query for features within the bounding box
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @return feature results
	 * @since 4.0.0
	 */
	public queryFeatures(distinct: boolean, columns: string[], boundingBox: BoundingBox, where: string, whereArgs: string[]): FeatureResultSet {
		return queryFeatures(distinct, columns, boundingBox.buildEnvelope(), where, whereArgs);
	}

	/**
	 * Count the features within the bounding box
	 *
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @return count
	 * @since 3.4.0
	 */
	public countFeatures(boundingBox: BoundingBox, where: string, whereArgs: string[]): number {
		return countFeatures(false, null, boundingBox, where, whereArgs);
	}

	/**
	 * Count the features within the bounding box
	 *
	 * @param column count column name
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @return count
	 * @since 4.0.0
	 */
	public countFeatures(column: string, boundingBox: BoundingBox, where: string, whereArgs: string[]): number {
		return countFeatures(false, column, boundingBox, where, whereArgs);
	}

	/**
	 * Count the features within the bounding box
	 *
	 * @param distinct distinct column values
	 * @param column count column name
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @return count
	 * @since 4.0.0
	 */
	public countFeatures(distinct: boolean, column: string, boundingBox: BoundingBox, where: string, whereArgs: string[]): number {
		return countFeatures(distinct, column, boundingBox.buildEnvelope(), where, whereArgs);
	}

	/**
	 * Query for rows within the bounding box in the provided projection
	 *
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @return results
	 */
	public query(boundingBox: BoundingBox, projection: Projection): UserCustomResultSet {
		return query(false, boundingBox, projection);
	}

	/**
	 * Query for rows within the bounding box in the provided projection
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @return results
	 * @since 4.0.0
	 */
	public query(distinct: boolean, boundingBox: BoundingBox, projection: Projection): UserCustomResultSet {
		BoundingBox featureBoundingBox = projectBoundingBox(boundingBox, projection);
		return query(distinct, featureBoundingBox);
	}

	/**
	 * Query for rows within the bounding box in the provided projection
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @return results
	 * @since 3.5.0
	 */
	public query(columns: string[], boundingBox: BoundingBox, projection: Projection): UserCustomResultSet {
		return query(false, columns, boundingBox, projection);
	}

	/**
	 * Query for rows within the bounding box in the provided projection
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @return results
	 * @since 4.0.0
	 */
	public query(distinct: boolean, columns: string[], boundingBox: BoundingBox, projection: Projection): UserCustomResultSet {
		BoundingBox featureBoundingBox = projectBoundingBox(boundingBox, projection);
		return query(distinct, columns, featureBoundingBox);
	}

	/**
	 * Count the rows within the bounding box in the provided projection
	 *
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @return count
	 */
	public count(boundingBox: BoundingBox, projection: Projection): number {
		return count(false, null, boundingBox, projection);
	}

	/**
	 * Count the rows within the bounding box in the provided projection
	 *
	 * @param column count column name
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @return count
	 * @since 4.0.0
	 */
	public count(column: string, boundingBox: BoundingBox, projection: Projection): number {
		return count(false, column, boundingBox, projection);
	}

	/**
	 * Count the rows within the bounding box in the provided projection
	 *
	 * @param distinct distinct column values
	 * @param column count column name
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @return count
	 * @since 4.0.0
	 */
	public count(distinct: boolean, column: string, boundingBox: BoundingBox, projection: Projection): number {
		BoundingBox featureBoundingBox = projectBoundingBox(boundingBox, projection);
		return count(distinct, column, featureBoundingBox);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 *
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @return feature results
	 * @since 3.4.0
	 */
	public queryFeatures(boundingBox: BoundingBox, projection: Projection): FeatureResultSet {
		return queryFeatures(false, boundingBox, projection);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @return feature results
	 * @since 4.0.0
	 */
	public queryFeatures(distinct: boolean, boundingBox: BoundingBox, projection: Projection): FeatureResultSet {
		BoundingBox featureBoundingBox = projectBoundingBox(boundingBox, projection);
		return queryFeatures(distinct, featureBoundingBox);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @return feature results
	 * @since 3.5.0
	 */
	public queryFeatures(columns: string[], boundingBox: BoundingBox, projection: Projection): FeatureResultSet {
		return queryFeatures(false, columns, boundingBox, projection);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @return feature results
	 * @since 4.0.0
	 */
	public queryFeatures(distinct: boolean, columns: string[], boundingBox: BoundingBox, projection: Projection): FeatureResultSet {
		BoundingBox featureBoundingBox = projectBoundingBox(boundingBox, projection);
		return queryFeatures(distinct, columns, featureBoundingBox);
	}

	/**
	 * Count the features within the bounding box in the provided projection
	 *
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @return count
	 * @since 3.4.0
	 */
	public countFeatures(boundingBox: BoundingBox, projection: Projection): number {
		return countFeatures(false, null, boundingBox, projection);
	}

	/**
	 * Count the features within the bounding box in the provided projection
	 *
	 * @param column count column name
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @return count
	 * @since 4.0.0
	 */
	public countFeatures(column: string, boundingBox: BoundingBox, projection: Projection): number {
		return countFeatures(false, column, boundingBox, projection);
	}

	/**
	 * Count the features within the bounding box in the provided projection
	 *
	 * @param distinct distinct column values
	 * @param column count column name
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @return count
	 * @since 4.0.0
	 */
	public countFeatures(distinct: boolean, column: string, boundingBox: BoundingBox, projection: Projection): number {
		BoundingBox featureBoundingBox = projectBoundingBox(boundingBox, projection);
		return countFeatures(distinct, column, featureBoundingBox);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 *
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param fieldValues field values
	 * @return feature results
	 * @since 3.4.0
	 */
	public queryFeatures(boundingBox: BoundingBox, projection: Projection, fieldValues: ColumnValues): FeatureResultSet {
		return queryFeatures(false, boundingBox, projection, fieldValues);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param fieldValues field values
	 * @return feature results
	 * @since 4.0.0
	 */
	public queryFeatures(distinct: boolean, boundingBox: BoundingBox, projection: Projection, fieldValues: ColumnValues): FeatureResultSet {
		BoundingBox featureBoundingBox = projectBoundingBox(boundingBox, projection);
		return queryFeatures(distinct, featureBoundingBox, fieldValues);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param fieldValues field values
	 * @return feature results
	 * @since 3.5.0
	 */
	public queryFeatures(columns: string[], boundingBox: BoundingBox, projection: Projection, fieldValues: ColumnValues): FeatureResultSet {
		return queryFeatures(false, columns, boundingBox, projection, fieldValues);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param fieldValues field values
	 * @return feature results
	 * @since 4.0.0
	 */
	public queryFeatures(distinct: boolean, columns: string[], boundingBox: BoundingBox, projection: Projection, fieldValues: ColumnValues): FeatureResultSet {
		BoundingBox featureBoundingBox = projectBoundingBox(boundingBox, projection);
		return queryFeatures(distinct, columns, featureBoundingBox, fieldValues);
	}

	/**
	 * Count the features within the bounding box in the provided projection
	 *
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param fieldValues field values
	 * @return count
	 * @since 3.4.0
	 */
	public countFeatures(boundingBox: BoundingBox, projection: Projection, fieldValues: ColumnValues): number {
		return countFeatures(false, null, boundingBox, projection, fieldValues);
	}

	/**
	 * Count the features within the bounding box in the provided projection
	 *
	 * @param column count column name
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param fieldValues field values
	 * @return count
	 * @since 4.0.0
	 */
	public countFeatures(column: string, boundingBox: BoundingBox, projection: Projection, fieldValues: ColumnValues): number {
		return countFeatures(false, column, boundingBox, projection, fieldValues);
	}

	/**
	 * Count the features within the bounding box in the provided projection
	 *
	 * @param distinct distinct rows
	 * @param column count column name
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param fieldValues field values
	 * @return count
	 * @since 4.0.0
	 */
	public countFeatures(distinct: boolean, column: string, boundingBox: BoundingBox, projection: Projection, fieldValues: ColumnValues): number {
		BoundingBox featureBoundingBox = projectBoundingBox(boundingBox, projection);
		return countFeatures(distinct, column, featureBoundingBox, fieldValues);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 *
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @return feature results
	 * @since 3.4.0
	 */
	public queryFeatures(boundingBox: BoundingBox, projection: Projection, where: string): FeatureResultSet {
		return queryFeatures(false, boundingBox, projection, where);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @return feature results
	 * @since 4.0.0
	 */
	public queryFeatures(distinct: boolean, boundingBox: BoundingBox, projection: Projection, where: string): FeatureResultSet {
		return queryFeatures(distinct, boundingBox, projection, where, null);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @return feature results
	 * @since 3.5.0
	 */
	public queryFeatures(columns: string[], boundingBox: BoundingBox, projection: Projection, where: string): FeatureResultSet {
		return queryFeatures(false, columns, boundingBox, projection, where);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @return feature results
	 * @since 4.0.0
	 */
	public queryFeatures(distinct: boolean, columns: string[], boundingBox: BoundingBox, projection: Projection, where: string): FeatureResultSet {
		return queryFeatures(distinct, columns, boundingBox, projection, where, null);
	}

	/**
	 * Count the features within the bounding box in the provided projection
	 *
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @return count
	 * @since 3.4.0
	 */
	public countFeatures(boundingBox: BoundingBox, projection: Projection, where: string): number {
		return countFeatures(false, null, boundingBox, projection, where);
	}

	/**
	 * Count the features within the bounding box in the provided projection
	 *
	 * @param column count column name
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @return count
	 * @since 4.0.0
	 */
	public countFeatures(column: string, boundingBox: BoundingBox, projection: Projection, where: string): number {
		return countFeatures(false, column, boundingBox, projection, where);
	}

	/**
	 * Count the features within the bounding box in the provided projection
	 *
	 * @param distinct distinct column values
	 * @param column count column name
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @return count
	 * @since 4.0.0
	 */
	public countFeatures(distinct: boolean, column: string, boundingBox: BoundingBox, projection: Projection, where: string): number {
		return countFeatures(distinct, column, boundingBox, projection, where, null);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 *
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @return feature results
	 * @since 3.4.0
	 */
	public queryFeatures(boundingBox: BoundingBox, projection: Projection, where: string, whereArgs: string[]): FeatureResultSet {
		return queryFeatures(false, boundingBox, projection, where, whereArgs);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @return feature results
	 * @since 4.0.0
	 */
	public queryFeatures(distinct: boolean, boundingBox: BoundingBox, projection: Projection, where: string, whereArgs: string[]): FeatureResultSet {
		BoundingBox featureBoundingBox = projectBoundingBox(boundingBox, projection);
		return queryFeatures(distinct, featureBoundingBox, where, whereArgs);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @return feature results
	 * @since 3.5.0
	 */
	public queryFeatures(columns: string[], boundingBox: BoundingBox, projection: Projection, where: string, whereArgs: string[]): FeatureResultSet {
		return queryFeatures(false, columns, boundingBox, projection, where, whereArgs);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @return feature results
	 * @since 4.0.0
	 */
	public queryFeatures(distinct: boolean, columns: string[], boundingBox: BoundingBox, projection: Projection, where: string, whereArgs: string[]): FeatureResultSet {
		BoundingBox featureBoundingBox = projectBoundingBox(boundingBox, projection);
		return queryFeatures(distinct, columns, featureBoundingBox, where, whereArgs);
	}

	/**
	 * Count the features within the bounding box in the provided projection
	 *
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @return count
	 * @since 3.4.0
	 */
	public countFeatures(boundingBox: BoundingBox, projection: Projection, where: string, whereArgs: string[]): number {
		return countFeatures(false, null, boundingBox, projection, where, whereArgs);
	}

	/**
	 * Count the features within the bounding box in the provided projection
	 *
	 * @param column count column name
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @return count
	 * @since 4.0.0
	 */
	public countFeatures(column: string, boundingBox: BoundingBox, projection: Projection, where: string, whereArgs: string[]): number {
		return countFeatures(false, column, boundingBox, projection, where, whereArgs);
	}

	/**
	 * Count the features within the bounding box in the provided projection
	 *
	 * @param distinct distinct column values
	 * @param column count column name
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @return count
	 * @since 4.0.0
	 */
	public countFeatures(distinct: boolean, column: string, boundingBox: BoundingBox, projection: Projection, where: string, whereArgs: string[]): number {
		BoundingBox featureBoundingBox = projectBoundingBox(boundingBox, projection);
		return countFeatures(distinct, column, featureBoundingBox, where, whereArgs);
	}

	/**
	 * Query for rows within the geometry envelope
	 *
	 * @param envelope geometry envelope
	 * @return results
	 */
	public query(envelope: GeometryEnvelope): UserCustomResultSet {
		return query(false, envelope);
	}

	/**
	 * Query for rows within the geometry envelope
	 *
	 * @param distinct distinct rows
	 * @param envelope geometry envelope
	 * @return results
	 * @since 4.0.0
	 */
	public query(distinct: boolean, envelope: GeometryEnvelope): UserCustomResultSet {
		return query(distinct, envelope.getMinX(), envelope.getMinY(), envelope.getMaxX(), envelope.getMaxY());
	}

	/**
	 * Query for rows within the geometry envelope
	 *
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @return results
	 * @since 3.5.0
	 */
	public query(columns: string[], envelope: GeometryEnvelope): UserCustomResultSet {
		return query(false, columns, envelope);
	}

	/**
	 * Query for rows within the geometry envelope
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @return results
	 * @since 4.0.0
	 */
	public query(distinct: boolean, columns: string[], envelope: GeometryEnvelope): UserCustomResultSet {
		return query(distinct, columns, envelope.getMinX(), envelope.getMinY(), envelope.getMaxX(), envelope.getMaxY());
	}

	/**
	 * Count the rows within the geometry envelope
	 *
	 * @param envelope geometry envelope
	 * @return count
	 */
	public count(envelope: GeometryEnvelope): number {
		return count(false, null, envelope);
	}

	/**
	 * Count the rows within the geometry envelope
	 *
	 * @param column count column name
	 * @param envelope geometry envelope
	 * @return count
	 * @since 4.0.0
	 */
	public count(column: string, envelope: GeometryEnvelope): number {
		return count(false, column, envelope);
	}

	/**
	 * Count the rows within the geometry envelope
	 *
	 * @param distinct distinct column values
	 * @param column count column name
	 * @param envelope geometry envelope
	 * @return count
	 * @since 4.0.0
	 */
	public count(distinct: boolean, column: string, envelope: GeometryEnvelope): number {
		return count(distinct, column, envelope.getMinX(), envelope.getMinY(), envelope.getMaxX(), envelope.getMaxY());
	}

	/**
	 * Query for features within the geometry envelope
	 *
	 * @param envelope geometry envelope
	 * @return feature results
	 * @since 3.4.0
	 */
	public queryFeatures(envelope: GeometryEnvelope): FeatureResultSet {
		return queryFeatures(false, envelope);
	}

	/**
	 * Query for features within the geometry envelope
	 *
	 * @param distinct distinct rows
	 * @param envelope geometry envelope
	 * @return feature results
	 * @since 4.0.0
	 */
	public queryFeatures(distinct: boolean, envelope: GeometryEnvelope): FeatureResultSet {
		return queryFeatures(distinct, envelope.getMinX(), envelope.getMinY(), envelope.getMaxX(), envelope.getMaxY());
	}

	/**
	 * Query for features within the geometry envelope
	 *
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @return feature results
	 * @since 3.5.0
	 */
	public queryFeatures(columns: string[], envelope: GeometryEnvelope): FeatureResultSet {
		return queryFeatures(false, columns, envelope);
	}

	/**
	 * Query for features within the geometry envelope
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @return feature results
	 * @since 4.0.0
	 */
	public queryFeatures(distinct: boolean, columns: string[], envelope: GeometryEnvelope): FeatureResultSet {
		return queryFeatures(distinct, columns, envelope.getMinX(), envelope.getMinY(), envelope.getMaxX(), envelope.getMaxY());
	}

	/**
	 * Count the features within the geometry envelope
	 *
	 * @param envelope geometry envelope
	 * @return count
	 * @since 3.4.0
	 */
	public countFeatures(envelope: GeometryEnvelope): number {
		return countFeatures(false, null, envelope);
	}

	/**
	 * Count the features within the geometry envelope
	 *
	 * @param column count column name
	 * @param envelope geometry envelope
	 * @return count
	 * @since 4.0.0
	 */
	public countFeatures(column: string, envelope: GeometryEnvelope): number {
		return countFeatures(false, column, envelope);
	}

	/**
	 * Count the features within the geometry envelope
	 *
	 * @param distinct distinct column values
	 * @param column count column name
	 * @param envelope geometry envelope
	 * @return count
	 * @since 4.0.0
	 */
	public countFeatures(distinct: boolean, column: string, envelope: GeometryEnvelope): number {
		return countFeatures(distinct, column, envelope.getMinX(), envelope.getMinY(), envelope.getMaxX(), envelope.getMaxY());
	}

	/**
	 * Query for features within the geometry envelope
	 *
	 * @param envelope geometry envelope
	 * @param fieldValues field values
	 * @return feature results
	 * @since 3.4.0
	 */
	public queryFeatures(envelope: GeometryEnvelope, fieldValues: ColumnValues): FeatureResultSet {
		return queryFeatures(false, envelope, fieldValues);
	}

	/**
	 * Query for features within the geometry envelope
	 *
	 * @param distinct distinct rows
	 * @param envelope geometry envelope
	 * @param fieldValues field values
	 * @return feature results
	 * @since 4.0.0
	 */
	public queryFeatures(distinct: boolean, envelope: GeometryEnvelope, fieldValues: ColumnValues): FeatureResultSet {
		return queryFeatures(distinct, envelope.getMinX(), envelope.getMinY(), envelope.getMaxX(), envelope.getMaxY(), fieldValues);
	}

	/**
	 * Query for features within the geometry envelope
	 *
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param fieldValues field values
	 * @return feature results
	 * @since 3.5.0
	 */
	public queryFeatures(columns: string[], envelope: GeometryEnvelope, fieldValues: ColumnValues): FeatureResultSet {
		return queryFeatures(false, columns, envelope, fieldValues);
	}

	/**
	 * Query for features within the geometry envelope
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param fieldValues field values
	 * @return feature results
	 * @since 4.0.0
	 */
	public queryFeatures(distinct: boolean, columns: string[], envelope: GeometryEnvelope, fieldValues: ColumnValues): FeatureResultSet {
		return queryFeatures(distinct, columns, envelope.getMinX(), envelope.getMinY(), envelope.getMaxX(), envelope.getMaxY(), fieldValues);
	}

	/**
	 * Count the features within the geometry envelope
	 *
	 * @param envelope geometry envelope
	 * @param fieldValues field values
	 * @return count
	 * @since 3.4.0
	 */
	public countFeatures(envelope: GeometryEnvelope, fieldValues: ColumnValues): number {
		return countFeatures(false, null, envelope, fieldValues);
	}

	/**
	 * Count the features within the geometry envelope
	 *
	 * @param column count column name
	 * @param envelope geometry envelope
	 * @param fieldValues field values
	 * @return count
	 * @since 4.0.0
	 */
	public countFeatures(column: string, envelope: GeometryEnvelope, fieldValues: ColumnValues): number {
		return countFeatures(false, column, envelope, fieldValues);
	}

	/**
	 * Count the features within the geometry envelope
	 *
	 * @param distinct distinct column values
	 * @param column count column name
	 * @param envelope geometry envelope
	 * @param fieldValues field values
	 * @return count
	 * @since 4.0.0
	 */
	public countFeatures(distinct: boolean, column: string, envelope: GeometryEnvelope, fieldValues: ColumnValues): number {
		return countFeatures(distinct, column, envelope.getMinX(), envelope.getMinY(), envelope.getMaxX(), envelope.getMaxY(), fieldValues);
	}

	/**
	 * Query for features within the geometry envelope
	 *
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @return feature results
	 * @since 3.4.0
	 */
	public queryFeatures(envelope: GeometryEnvelope, where: string): FeatureResultSet {
		return queryFeatures(false, envelope, where);
	}

	/**
	 * Query for features within the geometry envelope
	 *
	 * @param distinct distinct rows
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @return feature results
	 * @since 4.0.0
	 */
	public queryFeatures(distinct: boolean, envelope: GeometryEnvelope, where: string): FeatureResultSet {
		return queryFeatures(distinct, envelope, where, null);
	}

	/**
	 * Query for features within the geometry envelope
	 *
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @return feature results
	 * @since 3.5.0
	 */
	public queryFeatures(columns: string[], envelope: GeometryEnvelope, where: string): FeatureResultSet {
		return queryFeatures(false, columns, envelope, where);
	}

	/**
	 * Query for features within the geometry envelope
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @return feature results
	 * @since 4.0.0
	 */
	public queryFeatures(distinct: boolean, columns: string[], envelope: GeometryEnvelope, where: string): FeatureResultSet {
		return queryFeatures(distinct, columns, envelope, where, null);
	}

	/**
	 * Count the features within the geometry envelope
	 *
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @return count
	 * @since 3.4.0
	 */
	public countFeatures(envelope: GeometryEnvelope, where: string): number {
		return countFeatures(false, null, envelope, where);
	}

	/**
	 * Count the features within the geometry envelope
	 *
	 * @param column count column name
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @return count
	 * @since 4.0.0
	 */
	public countFeatures(column: string, envelope: GeometryEnvelope, where: string): number {
		return countFeatures(false, column, envelope, where);
	}

	/**
	 * Count the features within the geometry envelope
	 *
	 * @param distinct distinct column values
	 * @param column count column name
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @return count
	 * @since 4.0.0
	 */
	public countFeatures(distinct: boolean, column: string, envelope: GeometryEnvelope, where: string): number {
		return countFeatures(distinct, column, envelope, where, null);
	}

	/**
	 * Query for features within the geometry envelope
	 *
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @return feature results
	 * @since 3.4.0
	 */
	public queryFeatures(envelope: GeometryEnvelope, where: string, whereArgs: string[]): FeatureResultSet {
		return queryFeatures(false, envelope, where, whereArgs);
	}

	/**
	 * Query for features within the geometry envelope
	 *
	 * @param distinct distinct rows
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @return feature results
	 * @since 4.0.0
	 */
	public queryFeatures(distinct: boolean, envelope: GeometryEnvelope, where: string, whereArgs: string[]): FeatureResultSet {
		return queryFeatures(distinct, envelope.getMinX(), envelope.getMinY(), envelope.getMaxX(), envelope.getMaxY(), where, whereArgs);
	}

	/**
	 * Query for features within the geometry envelope
	 *
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @return feature results
	 * @since 3.5.0
	 */
	public queryFeatures(columns: string[], envelope: GeometryEnvelope, where: string, whereArgs: string[]): FeatureResultSet {
		return queryFeatures(false, columns, envelope, where, whereArgs);
	}

	/**
	 * Query for features within the geometry envelope
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @return feature results
	 * @since 4.0.0
	 */
	public queryFeatures(distinct: boolean, columns: string[], envelope: GeometryEnvelope, where: string, whereArgs: string[]): FeatureResultSet {
		return queryFeatures(distinct, columns, envelope.getMinX(), envelope.getMinY(), envelope.getMaxX(), envelope.getMaxY(), where, whereArgs);
	}

	/**
	 * Count the features within the geometry envelope
	 *
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @return count
	 * @since 3.4.0
	 */
	public countFeatures(envelope: GeometryEnvelope, where: string, whereArgs: string[]): number {
		return countFeatures(false, null, envelope, where, whereArgs);
	}

	/**
	 * Count the features within the geometry envelope
	 *
	 * @param column count column name
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @return count
	 * @since 4.0.0
	 */
	public countFeatures(column: string, envelope: GeometryEnvelope, where: string, whereArgs: string[]): number {
		return countFeatures(false, column, envelope, where, whereArgs);
	}

	/**
	 * Count the features within the geometry envelope
	 *
	 * @param distinct distinct column values
	 * @param column count column name
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @return count
	 * @since 4.0.0
	 */
	public countFeatures(distinct: boolean, column: string, envelope: GeometryEnvelope, where: string, whereArgs: string[]): number {
		return countFeatures(distinct, column, envelope.getMinX(), envelope.getMinY(), envelope.getMaxX(), envelope.getMaxY(), where, whereArgs);
	}

	/**
	 * Query for rows within the bounds
	 *
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @return results
	 */
	public query(minX: number, minY: number, maxX: number, maxY: number): UserCustomResultSet {
		return query(false, minX, minY, maxX, maxY);
	}

	/**
	 * Query for rows within the bounds
	 *
	 * @param distinct distinct rows
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @return results
	 * @since 4.0.0
	 */
	public query(distinct: boolean, minX: number, minY: number, maxX: number, maxY: number): UserCustomResultSet {
		this.validateRTree();
		where: string = buildWhere(minX, minY, maxX, maxY);
		whereArgs: string[] = buildWhereArgs(minX, minY, maxX, maxY);
		return query(distinct, where, whereArgs);
	}

	/**
	 * Query for rows within the bounds
	 *
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @return results
	 * @since 3.5.0
	 */
	public query(columns: string[], minX: number, minY: number, maxX: number, maxY: number): UserCustomResultSet {
		return query(false, columns, minX, minY, maxX, maxY);
	}

	/**
	 * Query for rows within the bounds
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @return results
	 * @since 4.0.0
	 */
	public query(distinct: boolean, columns: string[], minX: number, minY: number, maxX: number, maxY: number): UserCustomResultSet {
		this.validateRTree();
		where: string = buildWhere(minX, minY, maxX, maxY);
		whereArgs: string[] = buildWhereArgs(minX, minY, maxX, maxY);
		return query(distinct, columns, where, whereArgs);
	}

	/**
	 * Count the rows within the bounds
	 *
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @return count
	 */
	public count(minX: number, minY: number, maxX: number, maxY: number): number {
		return count(false, null, minX, minY, maxX, maxY);
	}

	/**
	 * Count the rows within the bounds
	 *
	 * @param column count column name
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @return count
	 * @since 4.0.0
	 */
	public count(column: string, minX: number, minY: number, maxX: number, maxY: number): number {
		return count(false, column, minX, minY, maxX, maxY);
	}

	/**
	 * Count the rows within the bounds
	 *
	 * @param distinct distinct column values
	 * @param column count column name
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @return count
	 * @since 4.0.0
	 */
	public count(distinct: boolean, column: string, minX: number, minY: number, maxX: number, maxY: number): number {
		this.validateRTree();
		where: string = buildWhere(minX, minY, maxX, maxY);
		whereArgs: string[] = buildWhereArgs(minX, minY, maxX, maxY);
		return count(distinct, column, where, whereArgs);
	}

	/**
	 * Query for features within the bounds
	 *
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @return results
	 * @since 3.4.0
	 */
	public queryFeatures(minX: number, minY: number, maxX: number, maxY: number): FeatureResultSet {
		return queryFeatures(false, minX, minY, maxX, maxY);
	}

	/**
	 * Query for features within the bounds
	 *
	 * @param distinct distinct rows
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @return results
	 * @since 4.0.0
	 */
	public queryFeatures(distinct: boolean, minX: number, minY: number, maxX: number, maxY: number): FeatureResultSet {
		this.validateRTree();
		where: string = buildWhere(minX, minY, maxX, maxY);
		whereArgs: string[] = buildWhereArgs(minX, minY, maxX, maxY);
		return featureDao.queryIn(distinct, queryIdsSQL(where), whereArgs);
	}

	/**
	 * Query for features within the bounds
	 *
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @return results
	 * @since 3.5.0
	 */
	public queryFeatures(columns: string[], minX: number, minY: number, maxX: number, maxY: number): FeatureResultSet {
		return queryFeatures(false, columns, minX, minY, maxX, maxY);
	}

	/**
	 * Query for features within the bounds
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @return results
	 * @since 4.0.0
	 */
	public queryFeatures(distinct: boolean, columns: string[], minX: number, minY: number, maxX: number, maxY: number): FeatureResultSet {
		this.validateRTree();
		where: string = buildWhere(minX, minY, maxX, maxY);
		whereArgs: string[] = buildWhereArgs(minX, minY, maxX, maxY);
		return featureDao.queryIn(distinct, columns, queryIdsSQL(where), whereArgs);
	}

	/**
	 * Count the features within the bounds
	 *
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @return count
	 * @since 3.4.0
	 */
	public countFeatures(minX: number, minY: number, maxX: number, maxY: number): number {
		return countFeatures(false, null, minX, minY, maxX, maxY);
	}

	/**
	 * Count the features within the bounds
	 *
	 * @param column count column name
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @return count
	 * @since 4.0.0
	 */
	public countFeatures(column: string, minX: number, minY: number, maxX: number, maxY: number): number {
		return countFeatures(false, column, minX, minY, maxX, maxY);
	}

	/**
	 * Count the features within the bounds
	 *
	 * @param distinct distinct column values
	 * @param column count column name
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @return count
	 * @since 4.0.0
	 */
	public countFeatures(distinct: boolean, column: string, minX: number, minY: number, maxX: number, maxY: number): number {
		this.validateRTree();
		where: string = buildWhere(minX, minY, maxX, maxY);
		whereArgs: string[] = buildWhereArgs(minX, minY, maxX, maxY);
		return featureDao.countIn(distinct, column, queryIdsSQL(where), whereArgs);
	}

	/**
	 * Query for features within the bounds
	 *
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param fieldValues field values
	 * @return results
	 * @since 3.4.0
	 */
	public queryFeatures(minX: number, minY: number, maxX: number, maxY: number, fieldValues: ColumnValues): FeatureResultSet {
		return queryFeatures(false, minX, minY, maxX, maxY, fieldValues);
	}

	/**
	 * Query for features within the bounds
	 *
	 * @param distinct distinct rows
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param fieldValues field values
	 * @return results
	 * @since 4.0.0
	 */
	public queryFeatures(distinct: boolean, minX: number, minY: number, maxX: number, maxY: number, fieldValues: ColumnValues): FeatureResultSet {
		this.validateRTree();
		where: string = buildWhere(minX, minY, maxX, maxY);
		whereArgs: string[] = buildWhereArgs(minX, minY, maxX, maxY);
		return featureDao.queryIn(distinct, queryIdsSQL(where), whereArgs, fieldValues);
	}

	/**
	 * Query for features within the bounds
	 *
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param fieldValues field values
	 * @return results
	 * @since 3.5.0
	 */
	public queryFeatures(columns: string[], minX: number, minY: number, maxX: number, maxY: number, fieldValues: ColumnValues): FeatureResultSet {
		return queryFeatures(false, columns, minX, minY, maxX, maxY, fieldValues);
	}

	/**
	 * Query for features within the bounds
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param fieldValues field values
	 * @return results
	 * @since 4.0.0
	 */
	public queryFeatures(distinct: boolean, columns: string[], minX: number, minY: number, maxX: number, maxY: number, fieldValues: ColumnValues): FeatureResultSet {
		this.validateRTree();
		where: string = buildWhere(minX, minY, maxX, maxY);
		whereArgs: string[] = buildWhereArgs(minX, minY, maxX, maxY);
		return featureDao.queryIn(distinct, columns, queryIdsSQL(where), whereArgs, fieldValues);
	}

	/**
	 * Count the features within the bounds
	 *
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param fieldValues field values
	 * @return count
	 * @since 3.4.0
	 */
	public countFeatures(minX: number, minY: number, maxX: number, maxY: number, fieldValues: ColumnValues): number {
		return countFeatures(false, null, minX, minY, maxX, maxY, fieldValues);
	}

	/**
	 * Count the features within the bounds
	 *
	 * @param column count column name
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param fieldValues field values
	 * @return count
	 * @since 4.0.0
	 */
	public countFeatures(column: string, minX: number, minY: number, maxX: number, maxY: number, fieldValues: ColumnValues): number {
		return countFeatures(false, column, minX, minY, maxX, maxY, fieldValues);
	}

	/**
	 * Count the features within the bounds
	 *
	 * @param distinct distinct column values
	 * @param column count column name
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param fieldValues field values
	 * @return count
	 * @since 4.0.0
	 */
	public countFeatures(distinct: boolean, column: string, minX: number, minY: number, maxX: number, maxY: number, fieldValues: ColumnValues): number {
		this.validateRTree();
		where: string = buildWhere(minX, minY, maxX, maxY);
		whereArgs: string[] = buildWhereArgs(minX, minY, maxX, maxY);
		return featureDao.countIn(distinct, column, queryIdsSQL(where), whereArgs, fieldValues);
	}

	/**
	 * Query for features within the bounds
	 *
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @return results
	 * @since 3.4.0
	 */
	public queryFeatures(minX: number, minY: number, maxX: number, maxY: number, where: string): FeatureResultSet {
		return queryFeatures(false, minX, minY, maxX, maxY, where);
	}

	/**
	 * Query for features within the bounds
	 *
	 * @param distinct distinct rows
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @return results
	 * @since 4.0.0
	 */
	public queryFeatures(distinct: boolean, minX: number, minY: number, maxX: number, maxY: number, where: string): FeatureResultSet {
		return queryFeatures(distinct, minX, minY, maxX, maxY, where, null);
	}

	/**
	 * Query for features within the bounds
	 *
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @return results
	 * @since 3.5.0
	 */
	public queryFeatures(columns: string[], minX: number, minY: number, maxX: number, maxY: number, where: string): FeatureResultSet {
		return queryFeatures(false, columns, minX, minY, maxX, maxY, where);
	}

	/**
	 * Query for features within the bounds
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @return results
	 * @since 4.0.0
	 */
	public queryFeatures(distinct: boolean, columns: string[], minX: number, minY: number, maxX: number, maxY: number, where: string): FeatureResultSet {
		return queryFeatures(distinct, columns, minX, minY, maxX, maxY, where, null);
	}

	/**
	 * Count the features within the bounds
	 *
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @return count
	 * @since 3.4.0
	 */
	public countFeatures(minX: number, minY: number, maxX: number, maxY: number, where: string): number {
		return countFeatures(false, null, minX, minY, maxX, maxY, where);
	}

	/**
	 * Count the features within the bounds
	 *
	 * @param column count column name
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @return count
	 * @since 4.0.0
	 */
	public countFeatures(column: string, minX: number, minY: number, maxX: number, maxY: number, where: string): number {
		return countFeatures(false, column, minX, minY, maxX, maxY, where);
	}

	/**
	 * Count the features within the bounds
	 *
	 * @param distinct distinct column values
	 * @param column count column name
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @return count
	 * @since 4.0.0
	 */
	public countFeatures(distinct: boolean, column: string, minX: number, minY: number, maxX: number, maxY: number, where: string): number {
		return countFeatures(distinct, column, minX, minY, maxX, maxY, where, null);
	}

	/**
	 * Query for features within the bounds
	 *
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @return results
	 * @since 3.4.0
	 */
	public queryFeatures(minX: number, minY: number, maxX: number, maxY: number, where: string, whereArgs: string[]): FeatureResultSet {
		return queryFeatures(false, minX, minY, maxX, maxY, where, whereArgs);
	}

	/**
	 * Query for features within the bounds
	 *
	 * @param distinct distinct rows
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @return results
	 * @since 4.0.0
	 */
	public queryFeatures(distinct: boolean, minX: number, minY: number, maxX: number, maxY: number, where: string, whereArgs: string[]): FeatureResultSet {
		this.validateRTree();
		whereBounds: string = buildWhere(minX, minY, maxX, maxY);
		whereBoundsArgs: string[] = buildWhereArgs(minX, minY, maxX, maxY);
		return featureDao.queryIn(distinct, queryIdsSQL(whereBounds), whereBoundsArgs, where, whereArgs);
	}

	/**
	 * Query for features within the bounds
	 *
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @return results
	 * @since 3.5.0
	 */
	public queryFeatures(columns: string[], minX: number, minY: number, maxX: number, maxY: number, where: string, whereArgs: string[]): FeatureResultSet {
		return queryFeatures(false, columns, minX, minY, maxX, maxY, where, whereArgs);
	}

	/**
	 * Query for features within the bounds
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @return results
	 * @since 4.0.0
	 */
	public queryFeatures(distinct: boolean, columns: string[], minX: number, minY: number, maxX: number, maxY: number, where: string, whereArgs: string[]): FeatureResultSet {
		this.validateRTree();
		whereBounds: string = buildWhere(minX, minY, maxX, maxY);
		whereBoundsArgs: string[] = buildWhereArgs(minX, minY, maxX, maxY);
		return featureDao.queryIn(distinct, columns, queryIdsSQL(whereBounds), whereBoundsArgs, where, whereArgs);
	}

	/**
	 * Count the features within the bounds
	 *
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @return count
	 * @since 3.4.0
	 */
	public countFeatures(minX: number, minY: number, maxX: number, maxY: number, where: string, whereArgs: string[]): number {
		return countFeatures(false, null, minX, minY, maxX, maxY, where, whereArgs);
	}

	/**
	 * Count the features within the bounds
	 *
	 * @param column count column name
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @return count
	 * @since 4.0.0
	 */
	public countFeatures(column: string, minX: number, minY: number, maxX: number, maxY: number, where: string, whereArgs: string[]): number {
		return countFeatures(false, column, minX, minY, maxX, maxY, where, whereArgs);
	}

	/**
	 * Count the features within the bounds
	 *
	 * @param distinct distinct column values
	 * @param column count column name
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @return count
	 * @since 4.0.0
	 */
	public countFeatures(distinct: boolean, column: string, minX: number, minY: number, maxX: number, maxY: number, where: string, whereArgs: string[]): number {
		this.validateRTree();
		whereBounds: string = buildWhere(minX, minY, maxX, maxY);
		whereBoundsArgs: string[] = buildWhereArgs(minX, minY, maxX, maxY);
		return featureDao.countIn(distinct, column, queryIdsSQL(whereBounds), whereBoundsArgs, where, whereArgs);
	}

	/**
	 * Query for all features ordered by id, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(limit: number): FeatureResultSet {
		return queryFeaturesForChunk(getPkColumnName(), limit);
	}

	/**
	 * Query for all features ordered by id, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(getPkColumnName(), limit, offset);
	}

	/**
	 * Query for all features, starting at the offset and returning no more than
	 * the limit
	 *
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(orderBy: string, limit: number): FeatureResultSet {
		this.validateRTree();
		return featureDao.queryInForChunk(queryIdsSQL(), orderBy, limit);
	}

	/**
	 * Query for all features, starting at the offset and returning no more than
	 * the limit
	 *
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(orderBy: string, limit: number, offset: number): FeatureResultSet {
		this.validateRTree();
		return featureDao.queryInForChunk(queryIdsSQL(), orderBy, limit, offset);
	}

	/**
	 * Query for all features ordered by id, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, getPkColumnName(), limit);
	}

	/**
	 * Query for all features ordered by id, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for all features, starting at the offset and returning no more than
	 * the limit
	 *
	 * @param distinct distinct rows
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, orderBy: string, limit: number): FeatureResultSet {
		this.validateRTree();
		return featureDao.queryInForChunk(distinct, queryIdsSQL(), orderBy, limit);
	}

	/**
	 * Query for all features, starting at the offset and returning no more than
	 * the limit
	 *
	 * @param distinct distinct rows
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, orderBy: string, limit: number, offset: number): FeatureResultSet {
		this.validateRTree();
		return featureDao.queryInForChunk(distinct, queryIdsSQL(), orderBy, limit, offset);
	}

	/**
	 * Query for all features ordered by id, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param columns columns
	 * @param limit chunk limit
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], limit: number): FeatureResultSet {
		return queryFeaturesForChunk(columns, getPkColumnName(), limit);
	}

	/**
	 * Query for all features ordered by id, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param columns columns
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(columns, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for all features, starting at the offset and returning no more than
	 * the limit
	 *
	 * @param columns columns
	 * @param orderBy order by
	 * @param limit chunk limit
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], orderBy: string, limit: number): FeatureResultSet {
		this.validateRTree();
		return featureDao.queryInForChunk(columns, queryIdsSQL(), orderBy, limit);
	}

	/**
	 * Query for all features, starting at the offset and returning no more than
	 * the limit
	 *
	 * @param columns columns
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], orderBy: string, limit: number, offset: number): FeatureResultSet {
		this.validateRTree();
		return featureDao.queryInForChunk(columns, queryIdsSQL(), orderBy, limit, offset);
	}

	/**
	 * Query for all features ordered by id, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param limit chunk limit
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, getPkColumnName(), limit);
	}

	/**
	 * Query for all features ordered by id, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for all features, starting at the offset and returning no more than
	 * the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param orderBy order by
	 * @param limit chunk limit
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], orderBy: string, limit: number): FeatureResultSet {
		this.validateRTree();
		return featureDao.queryInForChunk(distinct, columns, queryIdsSQL(), orderBy, limit);
	}

	/**
	 * Query for all features, starting at the offset and returning no more than
	 * the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], orderBy: string, limit: number, offset: number): FeatureResultSet {
		this.validateRTree();
		return featureDao.queryInForChunk(distinct, columns, queryIdsSQL(), orderBy, limit, offset);
	}

	/**
	 * Query for features ordered by id, starting at the offset and returning no
	 * more than the limit
	 *
	 * @param fieldValues field values
	 * @param limit chunk limit
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public FeatureResultSet queryFeaturesForChunk(
			fieldValues: ColumnValues, limit: number) {
		return queryFeaturesForChunk(fieldValues, getPkColumnName(), limit);
	}

	/**
	 * Query for features ordered by id, starting at the offset and returning no
	 * more than the limit
	 *
	 * @param fieldValues field values
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public FeatureResultSet queryFeaturesForChunk(
			fieldValues: ColumnValues, limit: number, offset: number) {
		return queryFeaturesForChunk(fieldValues, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param fieldValues field values
	 * @param orderBy order by
	 * @param limit chunk limit
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public FeatureResultSet queryFeaturesForChunk(
			fieldValues: ColumnValues, orderBy: string, limit: number) {
		this.validateRTree();
		return featureDao.queryInForChunk(queryIdsSQL(), fieldValues, orderBy, limit);
	}

	/**
	 * Query for features, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param fieldValues field values
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public FeatureResultSet queryFeaturesForChunk(
			fieldValues: ColumnValues, orderBy: string, limit: number, offset: number) {
		this.validateRTree();
		return featureDao.queryInForChunk(queryIdsSQL(), fieldValues, orderBy, limit, offset);
	}

	/**
	 * Query for features ordered by id, starting at the offset and returning no
	 * more than the limit
	 *
	 * @param distinct distinct rows
	 * @param fieldValues field values
	 * @param limit chunk limit
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, fieldValues: ColumnValues, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, fieldValues, getPkColumnName(), limit);
	}

	/**
	 * Query for features ordered by id, starting at the offset and returning no
	 * more than the limit
	 *
	 * @param distinct distinct rows
	 * @param fieldValues field values
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, fieldValues: ColumnValues, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, fieldValues, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param distinct distinct rows
	 * @param fieldValues field values
	 * @param orderBy order by
	 * @param limit chunk limit
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, fieldValues: ColumnValues, orderBy: string, limit: number): FeatureResultSet {
		this.validateRTree();
		return featureDao.queryInForChunk(distinct, queryIdsSQL(), fieldValues, orderBy, limit);
	}

	/**
	 * Query for features, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param distinct distinct rows
	 * @param fieldValues field values
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, fieldValues: ColumnValues, orderBy: string, limit: number, offset: number): FeatureResultSet {
		this.validateRTree();
		return featureDao.queryInForChunk(distinct, queryIdsSQL(), fieldValues, orderBy, limit, offset);
	}

	/**
	 * Query for features ordered by id, starting at the offset and returning no
	 * more than the limit
	 *
	 * @param columns columns
	 * @param fieldValues field values
	 * @param limit chunk limit
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], fieldValues: ColumnValues, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(columns, fieldValues, getPkColumnName(), limit);
	}

	/**
	 * Query for features ordered by id, starting at the offset and returning no
	 * more than the limit
	 *
	 * @param columns columns
	 * @param fieldValues field values
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], fieldValues: ColumnValues, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(columns, fieldValues, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param columns columns
	 * @param fieldValues field values
	 * @param orderBy order by
	 * @param limit chunk limit
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], fieldValues: ColumnValues, orderBy: string, limit: number): FeatureResultSet {
		this.validateRTree();
		return featureDao.queryInForChunk(columns, queryIdsSQL(), fieldValues, orderBy, limit);
	}

	/**
	 * Query for features, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param columns columns
	 * @param fieldValues field values
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], fieldValues: ColumnValues, orderBy: string, limit: number, offset: number): FeatureResultSet {
		this.validateRTree();
		return featureDao.queryInForChunk(columns, queryIdsSQL(), fieldValues, orderBy, limit, offset);
	}

	/**
	 * Query for features ordered by id, starting at the offset and returning no
	 * more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param fieldValues field values
	 * @param limit chunk limit
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], fieldValues: ColumnValues, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, fieldValues, getPkColumnName(), limit);
	}

	/**
	 * Query for features ordered by id, starting at the offset and returning no
	 * more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param fieldValues field values
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], fieldValues: ColumnValues, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, fieldValues, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param fieldValues field values
	 * @param orderBy order by
	 * @param limit chunk limit
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], fieldValues: ColumnValues, orderBy: string, limit: number): FeatureResultSet {
		this.validateRTree();
		return featureDao.queryInForChunk(distinct, columns, queryIdsSQL(), fieldValues, orderBy, limit);
	}

	/**
	 * Query for features, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param fieldValues field values
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], fieldValues: ColumnValues, orderBy: string, limit: number, offset: number): FeatureResultSet {
		this.validateRTree();
		return featureDao.queryInForChunk(distinct, columns, queryIdsSQL(), fieldValues, orderBy, limit, offset);
	}

	/**
	 * Query for features ordered by id, starting at the offset and returning no
	 * more than the limit
	 *
	 * @param where where clause
	 * @param limit chunk limit
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunkIdOrder(where: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(where, getPkColumnName(), limit);
	}

	/**
	 * Query for features ordered by id, starting at the offset and returning no
	 * more than the limit
	 *
	 * @param where where clause
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunkIdOrder(where: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(where, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param where where clause
	 * @param orderBy order by
	 * @param limit chunk limit
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(where: string, orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(false, where, orderBy, limit);
	}

	/**
	 * Query for features, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param where where clause
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(where: string, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(false, where, orderBy, limit, offset);
	}

	/**
	 * Query for features ordered by id, starting at the offset and returning no
	 * more than the limit
	 *
	 * @param distinct distinct rows
	 * @param where where clause
	 * @param limit chunk limit
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunkIdOrder(distinct: boolean, where: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, where, getPkColumnName(), limit);
	}

	/**
	 * Query for features ordered by id, starting at the offset and returning no
	 * more than the limit
	 *
	 * @param distinct distinct rows
	 * @param where where clause
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunkIdOrder(distinct: boolean, where: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, where, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param distinct distinct rows
	 * @param where where clause
	 * @param orderBy order by
	 * @param limit chunk limit
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, where: string, orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, where, null, orderBy, limit);
	}

	/**
	 * Query for features, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param distinct distinct rows
	 * @param where where clause
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, where: string, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, where, null, orderBy, limit, offset);
	}

	/**
	 * Query for features ordered by id, starting at the offset and returning no
	 * more than the limit
	 *
	 * @param columns columns
	 * @param where where clause
	 * @param limit chunk limit
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunkIdOrder(columns: string[], where: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(columns, where, getPkColumnName(), limit);
	}

	/**
	 * Query for features ordered by id, starting at the offset and returning no
	 * more than the limit
	 *
	 * @param columns columns
	 * @param where where clause
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunkIdOrder(columns: string[], where: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(columns, where, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param columns columns
	 * @param where where clause
	 * @param orderBy order by
	 * @param limit chunk limit
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], where: string, orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(false, columns, where, orderBy, limit);
	}

	/**
	 * Query for features, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param columns columns
	 * @param where where clause
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], where: string, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(false, columns, where, orderBy, limit, offset);
	}

	/**
	 * Query for features ordered by id, starting at the offset and returning no
	 * more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param where where clause
	 * @param limit chunk limit
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunkIdOrder(distinct: boolean, columns: string[], where: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, where, getPkColumnName(), limit);
	}

	/**
	 * Query for features ordered by id, starting at the offset and returning no
	 * more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param where where clause
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunkIdOrder(distinct: boolean, columns: string[], where: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, where, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param where where clause
	 * @param orderBy order by
	 * @param limit chunk limit
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], where: string, orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, where, null, orderBy, limit);
	}

	/**
	 * Query for features, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param where where clause
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], where: string, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, where, null, orderBy, limit, offset);
	}

	/**
	 * Query for features ordered by id, starting at the offset and returning no
	 * more than the limit
	 *
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param limit chunk limit
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(where: string, whereArgs: string[], limit: number): FeatureResultSet {
		return queryFeaturesForChunk(where, whereArgs, getPkColumnName(), limit);
	}

	/**
	 * Query for features ordered by id, starting at the offset and returning no
	 * more than the limit
	 *
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(where: string, whereArgs: string[], limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(where, whereArgs, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(where: string, whereArgs: string[], orderBy: string, limit: number): FeatureResultSet {
		this.validateRTree();
		return featureDao.queryInForChunk(queryIdsSQL(), where, whereArgs, orderBy, limit);
	}

	/**
	 * Query for features, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(where: string, whereArgs: string[], orderBy: string, limit: number, offset: number): FeatureResultSet {
		this.validateRTree();
		return featureDao.queryInForChunk(queryIdsSQL(), where, whereArgs, orderBy, limit, offset);
	}

	/**
	 * Query for features ordered by id, starting at the offset and returning no
	 * more than the limit
	 *
	 * @param distinct distinct rows
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param limit chunk limit
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, where: string, whereArgs: string[], limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, where, whereArgs, getPkColumnName(), limit);
	}

	/**
	 * Query for features ordered by id, starting at the offset and returning no
	 * more than the limit
	 *
	 * @param distinct distinct rows
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, where: string, whereArgs: string[], limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, where, whereArgs, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param distinct distinct rows
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, where: string, whereArgs: string[], orderBy: string, limit: number): FeatureResultSet {
		this.validateRTree();
		return featureDao.queryInForChunk(distinct, queryIdsSQL(), where, whereArgs, orderBy, limit);
	}

	/**
	 * Query for features, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param distinct distinct rows
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, where: string, whereArgs: string[], orderBy: string, limit: number, offset: number): FeatureResultSet {
		this.validateRTree();
		return featureDao.queryInForChunk(distinct, queryIdsSQL(), where, whereArgs, orderBy, limit, offset);
	}

	/**
	 * Query for features ordered by id, starting at the offset and returning no
	 * more than the limit
	 *
	 * @param columns columns
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param limit chunk limit
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], where: string, whereArgs: string[], limit: number): FeatureResultSet {
		return queryFeaturesForChunk(columns, where, whereArgs, getPkColumnName(), limit);
	}

	/**
	 * Query for features ordered by id, starting at the offset and returning no
	 * more than the limit
	 *
	 * @param columns columns
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], where: string, whereArgs: string[], limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(columns, where, whereArgs, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param columns columns
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], where: string, whereArgs: string[], orderBy: string, limit: number): FeatureResultSet {
		this.validateRTree();
		return featureDao.queryInForChunk(columns, queryIdsSQL(), where, whereArgs, orderBy, limit);
	}

	/**
	 * Query for features, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param columns columns
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], where: string, whereArgs: string[], orderBy: string, limit: number, offset: number): FeatureResultSet {
		this.validateRTree();
		return featureDao.queryInForChunk(columns, queryIdsSQL(), where, whereArgs, orderBy, limit, offset);
	}

	/**
	 * Query for features ordered by id, starting at the offset and returning no
	 * more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param limit chunk limit
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], where: string, whereArgs: string[], limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, where, whereArgs, getPkColumnName(), limit);
	}

	/**
	 * Query for features ordered by id, starting at the offset and returning no
	 * more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], where: string, whereArgs: string[], limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, where, whereArgs, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], where: string, whereArgs: string[], orderBy: string, limit: number): FeatureResultSet {
		this.validateRTree();
		return featureDao.queryInForChunk(distinct, columns, queryIdsSQL(), where, whereArgs, orderBy, limit);
	}

	/**
	 * Query for features, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 *
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], where: string, whereArgs: string[], orderBy: string, limit: number, offset: number): FeatureResultSet {
		this.validateRTree();
		return featureDao.queryInForChunk(distinct, columns, queryIdsSQL(), where, whereArgs, orderBy, limit, offset);
	}

	/**
	 * Query for rows within the bounding box ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param boundingBox bounding box
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(boundingBox: BoundingBox, limit: number): UserCustomResultSet {
		return queryForChunk(boundingBox, getPkColumnName(), limit);
	}

	/**
	 * Query for rows within the bounding box ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param boundingBox bounding box
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(boundingBox: BoundingBox, limit: number, offset: number): UserCustomResultSet {
		return queryForChunk(boundingBox, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for rows within the bounding box, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param boundingBox bounding box
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(boundingBox: BoundingBox, orderBy: string, limit: number): UserCustomResultSet {
		return queryForChunk(false, boundingBox, orderBy, limit);
	}

	/**
	 * Query for rows within the bounding box, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param boundingBox bounding box
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(boundingBox: BoundingBox, orderBy: string, limit: number, offset: number): UserCustomResultSet {
		return queryForChunk(false, boundingBox, orderBy, limit, offset);
	}

	/**
	 * Query for rows within the bounding box ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(distinct: boolean, boundingBox: BoundingBox, limit: number): UserCustomResultSet {
		return queryForChunk(distinct, boundingBox, getPkColumnName(), limit);
	}

	/**
	 * Query for rows within the bounding box ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(distinct: boolean, boundingBox: BoundingBox, limit: number, offset: number): UserCustomResultSet {
		return queryForChunk(distinct, boundingBox, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for rows within the bounding box, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(distinct: boolean, boundingBox: BoundingBox, orderBy: string, limit: number): UserCustomResultSet {
		return queryForChunk(distinct, boundingBox.buildEnvelope(), orderBy, limit);
	}

	/**
	 * Query for rows within the bounding box, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(distinct: boolean, boundingBox: BoundingBox, orderBy: string, limit: number, offset: number): UserCustomResultSet {
		return queryForChunk(distinct, boundingBox.buildEnvelope(), orderBy, limit, offset);
	}

	/**
	 * Query for rows within the bounding box ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(columns: string[], boundingBox: BoundingBox, limit: number): UserCustomResultSet {
		return queryForChunk(columns, boundingBox, getPkColumnName(), limit);
	}

	/**
	 * Query for rows within the bounding box ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(columns: string[], boundingBox: BoundingBox, limit: number, offset: number): UserCustomResultSet {
		return queryForChunk(columns, boundingBox, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for rows within the bounding box, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(columns: string[], boundingBox: BoundingBox, orderBy: string, limit: number): UserCustomResultSet {
		return queryForChunk(false, columns, boundingBox, orderBy, limit);
	}

	/**
	 * Query for rows within the bounding box, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(columns: string[], boundingBox: BoundingBox, orderBy: string, limit: number, offset: number): UserCustomResultSet {
		return queryForChunk(false, columns, boundingBox, orderBy, limit, offset);
	}

	/**
	 * Query for rows within the bounding box ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(distinct: boolean, columns: string[], boundingBox: BoundingBox, limit: number): UserCustomResultSet {
		return queryForChunk(distinct, columns, boundingBox, getPkColumnName(), limit);
	}

	/**
	 * Query for rows within the bounding box ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(distinct: boolean, columns: string[], boundingBox: BoundingBox, limit: number, offset: number): UserCustomResultSet {
		return queryForChunk(distinct, columns, boundingBox, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for rows within the bounding box, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(distinct: boolean, columns: string[], boundingBox: BoundingBox, orderBy: string, limit: number): UserCustomResultSet {
		return queryForChunk(distinct, columns, boundingBox.buildEnvelope(), orderBy, limit);
	}

	/**
	 * Query for rows within the bounding box, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(distinct: boolean, columns: string[], boundingBox: BoundingBox, orderBy: string, limit: number, offset: number): UserCustomResultSet {
		return queryForChunk(distinct, columns, boundingBox.buildEnvelope(), orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounding box ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param boundingBox bounding box
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(boundingBox: BoundingBox, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(boundingBox, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounding box ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param boundingBox bounding box
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(boundingBox: BoundingBox, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(boundingBox, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounding box, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param boundingBox bounding box
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(boundingBox: BoundingBox, orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(false, boundingBox, orderBy, limit);
	}

	/**
	 * Query for features within the bounding box, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param boundingBox bounding box
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(boundingBox: BoundingBox, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(false, boundingBox, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounding box ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, boundingBox: BoundingBox, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, boundingBox, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounding box ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, boundingBox: BoundingBox, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, boundingBox, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounding box, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, boundingBox: BoundingBox, orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, boundingBox.buildEnvelope(), orderBy, limit);
	}

	/**
	 * Query for features within the bounding box, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, boundingBox: BoundingBox, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, boundingBox.buildEnvelope(), orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounding box ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], boundingBox: BoundingBox, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(columns, boundingBox, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounding box ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], boundingBox: BoundingBox, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(columns, boundingBox, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounding box, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], boundingBox: BoundingBox, orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(false, columns, boundingBox, orderBy, limit);
	}

	/**
	 * Query for features within the bounding box, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], boundingBox: BoundingBox, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(false, columns, boundingBox, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounding box ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], boundingBox: BoundingBox, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, boundingBox, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounding box ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], boundingBox: BoundingBox, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, boundingBox, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounding box, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], boundingBox: BoundingBox, orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, boundingBox.buildEnvelope(), orderBy, limit);
	}

	/**
	 * Query for features within the bounding box, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], boundingBox: BoundingBox, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, boundingBox.buildEnvelope(), orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounding box ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param boundingBox bounding box
	 * @param fieldValues field values
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(boundingBox: BoundingBox, fieldValues: ColumnValues, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(boundingBox, fieldValues, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounding box ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param boundingBox bounding box
	 * @param fieldValues field values
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(boundingBox: BoundingBox, fieldValues: ColumnValues, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(boundingBox, fieldValues, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounding box, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param boundingBox bounding box
	 * @param fieldValues field values
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(boundingBox: BoundingBox, fieldValues: ColumnValues, orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(false, boundingBox, fieldValues, orderBy, limit);
	}

	/**
	 * Query for features within the bounding box, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param boundingBox bounding box
	 * @param fieldValues field values
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(boundingBox: BoundingBox, fieldValues: ColumnValues, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(false, boundingBox, fieldValues, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounding box ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param fieldValues field values
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, boundingBox: BoundingBox, fieldValues: ColumnValues, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, boundingBox, fieldValues, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounding box ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param fieldValues field values
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, boundingBox: BoundingBox, fieldValues: ColumnValues, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, boundingBox, fieldValues, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounding box, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param fieldValues field values
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, boundingBox: BoundingBox, fieldValues: ColumnValues, orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, boundingBox.buildEnvelope(), fieldValues, orderBy, limit);
	}

	/**
	 * Query for features within the bounding box, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param fieldValues field values
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, boundingBox: BoundingBox, fieldValues: ColumnValues, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, boundingBox.buildEnvelope(), fieldValues, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounding box ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param fieldValues field values
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], boundingBox: BoundingBox, fieldValues: ColumnValues, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(columns, boundingBox, fieldValues, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounding box ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param fieldValues field values
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], boundingBox: BoundingBox, fieldValues: ColumnValues, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(columns, boundingBox, fieldValues, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounding box, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param fieldValues field values
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], boundingBox: BoundingBox, fieldValues: ColumnValues, orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(false, columns, boundingBox, fieldValues, orderBy, limit);
	}

	/**
	 * Query for features within the bounding box, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param fieldValues field values
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], boundingBox: BoundingBox, fieldValues: ColumnValues, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(false, columns, boundingBox, fieldValues, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounding box ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param fieldValues field values
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], boundingBox: BoundingBox, fieldValues: ColumnValues, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, boundingBox, fieldValues, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounding box ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param fieldValues field values
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], boundingBox: BoundingBox, fieldValues: ColumnValues, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, boundingBox, fieldValues, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounding box, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param fieldValues field values
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], boundingBox: BoundingBox, fieldValues: ColumnValues, orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, boundingBox.buildEnvelope(), fieldValues, orderBy, limit);
	}

	/**
	 * Query for features within the bounding box, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param fieldValues field values
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], boundingBox: BoundingBox, fieldValues: ColumnValues, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, boundingBox.buildEnvelope(), fieldValues, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounding box ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public FeatureResultSet queryFeaturesForChunkIdOrder(
			boundingBox: BoundingBox, where: string, limit: number) {
		return queryFeaturesForChunk(boundingBox, where, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounding box ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public FeatureResultSet queryFeaturesForChunkIdOrder(
			boundingBox: BoundingBox, where: string, limit: number, offset: number) {
		return queryFeaturesForChunk(boundingBox, where, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounding box, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(boundingBox: BoundingBox, where: string, orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(false, boundingBox, where, orderBy, limit);
	}

	/**
	 * Query for features within the bounding box, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(boundingBox: BoundingBox, where: string, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(false, boundingBox, where, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounding box ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunkIdOrder(distinct: boolean, boundingBox: BoundingBox, where: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, boundingBox, where, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounding box ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunkIdOrder(distinct: boolean, boundingBox: BoundingBox, where: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, boundingBox, where, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounding box, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, boundingBox: BoundingBox, where: string, orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, boundingBox, where, null, orderBy, limit);
	}

	/**
	 * Query for features within the bounding box, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, boundingBox: BoundingBox, where: string, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, boundingBox, where, null, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounding box ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunkIdOrder(columns: string[], boundingBox: BoundingBox, where: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(columns, boundingBox, where, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounding box ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunkIdOrder(columns: string[], boundingBox: BoundingBox, where: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(columns, boundingBox, where, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounding box, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], boundingBox: BoundingBox, where: string, orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(false, columns, boundingBox, where, orderBy, limit);
	}

	/**
	 * Query for features within the bounding box, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], boundingBox: BoundingBox, where: string, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(false, columns, boundingBox, where, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounding box ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunkIdOrder(distinct: boolean, columns: string[], boundingBox: BoundingBox, where: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, boundingBox, where, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounding box ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunkIdOrder(distinct: boolean, columns: string[], boundingBox: BoundingBox, where: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, boundingBox, where, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounding box, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], boundingBox: BoundingBox, where: string, orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, boundingBox, where, null, orderBy, limit);
	}

	/**
	 * Query for features within the bounding box, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], boundingBox: BoundingBox, where: string, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, boundingBox, where, null, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounding box ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(boundingBox: BoundingBox, where: string, whereArgs: string[], limit: number): FeatureResultSet {
		return queryFeaturesForChunk(boundingBox, where, whereArgs, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounding box ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(boundingBox: BoundingBox, where: string, whereArgs: string[], limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(boundingBox, where, whereArgs, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounding box, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(boundingBox: BoundingBox, where: string, whereArgs: string[], orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(false, boundingBox, where, whereArgs, orderBy, limit);
	}

	/**
	 * Query for features within the bounding box, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(boundingBox: BoundingBox, where: string, whereArgs: string[], orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(false, boundingBox, where, whereArgs, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounding box ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, boundingBox: BoundingBox, where: string, whereArgs: string[], limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, boundingBox, where, whereArgs, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounding box ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, boundingBox: BoundingBox, where: string, whereArgs: string[], limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, boundingBox, where, whereArgs, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounding box, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, boundingBox: BoundingBox, where: string, whereArgs: string[], orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, boundingBox.buildEnvelope(), where, whereArgs, orderBy, limit);
	}

	/**
	 * Query for features within the bounding box, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, boundingBox: BoundingBox, where: string, whereArgs: string[], orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, boundingBox.buildEnvelope(), where, whereArgs, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounding box ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], boundingBox: BoundingBox, where: string, whereArgs: string[], limit: number): FeatureResultSet {
		return queryFeaturesForChunk(columns, boundingBox, where, whereArgs, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounding box ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], boundingBox: BoundingBox, where: string, whereArgs: string[], limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(columns, boundingBox, where, whereArgs, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounding box, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], boundingBox: BoundingBox, where: string, whereArgs: string[], orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(false, columns, boundingBox, where, whereArgs, orderBy, limit);
	}

	/**
	 * Query for features within the bounding box, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], boundingBox: BoundingBox, where: string, whereArgs: string[], orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(false, columns, boundingBox, where, whereArgs, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounding box ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], boundingBox: BoundingBox, where: string, whereArgs: string[], limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, boundingBox, where, whereArgs, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounding box ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], boundingBox: BoundingBox, where: string, whereArgs: string[], limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, boundingBox, where, whereArgs, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounding box, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], boundingBox: BoundingBox, where: string, whereArgs: string[], orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, boundingBox.buildEnvelope(), where, whereArgs, orderBy, limit);
	}

	/**
	 * Query for features within the bounding box, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], boundingBox: BoundingBox, where: string, whereArgs: string[], orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, boundingBox.buildEnvelope(), where, whereArgs, orderBy, limit, offset);
	}

	/**
	 * Query for rows within the bounding box in the provided projection ordered
	 * by id, starting at the offset and returning no more than the limit
	 *
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(boundingBox: BoundingBox, projection: Projection, limit: number): UserCustomResultSet {
		return queryForChunk(boundingBox, projection, getPkColumnName(), limit);
	}

	/**
	 * Query for rows within the bounding box in the provided projection ordered
	 * by id, starting at the offset and returning no more than the limit
	 *
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(boundingBox: BoundingBox, projection: Projection, limit: number, offset: number): UserCustomResultSet {
		return queryForChunk(boundingBox, projection, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for rows within the bounding box in the provided projection, starting at the offset and returning no more than the limit
	 *
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(boundingBox: BoundingBox, projection: Projection, orderBy: string, limit: number): UserCustomResultSet {
		return queryForChunk(false, boundingBox, projection, orderBy, limit);
	}

	/**
	 * Query for rows within the bounding box in the provided projection, starting at the offset and returning no more than the limit
	 *
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(boundingBox: BoundingBox, projection: Projection, orderBy: string, limit: number, offset: number): UserCustomResultSet {
		return queryForChunk(false, boundingBox, projection, orderBy, limit, offset);
	}

	/**
	 * Query for rows within the bounding box in the provided projection ordered
	 * by id, starting at the offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(distinct: boolean, boundingBox: BoundingBox, projection: Projection, limit: number): UserCustomResultSet {
		return queryForChunk(distinct, boundingBox, projection, getPkColumnName(), limit);
	}

	/**
	 * Query for rows within the bounding box in the provided projection ordered
	 * by id, starting at the offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(distinct: boolean, boundingBox: BoundingBox, projection: Projection, limit: number, offset: number): UserCustomResultSet {
		return queryForChunk(distinct, boundingBox, projection, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for rows within the bounding box in the provided projection, starting at the offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(distinct: boolean, boundingBox: BoundingBox, projection: Projection, orderBy: string, limit: number): UserCustomResultSet {
		BoundingBox featureBoundingBox = projectBoundingBox(boundingBox, projection);
		return queryForChunk(distinct, featureBoundingBox, orderBy, limit);
	}

	/**
	 * Query for rows within the bounding box in the provided projection, starting at the offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(distinct: boolean, boundingBox: BoundingBox, projection: Projection, orderBy: string, limit: number, offset: number): UserCustomResultSet {
		BoundingBox featureBoundingBox = projectBoundingBox(boundingBox, projection);
		return queryForChunk(distinct, featureBoundingBox, orderBy, limit, offset);
	}

	/**
	 * Query for rows within the bounding box in the provided projection ordered
	 * by id, starting at the offset and returning no more than the limit
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(columns: string[], boundingBox: BoundingBox, projection: Projection, limit: number): UserCustomResultSet {
		return queryForChunk(columns, boundingBox, projection, getPkColumnName(), limit);
	}

	/**
	 * Query for rows within the bounding box in the provided projection ordered
	 * by id, starting at the offset and returning no more than the limit
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(columns: string[], boundingBox: BoundingBox, projection: Projection, limit: number, offset: number): UserCustomResultSet {
		return queryForChunk(columns, boundingBox, projection, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for rows within the bounding box in the provided projection, starting at the offset and returning no more than the limit
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(columns: string[], boundingBox: BoundingBox, projection: Projection, orderBy: string, limit: number): UserCustomResultSet {
		return queryForChunk(false, columns, boundingBox, projection, orderBy, limit);
	}

	/**
	 * Query for rows within the bounding box in the provided projection, starting at the offset and returning no more than the limit
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(columns: string[], boundingBox: BoundingBox, projection: Projection, orderBy: string, limit: number, offset: number): UserCustomResultSet {
		return queryForChunk(false, columns, boundingBox, projection, orderBy, limit, offset);
	}

	/**
	 * Query for rows within the bounding box in the provided projection ordered
	 * by id, starting at the offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(distinct: boolean, columns: string[], boundingBox: BoundingBox, projection: Projection, limit: number): UserCustomResultSet {
		return queryForChunk(distinct, columns, boundingBox, projection, getPkColumnName(), limit);
	}

	/**
	 * Query for rows within the bounding box in the provided projection ordered
	 * by id, starting at the offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(distinct: boolean, columns: string[], boundingBox: BoundingBox, projection: Projection, limit: number, offset: number): UserCustomResultSet {
		return queryForChunk(distinct, columns, boundingBox, projection, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for rows within the bounding box in the provided projection, starting at the offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(distinct: boolean, columns: string[], boundingBox: BoundingBox, projection: Projection, orderBy: string, limit: number): UserCustomResultSet {
		BoundingBox featureBoundingBox = projectBoundingBox(boundingBox, projection);
		return queryForChunk(distinct, columns, featureBoundingBox, orderBy, limit);
	}

	/**
	 * Query for rows within the bounding box in the provided projection, starting at the offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(distinct: boolean, columns: string[], boundingBox: BoundingBox, projection: Projection, orderBy: string, limit: number, offset: number): UserCustomResultSet {
		BoundingBox featureBoundingBox = projectBoundingBox(boundingBox, projection);
		return queryForChunk(distinct, columns, featureBoundingBox, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 * ordered by id, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(boundingBox: BoundingBox, projection: Projection, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(boundingBox, projection, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 * ordered by id, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(boundingBox: BoundingBox, projection: Projection, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(boundingBox, projection, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounding box in the provided projection, starting at the offset and returning no more than the limit
	 *
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(boundingBox: BoundingBox, projection: Projection, orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(false, boundingBox, projection, orderBy, limit);
	}

	/**
	 * Query for features within the bounding box in the provided projection, starting at the offset and returning no more than the limit
	 *
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(boundingBox: BoundingBox, projection: Projection, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(false, boundingBox, projection, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 * ordered by id, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, boundingBox: BoundingBox, projection: Projection, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, boundingBox, projection, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 * ordered by id, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, boundingBox: BoundingBox, projection: Projection, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, boundingBox, projection, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounding box in the provided projection, starting at the offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, boundingBox: BoundingBox, projection: Projection, orderBy: string, limit: number): FeatureResultSet {
		BoundingBox featureBoundingBox = projectBoundingBox(boundingBox, projection);
		return queryFeaturesForChunk(distinct, featureBoundingBox, orderBy, limit);
	}

	/**
	 * Query for features within the bounding box in the provided projection, starting at the offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, boundingBox: BoundingBox, projection: Projection, orderBy: string, limit: number, offset: number): FeatureResultSet {
		BoundingBox featureBoundingBox = projectBoundingBox(boundingBox, projection);
		return queryFeaturesForChunk(distinct, featureBoundingBox, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 * ordered by id, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], boundingBox: BoundingBox, projection: Projection, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(columns, boundingBox, projection, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 * ordered by id, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], boundingBox: BoundingBox, projection: Projection, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(columns, boundingBox, projection, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounding box in the provided projection, starting at the offset and returning no more than the limit
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], boundingBox: BoundingBox, projection: Projection, orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(false, columns, boundingBox, projection, orderBy, limit);
	}

	/**
	 * Query for features within the bounding box in the provided projection, starting at the offset and returning no more than the limit
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], boundingBox: BoundingBox, projection: Projection, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(false, columns, boundingBox, projection, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 * ordered by id, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], boundingBox: BoundingBox, projection: Projection, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, boundingBox, projection, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 * ordered by id, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], boundingBox: BoundingBox, projection: Projection, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, boundingBox, projection, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounding box in the provided projection, starting at the offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], boundingBox: BoundingBox, projection: Projection, orderBy: string, limit: number): FeatureResultSet {
		BoundingBox featureBoundingBox = projectBoundingBox(boundingBox, projection);
		return queryFeaturesForChunk(distinct, columns, featureBoundingBox, orderBy, limit);
	}

	/**
	 * Query for features within the bounding box in the provided projection, starting at the offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], boundingBox: BoundingBox, projection: Projection, orderBy: string, limit: number, offset: number): FeatureResultSet {
		BoundingBox featureBoundingBox = projectBoundingBox(boundingBox, projection);
		return queryFeaturesForChunk(distinct, columns, featureBoundingBox, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 * ordered by id, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param fieldValues field values
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(boundingBox: BoundingBox, projection: Projection, fieldValues: ColumnValues, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(boundingBox, projection, fieldValues, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 * ordered by id, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param fieldValues field values
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(boundingBox: BoundingBox, projection: Projection, fieldValues: ColumnValues, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(boundingBox, projection, fieldValues, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounding box in the provided projection, starting at the offset and returning no more than the limit
	 *
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param fieldValues field values
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(boundingBox: BoundingBox, projection: Projection, fieldValues: ColumnValues, orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(false, boundingBox, projection, fieldValues, orderBy, limit);
	}

	/**
	 * Query for features within the bounding box in the provided projection, starting at the offset and returning no more than the limit
	 *
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param fieldValues field values
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(boundingBox: BoundingBox, projection: Projection, fieldValues: ColumnValues, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(false, boundingBox, projection, fieldValues, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 * ordered by id, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param fieldValues field values
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, boundingBox: BoundingBox, projection: Projection, fieldValues: ColumnValues, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, boundingBox, projection, fieldValues, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 * ordered by id, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param fieldValues field values
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, boundingBox: BoundingBox, projection: Projection, fieldValues: ColumnValues, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, boundingBox, projection, fieldValues, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounding box in the provided projection, starting at the offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param fieldValues field values
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, boundingBox: BoundingBox, projection: Projection, fieldValues: ColumnValues, orderBy: string, limit: number): FeatureResultSet {
		BoundingBox featureBoundingBox = projectBoundingBox(boundingBox, projection);
		return queryFeaturesForChunk(distinct, featureBoundingBox, fieldValues, orderBy, limit);
	}

	/**
	 * Query for features within the bounding box in the provided projection, starting at the offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param fieldValues field values
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, boundingBox: BoundingBox, projection: Projection, fieldValues: ColumnValues, orderBy: string, limit: number, offset: number): FeatureResultSet {
		BoundingBox featureBoundingBox = projectBoundingBox(boundingBox, projection);
		return queryFeaturesForChunk(distinct, featureBoundingBox, fieldValues, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 * ordered by id, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param fieldValues field values
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], boundingBox: BoundingBox, projection: Projection, fieldValues: ColumnValues, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(columns, boundingBox, projection, fieldValues, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 * ordered by id, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param fieldValues field values
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], boundingBox: BoundingBox, projection: Projection, fieldValues: ColumnValues, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(columns, boundingBox, projection, fieldValues, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounding box in the provided projection, starting at the offset and returning no more than the limit
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param fieldValues field values
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], boundingBox: BoundingBox, projection: Projection, fieldValues: ColumnValues, orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(false, columns, boundingBox, projection, fieldValues, orderBy, limit);
	}

	/**
	 * Query for features within the bounding box in the provided projection, starting at the offset and returning no more than the limit
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param fieldValues field values
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], boundingBox: BoundingBox, projection: Projection, fieldValues: ColumnValues, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(false, columns, boundingBox, projection, fieldValues, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 * ordered by id, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param fieldValues field values
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], boundingBox: BoundingBox, projection: Projection, fieldValues: ColumnValues, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, boundingBox, projection, fieldValues, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 * ordered by id, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param fieldValues field values
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], boundingBox: BoundingBox, projection: Projection, fieldValues: ColumnValues, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, boundingBox, projection, fieldValues, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounding box in the provided projection, starting at the offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param fieldValues field values
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], boundingBox: BoundingBox, projection: Projection, fieldValues: ColumnValues, orderBy: string, limit: number): FeatureResultSet {
		BoundingBox featureBoundingBox = projectBoundingBox(boundingBox, projection);
		return queryFeaturesForChunk(distinct, columns, featureBoundingBox, fieldValues, orderBy, limit);
	}

	/**
	 * Query for features within the bounding box in the provided projection, starting at the offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param fieldValues field values
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], boundingBox: BoundingBox, projection: Projection, fieldValues: ColumnValues, orderBy: string, limit: number, offset: number): FeatureResultSet {
		BoundingBox featureBoundingBox = projectBoundingBox(boundingBox, projection);
		return queryFeaturesForChunk(distinct, columns, featureBoundingBox, fieldValues, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 * ordered by id, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public FeatureResultSet queryFeaturesForChunkIdOrder(
			boundingBox: BoundingBox, projection: Projection, where: string, limit: number) {
		return queryFeaturesForChunk(boundingBox, projection, where, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 * ordered by id, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public FeatureResultSet queryFeaturesForChunkIdOrder(
			boundingBox: BoundingBox, projection: Projection, where: string, limit: number, offset: number) {
		return queryFeaturesForChunk(boundingBox, projection, where, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounding box in the provided projection, starting at the offset and returning no more than the limit
	 *
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(boundingBox: BoundingBox, projection: Projection, where: string, orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(false, boundingBox, projection, where, orderBy, limit);
	}

	/**
	 * Query for features within the bounding box in the provided projection, starting at the offset and returning no more than the limit
	 *
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(boundingBox: BoundingBox, projection: Projection, where: string, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(false, boundingBox, projection, where, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 * ordered by id, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunkIdOrder(distinct: boolean, boundingBox: BoundingBox, projection: Projection, where: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, boundingBox, projection, where, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 * ordered by id, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunkIdOrder(distinct: boolean, boundingBox: BoundingBox, projection: Projection, where: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, boundingBox, projection, where, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounding box in the provided projection, starting at the offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, boundingBox: BoundingBox, projection: Projection, where: string, orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, boundingBox, projection, where, null, orderBy, limit);
	}

	/**
	 * Query for features within the bounding box in the provided projection, starting at the offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, boundingBox: BoundingBox, projection: Projection, where: string, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, boundingBox, projection, where, null, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 * ordered by id, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunkIdOrder(columns: string[], boundingBox: BoundingBox, projection: Projection, where: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(columns, boundingBox, projection, where, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 * ordered by id, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunkIdOrder(columns: string[], boundingBox: BoundingBox, projection: Projection, where: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(columns, boundingBox, projection, where, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounding box in the provided projection, starting at the offset and returning no more than the limit
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], boundingBox: BoundingBox, projection: Projection, where: string, orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(false, columns, boundingBox, projection, where, orderBy, limit);
	}

	/**
	 * Query for features within the bounding box in the provided projection, starting at the offset and returning no more than the limit
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], boundingBox: BoundingBox, projection: Projection, where: string, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(false, columns, boundingBox, projection, where, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 * ordered by id, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunkIdOrder(distinct: boolean, columns: string[], boundingBox: BoundingBox, projection: Projection, where: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, boundingBox, projection, where, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 * ordered by id, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunkIdOrder(distinct: boolean, columns: string[], boundingBox: BoundingBox, projection: Projection, where: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, boundingBox, projection, where, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounding box in the provided projection, starting at the offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], boundingBox: BoundingBox, projection: Projection, where: string, orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, boundingBox, projection, where, null, orderBy, limit);
	}

	/**
	 * Query for features within the bounding box in the provided projection, starting at the offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], boundingBox: BoundingBox, projection: Projection, where: string, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, boundingBox, projection, where, null, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 * ordered by id, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(boundingBox: BoundingBox, projection: Projection, where: string, whereArgs: string[], limit: number): FeatureResultSet {
		return queryFeaturesForChunk(boundingBox, projection, where, whereArgs, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 * ordered by id, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(boundingBox: BoundingBox, projection: Projection, where: string, whereArgs: string[], limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(boundingBox, projection, where, whereArgs, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounding box in the provided projection, starting at the offset and returning no more than the limit
	 *
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(boundingBox: BoundingBox, projection: Projection, where: string, whereArgs: string[], orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(false, boundingBox, projection, where, whereArgs, orderBy, limit);
	}

	/**
	 * Query for features within the bounding box in the provided projection, starting at the offset and returning no more than the limit
	 *
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(boundingBox: BoundingBox, projection: Projection, where: string, whereArgs: string[], orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(false, boundingBox, projection, where, whereArgs, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 * ordered by id, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, boundingBox: BoundingBox, projection: Projection, where: string, whereArgs: string[], limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, boundingBox, projection, where, whereArgs, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 * ordered by id, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, boundingBox: BoundingBox, projection: Projection, where: string, whereArgs: string[], limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, boundingBox, projection, where, whereArgs, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounding box in the provided projection, starting at the offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, boundingBox: BoundingBox, projection: Projection, where: string, whereArgs: string[], orderBy: string, limit: number): FeatureResultSet {
		BoundingBox featureBoundingBox = projectBoundingBox(boundingBox, projection);
		return queryFeaturesForChunk(distinct, featureBoundingBox, where, whereArgs, orderBy, limit);
	}

	/**
	 * Query for features within the bounding box in the provided projection, starting at the offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, boundingBox: BoundingBox, projection: Projection, where: string, whereArgs: string[], orderBy: string, limit: number, offset: number): FeatureResultSet {
		BoundingBox featureBoundingBox = projectBoundingBox(boundingBox, projection);
		return queryFeaturesForChunk(distinct, featureBoundingBox, where, whereArgs, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 * ordered by id, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], boundingBox: BoundingBox, projection: Projection, where: string, whereArgs: string[], limit: number): FeatureResultSet {
		return queryFeaturesForChunk(columns, boundingBox, projection, where, whereArgs, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 * ordered by id, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], boundingBox: BoundingBox, projection: Projection, where: string, whereArgs: string[], limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(columns, boundingBox, projection, where, whereArgs, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounding box in the provided projection, starting at the offset and returning no more than the limit
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], boundingBox: BoundingBox, projection: Projection, where: string, whereArgs: string[], orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(false, columns, boundingBox, projection, where, whereArgs, orderBy, limit);
	}

	/**
	 * Query for features within the bounding box in the provided projection, starting at the offset and returning no more than the limit
	 *
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], boundingBox: BoundingBox, projection: Projection, where: string, whereArgs: string[], orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(false, columns, boundingBox, projection, where, whereArgs, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 * ordered by id, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], boundingBox: BoundingBox, projection: Projection, where: string, whereArgs: string[], limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, boundingBox, projection, where, whereArgs, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounding box in the provided projection
	 * ordered by id, starting at the offset and returning no more than the
	 * limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], boundingBox: BoundingBox, projection: Projection, where: string, whereArgs: string[], limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, boundingBox, projection, where, whereArgs, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounding box in the provided projection, starting at the offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], boundingBox: BoundingBox, projection: Projection, where: string, whereArgs: string[], orderBy: string, limit: number): FeatureResultSet {
		BoundingBox featureBoundingBox = projectBoundingBox(boundingBox, projection);
		return queryFeaturesForChunk(distinct, columns, featureBoundingBox, where, whereArgs, orderBy, limit);
	}

	/**
	 * Query for features within the bounding box in the provided projection, starting at the offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], boundingBox: BoundingBox, projection: Projection, where: string, whereArgs: string[], orderBy: string, limit: number, offset: number): FeatureResultSet {
		BoundingBox featureBoundingBox = projectBoundingBox(boundingBox, projection);
		return queryFeaturesForChunk(distinct, columns, featureBoundingBox, where, whereArgs, orderBy, limit, offset);
	}

	/**
	 * Query for rows within the geometry envelope ordered by id, starting at
	 * the offset and returning no more than the limit
	 *
	 * @param envelope geometry envelope
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(envelope: GeometryEnvelope, limit: number): UserCustomResultSet {
		return queryForChunk(envelope, getPkColumnName(), limit);
	}

	/**
	 * Query for rows within the geometry envelope ordered by id, starting at
	 * the offset and returning no more than the limit
	 *
	 * @param envelope geometry envelope
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(envelope: GeometryEnvelope, limit: number, offset: number): UserCustomResultSet {
		return queryForChunk(envelope, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for rows within the geometry envelope, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param envelope geometry envelope
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(envelope: GeometryEnvelope, orderBy: string, limit: number): UserCustomResultSet {
		return queryForChunk(false, envelope, orderBy, limit);
	}

	/**
	 * Query for rows within the geometry envelope, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param envelope geometry envelope
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(envelope: GeometryEnvelope, orderBy: string, limit: number, offset: number): UserCustomResultSet {
		return queryForChunk(false, envelope, orderBy, limit, offset);
	}

	/**
	 * Query for rows within the geometry envelope ordered by id, starting at
	 * the offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param envelope geometry envelope
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(distinct: boolean, envelope: GeometryEnvelope, limit: number): UserCustomResultSet {
		return queryForChunk(distinct, envelope, getPkColumnName(), limit);
	}

	/**
	 * Query for rows within the geometry envelope ordered by id, starting at
	 * the offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param envelope geometry envelope
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(distinct: boolean, envelope: GeometryEnvelope, limit: number, offset: number): UserCustomResultSet {
		return queryForChunk(distinct, envelope, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for rows within the geometry envelope, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param envelope geometry envelope
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(distinct: boolean, envelope: GeometryEnvelope, orderBy: string, limit: number): UserCustomResultSet {
		return queryForChunk(distinct, envelope.getMinX(), envelope.getMinY(), envelope.getMaxX(), envelope.getMaxY(), orderBy, limit);
	}

	/**
	 * Query for rows within the geometry envelope, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param envelope geometry envelope
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(distinct: boolean, envelope: GeometryEnvelope, orderBy: string, limit: number, offset: number): UserCustomResultSet {
		return queryForChunk(distinct, envelope.getMinX(), envelope.getMinY(), envelope.getMaxX(), envelope.getMaxY(), orderBy, limit, offset);
	}

	/**
	 * Query for rows within the geometry envelope ordered by id, starting at
	 * the offset and returning no more than the limit
	 *
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(columns: string[], envelope: GeometryEnvelope, limit: number): UserCustomResultSet {
		return queryForChunk(columns, envelope, getPkColumnName(), limit);
	}

	/**
	 * Query for rows within the geometry envelope ordered by id, starting at
	 * the offset and returning no more than the limit
	 *
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(columns: string[], envelope: GeometryEnvelope, limit: number, offset: number): UserCustomResultSet {
		return queryForChunk(columns, envelope, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for rows within the geometry envelope, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(columns: string[], envelope: GeometryEnvelope, orderBy: string, limit: number): UserCustomResultSet {
		return queryForChunk(false, columns, envelope, orderBy, limit);
	}

	/**
	 * Query for rows within the geometry envelope, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(columns: string[], envelope: GeometryEnvelope, orderBy: string, limit: number, offset: number): UserCustomResultSet {
		return queryForChunk(false, columns, envelope, orderBy, limit, offset);
	}

	/**
	 * Query for rows within the geometry envelope ordered by id, starting at
	 * the offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(distinct: boolean, columns: string[], envelope: GeometryEnvelope, limit: number): UserCustomResultSet {
		return queryForChunk(distinct, columns, envelope, getPkColumnName(), limit);
	}

	/**
	 * Query for rows within the geometry envelope ordered by id, starting at
	 * the offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(distinct: boolean, columns: string[], envelope: GeometryEnvelope, limit: number, offset: number): UserCustomResultSet {
		return queryForChunk(distinct, columns, envelope, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for rows within the geometry envelope, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(distinct: boolean, columns: string[], envelope: GeometryEnvelope, orderBy: string, limit: number): UserCustomResultSet {
		return queryForChunk(distinct, columns, envelope.getMinX(), envelope.getMinY(), envelope.getMaxX(), envelope.getMaxY(), orderBy, limit);
	}

	/**
	 * Query for rows within the geometry envelope, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(distinct: boolean, columns: string[], envelope: GeometryEnvelope, orderBy: string, limit: number, offset: number): UserCustomResultSet {
		return queryForChunk(distinct, columns, envelope.getMinX(), envelope.getMinY(), envelope.getMaxX(), envelope.getMaxY(), orderBy, limit, offset);
	}

	/**
	 * Query for features within the geometry envelope ordered by id, starting
	 * at the offset and returning no more than the limit
	 *
	 * @param envelope geometry envelope
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(envelope: GeometryEnvelope, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(envelope, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the geometry envelope ordered by id, starting
	 * at the offset and returning no more than the limit
	 *
	 * @param envelope geometry envelope
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(envelope: GeometryEnvelope, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(envelope, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the geometry envelope, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param envelope geometry envelope
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(envelope: GeometryEnvelope, orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(false, envelope, orderBy, limit);
	}

	/**
	 * Query for features within the geometry envelope, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param envelope geometry envelope
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(envelope: GeometryEnvelope, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(false, envelope, orderBy, limit, offset);
	}

	/**
	 * Query for features within the geometry envelope ordered by id, starting
	 * at the offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param envelope geometry envelope
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, envelope: GeometryEnvelope, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, envelope, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the geometry envelope ordered by id, starting
	 * at the offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param envelope geometry envelope
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, envelope: GeometryEnvelope, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, envelope, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the geometry envelope, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param envelope geometry envelope
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, envelope: GeometryEnvelope, orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, envelope.getMinX(), envelope.getMinY(), envelope.getMaxX(), envelope.getMaxY(), orderBy, limit);
	}

	/**
	 * Query for features within the geometry envelope, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param envelope geometry envelope
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, envelope: GeometryEnvelope, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, envelope.getMinX(), envelope.getMinY(), envelope.getMaxX(), envelope.getMaxY(), orderBy, limit, offset);
	}

	/**
	 * Query for features within the geometry envelope ordered by id, starting
	 * at the offset and returning no more than the limit
	 *
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], envelope: GeometryEnvelope, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(columns, envelope, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the geometry envelope ordered by id, starting
	 * at the offset and returning no more than the limit
	 *
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], envelope: GeometryEnvelope, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(columns, envelope, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the geometry envelope, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], envelope: GeometryEnvelope, orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(false, columns, envelope, orderBy, limit);
	}

	/**
	 * Query for features within the geometry envelope, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], envelope: GeometryEnvelope, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(false, columns, envelope, orderBy, limit, offset);
	}

	/**
	 * Query for features within the geometry envelope ordered by id, starting
	 * at the offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], envelope: GeometryEnvelope, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, envelope, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the geometry envelope ordered by id, starting
	 * at the offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], envelope: GeometryEnvelope, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, envelope, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the geometry envelope, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], envelope: GeometryEnvelope, orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, envelope.getMinX(), envelope.getMinY(), envelope.getMaxX(), envelope.getMaxY(), orderBy, limit);
	}

	/**
	 * Query for features within the geometry envelope, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], envelope: GeometryEnvelope, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, envelope.getMinX(), envelope.getMinY(), envelope.getMaxX(), envelope.getMaxY(), orderBy, limit, offset);
	}

	/**
	 * Query for features within the geometry envelope ordered by id, starting
	 * at the offset and returning no more than the limit
	 *
	 * @param envelope geometry envelope
	 * @param fieldValues field values
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(envelope: GeometryEnvelope, fieldValues: ColumnValues, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(envelope, fieldValues, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the geometry envelope ordered by id, starting
	 * at the offset and returning no more than the limit
	 *
	 * @param envelope geometry envelope
	 * @param fieldValues field values
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(envelope: GeometryEnvelope, fieldValues: ColumnValues, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(envelope, fieldValues, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the geometry envelope, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param envelope geometry envelope
	 * @param fieldValues field values
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(envelope: GeometryEnvelope, fieldValues: ColumnValues, orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(false, envelope, fieldValues, orderBy, limit);
	}

	/**
	 * Query for features within the geometry envelope, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param envelope geometry envelope
	 * @param fieldValues field values
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(envelope: GeometryEnvelope, fieldValues: ColumnValues, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(false, envelope, fieldValues, orderBy, limit, offset);
	}

	/**
	 * Query for features within the geometry envelope ordered by id, starting
	 * at the offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param envelope geometry envelope
	 * @param fieldValues field values
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, envelope: GeometryEnvelope, fieldValues: ColumnValues, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, envelope, fieldValues, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the geometry envelope ordered by id, starting
	 * at the offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param envelope geometry envelope
	 * @param fieldValues field values
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, envelope: GeometryEnvelope, fieldValues: ColumnValues, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, envelope, fieldValues, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the geometry envelope, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param envelope geometry envelope
	 * @param fieldValues field values
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, envelope: GeometryEnvelope, fieldValues: ColumnValues, orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, envelope.getMinX(), envelope.getMinY(), envelope.getMaxX(), envelope.getMaxY(), fieldValues, orderBy, limit);
	}

	/**
	 * Query for features within the geometry envelope, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param envelope geometry envelope
	 * @param fieldValues field values
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, envelope: GeometryEnvelope, fieldValues: ColumnValues, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, envelope.getMinX(), envelope.getMinY(), envelope.getMaxX(), envelope.getMaxY(), fieldValues, orderBy, limit, offset);
	}

	/**
	 * Query for features within the geometry envelope ordered by id, starting
	 * at the offset and returning no more than the limit
	 *
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param fieldValues field values
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], envelope: GeometryEnvelope, fieldValues: ColumnValues, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(columns, envelope, fieldValues, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the geometry envelope ordered by id, starting
	 * at the offset and returning no more than the limit
	 *
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param fieldValues field values
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], envelope: GeometryEnvelope, fieldValues: ColumnValues, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(columns, envelope, fieldValues, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the geometry envelope, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param fieldValues field values
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], envelope: GeometryEnvelope, fieldValues: ColumnValues, orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(false, columns, envelope, fieldValues, orderBy, limit);
	}

	/**
	 * Query for features within the geometry envelope, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param fieldValues field values
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], envelope: GeometryEnvelope, fieldValues: ColumnValues, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(false, columns, envelope, fieldValues, orderBy, limit, offset);
	}

	/**
	 * Query for features within the geometry envelope ordered by id, starting
	 * at the offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param fieldValues field values
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], envelope: GeometryEnvelope, fieldValues: ColumnValues, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, envelope, fieldValues, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the geometry envelope ordered by id, starting
	 * at the offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param fieldValues field values
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], envelope: GeometryEnvelope, fieldValues: ColumnValues, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, envelope, fieldValues, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the geometry envelope, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param fieldValues field values
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], envelope: GeometryEnvelope, fieldValues: ColumnValues, orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, envelope.getMinX(), envelope.getMinY(), envelope.getMaxX(), envelope.getMaxY(), fieldValues, orderBy, limit);
	}

	/**
	 * Query for features within the geometry envelope, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param fieldValues field values
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], envelope: GeometryEnvelope, fieldValues: ColumnValues, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, envelope.getMinX(), envelope.getMinY(), envelope.getMaxX(), envelope.getMaxY(), fieldValues, orderBy, limit, offset);
	}

	/**
	 * Query for features within the geometry envelope ordered by id, starting
	 * at the offset and returning no more than the limit
	 *
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public FeatureResultSet queryFeaturesForChunkIdOrder(
			envelope: GeometryEnvelope, where: string, limit: number) {
		return queryFeaturesForChunk(envelope, where, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the geometry envelope ordered by id, starting
	 * at the offset and returning no more than the limit
	 *
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public FeatureResultSet queryFeaturesForChunkIdOrder(
			envelope: GeometryEnvelope, where: string, limit: number, offset: number) {
		return queryFeaturesForChunk(envelope, where, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the geometry envelope, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(envelope: GeometryEnvelope, where: string, orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(false, envelope, where, orderBy, limit);
	}

	/**
	 * Query for features within the geometry envelope, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(envelope: GeometryEnvelope, where: string, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(false, envelope, where, orderBy, limit, offset);
	}

	/**
	 * Query for features within the geometry envelope ordered by id, starting
	 * at the offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunkIdOrder(distinct: boolean, envelope: GeometryEnvelope, where: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, envelope, where, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the geometry envelope ordered by id, starting
	 * at the offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunkIdOrder(distinct: boolean, envelope: GeometryEnvelope, where: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, envelope, where, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the geometry envelope, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, envelope: GeometryEnvelope, where: string, orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, envelope, where, null, orderBy, limit);
	}

	/**
	 * Query for features within the geometry envelope, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, envelope: GeometryEnvelope, where: string, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, envelope, where, null, orderBy, limit, offset);
	}

	/**
	 * Query for features within the geometry envelope ordered by id, starting
	 * at the offset and returning no more than the limit
	 *
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunkIdOrder(columns: string[], envelope: GeometryEnvelope, where: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(columns, envelope, where, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the geometry envelope ordered by id, starting
	 * at the offset and returning no more than the limit
	 *
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunkIdOrder(columns: string[], envelope: GeometryEnvelope, where: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(columns, envelope, where, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the geometry envelope, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], envelope: GeometryEnvelope, where: string, orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(false, columns, envelope, where, orderBy, limit);
	}

	/**
	 * Query for features within the geometry envelope, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], envelope: GeometryEnvelope, where: string, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(false, columns, envelope, where, orderBy, limit, offset);
	}

	/**
	 * Query for features within the geometry envelope ordered by id, starting
	 * at the offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunkIdOrder(distinct: boolean, columns: string[], envelope: GeometryEnvelope, where: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, envelope, where, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the geometry envelope ordered by id, starting
	 * at the offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunkIdOrder(distinct: boolean, columns: string[], envelope: GeometryEnvelope, where: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, envelope, where, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the geometry envelope, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], envelope: GeometryEnvelope, where: string, orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, envelope, where, null, orderBy, limit);
	}

	/**
	 * Query for features within the geometry envelope, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], envelope: GeometryEnvelope, where: string, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, envelope, where, null, orderBy, limit, offset);
	}

	/**
	 * Query for features within the geometry envelope ordered by id, starting
	 * at the offset and returning no more than the limit
	 *
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(envelope: GeometryEnvelope, where: string, whereArgs: string[], limit: number): FeatureResultSet {
		return queryFeaturesForChunk(envelope, where, whereArgs, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the geometry envelope ordered by id, starting
	 * at the offset and returning no more than the limit
	 *
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(envelope: GeometryEnvelope, where: string, whereArgs: string[], limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(envelope, where, whereArgs, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the geometry envelope, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(envelope: GeometryEnvelope, where: string, whereArgs: string[], orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(false, envelope, where, whereArgs, orderBy, limit);
	}

	/**
	 * Query for features within the geometry envelope, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(envelope: GeometryEnvelope, where: string, whereArgs: string[], orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(false, envelope, where, whereArgs, orderBy, limit, offset);
	}

	/**
	 * Query for features within the geometry envelope ordered by id, starting
	 * at the offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, envelope: GeometryEnvelope, where: string, whereArgs: string[], limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, envelope, where, whereArgs, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the geometry envelope ordered by id, starting
	 * at the offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, envelope: GeometryEnvelope, where: string, whereArgs: string[], limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, envelope, where, whereArgs, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the geometry envelope, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, envelope: GeometryEnvelope, where: string, whereArgs: string[], orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, envelope.getMinX(), envelope.getMinY(), envelope.getMaxX(), envelope.getMaxY(), where, whereArgs, orderBy, limit);
	}

	/**
	 * Query for features within the geometry envelope, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, envelope: GeometryEnvelope, where: string, whereArgs: string[], orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, envelope.getMinX(), envelope.getMinY(), envelope.getMaxX(), envelope.getMaxY(), where, whereArgs, orderBy, limit, offset);
	}

	/**
	 * Query for features within the geometry envelope ordered by id, starting
	 * at the offset and returning no more than the limit
	 *
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], envelope: GeometryEnvelope, where: string, whereArgs: string[], limit: number): FeatureResultSet {
		return queryFeaturesForChunk(columns, envelope, where, whereArgs, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the geometry envelope ordered by id, starting
	 * at the offset and returning no more than the limit
	 *
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], envelope: GeometryEnvelope, where: string, whereArgs: string[], limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(columns, envelope, where, whereArgs, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the geometry envelope, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], envelope: GeometryEnvelope, where: string, whereArgs: string[], orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(false, columns, envelope, where, whereArgs, orderBy, limit);
	}

	/**
	 * Query for features within the geometry envelope, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], envelope: GeometryEnvelope, where: string, whereArgs: string[], orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(false, columns, envelope, where, whereArgs, orderBy, limit, offset);
	}

	/**
	 * Query for features within the geometry envelope ordered by id, starting
	 * at the offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], envelope: GeometryEnvelope, where: string, whereArgs: string[], limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, envelope, where, whereArgs, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the geometry envelope ordered by id, starting
	 * at the offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], envelope: GeometryEnvelope, where: string, whereArgs: string[], limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, envelope, where, whereArgs, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the geometry envelope, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], envelope: GeometryEnvelope, where: string, whereArgs: string[], orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, envelope.getMinX(), envelope.getMinY(), envelope.getMaxX(), envelope.getMaxY(), where, whereArgs, orderBy, limit);
	}

	/**
	 * Query for features within the geometry envelope, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], envelope: GeometryEnvelope, where: string, whereArgs: string[], orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, envelope.getMinX(), envelope.getMinY(), envelope.getMaxX(), envelope.getMaxY(), where, whereArgs, orderBy, limit, offset);
	}

	/**
	 * Query for rows within the bounds ordered by id, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(minX: number, minY: number, maxX: number, maxY: number, limit: number): UserCustomResultSet {
		return queryForChunk(minX, minY, maxX, maxY, getPkColumnName(), limit);
	}

	/**
	 * Query for rows within the bounds ordered by id, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(minX: number, minY: number, maxX: number, maxY: number, limit: number, offset: number): UserCustomResultSet {
		return queryForChunk(minX, minY, maxX, maxY, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for rows within the bounds, starting at the offset and returning no
	 * more than the limit
	 *
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(minX: number, minY: number, maxX: number, maxY: number, orderBy: string, limit: number): UserCustomResultSet {
		return queryForChunk(false, minX, minY, maxX, maxY, orderBy, limit);
	}

	/**
	 * Query for rows within the bounds, starting at the offset and returning no
	 * more than the limit
	 *
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(minX: number, minY: number, maxX: number, maxY: number, orderBy: string, limit: number, offset: number): UserCustomResultSet {
		return queryForChunk(false, minX, minY, maxX, maxY, orderBy, limit, offset);
	}

	/**
	 * Query for rows within the bounds ordered by id, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(distinct: boolean, minX: number, minY: number, maxX: number, maxY: number, limit: number): UserCustomResultSet {
		return queryForChunk(distinct, minX, minY, maxX, maxY, getPkColumnName(), limit);
	}

	/**
	 * Query for rows within the bounds ordered by id, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(distinct: boolean, minX: number, minY: number, maxX: number, maxY: number, limit: number, offset: number): UserCustomResultSet {
		return queryForChunk(distinct, minX, minY, maxX, maxY, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for rows within the bounds, starting at the offset and returning no
	 * more than the limit
	 *
	 * @param distinct distinct rows
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(distinct: boolean, minX: number, minY: number, maxX: number, maxY: number, orderBy: string, limit: number): UserCustomResultSet {
		this.validateRTree();
		where: string = buildWhere(minX, minY, maxX, maxY);
		whereArgs: string[] = buildWhereArgs(minX, minY, maxX, maxY);
		return queryForChunk(distinct, where, whereArgs, orderBy, limit);
	}

	/**
	 * Query for rows within the bounds, starting at the offset and returning no
	 * more than the limit
	 *
	 * @param distinct distinct rows
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(distinct: boolean, minX: number, minY: number, maxX: number, maxY: number, orderBy: string, limit: number, offset: number): UserCustomResultSet {
		this.validateRTree();
		where: string = buildWhere(minX, minY, maxX, maxY);
		whereArgs: string[] = buildWhereArgs(minX, minY, maxX, maxY);
		return queryForChunk(distinct, where, whereArgs, orderBy, limit, offset);
	}

	/**
	 * Query for rows within the bounds ordered by id, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(columns: string[], minX: number, minY: number, maxX: number, maxY: number, limit: number): UserCustomResultSet {
		return queryForChunk(columns, minX, minY, maxX, maxY, getPkColumnName(), limit);
	}

	/**
	 * Query for rows within the bounds ordered by id, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(columns: string[], minX: number, minY: number, maxX: number, maxY: number, limit: number, offset: number): UserCustomResultSet {
		return queryForChunk(columns, minX, minY, maxX, maxY, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for rows within the bounds, starting at the offset and returning no
	 * more than the limit
	 *
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(columns: string[], minX: number, minY: number, maxX: number, maxY: number, orderBy: string, limit: number): UserCustomResultSet {
		return queryForChunk(false, columns, minX, minY, maxX, maxY, orderBy, limit);
	}

	/**
	 * Query for rows within the bounds, starting at the offset and returning no
	 * more than the limit
	 *
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(columns: string[], minX: number, minY: number, maxX: number, maxY: number, orderBy: string, limit: number, offset: number): UserCustomResultSet {
		return queryForChunk(false, columns, minX, minY, maxX, maxY, orderBy, limit, offset);
	}

	/**
	 * Query for rows within the bounds ordered by id, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(distinct: boolean, columns: string[], minX: number, minY: number, maxX: number, maxY: number, limit: number): UserCustomResultSet {
		return queryForChunk(distinct, columns, minX, minY, maxX, maxY, getPkColumnName(), limit);
	}

	/**
	 * Query for rows within the bounds ordered by id, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(distinct: boolean, columns: string[], minX: number, minY: number, maxX: number, maxY: number, limit: number, offset: number): UserCustomResultSet {
		return queryForChunk(distinct, columns, minX, minY, maxX, maxY, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for rows within the bounds, starting at the offset and returning no
	 * more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(distinct: boolean, columns: string[], minX: number, minY: number, maxX: number, maxY: number, orderBy: string, limit: number): UserCustomResultSet {
		this.validateRTree();
		where: string = buildWhere(minX, minY, maxX, maxY);
		whereArgs: string[] = buildWhereArgs(minX, minY, maxX, maxY);
		return queryForChunk(distinct, columns, where, whereArgs, orderBy, limit);
	}

	/**
	 * Query for rows within the bounds, starting at the offset and returning no
	 * more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryForChunk(distinct: boolean, columns: string[], minX: number, minY: number, maxX: number, maxY: number, orderBy: string, limit: number, offset: number): UserCustomResultSet {
		this.validateRTree();
		where: string = buildWhere(minX, minY, maxX, maxY);
		whereArgs: string[] = buildWhereArgs(minX, minY, maxX, maxY);
		return queryForChunk(distinct, columns, where, whereArgs, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounds ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(minX: number, minY: number, maxX: number, maxY: number, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(minX, minY, maxX, maxY, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounds ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(minX: number, minY: number, maxX: number, maxY: number, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(minX, minY, maxX, maxY, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounds, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(minX: number, minY: number, maxX: number, maxY: number, orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(false, minX, minY, maxX, maxY, orderBy, limit);
	}

	/**
	 * Query for features within the bounds, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(minX: number, minY: number, maxX: number, maxY: number, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(false, minX, minY, maxX, maxY, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounds ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, minX: number, minY: number, maxX: number, maxY: number, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, minX, minY, maxX, maxY, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounds ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, minX: number, minY: number, maxX: number, maxY: number, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, minX, minY, maxX, maxY, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounds, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, minX: number, minY: number, maxX: number, maxY: number, orderBy: string, limit: number): FeatureResultSet {
		this.validateRTree();
		where: string = buildWhere(minX, minY, maxX, maxY);
		whereArgs: string[] = buildWhereArgs(minX, minY, maxX, maxY);
		return featureDao.queryInForChunk(distinct, queryIdsSQL(where), whereArgs, orderBy, limit);
	}

	/**
	 * Query for features within the bounds, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, minX: number, minY: number, maxX: number, maxY: number, orderBy: string, limit: number, offset: number): FeatureResultSet {
		this.validateRTree();
		where: string = buildWhere(minX, minY, maxX, maxY);
		whereArgs: string[] = buildWhereArgs(minX, minY, maxX, maxY);
		return featureDao.queryInForChunk(distinct, queryIdsSQL(where), whereArgs, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounds ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], minX: number, minY: number, maxX: number, maxY: number, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(columns, minX, minY, maxX, maxY, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounds ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], minX: number, minY: number, maxX: number, maxY: number, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(columns, minX, minY, maxX, maxY, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounds, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], minX: number, minY: number, maxX: number, maxY: number, orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(false, columns, minX, minY, maxX, maxY, orderBy, limit);
	}

	/**
	 * Query for features within the bounds, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], minX: number, minY: number, maxX: number, maxY: number, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(false, columns, minX, minY, maxX, maxY, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounds ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], minX: number, minY: number, maxX: number, maxY: number, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, minX, minY, maxX, maxY, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounds ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], minX: number, minY: number, maxX: number, maxY: number, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, minX, minY, maxX, maxY, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounds, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], minX: number, minY: number, maxX: number, maxY: number, orderBy: string, limit: number): FeatureResultSet {
		this.validateRTree();
		where: string = buildWhere(minX, minY, maxX, maxY);
		whereArgs: string[] = buildWhereArgs(minX, minY, maxX, maxY);
		return featureDao.queryInForChunk(distinct, columns, queryIdsSQL(where), whereArgs, orderBy, limit);
	}

	/**
	 * Query for features within the bounds, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], minX: number, minY: number, maxX: number, maxY: number, orderBy: string, limit: number, offset: number): FeatureResultSet {
		this.validateRTree();
		where: string = buildWhere(minX, minY, maxX, maxY);
		whereArgs: string[] = buildWhereArgs(minX, minY, maxX, maxY);
		return featureDao.queryInForChunk(distinct, columns, queryIdsSQL(where), whereArgs, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounds ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param fieldValues field values
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(minX: number, minY: number, maxX: number, maxY: number, fieldValues: ColumnValues, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(minX, minY, maxX, maxY, fieldValues, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounds ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param fieldValues field values
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(minX: number, minY: number, maxX: number, maxY: number, fieldValues: ColumnValues, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(minX, minY, maxX, maxY, fieldValues, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounds, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param fieldValues field values
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(minX: number, minY: number, maxX: number, maxY: number, fieldValues: ColumnValues, orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(false, minX, minY, maxX, maxY, fieldValues, orderBy, limit);
	}

	/**
	 * Query for features within the bounds, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param fieldValues field values
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(minX: number, minY: number, maxX: number, maxY: number, fieldValues: ColumnValues, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(false, minX, minY, maxX, maxY, fieldValues, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounds ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param fieldValues field values
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, minX: number, minY: number, maxX: number, maxY: number, fieldValues: ColumnValues, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, minX, minY, maxX, maxY, fieldValues, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounds ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param fieldValues field values
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, minX: number, minY: number, maxX: number, maxY: number, fieldValues: ColumnValues, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, minX, minY, maxX, maxY, fieldValues, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounds, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param fieldValues field values
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, minX: number, minY: number, maxX: number, maxY: number, fieldValues: ColumnValues, orderBy: string, limit: number): FeatureResultSet {
		this.validateRTree();
		where: string = buildWhere(minX, minY, maxX, maxY);
		whereArgs: string[] = buildWhereArgs(minX, minY, maxX, maxY);
		return featureDao.queryInForChunk(distinct, queryIdsSQL(where), whereArgs, fieldValues, orderBy, limit);
	}

	/**
	 * Query for features within the bounds, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param fieldValues field values
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, minX: number, minY: number, maxX: number, maxY: number, fieldValues: ColumnValues, orderBy: string, limit: number, offset: number): FeatureResultSet {
		this.validateRTree();
		where: string = buildWhere(minX, minY, maxX, maxY);
		whereArgs: string[] = buildWhereArgs(minX, minY, maxX, maxY);
		return featureDao.queryInForChunk(distinct, queryIdsSQL(where), whereArgs, fieldValues, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounds ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param fieldValues field values
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], minX: number, minY: number, maxX: number, maxY: number, fieldValues: ColumnValues, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(columns, minX, minY, maxX, maxY, fieldValues, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounds ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param fieldValues field values
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], minX: number, minY: number, maxX: number, maxY: number, fieldValues: ColumnValues, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(columns, minX, minY, maxX, maxY, fieldValues, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounds, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param fieldValues field values
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], minX: number, minY: number, maxX: number, maxY: number, fieldValues: ColumnValues, orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(false, columns, minX, minY, maxX, maxY, fieldValues, orderBy, limit);
	}

	/**
	 * Query for features within the bounds, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param fieldValues field values
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], minX: number, minY: number, maxX: number, maxY: number, fieldValues: ColumnValues, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(false, columns, minX, minY, maxX, maxY, fieldValues, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounds ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param fieldValues field values
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], minX: number, minY: number, maxX: number, maxY: number, fieldValues: ColumnValues, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, minX, minY, maxX, maxY, fieldValues, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounds ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param fieldValues field values
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], minX: number, minY: number, maxX: number, maxY: number, fieldValues: ColumnValues, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, minX, minY, maxX, maxY, fieldValues, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounds, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param fieldValues field values
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], minX: number, minY: number, maxX: number, maxY: number, fieldValues: ColumnValues, orderBy: string, limit: number): FeatureResultSet {
		this.validateRTree();
		where: string = buildWhere(minX, minY, maxX, maxY);
		whereArgs: string[] = buildWhereArgs(minX, minY, maxX, maxY);
		return featureDao.queryInForChunk(distinct, columns, queryIdsSQL(where), whereArgs, fieldValues, orderBy, limit);
	}

	/**
	 * Query for features within the bounds, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param fieldValues field values
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], minX: number, minY: number, maxX: number, maxY: number, fieldValues: ColumnValues, orderBy: string, limit: number, offset: number): FeatureResultSet {
		this.validateRTree();
		where: string = buildWhere(minX, minY, maxX, maxY);
		whereArgs: string[] = buildWhereArgs(minX, minY, maxX, maxY);
		return featureDao.queryInForChunk(distinct, columns, queryIdsSQL(where), whereArgs, fieldValues, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounds ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunkIdOrder(minX: number, minY: number, maxX: number, maxY: number, where: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(minX, minY, maxX, maxY, where, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounds ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunkIdOrder(minX: number, minY: number, maxX: number, maxY: number, where: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(minX, minY, maxX, maxY, where, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounds, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(minX: number, minY: number, maxX: number, maxY: number, where: string, orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(false, minX, minY, maxX, maxY, where, orderBy, limit);
	}

	/**
	 * Query for features within the bounds, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(minX: number, minY: number, maxX: number, maxY: number, where: string, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(false, minX, minY, maxX, maxY, where, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounds ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunkIdOrder(distinct: boolean, minX: number, minY: number, maxX: number, maxY: number, where: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, minX, minY, maxX, maxY, where, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounds ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunkIdOrder(distinct: boolean, minX: number, minY: number, maxX: number, maxY: number, where: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, minX, minY, maxX, maxY, where, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounds, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, minX: number, minY: number, maxX: number, maxY: number, where: string, orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, minX, minY, maxX, maxY, where, null, orderBy, limit);
	}

	/**
	 * Query for features within the bounds, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, minX: number, minY: number, maxX: number, maxY: number, where: string, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, minX, minY, maxX, maxY, where, null, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounds ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunkIdOrder(columns: string[], minX: number, minY: number, maxX: number, maxY: number, where: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(columns, minX, minY, maxX, maxY, where, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounds ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunkIdOrder(columns: string[], minX: number, minY: number, maxX: number, maxY: number, where: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(columns, minX, minY, maxX, maxY, where, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounds, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], minX: number, minY: number, maxX: number, maxY: number, where: string, orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(false, columns, minX, minY, maxX, maxY, where, orderBy, limit);
	}

	/**
	 * Query for features within the bounds, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], minX: number, minY: number, maxX: number, maxY: number, where: string, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(false, columns, minX, minY, maxX, maxY, where, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounds ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunkIdOrder(distinct: boolean, columns: string[], minX: number, minY: number, maxX: number, maxY: number, where: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, minX, minY, maxX, maxY, where, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounds ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunkIdOrder(distinct: boolean, columns: string[], minX: number, minY: number, maxX: number, maxY: number, where: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, minX, minY, maxX, maxY, where, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounds, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], minX: number, minY: number, maxX: number, maxY: number, where: string, orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, minX, minY, maxX, maxY, where, null, orderBy, limit);
	}

	/**
	 * Query for features within the bounds, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], minX: number, minY: number, maxX: number, maxY: number, where: string, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, minX, minY, maxX, maxY, where, null, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounds ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(minX: number, minY: number, maxX: number, maxY: number, where: string, whereArgs: string[], limit: number): FeatureResultSet {
		return queryFeaturesForChunk(minX, minY, maxX, maxY, where, whereArgs, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounds ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(minX: number, minY: number, maxX: number, maxY: number, where: string, whereArgs: string[], limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(minX, minY, maxX, maxY, where, whereArgs, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounds, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(minX: number, minY: number, maxX: number, maxY: number, where: string, whereArgs: string[], orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(false, minX, minY, maxX, maxY, where, whereArgs, orderBy, limit);
	}

	/**
	 * Query for features within the bounds, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(minX: number, minY: number, maxX: number, maxY: number, where: string, whereArgs: string[], orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(false, minX, minY, maxX, maxY, where, whereArgs, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounds ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, minX: number, minY: number, maxX: number, maxY: number, where: string, whereArgs: string[], limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, minX, minY, maxX, maxY, where, whereArgs, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounds ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, minX: number, minY: number, maxX: number, maxY: number, where: string, whereArgs: string[], limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, minX, minY, maxX, maxY, where, whereArgs, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounds, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, minX: number, minY: number, maxX: number, maxY: number, where: string, whereArgs: string[], orderBy: string, limit: number): FeatureResultSet {
		this.validateRTree();
		whereBounds: string = buildWhere(minX, minY, maxX, maxY);
		whereBoundsArgs: string[] = buildWhereArgs(minX, minY, maxX, maxY);
		return featureDao.queryInForChunk(distinct, queryIdsSQL(whereBounds), whereBoundsArgs, where, whereArgs, orderBy, limit);
	}

	/**
	 * Query for features within the bounds, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, minX: number, minY: number, maxX: number, maxY: number, where: string, whereArgs: string[], orderBy: string, limit: number, offset: number): FeatureResultSet {
		this.validateRTree();
		whereBounds: string = buildWhere(minX, minY, maxX, maxY);
		whereBoundsArgs: string[] = buildWhereArgs(minX, minY, maxX, maxY);
		return featureDao.queryInForChunk(distinct, queryIdsSQL(whereBounds), whereBoundsArgs, where, whereArgs, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounds ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], minX: number, minY: number, maxX: number, maxY: number, where: string, whereArgs: string[], limit: number): FeatureResultSet {
		return queryFeaturesForChunk(columns, minX, minY, maxX, maxY, where, whereArgs, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounds ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], minX: number, minY: number, maxX: number, maxY: number, where: string, whereArgs: string[], limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(columns, minX, minY, maxX, maxY, where, whereArgs, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounds, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], minX: number, minY: number, maxX: number, maxY: number, where: string, whereArgs: string[], orderBy: string, limit: number): FeatureResultSet {
		return queryFeaturesForChunk(false, columns, minX, minY, maxX, maxY, where, whereArgs, orderBy, limit);
	}

	/**
	 * Query for features within the bounds, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(columns: string[], minX: number, minY: number, maxX: number, maxY: number, where: string, whereArgs: string[], orderBy: string, limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(false, columns, minX, minY, maxX, maxY, where, whereArgs, orderBy, limit, offset);
	}

	/**
	 * Query for features within the bounds ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], minX: number, minY: number, maxX: number, maxY: number, where: string, whereArgs: string[], limit: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, minX, minY, maxX, maxY, where, whereArgs, getPkColumnName(), limit);
	}

	/**
	 * Query for features within the bounds ordered by id, starting at the
	 * offset and returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], minX: number, minY: number, maxX: number, maxY: number, where: string, whereArgs: string[], limit: number, offset: number): FeatureResultSet {
		return queryFeaturesForChunk(distinct, columns, minX, minY, maxX, maxY, where, whereArgs, getPkColumnName(), limit, offset);
	}

	/**
	 * Query for features within the bounds, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], minX: number, minY: number, maxX: number, maxY: number, where: string, whereArgs: string[], orderBy: string, limit: number): FeatureResultSet {
		this.validateRTree();
		whereBounds: string = buildWhere(minX, minY, maxX, maxY);
		whereBoundsArgs: string[] = buildWhereArgs(minX, minY, maxX, maxY);
		return featureDao.queryInForChunk(distinct, columns, queryIdsSQL(whereBounds), whereBoundsArgs, where, whereArgs, orderBy, limit);
	}

	/**
	 * Query for features within the bounds, starting at the offset and
	 * returning no more than the limit
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 * @since 6.2.0
	 */
	public queryFeaturesForChunk(distinct: boolean, columns: string[], minX: number, minY: number, maxX: number, maxY: number, where: string, whereArgs: string[], orderBy: string, limit: number, offset: number): FeatureResultSet {
		this.validateRTree();
		whereBounds: string = buildWhere(minX, minY, maxX, maxY);
		whereBoundsArgs: string[] = buildWhereArgs(minX, minY, maxX, maxY);
		return featureDao.queryInForChunk(distinct, columns, queryIdsSQL(whereBounds), whereBoundsArgs, where, whereArgs, orderBy, limit, offset);
	}

	/**
	 * Validate that the RTree extension exists for the table and column
	 */
	private validateRTree(): void {
		if (!has()) {
			throw new GeoPackageException("RTree Extension not found for feature table: " + this.featureDao.getTableName());
		}
	}

	/**
	 * Build a where clause from the bounds for overlapping ranges
	 *
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @return where clause
	 */
	private buildWhere(minX: number, minY: number, maxX: number, maxY: number): string {
		StringBuilder where = new StringBuilder();
		where.append(buildWhere(RTreeIndexExtension.COLUMN_MIN_X, maxX, "<="));
		where.append(" AND ");
		where.append(buildWhere(RTreeIndexExtension.COLUMN_MIN_Y, maxY, "<="));
		where.append(" AND ");
		where.append(buildWhere(RTreeIndexExtension.COLUMN_MAX_X, minX, ">="));
		where.append(" AND ");
		where.append(buildWhere(RTreeIndexExtension.COLUMN_MAX_Y, minY, ">="));

		return where.toString();
	}

	/**
	 * Build where arguments from the bounds to match the order in
	 * {@link #buildWhereArgs(double, double, double, double)}
	 * 
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @return where clause args
	 */
	private buildWhereArgs(minX: number, minY: number, maxX: number, maxY: number): string[] {
		minX -= tolerance;
		maxX += tolerance;
		minY -= tolerance;
		maxY += tolerance;
		return buildWhereArgs(new Object[] { maxX, maxY, minX, minY });
	}

}

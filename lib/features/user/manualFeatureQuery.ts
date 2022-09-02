import { Projection } from '@ngageoint/projections-js';
import { BoundingBox } from '../../boundingBox';
import { ColumnValues } from '../../dao/columnValues';
import { SQLUtils } from '../../db/sqlUtils';
import { FeatureDao } from './featureDao';
import { FeatureResultSet } from './featureResultSet';
import { ManualFeatureQueryResults } from './manualFeatureQueryResults';
import { DBValue } from '../../db/dbAdapter';
import { GeometryEnvelope } from '@ngageoint/simple-features-js';
import { FeatureRow } from './featureRow';
import { GeometryTransform } from '@ngageoint/simple-features-proj-js';

/**
 * Performs manual brute force queries against feature rows. See
 * {@link FeatureIndexManager} for performing indexed queries.
 */
export class ManualFeatureQuery {

	/**
	 * Feature DAO
	 */
	private readonly featureDao: FeatureDao;

	/**
	 * Query single chunk limit
	 */
	protected chunkLimit = 1000;

	/**
	 * Query range tolerance
	 */
	protected tolerance = .00000000000001;

	/**
	 * Constructor
	 * @param featureDao feature DAO
	 */
	public constructor(featureDao: FeatureDao) {
		this.featureDao = featureDao;
	}

	/**
	 * Get the feature DAO
	 * @return feature DAO
	 */
	public getFeatureDao(): FeatureDao {
		return this.featureDao;
	}

	/**
	 * Get the SQL query chunk limit
	 * @return chunk limit
	 */
	public getChunkLimit(): number {
		return this.chunkLimit;
	}

	/**
	 * Set the SQL query chunk limit
	 * @param chunkLimit chunk limit
	 */
	public setChunkLimit(chunkLimit: number): void {
		this.chunkLimit = chunkLimit;
	}

	/**
	 * Get the query range tolerance
	 * @return query range tolerance
	 */
	public getTolerance(): number {
		return this.tolerance;
	}

	/**
	 * Set the query range tolerance
	 * @param tolerance query range tolerance
	 */
	public setTolerance(tolerance: number): void {
		this.tolerance = tolerance;
	}

	/**
	 * Query for features
	 * @param distinct
	 * @param columns
	 * @param where
	 * @param whereArgs
	 * @param join
	 * @param groupBy
	 * @param having
	 * @param orderBy
	 * @param limit
	 * @param offset
	 */
	public query(distinct = false, columns: string[] = this.featureDao.getColumnNames(), where?: string, whereArgs?: any[], join?: string, groupBy?: string, having?: string, orderBy?: string, limit?: number, offset?: number): FeatureResultSet {
		return this.featureDao.query(distinct, columns);
	}

	/**
	 * Count of feature rows
	 * @param distinct
	 * @param columns
	 * @param where
	 * @param whereArgs
	 * @param join
	 * @param groupBy
	 * @param having
	 * @param orderBy
	 * @param limit
	 * @param offset
	 */
	public count(distinct = false, columns: string[] = this.featureDao.getColumnNames(), where?: string, whereArgs?: [] | DBValue[], join?: string, groupBy?: string, having?: string, orderBy?: string, limit?: number, offset?: number): number {
		return this.featureDao.count(distinct, columns, where, whereArgs, join, groupBy, having, orderBy, limit, offset);
	}

	/**
	 * Get the count of features with non null geometries
	 *
	 * @return count
	 */
	public countWithGeometries(): number {
		return this.featureDao.count(false, undefined, SQLUtils.quoteWrap(this.featureDao.getGeometryColumnName()) + " IS NOT NULL");
	}

	/**
	 * Get a count of results
	 *
	 * @param distinct
	 * @param column count column name
	 * @return count
	 */
	public countColumn(distinct = false, column: string): number {
		return this.featureDao.countColumn(distinct, column, undefined, undefined);
	}

	/**
	 * Query for features
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param fieldValues field values
	 * @return feature results
	 */
	public queryWithFieldValues(distinct: boolean, columns: string[], fieldValues: ColumnValues): FeatureResultSet {
		const where: string = this.featureDao.buildWhereWithFields(fieldValues);
		const whereArgs: any[] = this.featureDao.buildWhereArgs(fieldValues);
		return this.featureDao.query(distinct, columns, where, whereArgs);
	}

	/**
	 * Count features
	 * @param distinct distinct column values
	 * @param column count column name
	 * @param fieldValues field values
	 * @return count
	 */
	public countWithFieldValues(distinct: boolean = false, column: string, fieldValues: ColumnValues): number {
		const where: string = this.featureDao.buildWhereWithFields(fieldValues);
		const whereArgs: any[] = this.featureDao.buildWhereArgs(fieldValues);
		return this.featureDao.countColumn(distinct, column, where, whereArgs);
	}

	/**
	 * Manually build the bounds of the feature table
	 * @return bounding box
	 */
	public getBoundingBox(): BoundingBox {
		let envelope = null;
		let offset: number = 0;
		let hasResults = true;
		const columns: string[] = [this.featureDao.getGeometryColumnName()];
		while (hasResults) {
			hasResults = false;
			const resultSet = this.featureDao.queryForChunk(false, columns, undefined, undefined, undefined, undefined, undefined, this.chunkLimit, offset);
			while (resultSet.moveToNext()) {
				hasResults = true;
				const featureRow = resultSet.getRow();
				const featureEnvelope = featureRow.getGeometryEnvelope();
				if (featureEnvelope != null) {
					if (envelope == null) {
						envelope = featureEnvelope;
					} else {
						envelope = envelope.union(featureEnvelope);
					}
				}
			}
			offset += this.chunkLimit;
		}
		let boundingBox = null;
		if (envelope != null) {
			boundingBox = new BoundingBox(envelope);
		}
		return boundingBox;
	}

	/**
	 * Manually build the bounds of the feature table in the provided projection
	 * @param projection desired projection
	 * @return bounding box
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
	 * Manually query for rows within the bounding box
	 * @param boundingBox bounding box
	 * @param distinct distinct rows
	 * @param columns columns
	 * @return results
	 */
	public queryWithBoundingBox(distinct: boolean, columns: string[], boundingBox: BoundingBox): ManualFeatureQueryResults {
		return this.queryWithGeometryEnvelope(distinct, columns, boundingBox.buildEnvelope());
	}

	/**
	 * Manually count the rows within the bounding box
	 * @param boundingBox bounding box
	 * @return count
	 */
	public countWithBoundingBox(boundingBox: BoundingBox): number {
		return this.countWithGeometryEnvelope(boundingBox.buildEnvelope());
	}

	/**
	 * Manually query for rows within the bounding box
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param fieldValues field values
	 * @return results
	 */
	public queryWithBoundingBoxAndFieldValues(distinct: boolean, columns: string[], boundingBox: BoundingBox, fieldValues: ColumnValues): ManualFeatureQueryResults {
		return this.queryWithGeometryEnvelopeAndFieldValues(distinct, columns, boundingBox.buildEnvelope(), fieldValues);
	}

	/**
	 * Manually count the rows within the bounding box
	 * @param boundingBox bounding box
	 * @param fieldValues field values
	 * @return count
	 */
	public countWithBoundingBoxAndFieldValues(boundingBox: BoundingBox, fieldValues: ColumnValues): number {
		return this.countWithGeometryEnvelopeAndFieldValues(boundingBox.buildEnvelope(), fieldValues);
	}


	/**
	 * Manually query for rows within the bounding box in the provided
	 * projection
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @return results
	 */
	public queryWithBoundingBoxAndProjection(distinct: boolean, columns: string[], boundingBox: BoundingBox, projection: Projection): ManualFeatureQueryResults {
		const featureBoundingBox = this.featureDao.projectBoundingBox(boundingBox, projection);
		return this.queryWithBoundingBox(distinct, columns, featureBoundingBox);
	}

	/**
	 * Manually count the rows within the bounding box in the provided projection
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @return count
	 */
	public countWithBoundingBoxAndProjection(boundingBox: BoundingBox, projection: Projection): number {
		const featureBoundingBox = this.featureDao.projectBoundingBox(boundingBox, projection);
		return this.countWithBoundingBox(featureBoundingBox);
	}

	/**
	 * Manually query for rows within the bounding box in the provided
	 * projection
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param fieldValues field values
	 * @return results
	 */
	public queryWithBoundingBoxAndProjectionAndFieldValues(distinct: boolean, columns: string[], boundingBox: BoundingBox, projection: Projection, fieldValues: ColumnValues): ManualFeatureQueryResults {
		const featureBoundingBox = this.featureDao.projectBoundingBox(boundingBox, projection);
		return this.queryWithBoundingBoxAndFieldValues(distinct, columns, featureBoundingBox, fieldValues);
	}

	/**
	 * Manually count the rows within the bounding box in the provided
	 * projection
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param fieldValues field values
	 * @return count
	 */
	public countWithBoundingBoxAndProjectionAndFieldValues(boundingBox: BoundingBox, projection: Projection, fieldValues: ColumnValues): number {
		const featureBoundingBox = this.featureDao.projectBoundingBox(boundingBox, projection);
		return this.countWithBoundingBoxAndFieldValues(featureBoundingBox, fieldValues);
	}

	/**
	 * Manually query for rows within the bounding box in the provided
	 * projection
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @return results
	 */
	public queryWhereWithBoundingBoxAndProjection(distinct: boolean, columns: string[], boundingBox: BoundingBox, projection: Projection, where: string, whereArgs: any[]): ManualFeatureQueryResults {
		const featureBoundingBox = this.featureDao.projectBoundingBox(boundingBox, projection);
		return this.queryWhereWithBoundingBox(distinct, columns, featureBoundingBox, where, whereArgs);
	}

	/**
	 * Manually count the rows within the bounding box in the provided
	 * projection
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @return count
	 */
	public countWhereWithBoundingBoxAndProjection(boundingBox: BoundingBox, projection: Projection, where: string, whereArgs: any[]): number {
		const featureBoundingBox = this.featureDao.projectBoundingBox(boundingBox, projection);
		return this.countWhereWithBoundingBox(featureBoundingBox, where, whereArgs);
	}

	/**
	 * Manually query for rows within the geometry envelope
	 *
	 * @param envelope geometry envelope
	 * @param distinct distinct rows
	 * @param columns columns
	 * @return results
	 */
	public queryWithGeometryEnvelope(distinct: boolean, columns: string[], envelope: GeometryEnvelope): ManualFeatureQueryResults {
		return this.queryWithBounds(distinct, columns, envelope.minX, envelope.minY, envelope.maxX, envelope.maxY);
	}

	/**
	 * Manually count the rows within the geometry envelope
	 *
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param whereArgs where args
	 * @return count
	 */
	public countWithGeometryEnvelope(envelope: GeometryEnvelope, where?: string, whereArgs?: any[]): number {
		return this.countWithBounds(envelope.minX, envelope.minY, envelope.maxX, envelope.maxY, where, whereArgs);
	}
	
	/**
	 * Manually query for rows within the geometry envelope
	 *
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param fieldValues field values
	 * @return results
	 */
	public queryWithGeometryEnvelopeAndFieldValues(distinct: boolean, columns: string[], envelope: GeometryEnvelope, fieldValues: ColumnValues): ManualFeatureQueryResults {
		return this.queryWithBoundsAndFieldValues(distinct, columns, envelope.minX, envelope.minY, envelope.maxX, envelope.maxY, fieldValues);
	}

	/**
	 * Manually count the rows within the geometry envelope
	 * @param envelope geometry envelope
	 * @param fieldValues field values
	 * @return count
	 */
	public countWithGeometryEnvelopeAndFieldValues(envelope: GeometryEnvelope, fieldValues: ColumnValues): number {
		return this.countWithBoundsAndFieldValues(envelope.minX, envelope.minY, envelope.maxX, envelope.maxY, fieldValues);
	}

	/**
	 * Manually query for rows within the bounding box
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @return results
	 */
	public queryWhereWithBoundingBox(distinct: boolean, columns: string[], boundingBox: BoundingBox, where: string, whereArgs: any[]): ManualFeatureQueryResults {
		return this.queryWhereWithGeometryEnvelope(distinct, columns, boundingBox.buildEnvelope(), where, whereArgs);
	}

	/**
	 * Manually query for rows within the geometry envelope
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @return results
	 */
	public queryWhereWithGeometryEnvelope(distinct: boolean, columns: string[], envelope: GeometryEnvelope, where: string, whereArgs: any[]): ManualFeatureQueryResults {
		return this.queryWithBounds(distinct, columns, envelope.minX, envelope.minY, envelope.maxX, envelope.maxY, where, whereArgs);
	}

	/**
	 * Manually count the rows within the bounding box
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @return count
	 */
	public countWhereWithBoundingBox(boundingBox: BoundingBox, where: string, whereArgs: any[]): number {
		return this.countWhereWithGeometryEnvelope(boundingBox.buildEnvelope(), where, whereArgs);
	}

	/**
	 * Manually count the rows within the geometry envelope
	 *
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @return count
	 */
	public countWhereWithGeometryEnvelope(envelope: GeometryEnvelope, where: string, whereArgs: any[]): number {
		return this.countWithBounds(envelope.minX, envelope.minY, envelope.maxX, envelope.maxY, where, whereArgs);
	}

	/**
	 * Manually query for rows within the bounds
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param distinct distinct rows
	 * @param columns columns
	 * @return results
	 */
	public queryWithinBounds(minX: number, minY: number, maxX: number, maxY: number, distinct = false, columns: string[] = []): ManualFeatureQueryResults {
		return this.queryWithBounds(distinct, columns, minX, minY, maxX, maxY, null, null);
	}

	/**
	 * Manually count the rows within the bounds
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @return count
	 */
	public countWithinBounds(minX: number, minY: number, maxX: number, maxY: number): number {
		return this.queryWithinBounds(minX, minY, maxX, maxY).count();
	}

	/**
	 * Manually query for rows within the bounds
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param fieldValues field values
	 * @return results
	 */
	public queryWithBoundsAndFieldValues(distinct: boolean, columns: string[], minX: number, minY: number, maxX: number, maxY: number, fieldValues: ColumnValues): ManualFeatureQueryResults {
		const where = this.featureDao.buildWhereWithFields(fieldValues);
		const whereArgs = this.featureDao.buildWhereArgsWithValues(fieldValues);
		return this.queryWithBounds(distinct, columns, minX, minY, maxX, maxY, where, whereArgs);
	}

	/**
	 * Manually count the rows within the bounds
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param fieldValues field values
	 * @return count
	 */
	public countWithBoundsAndFieldValues(minX: number, minY: number, maxX: number, maxY: number, fieldValues: ColumnValues): number {
		const where = this.featureDao.buildWhereWithFields(fieldValues);
		const whereArgs = this.featureDao.buildWhereArgsWithValues(fieldValues);
		return this.countWithBounds(minX, minY, maxX, maxY, where, whereArgs);
	}


	/**
	 * Manually query for rows within the bounds
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param whereArgs where args
	 * @return results
	 */
	public queryWithBounds(distinct: boolean, columns: string[], minX: number, minY: number, maxX: number, maxY: number, where: string = undefined, whereArgs: any[] = undefined): ManualFeatureQueryResults {
		let featureIds = [];

		let offset = 0;
		let hasResults = true;

		minX -= this.tolerance;
		maxX += this.tolerance;
		minY -= this.tolerance;
		maxY += this.tolerance;

		let queryColumns = this.featureDao.getIdAndGeometryColumnNames();

		while (hasResults) {
			hasResults = false;

			let resultSet = this.featureDao.queryForChunk(distinct, queryColumns, where, whereArgs, undefined, undefined, undefined, this.chunkLimit, offset);

			while (resultSet.moveToNext()) {
				hasResults = true;

				const featureRow = resultSet.getRow();
				const envelope = featureRow.getGeometryEnvelope();
				if (envelope != null) {
					const minXMax = Math.max(minX, envelope.minX);
					const maxXMin = Math.min(maxX, envelope.maxX);
					const minYMax = Math.max(minY, envelope.minY);
					const maxYMin = Math.min(maxY, envelope.maxY);

					if (minXMax <= maxXMin && minYMax <= maxYMin) {
						featureIds.push(featureRow.getId());
					}

				}
			}
			offset += this.chunkLimit;
		}

		return new ManualFeatureQueryResults(this.featureDao, featureIds, columns);
	}

	/**
	 * Manually count the rows within the bounds
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param whereArgs where args
	 * @return count
	 */
	public countWithBounds(minX: number, minY: number, maxX: number, maxY: number, where?: string, whereArgs?: any[]): number {
		return this.queryWithBounds(undefined, undefined, minX, minY, maxX, maxY, where, whereArgs).count();
	}

	/**
	 * Query for features, starting at the offset and returning no more than the
	 * limit
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param fieldValues field values
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 */
	public queryForChunkWithFieldValues(distinct: boolean, columns: string[], fieldValues: ColumnValues, orderBy: string, limit: number, offset: number): FeatureResultSet {
		const where = this.featureDao.buildWhereWithFields(fieldValues);
		const whereArgs = this.featureDao.buildWhereArgsWithValues(fieldValues);
		return this.featureDao.queryForChunk(distinct, columns, where, whereArgs, undefined, undefined, orderBy, limit, offset);
	}

	/**
	 * Query for features, starting at the offset and returning no more than the limit
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 */
	public queryForChunk(distinct: boolean, columns: string[], where: string, whereArgs: any[], orderBy: string, limit: number, offset: number): FeatureResultSet {
		return this.featureDao.queryForChunk(distinct, columns, where, whereArgs, undefined, undefined, orderBy, limit, offset);
	}

	/**
	 * Manually query for rows within the geometry envelope, starting at the
	 * offset and returning no more than the limit
	 * <p>
	 * WARNING: This method must iterate from the 0 offset each time, is
	 * extremely inefficient, and not recommended for use
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 */
	public queryForChunkWithGeometryEnvelope(distinct: boolean, columns: string[], envelope: GeometryEnvelope, where: string, whereArgs: any[], orderBy: string, limit: number, offset: number): ManualFeatureQueryResults {
		return this.queryForChunkWithBounds(distinct, columns, envelope.minX, envelope.minY, envelope.maxX, envelope.maxY, where, whereArgs, orderBy, limit, offset);
	}

	/**
	 * Manually query for rows within the bounds, starting at the offset and
	 * returning no more than the limit
	 * <p>
	 * WARNING: This method must iterate from the 0 offset each time, is
	 * extremely inefficient, and not recommended for use
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param whereArgs where args
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 */
	public queryForChunkWithBounds(distinct: boolean, columns: string[], minX: number, minY: number, maxX: number, maxY: number, where: string, whereArgs: any[], orderBy: string, limit: number, offset: number): ManualFeatureQueryResults {
		let index = 0;
		let featureIds = [];

		let localOffset = 0;
		let hasResults = true;

		minX -= this.tolerance;
		maxX += this.tolerance;
		minY -= this.tolerance;
		maxY += this.tolerance;

		const queryColumns = this.featureDao.getIdAndGeometryColumnNames();

		while (hasResults) {

			hasResults = false;

			const resultSet: FeatureResultSet = this.featureDao.queryForChunk(distinct, queryColumns, where, whereArgs, undefined, undefined, orderBy, this.chunkLimit, localOffset);
			while (resultSet.moveToNext()) {
				hasResults = true;

				const featureRow: FeatureRow = resultSet.getRow();
				const envelope: GeometryEnvelope = featureRow.getGeometryEnvelope();
				if (envelope != null) {
					const minXMax = Math.max(minX, envelope.minX);
					const maxXMin = Math.min(maxX, envelope.maxX);
					const minYMax = Math.max(minY, envelope.minY);
					const maxYMin = Math.min(maxY, envelope.maxY);

					if (minXMax <= maxXMin && minYMax <= maxYMin) {
						if (offset <= index) {
							featureIds.push(featureRow.getId());
							if (featureIds.length >= limit) {
								break;
							}
						}
						index++;
					}

				}
			}

			localOffset += this.chunkLimit;
		}

		return new ManualFeatureQueryResults(this.featureDao, featureIds, columns);
	}

}

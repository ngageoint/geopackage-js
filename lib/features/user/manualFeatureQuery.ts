import { Projection } from '@ngageoint/projections-js';
import { BoundingBox } from '../../boundingBox';
import { FieldValues } from '../../dao/fieldValues';
import { SQLUtils } from '../../db/sqlUtils';
import { FeatureDao } from './featureDao';
import { FeatureResultSet } from './featureResultSet';
import { ManualFeatureQueryResults } from './manualFeatureQueryResults';
import { DBValue } from '../../db/dbValue';
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
	 * Query
	 * @param where
	 * @param whereArgs
	 * @param join
	 * @param groupBy
	 * @param having
	 * @param orderBy
	 * @param limit
	 * @param offset
	 */
	public query(where?: string, whereArgs?: any[], join?: string, groupBy?: string, having?: string, orderBy?: string, limit?: number, offset?: number): FeatureResultSet {
		return this.featureDao.query(where, whereArgs, join, groupBy, having, orderBy, limit, offset);
	}

	/**
	 * Query
	 * @param distinct
	 * @param where
	 * @param whereArgs
	 * @param join
	 * @param groupBy
	 * @param having
	 * @param orderBy
	 * @param limit
	 * @param offset
	 */
	public queryWithDistinct(distinct: boolean, where?: string, whereArgs?: any[], join?: string, groupBy?: string, having?: string, orderBy?: string, limit?: number, offset?: number): FeatureResultSet {
		return this.featureDao.queryWithDistinct(distinct, where, whereArgs, join, groupBy, having, orderBy, limit, offset);
	}

	/**
	 * Query
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
	public queryWithColumns(columns: string[], where?: string, whereArgs?: any[], join?: string, groupBy?: string, having?: string, orderBy?: string, limit?: number, offset?: number): FeatureResultSet {
		return this.featureDao.queryWithColumns(columns, where, whereArgs, join, groupBy, having, orderBy, limit, offset);
	}

	/**
	 * Query
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
	public queryWithDistinctAndColumns(distinct = false, columns: string[] = this.featureDao.getColumnNames(), where?: string, whereArgs?: any[], join?: string, groupBy?: string, having?: string, orderBy?: string, limit?: number, offset?: number): FeatureResultSet {
		return this.featureDao.queryWithDistinctAndColumns(distinct, columns, where, whereArgs, join, groupBy, having, orderBy, limit, offset);
	}


	/**
	 * Count of feature rows
	 * @param where
	 * @param whereArgs
	 * @param join
	 * @param groupBy
	 * @param having
	 * @param orderBy
	 * @param limit
	 * @param offset
	 */
	public count(where?: string, whereArgs?: [] | DBValue[], join?: string, groupBy?: string, having?: string, orderBy?: string, limit?: number, offset?: number): number {
		return this.countWithDistinctAndColumns(undefined, undefined, where, whereArgs, join, groupBy, having, orderBy, limit, offset);
	}

	/**
	 * Count of feature rows
	 * @param distinct
	 * @param where
	 * @param whereArgs
	 * @param join
	 * @param groupBy
	 * @param having
	 * @param orderBy
	 * @param limit
	 * @param offset
	 */
	public countWithDistinct(distinct = false, where?: string, whereArgs?: [] | DBValue[], join?: string, groupBy?: string, having?: string, orderBy?: string, limit?: number, offset?: number): number {
		return this.countWithDistinctAndColumns(distinct, undefined, where, whereArgs, join, groupBy, having, orderBy, limit, offset);
	}

	/**
	 * Count of feature rows
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
	public countWithColumns(columns: string[] = this.featureDao.getColumnNames(), where?: string, whereArgs?: [] | DBValue[], join?: string, groupBy?: string, having?: string, orderBy?: string, limit?: number, offset?: number): number {
		return this.countWithDistinctAndColumns(undefined, columns, where, whereArgs, join, groupBy, having, orderBy, limit, offset);
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
	public countWithDistinctAndColumns(distinct = false, columns: string[] = this.featureDao.getColumnNames(), where?: string, whereArgs?: [] | DBValue[], join?: string, groupBy?: string, having?: string, orderBy?: string, limit?: number, offset?: number): number {
		return this.featureDao.countWithDistinctAndColumns(distinct, columns, where, whereArgs, join, groupBy, having, orderBy, limit, offset);
	}

	/**
	 * Get the count of features with non null geometries
	 *
	 * @return count
	 */
	public countWithGeometries(): number {
		return this.featureDao.count(SQLUtils.quoteWrap(this.featureDao.getGeometryColumnName()) + " IS NOT NULL");
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
	 * @param fieldValues field values
	 * @return feature results
	 */
	public queryWithFieldValues(fieldValues: FieldValues): FeatureResultSet {
		return this.queryWithFieldValuesAndDistinctAndColumns(undefined, undefined, fieldValues);
	}

	/**
	 * Query for features
	 * @param distinct distinct rows
	 * @param fieldValues field values
	 * @return feature results
	 */
	public queryWithFieldValuesAndDistinct(distinct: boolean, fieldValues: FieldValues): FeatureResultSet {
		return this.queryWithFieldValuesAndDistinctAndColumns(distinct, undefined, fieldValues);
	}

	/**
	 * Query for features
	 * @param columns columns
	 * @param fieldValues field values
	 * @return feature results
	 */
	public queryWithFieldValuesAndColumns(columns: string[], fieldValues: FieldValues): FeatureResultSet {
		return this.queryWithFieldValuesAndDistinctAndColumns(undefined, columns, fieldValues);
	}

	/**
	 * Query for features
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param fieldValues field values
	 * @return feature results
	 */
	public queryWithFieldValuesAndDistinctAndColumns(distinct: boolean, columns: string[], fieldValues: FieldValues): FeatureResultSet {
		const where: string = this.featureDao.buildWhereWithFields(fieldValues);
		const whereArgs: any[] = this.featureDao.buildWhereArgs(fieldValues);
		return this.featureDao.queryInWithDistinctAndColumns(distinct, columns, where, whereArgs);
	}

	/**
	 * Count features
	 * @param distinct distinct column values
	 * @param column count column name
	 * @param fieldValues field values
	 * @return count
	 */
	public countWithFieldValues(distinct: boolean = false, column: string, fieldValues: FieldValues): number {
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
			const resultSet = this.featureDao.queryForChunkWithColumns(columns, undefined, undefined, undefined, undefined, undefined, this.chunkLimit, offset);
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
	 * @return results
	 */
	public queryWithBoundingBox(boundingBox: BoundingBox): ManualFeatureQueryResults {
		return this.queryWithGeometryEnvelope(boundingBox.buildEnvelope());
	}

	/**
	 * Manually query for rows within the bounding box
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @return results
	 */
	public queryWithBoundingBoxAndDistinct(distinct: boolean, boundingBox: BoundingBox): ManualFeatureQueryResults {
		return this.queryWithGeometryEnvelopeAndDistinct(distinct, boundingBox.buildEnvelope());
	}

	/**
	 * Manually query for rows within the bounding box
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @return results
	 */
	public queryWithBoundingBoxAndColumns(columns: string[], boundingBox: BoundingBox): ManualFeatureQueryResults {
		return this.queryWithGeometryEnvelopeAndColumns(columns, boundingBox.buildEnvelope());
	}

	/**
	 * Manually query for rows within the bounding box
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @return results
	 */
	public queryWithBoundingBoxAndDistinctAndColumns(distinct: boolean, columns: string[], boundingBox: BoundingBox): ManualFeatureQueryResults {
		return this.queryWithGeometryEnvelopeAndDistinctAndColumns(distinct, columns, boundingBox.buildEnvelope());
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
	 * @param boundingBox bounding box
	 * @param fieldValues field values
	 * @return results
	 */
	public queryWithBoundingBoxAndFieldValues(boundingBox: BoundingBox, fieldValues: FieldValues): ManualFeatureQueryResults {
		return this.queryWithGeometryEnvelopeAndFieldValues(boundingBox.buildEnvelope(), fieldValues);
	}

	/**
	 * Manually query for rows within the bounding box
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param fieldValues field values
	 * @return results
	 */
	public queryWithBoundingBoxAndFieldValuesAndDistinct(distinct: boolean, boundingBox: BoundingBox, fieldValues: FieldValues): ManualFeatureQueryResults {
		return this.queryWithGeometryEnvelopeAndFieldValuesAndDistinct(distinct, boundingBox.buildEnvelope(), fieldValues);
	}

	/**
	 * Manually query for rows within the bounding box
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param fieldValues field values
	 * @return results
	 */
	public queryWithBoundingBoxAndFieldValuesAndColumns(columns: string[], boundingBox: BoundingBox, fieldValues: FieldValues): ManualFeatureQueryResults {
		return this.queryWithGeometryEnvelopeAndFieldValuesAndColumns(columns, boundingBox.buildEnvelope(), fieldValues);
	}

	/**
	 * Manually query for rows within the bounding box
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param fieldValues field values
	 * @return results
	 */
	public queryWithBoundingBoxAndFieldValuesAndDistinctAndColumns(distinct: boolean, columns: string[], boundingBox: BoundingBox, fieldValues: FieldValues): ManualFeatureQueryResults {
		return this.queryWithGeometryEnvelopeAndFieldValuesAndDistinctAndColumns(distinct, columns, boundingBox.buildEnvelope(), fieldValues);
	}

	/**
	 * Manually count the rows within the bounding box
	 * @param boundingBox bounding box
	 * @param fieldValues field values
	 * @return count
	 */
	public countWithBoundingBoxAndFieldValues(boundingBox: BoundingBox, fieldValues: FieldValues): number {
		return this.countWithGeometryEnvelopeAndFieldValues(boundingBox.buildEnvelope(), fieldValues);
	}

	/**
	 * Manually query for rows within the bounding box in the provided
	 * projection
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @return results
	 */
	public queryWithBoundingBoxAndProjection(boundingBox: BoundingBox, projection: Projection): ManualFeatureQueryResults {
		return this.queryWithBoundingBoxAndProjectionAndDistinctAndColumns(undefined, undefined, boundingBox, projection);
	}

	/**
	 * Manually query for rows within the bounding box in the provided
	 * projection
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @return results
	 */
	public queryWithBoundingBoxAndProjectionAndDistinct(distinct: boolean, boundingBox: BoundingBox, projection: Projection): ManualFeatureQueryResults {
		return this.queryWithBoundingBoxAndProjectionAndDistinctAndColumns(distinct, undefined, boundingBox, projection);
	}

	/**
	 * Manually query for rows within the bounding box in the provided
	 * projection
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @return results
	 */
	public queryWithBoundingBoxAndProjectionAndColumns(columns: string[], boundingBox: BoundingBox, projection: Projection): ManualFeatureQueryResults {
		return this.queryWithBoundingBoxAndProjectionAndDistinctAndColumns(undefined, columns, boundingBox, projection);
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
	public queryWithBoundingBoxAndProjectionAndDistinctAndColumns(distinct: boolean, columns: string[], boundingBox: BoundingBox, projection: Projection): ManualFeatureQueryResults {
		const featureBoundingBox = this.featureDao.projectBoundingBox(boundingBox, projection);
		return this.queryWithBoundingBoxAndDistinctAndColumns(distinct, columns, featureBoundingBox);
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
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param fieldValues field values
	 * @return results
	 */
	public queryWithBoundingBoxAndProjectionAndFieldValues(boundingBox: BoundingBox, projection: Projection, fieldValues: FieldValues): ManualFeatureQueryResults {
		return this.queryWithBoundingBoxAndProjectionAndFieldValuesAndDistinctAndColumns(undefined, undefined, boundingBox, projection, fieldValues);
	}

	/**
	 * Manually query for rows within the bounding box in the provided
	 * projection
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param fieldValues field values
	 * @return results
	 */
	public queryWithBoundingBoxAndProjectionAndFieldValuesAndDistinct(distinct: boolean, boundingBox: BoundingBox, projection: Projection, fieldValues: FieldValues): ManualFeatureQueryResults {
		return this.queryWithBoundingBoxAndProjectionAndFieldValuesAndDistinctAndColumns(distinct, undefined, boundingBox, projection, fieldValues);
	}

	/**
	 * Manually query for rows within the bounding box in the provided
	 * projection
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param fieldValues field values
	 * @return results
	 */
	public queryWithBoundingBoxAndProjectionAndFieldValuesAndColumns(columns: string[], boundingBox: BoundingBox, projection: Projection, fieldValues: FieldValues): ManualFeatureQueryResults {
		return this.queryWithBoundingBoxAndProjectionAndFieldValuesAndDistinctAndColumns(undefined, columns, boundingBox, projection, fieldValues);
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
	public queryWithBoundingBoxAndProjectionAndFieldValuesAndDistinctAndColumns(distinct: boolean, columns: string[], boundingBox: BoundingBox, projection: Projection, fieldValues: FieldValues): ManualFeatureQueryResults {
		const featureBoundingBox = this.featureDao.projectBoundingBox(boundingBox, projection);
		return this.queryWithBoundingBoxAndFieldValuesAndDistinctAndColumns(distinct, columns, featureBoundingBox, fieldValues);
	}

	/**
	 * Manually count the rows within the bounding box in the provided
	 * projection
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param fieldValues field values
	 * @return count
	 */
	public countWithBoundingBoxAndProjectionAndFieldValues(boundingBox: BoundingBox, projection: Projection, fieldValues: FieldValues): number {
		const featureBoundingBox = this.featureDao.projectBoundingBox(boundingBox, projection);
		return this.countWithBoundingBoxAndFieldValues(featureBoundingBox, fieldValues);
	}

	/**
	 * Manually query for rows within the bounding box in the provided
	 * projection
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @return results
	 */
	public queryWhereWithBoundingBoxAndProjection(boundingBox: BoundingBox, projection: Projection, where: string, whereArgs: any[]): ManualFeatureQueryResults {
		const featureBoundingBox = this.featureDao.projectBoundingBox(boundingBox, projection);
		return this.queryWhereWithBoundingBox(featureBoundingBox, where, whereArgs);
	}

	/**
	 * Manually query for rows within the bounding box in the provided
	 * projection
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @return results
	 */
	public queryWhereWithBoundingBoxAndProjectionAndDistinct(distinct: boolean, boundingBox: BoundingBox, projection: Projection, where: string, whereArgs: any[]): ManualFeatureQueryResults {
		const featureBoundingBox = this.featureDao.projectBoundingBox(boundingBox, projection);
		return this.queryWhereWithBoundingBoxAndDistinct(distinct, featureBoundingBox, where, whereArgs);
	}

	/**
	 * Manually query for rows within the bounding box in the provided
	 * projection
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param projection: Projection
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @return results
	 */
	public queryWhereWithBoundingBoxAndProjectionAndColumns(columns: string[], boundingBox: BoundingBox, projection: Projection, where: string, whereArgs: any[]): ManualFeatureQueryResults {
		const featureBoundingBox = this.featureDao.projectBoundingBox(boundingBox, projection);
		return this.queryWhereWithBoundingBoxAndColumns(columns, featureBoundingBox, where, whereArgs);
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
	public queryWhereWithBoundingBoxAndProjectionAndDistinctAndColumns(distinct: boolean, columns: string[], boundingBox: BoundingBox, projection: Projection, where: string, whereArgs: any[]): ManualFeatureQueryResults {
		const featureBoundingBox = this.featureDao.projectBoundingBox(boundingBox, projection);
		return this.queryWhereWithBoundingBoxAndDistinctAndColumns(distinct, columns, featureBoundingBox, where, whereArgs);
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
	 * @param envelope geometry envelope
	 * @return results
	 */
	public queryWithGeometryEnvelope(envelope: GeometryEnvelope): ManualFeatureQueryResults {
		return this.queryWithBounds(envelope.minX, envelope.minY, envelope.maxX, envelope.maxY);
	}

	/**
	 * Manually query for rows within the geometry envelope
	 * @param envelope geometry envelope
	 * @param distinct distinct rows
	 * @return results
	 */
	public queryWithGeometryEnvelopeAndDistinct(distinct: boolean, envelope: GeometryEnvelope): ManualFeatureQueryResults {
		return this.queryWithBoundsAndDistinct(distinct, envelope.minX, envelope.minY, envelope.maxX, envelope.maxY);
	}

	/**
	 * Manually query for rows within the geometry envelope
	 * @param envelope geometry envelope
	 * @param columns columns
	 * @return results
	 */
	public queryWithGeometryEnvelopeAndColumns(columns: string[], envelope: GeometryEnvelope): ManualFeatureQueryResults {
		return this.queryWithBoundsAndColumns(columns, envelope.minX, envelope.minY, envelope.maxX, envelope.maxY);
	}

	/**
	 * Manually query for rows within the geometry envelope
	 * @param envelope geometry envelope
	 * @param distinct distinct rows
	 * @param columns columns
	 * @return results
	 */
	public queryWithGeometryEnvelopeAndDistinctAndColumns(distinct: boolean, columns: string[], envelope: GeometryEnvelope): ManualFeatureQueryResults {
		return this.queryWithBoundsAndDistinctAndColumns(distinct, columns, envelope.minX, envelope.minY, envelope.maxX, envelope.maxY);
	}

	/**
	 * Manually count the rows within the geometry envelope
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
	 * @param envelope geometry envelope
	 * @param fieldValues field values
	 * @return results
	 */
	public queryWithGeometryEnvelopeAndFieldValues(envelope: GeometryEnvelope, fieldValues: FieldValues): ManualFeatureQueryResults {
		return this.queryWithBoundsAndFieldValues(envelope.minX, envelope.minY, envelope.maxX, envelope.maxY, fieldValues);
	}

	/**
	 * Manually query for rows within the geometry envelope
	 * @param distinct distinct rows
	 * @param envelope geometry envelope
	 * @param fieldValues field values
	 * @return results
	 */
	public queryWithGeometryEnvelopeAndFieldValuesAndDistinct(distinct: boolean, envelope: GeometryEnvelope, fieldValues: FieldValues): ManualFeatureQueryResults {
		return this.queryWithBoundsAndFieldValuesAndDistinct(distinct, envelope.minX, envelope.minY, envelope.maxX, envelope.maxY, fieldValues);
	}

	/**
	 * Manually query for rows within the geometry envelope
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param fieldValues field values
	 * @return results
	 */
	public queryWithGeometryEnvelopeAndFieldValuesAndColumns(columns: string[], envelope: GeometryEnvelope, fieldValues: FieldValues): ManualFeatureQueryResults {
		return this.queryWithBoundsAndFieldValuesAndColumns(columns, envelope.minX, envelope.minY, envelope.maxX, envelope.maxY, fieldValues);
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
	public queryWithGeometryEnvelopeAndFieldValuesAndDistinctAndColumns(distinct: boolean, columns: string[], envelope: GeometryEnvelope, fieldValues: FieldValues): ManualFeatureQueryResults {
		return this.queryWithBoundsAndFieldValuesAndDistinctAndColumns(distinct, columns, envelope.minX, envelope.minY, envelope.maxX, envelope.maxY, fieldValues);
	}

	/**
	 * Manually count the rows within the geometry envelope
	 * @param envelope geometry envelope
	 * @param fieldValues field values
	 * @return count
	 */
	public countWithGeometryEnvelopeAndFieldValues(envelope: GeometryEnvelope, fieldValues: FieldValues): number {
		return this.countWithBoundsAndFieldValues(envelope.minX, envelope.minY, envelope.maxX, envelope.maxY, fieldValues);
	}

	/**
	 * Manually query for rows within the bounding box
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @return results
	 */
	public queryWhereWithBoundingBox(boundingBox: BoundingBox, where: string, whereArgs: any[]): ManualFeatureQueryResults {
		return this.queryWhereWithGeometryEnvelope(boundingBox.buildEnvelope(), where, whereArgs);
	}

	/**
	 * Manually query for rows within the bounding box
	 * @param distinct distinct rows
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @return results
	 */
	public queryWhereWithBoundingBoxAndDistinct(distinct: boolean, boundingBox: BoundingBox, where: string, whereArgs: any[]): ManualFeatureQueryResults {
		return this.queryWhereWithGeometryEnvelopeAndDistinct(distinct, boundingBox.buildEnvelope(), where, whereArgs);
	}

	/**
	 * Manually query for rows within the bounding box
	 * @param columns columns
	 * @param boundingBox bounding box
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @return results
	 */
	public queryWhereWithBoundingBoxAndColumns(columns: string[], boundingBox: BoundingBox, where: string, whereArgs: any[]): ManualFeatureQueryResults {
		return this.queryWhereWithGeometryEnvelopeAndColumns(columns, boundingBox.buildEnvelope(), where, whereArgs);
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
	public queryWhereWithBoundingBoxAndDistinctAndColumns(distinct: boolean, columns: string[], boundingBox: BoundingBox, where: string, whereArgs: any[]): ManualFeatureQueryResults {
		return this.queryWhereWithGeometryEnvelopeAndDistinctAndColumns(distinct, columns, boundingBox.buildEnvelope(), where, whereArgs);
	}

	/**
	 * Manually query for rows within the geometry envelope
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @return results
	 */
	public queryWhereWithGeometryEnvelope(envelope: GeometryEnvelope, where: string, whereArgs: any[]): ManualFeatureQueryResults {
		return this.queryWithBounds(envelope.minX, envelope.minY, envelope.maxX, envelope.maxY, where, whereArgs);
	}

	/**
	 * Manually query for rows within the geometry envelope
	 * @param distinct distinct rows
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @return results
	 */
	public queryWhereWithGeometryEnvelopeAndDistinct(distinct: boolean, envelope: GeometryEnvelope, where: string, whereArgs: any[]): ManualFeatureQueryResults {
		return this.queryWithBoundsAndDistinct(distinct, envelope.minX, envelope.minY, envelope.maxX, envelope.maxY, where, whereArgs);
	}

	/**
	 * Manually query for rows within the geometry envelope
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @return results
	 */
	public queryWhereWithGeometryEnvelopeAndColumns(columns: string[], envelope: GeometryEnvelope, where: string, whereArgs: any[]): ManualFeatureQueryResults {
		return this.queryWithBoundsAndColumns(columns, envelope.minX, envelope.minY, envelope.maxX, envelope.maxY, where, whereArgs);
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
	public queryWhereWithGeometryEnvelopeAndDistinctAndColumns(distinct: boolean, columns: string[], envelope: GeometryEnvelope, where: string, whereArgs: any[]): ManualFeatureQueryResults {
		return this.queryWithBoundsAndDistinctAndColumns(distinct, columns, envelope.minX, envelope.minY, envelope.maxX, envelope.maxY, where, whereArgs);
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
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @return results
	 */
	public queryWithinBounds(minX: number, minY: number, maxX: number, maxY: number): ManualFeatureQueryResults {
		return this.queryWithBounds(minX, minY, maxX, maxY);
	}

	/**
	 * Manually query for rows within the bounds
	 * @param distinct distinct rows
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @return results
	 */
	public queryWithinBoundsWithDistinct(distinct = false, minX: number, minY: number, maxX: number, maxY: number): ManualFeatureQueryResults {
		return this.queryWithBoundsAndDistinct(distinct, minX, minY, maxX, maxY);
	}

	/**
	 * Manually query for rows within the bounds
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @return results
	 */
	public queryWithinBoundWithColumns(columns: string[] = [], minX: number, minY: number, maxX: number, maxY: number): ManualFeatureQueryResults {
		return this.queryWithBoundsAndColumns(columns, minX, minY, maxX, maxY);
	}

	/**
	 * Manually query for rows within the bounds
	 * @param distinct distinct rows
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @return results
	 */
	public queryWithinBoundsWithDistinctAndColumns(distinct = false, columns: string[] = [], minX: number, minY: number, maxX: number, maxY: number): ManualFeatureQueryResults {
		return this.queryWithBoundsAndDistinctAndColumns(distinct, columns, minX, minY, maxX, maxY);
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
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param fieldValues field values
	 * @return results
	 */
	public queryWithBoundsAndFieldValues(minX: number, minY: number, maxX: number, maxY: number, fieldValues: FieldValues): ManualFeatureQueryResults {
		return this.queryWithBoundsAndFieldValuesAndDistinctAndColumns(undefined, undefined, minX, minY, maxX, maxY, fieldValues);
	}

	/**
	 * Manually query for rows within the bounds
	 * @param distinct distinct rows
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param fieldValues field values
	 * @return results
	 */
	public queryWithBoundsAndFieldValuesAndDistinct(distinct: boolean, minX: number, minY: number, maxX: number, maxY: number, fieldValues: FieldValues): ManualFeatureQueryResults {
		return this.queryWithBoundsAndFieldValuesAndDistinctAndColumns(distinct, undefined, minX, minY, maxX, maxY, fieldValues);

	}

	/**
	 * Manually query for rows within the bounds
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param fieldValues field values
	 * @return results
	 */
	public queryWithBoundsAndFieldValuesAndColumns(columns: string[], minX: number, minY: number, maxX: number, maxY: number, fieldValues: FieldValues): ManualFeatureQueryResults {
		return this.queryWithBoundsAndFieldValuesAndDistinctAndColumns(undefined, columns, minX, minY, maxX, maxY, fieldValues);
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
	public queryWithBoundsAndFieldValuesAndDistinctAndColumns(distinct: boolean, columns: string[], minX: number, minY: number, maxX: number, maxY: number, fieldValues: FieldValues): ManualFeatureQueryResults {
		const where = this.featureDao.buildWhereWithFields(fieldValues);
		const whereArgs = this.featureDao.buildWhereArgsWithValues(fieldValues);
		return this.queryWithBoundsAndDistinctAndColumns(distinct, columns, minX, minY, maxX, maxY, where, whereArgs);
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
	public countWithBoundsAndFieldValues(minX: number, minY: number, maxX: number, maxY: number, fieldValues: FieldValues): number {
		const where = this.featureDao.buildWhereWithFields(fieldValues);
		const whereArgs = this.featureDao.buildWhereArgsWithValues(fieldValues);
		return this.countWithBounds(minX, minY, maxX, maxY, where, whereArgs);
	}

	/**
	 * Manually query for rows within the bounds
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param whereArgs where args
	 * @return results
	 */
	public queryWithBounds(minX: number, minY: number, maxX: number, maxY: number, where: string = undefined, whereArgs: any[] = undefined): ManualFeatureQueryResults {
		return this.queryWithBoundsAndDistinctAndColumns(undefined, undefined, minX, minY, maxX, maxY, where, whereArgs);
	}

	/**
	 * Manually query for rows within the bounds
	 * @param distinct distinct rows
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param whereArgs where args
	 * @return results
	 */
	public queryWithBoundsAndDistinct(distinct: boolean, minX: number, minY: number, maxX: number, maxY: number, where: string = undefined, whereArgs: any[] = undefined): ManualFeatureQueryResults {
		return this.queryWithBoundsAndDistinctAndColumns(distinct, undefined, minX, minY, maxX, maxY, where, whereArgs);
	}

	/**
	 * Manually query for rows within the bounds
	 * @param columns columns
	 * @param minX min x
	 * @param minY min y
	 * @param maxX max x
	 * @param maxY max y
	 * @param where where clause
	 * @param whereArgs where args
	 * @return results
	 */
	public queryWithBoundsAndColumns(columns: string[], minX: number, minY: number, maxX: number, maxY: number, where: string = undefined, whereArgs: any[] = undefined): ManualFeatureQueryResults {
		return this.queryWithBoundsAndDistinctAndColumns(undefined, columns, minX, minY, maxX, maxY, where, whereArgs);
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
	public queryWithBoundsAndDistinctAndColumns(distinct: boolean, columns: string[], minX: number, minY: number, maxX: number, maxY: number, where: string = undefined, whereArgs: any[] = undefined): ManualFeatureQueryResults {
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

			let resultSet = this.featureDao.queryForChunkWithDistinctAndColumns(distinct, queryColumns, where, whereArgs, undefined, undefined, undefined, this.chunkLimit, offset);

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
		return this.queryWithBounds(minX, minY, maxX, maxY, where, whereArgs).count();
	}

	/**
	 * Query for features, starting at the offset and returning no more than the
	 * limit
	 * @param fieldValues field values
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 */
	public queryForChunkWithFieldValues(fieldValues: FieldValues, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return this.queryForChunkWithFieldValuesAndDistinctAndColumns(undefined, undefined, fieldValues, orderBy, limit, offset);
	}

	/**
	 * Query for features, starting at the offset and returning no more than the
	 * limit
	 * @param distinct distinct rows
	 * @param fieldValues field values
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 */
	public queryForChunkWithFieldValuesAndDistinct(distinct: boolean, fieldValues: FieldValues, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return this.queryForChunkWithFieldValuesAndDistinctAndColumns(distinct, undefined, fieldValues, orderBy, limit, offset);
	}

	/**
	 * Query for features, starting at the offset and returning no more than the
	 * limit
	 * @param columns columns
	 * @param fieldValues field values
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 */
	public queryForChunkWithFieldValuesAndColumns(columns: string[], fieldValues: FieldValues, orderBy: string, limit: number, offset: number): FeatureResultSet {
		return this.queryForChunkWithFieldValuesAndDistinctAndColumns(undefined, columns, fieldValues, orderBy, limit, offset);
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
	public queryForChunkWithFieldValuesAndDistinctAndColumns(distinct: boolean, columns: string[], fieldValues: FieldValues, orderBy: string, limit: number, offset: number): FeatureResultSet {
		const where = this.featureDao.buildWhereWithFields(fieldValues);
		const whereArgs = this.featureDao.buildWhereArgsWithValues(fieldValues);
		return this.featureDao.queryForChunkWithDistinctAndColumns(distinct, columns, where, whereArgs, undefined, undefined, orderBy, limit, offset);
	}

	/**
	 * Query for features, starting at the offset and returning no more than the limit
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 */
	public queryForChunk(where: string, whereArgs: any[], orderBy: string, limit: number, offset: number): FeatureResultSet {
		return this.featureDao.queryForChunk(where, whereArgs, undefined, undefined, orderBy, limit, offset);
	}

	/**
	 * Query for features, starting at the offset and returning no more than the limit
	 * @param distinct distinct rows
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 */
	public queryForChunkWithDistinct(distinct: boolean, where: string, whereArgs: any[], orderBy: string, limit: number, offset: number): FeatureResultSet {
		return this.featureDao.queryForChunkWithDistinct(distinct, where, whereArgs, undefined, undefined, orderBy, limit, offset);
	}

	/**
	 * Query for features, starting at the offset and returning no more than the limit
	 * @param columns columns
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return feature results
	 */
	public queryForChunkWithColumns(columns: string[], where: string, whereArgs: any[], orderBy: string, limit: number, offset: number): FeatureResultSet {
		return this.featureDao.queryForChunkWithColumns(columns, where, whereArgs, undefined, undefined, orderBy, limit, offset);
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
	public queryForChunkWithDistinctAndColumns(distinct: boolean, columns: string[], where: string, whereArgs: any[], orderBy: string, limit: number, offset: number): FeatureResultSet {
		return this.featureDao.queryForChunkWithDistinctAndColumns(distinct, columns, where, whereArgs, undefined, undefined, orderBy, limit, offset);
	}

	/**
	 * Manually query for rows within the geometry envelope, starting at the
	 * offset and returning no more than the limit
	 * <p>
	 * WARNING: This method must iterate from the 0 offset each time, is
	 * extremely inefficient, and not recommended for use
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 */
	public queryForChunkWithGeometryEnvelope(envelope: GeometryEnvelope, where: string, whereArgs: any[], orderBy: string, limit: number, offset: number): ManualFeatureQueryResults {
		return this.queryForChunkWithBounds(envelope.minX, envelope.minY, envelope.maxX, envelope.maxY, where, whereArgs, orderBy, limit, offset);
	}

	/**
	 * Manually query for rows within the geometry envelope, starting at the
	 * offset and returning no more than the limit
	 * <p>
	 * WARNING: This method must iterate from the 0 offset each time, is
	 * extremely inefficient, and not recommended for use
	 * @param distinct distinct rows
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 */
	public queryForChunkWithGeometryEnvelopeAndDistinct(distinct: boolean, envelope: GeometryEnvelope, where: string, whereArgs: any[], orderBy: string, limit: number, offset: number): ManualFeatureQueryResults {
		return this.queryForChunkWithBoundsAndDistinct(distinct, envelope.minX, envelope.minY, envelope.maxX, envelope.maxY, where, whereArgs, orderBy, limit, offset);
	}

	/**
	 * Manually query for rows within the geometry envelope, starting at the
	 * offset and returning no more than the limit
	 * <p>
	 * WARNING: This method must iterate from the 0 offset each time, is
	 * extremely inefficient, and not recommended for use
	 * @param columns columns
	 * @param envelope geometry envelope
	 * @param where where clause
	 * @param whereArgs where arguments
	 * @param orderBy order by
	 * @param limit chunk limit
	 * @param offset chunk query offset
	 * @return results
	 */
	public queryForChunkWithGeometryEnvelopeAndColumns(columns: string[], envelope: GeometryEnvelope, where: string, whereArgs: any[], orderBy: string, limit: number, offset: number): ManualFeatureQueryResults {
		return this.queryForChunkWithBoundsAndColumns(columns, envelope.minX, envelope.minY, envelope.maxX, envelope.maxY, where, whereArgs, orderBy, limit, offset);
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
	public queryForChunkWithGeometryEnvelopeAndDistinctAndColumns(distinct: boolean, columns: string[], envelope: GeometryEnvelope, where: string, whereArgs: any[], orderBy: string, limit: number, offset: number): ManualFeatureQueryResults {
		return this.queryForChunkWithBoundsAndDistinctAndColumns(distinct, columns, envelope.minX, envelope.minY, envelope.maxX, envelope.maxY, where, whereArgs, orderBy, limit, offset);
	}

	/**
	 * Manually query for rows within the bounds, starting at the offset and
	 * returning no more than the limit
	 * <p>
	 * WARNING: This method must iterate from the 0 offset each time, is
	 * extremely inefficient, and not recommended for use
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
	public queryForChunkWithBounds(minX: number, minY: number, maxX: number, maxY: number, where: string, whereArgs: any[], orderBy: string, limit: number, offset: number): ManualFeatureQueryResults {
		return this.queryForChunkWithBoundsAndDistinctAndColumns(undefined, undefined, minX, minY, maxX, maxY, where, whereArgs, orderBy, limit, offset);
	}

	/**
	 * Manually query for rows within the bounds, starting at the offset and
	 * returning no more than the limit
	 * <p>
	 * WARNING: This method must iterate from the 0 offset each time, is
	 * extremely inefficient, and not recommended for use
	 * @param distinct distinct rows
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
	public queryForChunkWithBoundsAndDistinct(distinct: boolean, minX: number, minY: number, maxX: number, maxY: number, where: string, whereArgs: any[], orderBy: string, limit: number, offset: number): ManualFeatureQueryResults {
		return this.queryForChunkWithBoundsAndDistinctAndColumns(distinct, undefined, minX, minY, maxX, maxY, where, whereArgs, orderBy, limit, offset);
	}

	/**
	 * Manually query for rows within the bounds, starting at the offset and
	 * returning no more than the limit
	 * <p>
	 * WARNING: This method must iterate from the 0 offset each time, is
	 * extremely inefficient, and not recommended for use
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
	public queryForChunkWithBoundsAndColumns(columns: string[], minX: number, minY: number, maxX: number, maxY: number, where: string, whereArgs: any[], orderBy: string, limit: number, offset: number): ManualFeatureQueryResults {
		return this.queryForChunkWithBoundsAndDistinctAndColumns(undefined, columns, minX, minY, maxX, maxY, where, whereArgs, orderBy, limit, offset);
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
	public queryForChunkWithBoundsAndDistinctAndColumns(distinct: boolean, columns: string[], minX: number, minY: number, maxX: number, maxY: number, where: string, whereArgs: any[], orderBy: string, limit: number, offset: number): ManualFeatureQueryResults {
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

			const resultSet: FeatureResultSet = this.featureDao.queryForChunkWithDistinctAndColumns(distinct, queryColumns, where, whereArgs, undefined, undefined, orderBy, this.chunkLimit, localOffset);
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

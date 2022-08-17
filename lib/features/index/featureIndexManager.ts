/**
 * Feature Index Manager to manage indexing of feature geometries within a
 * GeoPackage using the Geometry Index Extension and the RTree extension
 *
 * @author osbornb
 * @see mil.nga.geopackage.extension.nga.index.FeatureTableIndex
 */
import { FeatureDao } from "../user/featureDao";
import { FeatureTableIndex } from "../../extension/nga/index/featureTableIndex";
import { ManualFeatureQuery } from "../user/manualFeatureQuery";

export class FeatureIndexManager {

	/**
	 * Feature DAO
	 */
	private readonly featureDao: FeatureDao;

	/**
	 * Feature Table Index, for indexing within a GeoPackage extension
	 */
	private readonly featureTableIndex: FeatureTableIndex;

	/**
	 * RTree Index Table DAO
	 */
	private readonly rTreeIndexTableDao: RTreeIndexTableDao;

	/**
	 * Manual Feature Queries
	 */
	private readonly manualFeatureQuery: ManualFeatureQuery;

	/**
	 * Ordered set of index locations to check in order when checking if
	 * features are indexed and when querying for features
	 */
	private Set<FeatureIndexType> indexLocationQueryOrder = new LinkedHashSet<>();

	/**
	 * Index location, when set index calls without specifying a location go to
	 * this location
	 */
	private FeatureIndexType indexLocation;

	/**
	 * When an exception occurs on a certain index, continue to other index
	 * types to attempt to retrieve the value
	 */
	private boolean continueOnError = true;

	/**
	 * Constructor
	 *
	 * @param geoPackage
	 *            GeoPackage
	 * @param featureTable
	 *            feature table
	 */
	public FeatureIndexManager(GeoPackage geoPackage, String featureTable) {
		this(geoPackage, geoPackage.getFeatureDao(featureTable));
	}

	/**
	 * Constructor
	 *
	 * @param geoPackage
	 *            GeoPackage
	 * @param featureDao
	 *            feature DAO
	 */
	public FeatureIndexManager(GeoPackage geoPackage, FeatureDao featureDao) {
		this.featureDao = featureDao;
		featureTableIndex = new FeatureTableIndex(geoPackage, featureDao);
		RTreeIndexExtension rTreeExtension = new RTreeIndexExtension(
				geoPackage);
		rTreeIndexTableDao = rTreeExtension.getTableDao(featureDao);
		manualFeatureQuery = new ManualFeatureQuery(featureDao);

		// Set the default indexed check and query order
		indexLocationQueryOrder.add(FeatureIndexType.RTREE);
		indexLocationQueryOrder.add(FeatureIndexType.GEOPACKAGE);
	}

	/**
	 * Close the index connections
	 */
	public void close() {
		featureTableIndex.close();
		// rTreeIndexTableDao.close();
	}

	/**
	 * Get the feature DAO
	 *
	 * @return feature DAO
	 */
	public FeatureDao getFeatureDao() {
		return featureDao;
	}

	/**
	 * Get the feature table index, used to index inside the GeoPackage as an
	 * extension
	 *
	 * @return feature table index
	 */
	public FeatureTableIndex getFeatureTableIndex() {
		return featureTableIndex;
	}

	/**
	 * Get the RTree Index Table DAO
	 *
	 * @return RTree index table DAO
	 */
	public RTreeIndexTableDao getRTreeIndexTableDao() {
		return rTreeIndexTableDao;
	}

	/**
	 * Get the ordered set of ordered index query locations
	 *
	 * @return set of ordered index types
	 */
	public Set<FeatureIndexType> getIndexLocationQueryOrder() {
		return Collections.unmodifiableSet(indexLocationQueryOrder);
	}

	/**
	 * Get the index location
	 *
	 * @return index location or null if not set
	 */
	public FeatureIndexType getIndexLocation() {
		return indexLocation;
	}

	/**
	 * Is the continue on error flag enabled
	 * 
	 * @return continue on error
	 * @since 3.4.0
	 */
	public boolean isContinueOnError() {
		return continueOnError;
	}

	/**
	 * Set the continue on error flag
	 * 
	 * @param continueOnError
	 *            continue on error
	 * @since 3.4.0
	 */
	public void setContinueOnError(boolean continueOnError) {
		this.continueOnError = continueOnError;
	}

	/**
	 * Prioritize the query location order. All types are placed at the front of
	 * the query order in the order they are given. Omitting a location leaves
	 * it at it's current priority location.
	 *
	 * @param types
	 *            feature index types
	 */
	public void prioritizeQueryLocation(Collection<FeatureIndexType> types) {
		prioritizeQueryLocation(
				types.toArray(new FeatureIndexType[types.size()]));
	}

	/**
	 * Prioritize the query location order. All types are placed at the front of
	 * the query order in the order they are given. Omitting a location leaves
	 * it at it's current priority location.
	 *
	 * @param types
	 *            feature index types
	 */
	public void prioritizeQueryLocation(FeatureIndexType... types) {
		// Create a new query order set
		Set<FeatureIndexType> queryOrder = new LinkedHashSet<>();
		for (FeatureIndexType type : types) {
			if (type != FeatureIndexType.NONE) {
				queryOrder.add(type);
			}
		}
		// Add any locations not provided to this method
		queryOrder.addAll(indexLocationQueryOrder);
		// Update the query order set
		indexLocationQueryOrder = queryOrder;
	}

	/**
	 * Set the index location order, overriding all previously set types
	 *
	 * @param types
	 *            feature index types
	 */
	public void setIndexLocationOrder(Collection<FeatureIndexType> types) {
		setIndexLocationOrder(
				types.toArray(new FeatureIndexType[types.size()]));
	}

	/**
	 * Set the index location order, overriding all previously set types
	 *
	 * @param types
	 *            feature index types
	 */
	public void setIndexLocationOrder(FeatureIndexType... types) {
		// Create a new query order set
		Set<FeatureIndexType> queryOrder = new LinkedHashSet<>();
		for (FeatureIndexType type : types) {
			if (type != FeatureIndexType.NONE) {
				queryOrder.add(type);
			}
		}
		// Update the query order set
		indexLocationQueryOrder = queryOrder;
	}

	/**
	 * Set the index location
	 *
	 * @param indexLocation
	 *            feature index type
	 */
	public void setIndexLocation(FeatureIndexType indexLocation) {
		this.indexLocation = indexLocation;
	}

	/**
	 * Set the GeoPackage Progress
	 *
	 * @param progress
	 *            GeoPackage progress
	 */
	public void setProgress(GeoPackageProgress progress) {
		featureTableIndex.setProgress(progress);
		rTreeIndexTableDao.setProgress(progress);
	}

	/**
	 * Index the feature table if needed, using the set index location
	 *
	 * @return count
	 */
	public int index() {
		return index(verifyIndexLocation(), false);
	}

	/**
	 * Index the feature tables if needed for the index types
	 *
	 * @param types
	 *            feature index types
	 * @return largest count of indexed features
	 */
	public int index(List<FeatureIndexType> types) {
		int count = 0;
		for (FeatureIndexType type : types) {
			int typeCount = index(type);
			count = Math.max(count, typeCount);
		}
		return count;
	}

	/**
	 * Index the feature table if needed
	 *
	 * @param type
	 *            index location type
	 * @return count
	 */
	public int index(FeatureIndexType type) {
		return index(type, false);
	}

	/**
	 * Index the feature table, using the set index location
	 *
	 * @param force
	 *            true to force re-indexing
	 * @return count
	 */
	public int index(boolean force) {
		return index(verifyIndexLocation(), force);
	}

	/**
	 * Index the feature tables for the index types
	 *
	 * @param force
	 *            true to force re-indexing
	 * @param types
	 *            feature index types
	 * @return largest count of indexed features
	 */
	public int index(boolean force, List<FeatureIndexType> types) {
		int count = 0;
		for (FeatureIndexType type : types) {
			int typeCount = index(type, force);
			count = Math.max(count, typeCount);
		}
		return count;
	}

	/**
	 * Index the feature table
	 *
	 * @param type
	 *            index location type
	 * @param force
	 *            true to force re-indexing
	 * @return count
	 */
	public int index(FeatureIndexType type, boolean force) {
		if (type == null) {
			throw new GeoPackageException(
					"FeatureIndexType is required to index");
		}
		int count = 0;
		switch (type) {
		case GEOPACKAGE:
			count = featureTableIndex.index(force);
			break;
		case RTREE:
			boolean rTreeIndexed = rTreeIndexTableDao.has();
			if (!rTreeIndexed || force) {
				if (rTreeIndexed) {
					rTreeIndexTableDao.delete();
				}
				rTreeIndexTableDao.create();
				count = rTreeIndexTableDao.count();
			}
			break;
		default:
			throw new GeoPackageException(
					"Unsupported FeatureIndexType: " + type);
		}
		return count;
	}

	/**
	 * Index the feature row, using the set index location. This method assumes
	 * that indexing has been completed and maintained as the last indexed time
	 * is updated.
	 *
	 * @param row
	 *            feature row to index
	 * @return true if indexed
	 */
	public boolean index(FeatureRow row) {
		return index(verifyIndexLocation(), row);
	}

	/**
	 * Index the feature row for the index types. This method assumes that
	 * indexing has been completed and maintained as the last indexed time is
	 * updated.
	 *
	 * @param row
	 *            feature row to index
	 * @param types
	 *            feature index types
	 * @return true if indexed from any type
	 */
	public boolean index(FeatureRow row, List<FeatureIndexType> types) {
		boolean indexed = false;
		for (FeatureIndexType type : types) {
			if (index(type, row)) {
				indexed = true;
			}
		}
		return indexed;
	}

	/**
	 * Index the feature row. This method assumes that indexing has been
	 * completed and maintained as the last indexed time is updated.
	 *
	 * @param type
	 *            index location type
	 * @param row
	 *            feature row to index
	 * @return true if indexed
	 */
	public boolean index(FeatureIndexType type, FeatureRow row) {
		boolean indexed = false;
		if (type == null) {
			throw new GeoPackageException(
					"FeatureIndexType is required to index");
		}
		switch (type) {
		case GEOPACKAGE:
			indexed = featureTableIndex.index(row);
			break;
		case RTREE:
			// Updated by triggers, ignore for RTree
			indexed = true;
			break;
		default:
			throw new GeoPackageException(
					"Unsupported FeatureIndexType: " + type);
		}
		return indexed;
	}

	/**
	 * Delete the feature index
	 *
	 * @return true if deleted
	 */
	public boolean deleteIndex() {
		return deleteIndex(verifyIndexLocation());
	}

	/**
	 * Delete the feature index from all query order locations
	 * 
	 * @return true if deleted
	 */
	public boolean deleteAllIndexes() {
		return deleteIndex(indexLocationQueryOrder);
	}

	/**
	 * Delete the feature index from the index types
	 *
	 * @param types
	 *            feature index types
	 * @return true if deleted from any type
	 */
	public boolean deleteIndex(Collection<FeatureIndexType> types) {
		boolean deleted = false;
		for (FeatureIndexType type : types) {
			if (deleteIndex(type)) {
				deleted = true;
			}
		}
		return deleted;
	}

	/**
	 * Delete the feature index
	 *
	 * @param type
	 *            feature index type
	 * @return true if deleted
	 */
	public boolean deleteIndex(FeatureIndexType type) {
		if (type == null) {
			throw new GeoPackageException(
					"FeatureIndexType is required to delete index");
		}
		boolean deleted = false;
		switch (type) {
		case GEOPACKAGE:
			deleted = featureTableIndex.deleteIndex();
			break;
		case RTREE:
			rTreeIndexTableDao.delete();
			deleted = true;
			break;
		default:
			throw new GeoPackageException(
					"Unsupported FeatureIndexType: " + type);
		}
		return deleted;
	}

	/**
	 * Delete the feature index for the feature row
	 *
	 * @param row
	 *            feature row
	 * @return true if deleted
	 */
	public boolean deleteIndex(FeatureRow row) {
		return deleteIndex(verifyIndexLocation(), row);
	}

	/**
	 * Delete the feature index for the feature row from the index types
	 *
	 * @param row
	 *            feature row
	 * @param types
	 *            feature index types
	 * @return true if deleted from any type
	 */
	public boolean deleteIndex(FeatureRow row, List<FeatureIndexType> types) {
		boolean deleted = false;
		for (FeatureIndexType type : types) {
			if (deleteIndex(type, row)) {
				deleted = true;
			}
		}
		return deleted;
	}

	/**
	 * Delete the feature index for the feature row
	 *
	 * @param type
	 *            feature index type
	 * @param row
	 *            feature row
	 * @return true if deleted
	 */
	public boolean deleteIndex(FeatureIndexType type, FeatureRow row) {
		return deleteIndex(type, row.getId());
	}

	/**
	 * Delete the feature index for the geometry id
	 *
	 * @param geomId
	 *            geometry id
	 * @return true if deleted
	 */
	public boolean deleteIndex(long geomId) {
		return deleteIndex(verifyIndexLocation(), geomId);
	}

	/**
	 * Delete the feature index for the geometry id from the index types
	 *
	 * @param geomId
	 *            geometry id
	 * @param types
	 *            feature index types
	 * @return true if deleted from any type
	 */
	public boolean deleteIndex(long geomId, List<FeatureIndexType> types) {
		boolean deleted = false;
		for (FeatureIndexType type : types) {
			if (deleteIndex(type, geomId)) {
				deleted = true;
			}
		}
		return deleted;
	}

	/**
	 * Delete the feature index for the geometry id
	 *
	 * @param type
	 *            feature index type
	 * @param geomId
	 *            geometry id
	 * @return true if deleted
	 */
	public boolean deleteIndex(FeatureIndexType type, long geomId) {
		if (type == null) {
			throw new GeoPackageException(
					"FeatureIndexType is required to delete index");
		}
		boolean deleted = false;
		switch (type) {
		case GEOPACKAGE:
			deleted = featureTableIndex.deleteIndex(geomId) > 0;
			break;
		case RTREE:
			// Updated by triggers, ignore for RTree
			deleted = true;
			break;
		default:
			throw new GeoPackageException(
					"Unsupported FeatureIndexType: " + type);
		}
		return deleted;
	}

	/**
	 * Retain the feature index from the index types and delete the others
	 *
	 * @param type
	 *            feature index type to retain
	 * @return true if deleted from any type
	 */
	public boolean retainIndex(FeatureIndexType type) {
		List<FeatureIndexType> retain = new ArrayList<FeatureIndexType>();
		retain.add(type);
		return retainIndex(retain);
	}

	/**
	 * Retain the feature index from the index types and delete the others
	 *
	 * @param types
	 *            feature index types to retain
	 * @return true if deleted from any type
	 */
	public boolean retainIndex(Collection<FeatureIndexType> types) {
		Set<FeatureIndexType> delete = new HashSet<>(indexLocationQueryOrder);
		delete.removeAll(types);
		return deleteIndex(delete);
	}

	/**
	 * Determine if the feature table is indexed
	 *
	 * @return true if indexed
	 */
	public boolean isIndexed() {
		boolean indexed = false;
		for (FeatureIndexType type : indexLocationQueryOrder) {
			indexed = isIndexed(type);
			if (indexed) {
				break;
			}
		}
		return indexed;
	}

	/**
	 * Is the feature table indexed in the provided type location
	 *
	 * @param type
	 *            index location type
	 * @return true if indexed
	 */
	public boolean isIndexed(FeatureIndexType type) {
		boolean indexed = false;
		if (type == null) {
			indexed = isIndexed();
		} else {
			switch (type) {
			case GEOPACKAGE:
				indexed = featureTableIndex.isIndexed();
				break;
			case RTREE:
				indexed = rTreeIndexTableDao.has();
				break;
			default:
				throw new GeoPackageException(
						"Unsupported FeatureIndexType: " + type);
			}
		}
		return indexed;
	}

	/**
	 * Get the indexed types that are currently indexed
	 *
	 * @return indexed types
	 */
	public List<FeatureIndexType> getIndexedTypes() {
		List<FeatureIndexType> indexed = new ArrayList<>();
		for (FeatureIndexType type : indexLocationQueryOrder) {
			if (isIndexed(type)) {
				indexed.add(type);
			}
		}
		return indexed;
	}

	/**
	 * Get the date last indexed
	 *
	 * @return last indexed date or null
	 */
	public Date getLastIndexed() {
		Date lastIndexed = null;
		for (FeatureIndexType type : indexLocationQueryOrder) {
			lastIndexed = getLastIndexed(type);
			if (lastIndexed != null) {
				break;
			}
		}
		return lastIndexed;
	}

	/**
	 * Get the date last indexed
	 *
	 * @param type
	 *            feature index type
	 * @return last indexed date or null
	 */
	public Date getLastIndexed(FeatureIndexType type) {
		Date lastIndexed = null;
		if (type == null) {
			lastIndexed = getLastIndexed();
		} else {
			switch (type) {
			case GEOPACKAGE:
				lastIndexed = featureTableIndex.getLastIndexed();
				break;
			case RTREE:
				if (rTreeIndexTableDao.has()) {
					// Updated by triggers, assume up to date
					lastIndexed = new Date();
				}
				break;
			default:
				throw new GeoPackageException(
						"Unsupported FeatureIndexType: " + type);
			}
		}
		return lastIndexed;
	}

	/**
	 * Get a feature index location to iterate over indexed types
	 *
	 * @return feature index location
	 * @since 3.4.0
	 */
	public FeatureIndexLocation getLocation() {
		return new FeatureIndexLocation(this);
	}

	/**
	 * Get the first ordered indexed type
	 *
	 * @return feature index type
	 * @since 3.4.0
	 */
	public FeatureIndexType getIndexedType() {

		FeatureIndexType indexType = FeatureIndexType.NONE;

		// Check for an indexed type
		for (FeatureIndexType type : indexLocationQueryOrder) {
			if (isIndexed(type)) {
				indexType = type;
				break;
			}
		}

		return indexType;
	}

	/**
	 * Get the feature table id column name, the default column ordering
	 * 
	 * @return feature table id column name
	 * @since 6.2.0
	 */
	public String getIdColumn() {
		return featureDao.getPkColumnName();
	}

	/**
	 * Query for all feature index results
	 *
	 * @return feature index results, close when done
	 */
	public FeatureIndexResults query() {
		return query(false);
	}

	/**
	 * Query for all feature index results
	 *
	 * @param distinct
	 *            distinct rows
	 * @return feature index results, close when done
	 * @since 4.0.0
	 */
	public FeatureIndexResults query(boolean distinct) {
		return query(distinct, featureDao.getColumnNames());
	}

	/**
	 * Query for all feature index results
	 *
	 * @param columns
	 *            columns
	 *
	 * @return feature index results, close when done
	 * @since 3.5.0
	 */
	public FeatureIndexResults query(String[] columns) {
		return query(false, columns);
	}

	/**
	 * Query for all feature index results
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 *
	 * @return feature index results, close when done
	 * @since 4.0.0
	 */
	public FeatureIndexResults query(boolean distinct, String[] columns) {
		FeatureIndexResults results = null;
		for (FeatureIndexType type : getLocation()) {
			try {
				switch (type) {
				case GEOPACKAGE:
					FeatureResultSet geoPackageResultSet = featureTableIndex
							.queryFeatures(distinct, columns);
					results = new FeatureIndexFeatureResults(
							geoPackageResultSet);
					break;
				case RTREE:
					FeatureResultSet rTreeResultSet = rTreeIndexTableDao
							.queryFeatures(distinct, columns);
					results = new FeatureIndexFeatureResults(rTreeResultSet);
					break;
				default:
					throw new GeoPackageException(
							"Unsupported feature index type: " + type);
				}
				break;
			} catch (Exception e) {
				if (continueOnError) {
					LOGGER.log(Level.SEVERE,
							"Failed to query from feature index: " + type, e);
				} else {
					throw e;
				}
			}
		}
		if (results == null) {
			FeatureResultSet featureResultSet = manualFeatureQuery
					.query(distinct, columns);
			results = new FeatureIndexFeatureResults(featureResultSet);
		}
		return results;
	}

	/**
	 * Query for all feature index count
	 *
	 * @return count
	 */
	public long count() {
		Long count = null;
		for (FeatureIndexType type : getLocation()) {
			try {
				switch (type) {
				case GEOPACKAGE:
					count = featureTableIndex.count();
					break;
				case RTREE:
					count = (long) rTreeIndexTableDao.count();
					break;
				default:
					throw new GeoPackageException(
							"Unsupported feature index type: " + type);
				}
				break;
			} catch (Exception e) {
				if (continueOnError) {
					LOGGER.log(Level.SEVERE,
							"Failed to count from feature index: " + type, e);
				} else {
					throw e;
				}
			}
		}
		if (count == null) {
			count = (long) manualFeatureQuery.countWithGeometries();
		}
		return count;
	}

	/**
	 * Query for all feature index count
	 *
	 * @param column
	 *            count column name
	 * @return count
	 * @since 4.0.0
	 */
	public long countColumn(String column) {
		return count(false, column);
	}

	/**
	 * Query for all feature index count
	 *
	 * @param distinct
	 *            distinct column values
	 * @param column
	 *            count column name
	 * @return count
	 * @since 4.0.0
	 */
	public long count(boolean distinct, String column) {
		Long count = null;
		for (FeatureIndexType type : getLocation()) {
			try {
				switch (type) {
				case GEOPACKAGE:
					count = (long) featureTableIndex.countFeatures(distinct,
							column);
					break;
				case RTREE:
					count = (long) rTreeIndexTableDao.countFeatures(distinct,
							column);
					break;
				default:
					throw new GeoPackageException(
							"Unsupported feature index type: " + type);
				}
				break;
			} catch (Exception e) {
				if (continueOnError) {
					LOGGER.log(Level.SEVERE,
							"Failed to count from feature index: " + type, e);
				} else {
					throw e;
				}
			}
		}
		if (count == null) {
			count = (long) manualFeatureQuery.count(distinct, column);
		}
		return count;
	}

	/**
	 * Query for feature index results
	 * 
	 * @param fieldValues
	 *            field values
	 *
	 * @return feature index results, close when done
	 * @since 3.4.0
	 */
	public FeatureIndexResults query(Map<String, Object> fieldValues) {
		return query(false, fieldValues);
	}

	/**
	 * Query for feature index results
	 * 
	 * @param distinct
	 *            distinct rows
	 * @param fieldValues
	 *            field values
	 *
	 * @return feature index results, close when done
	 * @since 4.0.0
	 */
	public FeatureIndexResults query(boolean distinct,
			Map<String, Object> fieldValues) {
		String where = featureDao.buildWhere(fieldValues.entrySet());
		String[] whereArgs = featureDao.buildWhereArgs(fieldValues.values());
		return query(distinct, where, whereArgs);
	}

	/**
	 * Query for feature index results
	 * 
	 * @param columns
	 *            columns
	 * @param fieldValues
	 *            field values
	 *
	 * @return feature index results, close when done
	 * @since 3.5.0
	 */
	public FeatureIndexResults query(String[] columns,
			Map<String, Object> fieldValues) {
		return query(false, columns, fieldValues);
	}

	/**
	 * Query for feature index results
	 * 
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param fieldValues
	 *            field values
	 *
	 * @return feature index results, close when done
	 * @since 4.0.0
	 */
	public FeatureIndexResults query(boolean distinct, String[] columns,
			Map<String, Object> fieldValues) {
		String where = featureDao.buildWhere(fieldValues.entrySet());
		String[] whereArgs = featureDao.buildWhereArgs(fieldValues.values());
		return query(distinct, columns, where, whereArgs);
	}

	/**
	 * Query for feature index count
	 * 
	 * @param fieldValues
	 *            field values
	 *
	 * @return feature index results, close when done
	 * @since 3.4.0
	 */
	public long count(Map<String, Object> fieldValues) {
		return count(false, null, fieldValues);
	}

	/**
	 * Query for feature index count
	 * 
	 * @param column
	 *            count column name
	 * @param fieldValues
	 *            field values
	 *
	 * @return feature index results, close when done
	 * @since 4.0.0
	 */
	public long count(String column, Map<String, Object> fieldValues) {
		return count(false, column, fieldValues);
	}

	/**
	 * Query for feature index count
	 * 
	 * @param distinct
	 *            distinct column values
	 * @param column
	 *            count column name
	 * @param fieldValues
	 *            field values
	 *
	 * @return feature index results, close when done
	 * @since 4.0.0
	 */
	public long count(boolean distinct, String column,
			Map<String, Object> fieldValues) {
		String where = featureDao.buildWhere(fieldValues.entrySet());
		String[] whereArgs = featureDao.buildWhereArgs(fieldValues.values());
		return count(distinct, column, where, whereArgs);
	}

	/**
	 * Query for feature index results
	 * 
	 * @param where
	 *            where clause
	 *
	 * @return feature index results, close when done
	 * @since 3.4.0
	 */
	public FeatureIndexResults query(String where) {
		return query(false, where);
	}

	/**
	 * Query for feature index results
	 * 
	 * @param distinct
	 *            distinct rows
	 * @param where
	 *            where clause
	 *
	 * @return feature index results, close when done
	 * @since 4.0.0
	 */
	public FeatureIndexResults query(boolean distinct, String where) {
		return query(distinct, where, null);
	}

	/**
	 * Query for feature index results
	 * 
	 * @param columns
	 *            columns
	 * @param where
	 *            where clause
	 *
	 * @return feature index results, close when done
	 * @since 3.5.0
	 */
	public FeatureIndexResults query(String[] columns, String where) {
		return query(false, columns, where);
	}

	/**
	 * Query for feature index results
	 * 
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param where
	 *            where clause
	 *
	 * @return feature index results, close when done
	 * @since 4.0.0
	 */
	public FeatureIndexResults query(boolean distinct, String[] columns,
			String where) {
		return query(distinct, columns, where, null);
	}

	/**
	 * Query for feature index count
	 * 
	 * @param where
	 *            where clause
	 *
	 * @return count
	 * @since 3.4.0
	 */
	public long count(String where) {
		return count(false, null, where);
	}

	/**
	 * Query for feature index count
	 * 
	 * @param column
	 *            count column name
	 * @param where
	 *            where clause
	 *
	 * @return count
	 * @since 4.0.0
	 */
	public long count(String column, String where) {
		return count(false, column, where);
	}

	/**
	 * Query for feature index count
	 * 
	 * @param distinct
	 *            distinct column values
	 * @param column
	 *            count column name
	 * @param where
	 *            where clause
	 *
	 * @return count
	 * @since 4.0.0
	 */
	public long count(boolean distinct, String column, String where) {
		return count(distinct, column, where, null);
	}

	/**
	 * Query for feature index results
	 * 
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 *
	 * @return feature index results, close when done
	 * @since 3.4.0
	 */
	public FeatureIndexResults query(String where, String[] whereArgs) {
		return query(false, where, whereArgs);
	}

	/**
	 * Query for feature index results
	 * 
	 * @param distinct
	 *            distinct rows
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 *
	 * @return feature index results, close when done
	 * @since 4.0.0
	 */
	public FeatureIndexResults query(boolean distinct, String where,
			String[] whereArgs) {
		return query(distinct, featureDao.getColumnNames(), where, whereArgs);
	}

	/**
	 * Query for feature index results
	 * 
	 * @param columns
	 *            columns
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 *
	 * @return feature index results, close when done
	 * @since 3.5.0
	 */
	public FeatureIndexResults query(String[] columns, String where,
			String[] whereArgs) {
		return query(false, columns, where, whereArgs);
	}

	/**
	 * Query for feature index results
	 * 
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 *
	 * @return feature index results, close when done
	 * @since 4.0.0
	 */
	public FeatureIndexResults query(boolean distinct, String[] columns,
			String where, String[] whereArgs) {
		FeatureIndexResults results = null;
		for (FeatureIndexType type : getLocation()) {
			try {
				switch (type) {
				case GEOPACKAGE:
					FeatureResultSet geoPackageResultSet = featureTableIndex
							.queryFeatures(distinct, columns, where, whereArgs);
					results = new FeatureIndexFeatureResults(
							geoPackageResultSet);
					break;
				case RTREE:
					FeatureResultSet rTreeResultSet = rTreeIndexTableDao
							.queryFeatures(distinct, columns, where, whereArgs);
					results = new FeatureIndexFeatureResults(rTreeResultSet);
					break;
				default:
					throw new GeoPackageException(
							"Unsupported feature index type: " + type);
				}
				break;
			} catch (Exception e) {
				if (continueOnError) {
					LOGGER.log(Level.SEVERE,
							"Failed to query from feature index: " + type, e);
				} else {
					throw e;
				}
			}
		}
		if (results == null) {
			FeatureResultSet featureResultSet = manualFeatureQuery
					.query(distinct, columns, where, whereArgs);
			results = new FeatureIndexFeatureResults(featureResultSet);
		}
		return results;
	}

	/**
	 * Query for feature index count
	 * 
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 *
	 * @return count
	 * @since 3.4.0
	 */
	public long count(String where, String[] whereArgs) {
		return count(false, null, where, whereArgs);
	}

	/**
	 * Query for feature index count
	 * 
	 * @param column
	 *            count column name
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 *
	 * @return count
	 * @since 4.0.0
	 */
	public long count(String column, String where, String[] whereArgs) {
		return count(false, column, where, whereArgs);
	}

	/**
	 * Query for feature index count
	 * 
	 * @param distinct
	 *            distinct column values
	 * @param column
	 *            count column name
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 *
	 * @return count
	 * @since 4.0.0
	 */
	public long count(boolean distinct, String column, String where,
			String[] whereArgs) {
		Long count = null;
		for (FeatureIndexType type : getLocation()) {
			try {
				switch (type) {
				case GEOPACKAGE:
					count = (long) featureTableIndex.countFeatures(distinct,
							column, where, whereArgs);
					break;
				case RTREE:
					count = (long) rTreeIndexTableDao.countFeatures(distinct,
							column, where, whereArgs);
					break;
				default:
					throw new GeoPackageException(
							"Unsupported feature index type: " + type);
				}
				break;
			} catch (Exception e) {
				if (continueOnError) {
					LOGGER.log(Level.SEVERE,
							"Failed to count from feature index: " + type, e);
				} else {
					throw e;
				}
			}
		}
		if (count == null) {
			count = (long) manualFeatureQuery.count(distinct, column, where,
					whereArgs);
		}
		return count;
	}

	/**
	 * Query for the feature index bounds
	 * 
	 * @return bounding box
	 */
	public BoundingBox getBoundingBox() {
		BoundingBox bounds = null;
		boolean success = false;
		for (FeatureIndexType type : getLocation()) {
			try {
				switch (type) {
				case GEOPACKAGE:
					bounds = featureTableIndex.getBoundingBox();
					break;
				case RTREE:
					bounds = rTreeIndexTableDao.getBoundingBox();
					break;
				default:
					throw new GeoPackageException(
							"Unsupported feature index type: " + type);
				}
				success = true;
				break;
			} catch (Exception e) {
				if (continueOnError) {
					LOGGER.log(Level.SEVERE,
							"Failed to get bounding box from feature index: "
									+ type,
							e);
				} else {
					throw e;
				}
			}
		}
		if (!success) {
			bounds = manualFeatureQuery.getBoundingBox();
		}
		return bounds;
	}

	/**
	 * Query for the feature index bounds and return in the provided projection
	 * 
	 * @param projection
	 *            desired projection
	 * @return bounding box
	 */
	public BoundingBox getBoundingBox(Projection projection) {
		BoundingBox bounds = null;
		boolean success = false;
		for (FeatureIndexType type : getLocation()) {
			try {
				switch (type) {
				case GEOPACKAGE:
					bounds = featureTableIndex.getBoundingBox(projection);
					break;
				case RTREE:
					bounds = rTreeIndexTableDao.getBoundingBox(projection);
					break;
				default:
					throw new GeoPackageException(
							"Unsupported feature index type: " + type);
				}
				success = true;
				break;
			} catch (Exception e) {
				if (continueOnError) {
					LOGGER.log(Level.SEVERE,
							"Failed to get bounding box from feature index: "
									+ type,
							e);
				} else {
					throw e;
				}
			}
		}
		if (!success) {
			bounds = manualFeatureQuery.getBoundingBox(projection);
		}
		return bounds;
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly
	 *
	 * @param boundingBox
	 *            bounding box
	 * @return feature index results, close when done
	 */
	public FeatureIndexResults query(BoundingBox boundingBox) {
		return query(false, boundingBox);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly
	 *
	 * @param distinct
	 *            distinct rows
	 * @param boundingBox
	 *            bounding box
	 * @return feature index results, close when done
	 * @since 4.0.0
	 */
	public FeatureIndexResults query(boolean distinct,
			BoundingBox boundingBox) {
		return query(distinct, boundingBox.buildEnvelope());
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly
	 *
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @return feature index results, close when done
	 * @since 3.5.0
	 */
	public FeatureIndexResults query(String[] columns,
			BoundingBox boundingBox) {
		return query(false, columns, boundingBox);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @return feature index results, close when done
	 * @since 4.0.0
	 */
	public FeatureIndexResults query(boolean distinct, String[] columns,
			BoundingBox boundingBox) {
		return query(distinct, columns, boundingBox.buildEnvelope());
	}

	/**
	 * Query for feature index count within the bounding box, projected
	 * correctly
	 *
	 * @param boundingBox
	 *            bounding box
	 * @return count
	 */
	public long count(BoundingBox boundingBox) {
		return count(false, null, boundingBox);
	}

	/**
	 * Query for feature index count within the bounding box, projected
	 * correctly
	 *
	 * @param column
	 *            count column name
	 * @param boundingBox
	 *            bounding box
	 * @return count
	 * @since 4.0.0
	 */
	public long count(String column, BoundingBox boundingBox) {
		return count(false, column, boundingBox);
	}

	/**
	 * Query for feature index count within the bounding box, projected
	 * correctly
	 *
	 * @param distinct
	 *            distinct column values
	 * @param column
	 *            count column name
	 * @param boundingBox
	 *            bounding box
	 * @return count
	 * @since 4.0.0
	 */
	public long count(boolean distinct, String column,
			BoundingBox boundingBox) {
		return count(distinct, column, boundingBox.buildEnvelope());
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param fieldValues
	 *            field values
	 * @return feature index results, close when done
	 * @since 3.4.0
	 */
	public FeatureIndexResults query(BoundingBox boundingBox,
			Map<String, Object> fieldValues) {
		return query(false, boundingBox, fieldValues);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly
	 *
	 * @param distinct
	 *            distinct rows
	 * @param boundingBox
	 *            bounding box
	 * @param fieldValues
	 *            field values
	 * @return feature index results, close when done
	 * @since 4.0.0
	 */
	public FeatureIndexResults query(boolean distinct, BoundingBox boundingBox,
			Map<String, Object> fieldValues) {
		return query(distinct, boundingBox.buildEnvelope(), fieldValues);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly
	 *
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param fieldValues
	 *            field values
	 * @return feature index results, close when done
	 * @since 3.5.0
	 */
	public FeatureIndexResults query(String[] columns, BoundingBox boundingBox,
			Map<String, Object> fieldValues) {
		return query(false, columns, boundingBox, fieldValues);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param fieldValues
	 *            field values
	 * @return feature index results, close when done
	 * @since 4.0.0
	 */
	public FeatureIndexResults query(boolean distinct, String[] columns,
			BoundingBox boundingBox, Map<String, Object> fieldValues) {
		return query(distinct, columns, boundingBox.buildEnvelope(),
				fieldValues);
	}

	/**
	 * Query for feature index count within the bounding box, projected
	 * correctly
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param fieldValues
	 *            field values
	 * @return count
	 * @since 3.4.0
	 */
	public long count(BoundingBox boundingBox,
			Map<String, Object> fieldValues) {
		return count(false, null, boundingBox, fieldValues);
	}

	/**
	 * Query for feature index count within the bounding box, projected
	 * correctly
	 *
	 * @param column
	 *            column name
	 * @param boundingBox
	 *            bounding box
	 * @param fieldValues
	 *            field values
	 * @return count
	 * @since 4.0.0
	 */
	public long count(String column, BoundingBox boundingBox,
			Map<String, Object> fieldValues) {
		return count(false, column, boundingBox, fieldValues);
	}

	/**
	 * Query for feature index count within the bounding box, projected
	 * correctly
	 *
	 * @param distinct
	 *            distinct column values
	 * @param column
	 *            column name
	 * @param boundingBox
	 *            bounding box
	 * @param fieldValues
	 *            field values
	 * @return count
	 * @since 4.0.0
	 */
	public long count(boolean distinct, String column, BoundingBox boundingBox,
			Map<String, Object> fieldValues) {
		return count(distinct, column, boundingBox.buildEnvelope(),
				fieldValues);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @return feature index results, close when done
	 * @since 3.4.0
	 */
	public FeatureIndexResults query(BoundingBox boundingBox, String where) {
		return query(false, boundingBox, where);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly
	 *
	 * @param distinct
	 *            distinct rows
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @return feature index results, close when done
	 * @since 4.0.0
	 */
	public FeatureIndexResults query(boolean distinct, BoundingBox boundingBox,
			String where) {
		return query(distinct, boundingBox, where, null);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly
	 *
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @return feature index results, close when done
	 * @since 3.5.0
	 */
	public FeatureIndexResults query(String[] columns, BoundingBox boundingBox,
			String where) {
		return query(false, columns, boundingBox, where);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @return feature index results, close when done
	 * @since 4.0.0
	 */
	public FeatureIndexResults query(boolean distinct, String[] columns,
			BoundingBox boundingBox, String where) {
		return query(distinct, columns, boundingBox, where, null);
	}

	/**
	 * Query for feature index count within the bounding box, projected
	 * correctly
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @return count
	 * @since 3.4.0
	 */
	public long count(BoundingBox boundingBox, String where) {
		return count(false, null, boundingBox, where);
	}

	/**
	 * Query for feature index count within the bounding box, projected
	 * correctly
	 *
	 * @param column
	 *            column name
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @return count
	 * @since 4.0.0
	 */
	public long count(String column, BoundingBox boundingBox, String where) {
		return count(false, column, boundingBox, where);
	}

	/**
	 * Query for feature index count within the bounding box, projected
	 * correctly
	 *
	 * @param distinct
	 *            distinct column values
	 * @param column
	 *            column name
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @return count
	 * @since 4.0.0
	 */
	public long count(boolean distinct, String column, BoundingBox boundingBox,
			String where) {
		return count(distinct, column, boundingBox, where, null);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @return feature index results, close when done
	 * @since 3.4.0
	 */
	public FeatureIndexResults query(BoundingBox boundingBox, String where,
			String[] whereArgs) {
		return query(false, boundingBox, where, whereArgs);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly
	 *
	 * @param distinct
	 *            distinct rows
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @return feature index results, close when done
	 * @since 4.0.0
	 */
	public FeatureIndexResults query(boolean distinct, BoundingBox boundingBox,
			String where, String[] whereArgs) {
		return query(distinct, boundingBox.buildEnvelope(), where, whereArgs);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly
	 *
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @return feature index results, close when done
	 * @since 3.5.0
	 */
	public FeatureIndexResults query(String[] columns, BoundingBox boundingBox,
			String where, String[] whereArgs) {
		return query(false, columns, boundingBox, where, whereArgs);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @return feature index results, close when done
	 * @since 4.0.0
	 */
	public FeatureIndexResults query(boolean distinct, String[] columns,
			BoundingBox boundingBox, String where, String[] whereArgs) {
		return query(distinct, columns, boundingBox.buildEnvelope(), where,
				whereArgs);
	}

	/**
	 * Query for feature index count within the bounding box, projected
	 * correctly
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @return count
	 * @since 3.4.0
	 */
	public long count(BoundingBox boundingBox, String where,
			String[] whereArgs) {
		return count(false, null, boundingBox, where, whereArgs);
	}

	/**
	 * Query for feature index count within the bounding box, projected
	 * correctly
	 *
	 * @param column
	 *            count column value
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @return count
	 * @since 4.0.0
	 */
	public long count(String column, BoundingBox boundingBox, String where,
			String[] whereArgs) {
		return count(false, column, boundingBox, where, whereArgs);
	}

	/**
	 * Query for feature index count within the bounding box, projected
	 * correctly
	 *
	 * @param distinct
	 *            distinct column values
	 * @param column
	 *            count column value
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @return count
	 * @since 4.0.0
	 */
	public long count(boolean distinct, String column, BoundingBox boundingBox,
			String where, String[] whereArgs) {
		return count(distinct, column, boundingBox.buildEnvelope(), where,
				whereArgs);
	}

	/**
	 * Query for feature index results within the Geometry Envelope
	 *
	 * @param envelope
	 *            geometry envelope
	 * @return feature index results, close when done
	 */
	public FeatureIndexResults query(GeometryEnvelope envelope) {
		return query(false, envelope);
	}

	/**
	 * Query for feature index results within the Geometry Envelope
	 *
	 * @param distinct
	 *            distinct rows
	 * @param envelope
	 *            geometry envelope
	 * @return feature index results, close when done
	 * @since 4.0.0
	 */
	public FeatureIndexResults query(boolean distinct,
			GeometryEnvelope envelope) {
		return query(distinct, envelope, null, null);
	}

	/**
	 * Query for feature index results within the Geometry Envelope
	 *
	 * @param columns
	 *            columns
	 * @param envelope
	 *            geometry envelope
	 * @return feature index results, close when done
	 * @since 3.5.0
	 */
	public FeatureIndexResults query(String[] columns,
			GeometryEnvelope envelope) {
		return query(false, columns, envelope);
	}

	/**
	 * Query for feature index results within the Geometry Envelope
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param envelope
	 *            geometry envelope
	 * @return feature index results, close when done
	 * @since 4.0.0
	 */
	public FeatureIndexResults query(boolean distinct, String[] columns,
			GeometryEnvelope envelope) {
		return query(distinct, columns, envelope, null, null);
	}

	/**
	 * Query for feature index count within the Geometry Envelope
	 *
	 * @param envelope
	 *            geometry envelope
	 * @return count
	 */
	public long count(GeometryEnvelope envelope) {
		return count(false, null, envelope);
	}

	/**
	 * Query for feature index count within the Geometry Envelope
	 *
	 * @param column
	 *            count column name
	 * @param envelope
	 *            geometry envelope
	 * @return count
	 * @since 4.0.0
	 */
	public long count(String column, GeometryEnvelope envelope) {
		return count(false, column, envelope);
	}

	/**
	 * Query for feature index count within the Geometry Envelope
	 *
	 * @param distinct
	 *            distinct column values
	 * @param column
	 *            count column name
	 * @param envelope
	 *            geometry envelope
	 * @return count
	 * @since 4.0.0
	 */
	public long count(boolean distinct, String column,
			GeometryEnvelope envelope) {
		Long count = null;
		for (FeatureIndexType type : getLocation()) {
			try {
				switch (type) {
				case GEOPACKAGE:
					if (column != null) {
						count = (long) featureTableIndex.countFeatures(distinct,
								column, envelope);
					} else {
						count = featureTableIndex.count(envelope);
					}
					break;
				case RTREE:
					if (column != null) {
						count = (long) rTreeIndexTableDao.count(distinct,
								column, envelope);
					} else {
						count = (long) rTreeIndexTableDao.count(envelope);
					}
					break;
				default:
					throw new GeoPackageException(
							"Unsupported feature index type: " + type);
				}
				break;
			} catch (Exception e) {
				if (continueOnError) {
					LOGGER.log(Level.SEVERE,
							"Failed to count from feature index: " + type, e);
				} else {
					throw e;
				}
			}
		}
		if (count == null) {
			if (column != null) {
				throw new GeoPackageException(
						"Count by column and envelope is unsupported as a manual feature query. column: "
								+ column);
			} else {
				count = manualFeatureQuery.count(envelope);
			}
		}
		return count;
	}

	/**
	 * Query for feature index results within the Geometry Envelope
	 *
	 * @param envelope
	 *            geometry envelope
	 * @param fieldValues
	 *            field values
	 * @return feature index results, close when done
	 * @since 3.4.0
	 */
	public FeatureIndexResults query(GeometryEnvelope envelope,
			Map<String, Object> fieldValues) {
		return query(false, envelope, fieldValues);
	}

	/**
	 * Query for feature index results within the Geometry Envelope
	 *
	 * @param distinct
	 *            distinct rows
	 * @param envelope
	 *            geometry envelope
	 * @param fieldValues
	 *            field values
	 * @return feature index results, close when done
	 * @since 4.0.0
	 */
	public FeatureIndexResults query(boolean distinct,
			GeometryEnvelope envelope, Map<String, Object> fieldValues) {
		String where = featureDao.buildWhere(fieldValues.entrySet());
		String[] whereArgs = featureDao.buildWhereArgs(fieldValues.values());
		return query(distinct, envelope, where, whereArgs);
	}

	/**
	 * Query for feature index results within the Geometry Envelope
	 *
	 * @param columns
	 *            columns
	 * @param envelope
	 *            geometry envelope
	 * @param fieldValues
	 *            field values
	 * @return feature index results, close when done
	 * @since 3.5.0
	 */
	public FeatureIndexResults query(String[] columns,
			GeometryEnvelope envelope, Map<String, Object> fieldValues) {
		return query(false, columns, envelope, fieldValues);
	}

	/**
	 * Query for feature index results within the Geometry Envelope
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param envelope
	 *            geometry envelope
	 * @param fieldValues
	 *            field values
	 * @return feature index results, close when done
	 * @since 4.0.0
	 */
	public FeatureIndexResults query(boolean distinct, String[] columns,
			GeometryEnvelope envelope, Map<String, Object> fieldValues) {
		String where = featureDao.buildWhere(fieldValues.entrySet());
		String[] whereArgs = featureDao.buildWhereArgs(fieldValues.values());
		return query(distinct, columns, envelope, where, whereArgs);
	}

	/**
	 * Query for feature index count within the Geometry Envelope
	 *
	 * @param envelope
	 *            geometry envelope
	 * @param fieldValues
	 *            field values
	 * @return count
	 * @since 3.4.0
	 */
	public long count(GeometryEnvelope envelope,
			Map<String, Object> fieldValues) {
		return count(false, null, envelope, fieldValues);
	}

	/**
	 * Query for feature index count within the Geometry Envelope
	 *
	 * @param column
	 *            count column name
	 * @param envelope
	 *            geometry envelope
	 * @param fieldValues
	 *            field values
	 * @return count
	 * @since 4.0.0
	 */
	public long count(String column, GeometryEnvelope envelope,
			Map<String, Object> fieldValues) {
		return count(false, column, envelope, fieldValues);
	}

	/**
	 * Query for feature index count within the Geometry Envelope
	 *
	 * @param distinct
	 *            distinct column values
	 * @param column
	 *            count column name
	 * @param envelope
	 *            geometry envelope
	 * @param fieldValues
	 *            field values
	 * @return count
	 * @since 4.0.0
	 */
	public long count(boolean distinct, String column,
			GeometryEnvelope envelope, Map<String, Object> fieldValues) {
		String where = featureDao.buildWhere(fieldValues.entrySet());
		String[] whereArgs = featureDao.buildWhereArgs(fieldValues.values());
		return count(distinct, column, envelope, where, whereArgs);
	}

	/**
	 * Query for feature index results within the Geometry Envelope
	 *
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @return feature index results, close when done
	 * @since 3.4.0
	 */
	public FeatureIndexResults query(GeometryEnvelope envelope, String where) {
		return query(false, envelope, where);
	}

	/**
	 * Query for feature index results within the Geometry Envelope
	 *
	 * @param distinct
	 *            distinct rows
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @return feature index results, close when done
	 * @since 4.0.0
	 */
	public FeatureIndexResults query(boolean distinct,
			GeometryEnvelope envelope, String where) {
		return query(distinct, envelope, where, null);
	}

	/**
	 * Query for feature index results within the Geometry Envelope
	 *
	 * @param columns
	 *            columns
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @return feature index results, close when done
	 * @since 3.5.0
	 */
	public FeatureIndexResults query(String[] columns,
			GeometryEnvelope envelope, String where) {
		return query(false, columns, envelope, where);
	}

	/**
	 * Query for feature index results within the Geometry Envelope
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @return feature index results, close when done
	 * @since 4.0.0
	 */
	public FeatureIndexResults query(boolean distinct, String[] columns,
			GeometryEnvelope envelope, String where) {
		return query(distinct, columns, envelope, where, null);
	}

	/**
	 * Query for feature index count within the Geometry Envelope
	 *
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @return count
	 * @since 3.4.0
	 */
	public long count(GeometryEnvelope envelope, String where) {
		return count(false, null, envelope, where);
	}

	/**
	 * Query for feature index count within the Geometry Envelope
	 *
	 * @param column
	 *            count column name
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @return count
	 * @since 4.0.0
	 */
	public long count(String column, GeometryEnvelope envelope, String where) {
		return count(false, column, envelope, where);
	}

	/**
	 * Query for feature index count within the Geometry Envelope
	 *
	 * @param distinct
	 *            distinct column values
	 * @param column
	 *            count column name
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @return count
	 * @since 4.0.0
	 */
	public long count(boolean distinct, String column,
			GeometryEnvelope envelope, String where) {
		return count(distinct, column, envelope, where, null);
	}

	/**
	 * Query for feature index results within the Geometry Envelope
	 *
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @return feature index results, close when done
	 * @since 3.4.0
	 */
	public FeatureIndexResults query(GeometryEnvelope envelope, String where,
			String[] whereArgs) {
		return query(false, envelope, where, whereArgs);
	}

	/**
	 * Query for feature index results within the Geometry Envelope
	 *
	 * @param distinct
	 *            distinct rows
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @return feature index results, close when done
	 * @since 4.0.0
	 */
	public FeatureIndexResults query(boolean distinct,
			GeometryEnvelope envelope, String where, String[] whereArgs) {
		return query(distinct, featureDao.getColumnNames(), envelope, where,
				whereArgs);
	}

	/**
	 * Query for feature index results within the Geometry Envelope
	 * 
	 * @param columns
	 *            columns
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @return feature index results, close when done
	 * @since 3.5.0
	 */
	public FeatureIndexResults query(String[] columns,
			GeometryEnvelope envelope, String where, String[] whereArgs) {
		return query(false, columns, envelope, where, whereArgs);
	}

	/**
	 * Query for feature index results within the Geometry Envelope
	 * 
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @return feature index results, close when done
	 * @since 4.0.0
	 */
	public FeatureIndexResults query(boolean distinct, String[] columns,
			GeometryEnvelope envelope, String where, String[] whereArgs) {
		FeatureIndexResults results = null;
		for (FeatureIndexType type : getLocation()) {
			try {
				switch (type) {
				case GEOPACKAGE:
					FeatureResultSet geoPackageResultSet = featureTableIndex
							.queryFeatures(distinct, columns, envelope, where,
									whereArgs);
					results = new FeatureIndexFeatureResults(
							geoPackageResultSet);
					break;
				case RTREE:
					FeatureResultSet rTreeResultSet = rTreeIndexTableDao
							.queryFeatures(distinct, columns, envelope, where,
									whereArgs);
					results = new FeatureIndexFeatureResults(rTreeResultSet);
					break;
				default:
					throw new GeoPackageException(
							"Unsupported feature index type: " + type);
				}
				break;
			} catch (Exception e) {
				if (continueOnError) {
					LOGGER.log(Level.SEVERE,
							"Failed to query from feature index: " + type, e);
				} else {
					throw e;
				}
			}
		}
		if (results == null) {
			results = manualFeatureQuery.query(distinct, columns, envelope,
					where, whereArgs);
		}
		return results;
	}

	/**
	 * Query for feature index count within the Geometry Envelope
	 *
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @return count
	 * @since 3.4.0
	 */
	public long count(GeometryEnvelope envelope, String where,
			String[] whereArgs) {
		return count(false, null, envelope, where, whereArgs);
	}

	/**
	 * Query for feature index count within the Geometry Envelope
	 *
	 * @param column
	 *            count column name
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @return count
	 * @since 4.0.0
	 */
	public long count(String column, GeometryEnvelope envelope, String where,
			String[] whereArgs) {
		return count(false, column, envelope, where, whereArgs);
	}

	/**
	 * Query for feature index count within the Geometry Envelope
	 *
	 * @param distinct
	 *            distinct column values
	 * @param column
	 *            count column name
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @return count
	 * @since 4.0.0
	 */
	public long count(boolean distinct, String column,
			GeometryEnvelope envelope, String where, String[] whereArgs) {
		Long count = null;
		for (FeatureIndexType type : getLocation()) {
			try {
				switch (type) {
				case GEOPACKAGE:
					count = (long) featureTableIndex.countFeatures(distinct,
							column, envelope, where, whereArgs);
					break;
				case RTREE:
					count = (long) rTreeIndexTableDao.countFeatures(distinct,
							column, envelope, where, whereArgs);
					break;
				default:
					throw new GeoPackageException(
							"Unsupported feature index type: " + type);
				}
				break;
			} catch (Exception e) {
				if (continueOnError) {
					LOGGER.log(Level.SEVERE,
							"Failed to count from feature index: " + type, e);
				} else {
					throw e;
				}
			}
		}
		if (count == null) {
			if (column != null) {
				throw new GeoPackageException(
						"Count by column and envelope is unsupported as a manual feature query. column: "
								+ column);
			} else {
				count = manualFeatureQuery.count(envelope, where, whereArgs);
			}
		}
		return count;
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @return feature index results, close when done
	 */
	public FeatureIndexResults query(BoundingBox boundingBox,
			Projection projection) {
		return query(false, boundingBox, projection);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection
	 *
	 * @param distinct
	 *            distinct rows
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @return feature index results, close when done
	 * @since 4.0.0
	 */
	public FeatureIndexResults query(boolean distinct, BoundingBox boundingBox,
			Projection projection) {
		BoundingBox featureBoundingBox = featureDao
				.projectBoundingBox(boundingBox, projection);
		return query(distinct, featureBoundingBox);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection
	 *
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @return feature index results, close when done
	 * @since 3.5.0
	 */
	public FeatureIndexResults query(String[] columns, BoundingBox boundingBox,
			Projection projection) {
		return query(false, columns, boundingBox, projection);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @return feature index results, close when done
	 * @since 4.0.0
	 */
	public FeatureIndexResults query(boolean distinct, String[] columns,
			BoundingBox boundingBox, Projection projection) {
		BoundingBox featureBoundingBox = featureDao
				.projectBoundingBox(boundingBox, projection);
		return query(distinct, columns, featureBoundingBox);
	}

	/**
	 * Query for feature index count within the bounding box in the provided
	 * projection
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @return count
	 */
	public long count(BoundingBox boundingBox, Projection projection) {
		return count(false, null, boundingBox, projection);
	}

	/**
	 * Query for feature index count within the bounding box in the provided
	 * projection
	 *
	 * @param column
	 *            count column name
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @return count
	 * @since 4.0.0
	 */
	public long count(String column, BoundingBox boundingBox,
			Projection projection) {
		return count(false, column, boundingBox, projection);
	}

	/**
	 * Query for feature index count within the bounding box in the provided
	 * projection
	 *
	 * @param distinct
	 *            distinct column values
	 * @param column
	 *            count column name
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @return count
	 * @since 4.0.0
	 */
	public long count(boolean distinct, String column, BoundingBox boundingBox,
			Projection projection) {
		BoundingBox featureBoundingBox = featureDao
				.projectBoundingBox(boundingBox, projection);
		return count(distinct, column, featureBoundingBox);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param fieldValues
	 *            field values
	 * @return feature index results, close when done
	 * @since 3.4.0
	 */
	public FeatureIndexResults query(BoundingBox boundingBox,
			Projection projection, Map<String, Object> fieldValues) {
		return query(false, boundingBox, projection, fieldValues);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection
	 *
	 * @param distinct
	 *            distinct rows
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param fieldValues
	 *            field values
	 * @return feature index results, close when done
	 * @since 4.0.0
	 */
	public FeatureIndexResults query(boolean distinct, BoundingBox boundingBox,
			Projection projection, Map<String, Object> fieldValues) {
		BoundingBox featureBoundingBox = featureDao
				.projectBoundingBox(boundingBox, projection);
		return query(distinct, featureBoundingBox, fieldValues);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection
	 *
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param fieldValues
	 *            field values
	 * @return feature index results, close when done
	 * @since 3.5.0
	 */
	public FeatureIndexResults query(String[] columns, BoundingBox boundingBox,
			Projection projection, Map<String, Object> fieldValues) {
		return query(false, columns, boundingBox, projection, fieldValues);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param fieldValues
	 *            field values
	 * @return feature index results, close when done
	 * @since 4.0.0
	 */
	public FeatureIndexResults query(boolean distinct, String[] columns,
			BoundingBox boundingBox, Projection projection,
			Map<String, Object> fieldValues) {
		BoundingBox featureBoundingBox = featureDao
				.projectBoundingBox(boundingBox, projection);
		return query(distinct, columns, featureBoundingBox, fieldValues);
	}

	/**
	 * Query for feature index count within the bounding box in the provided
	 * projection
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param fieldValues
	 *            field values
	 * @return count
	 * @since 3.4.0
	 */
	public long count(BoundingBox boundingBox, Projection projection,
			Map<String, Object> fieldValues) {
		return count(false, null, boundingBox, projection, fieldValues);
	}

	/**
	 * Query for feature index count within the bounding box in the provided
	 * projection
	 *
	 * @param column
	 *            count column value
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param fieldValues
	 *            field values
	 * @return count
	 * @since 4.0.0
	 */
	public long count(String column, BoundingBox boundingBox,
			Projection projection, Map<String, Object> fieldValues) {
		return count(false, column, boundingBox, projection, fieldValues);
	}

	/**
	 * Query for feature index count within the bounding box in the provided
	 * projection
	 *
	 * @param distinct
	 *            distinct column values
	 * @param column
	 *            count column value
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param fieldValues
	 *            field values
	 * @return count
	 * @since 4.0.0
	 */
	public long count(boolean distinct, String column, BoundingBox boundingBox,
			Projection projection, Map<String, Object> fieldValues) {
		BoundingBox featureBoundingBox = featureDao
				.projectBoundingBox(boundingBox, projection);
		return count(distinct, column, featureBoundingBox, fieldValues);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @return feature index results, close when done
	 * @since 3.4.0
	 */
	public FeatureIndexResults query(BoundingBox boundingBox,
			Projection projection, String where) {
		return query(false, boundingBox, projection, where);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection
	 *
	 * @param distinct
	 *            distinct rows
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @return feature index results, close when done
	 * @since 4.0.0
	 */
	public FeatureIndexResults query(boolean distinct, BoundingBox boundingBox,
			Projection projection, String where) {
		return query(distinct, boundingBox, projection, where, null);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection
	 *
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @return feature index results, close when done
	 * @since 3.5.0
	 */
	public FeatureIndexResults query(String[] columns, BoundingBox boundingBox,
			Projection projection, String where) {
		return query(false, columns, boundingBox, projection, where);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @return feature index results, close when done
	 * @since 4.0.0
	 */
	public FeatureIndexResults query(boolean distinct, String[] columns,
			BoundingBox boundingBox, Projection projection, String where) {
		return query(distinct, columns, boundingBox, projection, where, null);
	}

	/**
	 * Query for feature index count within the bounding box in the provided
	 * projection
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @return count
	 * @since 3.4.0
	 */
	public long count(BoundingBox boundingBox, Projection projection,
			String where) {
		return count(false, null, boundingBox, projection, where);
	}

	/**
	 * Query for feature index count within the bounding box in the provided
	 * projection
	 *
	 * @param column
	 *            count column name
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @return count
	 * @since 4.0.0
	 */
	public long count(String column, BoundingBox boundingBox,
			Projection projection, String where) {
		return count(false, column, boundingBox, projection, where);
	}

	/**
	 * Query for feature index count within the bounding box in the provided
	 * projection
	 *
	 * @param distinct
	 *            distinct column values
	 * @param column
	 *            count column name
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @return count
	 * @since 4.0.0
	 */
	public long count(boolean distinct, String column, BoundingBox boundingBox,
			Projection projection, String where) {
		return count(distinct, column, boundingBox, projection, where, null);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @return feature index results, close when done
	 * @since 3.4.0
	 */
	public FeatureIndexResults query(BoundingBox boundingBox,
			Projection projection, String where, String[] whereArgs) {
		return query(false, boundingBox, projection, where, whereArgs);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection
	 *
	 * @param distinct
	 *            distinct rows
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @return feature index results, close when done
	 * @since 4.0.0
	 */
	public FeatureIndexResults query(boolean distinct, BoundingBox boundingBox,
			Projection projection, String where, String[] whereArgs) {
		BoundingBox featureBoundingBox = featureDao
				.projectBoundingBox(boundingBox, projection);
		return query(distinct, featureBoundingBox, where, whereArgs);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection
	 *
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @return feature index results, close when done
	 * @since 3.5.0
	 */
	public FeatureIndexResults query(String[] columns, BoundingBox boundingBox,
			Projection projection, String where, String[] whereArgs) {
		return query(false, columns, boundingBox, projection, where, whereArgs);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @return feature index results, close when done
	 * @since 4.0.0
	 */
	public FeatureIndexResults query(boolean distinct, String[] columns,
			BoundingBox boundingBox, Projection projection, String where,
			String[] whereArgs) {
		BoundingBox featureBoundingBox = featureDao
				.projectBoundingBox(boundingBox, projection);
		return query(distinct, columns, featureBoundingBox, where, whereArgs);
	}

	/**
	 * Query for feature index count within the bounding box in the provided
	 * projection
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @return count
	 * @since 3.4.0
	 */
	public long count(BoundingBox boundingBox, Projection projection,
			String where, String[] whereArgs) {
		return count(false, null, boundingBox, projection, where, whereArgs);
	}

	/**
	 * Query for feature index count within the bounding box in the provided
	 * projection
	 *
	 * @param column
	 *            count column name
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @return count
	 * @since 4.0.0
	 */
	public long count(String column, BoundingBox boundingBox,
			Projection projection, String where, String[] whereArgs) {
		return count(false, column, boundingBox, projection, where, whereArgs);
	}

	/**
	 * Query for feature index count within the bounding box in the provided
	 * projection
	 *
	 * @param distinct
	 *            distinct column values
	 * @param column
	 *            count column name
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @return count
	 * @since 4.0.0
	 */
	public long count(boolean distinct, String column, BoundingBox boundingBox,
			Projection projection, String where, String[] whereArgs) {
		BoundingBox featureBoundingBox = featureDao
				.projectBoundingBox(boundingBox, projection);
		return count(distinct, column, featureBoundingBox, where, whereArgs);
	}

	/**
	 * Determine if the results are paginated
	 * 
	 * @param results
	 *            query results
	 * @return true if paginated
	 * @since 6.2.0
	 */
	public static boolean isPaginated(FeatureIndexResults results) {
		boolean paginated = false;
		if (results instanceof FeatureIndexFeatureResults) {
			paginated = isPaginated((FeatureIndexFeatureResults) results);
		}
		return paginated;
	}

	/**
	 * Determine if the results are paginated
	 * 
	 * @param results
	 *            query results
	 * @return true if paginated
	 * @since 6.2.0
	 */
	public static boolean isPaginated(FeatureIndexFeatureResults results) {
		return FeaturePaginatedResults.isPaginated(results.getResultSet());
	}

	/**
	 * Paginate the results
	 * 
	 * @param results
	 *            feature index results
	 * @return feature paginated results
	 * @since 6.2.0
	 */
	public FeaturePaginatedResults paginate(FeatureIndexResults results) {
		return paginate(getFeatureDao(), results);
	}

	/**
	 * Paginate the results
	 * 
	 * @param featureDao
	 *            feature dao
	 * @param results
	 *            feature index results
	 * @return feature paginated results
	 * @since 6.2.0
	 */
	public static FeaturePaginatedResults paginate(FeatureDao featureDao,
			FeatureIndexResults results) {
		if (!(results instanceof FeatureIndexFeatureResults)) {
			throw new GeoPackageException(
					"Results do not contain a feature result set. Expected: "
							+ FeatureIndexFeatureResults.class.getSimpleName()
							+ ", Received: "
							+ results.getClass().getSimpleName());
		}
		return FeaturePaginatedResults.create(featureDao,
				((FeatureIndexFeatureResults) results).getResultSet());
	}

	/**
	 * Query for all feature index results ordered by id, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param limit
	 *            chunk limit
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(int limit) {
		return queryForChunk(getIdColumn(), limit);
	}

	/**
	 * Query for all feature index results ordered by id, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(int limit, long offset) {
		return queryForChunk(getIdColumn(), limit, offset);
	}

	/**
	 * Query for all feature index results, starting at the offset and returning
	 * no more than the limit
	 *
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String orderBy, int limit) {
		return queryForChunk(false, orderBy, limit);
	}

	/**
	 * Query for all feature index results, starting at the offset and returning
	 * no more than the limit
	 *
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String orderBy, int limit,
			long offset) {
		return queryForChunk(false, orderBy, limit, offset);
	}

	/**
	 * Query for all feature index results ordered by id, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, int limit) {
		return queryForChunk(distinct, getIdColumn(), limit);
	}

	/**
	 * Query for all feature index results ordered by id, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, int limit,
			long offset) {
		return queryForChunk(distinct, getIdColumn(), limit, offset);
	}

	/**
	 * Query for all feature index results, starting at the offset and returning
	 * no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String orderBy,
			int limit) {
		return queryForChunk(distinct, featureDao.getColumnNames(), orderBy,
				limit);
	}

	/**
	 * Query for all feature index results, starting at the offset and returning
	 * no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String orderBy,
			int limit, long offset) {
		return queryForChunk(distinct, featureDao.getColumnNames(), orderBy,
				limit, offset);
	}

	/**
	 * Query for all feature index results ordered by id, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param columns
	 *            columns
	 * @param limit
	 *            chunk limit
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns, int limit) {
		return queryForChunk(columns, getIdColumn(), limit);
	}

	/**
	 * Query for all feature index results ordered by id, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param columns
	 *            columns
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns, int limit,
			long offset) {
		return queryForChunk(columns, getIdColumn(), limit, offset);
	}

	/**
	 * Query for all feature index results, starting at the offset and returning
	 * no more than the limit
	 *
	 * @param columns
	 *            columns
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns, String orderBy,
			int limit) {
		return queryForChunk(false, columns, orderBy, limit);
	}

	/**
	 * Query for all feature index results, starting at the offset and returning
	 * no more than the limit
	 *
	 * @param columns
	 *            columns
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns, String orderBy,
			int limit, long offset) {
		return queryForChunk(false, columns, orderBy, limit, offset);
	}

	/**
	 * Query for all feature index results ordered by id, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param limit
	 *            chunk limit
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			int limit) {
		return queryForChunk(distinct, columns, getIdColumn(), limit);
	}

	/**
	 * Query for all feature index results ordered by id, starting at the offset
	 * and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			int limit, long offset) {
		return queryForChunk(distinct, columns, getIdColumn(), limit, offset);
	}

	/**
	 * Query for all feature index results, starting at the offset and returning
	 * no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			String orderBy, int limit) {
		return queryForChunk(distinct, columns, orderBy, limit, 0);
	}

	/**
	 * Query for all feature index results, starting at the offset and returning
	 * no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			String orderBy, int limit, long offset) {
		FeatureIndexResults results = null;
		for (FeatureIndexType type : getLocation()) {
			try {
				switch (type) {
				case GEOPACKAGE:
					FeatureResultSet geoPackageResultSet = featureTableIndex
							.queryFeaturesForChunk(distinct, columns, orderBy,
									limit, offset);
					results = new FeatureIndexFeatureResults(
							geoPackageResultSet);
					break;
				case RTREE:
					FeatureResultSet rTreeResultSet = rTreeIndexTableDao
							.queryFeaturesForChunk(distinct, columns, orderBy,
									limit, offset);
					results = new FeatureIndexFeatureResults(rTreeResultSet);
					break;
				default:
					throw new GeoPackageException(
							"Unsupported feature index type: " + type);
				}
				break;
			} catch (Exception e) {
				if (continueOnError) {
					LOGGER.log(Level.SEVERE,
							"Failed to query from feature index: " + type, e);
				} else {
					throw e;
				}
			}
		}
		if (results == null) {
			FeatureResultSet featureResultSet = manualFeatureQuery
					.queryForChunk(distinct, columns, orderBy, limit, offset);
			results = new FeatureIndexFeatureResults(featureResultSet);
		}
		return results;
	}

	/**
	 * Query for feature index results ordered by id, starting at the offset and
	 * returning no more than the limit
	 * 
	 * @param fieldValues
	 *            field values
	 * @param limit
	 *            chunk limit
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(Map<String, Object> fieldValues,
			int limit) {
		return queryForChunk(fieldValues, getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id, starting at the offset and
	 * returning no more than the limit
	 * 
	 * @param fieldValues
	 *            field values
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(Map<String, Object> fieldValues,
			int limit, long offset) {
		return queryForChunk(fieldValues, getIdColumn(), limit, offset);
	}

	/**
	 * Query for feature index results, starting at the offset and returning no
	 * more than the limit
	 * 
	 * @param fieldValues
	 *            field values
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(Map<String, Object> fieldValues,
			String orderBy, int limit) {
		return queryForChunk(false, fieldValues, orderBy, limit);
	}

	/**
	 * Query for feature index results, starting at the offset and returning no
	 * more than the limit
	 * 
	 * @param fieldValues
	 *            field values
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(Map<String, Object> fieldValues,
			String orderBy, int limit, long offset) {
		return queryForChunk(false, fieldValues, orderBy, limit, offset);
	}

	/**
	 * Query for feature index results ordered by id, starting at the offset and
	 * returning no more than the limit
	 * 
	 * @param distinct
	 *            distinct rows
	 * @param fieldValues
	 *            field values
	 * @param limit
	 *            chunk limit
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			Map<String, Object> fieldValues, int limit) {
		return queryForChunk(distinct, fieldValues, getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id, starting at the offset and
	 * returning no more than the limit
	 * 
	 * @param distinct
	 *            distinct rows
	 * @param fieldValues
	 *            field values
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			Map<String, Object> fieldValues, int limit, long offset) {
		return queryForChunk(distinct, fieldValues, getIdColumn(), limit,
				offset);
	}

	/**
	 * Query for feature index results, starting at the offset and returning no
	 * more than the limit
	 * 
	 * @param distinct
	 *            distinct rows
	 * @param fieldValues
	 *            field values
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			Map<String, Object> fieldValues, String orderBy, int limit) {
		String where = featureDao.buildWhere(fieldValues.entrySet());
		String[] whereArgs = featureDao.buildWhereArgs(fieldValues.values());
		return queryForChunk(distinct, where, whereArgs, orderBy, limit);
	}

	/**
	 * Query for feature index results, starting at the offset and returning no
	 * more than the limit
	 * 
	 * @param distinct
	 *            distinct rows
	 * @param fieldValues
	 *            field values
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			Map<String, Object> fieldValues, String orderBy, int limit,
			long offset) {
		String where = featureDao.buildWhere(fieldValues.entrySet());
		String[] whereArgs = featureDao.buildWhereArgs(fieldValues.values());
		return queryForChunk(distinct, where, whereArgs, orderBy, limit,
				offset);
	}

	/**
	 * Query for feature index results ordered by id, starting at the offset and
	 * returning no more than the limit
	 * 
	 * @param columns
	 *            columns
	 * @param fieldValues
	 *            field values
	 * @param limit
	 *            chunk limit
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			Map<String, Object> fieldValues, int limit) {
		return queryForChunk(columns, fieldValues, getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id, starting at the offset and
	 * returning no more than the limit
	 * 
	 * @param columns
	 *            columns
	 * @param fieldValues
	 *            field values
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			Map<String, Object> fieldValues, int limit, long offset) {
		return queryForChunk(columns, fieldValues, getIdColumn(), limit,
				offset);
	}

	/**
	 * Query for feature index results, starting at the offset and returning no
	 * more than the limit
	 * 
	 * @param columns
	 *            columns
	 * @param fieldValues
	 *            field values
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			Map<String, Object> fieldValues, String orderBy, int limit) {
		return queryForChunk(false, columns, fieldValues, orderBy, limit);
	}

	/**
	 * Query for feature index results, starting at the offset and returning no
	 * more than the limit
	 * 
	 * @param columns
	 *            columns
	 * @param fieldValues
	 *            field values
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			Map<String, Object> fieldValues, String orderBy, int limit,
			long offset) {
		return queryForChunk(false, columns, fieldValues, orderBy, limit,
				offset);
	}

	/**
	 * Query for feature index results ordered by id, starting at the offset and
	 * returning no more than the limit
	 * 
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param fieldValues
	 *            field values
	 * @param limit
	 *            chunk limit
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			Map<String, Object> fieldValues, int limit) {
		return queryForChunk(distinct, columns, fieldValues, getIdColumn(),
				limit);
	}

	/**
	 * Query for feature index results ordered by id, starting at the offset and
	 * returning no more than the limit
	 * 
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param fieldValues
	 *            field values
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			Map<String, Object> fieldValues, int limit, long offset) {
		return queryForChunk(distinct, columns, fieldValues, getIdColumn(),
				limit, offset);
	}

	/**
	 * Query for feature index results, starting at the offset and returning no
	 * more than the limit
	 * 
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param fieldValues
	 *            field values
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			Map<String, Object> fieldValues, String orderBy, int limit) {
		String where = featureDao.buildWhere(fieldValues.entrySet());
		String[] whereArgs = featureDao.buildWhereArgs(fieldValues.values());
		return queryForChunk(distinct, columns, where, whereArgs, orderBy,
				limit);
	}

	/**
	 * Query for feature index results, starting at the offset and returning no
	 * more than the limit
	 * 
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param fieldValues
	 *            field values
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			Map<String, Object> fieldValues, String orderBy, int limit,
			long offset) {
		String where = featureDao.buildWhere(fieldValues.entrySet());
		String[] whereArgs = featureDao.buildWhereArgs(fieldValues.values());
		return queryForChunk(distinct, columns, where, whereArgs, orderBy,
				limit, offset);
	}

	/**
	 * Query for feature index results ordered by id, starting at the offset and
	 * returning no more than the limit
	 * 
	 * @param where
	 *            where clause
	 * @param limit
	 *            chunk limit
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunkIdOrder(String where, int limit) {
		return queryForChunk(where, getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id, starting at the offset and
	 * returning no more than the limit
	 * 
	 * @param where
	 *            where clause
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunkIdOrder(String where, int limit,
			long offset) {
		return queryForChunk(where, getIdColumn(), limit, offset);
	}

	/**
	 * Query for feature index results, starting at the offset and returning no
	 * more than the limit
	 * 
	 * @param where
	 *            where clause
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String where, String orderBy,
			int limit) {
		return queryForChunk(false, where, orderBy, limit);
	}

	/**
	 * Query for feature index results, starting at the offset and returning no
	 * more than the limit
	 * 
	 * @param where
	 *            where clause
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String where, String orderBy,
			int limit, long offset) {
		return queryForChunk(false, where, orderBy, limit, offset);
	}

	/**
	 * Query for feature index results ordered by id, starting at the offset and
	 * returning no more than the limit
	 * 
	 * @param distinct
	 *            distinct rows
	 * @param where
	 *            where clause
	 * @param limit
	 *            chunk limit
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunkIdOrder(boolean distinct,
			String where, int limit) {
		return queryForChunk(distinct, where, getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id, starting at the offset and
	 * returning no more than the limit
	 * 
	 * @param distinct
	 *            distinct rows
	 * @param where
	 *            where clause
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunkIdOrder(boolean distinct,
			String where, int limit, long offset) {
		return queryForChunk(distinct, where, getIdColumn(), limit, offset);
	}

	/**
	 * Query for feature index results, starting at the offset and returning no
	 * more than the limit
	 * 
	 * @param distinct
	 *            distinct rows
	 * @param where
	 *            where clause
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String where,
			String orderBy, int limit) {
		return queryForChunk(distinct, where, null, orderBy, limit);
	}

	/**
	 * Query for feature index results, starting at the offset and returning no
	 * more than the limit
	 * 
	 * @param distinct
	 *            distinct rows
	 * @param where
	 *            where clause
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String where,
			String orderBy, int limit, long offset) {
		return queryForChunk(distinct, where, null, orderBy, limit, offset);
	}

	/**
	 * Query for feature index results ordered by id, starting at the offset and
	 * returning no more than the limit
	 * 
	 * @param columns
	 *            columns
	 * @param where
	 *            where clause
	 * @param limit
	 *            chunk limit
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunkIdOrder(String[] columns,
			String where, int limit) {
		return queryForChunk(columns, where, getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id, starting at the offset and
	 * returning no more than the limit
	 * 
	 * @param columns
	 *            columns
	 * @param where
	 *            where clause
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunkIdOrder(String[] columns,
			String where, int limit, long offset) {
		return queryForChunk(columns, where, getIdColumn(), limit, offset);
	}

	/**
	 * Query for feature index results, starting at the offset and returning no
	 * more than the limit
	 * 
	 * @param columns
	 *            columns
	 * @param where
	 *            where clause
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns, String where,
			String orderBy, int limit) {
		return queryForChunk(false, columns, where, orderBy, limit);
	}

	/**
	 * Query for feature index results, starting at the offset and returning no
	 * more than the limit
	 * 
	 * @param columns
	 *            columns
	 * @param where
	 *            where clause
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns, String where,
			String orderBy, int limit, long offset) {
		return queryForChunk(false, columns, where, orderBy, limit, offset);
	}

	/**
	 * Query for feature index results ordered by id, starting at the offset and
	 * returning no more than the limit
	 * 
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param where
	 *            where clause
	 * @param limit
	 *            chunk limit
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunkIdOrder(boolean distinct,
			String[] columns, String where, int limit) {
		return queryForChunk(distinct, columns, where, getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id, starting at the offset and
	 * returning no more than the limit
	 * 
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param where
	 *            where clause
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunkIdOrder(boolean distinct,
			String[] columns, String where, int limit, long offset) {
		return queryForChunk(distinct, columns, where, getIdColumn(), limit,
				offset);
	}

	/**
	 * Query for feature index results, starting at the offset and returning no
	 * more than the limit
	 * 
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param where
	 *            where clause
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			String where, String orderBy, int limit) {
		return queryForChunk(distinct, columns, where, null, orderBy, limit);
	}

	/**
	 * Query for feature index results, starting at the offset and returning no
	 * more than the limit
	 * 
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param where
	 *            where clause
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			String where, String orderBy, int limit, long offset) {
		return queryForChunk(distinct, columns, where, null, orderBy, limit,
				offset);
	}

	/**
	 * Query for feature index results ordered by id, starting at the offset and
	 * returning no more than the limit
	 * 
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param limit
	 *            chunk limit
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String where, String[] whereArgs,
			int limit) {
		return queryForChunk(where, whereArgs, getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id, starting at the offset and
	 * returning no more than the limit
	 * 
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String where, String[] whereArgs,
			int limit, long offset) {
		return queryForChunk(where, whereArgs, getIdColumn(), limit, offset);
	}

	/**
	 * Query for feature index results, starting at the offset and returning no
	 * more than the limit
	 * 
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String where, String[] whereArgs,
			String orderBy, int limit) {
		return queryForChunk(false, where, whereArgs, orderBy, limit);
	}

	/**
	 * Query for feature index results, starting at the offset and returning no
	 * more than the limit
	 * 
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String where, String[] whereArgs,
			String orderBy, int limit, long offset) {
		return queryForChunk(false, where, whereArgs, orderBy, limit, offset);
	}

	/**
	 * Query for feature index results ordered by id, starting at the offset and
	 * returning no more than the limit
	 * 
	 * @param distinct
	 *            distinct rows
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param limit
	 *            chunk limit
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String where,
			String[] whereArgs, int limit) {
		return queryForChunk(distinct, where, whereArgs, getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id, starting at the offset and
	 * returning no more than the limit
	 * 
	 * @param distinct
	 *            distinct rows
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String where,
			String[] whereArgs, int limit, long offset) {
		return queryForChunk(distinct, where, whereArgs, getIdColumn(), limit,
				offset);
	}

	/**
	 * Query for feature index results, starting at the offset and returning no
	 * more than the limit
	 * 
	 * @param distinct
	 *            distinct rows
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String where,
			String[] whereArgs, String orderBy, int limit) {
		return queryForChunk(distinct, featureDao.getColumnNames(), where,
				whereArgs, orderBy, limit);
	}

	/**
	 * Query for feature index results, starting at the offset and returning no
	 * more than the limit
	 * 
	 * @param distinct
	 *            distinct rows
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String where,
			String[] whereArgs, String orderBy, int limit, long offset) {
		return queryForChunk(distinct, featureDao.getColumnNames(), where,
				whereArgs, orderBy, limit, offset);
	}

	/**
	 * Query for feature index results ordered by id, starting at the offset and
	 * returning no more than the limit
	 * 
	 * @param columns
	 *            columns
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param limit
	 *            chunk limit
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns, String where,
			String[] whereArgs, int limit) {
		return queryForChunk(columns, where, whereArgs, getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id, starting at the offset and
	 * returning no more than the limit
	 * 
	 * @param columns
	 *            columns
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns, String where,
			String[] whereArgs, int limit, long offset) {
		return queryForChunk(columns, where, whereArgs, getIdColumn(), limit,
				offset);
	}

	/**
	 * Query for feature index results, starting at the offset and returning no
	 * more than the limit
	 * 
	 * @param columns
	 *            columns
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns, String where,
			String[] whereArgs, String orderBy, int limit) {
		return queryForChunk(false, columns, where, whereArgs, orderBy, limit);
	}

	/**
	 * Query for feature index results, starting at the offset and returning no
	 * more than the limit
	 * 
	 * @param columns
	 *            columns
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns, String where,
			String[] whereArgs, String orderBy, int limit, long offset) {
		return queryForChunk(false, columns, where, whereArgs, orderBy, limit,
				offset);
	}

	/**
	 * Query for feature index results ordered by id, starting at the offset and
	 * returning no more than the limit
	 * 
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param limit
	 *            chunk limit
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			String where, String[] whereArgs, int limit) {
		return queryForChunk(distinct, columns, where, whereArgs, getIdColumn(),
				limit);
	}

	/**
	 * Query for feature index results ordered by id, starting at the offset and
	 * returning no more than the limit
	 * 
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			String where, String[] whereArgs, int limit, long offset) {
		return queryForChunk(distinct, columns, where, whereArgs, getIdColumn(),
				limit, offset);
	}

	/**
	 * Query for feature index results, starting at the offset and returning no
	 * more than the limit
	 * 
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			String where, String[] whereArgs, String orderBy, int limit) {
		return queryForChunk(distinct, columns, where, whereArgs, orderBy,
				limit, 0);
	}

	/**
	 * Query for feature index results, starting at the offset and returning no
	 * more than the limit
	 * 
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 *
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			String where, String[] whereArgs, String orderBy, int limit,
			long offset) {
		FeatureIndexResults results = null;
		for (FeatureIndexType type : getLocation()) {
			try {
				switch (type) {
				case GEOPACKAGE:
					FeatureResultSet geoPackageResultSet = featureTableIndex
							.queryFeaturesForChunk(distinct, columns, where,
									whereArgs, orderBy, limit, offset);
					results = new FeatureIndexFeatureResults(
							geoPackageResultSet);
					break;
				case RTREE:
					FeatureResultSet rTreeResultSet = rTreeIndexTableDao
							.queryFeaturesForChunk(distinct, columns, where,
									whereArgs, orderBy, limit, offset);
					results = new FeatureIndexFeatureResults(rTreeResultSet);
					break;
				default:
					throw new GeoPackageException(
							"Unsupported feature index type: " + type);
				}
				break;
			} catch (Exception e) {
				if (continueOnError) {
					LOGGER.log(Level.SEVERE,
							"Failed to query from feature index: " + type, e);
				} else {
					throw e;
				}
			}
		}
		if (results == null) {
			FeatureResultSet featureResultSet = manualFeatureQuery
					.queryForChunk(distinct, columns, where, whereArgs, orderBy,
							limit, offset);
			results = new FeatureIndexFeatureResults(featureResultSet);
		}
		return results;
	}

	/**
	 * Query for feature index results ordered by id within the bounding box,
	 * projected correctly, starting at the offset and returning no more than
	 * the limit
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(BoundingBox boundingBox,
			int limit) {
		return queryForChunk(boundingBox, getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box,
	 * projected correctly, starting at the offset and returning no more than
	 * the limit
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(BoundingBox boundingBox, int limit,
			long offset) {
		return queryForChunk(boundingBox, getIdColumn(), limit, offset);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly, starting at the offset and returning no more than the limit
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(BoundingBox boundingBox,
			String orderBy, int limit) {
		return queryForChunk(false, boundingBox, orderBy, limit);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly, starting at the offset and returning no more than the limit
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(BoundingBox boundingBox,
			String orderBy, int limit, long offset) {
		return queryForChunk(false, boundingBox, orderBy, limit, offset);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box,
	 * projected correctly, starting at the offset and returning no more than
	 * the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param boundingBox
	 *            bounding box
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			BoundingBox boundingBox, int limit) {
		return queryForChunk(distinct, boundingBox, getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box,
	 * projected correctly, starting at the offset and returning no more than
	 * the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param boundingBox
	 *            bounding box
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			BoundingBox boundingBox, int limit, long offset) {
		return queryForChunk(distinct, boundingBox, getIdColumn(), limit,
				offset);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param boundingBox
	 *            bounding box
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			BoundingBox boundingBox, String orderBy, int limit) {
		return queryForChunk(distinct, boundingBox.buildEnvelope(), orderBy,
				limit);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param boundingBox
	 *            bounding box
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			BoundingBox boundingBox, String orderBy, int limit, long offset) {
		return queryForChunk(distinct, boundingBox.buildEnvelope(), orderBy,
				limit, offset);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box,
	 * projected correctly, starting at the offset and returning no more than
	 * the limit
	 *
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			BoundingBox boundingBox, int limit) {
		return queryForChunk(columns, boundingBox, getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box,
	 * projected correctly, starting at the offset and returning no more than
	 * the limit
	 *
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			BoundingBox boundingBox, int limit, long offset) {
		return queryForChunk(columns, boundingBox, getIdColumn(), limit,
				offset);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly, starting at the offset and returning no more than the limit
	 *
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			BoundingBox boundingBox, String orderBy, int limit) {
		return queryForChunk(false, columns, boundingBox, orderBy, limit);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly, starting at the offset and returning no more than the limit
	 *
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			BoundingBox boundingBox, String orderBy, int limit, long offset) {
		return queryForChunk(false, columns, boundingBox, orderBy, limit,
				offset);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box,
	 * projected correctly, starting at the offset and returning no more than
	 * the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			BoundingBox boundingBox, int limit) {
		return queryForChunk(distinct, columns, boundingBox, getIdColumn(),
				limit);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box,
	 * projected correctly, starting at the offset and returning no more than
	 * the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			BoundingBox boundingBox, int limit, long offset) {
		return queryForChunk(distinct, columns, boundingBox, getIdColumn(),
				limit, offset);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			BoundingBox boundingBox, String orderBy, int limit) {
		return queryForChunk(distinct, columns, boundingBox.buildEnvelope(),
				orderBy, limit);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			BoundingBox boundingBox, String orderBy, int limit, long offset) {
		return queryForChunk(distinct, columns, boundingBox.buildEnvelope(),
				orderBy, limit, offset);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box,
	 * projected correctly, starting at the offset and returning no more than
	 * the limit
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param fieldValues
	 *            field values
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(BoundingBox boundingBox,
			Map<String, Object> fieldValues, int limit) {
		return queryForChunk(boundingBox, fieldValues, getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box,
	 * projected correctly, starting at the offset and returning no more than
	 * the limit
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param fieldValues
	 *            field values
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(BoundingBox boundingBox,
			Map<String, Object> fieldValues, int limit, long offset) {
		return queryForChunk(boundingBox, fieldValues, getIdColumn(), limit,
				offset);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly, starting at the offset and returning no more than the limit
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param fieldValues
	 *            field values
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(BoundingBox boundingBox,
			Map<String, Object> fieldValues, String orderBy, int limit) {
		return queryForChunk(false, boundingBox, fieldValues, orderBy, limit);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly, starting at the offset and returning no more than the limit
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param fieldValues
	 *            field values
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(BoundingBox boundingBox,
			Map<String, Object> fieldValues, String orderBy, int limit,
			long offset) {
		return queryForChunk(false, boundingBox, fieldValues, orderBy, limit,
				offset);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box,
	 * projected correctly, starting at the offset and returning no more than
	 * the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param boundingBox
	 *            bounding box
	 * @param fieldValues
	 *            field values
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			BoundingBox boundingBox, Map<String, Object> fieldValues,
			int limit) {
		return queryForChunk(distinct, boundingBox, fieldValues, getIdColumn(),
				limit);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box,
	 * projected correctly, starting at the offset and returning no more than
	 * the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param boundingBox
	 *            bounding box
	 * @param fieldValues
	 *            field values
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			BoundingBox boundingBox, Map<String, Object> fieldValues, int limit,
			long offset) {
		return queryForChunk(distinct, boundingBox, fieldValues, getIdColumn(),
				limit, offset);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param boundingBox
	 *            bounding box
	 * @param fieldValues
	 *            field values
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			BoundingBox boundingBox, Map<String, Object> fieldValues,
			String orderBy, int limit) {
		return queryForChunk(distinct, boundingBox.buildEnvelope(), fieldValues,
				orderBy, limit);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param boundingBox
	 *            bounding box
	 * @param fieldValues
	 *            field values
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			BoundingBox boundingBox, Map<String, Object> fieldValues,
			String orderBy, int limit, long offset) {
		return queryForChunk(distinct, boundingBox.buildEnvelope(), fieldValues,
				orderBy, limit, offset);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box,
	 * projected correctly, starting at the offset and returning no more than
	 * the limit
	 *
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param fieldValues
	 *            field values
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			BoundingBox boundingBox, Map<String, Object> fieldValues,
			int limit) {
		return queryForChunk(columns, boundingBox, fieldValues, getIdColumn(),
				limit);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box,
	 * projected correctly, starting at the offset and returning no more than
	 * the limit
	 *
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param fieldValues
	 *            field values
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			BoundingBox boundingBox, Map<String, Object> fieldValues, int limit,
			long offset) {
		return queryForChunk(columns, boundingBox, fieldValues, getIdColumn(),
				limit, offset);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly, starting at the offset and returning no more than the limit
	 *
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param fieldValues
	 *            field values
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			BoundingBox boundingBox, Map<String, Object> fieldValues,
			String orderBy, int limit) {
		return queryForChunk(false, columns, boundingBox, fieldValues, orderBy,
				limit);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly, starting at the offset and returning no more than the limit
	 *
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param fieldValues
	 *            field values
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			BoundingBox boundingBox, Map<String, Object> fieldValues,
			String orderBy, int limit, long offset) {
		return queryForChunk(false, columns, boundingBox, fieldValues, orderBy,
				limit, offset);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box,
	 * projected correctly, starting at the offset and returning no more than
	 * the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param fieldValues
	 *            field values
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			BoundingBox boundingBox, Map<String, Object> fieldValues,
			int limit) {
		return queryForChunk(distinct, columns, boundingBox, fieldValues,
				getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box,
	 * projected correctly, starting at the offset and returning no more than
	 * the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param fieldValues
	 *            field values
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			BoundingBox boundingBox, Map<String, Object> fieldValues, int limit,
			long offset) {
		return queryForChunk(distinct, columns, boundingBox, fieldValues,
				getIdColumn(), limit, offset);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param fieldValues
	 *            field values
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			BoundingBox boundingBox, Map<String, Object> fieldValues,
			String orderBy, int limit) {
		return queryForChunk(distinct, columns, boundingBox.buildEnvelope(),
				fieldValues, orderBy, limit);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param fieldValues
	 *            field values
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			BoundingBox boundingBox, Map<String, Object> fieldValues,
			String orderBy, int limit, long offset) {
		return queryForChunk(distinct, columns, boundingBox.buildEnvelope(),
				fieldValues, orderBy, limit, offset);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box,
	 * projected correctly, starting at the offset and returning no more than
	 * the limit
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunkIdOrder(BoundingBox boundingBox,
			String where, int limit) {
		return queryForChunk(boundingBox, where, getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box,
	 * projected correctly, starting at the offset and returning no more than
	 * the limit
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunkIdOrder(BoundingBox boundingBox,
			String where, int limit, long offset) {
		return queryForChunk(boundingBox, where, getIdColumn(), limit, offset);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly, starting at the offset and returning no more than the limit
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(BoundingBox boundingBox,
			String where, String orderBy, int limit) {
		return queryForChunk(false, boundingBox, where, orderBy, limit);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly, starting at the offset and returning no more than the limit
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(BoundingBox boundingBox,
			String where, String orderBy, int limit, long offset) {
		return queryForChunk(false, boundingBox, where, orderBy, limit, offset);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box,
	 * projected correctly, starting at the offset and returning no more than
	 * the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunkIdOrder(boolean distinct,
			BoundingBox boundingBox, String where, int limit) {
		return queryForChunk(distinct, boundingBox, where, getIdColumn(),
				limit);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box,
	 * projected correctly, starting at the offset and returning no more than
	 * the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunkIdOrder(boolean distinct,
			BoundingBox boundingBox, String where, int limit, long offset) {
		return queryForChunk(distinct, boundingBox, where, getIdColumn(), limit,
				offset);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			BoundingBox boundingBox, String where, String orderBy, int limit) {
		return queryForChunk(distinct, boundingBox, where, null, orderBy,
				limit);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			BoundingBox boundingBox, String where, String orderBy, int limit,
			long offset) {
		return queryForChunk(distinct, boundingBox, where, null, orderBy, limit,
				offset);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box,
	 * projected correctly, starting at the offset and returning no more than
	 * the limit
	 *
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunkIdOrder(String[] columns,
			BoundingBox boundingBox, String where, int limit) {
		return queryForChunk(columns, boundingBox, where, getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box,
	 * projected correctly, starting at the offset and returning no more than
	 * the limit
	 *
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunkIdOrder(String[] columns,
			BoundingBox boundingBox, String where, int limit, long offset) {
		return queryForChunk(columns, boundingBox, where, getIdColumn(), limit,
				offset);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly, starting at the offset and returning no more than the limit
	 *
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			BoundingBox boundingBox, String where, String orderBy, int limit) {
		return queryForChunk(false, columns, boundingBox, where, orderBy,
				limit);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly, starting at the offset and returning no more than the limit
	 *
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			BoundingBox boundingBox, String where, String orderBy, int limit,
			long offset) {
		return queryForChunk(false, columns, boundingBox, where, orderBy, limit,
				offset);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box,
	 * projected correctly, starting at the offset and returning no more than
	 * the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunkIdOrder(boolean distinct,
			String[] columns, BoundingBox boundingBox, String where,
			int limit) {
		return queryForChunk(distinct, columns, boundingBox, where,
				getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box,
	 * projected correctly, starting at the offset and returning no more than
	 * the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunkIdOrder(boolean distinct,
			String[] columns, BoundingBox boundingBox, String where, int limit,
			long offset) {
		return queryForChunk(distinct, columns, boundingBox, where,
				getIdColumn(), limit, offset);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			BoundingBox boundingBox, String where, String orderBy, int limit) {
		return queryForChunk(distinct, columns, boundingBox, where, null,
				orderBy, limit);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			BoundingBox boundingBox, String where, String orderBy, int limit,
			long offset) {
		return queryForChunk(distinct, columns, boundingBox, where, null,
				orderBy, limit, offset);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box,
	 * projected correctly, starting at the offset and returning no more than
	 * the limit
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(BoundingBox boundingBox,
			String where, String[] whereArgs, int limit) {
		return queryForChunk(boundingBox, where, whereArgs, getIdColumn(),
				limit);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box,
	 * projected correctly, starting at the offset and returning no more than
	 * the limit
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(BoundingBox boundingBox,
			String where, String[] whereArgs, int limit, long offset) {
		return queryForChunk(boundingBox, where, whereArgs, getIdColumn(),
				limit, offset);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly, starting at the offset and returning no more than the limit
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(BoundingBox boundingBox,
			String where, String[] whereArgs, String orderBy, int limit) {
		return queryForChunk(false, boundingBox, where, whereArgs, orderBy,
				limit);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly, starting at the offset and returning no more than the limit
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(BoundingBox boundingBox,
			String where, String[] whereArgs, String orderBy, int limit,
			long offset) {
		return queryForChunk(false, boundingBox, where, whereArgs, orderBy,
				limit, offset);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box,
	 * projected correctly, starting at the offset and returning no more than
	 * the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			BoundingBox boundingBox, String where, String[] whereArgs,
			int limit) {
		return queryForChunk(distinct, boundingBox, where, whereArgs,
				getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box,
	 * projected correctly, starting at the offset and returning no more than
	 * the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			BoundingBox boundingBox, String where, String[] whereArgs,
			int limit, long offset) {
		return queryForChunk(distinct, boundingBox, where, whereArgs,
				getIdColumn(), limit, offset);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			BoundingBox boundingBox, String where, String[] whereArgs,
			String orderBy, int limit) {
		return queryForChunk(distinct, boundingBox.buildEnvelope(), where,
				whereArgs, orderBy, limit);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			BoundingBox boundingBox, String where, String[] whereArgs,
			String orderBy, int limit, long offset) {
		return queryForChunk(distinct, boundingBox.buildEnvelope(), where,
				whereArgs, orderBy, limit, offset);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box,
	 * projected correctly, starting at the offset and returning no more than
	 * the limit
	 *
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			BoundingBox boundingBox, String where, String[] whereArgs,
			int limit) {
		return queryForChunk(columns, boundingBox, where, whereArgs,
				getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box,
	 * projected correctly, starting at the offset and returning no more than
	 * the limit
	 *
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			BoundingBox boundingBox, String where, String[] whereArgs,
			int limit, long offset) {
		return queryForChunk(columns, boundingBox, where, whereArgs,
				getIdColumn(), limit, offset);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly, starting at the offset and returning no more than the limit
	 *
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			BoundingBox boundingBox, String where, String[] whereArgs,
			String orderBy, int limit) {
		return queryForChunk(false, columns, boundingBox, where, whereArgs,
				orderBy, limit);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly, starting at the offset and returning no more than the limit
	 *
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			BoundingBox boundingBox, String where, String[] whereArgs,
			String orderBy, int limit, long offset) {
		return queryForChunk(false, columns, boundingBox, where, whereArgs,
				orderBy, limit, offset);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box,
	 * projected correctly, starting at the offset and returning no more than
	 * the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			BoundingBox boundingBox, String where, String[] whereArgs,
			int limit) {
		return queryForChunk(distinct, columns, boundingBox, where, whereArgs,
				getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box,
	 * projected correctly, starting at the offset and returning no more than
	 * the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			BoundingBox boundingBox, String where, String[] whereArgs,
			int limit, long offset) {
		return queryForChunk(distinct, columns, boundingBox, where, whereArgs,
				getIdColumn(), limit, offset);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			BoundingBox boundingBox, String where, String[] whereArgs,
			String orderBy, int limit) {
		return queryForChunk(distinct, columns, boundingBox.buildEnvelope(),
				where, whereArgs, orderBy, limit);
	}

	/**
	 * Query for feature index results within the bounding box, projected
	 * correctly, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			BoundingBox boundingBox, String where, String[] whereArgs,
			String orderBy, int limit, long offset) {
		return queryForChunk(distinct, columns, boundingBox.buildEnvelope(),
				where, whereArgs, orderBy, limit, offset);
	}

	/**
	 * Query for feature index results ordered by id within the Geometry
	 * Envelope, starting at the offset and returning no more than the limit
	 *
	 * @param envelope
	 *            geometry envelope
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(GeometryEnvelope envelope,
			int limit) {
		return queryForChunk(envelope, getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id within the Geometry
	 * Envelope, starting at the offset and returning no more than the limit
	 *
	 * @param envelope
	 *            geometry envelope
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(GeometryEnvelope envelope,
			int limit, long offset) {
		return queryForChunk(envelope, getIdColumn(), limit, offset);
	}

	/**
	 * Query for feature index results within the Geometry Envelope, starting at
	 * the offset and returning no more than the limit
	 *
	 * @param envelope
	 *            geometry envelope
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(GeometryEnvelope envelope,
			String orderBy, int limit) {
		return queryForChunk(false, envelope, orderBy, limit);
	}

	/**
	 * Query for feature index results within the Geometry Envelope, starting at
	 * the offset and returning no more than the limit
	 *
	 * @param envelope
	 *            geometry envelope
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(GeometryEnvelope envelope,
			String orderBy, int limit, long offset) {
		return queryForChunk(false, envelope, orderBy, limit, offset);
	}

	/**
	 * Query for feature index results ordered by id within the Geometry
	 * Envelope, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param envelope
	 *            geometry envelope
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			GeometryEnvelope envelope, int limit) {
		return queryForChunk(distinct, envelope, getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id within the Geometry
	 * Envelope, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param envelope
	 *            geometry envelope
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			GeometryEnvelope envelope, int limit, long offset) {
		return queryForChunk(distinct, envelope, getIdColumn(), limit, offset);
	}

	/**
	 * Query for feature index results within the Geometry Envelope, starting at
	 * the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param envelope
	 *            geometry envelope
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			GeometryEnvelope envelope, String orderBy, int limit) {
		return queryForChunk(distinct, envelope, null, null, orderBy, limit);
	}

	/**
	 * Query for feature index results within the Geometry Envelope, starting at
	 * the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param envelope
	 *            geometry envelope
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			GeometryEnvelope envelope, String orderBy, int limit, long offset) {
		return queryForChunk(distinct, envelope, null, null, orderBy, limit,
				offset);
	}

	/**
	 * Query for feature index results ordered by id within the Geometry
	 * Envelope, starting at the offset and returning no more than the limit
	 *
	 * @param columns
	 *            columns
	 * @param envelope
	 *            geometry envelope
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			GeometryEnvelope envelope, int limit) {
		return queryForChunk(columns, envelope, getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id within the Geometry
	 * Envelope, starting at the offset and returning no more than the limit
	 *
	 * @param columns
	 *            columns
	 * @param envelope
	 *            geometry envelope
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			GeometryEnvelope envelope, int limit, long offset) {
		return queryForChunk(columns, envelope, getIdColumn(), limit, offset);
	}

	/**
	 * Query for feature index results within the Geometry Envelope, starting at
	 * the offset and returning no more than the limit
	 *
	 * @param columns
	 *            columns
	 * @param envelope
	 *            geometry envelope
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			GeometryEnvelope envelope, String orderBy, int limit) {
		return queryForChunk(false, columns, envelope, orderBy, limit);
	}

	/**
	 * Query for feature index results within the Geometry Envelope, starting at
	 * the offset and returning no more than the limit
	 *
	 * @param columns
	 *            columns
	 * @param envelope
	 *            geometry envelope
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			GeometryEnvelope envelope, String orderBy, int limit, long offset) {
		return queryForChunk(false, columns, envelope, orderBy, limit, offset);
	}

	/**
	 * Query for feature index results ordered by id within the Geometry
	 * Envelope, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param envelope
	 *            geometry envelope
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			GeometryEnvelope envelope, int limit) {
		return queryForChunk(distinct, columns, envelope, getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id within the Geometry
	 * Envelope, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param envelope
	 *            geometry envelope
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			GeometryEnvelope envelope, int limit, long offset) {
		return queryForChunk(distinct, columns, envelope, getIdColumn(), limit,
				offset);
	}

	/**
	 * Query for feature index results within the Geometry Envelope, starting at
	 * the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param envelope
	 *            geometry envelope
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			GeometryEnvelope envelope, String orderBy, int limit) {
		return queryForChunk(distinct, columns, envelope, null, null, orderBy,
				limit);
	}

	/**
	 * Query for feature index results within the Geometry Envelope, starting at
	 * the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param envelope
	 *            geometry envelope
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			GeometryEnvelope envelope, String orderBy, int limit, long offset) {
		return queryForChunk(distinct, columns, envelope, null, null, orderBy,
				limit, offset);
	}

	/**
	 * Query for feature index results ordered by id within the Geometry
	 * Envelope, starting at the offset and returning no more than the limit
	 *
	 * @param envelope
	 *            geometry envelope
	 * @param fieldValues
	 *            field values
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(GeometryEnvelope envelope,
			Map<String, Object> fieldValues, int limit) {
		return queryForChunk(envelope, fieldValues, getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id within the Geometry
	 * Envelope, starting at the offset and returning no more than the limit
	 *
	 * @param envelope
	 *            geometry envelope
	 * @param fieldValues
	 *            field values
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(GeometryEnvelope envelope,
			Map<String, Object> fieldValues, int limit, long offset) {
		return queryForChunk(envelope, fieldValues, getIdColumn(), limit,
				offset);
	}

	/**
	 * Query for feature index results within the Geometry Envelope, starting at
	 * the offset and returning no more than the limit
	 *
	 * @param envelope
	 *            geometry envelope
	 * @param fieldValues
	 *            field values
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(GeometryEnvelope envelope,
			Map<String, Object> fieldValues, String orderBy, int limit) {
		return queryForChunk(false, envelope, fieldValues, orderBy, limit);
	}

	/**
	 * Query for feature index results within the Geometry Envelope, starting at
	 * the offset and returning no more than the limit
	 *
	 * @param envelope
	 *            geometry envelope
	 * @param fieldValues
	 *            field values
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(GeometryEnvelope envelope,
			Map<String, Object> fieldValues, String orderBy, int limit,
			long offset) {
		return queryForChunk(false, envelope, fieldValues, orderBy, limit,
				offset);
	}

	/**
	 * Query for feature index results ordered by id within the Geometry
	 * Envelope, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param envelope
	 *            geometry envelope
	 * @param fieldValues
	 *            field values
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			GeometryEnvelope envelope, Map<String, Object> fieldValues,
			int limit) {
		return queryForChunk(distinct, envelope, fieldValues, getIdColumn(),
				limit);
	}

	/**
	 * Query for feature index results ordered by id within the Geometry
	 * Envelope, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param envelope
	 *            geometry envelope
	 * @param fieldValues
	 *            field values
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			GeometryEnvelope envelope, Map<String, Object> fieldValues,
			int limit, long offset) {
		return queryForChunk(distinct, envelope, fieldValues, getIdColumn(),
				limit, offset);
	}

	/**
	 * Query for feature index results within the Geometry Envelope, starting at
	 * the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param envelope
	 *            geometry envelope
	 * @param fieldValues
	 *            field values
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			GeometryEnvelope envelope, Map<String, Object> fieldValues,
			String orderBy, int limit) {
		String where = featureDao.buildWhere(fieldValues.entrySet());
		String[] whereArgs = featureDao.buildWhereArgs(fieldValues.values());
		return queryForChunk(distinct, envelope, where, whereArgs, orderBy,
				limit);
	}

	/**
	 * Query for feature index results within the Geometry Envelope, starting at
	 * the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param envelope
	 *            geometry envelope
	 * @param fieldValues
	 *            field values
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			GeometryEnvelope envelope, Map<String, Object> fieldValues,
			String orderBy, int limit, long offset) {
		String where = featureDao.buildWhere(fieldValues.entrySet());
		String[] whereArgs = featureDao.buildWhereArgs(fieldValues.values());
		return queryForChunk(distinct, envelope, where, whereArgs, orderBy,
				limit, offset);
	}

	/**
	 * Query for feature index results ordered by id within the Geometry
	 * Envelope, starting at the offset and returning no more than the limit
	 *
	 * @param columns
	 *            columns
	 * @param envelope
	 *            geometry envelope
	 * @param fieldValues
	 *            field values
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			GeometryEnvelope envelope, Map<String, Object> fieldValues,
			int limit) {
		return queryForChunk(columns, envelope, fieldValues, getIdColumn(),
				limit);
	}

	/**
	 * Query for feature index results ordered by id within the Geometry
	 * Envelope, starting at the offset and returning no more than the limit
	 *
	 * @param columns
	 *            columns
	 * @param envelope
	 *            geometry envelope
	 * @param fieldValues
	 *            field values
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			GeometryEnvelope envelope, Map<String, Object> fieldValues,
			int limit, long offset) {
		return queryForChunk(columns, envelope, fieldValues, getIdColumn(),
				limit, offset);
	}

	/**
	 * Query for feature index results within the Geometry Envelope, starting at
	 * the offset and returning no more than the limit
	 *
	 * @param columns
	 *            columns
	 * @param envelope
	 *            geometry envelope
	 * @param fieldValues
	 *            field values
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			GeometryEnvelope envelope, Map<String, Object> fieldValues,
			String orderBy, int limit) {
		return queryForChunk(false, columns, envelope, fieldValues, orderBy,
				limit);
	}

	/**
	 * Query for feature index results within the Geometry Envelope, starting at
	 * the offset and returning no more than the limit
	 *
	 * @param columns
	 *            columns
	 * @param envelope
	 *            geometry envelope
	 * @param fieldValues
	 *            field values
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			GeometryEnvelope envelope, Map<String, Object> fieldValues,
			String orderBy, int limit, long offset) {
		return queryForChunk(false, columns, envelope, fieldValues, orderBy,
				limit, offset);
	}

	/**
	 * Query for feature index results ordered by id within the Geometry
	 * Envelope, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param envelope
	 *            geometry envelope
	 * @param fieldValues
	 *            field values
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			GeometryEnvelope envelope, Map<String, Object> fieldValues,
			int limit) {
		return queryForChunk(distinct, columns, envelope, fieldValues,
				getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id within the Geometry
	 * Envelope, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param envelope
	 *            geometry envelope
	 * @param fieldValues
	 *            field values
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			GeometryEnvelope envelope, Map<String, Object> fieldValues,
			int limit, long offset) {
		return queryForChunk(distinct, columns, envelope, fieldValues,
				getIdColumn(), limit, offset);
	}

	/**
	 * Query for feature index results within the Geometry Envelope, starting at
	 * the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param envelope
	 *            geometry envelope
	 * @param fieldValues
	 *            field values
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			GeometryEnvelope envelope, Map<String, Object> fieldValues,
			String orderBy, int limit) {
		String where = featureDao.buildWhere(fieldValues.entrySet());
		String[] whereArgs = featureDao.buildWhereArgs(fieldValues.values());
		return queryForChunk(distinct, columns, envelope, where, whereArgs,
				orderBy, limit);
	}

	/**
	 * Query for feature index results within the Geometry Envelope, starting at
	 * the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param envelope
	 *            geometry envelope
	 * @param fieldValues
	 *            field values
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			GeometryEnvelope envelope, Map<String, Object> fieldValues,
			String orderBy, int limit, long offset) {
		String where = featureDao.buildWhere(fieldValues.entrySet());
		String[] whereArgs = featureDao.buildWhereArgs(fieldValues.values());
		return queryForChunk(distinct, columns, envelope, where, whereArgs,
				orderBy, limit, offset);
	}

	/**
	 * Query for feature index results ordered by id within the Geometry
	 * Envelope, starting at the offset and returning no more than the limit
	 *
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunkIdOrder(GeometryEnvelope envelope,
			String where, int limit) {
		return queryForChunk(envelope, where, getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id within the Geometry
	 * Envelope, starting at the offset and returning no more than the limit
	 *
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunkIdOrder(GeometryEnvelope envelope,
			String where, int limit, long offset) {
		return queryForChunk(envelope, where, getIdColumn(), limit, offset);
	}

	/**
	 * Query for feature index results within the Geometry Envelope, starting at
	 * the offset and returning no more than the limit
	 *
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(GeometryEnvelope envelope,
			String where, String orderBy, int limit) {
		return queryForChunk(false, envelope, where, orderBy, limit);
	}

	/**
	 * Query for feature index results within the Geometry Envelope, starting at
	 * the offset and returning no more than the limit
	 *
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(GeometryEnvelope envelope,
			String where, String orderBy, int limit, long offset) {
		return queryForChunk(false, envelope, where, orderBy, limit, offset);
	}

	/**
	 * Query for feature index results ordered by id within the Geometry
	 * Envelope, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunkIdOrder(boolean distinct,
			GeometryEnvelope envelope, String where, int limit) {
		return queryForChunk(distinct, envelope, where, getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id within the Geometry
	 * Envelope, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunkIdOrder(boolean distinct,
			GeometryEnvelope envelope, String where, int limit, long offset) {
		return queryForChunk(distinct, envelope, where, getIdColumn(), limit,
				offset);
	}

	/**
	 * Query for feature index results within the Geometry Envelope, starting at
	 * the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			GeometryEnvelope envelope, String where, String orderBy,
			int limit) {
		return queryForChunk(distinct, envelope, where, null, orderBy, limit);
	}

	/**
	 * Query for feature index results within the Geometry Envelope, starting at
	 * the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			GeometryEnvelope envelope, String where, String orderBy, int limit,
			long offset) {
		return queryForChunk(distinct, envelope, where, null, orderBy, limit,
				offset);
	}

	/**
	 * Query for feature index results ordered by id within the Geometry
	 * Envelope, starting at the offset and returning no more than the limit
	 *
	 * @param columns
	 *            columns
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunkIdOrder(String[] columns,
			GeometryEnvelope envelope, String where, int limit) {
		return queryForChunk(columns, envelope, where, getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id within the Geometry
	 * Envelope, starting at the offset and returning no more than the limit
	 *
	 * @param columns
	 *            columns
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunkIdOrder(String[] columns,
			GeometryEnvelope envelope, String where, int limit, long offset) {
		return queryForChunk(columns, envelope, where, getIdColumn(), limit,
				offset);
	}

	/**
	 * Query for feature index results within the Geometry Envelope, starting at
	 * the offset and returning no more than the limit
	 *
	 * @param columns
	 *            columns
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			GeometryEnvelope envelope, String where, String orderBy,
			int limit) {
		return queryForChunk(false, columns, envelope, where, orderBy, limit);
	}

	/**
	 * Query for feature index results within the Geometry Envelope, starting at
	 * the offset and returning no more than the limit
	 *
	 * @param columns
	 *            columns
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			GeometryEnvelope envelope, String where, String orderBy, int limit,
			long offset) {
		return queryForChunk(false, columns, envelope, where, orderBy, limit,
				offset);
	}

	/**
	 * Query for feature index results ordered by id within the Geometry
	 * Envelope, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunkIdOrder(boolean distinct,
			String[] columns, GeometryEnvelope envelope, String where,
			int limit) {
		return queryForChunk(distinct, columns, envelope, where, getIdColumn(),
				limit);
	}

	/**
	 * Query for feature index results ordered by id within the Geometry
	 * Envelope, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunkIdOrder(boolean distinct,
			String[] columns, GeometryEnvelope envelope, String where,
			int limit, long offset) {
		return queryForChunk(distinct, columns, envelope, where, getIdColumn(),
				limit, offset);
	}

	/**
	 * Query for feature index results within the Geometry Envelope, starting at
	 * the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			GeometryEnvelope envelope, String where, String orderBy,
			int limit) {
		return queryForChunk(distinct, columns, envelope, where, null, orderBy,
				limit);
	}

	/**
	 * Query for feature index results within the Geometry Envelope, starting at
	 * the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			GeometryEnvelope envelope, String where, String orderBy, int limit,
			long offset) {
		return queryForChunk(distinct, columns, envelope, where, null, orderBy,
				limit, offset);
	}

	/**
	 * Query for feature index results ordered by id within the Geometry
	 * Envelope, starting at the offset and returning no more than the limit
	 *
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(GeometryEnvelope envelope,
			String where, String[] whereArgs, int limit) {
		return queryForChunk(envelope, where, whereArgs, getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id within the Geometry
	 * Envelope, starting at the offset and returning no more than the limit
	 *
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(GeometryEnvelope envelope,
			String where, String[] whereArgs, int limit, long offset) {
		return queryForChunk(envelope, where, whereArgs, getIdColumn(), limit,
				offset);
	}

	/**
	 * Query for feature index results within the Geometry Envelope, starting at
	 * the offset and returning no more than the limit
	 *
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(GeometryEnvelope envelope,
			String where, String[] whereArgs, String orderBy, int limit) {
		return queryForChunk(false, envelope, where, whereArgs, orderBy, limit);
	}

	/**
	 * Query for feature index results within the Geometry Envelope, starting at
	 * the offset and returning no more than the limit
	 *
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(GeometryEnvelope envelope,
			String where, String[] whereArgs, String orderBy, int limit,
			long offset) {
		return queryForChunk(false, envelope, where, whereArgs, orderBy, limit,
				offset);
	}

	/**
	 * Query for feature index results ordered by id within the Geometry
	 * Envelope, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			GeometryEnvelope envelope, String where, String[] whereArgs,
			int limit) {
		return queryForChunk(distinct, envelope, where, whereArgs,
				getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id within the Geometry
	 * Envelope, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			GeometryEnvelope envelope, String where, String[] whereArgs,
			int limit, long offset) {
		return queryForChunk(distinct, envelope, where, whereArgs,
				getIdColumn(), limit, offset);
	}

	/**
	 * Query for feature index results within the Geometry Envelope, starting at
	 * the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			GeometryEnvelope envelope, String where, String[] whereArgs,
			String orderBy, int limit) {
		return queryForChunk(distinct, featureDao.getColumnNames(), envelope,
				where, whereArgs, orderBy, limit);
	}

	/**
	 * Query for feature index results within the Geometry Envelope, starting at
	 * the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			GeometryEnvelope envelope, String where, String[] whereArgs,
			String orderBy, int limit, long offset) {
		return queryForChunk(distinct, featureDao.getColumnNames(), envelope,
				where, whereArgs, orderBy, limit, offset);
	}

	/**
	 * Query for feature index results ordered by id within the Geometry
	 * Envelope, starting at the offset and returning no more than the limit
	 * 
	 * @param columns
	 *            columns
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			GeometryEnvelope envelope, String where, String[] whereArgs,
			int limit) {
		return queryForChunk(columns, envelope, where, whereArgs, getIdColumn(),
				limit);
	}

	/**
	 * Query for feature index results ordered by id within the Geometry
	 * Envelope, starting at the offset and returning no more than the limit
	 * 
	 * @param columns
	 *            columns
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			GeometryEnvelope envelope, String where, String[] whereArgs,
			int limit, long offset) {
		return queryForChunk(columns, envelope, where, whereArgs, getIdColumn(),
				limit, offset);
	}

	/**
	 * Query for feature index results within the Geometry Envelope, starting at
	 * the offset and returning no more than the limit
	 * 
	 * @param columns
	 *            columns
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			GeometryEnvelope envelope, String where, String[] whereArgs,
			String orderBy, int limit) {
		return queryForChunk(false, columns, envelope, where, whereArgs,
				orderBy, limit);
	}

	/**
	 * Query for feature index results within the Geometry Envelope, starting at
	 * the offset and returning no more than the limit
	 * 
	 * @param columns
	 *            columns
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			GeometryEnvelope envelope, String where, String[] whereArgs,
			String orderBy, int limit, long offset) {
		return queryForChunk(false, columns, envelope, where, whereArgs,
				orderBy, limit, offset);
	}

	/**
	 * Query for feature index results ordered by id within the Geometry
	 * Envelope, starting at the offset and returning no more than the limit
	 * 
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			GeometryEnvelope envelope, String where, String[] whereArgs,
			int limit) {
		return queryForChunk(distinct, columns, envelope, where, whereArgs,
				getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id within the Geometry
	 * Envelope, starting at the offset and returning no more than the limit
	 * 
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			GeometryEnvelope envelope, String where, String[] whereArgs,
			int limit, long offset) {
		return queryForChunk(distinct, columns, envelope, where, whereArgs,
				getIdColumn(), limit, offset);
	}

	/**
	 * Query for feature index results within the Geometry Envelope, starting at
	 * the offset and returning no more than the limit
	 * 
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			GeometryEnvelope envelope, String where, String[] whereArgs,
			String orderBy, int limit) {
		return queryForChunk(distinct, columns, envelope, where, whereArgs,
				orderBy, limit, 0);
	}

	/**
	 * Query for feature index results within the Geometry Envelope, starting at
	 * the offset and returning no more than the limit
	 * 
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param envelope
	 *            geometry envelope
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			GeometryEnvelope envelope, String where, String[] whereArgs,
			String orderBy, int limit, long offset) {
		FeatureIndexResults results = null;
		for (FeatureIndexType type : getLocation()) {
			try {
				switch (type) {
				case GEOPACKAGE:
					FeatureResultSet geoPackageResultSet = featureTableIndex
							.queryFeaturesForChunk(distinct, columns, envelope,
									where, whereArgs, orderBy, limit, offset);
					results = new FeatureIndexFeatureResults(
							geoPackageResultSet);
					break;
				case RTREE:
					FeatureResultSet rTreeResultSet = rTreeIndexTableDao
							.queryFeaturesForChunk(distinct, columns, envelope,
									where, whereArgs, orderBy, limit, offset);
					results = new FeatureIndexFeatureResults(rTreeResultSet);
					break;
				default:
					throw new GeoPackageException(
							"Unsupported feature index type: " + type);
				}
				break;
			} catch (Exception e) {
				if (continueOnError) {
					LOGGER.log(Level.SEVERE,
							"Failed to query from feature index: " + type, e);
				} else {
					throw e;
				}
			}
		}
		if (results == null) {
			results = manualFeatureQuery.queryForChunk(distinct, columns,
					envelope, where, whereArgs, orderBy, limit, offset);
		}
		return results;
	}

	/**
	 * Query for feature index results ordered by id within the bounding box in
	 * the provided projection, starting at the offset and returning no more
	 * than the limit
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(BoundingBox boundingBox,
			Projection projection, int limit) {
		return queryForChunk(boundingBox, projection, getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box in
	 * the provided projection, starting at the offset and returning no more
	 * than the limit
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(BoundingBox boundingBox,
			Projection projection, int limit, long offset) {
		return queryForChunk(boundingBox, projection, getIdColumn(), limit,
				offset);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection, starting at the offset and returning no more than the limit
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(BoundingBox boundingBox,
			Projection projection, String orderBy, int limit) {
		return queryForChunk(false, boundingBox, projection, orderBy, limit);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection, starting at the offset and returning no more than the limit
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(BoundingBox boundingBox,
			Projection projection, String orderBy, int limit, long offset) {
		return queryForChunk(false, boundingBox, projection, orderBy, limit,
				offset);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box in
	 * the provided projection, starting at the offset and returning no more
	 * than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			BoundingBox boundingBox, Projection projection, int limit) {
		return queryForChunk(distinct, boundingBox, projection, getIdColumn(),
				limit);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box in
	 * the provided projection, starting at the offset and returning no more
	 * than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			BoundingBox boundingBox, Projection projection, int limit,
			long offset) {
		return queryForChunk(distinct, boundingBox, projection, getIdColumn(),
				limit, offset);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			BoundingBox boundingBox, Projection projection, String orderBy,
			int limit) {
		BoundingBox featureBoundingBox = featureDao
				.projectBoundingBox(boundingBox, projection);
		return queryForChunk(distinct, featureBoundingBox, orderBy, limit);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			BoundingBox boundingBox, Projection projection, String orderBy,
			int limit, long offset) {
		BoundingBox featureBoundingBox = featureDao
				.projectBoundingBox(boundingBox, projection);
		return queryForChunk(distinct, featureBoundingBox, orderBy, limit,
				offset);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box in
	 * the provided projection, starting at the offset and returning no more
	 * than the limit
	 *
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			BoundingBox boundingBox, Projection projection, int limit) {
		return queryForChunk(columns, boundingBox, projection, getIdColumn(),
				limit);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box in
	 * the provided projection, starting at the offset and returning no more
	 * than the limit
	 *
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			BoundingBox boundingBox, Projection projection, int limit,
			long offset) {
		return queryForChunk(columns, boundingBox, projection, getIdColumn(),
				limit, offset);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection, starting at the offset and returning no more than the limit
	 *
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			BoundingBox boundingBox, Projection projection, String orderBy,
			int limit) {
		return queryForChunk(false, columns, boundingBox, projection, orderBy,
				limit);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection, starting at the offset and returning no more than the limit
	 *
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			BoundingBox boundingBox, Projection projection, String orderBy,
			int limit, long offset) {
		return queryForChunk(false, columns, boundingBox, projection, orderBy,
				limit, offset);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box in
	 * the provided projection, starting at the offset and returning no more
	 * than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			BoundingBox boundingBox, Projection projection, int limit) {
		return queryForChunk(distinct, columns, boundingBox, projection,
				getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box in
	 * the provided projection, starting at the offset and returning no more
	 * than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			BoundingBox boundingBox, Projection projection, int limit,
			long offset) {
		return queryForChunk(distinct, columns, boundingBox, projection,
				getIdColumn(), limit, offset);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			BoundingBox boundingBox, Projection projection, String orderBy,
			int limit) {
		BoundingBox featureBoundingBox = featureDao
				.projectBoundingBox(boundingBox, projection);
		return queryForChunk(distinct, columns, featureBoundingBox, orderBy,
				limit);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			BoundingBox boundingBox, Projection projection, String orderBy,
			int limit, long offset) {
		BoundingBox featureBoundingBox = featureDao
				.projectBoundingBox(boundingBox, projection);
		return queryForChunk(distinct, columns, featureBoundingBox, orderBy,
				limit, offset);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box in
	 * the provided projection, starting at the offset and returning no more
	 * than the limit
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param fieldValues
	 *            field values
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(BoundingBox boundingBox,
			Projection projection, Map<String, Object> fieldValues, int limit) {
		return queryForChunk(boundingBox, projection, fieldValues,
				getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box in
	 * the provided projection, starting at the offset and returning no more
	 * than the limit
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param fieldValues
	 *            field values
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(BoundingBox boundingBox,
			Projection projection, Map<String, Object> fieldValues, int limit,
			long offset) {
		return queryForChunk(boundingBox, projection, fieldValues,
				getIdColumn(), limit, offset);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection, starting at the offset and returning no more than the limit
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param fieldValues
	 *            field values
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(BoundingBox boundingBox,
			Projection projection, Map<String, Object> fieldValues,
			String orderBy, int limit) {
		return queryForChunk(false, boundingBox, projection, fieldValues,
				orderBy, limit);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection, starting at the offset and returning no more than the limit
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param fieldValues
	 *            field values
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(BoundingBox boundingBox,
			Projection projection, Map<String, Object> fieldValues,
			String orderBy, int limit, long offset) {
		return queryForChunk(false, boundingBox, projection, fieldValues,
				orderBy, limit, offset);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box in
	 * the provided projection, starting at the offset and returning no more
	 * than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param fieldValues
	 *            field values
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			BoundingBox boundingBox, Projection projection,
			Map<String, Object> fieldValues, int limit) {
		return queryForChunk(distinct, boundingBox, projection, fieldValues,
				getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box in
	 * the provided projection, starting at the offset and returning no more
	 * than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param fieldValues
	 *            field values
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			BoundingBox boundingBox, Projection projection,
			Map<String, Object> fieldValues, int limit, long offset) {
		return queryForChunk(distinct, boundingBox, projection, fieldValues,
				getIdColumn(), limit, offset);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param fieldValues
	 *            field values
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			BoundingBox boundingBox, Projection projection,
			Map<String, Object> fieldValues, String orderBy, int limit) {
		BoundingBox featureBoundingBox = featureDao
				.projectBoundingBox(boundingBox, projection);
		return queryForChunk(distinct, featureBoundingBox, fieldValues, orderBy,
				limit);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param fieldValues
	 *            field values
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			BoundingBox boundingBox, Projection projection,
			Map<String, Object> fieldValues, String orderBy, int limit,
			long offset) {
		BoundingBox featureBoundingBox = featureDao
				.projectBoundingBox(boundingBox, projection);
		return queryForChunk(distinct, featureBoundingBox, fieldValues, orderBy,
				limit, offset);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box in
	 * the provided projection, starting at the offset and returning no more
	 * than the limit
	 *
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param fieldValues
	 *            field values
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			BoundingBox boundingBox, Projection projection,
			Map<String, Object> fieldValues, int limit) {
		return queryForChunk(columns, boundingBox, projection, fieldValues,
				getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box in
	 * the provided projection, starting at the offset and returning no more
	 * than the limit
	 *
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param fieldValues
	 *            field values
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			BoundingBox boundingBox, Projection projection,
			Map<String, Object> fieldValues, int limit, long offset) {
		return queryForChunk(columns, boundingBox, projection, fieldValues,
				getIdColumn(), limit, offset);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection, starting at the offset and returning no more than the limit
	 *
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param fieldValues
	 *            field values
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			BoundingBox boundingBox, Projection projection,
			Map<String, Object> fieldValues, String orderBy, int limit) {
		return queryForChunk(false, columns, boundingBox, projection,
				fieldValues, orderBy, limit);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection, starting at the offset and returning no more than the limit
	 *
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param fieldValues
	 *            field values
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			BoundingBox boundingBox, Projection projection,
			Map<String, Object> fieldValues, String orderBy, int limit,
			long offset) {
		return queryForChunk(false, columns, boundingBox, projection,
				fieldValues, orderBy, limit, offset);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box in
	 * the provided projection, starting at the offset and returning no more
	 * than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param fieldValues
	 *            field values
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			BoundingBox boundingBox, Projection projection,
			Map<String, Object> fieldValues, int limit) {
		return queryForChunk(distinct, columns, boundingBox, projection,
				fieldValues, getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box in
	 * the provided projection, starting at the offset and returning no more
	 * than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param fieldValues
	 *            field values
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			BoundingBox boundingBox, Projection projection,
			Map<String, Object> fieldValues, int limit, long offset) {
		return queryForChunk(distinct, columns, boundingBox, projection,
				fieldValues, getIdColumn(), limit, offset);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param fieldValues
	 *            field values
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			BoundingBox boundingBox, Projection projection,
			Map<String, Object> fieldValues, String orderBy, int limit) {
		BoundingBox featureBoundingBox = featureDao
				.projectBoundingBox(boundingBox, projection);
		return queryForChunk(distinct, columns, featureBoundingBox, fieldValues,
				orderBy, limit);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param fieldValues
	 *            field values
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			BoundingBox boundingBox, Projection projection,
			Map<String, Object> fieldValues, String orderBy, int limit,
			long offset) {
		BoundingBox featureBoundingBox = featureDao
				.projectBoundingBox(boundingBox, projection);
		return queryForChunk(distinct, columns, featureBoundingBox, fieldValues,
				orderBy, limit, offset);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box in
	 * the provided projection, starting at the offset and returning no more
	 * than the limit
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunkIdOrder(BoundingBox boundingBox,
			Projection projection, String where, int limit) {
		return queryForChunk(boundingBox, projection, where, getIdColumn(),
				limit);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box in
	 * the provided projection, starting at the offset and returning no more
	 * than the limit
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunkIdOrder(BoundingBox boundingBox,
			Projection projection, String where, int limit, long offset) {
		return queryForChunk(boundingBox, projection, where, getIdColumn(),
				limit, offset);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection, starting at the offset and returning no more than the limit
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(BoundingBox boundingBox,
			Projection projection, String where, String orderBy, int limit) {
		return queryForChunk(false, boundingBox, projection, where, orderBy,
				limit);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection, starting at the offset and returning no more than the limit
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(BoundingBox boundingBox,
			Projection projection, String where, String orderBy, int limit,
			long offset) {
		return queryForChunk(false, boundingBox, projection, where, orderBy,
				limit, offset);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box in
	 * the provided projection, starting at the offset and returning no more
	 * than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunkIdOrder(boolean distinct,
			BoundingBox boundingBox, Projection projection, String where,
			int limit) {
		return queryForChunk(distinct, boundingBox, projection, where,
				getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box in
	 * the provided projection, starting at the offset and returning no more
	 * than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunkIdOrder(boolean distinct,
			BoundingBox boundingBox, Projection projection, String where,
			int limit, long offset) {
		return queryForChunk(distinct, boundingBox, projection, where,
				getIdColumn(), limit, offset);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			BoundingBox boundingBox, Projection projection, String where,
			String orderBy, int limit) {
		return queryForChunk(distinct, boundingBox, projection, where, null,
				orderBy, limit);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			BoundingBox boundingBox, Projection projection, String where,
			String orderBy, int limit, long offset) {
		return queryForChunk(distinct, boundingBox, projection, where, null,
				orderBy, limit, offset);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box in
	 * the provided projection, starting at the offset and returning no more
	 * than the limit
	 *
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunkIdOrder(String[] columns,
			BoundingBox boundingBox, Projection projection, String where,
			int limit) {
		return queryForChunk(columns, boundingBox, projection, where,
				getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box in
	 * the provided projection, starting at the offset and returning no more
	 * than the limit
	 *
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunkIdOrder(String[] columns,
			BoundingBox boundingBox, Projection projection, String where,
			int limit, long offset) {
		return queryForChunk(columns, boundingBox, projection, where,
				getIdColumn(), limit, offset);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection, starting at the offset and returning no more than the limit
	 *
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			BoundingBox boundingBox, Projection projection, String where,
			String orderBy, int limit) {
		return queryForChunk(false, columns, boundingBox, projection, where,
				orderBy, limit);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection, starting at the offset and returning no more than the limit
	 *
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			BoundingBox boundingBox, Projection projection, String where,
			String orderBy, int limit, long offset) {
		return queryForChunk(false, columns, boundingBox, projection, where,
				orderBy, limit, offset);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box in
	 * the provided projection, starting at the offset and returning no more
	 * than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunkIdOrder(boolean distinct,
			String[] columns, BoundingBox boundingBox, Projection projection,
			String where, int limit) {
		return queryForChunk(distinct, columns, boundingBox, projection, where,
				getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box in
	 * the provided projection, starting at the offset and returning no more
	 * than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunkIdOrder(boolean distinct,
			String[] columns, BoundingBox boundingBox, Projection projection,
			String where, int limit, long offset) {
		return queryForChunk(distinct, columns, boundingBox, projection, where,
				getIdColumn(), limit, offset);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			BoundingBox boundingBox, Projection projection, String where,
			String orderBy, int limit) {
		return queryForChunk(distinct, columns, boundingBox, projection, where,
				null, orderBy, limit);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			BoundingBox boundingBox, Projection projection, String where,
			String orderBy, int limit, long offset) {
		return queryForChunk(distinct, columns, boundingBox, projection, where,
				null, orderBy, limit, offset);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box in
	 * the provided projection, starting at the offset and returning no more
	 * than the limit
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(BoundingBox boundingBox,
			Projection projection, String where, String[] whereArgs,
			int limit) {
		return queryForChunk(boundingBox, projection, where, whereArgs,
				getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box in
	 * the provided projection, starting at the offset and returning no more
	 * than the limit
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(BoundingBox boundingBox,
			Projection projection, String where, String[] whereArgs, int limit,
			long offset) {
		return queryForChunk(boundingBox, projection, where, whereArgs,
				getIdColumn(), limit, offset);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection, starting at the offset and returning no more than the limit
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(BoundingBox boundingBox,
			Projection projection, String where, String[] whereArgs,
			String orderBy, int limit) {
		return queryForChunk(false, boundingBox, projection, where, whereArgs,
				orderBy, limit);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection, starting at the offset and returning no more than the limit
	 *
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(BoundingBox boundingBox,
			Projection projection, String where, String[] whereArgs,
			String orderBy, int limit, long offset) {
		return queryForChunk(false, boundingBox, projection, where, whereArgs,
				orderBy, limit, offset);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box in
	 * the provided projection, starting at the offset and returning no more
	 * than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			BoundingBox boundingBox, Projection projection, String where,
			String[] whereArgs, int limit) {
		return queryForChunk(distinct, boundingBox, projection, where,
				whereArgs, getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box in
	 * the provided projection, starting at the offset and returning no more
	 * than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			BoundingBox boundingBox, Projection projection, String where,
			String[] whereArgs, int limit, long offset) {
		return queryForChunk(distinct, boundingBox, projection, where,
				whereArgs, getIdColumn(), limit, offset);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			BoundingBox boundingBox, Projection projection, String where,
			String[] whereArgs, String orderBy, int limit) {
		BoundingBox featureBoundingBox = featureDao
				.projectBoundingBox(boundingBox, projection);
		return queryForChunk(distinct, featureBoundingBox, where, whereArgs,
				orderBy, limit);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct,
			BoundingBox boundingBox, Projection projection, String where,
			String[] whereArgs, String orderBy, int limit, long offset) {
		BoundingBox featureBoundingBox = featureDao
				.projectBoundingBox(boundingBox, projection);
		return queryForChunk(distinct, featureBoundingBox, where, whereArgs,
				orderBy, limit, offset);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box in
	 * the provided projection, starting at the offset and returning no more
	 * than the limit
	 *
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			BoundingBox boundingBox, Projection projection, String where,
			String[] whereArgs, int limit) {
		return queryForChunk(columns, boundingBox, projection, where, whereArgs,
				getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box in
	 * the provided projection, starting at the offset and returning no more
	 * than the limit
	 *
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			BoundingBox boundingBox, Projection projection, String where,
			String[] whereArgs, int limit, long offset) {
		return queryForChunk(columns, boundingBox, projection, where, whereArgs,
				getIdColumn(), limit, offset);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection, starting at the offset and returning no more than the limit
	 *
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			BoundingBox boundingBox, Projection projection, String where,
			String[] whereArgs, String orderBy, int limit) {
		return queryForChunk(false, columns, boundingBox, projection, where,
				whereArgs, orderBy, limit);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection, starting at the offset and returning no more than the limit
	 *
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(String[] columns,
			BoundingBox boundingBox, Projection projection, String where,
			String[] whereArgs, String orderBy, int limit, long offset) {
		return queryForChunk(false, columns, boundingBox, projection, where,
				whereArgs, orderBy, limit, offset);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box in
	 * the provided projection, starting at the offset and returning no more
	 * than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			BoundingBox boundingBox, Projection projection, String where,
			String[] whereArgs, int limit) {
		return queryForChunk(distinct, columns, boundingBox, projection, where,
				whereArgs, getIdColumn(), limit);
	}

	/**
	 * Query for feature index results ordered by id within the bounding box in
	 * the provided projection, starting at the offset and returning no more
	 * than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			BoundingBox boundingBox, Projection projection, String where,
			String[] whereArgs, int limit, long offset) {
		return queryForChunk(distinct, columns, boundingBox, projection, where,
				whereArgs, getIdColumn(), limit, offset);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			BoundingBox boundingBox, Projection projection, String where,
			String[] whereArgs, String orderBy, int limit) {
		BoundingBox featureBoundingBox = featureDao
				.projectBoundingBox(boundingBox, projection);
		return queryForChunk(distinct, columns, featureBoundingBox, where,
				whereArgs, orderBy, limit);
	}

	/**
	 * Query for feature index results within the bounding box in the provided
	 * projection, starting at the offset and returning no more than the limit
	 *
	 * @param distinct
	 *            distinct rows
	 * @param columns
	 *            columns
	 * @param boundingBox
	 *            bounding box
	 * @param projection
	 *            projection
	 * @param where
	 *            where clause
	 * @param whereArgs
	 *            where arguments
	 * @param orderBy
	 *            order by
	 * @param limit
	 *            chunk limit
	 * @param offset
	 *            chunk query offset
	 * @return feature index results, close when done
	 * @since 6.2.0
	 */
	public FeatureIndexResults queryForChunk(boolean distinct, String[] columns,
			BoundingBox boundingBox, Projection projection, String where,
			String[] whereArgs, String orderBy, int limit, long offset) {
		BoundingBox featureBoundingBox = featureDao
				.projectBoundingBox(boundingBox, projection);
		return queryForChunk(distinct, columns, featureBoundingBox, where,
				whereArgs, orderBy, limit, offset);
	}

	/**
	 * Verify the index location is set
	 *
	 * @return feature index type
	 */
	private FeatureIndexType verifyIndexLocation() {
		if (indexLocation == null) {
			throw new GeoPackageException(
					"Index Location is not set, set the location or call an index method specifying the location");
		}
		return indexLocation;
	}

}

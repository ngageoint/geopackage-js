import { UserPaginatedResults } from '../../user/userPaginatedResults';
import { FeatureColumn } from './featureColumn';
import { FeatureTable } from './featureTable';
import { FeatureRow } from './featureRow';
import { FeatureResultSet } from './featureResultSet';
import { Pagination } from '../../db/pagination';
import { FeatureDao } from './featureDao';

/**
 * Feature Paginated Results for iterating and querying through features in chunks
 */
export class FeaturePaginatedResults extends UserPaginatedResults<
  FeatureColumn,
  FeatureTable,
  FeatureRow,
  FeatureResultSet
> {
  /**
   * Determine if the result set is paginated
   * @param resultSet feature result set
   * @return true if paginated
   */
  public static isPaginated(resultSet: FeatureResultSet): boolean {
    return FeaturePaginatedResults.getPagination(resultSet) != null;
  }

  /**
   * Get the pagination offset and limit
   * @param resultSet feature result set
   * @return pagination or null if not paginated
   */
  public static getPagination(resultSet: FeatureResultSet): Pagination {
    return Pagination.find(resultSet.getSql());
  }

  /**
   * Create paginated results
   * @param dao feature dao
   * @param results feature result set
   * @return feature paginated results
   */
  public static create(dao: FeatureDao, results: FeatureResultSet): FeaturePaginatedResults {
    return new FeaturePaginatedResults(dao, results);
  }

  /**
   * Constructor
   * @param dao feature dao
   * @param results feature result set
   */
  public constructor(dao: FeatureDao, results: FeatureResultSet) {
    super(dao, results);
  }

  /**
   * {@inheritDoc}
   */
  public getDao(): FeatureDao {
    return super.getDao() as FeatureDao;
  }

  /**
   * {@inheritDoc}
   */
  public getResults(): FeatureResultSet {
    return super.getResults() as FeatureResultSet;
  }
}

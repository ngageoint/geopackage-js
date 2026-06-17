var QueryBuilder = require('../../../lib/db/sqliteQueryBuilder').SqliteQueryBuilder;

describe('SqliteQueryBuilder tests', function () {
  it('should create a query', function () {
    var parameters = {
      distinct: true,
      tables: 'test_table',
      where: 'a = 1',
      join: 'join',
      groupBy: 'grouping_column',
      having: 'having clause',
      orderBy: 'order_column',
      limit: 500,
    };
    var query = QueryBuilder.buildQuery(
      parameters.distinct,
      parameters.tables,
      parameters.columns,
      parameters.where,
      parameters.join,
      parameters.groupBy,
      parameters.having,
      parameters.orderBy,
      parameters.limit,
    );

    query.should.be.equal(
      'select distinct * from test_table join where a = 1 group by grouping_column having having clause order by order_column limit 500',
    );
  });

  it('should create a query with columns', function () {
    var parameters = {
      distinct: true,
      tables: 'test_table',
      columns: ['column1', 'column2', 'column3'],
      where: 'a = 1',
      join: 'join',
      groupBy: 'grouping_column',
      having: 'having clause',
      orderBy: 'order_column',
      limit: 500,
    };
    var query = QueryBuilder.buildQuery(
      parameters.distinct,
      parameters.tables,
      parameters.columns,
      parameters.where,
      parameters.join,
      parameters.groupBy,
      parameters.having,
      parameters.orderBy,
      parameters.limit,
    );

    query.should.be.equal(
      'select distinct "column1", "column2", "column3" from test_table join where a = 1 group by grouping_column having having clause order by order_column limit 500',
    );
  });

  it('should create a query selecting all columns for a table', function () {
    var parameters = {
      distinct: true,
      tables: 'test_table',
      columns: ['test_table.*'],
      where: 'a = 1',
      join: 'join',
      groupBy: 'grouping_column',
      having: 'having clause',
      orderBy: 'order_column',
      limit: 500,
    };
    var query = QueryBuilder.buildQuery(
      parameters.distinct,
      parameters.tables,
      parameters.columns,
      parameters.where,
      parameters.join,
      parameters.groupBy,
      parameters.having,
      parameters.orderBy,
      parameters.limit,
    );
    query.should.be.equal(
      'select distinct test_table.* from test_table join where a = 1 group by grouping_column having having clause order by order_column limit 500',
    );
  });
});

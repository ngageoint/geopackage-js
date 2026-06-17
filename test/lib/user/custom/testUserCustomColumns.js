import { UserCustomColumns } from '../../../../lib/user/custom/userCustomColumns';
import { UserCustomColumn } from '../../../../lib/user/custom/userCustomColumn';
import { GeoPackageDataType } from '../../../../lib/db/geoPackageDataType';

var expect = require('chai').expect;

describe('UserCustomColumns tests', function () {
  it('should create a UserColumns object', function () {
    const userColumnList = [];
    userColumnList.push(UserCustomColumn.createPrimaryKeyColumn('test_table_index'));
    userColumnList.push(UserCustomColumn.createColumn('test_table_text', GeoPackageDataType.TEXT, false, ''));
    var userColumns = new UserCustomColumns('test_table', userColumnList, [], false);
    userColumns.getColumnNames().length.should.be.equal(2);
  });

  it('should copy a UserCustomColumns object', function () {
    const userColumnList = [];
    userColumnList.push(UserCustomColumn.createPrimaryKeyColumn('test_table_index'));
    userColumnList.push(UserCustomColumn.createColumn('test_table_text', GeoPackageDataType.TEXT, false, ''));
    var userColumns = new UserCustomColumns('test_table', userColumnList, [], false);
    userColumns.getColumnNames().length.should.be.equal(2);
    var userColumnsCopy = userColumns.copy();
    userColumnsCopy.getTableName().should.be.equal('test_table');
    userColumnsCopy.getPkColumnName().should.be.equal('test_table_index');
    userColumnsCopy.getColumnIndexForColumnName('test_table_text').should.be.equal(1);
  });

  it('should add a UserCustomColumn to an existing UserCustomColumns object', function () {
    const userColumnList = [];
    userColumnList.push(UserCustomColumn.createPrimaryKeyColumn('test_table_index'));
    userColumnList.push(UserCustomColumn.createColumn('test_table_text', GeoPackageDataType.TEXT, false, ''));
    var userColumns = new UserCustomColumns('test_table', userColumnList, [], false);
    userColumns.getColumnNames().length.should.be.equal(2);
    userColumns.addColumn(UserCustomColumn.createColumn('test_table_integer', GeoPackageDataType.INTEGER, false, 1));
    userColumns.getColumns().length.should.be.equal(3);
  });

  it('should not allow adding columns with duplicate index', function () {
    const userColumnList = [];
    userColumnList.push(UserCustomColumn.createPrimaryKeyColumnWithIndex(0, 'test_table_index'));
    userColumnList.push(
      UserCustomColumn.createColumnWithIndex(1, 'test_table_text', GeoPackageDataType.TEXT, false, ''),
    );
    var userColumns = new UserCustomColumns('test_table', userColumnList, [], false);
    userColumns.getColumnNames().length.should.be.equal(2);
    expect(() =>
      userColumns.addColumn(
        UserCustomColumn.createColumnWithIndex(1, 'test_table_integer', GeoPackageDataType.INTEGER, false, 1),
      ),
    ).to.throw();
  });

  it('should not allow adding columns with duplicate name', function () {
    const userColumnList = [];
    userColumnList.push(UserCustomColumn.createPrimaryKeyColumn('test_table_index'));
    userColumnList.push(UserCustomColumn.createColumn('test_table_text', GeoPackageDataType.TEXT, false, ''));
    var userColumns = new UserCustomColumns('test_table', userColumnList, [], false);
    userColumns.getColumnNames().length.should.be.equal(2);
    expect(() =>
      userColumns.addColumn(UserCustomColumn.createColumn('test_table_text', GeoPackageDataType.INTEGER, false, 1)),
    ).to.throw();
  });

  it('should not allow adding multiple primary key columns', function () {
    const userColumnList = [];
    userColumnList.push(UserCustomColumn.createPrimaryKeyColumn('test_table_index'));
    userColumnList.push(UserCustomColumn.createColumn('test_table_text', GeoPackageDataType.TEXT, false, ''));
    var userColumns = new UserCustomColumns('test_table', userColumnList, [], false);
    userColumns.getColumnNames().length.should.be.equal(2);
    expect(() => userColumns.addColumn(UserCustomColumn.createPrimaryKeyColumn('test_table_index2'))).to.throw();
  });

  it('should not allow adding multiple primary key columns for custom table', function () {
    const userColumnList = [];
    userColumnList.push(UserCustomColumn.createPrimaryKeyColumn('test_table_index'));
    userColumnList.push(UserCustomColumn.createColumn('test_table_text', GeoPackageDataType.TEXT, false, ''));
    var userColumns = new UserCustomColumns('test_table', userColumnList, [], true);
    userColumns.getColumnNames().length.should.be.equal(2);
    expect(() => userColumns.addColumn(UserCustomColumn.createPrimaryKeyColumn('test_table_index2'))).to.throw();
  });

  it('should add a UserCustomColumn with no index and assign it an index', function () {
    const userColumnList = [];
    userColumnList.push(UserCustomColumn.createPrimaryKeyColumn('test_table_index'));
    userColumnList.push(UserCustomColumn.createColumn('test_table_text', GeoPackageDataType.TEXT, false, ''));
    var userColumns = new UserCustomColumns('test_table', userColumnList, [], false);
    userColumns.getColumnNames().length.should.be.equal(2);
    userColumns.addColumn(UserCustomColumn.createColumn('test_table_integer', GeoPackageDataType.INTEGER, false, 1));
    userColumns.getColumns().length.should.be.equal(3);
    userColumns.getColumnIndexForColumnName('test_table_integer').should.be.equal(2);
  });

  it('should create UserCustomColumns with required columns', function () {
    const userColumnList = [];
    userColumnList.push(UserCustomColumn.createPrimaryKeyColumn('test_table_index'));
    userColumnList.push(UserCustomColumn.createColumn('test_table_text', GeoPackageDataType.TEXT, false, ''));
    var userColumns = new UserCustomColumns(
      'test_table',
      userColumnList,
      ['test_table_index', 'test_table_text'],
      false,
    );
    userColumns.getColumnNames().length.should.be.equal(2);
    userColumns.setRequiredColumns(['test_table_index']);
  });
});

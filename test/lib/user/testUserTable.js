import { UserTable } from '../../../lib/user/userTable';
import { UserColumns } from '../../../lib/user/userColumns';
import { UserColumn } from '../../../lib/user/userColumn';
import { GeoPackageDataType } from '../../../lib/db/geoPackageDataType';
import { Contents } from '../../../lib/core/contents/contents';
import { UniqueConstraint } from '../../../lib/db/table/uniqueConstraint';
import { ConstraintType } from '../../../lib/db/table/constraintType';
import { RawConstraint } from "../../../lib/db/table/rawConstraint";

var path = require('path')
  , should = require('chai').should()
  , expect = require('chai').expect;

describe('UserTable tests', function() {
  var userTable;
  var userColumnList;
  beforeEach(async function() {
    userColumnList = [];
    userColumnList.push(UserColumn.createPrimaryKeyColumn(0, 'test_table_index'));
    userColumnList.push(UserColumn.createColumn(1, 'test_table_text', GeoPackageDataType.TEXT, false, ''));
    const userColumns = new UserColumns('test_table', userColumnList, false);
    userColumns.updateColumns();
    userTable = new UserTable(userColumns);
    const contents = new Contents();
    contents.table_name = 'test_table_contents';
    userTable.setContents(contents);
    userTable.addConstraints([new UniqueConstraint('test_table_index_unique', userColumnList[0])]);
  });

  it('should create a UserCustomTable object', function() {
    userTable.getUserColumns().getColumns().length.should.be.equal(2);
    userTable.getTableName().should.be.equal('test_table');
    userTable.hasColumn('test_column_not_found').should.be.equal(false);
    userTable.getIdColumn().getName().should.be.equal('test_table_index');
    userTable.getIdColumnIndex().should.be.equal(0);
    userTable.hasConstraints().should.be.equal(true);
    userTable.addConstraint(new RawConstraint(ConstraintType.FOREIGN_KEY, 'test_fk', 'FOREIGN KEY (test_table_text) REFERENCES Persons(PersonID)'));
    userTable.addConstraint(new RawConstraint(ConstraintType.FOREIGN_KEY, 'test_fk_2', 'FOREIGN KEY (test_table_text2) REFERENCES Things(ThingID)'));
    userTable.getConstraintsByType(ConstraintType.UNIQUE).length.should.be.equal(1);
    userTable.getConstraintsByType(ConstraintType.FOREIGN_KEY).length.should.be.equal(2);
    userTable.getConstraintsByType(ConstraintType.DEFAULT).length.should.be.equal(0);
    userTable.columnsOfType(GeoPackageDataType.TEXT).length.should.be.equal(1);
    should.exist(userTable.getContents());
  });

  it('should rename UserTable columns', function() {
    userTable.getUserColumns().getColumns().length.should.be.equal(2);
    userTable.getTableName().should.be.equal('test_table');
    expect(() => { userTable.getColumnWithColumnName('test_table_string')}).to.throw();
    should.exist(userTable.getColumnWithColumnName('test_table_text'));
    userTable.renameColumn(userTable.getColumnWithColumnName('test_table_text'), 'test_table_string');
    expect(() => { userTable.getColumnWithColumnName('test_table_text')}).to.throw();
    should.exist(userTable.getColumnWithColumnName('test_table_string'));
    userTable.renameColumnAtIndex(1, 'test_table_text');
    expect(() => { userTable.getColumnWithColumnName('test_table_string')}).to.throw();
    should.exist(userTable.getColumnWithColumnName('test_table_text'));
  });

  it('should add and drop UserTable columns', function() {
    userTable.addColumn(UserColumn.createColumn(2, 'test_table_integer', GeoPackageDataType.INTEGER, true, 5));
    should.exist(userTable.getColumnWithColumnName('test_table_integer'));
    userTable.dropColumnWithName('test_table_integer');
    expect(() => { userTable.getColumnWithColumnName('test_table_integer')}).to.throw();
    userTable.addColumn(UserColumn.createColumn(2, 'test_table_integer', GeoPackageDataType.INTEGER, true, 5));
    should.exist(userTable.getColumnWithColumnName('test_table_integer'));
    userTable.dropColumnWithIndex(2);
    expect(() => { userTable.getColumnWithColumnName('test_table_integer')}).to.throw();
    userTable.addColumn(UserColumn.createColumn(2, 'test_table_integer', GeoPackageDataType.INTEGER, true, 5));
    should.exist(userTable.getColumnWithColumnName('test_table_integer'));
    userTable.dropColumn(userTable.getUserColumns().getColumns()[2]);
    expect(() => { userTable.getColumnWithColumnName('test_table_integer')}).to.throw();
  });

  it('should alter a UserTable column', function() {
    const column = UserColumn.createColumn(2, 'test_table_integer', GeoPackageDataType.INTEGER, true, 5);
    const columnAlter = column.copy();
    columnAlter.setDefaultValue(7);
    userTable.addColumn(UserColumn.createColumn(2, 'test_table_integer', GeoPackageDataType.INTEGER, true, 5));
    should.exist(userTable.getColumnWithColumnName('test_table_integer'));
    userTable.alterColumn(columnAlter);
    userTable.getColumnWithColumnName('test_table_integer').getDefaultValue().should.be.equal(7);
  });

  it('should copy a UserCustomTable object', function() {
    const userTableCopy = userTable.copy();
    userTableCopy.getUserColumns().getColumns().length.should.be.equal(2);
    userTableCopy.getTableName().should.be.equal('test_table');
    userTableCopy.getContents().getTableName().should.be.equal('test_table_contents');
    userTableCopy.getConstraints().length.should.be.equal(1);
    userTableCopy.hasColumn('test_column_not_found').should.be.equal(false);
    userTableCopy.getIdColumn().getName().should.be.equal('test_table_index');
    userTableCopy.getIdColumnIndex().should.be.equal(0);
    userTableCopy.hasConstraints().should.be.equal(true);
    userTableCopy.getConstraintsByType(ConstraintType.UNIQUE).length.should.be.equal(1);
    userTableCopy.getConstraintsByType(ConstraintType.DEFAULT).length.should.be.equal(0);
    userTableCopy.columnsOfType(GeoPackageDataType.TEXT).length.should.be.equal(1);
  });

  it('should copy a UserCustomTable object without a contents object', function() {
    userTable.setContents(null);
    const userTableCopy = userTable.copy();
    userTableCopy.getUserColumns().getColumns().length.should.be.equal(2);
    userTableCopy.getTableName().should.be.equal('test_table');
    should.not.exist(userTableCopy.getContents());
    userTableCopy.getConstraints().length.should.be.equal(1);
    userTableCopy.hasColumn('test_column_not_found').should.be.equal(false);
    userTableCopy.getIdColumn().getName().should.be.equal('test_table_index');
    userTableCopy.getIdColumnIndex().should.be.equal(0);
    userTableCopy.hasConstraints().should.be.equal(true);
    userTableCopy.getConstraintsByType(ConstraintType.UNIQUE).length.should.be.equal(1);
    userTableCopy.getConstraintsByType(ConstraintType.DEFAULT).length.should.be.equal(0);
    userTableCopy.columnsOfType(GeoPackageDataType.TEXT).length.should.be.equal(1);
  });
});

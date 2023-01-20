import { UserTable } from '../../../lib/user/userTable';
import { UserColumns } from '../../../lib/user/userColumns';
import { UserColumn } from '../../../lib/user/userColumn';
import { GeoPackageDataType } from '../../../lib/db/geoPackageDataType';
import { Contents } from '../../../lib/contents/contents';
import { UniqueConstraint } from '../../../lib/db/table/uniqueConstraint';
import { ConstraintType } from '../../../lib/db/table/constraintType';
import { RawConstraint } from "../../../lib/db/table/rawConstraint";
import { UserCustomColumn } from "../../../lib/user/custom/userCustomColumn";
import { UserCustomColumns } from "../../../lib/user/custom/userCustomColumns";
import { UserCustomTable } from "../../../lib/user/custom/userCustomTable";

var path = require('path')
  , should = require('chai').should()
  , expect = require('chai').expect;

describe('UserTable tests', function() {
  var userTable;
  var userColumnList;
  beforeEach(async function() {
    userColumnList = [];
    userColumnList.push(UserCustomColumn.createPrimaryKeyColumnWithIndex(0, 'test_table_index'));
    userColumnList.push(UserCustomColumn.createColumnWithIndex(1, 'test_table_text', GeoPackageDataType.TEXT, false, ''));
    const userColumns = new UserCustomColumns('test_table', userColumnList, false);
    userColumns.updateColumns();
    userTable = new UserCustomTable(userColumns);
    const contents = new Contents();
    contents.setTableName('test_table_contents');
    userTable.setContents(contents);
    userTable.addConstraint(new UniqueConstraint('test_table_index_unique', userColumnList[0]));
  });

  it('should create a UserCustomTable object', function() {
    userTable.getUserColumns().getColumns().length.should.be.equal(2);
    userTable.getTableName().should.be.equal('test_table');
    userTable.hasColumn('test_column_not_found').should.be.equal(false);
    userTable.getPkColumnName().should.be.equal('test_table_index');
    userTable.getPkColumnIndex().should.be.equal(0);
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
    expect(() => { userTable.getColumn('test_table_string')}).to.throw();
    should.exist(userTable.getColumn('test_table_text'));
    userTable.renameColumn(userTable.getColumn('test_table_text'), 'test_table_string');
    expect(() => { userTable.getColumn('test_table_text')}).to.throw();
    should.exist(userTable.getColumn('test_table_string'));
    userTable.renameColumnWithIndex(1, 'test_table_text');
    expect(() => { userTable.getColumn('test_table_string')}).to.throw();
    should.exist(userTable.getColumn('test_table_text'));
  });

  it('should add and drop UserTable columns', function() {
    userTable.addColumn(UserCustomColumn.createColumnWithIndex(2, 'test_table_integer', GeoPackageDataType.INTEGER, true, 5));
    should.exist(userTable.getColumn('test_table_integer'));
    userTable.dropColumnWithName('test_table_integer');
    expect(() => { userTable.getColumn('test_table_integer')}).to.throw();
    userTable.addColumn(UserCustomColumn.createColumnWithIndex(2, 'test_table_integer', GeoPackageDataType.INTEGER, true, 5));
    should.exist(userTable.getColumn('test_table_integer'));
    userTable.dropColumnWithIndex(2);
    expect(() => { userTable.getColumn('test_table_integer')}).to.throw();
    userTable.addColumn(UserCustomColumn.createColumnWithIndex(2, 'test_table_integer', GeoPackageDataType.INTEGER, true, 5));
    should.exist(userTable.getColumn('test_table_integer'));
    userTable.dropColumn(userTable.getUserColumns().getColumns()[2]);
    expect(() => { userTable.getColumn('test_table_integer')}).to.throw();
  });

  it('should alter a UserTable column', function() {
    const column = UserCustomColumn.createColumnWithIndex(2, 'test_table_integer', GeoPackageDataType.INTEGER, true, 5);
    const columnAlter = column.copy();
    columnAlter.setDefaultValue(7);
    userTable.addColumn(UserCustomColumn.createColumnWithIndex(2, 'test_table_integer', GeoPackageDataType.INTEGER, true, 5));
    should.exist(userTable.getColumn('test_table_integer'));
    userTable.alterColumn(columnAlter);
    userTable.getColumn('test_table_integer').getDefaultValue().should.be.equal(7);
  });

  it('should copy a UserCustomTable object', function() {
    const userTableCopy = userTable.copy();
    userTableCopy.getUserColumns().getColumns().length.should.be.equal(2);
    userTableCopy.getTableName().should.be.equal('test_table');
    userTableCopy.getContents().getTableName().should.be.equal('test_table_contents');
    userTableCopy.getConstraints().size().should.be.equal(1);
    userTableCopy.hasColumn('test_column_not_found').should.be.equal(false);
    userTableCopy.getPkColumn().getName().should.be.equal('test_table_index');
    userTableCopy.getPkColumnIndex().should.be.equal(0);
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
    userTableCopy.getConstraints().size().should.be.equal(1);
    userTableCopy.hasColumn('test_column_not_found').should.be.equal(false);
    userTableCopy.getPkColumn().getName().should.be.equal('test_table_index');
    userTableCopy.getPkColumnIndex().should.be.equal(0);
    userTableCopy.hasConstraints().should.be.equal(true);
    userTableCopy.getConstraintsByType(ConstraintType.UNIQUE).length.should.be.equal(1);
    userTableCopy.getConstraintsByType(ConstraintType.DEFAULT).length.should.be.equal(0);
    userTableCopy.columnsOfType(GeoPackageDataType.TEXT).length.should.be.equal(1);
  });
});

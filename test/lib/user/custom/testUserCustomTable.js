import { UserCustomTable } from '../../../../lib/user/custom/userCustomTable';
import { UserCustomColumn } from '../../../../lib/user/custom/userCustomColumn';
import { GeoPackageDataType } from '../../../../lib/db/geoPackageDataType';

var path = require('path')
  , should = require('chai').should()
  , expect = require('chai').expect;

describe('UserCustomTable tests', function() {
  it('should create a UserCustomTable object', function() {
    const userColumnList = [];
    userColumnList.push(UserCustomColumn.createPrimaryKeyColumn(0, 'test_table_index'));
    userColumnList.push(UserCustomColumn.createColumn(1, 'test_table_text', GeoPackageDataType.TEXT, false, ''));
    var userCustomTable = new UserCustomTable('test_table', userColumnList, ['test_table_index']);
    userCustomTable.getUserColumns().getColumns().length.should.be.equal(2);
    userCustomTable.getTableName().should.be.equal('test_table');
    should.not.exist(userCustomTable.getDataType());
    userCustomTable.getRequiredColumns().length.should.be.equal(1);
    const userCustomTableCopy = userCustomTable.copy();
    userCustomTableCopy.getUserColumns().getColumns().length.should.be.equal(2);
    userCustomTableCopy.getTableName().should.be.equal('test_table');
    should.not.exist(userCustomTableCopy.getDataType());
    userCustomTableCopy.getRequiredColumns().length.should.be.equal(1);
  });
});

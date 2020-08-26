
import { default as testSetup } from '../../fixtures/testSetup'
import { UserCustomTableReader } from '../../../lib/user/custom/userCustomTableReader';
import { UserCustomDao } from '../../../lib/user/custom/userCustomDao';

var path = require('path')
  , should = require('chai').should();

describe('UserTableReader tests', function() {
  var geoPackage;
  var filename;
  beforeEach('create the GeoPackage connection', async function() {
    var sampleFilename = path.join(__dirname, '..', '..', 'fixtures', 'gdal_sample.gpkg');
    // @ts-ignore
    let result = await copyAndOpenGeopackage(sampleFilename);
    filename = result.path;
    geoPackage = result.geopackage;
  });

  afterEach('close the geopackage connection', async function() {
    geoPackage.close();
    await testSetup.deleteGeoPackage(filename);
  });

  it('should read the table', function() {
    var reader = new UserCustomTableReader('point2d');
    var table = reader.readTable(geoPackage.database);
    table.getTableName().should.be.equal('point2d');
    table.getUserColumns().getColumns().length.should.be.equal(8);
    table.getUserColumns().getColumns()[0].getName().should.be.equal('fid');
    table.getUserColumns().getColumns()[1].getName().should.be.equal('geom');
    table.getUserColumns().getColumns()[2].getName().should.be.equal('intfield');
    table.getUserColumns().getColumns()[3].getName().should.be.equal('strfield');
    table.getUserColumns().getColumns()[4].getName().should.be.equal('realfield');
    table.getUserColumns().getColumns()[5].getName().should.be.equal('datetimefield');
    table.getUserColumns().getColumns()[6].getName().should.be.equal('datefield');
    table.getUserColumns().getColumns()[7].getName().should.be.equal('binaryfield');
  });

  it('should query the table', function() {
    var reader = new UserCustomTableReader('point2d');
    var table = reader.readTable(geoPackage.database);
    var ud = new UserCustomDao(geoPackage, table);
    var results = ud.queryForAll();
    should.exist(results);
    results.length.should.be.equal(2);
    for (var i = 0; i < results.length; i++) {
      var ur = ud.getRow(results[i]);
      ur.columnCount.should.be.equal(8);
      var names = ur.columnNames;
      names.should.include('fid');
      names.should.include('geom');
      names.should.include('intfield');
      names.should.include('strfield');
      names.should.include('realfield');
      names.should.include('datetimefield');
      names.should.include('datefield');
      names.should.include('binaryfield');
      ur.getColumnNameWithIndex(0).should.be.equal('fid');
      ur.getColumnIndexWithColumnName('fid').should.be.equal(0);
      ur.getValueWithIndex(0).should.be.equal(i+1);
      ur.getValueWithColumnName('fid').should.be.equal(i+1);
      ur.getRowColumnTypeWithIndex(0).should.be.equal(5);
      ur.getRowColumnTypeWithColumnName('fid').should.be.equal(5);
      ur.getColumnWithIndex(0).name.should.be.equal('fid');
      ur.getColumnWithColumnName('fid').name.should.be.equal('fid');
      ur.id.should.be.equal(i+1);
      ur.pkColumn.getName().should.be.equal('fid');
      ur.getColumnWithIndex(0).getType().should.be.equal('INTEGER');
      should.exist(ur.values);
    }
  });
});

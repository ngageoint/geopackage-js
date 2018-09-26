var UserTableReader = require('../../../lib/user/userTableReader.js')
  , UserDao = require('../../../lib/user/userDao')
  , GeoPackageAPI = require('../../../.')
  , path = require('path')
  , should = require('chai').should();

describe('UserTableReader tests', function() {
  var geoPackage;
  beforeEach('create the GeoPackage connection', function(done) {
    var filename = path.join(__dirname, '..', '..', 'fixtures', 'gdal_sample.gpkg');
    GeoPackageAPI.open(filename, function(err, gp) {
      geoPackage = gp;
      should.not.exist(err);
      should.exist(gp);
      should.exist(gp.getDatabase().getDBConnection());
      gp.getPath().should.be.equal(filename);
      done();
    });
  });

  afterEach('close the geopackage connection', function() {
    connection.close();
  });

  it('should read the table', function() {
    var reader = new UserTableReader('point2d');
    var table = reader.readTable(geoPackage.getDatabase());
    table.table_name.should.be.equal('point2d');
    table.columns.length.should.be.equal(8);
    table.columns[0].name.should.be.equal('fid');
    table.columns[1].name.should.be.equal('geom');
    table.columns[2].name.should.be.equal('intfield');
    table.columns[3].name.should.be.equal('strfield');
    table.columns[4].name.should.be.equal('realfield');
    table.columns[5].name.should.be.equal('datetimefield');
    table.columns[6].name.should.be.equal('datefield');
    table.columns[7].name.should.be.equal('binaryfield');
  });

  it('should query the table', function() {
    var reader = new UserTableReader('point2d');
    var table = reader.readTable(geoPackage.getDatabase());
    var ud = new UserDao(geoPackage, table);
    var results = ud.queryForAll();
    should.exist(results);
    results.length.should.be.equal(2);
    for (var i = 0; i < results.length; i++) {
      var ur = ud.getRow(results[i]);
      ur.columnCount().should.be.equal(8);
      var names = ur.getColumnNames()
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
      ur.getId().should.be.equal(i+1);
      ur.getPkColumn().name.should.be.equal('fid');
      ur.getColumnWithIndex(0).getTypeName().should.be.equal('INTEGER');
      should.exist(ur.values);
    }
  });

});

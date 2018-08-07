var FeatureTableReader = require('../../../../lib/features/user/featureTableReader.js')
  , GeometryColumnsDao = require('../../../../lib/features/columns').GeometryColumnsDao
  , GeoPackageConnection = require('../../../../lib/db/geoPackageConnection.js')
  , path = require('path')
  , should = require('chai').should();

describe('FeatureTableReader tests', function() {
  var connection;
  beforeEach('create the GeoPackage connection', function(done) {
    GeoPackageConnection.connect(path.join(__dirname, '..', '..', '..', 'fixtures', 'gdal_sample.gpkg')).then(function(geoPackageConnection) {
      connection = geoPackageConnection;
      should.exist(connection);
      done();
    });
  });

  afterEach('close the geopackage connection', function() {
    connection.close();
  });

  it('should read the table', function() {
    var reader = new FeatureTableReader('point2d');
    var table = reader.readFeatureTable(connection);
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

    table.getGeometryColumn().name.should.be.equal('geom');
  });

  it('should read the table with geometry columns', function() {
    var gcd = new GeometryColumnsDao(connection);
    var geometryColumns = gcd.queryForTableName('point2d');
    var reader = new FeatureTableReader(geometryColumns);

    var table = reader.readFeatureTable(connection);
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

    table.getGeometryColumn().name.should.be.equal('geom');
  });

});

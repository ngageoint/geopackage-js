var FeatureTableReader = require('../../../../lib/features/user/featureTableReader.js')
  , GeometryColumnsDao = require('../../../../lib/features/columns').GeometryColumnsDao
  , GeoPackageConnection = require('../../../../lib/db/geoPackageConnection.js')
  , path = require('path')
  , should = require('chai').should();

describe('FeatureTableReader tests', function() {
  var connection;
  beforeEach('create the GeoPackage connection', function(done) {
    GeoPackageConnection.connect(path.join(__dirname, '..', '..', '..', 'fixtures', 'gdal_sample.gpkg'), function(err, geoPackageConnection) {
      connection = geoPackageConnection;
      should.exist(connection);
      done();
    });
  });

  it('should read the table', function(done) {
    var reader = new FeatureTableReader('point2d');
    reader.readFeatureTable(connection, function(err, table) {
      table.tableName.should.be.equal('point2d');
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

      done();
    });
  });

  it('should read the table with geometry columns', function(done) {
    new GeometryColumnsDao(connection).queryForTableName('point2d', function(err, geometryColumns) {
      var reader = new FeatureTableReader(geometryColumns);

      reader.readFeatureTable(connection, function(err, table) {
        table.tableName.should.be.equal('point2d');
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

        done();
      });
    });
  });

});

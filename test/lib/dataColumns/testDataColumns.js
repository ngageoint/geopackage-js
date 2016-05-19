var DataColumnsDao = require('../../../lib/dataColumns').DataColumnsDao
  , GeoPackageConnection = require('../../../lib/db/geoPackageConnection')
  , path = require('path')
  , should = require('chai').should();

describe('Data Columns tests', function() {

  var connection;

  beforeEach('create the GeoPackage connection', function(done) {
    GeoPackageConnection.connect(path.join(__dirname, '..', '..', 'fixtures', 'rivers.gpkg'), function(err, geoPackageConnection) {
      connection = geoPackageConnection;
      should.exist(connection);
      done();
    });
  });

  it('should get the data column for property_0', function(done) {
    var dc = new DataColumnsDao(connection);
    dc.getDataColumns('FEATURESriversds', 'property_0', function(err, dataColumn) {
      dataColumn.should.be.deep.equal({
        table_name: 'FEATURESriversds',
        column_name: 'property_0',
        name: 'Scalerank',
        title: 'Scalerank',
        description: 'Scalerank',
        mime_type: null,
        constraint_name: null
      });
      done();
    });
  });

  it('should get the data column for geom', function(done) {
    var dc = new DataColumnsDao(connection);
    dc.getDataColumns('FEATURESriversds', 'geom', function(err, dataColumn) {
      should.not.exist(err);
      should.not.exist(dataColumn);
      done();
    });
  });

});

var GeoJSONToGeoPackage = require('../index.js');

var path = require('path')
  , should = require('chai').should();

describe('GeoJSON to GeoPackage tests', function() {

  it('should convert the natural earth 110m file', function(done) {
    this.timeout(10000);
    GeoJSONToGeoPackage.convertFile(path.join(__dirname, 'fixtures', 'ne_110m_land.geojson'), path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg'), function(status, callback) {
      callback();
    }, function(err, result) {
      should.not.exist(err);
      should.exist(result);
      done();
    });
  });
});

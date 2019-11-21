var FeatureTableReader = require('../../../../lib/features/user/featureTableReader.js')
  , GeometryColumnsDao = require('../../../../lib/features/columns/geometryColumnsDao')
  , GeoPackageAPI = require('../../../../.')
  , path = require('path')
  , should = require('chai').should();

describe('FeatureTableReader tests', function() {
  var geoPackage;
  beforeEach('create the GeoPackage connection', function(done) {
    var filename = path.join(__dirname, '..', '..', '..', 'fixtures', 'gdal_sample.gpkg');
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
    geoPackage.close();
  });

  it('should read the table', function() {
    var reader = new FeatureTableReader('point2d');
    var table = reader.readFeatureTable(geoPackage);
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
    var gcd = new GeometryColumnsDao(geoPackage);
    var geometryColumns = gcd.queryForTableName('point2d');
    var reader = new FeatureTableReader(geometryColumns);

    var table = reader.readFeatureTable(geoPackage);
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

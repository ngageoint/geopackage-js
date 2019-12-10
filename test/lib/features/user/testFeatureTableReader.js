import { default as GeoPackageAPI } from '../../../..'

var FeatureTableReader = require('../../../../lib/features/user/featureTableReader').default
  , GeometryColumnsDao = require('../../../../lib/features/columns/geometryColumnsDao').default
  // , GeoPackageAPI = require('../../../../.')
  , path = require('path')
  , should = require('chai').should();

describe('FeatureTableReader tests', function() {
  var geoPackage;
  beforeEach('create the GeoPackage connection', async function() {
    var filename = path.join(__dirname, '..', '..', '..', 'fixtures', 'gdal_sample.gpkg');

    // @ts-ignore
    let result = await copyAndOpenGeopackage(filename);
    filename = result.path;
    geoPackage = result.geopackage;
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

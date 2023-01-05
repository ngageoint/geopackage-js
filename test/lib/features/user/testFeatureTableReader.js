import { default as testSetup } from '../../../testSetup'

var FeatureTableReader = require('../../../../lib/features/user/featureTableReader').FeatureTableReader
  , GeometryColumnsDao = require('../../../../lib/features/columns/geometryColumnsDao').GeometryColumnsDao
  , path = require('path')
  , should = require('chai').should();

describe('FeatureTableReader tests', function() {
  var geoPackage;
  var filename;
  beforeEach('create the GeoPackage connection', async function() {
    var sampleFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'gdal_sample.gpkg');

    // @ts-ignore
    let result = await copyAndOpenGeopackage(sampleFilename);
    filename = result.path;
    geoPackage = result.geoPackage;
  });

  afterEach('close the geoPackage connection', async function() {
    geoPackage.close();
    await testSetup.deleteGeoPackage(filename);
  });

  it('should read the table', function() {
    var reader = new FeatureTableReader('point2d');
    var table = reader.readTable(geoPackage.getConnection());
    table.getTableName().should.be.equal('point2d');
    const columns = table.getUserColumns().getColumns();
    columns.length.should.be.equal(8);
    columns[0].getName().should.be.equal('fid');
    columns[1].getName().should.be.equal('geom');
    columns[2].getName().should.be.equal('intfield');
    columns[3].getName().should.be.equal('strfield');
    columns[4].getName().should.be.equal('realfield');
    columns[5].getName().should.be.equal('datetimefield');
    columns[6].getName().should.be.equal('datefield');
    columns[7].getName().should.be.equal('binaryfield');

    table.getGeometryColumn().getName().should.be.equal('geom');
  });

  it('should read the table with geometry columns', function() {
    var gcd = new GeometryColumnsDao(geoPackage);
    var geometryColumns = gcd.queryForTableName('point2d');
    var reader = new FeatureTableReader(geometryColumns);

    var table = reader.readTable(geoPackage.getConnection());
    table.getTableName().should.be.equal('point2d');
    const columns = table.getUserColumns().getColumns();
    columns.length.should.be.equal(8);
    columns[0].getName().should.be.equal('fid');
    columns[1].getName().should.be.equal('geom');
    columns[2].getName().should.be.equal('intfield');
    columns[3].getName().should.be.equal('strfield');
    columns[4].getName().should.be.equal('realfield');
    columns[5].getName().should.be.equal('datetimefield');
    columns[6].getName().should.be.equal('datefield');
    columns[7].getName().should.be.equal('binaryfield');

    table.getGeometryColumn().getName().should.be.equal('geom');
  });

});

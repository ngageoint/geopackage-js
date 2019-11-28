import { default as GeoPackageAPI } from '../../../..'
var SpatialReferenceSystemDao = require('../../../../lib/core/srs/spatialReferenceSystemDao')
  , SpatialReferenceSystem = require('../../../../lib/core/srs/spatialReferenceSystem')
  , should = require('chai').should()
  , path = require('path');

describe('SpatialReferenceSystem tests', function() {

  var geoPackage;

  beforeEach('should open the geopackage', function(done) {
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

  afterEach('should close the geopackage', function(){
    geoPackage.close();
  });

  it('should get a 4326 projection', function() {
    var srs = new SpatialReferenceSystem();
    srs.organization = 'epsg';
    srs.organization_coordsys_id = 4326;

    var projection = srs.getProjection();
    should.exist(projection);
    projection.oProj.projName.should.be.equal('longlat');
  });

  it('should get a projection that is not 4326', function() {
    var srs = new SpatialReferenceSystem();
    srs.organization = 'EPSG';
    srs.organization_coordsys_id = 3857;

    var projection = srs.getProjection();
    should.exist(projection);
    projection.oProj.title.should.be.equal('WGS 84 / Pseudo-Mercator');
  });

  it('should get a projection from a definition', function() {
    var srs = new SpatialReferenceSystem();
    srs.definition = '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs';

    var projection = srs.getProjection();
    should.exist(projection);
    projection.oProj.projName.should.be.equal('merc');
  });

  it('should get a projection from a definition_12_063', function() {
    var srs = new SpatialReferenceSystem();
    srs.definition_12_063 = 'PROJCS["WGS 84 / Pseudo-Mercator",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]],PROJECTION["Mercator_1SP"],PARAMETER["central_meridian",0],PARAMETER["scale_factor",1],PARAMETER["false_easting",0],PARAMETER["false_northing",0],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AXIS["X",EAST],AXIS["Y",NORTH],EXTENSION["PROJ4","+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs"],AUTHORITY["EPSG","3857"]]';

    var projection = srs.getProjection();
    should.exist(projection);
    projection.oProj.PROJECTION.should.be.equal('Mercator_1SP');
  });

  it('should get the 4326 SRS', function() {
    var srs = geoPackage.getSpatialReferenceSystemDao().getBySrsId(4326);
    should.exist(srs);
    srs.should.have.property('srs_name')
    srs.should.have.property('srs_id');
    srs.should.have.property('organization');
    srs.should.have.property('organization_coordsys_id', 4326);
    srs.should.have.property('definition');
  });

  it('should get the 0 SRS', function() {
    var srs = geoPackage.getSpatialReferenceSystemDao().getBySrsId(0);
    should.exist(srs);
    srs.should.have.property('srs_name')
    srs.should.have.property('srs_id');
    srs.should.have.property('organization');
    srs.should.have.property('organization_coordsys_id', 0);
    srs.should.have.property('definition');
  });

  it('should fail to get an SRS that does not exist', function() {
    var srs = geoPackage.getSpatialReferenceSystemDao().getBySrsId(-2);
    should.not.exist(srs);
  });

  it('should get all defined SRS', function() {
    var srs = geoPackage.getSpatialReferenceSystemDao().queryForAll();
    should.exist(srs);
    srs.should.have.property('length', 4);
  });

  it('should get the 4326 SRS', function() {
    var srs = geoPackage.getSpatialReferenceSystemDao().getBySrsId(4326);
    should.exist(srs);
    var srsProjection = srs.getProjection();
    should.exist(srsProjection);
    var projection = geoPackage.getSpatialReferenceSystemDao().getProjection(srs);
    should.exist(projection);
  });

});

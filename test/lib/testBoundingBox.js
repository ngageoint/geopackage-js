var BoundingBox = require('../../lib/boundingBox').BoundingBox;
var TileBoundingBoxUtils = require('../../lib/tiles/tileBoundingBoxUtils').TileBoundingBoxUtils;

var proj4 = require('proj4')
var should = require('chai').should();

describe('BoundingBox tests', function() {

  it('should create a BoundingBox', function() {
    var bb = new BoundingBox(0, 1, 2, 3);
    bb.minLongitude.should.be.equal(0);
    bb.maxLongitude.should.be.equal(1);
    bb.minLatitude.should.be.equal(2);
    bb.maxLatitude.should.be.equal(3);
  });

  it('should duplicate a BoundingBox', function() {
    var bb = new BoundingBox(0, 1, 2, 3);
    var bb2 = new BoundingBox(bb);
    bb2.minLongitude.should.be.equal(0);
    bb2.maxLongitude.should.be.equal(1);
    bb2.minLatitude.should.be.equal(2);
    bb2.maxLatitude.should.be.equal(3);
  });

  it('should be equal to another BoundingBox', function() {
    var bb = new BoundingBox(0, 1, 2, 3);
    var bb2 = new BoundingBox(0, 1, 2, 3);
    bb.equals(bb2).should.be.equal(true);
  });

  it('should not be equal to another undefined', function() {
    var bb = new BoundingBox(0, 1, 2, 3);
    bb.equals(undefined).should.be.equal(false);
  });

  it('should be equal to itself', function() {
    var bb = new BoundingBox(0, 1, 2, 3);
    bb.equals(bb).should.be.equal(true);
  });

  it('should get BoundingBox GeoJSON', function() {
    var bb = new BoundingBox(0, 1, 2, 3);
    var gj = bb.toGeoJSON();
    gj.type.should.be.equal("Feature");
    gj.geometry.type.should.be.equal("Polygon");
    gj.geometry.coordinates[0][0][0].should.be.equal(0);
    gj.geometry.coordinates[0][0][1].should.be.equal(2);
    gj.geometry.coordinates[0][1][0].should.be.equal(1);
    gj.geometry.coordinates[0][1][1].should.be.equal(2);
    gj.geometry.coordinates[0][2][0].should.be.equal(1);
    gj.geometry.coordinates[0][2][1].should.be.equal(3);
    gj.geometry.coordinates[0][3][0].should.be.equal(0);
    gj.geometry.coordinates[0][3][1].should.be.equal(3);
    gj.geometry.coordinates[0][4][0].should.be.equal(0);
    gj.geometry.coordinates[0][4][1].should.be.equal(2);
  });

  it('should project the BoundingBox', function() {
    var bb = new BoundingBox(0, 1, 2, 3);
    var projected = bb.projectBoundingBox('EPSG:4326', 'EPSG:3857');
    projected.minLongitude.should.be.equal(0);
    projected.maxLongitude.should.be.equal(111319.49079327357);
    projected.minLatitude.should.be.equal(222684.20850554455);
    projected.maxLatitude.should.be.equal(334111.1714019597);
  });

  it('should return the BoundingBox due to no projection', function() {
    var bb = new BoundingBox(0, 1, 2, 3);
    // @ts-ignore
    var projected = bb.projectBoundingBox('EPSG:4326');
    projected.minLongitude.should.be.equal(0);
    projected.maxLongitude.should.be.equal(1);
    projected.minLatitude.should.be.equal(2);
    projected.maxLatitude.should.be.equal(3);
  });

  it('should convert', function() {
    var bb = new BoundingBox(-1252344.2714243277,2504688.5428486555,0,3757032.814272983);
    var projected = bb.projectBoundingBox('EPSG:3857', 'EPSG:4326');
  });

  it('should convert with a projection and bbox where the minimum corner moves', function() {
    let webMercatorBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(38006, 49249, 17);
    let projection = proj4('PROJCS["NAD83 / Pennsylvania South",GEOGCS["NAD83",DATUM["North_American_Datum_1983",SPHEROID["GRS 1980",6378137,298.257222101],AUTHORITY["EPSG","6269"]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4269"]],PROJECTION["Lambert_Conformal_Conic_2SP"],PARAMETER["latitude_of_origin",39.3333333333333],PARAMETER["central_meridian",-77.75],PARAMETER["standard_parallel_1",40.9666666666667],PARAMETER["standard_parallel_2",39.9333333333333],PARAMETER["false_easting",600000],PARAMETER["false_northing",0],UNIT["metre",1],AXIS["Easting",EAST],AXIS["Northing",NORTH],AUTHORITY["EPSG","32129"]]');
    let projectionBox = webMercatorBox.projectBoundingBox('EPSG:3857', projection);
    projectionBox.minLongitude.should.be.equal(780341.5525948266)
    projectionBox.maxLongitude.should.be.equal(780578.9297426236)
    projectionBox.minLatitude.should.be.equal(162413.15481310617)
    projectionBox.maxLatitude.should.be.equal(162649.66124618147)
  })

  it('should convert with a projection and bbox where the minimum corner moves with string projection', function() {
    let webMercatorBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(38006, 49249, 17);
    let projection = 'PROJCS["NAD83 / Pennsylvania South",GEOGCS["NAD83",DATUM["North_American_Datum_1983",SPHEROID["GRS 1980",6378137,298.257222101],AUTHORITY["EPSG","6269"]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4269"]],PROJECTION["Lambert_Conformal_Conic_2SP"],PARAMETER["latitude_of_origin",39.3333333333333],PARAMETER["central_meridian",-77.75],PARAMETER["standard_parallel_1",40.9666666666667],PARAMETER["standard_parallel_2",39.9333333333333],PARAMETER["false_easting",600000],PARAMETER["false_northing",0],UNIT["metre",1],AXIS["Easting",EAST],AXIS["Northing",NORTH],AUTHORITY["EPSG","32129"]]';
    let projectionBox = webMercatorBox.projectBoundingBox('EPSG:3857', projection);
    projectionBox.minLongitude.should.be.equal(780341.5525948266)
    projectionBox.maxLongitude.should.be.equal(780578.9297426236)
    projectionBox.minLatitude.should.be.equal(162413.15481310617)
    projectionBox.maxLatitude.should.be.equal(162649.66124618147)
  })

});

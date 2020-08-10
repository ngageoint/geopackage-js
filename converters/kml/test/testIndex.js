const GeoPackage = require('@ngageoint/geopackage');
const KMLToGeoPackage = require('../index').KMLToGeoPackage;
const geoSpatialUtilities = require('../geoSpatialUtilities').GeoSpatialUtilities;
const WEB_MERCATOR_MIN_LAT_RANGE = require('../geoSpatialUtilities').WEB_MERCATOR_MIN_LAT_RANGE;
const WEB_MERCATOR_MAX_LAT_RANGE = require('../geoSpatialUtilities').WEB_MERCATOR_MAX_LAT_RANGE;
const kmlUtilities = require('../kmlUtilities').KMLUtilities;
const imageUtilities = require('../imageUtilities').ImageUtilities;

const path = require('path');
const fs = require('fs');
const { AssertionError, assert } = require('chai');
const should = require('chai').should();
const _ = require('lodash');
const Jimp = require('jimp');
const { ImageUtilities } = require('../imageUtilities');

let emptyGeopackage;

const bboxWorld = new GeoPackage.BoundingBox(-180, 180, -90, 90);

after(function() {
    fs.rmdirSync(path.join(__dirname, 'fixtures', 'tmp'), {recursive: true});
});
describe('KML and KMZ to Geopackage Tests', function() {
    // const 
    beforeEach (function() {

    });
    afterEach (function () {

    });
    it ('should convert KML Samples Edited to a GeoPackage', async function() {
        this.timeout(30000);
        try {
            fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'kmlSamplesEdited.gpkg'));
        } catch (e) {}
        const KML_Samples_Edited_Path = path.join(__dirname, 'fixtures', 'KML_Samples_Edited.kml');
        const KML_Samples_Edited_Converter = new KMLToGeoPackage({append: true});
        const geometryTableName = 'kmlSamples';
        const kmlGeopackage = KML_Samples_Edited_Converter.convertKMLOrKMZToGeopackage(KML_Samples_Edited_Path, false, path.join(__dirname, 'fixtures', 'tmp', 'kmlSamplesEdited.gpkg'), geometryTableName);
        const geopackage = await kmlGeopackage;
        // Feature Table exists
        should.exist(geopackage);
        const tableData = geopackage.getFeatureTables();
        tableData.length.should.be.equal(1);
        tableData[0].should.be.equal(geometryTableName);
        const featureDao = geopackage.getFeatureDao(geometryTableName);
        featureDao.getCount().should.be.equal(23);
        // Tile Table Exists
        const tileMatrixTable = geopackage.getTileTables();
        should.exist(tileMatrixTable);
        tileMatrixTable.length.should.be.equal(1);

        // Attribute table Exists.
        const attributeTables = geopackage.getAttributesTables();
        should.exist(attributeTables);
        attributeTables.length.should.be.equal(3);
    });
    it ('should handle a file with a network Link', async function() {
        this.enableTimeouts(false);
        try {
            fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'networkLink.gpkg'));
        } catch (e) {}
        const KML = path.join(__dirname, 'fixtures', '3D Image Locations.kml');
        const KML_Network_Link = new KMLToGeoPackage({append: true});
        const geometryTableName = '3D Image Locations';
        // console.log(path.join(__dirname, 'fixtures', 'tmp', 'networkLink.gpkg'))
        const kmlGeopackage = KML_Network_Link.convertKMLOrKMZToGeopackage(KML, false, path.join(__dirname, 'fixtures', 'tmp', 'networkLink.gpkg'), geometryTableName, null, a => {console.log(a.status)});
        const geopackage = await kmlGeopackage;
        should.exist(geopackage);

        // Has Correct Tables
        const tables = geopackage.getTables();
        _.findIndex(tables.features, (a) => {console.log(a === '3DMeshLocations'); return a === '3DMeshLocations'}).should.not.be.equal(-1);
        _.size(tables.attributes).should.be.equal(3);
        _.size(tables.tiles).should.be.equal(0);

        // Has Correct Meta data about features
        const features = geopackage.getTableContents('3DMeshLocations');
        features.min_y.should.be.equal(-158.12911);
        features.max_y.should.be.equal(174.8913);
        features.min_x.should.be.equal(-43.63739);
        features.max_x.should.be.equal(69.72088);
        features.srs_id.should.be.equal(4326);

        // Has correct Number of Features
        const featureDao = geopackage.getFeatureDao(features);
        featureDao.count().should.be.equal(6477);

        const multiGeomDao = geopackage.getAttributeDao('multi_geometry');
        multiGeomDao.count().should.be.equal(182);  
        geopackage.close()
        fs.unlinkSync(path.join(__dirname, '..', '3DMeshLocations.kml'));
        // done();
    });
    it ('should handle Large GroundOverlays', async function() {
        this.enableTimeouts(false);
        try {
            fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'Air Traffic.gpkg'));
        } catch (e) {}
        const KML = path.join(__dirname, 'fixtures', 'Air Traffic.kml');
        const KML_GroundOverlay = new KMLToGeoPackage({append: true});
        const geometryTableName = 'Air Traffic';
        // console.log(path.join(__dirname, 'fixtures', 'tmp', 'networkLink.gpkg'))
        const kmlGeopackage = KML_GroundOverlay.convertKMLOrKMZToGeopackage(KML, false, path.join(__dirname, 'fixtures', 'tmp', 'Air Traffic.gpkg'), geometryTableName, null, (obj) => {should.exist(obj)});
        const geopackage = await kmlGeopackage;
        should.exist(geopackage);

        const tileDao = geopackage.getTileDao('Air Traffic');
        tileDao.count().should.be.equal(272);
        // console.log(tileDao.boundingBox, geoSpatialUtilities.getWebMercatorBoundingBox('ESPG:4326', bboxWorld))
        // assert.isTrue(_.isEqual(tileDao.boundingBox, geoSpatialUtilities.getWebMercatorBoundingBox('ESPG:4326', bboxWorld)));
        // _.findIndex(tables.features, (a) => {console.log(a === '3DMeshLocations'); return a === '3DMeshLocations'}).should.not.be.equal(-1);
        // _.size(tables.attributes).should.be.equal(3);
        // _.size(tables.tiles).should.be.equal(0);
    });
    it ('should call progress call backs when defined', async function () {
        this.enableTimeouts(false);
        try {
            fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'All_the_Water_in_the_World.gpkg'));
        } catch (e) {}
        const waterKml = path.join(__dirname, 'fixtures', 'All\ the\ Water\ in\ the\ World.kmz');
        const waterKmlConverter = new KMLToGeoPackage({append: true});
        const options = {
            kmlOrKmzPath: waterKml,
            isKMZ: waterKml.lastIndexOf('kmz') > waterKml.lastIndexOf('.'),
            mainTableName: path.basename(waterKml, path.extname(waterKml)),
            geoPackage: path.join(__dirname, 'fixtures', 'tmp', 'All_the_Water_in_the_World.gpkg'),
          }
        let gp = await waterKmlConverter.convert(options, (obj) => {
            should.exist(obj);
        });
        should.exist(gp);
    });
    describe('KML Utilities Should work', function () {
        beforeEach( function() {
            try {
                fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'temp.gpkg'));
            } catch (e) {}
            let gpkgPath = path.join(__dirname, 'fixtures', 'tmp', 'temp.gpkg');
            emptyGeopackage = new GeoPackage.GeoPackageAPI.create(gpkgPath);
        });
        it('should handle abgr to rgb a color conversions', function() {
            const {rgb: color1, a: opacity1} = kmlUtilities.abgrStringToColorOpacity('FFFFFFFF')
            color1.should.be.equal('FFFFFF');
            opacity1.should.be.equal(1);

            const {rgb: color2, a: opacity2} = kmlUtilities.abgrStringToColorOpacity('00FFFFFF')
            color2.should.be.equal('FFFFFF');
            opacity2.should.be.equal(0);

            const {rgb: color3, a: opacity3} = kmlUtilities.abgrStringToColorOpacity('99AABBCC')
            color3.should.be.equal('CCBBAA');
            opacity3.should.be.equal(0x99/255);

            const {rgb: color4, a: opacity4} = kmlUtilities.abgrStringToColorOpacity('9eAAbbcC')
            color4.should.be.equal('cCbbAA');
            opacity4.should.be.equal(0x9e/255);

            const {rgb: color5, a: opacity5} = kmlUtilities.abgrStringToColorOpacity('1aA12bcC')
            color5.should.be.equal('cC2bA1');
            opacity5.should.be.equal(0x1a/255);

            try {
                kmlUtilities.abgrStringToColorOpacity('9eA12bcCff') 
                should.fail()
            } catch(e) {
                if(e instanceof AssertionError){
                    should.fail()
                }
                should.exist(e, 'More than 8 char')
            }
            try {
                kmlUtilities.abgrStringToColorOpacity('9eA12b') 
            } catch(e) {
                if(e instanceof AssertionError){
                    should.fail()
                }
                should.exist(e, 'Less Than 8 char')
            }
            try {
                kmlUtilities.abgrStringToColorOpacity('00FFGFFF')
                should.fail()
                
            } catch(e) {
                if(e instanceof AssertionError){
                    should.fail()
                }
                should.exist(e, 'non-hex char')
            }

        });
        it('should handle creating bounding boxes out of a parsed LatLonBox', function () {
            const bboxNode1 = {
                name: 'Large-scale overlay on terrain',
                visibility: '0',
                description: 'Overlay shows Mount Etna erupting on July 13th, 2001.',
                LookAt: {
                  longitude: '15.02468937557116',
                  latitude: '37.67395167941667',
                  altitude: '0',
                  heading: '-16.5581842842829',
                  tilt: '58.31228652890705',
                  range: '30350.36838438907'
                },
                Icon: {
                  href: 'http://developers.google.com/kml/documentation/images/etna.jpg'
                },
                LatLonBox: {
                  north: '37.91904192681665',
                  south: '37.46543388598137',
                  east: '15.35832653742206',
                  west: '14.60128369746704',
                  rotation: '-0.1556640799496235'
                }
            }
            const bbox1 = kmlUtilities.getLatLonBBox(bboxNode1);
            const bbox1eq = new GeoPackage.BoundingBox(14.60128369746704, 15.35832653742206, 37.46543388598137, 37.91904192681665);
            assert.isTrue(bbox1eq.equals(bbox1));

            const bboxNode2 = {
                name: 'Air Traffic',
                Icon: {
                  href: 'https://storage.googleapis.com/mrpiercey/Air%20Traffic%20Earth.jpg',
                  viewBoundScale: '0.75'
                },
                LatLonBox: { north: '90', south: '-90', east: '180', west: '-180' }
            }
            const bbox2 = kmlUtilities.getLatLonBBox(bboxNode2);
            const bbox2eq = new GeoPackage.BoundingBox(-180,180,-90,90);
            assert.isTrue(bbox2eq.equals(bbox2));
        });
        it ('should convert a parsed KML point into a geoJSON point', function () {
            const point1 = [
                {
                    coordinates: {
                    '$text': '-122.0856545755255,37.42243077405461,0',
                    '$name': 'coordinates'
                    }
                }
            ]
            const point1GeoJSON = kmlUtilities.kmlPointToGeoJson(point1);
            const point1eq = {
                type: 'Point',
                coordinates: [ -122.0856545755255, 37.42243077405461, 0 ]
            }
            assert.isTrue(_.isEqual(point1GeoJSON, point1eq));

            const point2TooLong = [
                {
                    coordinates: {
                    '$text': '-122.0856545755255,37.42243077405461,0 0,9',
                    '$name': 'coordinates'
                    }
                }
            ]
            try {
                kmlUtilities.kmlPointToGeoJson(point2TooLong);
            } catch(e) {
                if(e instanceof AssertionError){
                    should.fail()
                }
                should.exist(e,)
            }
            const point3TooShort = [
                {
                    coordinates: {
                    '$text': '90',
                    '$name': 'coordinates'
                    }
                }
            ]
            try {
                kmlUtilities.kmlPointToGeoJson(point3TooShort);
            } catch(e) {
                if(e instanceof AssertionError){
                    should.fail()
                }
                should.exist(e)
            }
        });
        it ('should convert KML parsed lineString to geoJSON Linestring', function () {
            const lineString1 =  [ {
                extrude: '1',
                tessellate: '1',
                altitudeMode: 'relativeToGround',
                coordinates: {
                  '$text': ' -112.2656634181359,36.09445214722695,630\n' +
                    '             -112.2652238941097,36.09520916122063,630\n' +
                    '             -112.2645079986395,36.09580763864907,630\n' +
                    '             -112.2638827428817,36.09628572284063,630\n' +
                    '             -112.2635746835406,36.09679275951239,630\n' +
                    '             -112.2635711822407,36.09740038871899,630\n' +
                    '             -112.2640296531825,36.09804913435539,630\n' +
                    '             -112.264327720538,36.09880337400301,630\n' +
                    '             -112.2642436562271,36.09963644790288,630\n' +
                    '             -112.2639148687042,36.10055381117246,630\n' +
                    '             -112.2626894973474,36.10149062823369,630 ',
                  '$name': 'coordinates'
                }
              }
            ]
            const lineString1GeoJSON = kmlUtilities.kmlLineStringToGeoJson(lineString1);
            const lineString1eq = {
                type: 'LineString',
                coordinates: [
                  [ -112.2656634181359, 36.09445214722695, 630 ],
                  [ -112.2652238941097, 36.09520916122063, 630 ],
                  [ -112.2645079986395, 36.09580763864907, 630 ],
                  [ -112.2638827428817, 36.09628572284063, 630 ],
                  [ -112.2635746835406, 36.09679275951239, 630 ],
                  [ -112.2635711822407, 36.09740038871899, 630 ],
                  [ -112.2640296531825, 36.09804913435539, 630 ],
                  [ -112.264327720538, 36.09880337400301, 630 ],
                  [ -112.2642436562271, 36.09963644790288, 630 ],
                  [ -112.2639148687042, 36.10055381117246, 630 ],
                  [ -112.2626894973474, 36.10149062823369, 630 ]
                ]
              }
            assert.isTrue(_.isEqual(lineString1GeoJSON, lineString1eq));

            const lineString2 =  [ {
                extrude: '1',
                tessellate: '1',
                altitudeMode: 'relativeToGround',
                coordinates: {
                  '$text': ' -112.2656634181359,36.09445214722695,630,2\n' +
                    '             -112.2652238941097,36.09520916122063,630\n' +
                    '             -112.2645079986395,36.09580763864907,630\n' +
                    '             -112.2638827428817,36.09628572284063,630\n' +
                    '             -112.2635746835406,36.09679275951239,630\n' +
                    '             -112.2635711822407,36.09740038871899,630\n' +
                    '             -112.2640296531825,36.09804913435539,630\n' +
                    '             -112.264327720538,36.09880337400301,630\n' +
                    '             -112.2642436562271,36.09963644790288,630\n' +
                    '             -112.2639148687042,36.10055381117246,630\n' +
                    '             -112.2626894973474,36.10149062823369,630 ',
                  '$name': 'coordinates'
                }
              }
            ]
           
            try {
                kmlUtilities.kmlLineStringToGeoJson(lineString2);
            } catch(e) {
                if(e instanceof AssertionError){
                    should.fail()
                }
                should.exist(e)
            }
        });
        it ('should convert KML parsed polygon to geoJSON Polygon', function () {
            const polygon = [{"extrude":"1","altitudeMode":"relativeToGround","outerBoundaryIs":{"LinearRing":[{"coordinates":{"$children":[" -122.0848938459612,37.42257124044786,17","\n","                  -122.0849580979198,37.42211922626856,17","\n","                  -122.0847469573047,37.42207183952619,17","\n","                  -122.0845725380962,37.42209006729676,17","\n","                  -122.0845954886723,37.42215932700895,17","\n","                  -122.0838521118269,37.42227278564371,17","\n","                  -122.083792243335,37.42203539112084,17","\n","                  -122.0835076656616,37.42209006957106,17","\n","                  -122.0834709464152,37.42200987395161,17","\n","                  -122.0831221085748,37.4221046494946,17","\n","                  -122.0829247374572,37.42226503990386,17","\n","                  -122.0829339169385,37.42231242843094,17","\n","                  -122.0833837359737,37.42225046087618,17","\n","                  -122.0833607854248,37.42234159228745,17","\n","                  -122.0834204551642,37.42237075460644,17","\n","                  -122.083659133885,37.42251292011001,17","\n","                  -122.0839758438952,37.42265873093781,17","\n","                  -122.0842374743331,37.42265143972521,17","\n","                  -122.0845036949503,37.4226514386435,17","\n","                  -122.0848020460801,37.42261133916315,17","\n","                  -122.0847882750515,37.42256395055121,17","\n","                  -122.0848938459612,37.42257124044786,17 "],"$text":" -122.0848938459612,37.42257124044786,17\n                   -122.0849580979198,37.42211922626856,17\n                   -122.0847469573047,37.42207183952619,17\n                   -122.0845725380962,37.42209006729676,17\n                   -122.0845954886723,37.42215932700895,17\n                   -122.0838521118269,37.42227278564371,17\n                   -122.083792243335,37.42203539112084,17\n                   -122.0835076656616,37.42209006957106,17\n                   -122.0834709464152,37.42200987395161,17\n                   -122.0831221085748,37.4221046494946,17\n                   -122.0829247374572,37.42226503990386,17\n                   -122.0829339169385,37.42231242843094,17\n                   -122.0833837359737,37.42225046087618,17\n                   -122.0833607854248,37.42234159228745,17\n                   -122.0834204551642,37.42237075460644,17\n                   -122.083659133885,37.42251292011001,17\n                   -122.0839758438952,37.42265873093781,17\n                   -122.0842374743331,37.42265143972521,17\n                   -122.0845036949503,37.4226514386435,17\n                   -122.0848020460801,37.42261133916315,17\n                   -122.0847882750515,37.42256395055121,17\n                   -122.0848938459612,37.42257124044786,17 ","$name":"coordinates"}}]}}]
            const geoJSONPolygon = kmlUtilities.kmlPolygonToGeoJson(polygon);
            const geoJSONPolygonEq = {"type":"Polygon","coordinates":[[[-122.0848938459612,37.42257124044786,17],[-122.0849580979198,37.42211922626856,17],[-122.0847469573047,37.42207183952619,17],[-122.0845725380962,37.42209006729676,17],[-122.0845954886723,37.42215932700895,17],[-122.0838521118269,37.42227278564371,17],[-122.083792243335,37.42203539112084,17],[-122.0835076656616,37.42209006957106,17],[-122.0834709464152,37.42200987395161,17],[-122.0831221085748,37.4221046494946,17],[-122.0829247374572,37.42226503990386,17],[-122.0829339169385,37.42231242843094,17],[-122.0833837359737,37.42225046087618,17],[-122.0833607854248,37.42234159228745,17],[-122.0834204551642,37.42237075460644,17],[-122.083659133885,37.42251292011001,17],[-122.0839758438952,37.42265873093781,17],[-122.0842374743331,37.42265143972521,17],[-122.0845036949503,37.4226514386435,17],[-122.0848020460801,37.42261133916315,17],[-122.0847882750515,37.42256395055121,17],[-122.0848938459612,37.42257124044786,17]]]};
            // console.log(JSON.stringify(geoJSONPolygon))
            assert.isTrue(_.isEqual(geoJSONPolygon, geoJSONPolygonEq));
        });
        it ('should setUp Geometry Nodes', function() {
            const multiGeometryNode = {"name":"MultiGeometry","MultiGeometry":{"Polygon":[{"altitudeMode":"absolute","outerBoundaryIs":{"LinearRing":[{"coordinates":{"$children":["\n        37.53604909910388,55.75168185832652,285.185979283664\n        37.53453032649647,55.75184990251844,285.185979283664\n        37.53450920435704,55.75185219338564,285.6859782706089\n        37.53604744350758,55.75168199544795,285.6859782706089\n        37.53604909910388,55.75168185832652,285.185979283664\n        "],"$text":"\n        37.53604909910388,55.75168185832652,285.185979283664\n        37.53453032649647,55.75184990251844,285.185979283664\n        37.53450920435704,55.75185219338564,285.6859782706089\n        37.53604744350758,55.75168199544795,285.6859782706089\n        37.53604909910388,55.75168185832652,285.185979283664\n        ","$name":"coordinates"}}]}},{"altitudeMode":"absolute","outerBoundaryIs":{"LinearRing":[{"coordinates":{"$children":["\n        37.53604909910388,55.75168185832652,285.185979283664\n        37.53604744350758,55.75168199544795,285.6859782706089\n        37.53604727784002,55.75168200338794,285.6859782706089\n        37.53604893342639,55.75168186619818,285.185979283664\n        37.53604909910388,55.75168185832652,285.185979283664\n        "],"$text":"\n        37.53604909910388,55.75168185832652,285.185979283664\n        37.53604744350758,55.75168199544795,285.6859782706089\n        37.53604727784002,55.75168200338794,285.6859782706089\n        37.53604893342639,55.75168186619818,285.185979283664\n        37.53604909910388,55.75168185832652,285.185979283664\n        ","$name":"coordinates"}}]}}],"LineString":[{"altitudeMode":"absolute","tessellate":"1","coordinates":{"$children":[" -112.0814237830345,36.10677870477137,0\n            -112.0870267752693,36.0905099328766,0 "],"$text":" -112.0814237830345,36.10677870477137,0\n            -112.0870267752693,36.0905099328766,0 ","$name":"coordinates"}}]}};
            const geomNode = kmlUtilities.setUpGeometryNodes(multiGeometryNode);
            geomNode.length.should.be.equal(3);
            assert(typeof geomNode === 'object')
            const geometryNode = {"name":"Relative Extruded","visibility":"0","LookAt":{"longitude":"-112.3351587892382","latitude":"36.14979247129029","altitude":"0","heading":"-55.42811560891606","tilt":"56.10280503739589","range":"401.0997279712519"},"styleUrl":"#transYellowPoly","Polygon":[{"extrude":"1","tessellate":"1","altitudeMode":"relativeToGround","outerBoundaryIs":{"LinearRing":[{"coordinates":{"$children":[" -112.3348783983763,36.1514008468736,100\n                  -112.3372535345629,36.14888517553886,100\n                  -112.3356068927954,36.14781612679284,100\n                  -112.3350034807972,36.14846469024177,100\n                  -112.3358353861232,36.1489624162954,100\n                  -112.3345888301373,36.15026229372507,100\n                  -112.3337937856278,36.14978096026463,100\n                  -112.3331798208424,36.1504472788618,100\n                  -112.3348783983763,36.1514008468736,100 "],"$text":" -112.3348783983763,36.1514008468736,100\n                  -112.3372535345629,36.14888517553886,100\n                  -112.3356068927954,36.14781612679284,100\n                  -112.3350034807972,36.14846469024177,100\n                  -112.3358353861232,36.1489624162954,100\n                  -112.3345888301373,36.15026229372507,100\n                  -112.3337937856278,36.14978096026463,100\n                  -112.3331798208424,36.1504472788618,100\n                  -112.3348783983763,36.1514008468736,100 ","$name":"coordinates"}}]}}]};
            const geomNode2 = kmlUtilities.setUpGeometryNodes(geometryNode);
            geomNode2.length.should.be.equal(1);

        });
        // it ('should write Multi Geometries', function() {

        // });
        // it ('should add a specific Icon to the database', function() {

        // });
        // it ('should insert an Icon into the geopackage', function() {

        // });
    });
    describe('geoSpatial Utilities should work', function () {
        it ('should find the natural scale and zoom level of images', function() {
            const bbox1 = new GeoPackage.BoundingBox(25, 26, 34, 35);
            geoSpatialUtilities.getNaturalScale(bbox1, 2000).should.be.equal(11);
            geoSpatialUtilities.getZoomLevels(bbox1, 11).size.should.be.equal(4);
            
            const bbox2 = new GeoPackage.BoundingBox(14.60128369746704, 15.35832653742206, 37.46543388598137, 37.91904192681665);
            geoSpatialUtilities.getNaturalScale(bbox2, 558).should.be.equal(10);
            const zoomLevel2 = geoSpatialUtilities.getZoomLevels(bbox1, 10)
            zoomLevel2.size.should.be.equal(3);
            zoomLevel2.has(10).should.be.equal(true);
            zoomLevel2.has(8).should.be.equal(true);
            zoomLevel2.has(6).should.be.equal(true);
            
            
            geoSpatialUtilities.getNaturalScale(bboxWorld, 4096).should.be.equal(4);
            geoSpatialUtilities.getZoomLevels(bboxWorld, 4).size.should.be.equal(2);

            // Out of bounds zoom levels
            geoSpatialUtilities.getZoomLevels(bbox1, 21).size.should.be.equal(8);
            geoSpatialUtilities.getZoomLevels(bboxWorld, -2).size.should.be.equal(1);

            // Very large image
            geoSpatialUtilities.getNaturalScale(bboxWorld, 409600).should.be.equal(10);

        });
        it ('should properly expand geopackage Bounding Boxes.', function () {
            // Basic Operations
            const bbox1 = new GeoPackage.BoundingBox(null);
            const lat = 45, lon = 45;
            const bbox1eq = new GeoPackage.BoundingBox(45,45,45,45);
            geoSpatialUtilities.expandBoundingBoxToIncludeLatLonPoint(bbox1, lat, lon);
            assert.isTrue(_.isEqual(bbox1, bbox1eq));
            const bbox2eq = new GeoPackage.BoundingBox(-45,45,45,50);
            geoSpatialUtilities.expandBoundingBoxToIncludeLatLonPoint(bbox1, 50, -45);
            assert.isTrue(_.isEqual(bbox1, bbox2eq));

            // Copy over Bounding Box
            const bbox3eq = new GeoPackage.BoundingBox(-45, 50, 45, 55);
            const bbox3 = geoSpatialUtilities.expandBoundingBoxToIncludeLatLonPoint(bbox1, 55, 50, true);
            assert.isTrue(_.isEqual(bbox3, bbox3eq));
            assert.isTrue(!_.isEqual(bbox1, bbox3eq));
            const bbox4eq = new GeoPackage.BoundingBox(-50, 45, -55, 50);
            const bbox4 = geoSpatialUtilities.expandBoundingBoxToIncludeLatLonPoint(bbox1, -55, -50, true);
            assert.isTrue(_.isEqual(bbox4, bbox4eq));
            assert.isTrue(!_.isEqual(bbox1, bbox4eq));

            // Null and Single lat or long testing
            const bboxTest = new GeoPackage.BoundingBox(null, 0, -5, 5);
            geoSpatialUtilities.expandBoundingBoxToIncludeLatLonPoint(bboxTest, -55);
            const bboxTestEq =  new GeoPackage.BoundingBox(null, 0, -55, 5);
            assert.isTrue(_.isEqual(bboxTest, bboxTestEq));
            geoSpatialUtilities.expandBoundingBoxToIncludeLatLonPoint(bboxTest, null, 90);
            const bboxTestEq2 =  new GeoPackage.BoundingBox(0, 90, -55, 5);
            assert.isTrue(_.isEqual(bboxTest, bboxTestEq2));
        }); 
        it ('should convert tiles to Longitude and Latitude', function() {
            let tileX = 0;
            let tileY = 0;
            let long = geoSpatialUtilities.tile2lon(tileX, 0);
            let lat = geoSpatialUtilities.tile2lat(tileY, 0);
            long.should.be.equal(-180);
            lat.should.be.equal(WEB_MERCATOR_MAX_LAT_RANGE);
            tileX = 1;
            tileY = 1;
            long = geoSpatialUtilities.tile2lon(tileX, 1);
            lat = geoSpatialUtilities.tile2lat(tileY, 1);
            long.should.be.equal(0);
            lat.should.be.equal(0);
            tileX = 2;
            tileY = 2;
            geoSpatialUtilities.tile2lon(tileX, 3).should.be.equal(-90);
            geoSpatialUtilities.tile2lat(tileY, 3).should.be.equal(66.51326044311186);
            tileX = 245;
            tileY = 254;
            geoSpatialUtilities.tile2lon(tileX, 17).should.be.equal(-179.32708740234375);
            geoSpatialUtilities.tile2lat(tileY, 17).should.be.equal(84.9905798636361);

        });
        it ('should iterateAllTilesInExtentForZoomLevels correctly', function() {
            geoSpatialUtilities.iterateAllTilesInExtentForZoomLevels(bboxWorld, [0], (zxy) => {
                zxy.z.should.be.equal(0);
            });
            let timesCalled = 0;
            geoSpatialUtilities.iterateAllTilesInExtentForZoomLevels(bboxWorld, [0, 1], (zxy) => {
                timesCalled ++;
            }).then(()=>{
                timesCalled.should.be.equal(1 + 4);
            });
            let timesCalled2 = 0
            geoSpatialUtilities.iterateAllTilesInExtentForZoomLevels(bboxWorld, [0, 2, 4], (zxy) => {
                timesCalled2 ++;
            }).then(()=>{
                timesCalled2.should.be.equal(1 + 16 + 256);
            });
        });
        it ('should handle Polygon with Inner Boundary', function () {
            
        }) 

    });
    describe('image Utilities Should work', function(){
        it ('should truncate Images', function(){
            const image = Jimp.read(path.join(__dirname, 'fixtures', 'Air Traffic Earth.jpg'));
            image.then((image) => {
                const originalHeight = image.getHeight(); 
                ImageUtilities.truncateImage(bboxWorld, image);
                const newHeight = image.getHeight();
                // console.log(originalHeight, newHeight)
                // console.log(bboxWorld);
                assert.isTrue(originalHeight > newHeight);
            });    
        });
    });
});

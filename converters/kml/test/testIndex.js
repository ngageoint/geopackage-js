const GeoPackage = require('@ngageoint/geopackage');
const KMLToGeoPackage = require('../index').KMLToGeoPackage;
const path = require('path');
const fs = require('fs');
const should = require('chai').should();

describe('KML and KMZ to Geopackage Tests', function() {
    it('should convert KML Samples Edited to a GeoPackage', function() {
        try {
            fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'kmlSamplesEdited.gpkg'));
        } catch (e) {}
        const KML_Samples_Edited_Path = path.join(__dirname, 'fixtures', 'KML_Samples_Edited.kml');
        const KML_Samples_Edited_Converter = new KMLToGeoPackage({append: true});
        const geometryTableName = 'kmlSamples';
        const kmlGeopackage = KML_Samples_Edited_Converter.convertKMLOrKMZToGeopackage(KML_Samples_Edited_Path, path.join(__dirname, 'fixtures', 'tmp', 'kmlSamplesEdited.gpkg'), geometryTableName);
        return kmlGeopackage.then((geopackage) => {
            // Feature Table exists
            should.exist(geopackage);
            const tableData = geopackage.getFeatureTables();
            tableData.length.should.be.equal(1);
            tableData[0].should.be.equal(geometryTableName);
            const featureDao = geopackage.getFeatureDao(geometryTableName);
            featureDao.getCount().should.be.equal(23)

            // Tile Table Exists
            const tileMatrixTable = geopackage.getTileTables()
            should.exist(tileMatrixTable);
            tileMatrixTable.length.should.be.equal(1);

            // Attribute table Exists.
            const attributeTables = geopackage.getAttributesTables();
            should.exist(attributeTables);
            attributeTables.length.should.be.equal(3);
        })
    });
    it('should reject file with incorrect file extensions', function () {
        const wrongNamesTest = new KMLToGeoPackage({append: true});
        const wrongNames = ['noExtension', 'noPeriod_kml', 'invalidExtension.idk', 'invalidCharacterExtension,kml', 'invalidSpacing.km l', 'invalidCharacter.kÂL', 'kml.invalidOrder', 'doubleExtension.kml.km1', 'ra.n,d!om!.!kml'];
        wrongNames.forEach(wrongName => {
            wrongNamesTest.convertKMLOrKMZToGeopackage(wrongName).then(()=>{should.fail()}).catch((e)=>{should.exist(e)})
        });
    });
    it('should handle a file with a network Link', async function() {
        this.enableTimeouts(false);
        try {
            fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'networkLink.gpkg'));
        } catch (e) {}
        const KML = path.join(__dirname, 'fixtures', '3D Image Locations.kml');
        const KML_Network_Link = new KMLToGeoPackage({append: true});
        const geometryTableName = '3D Image Locations';
        console.log(path.join(__dirname, 'fixtures', 'tmp', 'networkLink.gpkg'))
        const kmlGeopackage = KML_Network_Link.convertKMLOrKMZToGeopackage(KML, path.join(__dirname, 'fixtures', 'tmp', 'networkLink.gpkg'), geometryTableName);
        const geopackage = await kmlGeopackage;
        should.exist(geopackage);
       
    });
    it('should handle Large GroundOverlays', async function() {
        try {
            fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'WorldOverLay.gpkg'));
        } catch (e) {}
        const KML = path.join(__dirname, 'fixtures', 'Air Traffic.kml');
        const KML_GroundOverlay = new KMLToGeoPackage({append: true});
        const geometryTableName = 'Air Traffic';
        console.log(path.join(__dirname, 'fixtures', 'tmp', 'networkLink.gpkg'))
        const kmlGeopackage = KML_GroundOverlay.convertKMLOrKMZToGeopackage(KML, path.join(__dirname, 'fixtures', 'tmp', 'Air Traffic.gpkg'), geometryTableName);
        const geopackage = await kmlGeopackage;
        should.exist(geopackage);
    })
    describe('Image Utilities Should work', function () {

    })
    describe('KML Utilities Should work', function () {
        
    })
    describe('geoSpatial Utilities should work', function () {

    })
});


// const test = new KMLToGeoPackage({append: true});
// testTile.stuff();

// let tempGeo = new GeoPackage.GeoPackage();
// let kmlPath = path.join(__dirname, './fixtures/Air\ Traffic.kml');
// test.convertKMLToGeoPackage(kmlPath, './temp.gpkg', 'sample')
// let kmlPath = path.join(__dirname, './fixtures/All the Water in the World.kmz');
// let kmlPath = path.join(__dirname, './fixtures/3D\ Image\ Locations.kml');
// let kmlPath = path.join(__dirname, './fixtures/link.kml');
// let kmlPath = path.join(__dirname, './fixtures/13 Colonies Template.kml');
// let kmlPath = path.join(__dirname, './fixtures/Catch Des Moines.kmz');
// let kmlPath = path.join(__dirname, '../cdataTest.kml');
// let kmlPath = path.join(__dirname, './fixtures/World-War-II.kmz');
// let kmlPath = path.join(__dirname, './fixtures/Overlay.kmz');
// let kmlPath = path.join(__dirname, './fixtures/Mario World.kml');
// let kmlPath = path.join(__dirname, './fixtures/Volcanoes_of_the_World.kmz');
// test.convertKMLOrKMZToGeopackage(kmlPath, './temp.gpkg', 'sample', );
// (status) => {console.log(status)})
// let kmlPath = path.join(__dirname, './fixtures/link.kml');
// test.convertKMLToGeoPackage(kmlPath, './tlink.gpkg', 'link')
// let kmlPath = path.join(__dirname, './fixtures/KML_Samples.kml');
// test.convertKMLToGeoPackage(kmlPath, './temp2.gpkg', 'sample2')
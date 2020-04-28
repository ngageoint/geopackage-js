var MBTilesToGeoPackage = require('../index').MBTilesToGeoPackage;

var path = require('path')
  , fs = require('fs')
  // , JSZip = require('jszip')
  , should = require('chai').should();

describe('MBTiles to GeoPackage tests', function() {

  after(function(done) {
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'tiles.mbtiles'));
    } catch (e) {}
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'two_layers.zip'));
    } catch (e) {}
    // try {
    //   fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'osm.gpkg'));
    // } catch (e) {}
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'osm2.gpkg'));
    } catch (e) {}
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'pbf.gpkg'));
    } catch (e) {}
    done();
  });

  it('should extract the osm geopackage TILESosmds layer', function(done) {
    this.timeout(0);
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'tiles.mbtiles'));
    } catch (e) {}
    try {
      fs.mkdirSync(path.join(__dirname, 'fixtures', 'tmp'));
    } catch (e) {}
    MBTilesToGeoPackage.extract(path.join(__dirname, 'fixtures', 'osm.gpkg'), undefined, function(err, stream) {
      should.not.exist(err);
      should.exist(stream);
      fs.writeFile(path.join(__dirname, 'fixtures', 'tmp', 'tiles.mbtiles'), stream, function(err) {
        console.log('err', err);
        done();
      });
    });
  });

  it('should extract the two_layers geopackage layers', function(done) {
    this.timeout(0);
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'two_layers.zip'));
    } catch (e) {}
    try {
      fs.mkdirSync(path.join(__dirname, 'fixtures', 'tmp'));
    } catch (e) {}
    MBTilesToGeoPackage.extract(path.join(__dirname, 'fixtures', 'two_layers.gpkg'), undefined, function(err, stream) {
      should.not.exist(err);
      should.exist(stream);

      var zipFile = new JSZip();
      zipFile.loadAsync(stream).then(function(zip) {
        var files = zip.file(/mbtiles$/);
        files.length.should.be.equal(2);
        done();
      });
    });
  });

  it.only('should convert the mbtiles file into a geopackage', function(done) {
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'osm.gpkg'));
    } catch (e) {}
    try {
      fs.mkdirSync(path.join(__dirname, 'fixtures', 'tmp'));
    } catch (e) {}
    const converter = new MBTilesToGeoPackage();

    converter.convert({
      mbtiles: path.join(__dirname, 'fixtures', 'osm.mbtiles'),
      geoPackage: path.join(__dirname, 'fixtures', 'tmp', 'osm.gpkg')
    }, function(status, callback) {
      callback();
    }, function(err, geopackage) {
      should.not.exist(err);
      should.exist(geopackage);
      geopackage.getTileTables(function(err, tables) {
        tables.length.should.be.equal(1);
        tables[0].should.be.equal('osm');
        geopackage.getTileDao('osm', function(err, tileDao){
          tileDao.getCount(function(err, count) {
            count.should.be.equal(85);
            done();
          });
        });
      });
    });
  });

  it('should convert the mbtiles data into a geopackage', function(done) {
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'osm.gpkg'));
    } catch (e) {}
    try {
      fs.mkdirSync(path.join(__dirname, 'fixtures', 'tmp'));
    } catch (e) {}

    var mbtilesData = fs.readFileSync(path.join(__dirname, 'fixtures', 'osm.mbtiles'));

    MBTilesToGeoPackage.convert({
      mbtilesData: mbtilesData,
      geopackage: path.join(__dirname, 'fixtures', 'tmp', 'osm.gpkg')
    }, function(status, callback) {
      callback();
    }, function(err, geopackage) {
      should.not.exist(err);
      should.exist(geopackage);
      geopackage.getTileTables(function(err, tables) {
        tables.length.should.be.equal(1);
        tables[0].should.be.equal('tiles');
        geopackage.getTileDao('tiles', function(err, tileDao){
          tileDao.getCount(function(err, count) {
            count.should.be.equal(85);
            done();
          });
        });
      });
    });
  });


  it('should convert the mbtiles file and add the layer twice', function(done) {

    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'osm2.gpkg'));
    } catch (e) {}
    try {
      fs.mkdirSync(path.join(__dirname, 'fixtures', 'tmp'));
    } catch (e) {}
    MBTilesToGeoPackage.convert({
      mbtiles: path.join(__dirname, 'fixtures', 'osm.mbtiles'),
      geopackage: path.join(__dirname, 'fixtures', 'tmp', 'osm2.gpkg')
    }, function(status, callback) {
      callback();
    }, function(err, geopackage) {
      should.not.exist(err);
      should.exist(geopackage);
      geopackage.getTileTables(function(err, tables) {
        tables.length.should.be.equal(1);
        tables[0].should.be.equal('osm');
        geopackage.getTileDao('osm', function(err, tileDao){
          tileDao.getCount(function(err, count) {
            count.should.be.equal(85);
            MBTilesToGeoPackage.addLayer({
              mbtiles: path.join(__dirname, 'fixtures', 'osm.mbtiles'),
              geopackage: path.join(__dirname, 'fixtures', 'tmp', 'osm2.gpkg')
            }, function(status, callback) {
              callback();
            }, function(err, geopackage) {
              should.not.exist(err);
              should.exist(geopackage);
              geopackage.getTileTables(function(err, tables) {
                tables.length.should.be.equal(2);
                tables[0].should.be.equal('osm');
                tables[1].should.be.equal('osm_1');
                geopackage.getTileDao('osm_1', function(err, tileDao){
                  tileDao.getCount(function(err, count) {
                    count.should.be.equal(85);
                    done();
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  it('should convert the mbtiles file and add the layer twice using the geopackage object the second time', function(done) {

    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'osm2.gpkg'));
    } catch (e) {}
    try {
      fs.mkdirSync(path.join(__dirname, 'fixtures', 'tmp'));
    } catch (e) {}
    MBTilesToGeoPackage.convert({
      mbtiles: path.join(__dirname, 'fixtures', 'osm.mbtiles'),
      geopackage: path.join(__dirname, 'fixtures', 'tmp', 'osm2.gpkg')
    }, function(status, callback) {
      callback();
    }, function(err, geopackage) {
      should.not.exist(err);
      should.exist(geopackage);
      geopackage.getTileTables(function(err, tables) {
        tables.length.should.be.equal(1);
        tables[0].should.be.equal('osm');
        geopackage.getTileDao('osm', function(err, tileDao){
          tileDao.getCount(function(err, count) {
            count.should.be.equal(85);
            MBTilesToGeoPackage.addLayer({
              mbtiles: path.join(__dirname, 'fixtures', 'osm.mbtiles'),
              geopackage: geopackage
            }, function(status, callback) {
              callback();
            }, function(err, geopackage) {
              should.not.exist(err);
              should.exist(geopackage);
              geopackage.getTileTables(function(err, tables) {
                tables.length.should.be.equal(2);
                tables[0].should.be.equal('osm');
                tables[1].should.be.equal('osm_1');
                geopackage.getTileDao('osm_1', function(err, tileDao){
                  tileDao.getCount(function(err, count) {
                    count.should.be.equal(85);
                    done();
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  it('should convert the mbtiles file containing pbf tiles into a geopackage', function(done) {
    this.timeout(0);
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'countries.gpkg'));
    } catch (e) {}
    try {
      fs.mkdirSync(path.join(__dirname, 'fixtures', 'tmp'));
    } catch (e) {}
    MBTilesToGeoPackage.convert({
      mbtiles: path.join(__dirname, 'fixtures', 'countries.mbtiles'),
      geopackage: path.join(__dirname, 'fixtures', 'tmp', 'countries.gpkg')
    }, function(status, callback) {
      //console.log('status', status);
      callback();
    }, function(err, geopackage) {
      should.not.exist(err);
      should.exist(geopackage);
      geopackage.getFeatureTables(function(err, tables) {
        tables.length.should.be.equal(1);
        tables[0].should.be.equal('pbf');
        geopackage.getFeatureDao('pbf', function(err, featureDao){
          featureDao.getCount(function(err, count) {
            count.should.be.equal(85);
            done();
          });
        });
      });
    });
  });

  it('should convert the mbtiles pbf file containing pbf tiles into a geopackage', function(done) {
    this.timeout(0);
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'pbf.gpkg'));
    } catch (e) {}
    try {
      fs.mkdirSync(path.join(__dirname, 'fixtures', 'tmp'));
    } catch (e) {}
    MBTilesToGeoPackage.convert({
      mbtiles: path.join(__dirname, 'fixtures', 'pbf.mbtiles'),
      geopackage: path.join(__dirname, 'fixtures', 'tmp', 'pbf.gpkg')
    }, function(status, callback) {
      //console.log('status', status);
      callback();
    }, function(err, geopackage) {
      should.not.exist(err);
      should.exist(geopackage);
      geopackage.getFeatureTables(function(err, tables) {
        tables.length.should.be.equal(1);
        tables[0].should.be.equal('pbf');
        geopackage.getFeatureDao('pbf', function(err, featureDao){
          featureDao.getCount(function(err, count) {
            count.should.be.equal(85);
            done();
          });
        });
      });
    });
  });
});

var XYZToGeoPackage = require('../index.js');

var path = require('path')
  , fs = require('fs')
  , should = require('chai').should();

describe('XYZ to GeoPackage tests', function() {

  it('should extract the rivers geopackage TILESosmds layer', function(done) {
    this.timeout(0);
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'xyz.zip'));
    } catch (e) {}
    try {
      fs.mkdirSync(path.join(__dirname, 'fixtures', 'tmp'));
    } catch (e) {}
    XYZToGeoPackage.extract(path.join(__dirname, 'fixtures', 'rivers.gpkg'), undefined, function(err, xyzZipStream) {
      should.not.exist(err);
      should.exist(xyzZipStream);
      fs.writeFile(path.join(__dirname, 'fixtures', 'tmp', 'xyz.zip'), xyzZipStream, function(err) {
        console.log('err', err);
        done();
      });
    });
  });

  it('should convert the zip of tiles into a geopackage', function(done) {
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'xyz.gpkg'));
    } catch (e) {}
    try {
      fs.mkdirSync(path.join(__dirname, 'fixtures', 'tmp'));
    } catch (e) {}
    XYZToGeoPackage.convert({
      xyzZip: path.join(__dirname, 'fixtures', 'xyz.zip'),
      geopackage: path.join(__dirname, 'fixtures', 'tmp', 'xyz.gpkg')
    }, function(status, callback) {
      callback();
    }, function(err, geopackage) {
      should.not.exist(err);
      should.exist(geopackage);
      geopackage.getTileTables(function(err, tables) {
        tables.length.should.be.equal(1);
        tables[0].should.be.equal('xyz');
        geopackage.getTileDaoWithTableName('xyz', function(err, tileDao){
          tileDao.getCount(function(err, count) {
            count.should.be.equal(85);
            done();
          });
        });
      });
    });
  });

  it('should convert the zip of tiles into a geopackage no progress callback', function(done) {
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'xyz.gpkg'));
    } catch (e) {}
    try {
      fs.mkdirSync(path.join(__dirname, 'fixtures', 'tmp'));
    } catch (e) {}
    XYZToGeoPackage.convert({
      xyzZip: path.join(__dirname, 'fixtures', 'xyz.zip'),
      geopackage: path.join(__dirname, 'fixtures', 'tmp', 'xyz.gpkg')
    }, function(err, geopackage) {
      should.not.exist(err);
      should.exist(geopackage);
      geopackage.getTileTables(function(err, tables) {
        tables.length.should.be.equal(1);
        tables[0].should.be.equal('xyz');
        geopackage.getTileDaoWithTableName('xyz', function(err, tileDao){
          tileDao.getCount(function(err, count) {
            count.should.be.equal(85);
            done();
          });
        });
      });
    });
  });

  it('should convert the zip buffer', function(done) {

    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'xyz.gpkg'));
    } catch (e) {}
    try {
      fs.mkdirSync(path.join(__dirname, 'fixtures', 'tmp'));
    } catch (e) {}

    var zipData = fs.readFileSync(path.join(__dirname, 'fixtures', 'xyz.zip'));

    XYZToGeoPackage.convert({
      xyzZipData: zipData,
      geopackage: path.join(__dirname, 'fixtures', 'tmp', 'xyz.gpkg')
    }, function(status, callback) {
      callback();
    }, function(err, geopackage) {
      should.not.exist(err);
      should.exist(geopackage);
      geopackage.getTileTables(function(err, tables) {
        tables.length.should.be.equal(1);
        tables[0].should.be.equal('tiles');
        geopackage.getTileDaoWithTableName('tiles', function(err, tileDao){
          tileDao.getCount(function(err, count) {
            count.should.be.equal(85);
            done();
          });
        });
      });
    });
  });

  it('should convert the zip buffer with no geopackage argument', function(done) {

    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'xyz.gpkg'));
    } catch (e) {}
    try {
      fs.mkdirSync(path.join(__dirname, 'fixtures', 'tmp'));
    } catch (e) {}

    var zipData = fs.readFileSync(path.join(__dirname, 'fixtures', 'xyz.zip'));

    XYZToGeoPackage.convert({
      xyzZipData: zipData
    }, function(status, callback) {
      callback();
    }, function(err, geopackage) {
      should.not.exist(err);
      should.exist(geopackage);
      geopackage.getTileTables(function(err, tables) {
        tables.length.should.be.equal(1);
        tables[0].should.be.equal('tiles');
        geopackage.getTileDaoWithTableName('tiles', function(err, tileDao){
          tileDao.getCount(function(err, count) {
            count.should.be.equal(85);
            done();
          });
        });
      });
    });
  });

  it('should convert the xyz zip file and add the layer twice', function(done) {

    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'xyz.gpkg'));
    } catch (e) {}
    try {
      fs.mkdirSync(path.join(__dirname, 'fixtures', 'tmp'));
    } catch (e) {}
    XYZToGeoPackage.convert({
      xyzZip: path.join(__dirname, 'fixtures', 'xyz.zip'),
      geopackage: path.join(__dirname, 'fixtures', 'tmp', 'xyz.gpkg')
    }, function(status, callback) {
      callback();
    }, function(err, geopackage) {
      should.not.exist(err);
      should.exist(geopackage);
      geopackage.getTileTables(function(err, tables) {
        tables.length.should.be.equal(1);
        tables[0].should.be.equal('xyz');
        geopackage.getTileDaoWithTableName('xyz', function(err, tileDao){
          tileDao.getCount(function(err, count) {
            count.should.be.equal(85);
            XYZToGeoPackage.addLayer({
              xyzZip: path.join(__dirname, 'fixtures', 'xyz.zip'),
              geopackage: path.join(__dirname, 'fixtures', 'tmp', 'xyz.gpkg')
            }, function(status, callback) {
              callback();
            }, function(err, geopackage) {
              should.not.exist(err);
              should.exist(geopackage);
              geopackage.getTileTables(function(err, tables) {
                tables.length.should.be.equal(2);
                tables[0].should.be.equal('xyz');
                tables[1].should.be.equal('xyz_1')
                geopackage.getTileDaoWithTableName('xyz_1', function(err, tileDao){
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

  it('should convert the xyz zip file and add the layer twice using the geopackage object the second time', function(done) {

    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'xyz.gpkg'));
    } catch (e) {}
    try {
      fs.mkdirSync(path.join(__dirname, 'fixtures', 'tmp'));
    } catch (e) {}
    XYZToGeoPackage.convert({
      xyzZip: path.join(__dirname, 'fixtures', 'xyz.zip'),
      geopackage: path.join(__dirname, 'fixtures', 'tmp', 'xyz.gpkg')
    }, function(status, callback) {
      callback();
    }, function(err, geopackage) {
      should.not.exist(err);
      should.exist(geopackage);
      geopackage.getTileTables(function(err, tables) {
        tables.length.should.be.equal(1);
        tables[0].should.be.equal('xyz');
        geopackage.getTileDaoWithTableName('xyz', function(err, tileDao){
          tileDao.getCount(function(err, count) {
            count.should.be.equal(85);
            XYZToGeoPackage.addLayer({
              xyzZip: path.join(__dirname, 'fixtures', 'xyz.zip'),
              geopackage: geopackage
            }, function(status, callback) {
              callback();
            }, function(err, geopackage) {
              should.not.exist(err);
              should.exist(geopackage);
              geopackage.getTileTables(function(err, tables) {
                tables.length.should.be.equal(2);
                tables[0].should.be.equal('xyz');
                tables[1].should.be.equal('xyz_1')
                geopackage.getTileDaoWithTableName('xyz_1', function(err, tileDao){
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
});

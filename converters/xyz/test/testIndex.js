var XYZToGeoPackage = require('../index.ts').XYZtoGeoPackage;

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
    new XYZToGeoPackage().extract(path.join(__dirname, 'fixtures', 'rivers.gpkg'), undefined).then((xyzZipStream) => {
      should.exist(xyzZipStream);
      fs.writeFile(path.join(__dirname, 'fixtures', 'tmp', 'xyz.zip'), xyzZipStream, function(err) {
        if (err != null) {
          console.log('err', err);
        }
        done();
      });
    })
  });

  it('should convert the zip of tiles into a geopackage', function(done) {
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'xyz.gpkg'));
    } catch (e) {}
    try {
      fs.mkdirSync(path.join(__dirname, 'fixtures', 'tmp'));
    } catch (e) {}
    new XYZToGeoPackage().convert({
      xyzZip: path.join(__dirname, 'fixtures', 'xyz.zip'),
      geoPackage: path.join(__dirname, 'fixtures', 'tmp', 'xyz.gpkg')
    }).then(geopackage => {
      should.exist(geopackage);
      const tables = geopackage.getTileTables();
      tables.length.should.be.equal(1);
      tables[0].should.be.equal('xyz');
      const tileDao = geopackage.getTileDao('xyz');
      const count = tileDao.count()
      count.should.be.equal(85);
      done()
    });
  });

  it('should convert the zip of tiles into a geopackage no progress callback', function(done) {
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'xyz.gpkg'));
    } catch (e) {}
    try {
      fs.mkdirSync(path.join(__dirname, 'fixtures', 'tmp'));
    } catch (e) {}
    new XYZToGeoPackage().convert({
      xyzZip: path.join(__dirname, 'fixtures', 'xyz.zip'),
      geoPackage: path.join(__dirname, 'fixtures', 'tmp', 'xyz.gpkg')
    }).then(geopackage => {
      should.exist(geopackage);
      const tables = geopackage.getTileTables();
      tables.length.should.be.equal(1);
      tables[0].should.be.equal('xyz');
      const tileDao = geopackage.getTileDao('xyz');
      const count = tileDao.count()
      count.should.be.equal(85);
      done()
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

    new XYZToGeoPackage().convert({
      xyzZipData: zipData,
      geoPackage: path.join(__dirname, 'fixtures', 'tmp', 'xyz.gpkg')
    }).then(geopackage => {
      should.exist(geopackage);
      const tables = geopackage.getTileTables();
      tables.length.should.be.equal(1);
      tables[0].should.be.equal('tiles');
      const tileDao = geopackage.getTileDao('tiles');
      const count = tileDao.count()
      count.should.be.equal(85);
      done()
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

    new XYZToGeoPackage().convert({
      xyzZipData: zipData
    }).then(geopackage => {
      should.exist(geopackage);
      const tables = geopackage.getTileTables();
      tables.length.should.be.equal(1);
      tables[0].should.be.equal('tiles');
      const tileDao = geopackage.getTileDao('tiles');
      const count = tileDao.count()
      count.should.be.equal(85);
      done()
    });
  });

  it('should convert the xyz zip file and add the layer twice', function(done) {
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'xyz.gpkg'));
    } catch (e) {}
    try {
      fs.mkdirSync(path.join(__dirname, 'fixtures', 'tmp'));
    } catch (e) {}
    new XYZToGeoPackage().convert({
      xyzZip: path.join(__dirname, 'fixtures', 'xyz.zip'),
      geoPackage: path.join(__dirname, 'fixtures', 'tmp', 'xyz.gpkg')
    }).then(geopackage => {
      should.exist(geopackage);
      let tables = geopackage.getTileTables();
      tables.length.should.be.equal(1);
      tables[0].should.be.equal('xyz');
      let tileDao = geopackage.getTileDao('xyz');
      let count = tileDao.count()
      count.should.be.equal(85);
      new XYZToGeoPackage().addLayer({
        xyzZip: path.join(__dirname, 'fixtures', 'xyz.zip'),
        geoPackage: path.join(__dirname, 'fixtures', 'tmp', 'xyz.gpkg')
      }).then(geopackage => {
        should.exist(geopackage);
        tables = geopackage.getTileTables()
        tables.length.should.be.equal(2);
        tables[0].should.be.equal('xyz');
        tables[1].should.be.equal('xyz_1')
        tileDao = geopackage.getTileDao('xyz_1');
        count = tileDao.count();
        count.should.be.equal(85);
        done();
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
    new XYZToGeoPackage().convert({
      xyzZip: path.join(__dirname, 'fixtures', 'xyz.zip'),
      geoPackage: path.join(__dirname, 'fixtures', 'tmp', 'xyz.gpkg')
    }).then(geopackage => {
      should.exist(geopackage);
      let tables = geopackage.getTileTables();
      tables.length.should.be.equal(1);
      tables[0].should.be.equal('xyz');
      let tileDao = geopackage.getTileDao('xyz');
      let count = tileDao.count();
      count.should.be.equal(85);
      new XYZToGeoPackage().addLayer({
        xyzZip: path.join(__dirname, 'fixtures', 'xyz.zip'),
        geoPackage: geopackage
      }).then(geopackage => {
        should.exist(geopackage);
        tables = geopackage.getTileTables()
        tables.length.should.be.equal(2);
        tables[0].should.be.equal('xyz');
        tables[1].should.be.equal('xyz_1')
        tileDao = geopackage.getTileDao('xyz_1');
        count = tileDao.count();
        count.should.be.equal(85);
        done();
      });
    });
  });
});

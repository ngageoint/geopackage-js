var ShapefileToGeoPackage = require('../index.js');

var path = require('path')
  , fs = require('fs')
  , should = require('chai').should();

describe('Shapefile to GeoPackage tests', function() {

  it('should convert the natural earth 110m file', function(done) {
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg'));
    } catch (e) {}

    ShapefileToGeoPackage.convert({
      shapefile: path.join(__dirname, 'fixtures', 'ne_110m_land', 'ne_110m_land.shp'),
      geopackage: path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg')
    }, function(status, callback) {
      callback();
    }, function(err, geopackage) {
      should.not.exist(err);
      should.exist(geopackage);
      geopackage.getFeatureTables(function(err, tables) {
        tables.length.should.be.equal(1);
        tables[0].should.be.equal('ne_110m_land');
        geopackage.getFeatureDaoWithTableName('ne_110m_land', function(err, featureDao) {
          featureDao.getCount(function(err, count) {
            count.should.be.equal(127);
            done();
          });
        });
      });
    });
  });

  it('should convert the natural earth 110m file no progress callback', function(done) {
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg'));
    } catch (e) {}

    ShapefileToGeoPackage.convert({
      shapefile: path.join(__dirname, 'fixtures', 'ne_110m_land', 'ne_110m_land.shp'),
      geopackage: path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg')
    }, function(err, geopackage) {
      should.not.exist(err);
      should.exist(geopackage);
      geopackage.getFeatureTables(function(err, tables) {
        tables.length.should.be.equal(1);
        tables[0].should.be.equal('ne_110m_land');
        geopackage.getFeatureDaoWithTableName('ne_110m_land', function(err, featureDao) {
          featureDao.getCount(function(err, count) {
            count.should.be.equal(127);
            done();
          });
        });
      });
    });
  });

  it('should convert the natural earth 110m zip', function(done) {
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg'));
    } catch (e) {}

    ShapefileToGeoPackage.convert({
      shapefile: path.join(__dirname, 'fixtures', 'ne_110m_land.zip'),
      geopackage: path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg')
    }, function(status, callback) {
      callback();
    }, function(err, geopackage) {
      should.not.exist(err);
      should.exist(geopackage);
      geopackage.getFeatureTables(function(err, tables) {
        tables.length.should.be.equal(1);
        tables[0].should.be.equal('ne_110m_land');
        geopackage.getFeatureDaoWithTableName('ne_110m_land', function(err, featureDao) {
          featureDao.getCount(function(err, count) {
            count.should.be.equal(127);
            done();
          });
        });
      });
    });
  });

  it('should convert the natural earth 110m zip buffer', function(done) {
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg'));
    } catch (e) {}

    var zipData = fs.readFileSync(path.join(__dirname, 'fixtures', 'ne_110m_land.zip'));

    ShapefileToGeoPackage.convert({
      shapezipData: zipData,
      geopackage: path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg')
    }, function(status, callback) {
      callback();
    }, function(err, geopackage) {
      should.not.exist(err);
      should.exist(geopackage);
      geopackage.getFeatureTables(function(err, tables) {
        tables.length.should.be.equal(1);
        tables[0].should.be.equal('features');
        geopackage.getFeatureDaoWithTableName('features', function(err, featureDao) {
          featureDao.getCount(function(err, count) {
            count.should.be.equal(127);
            done();
          });
        });
      });
    });
  });

  it('should convert the natural earth 110m zip buffer with no geopackage argument', function(done) {
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg'));
    } catch (e) {}

    var zipData = fs.readFileSync(path.join(__dirname, 'fixtures', 'ne_110m_land.zip'));

    ShapefileToGeoPackage.convert({
      shapezipData: zipData
    }, function(status, callback) {
      callback();
    }, function(err, geopackage) {
      should.not.exist(err);
      should.exist(geopackage);
      geopackage.getFeatureTables(function(err, tables) {
        tables.length.should.be.equal(1);
        tables[0].should.be.equal('features');
        geopackage.getFeatureDaoWithTableName('features', function(err, featureDao) {
          featureDao.getCount(function(err, count) {
            count.should.be.equal(127);
            done();
          });
        });
      });
    });
  });

  it('should convert the shapefile buffer', function(done) {

    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg'));
    } catch (e) {}

    var shpStream = fs.createReadStream(path.join(__dirname, 'fixtures', 'ne_110m_land', 'ne_110m_land.shp'));
    var dbfStream = fs.createReadStream(path.join(__dirname, 'fixtures', 'ne_110m_land', 'ne_110m_land.dbf'));
    ShapefileToGeoPackage.convert({
      shapeData: shpStream,
      dbfData: dbfStream,
      geopackage: path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg')
    }, function(status, callback) {
      callback();
    }, function(err, geopackage) {
      should.not.exist(err);
      should.exist(geopackage);
      geopackage.getFeatureTables(function(err, tables) {
        tables.length.should.be.equal(1);
        tables[0].should.be.equal('features');
        geopackage.getFeatureDaoWithTableName('features', function(err, featureDao) {
          featureDao.getCount(function(err, count) {
            count.should.be.equal(127);
            done();
          });
        });
      });
    });
  });

  it('should convert the natural earth 110m file and add the layer twice', function(done) {
    fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg'));

    ShapefileToGeoPackage.convert({
      shapefile: path.join(__dirname, 'fixtures', 'ne_110m_land', 'ne_110m_land.shp'),
      geopackage: path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg')
    }, function(status, callback) {
      callback();
    }, function(err, geopackage) {
      should.not.exist(err);
      should.exist(geopackage);
      geopackage.getFeatureTables(function(err, tables) {
        tables.length.should.be.equal(1);
        tables[0].should.be.equal('ne_110m_land');
        geopackage.getFeatureDaoWithTableName('ne_110m_land', function(err, featureDao) {
          featureDao.getCount(function(err, count) {
            count.should.be.equal(127);
            ShapefileToGeoPackage.addLayer({
              shapefile: path.join(__dirname, 'fixtures', 'ne_110m_land', 'ne_110m_land.shp'),
              geopackage: path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg')
            }, function(status, callback) {
              callback();
            }, function(err, geopackage) {
              should.not.exist(err);
              should.exist(geopackage);
              geopackage.getFeatureTables(function(err, tables) {
                tables.length.should.be.equal(2);
                tables[0].should.be.equal('ne_110m_land');
                tables[1].should.be.equal('ne_110m_land_1');
                geopackage.getFeatureDaoWithTableName('ne_110m_land_1', function(err, featureDao) {
                  featureDao.getCount(function(err, count) {
                    count.should.be.equal(127);
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

  it('should convert the natural earth 110m file and add the layer twice using the geopackage object the second time', function(done) {
    fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg'));
    ShapefileToGeoPackage.convert({
      shapefile: path.join(__dirname, 'fixtures', 'ne_110m_land', 'ne_110m_land.shp'),
      geopackage: path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg')
    }, function(status, callback) {
      callback();
    }, function(err, geopackage) {
      should.not.exist(err);
      should.exist(geopackage);
      geopackage.getFeatureTables(function(err, tables) {
        tables.length.should.be.equal(1);
        tables[0].should.be.equal('ne_110m_land');
        geopackage.getFeatureDaoWithTableName('ne_110m_land', function(err, featureDao) {
          featureDao.getCount(function(err, count) {
            count.should.be.equal(127);
            ShapefileToGeoPackage.addLayer({
              shapefile: path.join(__dirname, 'fixtures', 'ne_110m_land', 'ne_110m_land.shp'),
              geopackage: geopackage
            }, function(status, callback) {
              callback();
            }, function(err, geopackage) {
              should.not.exist(err);
              should.exist(geopackage);
              geopackage.getFeatureTables(function(err, tables) {
                tables.length.should.be.equal(2);
                tables[0].should.be.equal('ne_110m_land');
                tables[1].should.be.equal('ne_110m_land_1');
                geopackage.getFeatureDaoWithTableName('ne_110m_land_1', function(err, featureDao) {
                  featureDao.getCount(function(err, count) {
                    count.should.be.equal(127);
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

  it('should convert the natural earth 110m file and add read it out as geojson', function(done) {
    fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg'));
    ShapefileToGeoPackage.convert({
      shapefile: path.join(__dirname, 'fixtures', 'ne_110m_land', 'ne_110m_land.shp'),
      geopackage: path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg')
    }, function(status, callback) {
      callback();
    }, function(err, geopackage) {
      should.not.exist(err);
      should.exist(geopackage);
      geopackage.getFeatureTables(function(err, tables) {
        tables.length.should.be.equal(1);
        tables[0].should.be.equal('ne_110m_land');
        geopackage.getFeatureDaoWithTableName('ne_110m_land', function(err, featureDao) {
          featureDao.getCount(function(err, count) {
            count.should.be.equal(127);

            ShapefileToGeoPackage.extract(geopackage, 'ne_110m_land', function(err, zip) {
              // var zipFile = path.join(__dirname, 'fixtures', 'tmp', 'test.zip');
              // try { fs.unlinkSync(zipFile); } catch (e) {}
              // fs.writeFile(zipFile, zip, function(err) {
                done();
              // });
            });
          });
        });
      });
    });
  });
});

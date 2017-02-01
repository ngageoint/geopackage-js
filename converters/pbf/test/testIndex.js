var PBFToGeoPackage = require('../index.js');

var path = require('path')
  , fs = require('fs')
  , should = require('chai').should();

describe('PBF to GeoPackage tests', function() {

  it('should convert the countries_0 pbf tile', function(done) {
    this.timeout(0);
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'countries_0.gpkg'));
    } catch (e) {}

    PBFToGeoPackage.convert({
      pbf: path.join(__dirname, 'fixtures', 'countries_0.pbf'),
      geopackage: path.join(__dirname, 'fixtures', 'tmp', 'countries_0.gpkg'),
      tileCenter: [0,0],
      zoom: 0
    }, function(status, callback) {
      console.log('status', status);
      callback();
    }, function(err, geopackage) {
      should.not.exist(err);
      should.exist(geopackage);
      geopackage.getFeatureTables(function(err, tables) {
        tables.length.should.be.equal(2);
        tables[0].should.be.equal('admin');
        tables[1].should.be.equal('water');
        geopackage.getFeatureDaoWithTableName('admin', function(err, featureDao) {
          featureDao.getCount(function(err, count) {
            count.should.be.equal(1364);
            geopackage.getFeatureDaoWithTableName('water', function(err, featureDao) {
              featureDao.getCount(function(err, count) {
                count.should.be.equal(18);
                done();
              });
            });
          });
        });
      });
    });
  });

  it('should convert the countries_1_0_1 pbf tile', function(done) {
    this.timeout(0);
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'countries_1_0_1.gpkg'));
    } catch (e) {}

    PBFToGeoPackage.convert({
      pbf: path.join(__dirname, 'fixtures', 'countries_1_0_1.pbf'),
      geopackage: path.join(__dirname, 'fixtures', 'tmp', 'countries_1_0_1.gpkg'),
      x: 0,
      y: 1,
      tileCenter: [-66.6,-90],
      zoom: 1
    }, function(status, callback) {
      console.log('status', status);
      callback();
    }, function(err, geopackage) {
      should.not.exist(err);
      should.exist(geopackage);
      geopackage.getFeatureTables(function(err, tables) {
        tables.length.should.be.equal(2);
        tables[0].should.be.equal('admin');
        tables[1].should.be.equal('water');
        geopackage.getFeatureDaoWithTableName('admin', function(err, featureDao) {
          featureDao.getCount(function(err, count) {
            count.should.be.equal(1364);
            geopackage.getFeatureDaoWithTableName('water', function(err, featureDao) {
              featureDao.getCount(function(err, count) {
                count.should.be.equal(18);
                done();
              });
            });
          });
        });
      });
    });
  });

  it('should convert the countries_6_10_38 pbf tile', function(done) {
    this.timeout(0);
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'countries_6_10_38.gpkg'));
    } catch (e) {}

    PBFToGeoPackage.convert({
      pbf: path.join(__dirname, 'fixtures', 'countries_6_10_38.pbf'),
      geopackage: path.join(__dirname, 'fixtures', 'tmp', 'countries_6_10_38.gpkg'),
      x: 10,
      y: 25,
      zoom: 6
    }, function(status, callback) {
      console.log('status', status);
      callback();
    }, function(err, geopackage) {
      should.not.exist(err);
      should.exist(geopackage);
      geopackage.getFeatureTables(function(err, tables) {
        tables.length.should.be.equal(2);
        tables[0].should.be.equal('admin');
        tables[1].should.be.equal('water');
        geopackage.getFeatureDaoWithTableName('admin', function(err, featureDao) {
          featureDao.getCount(function(err, count) {
            count.should.be.equal(1364);
            geopackage.getFeatureDaoWithTableName('water', function(err, featureDao) {
              featureDao.getCount(function(err, count) {
                count.should.be.equal(18);
                done();
              });
            });
          });
        });
      });
    });
  });

  it.only('should convert the countries_6_20_7 pbf tile', function(done) {
    this.timeout(0);
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'countries_6_20_7.gpkg'));
    } catch (e) {}

    PBFToGeoPackage.convert({
      pbf: path.join(__dirname, 'fixtures', 'countries_6_20_7.pbf'),
      geopackage: path.join(__dirname, 'fixtures', 'tmp', 'countries_6_20_7.gpkg'),
      x: 20,
      y: 7,
      zoom: 6
    }, function(status, callback) {
      console.log('status', status);
      callback();
    }, function(err, geopackage) {
      should.not.exist(err);
      should.exist(geopackage);
      geopackage.getFeatureTables(function(err, tables) {
        tables.length.should.be.equal(2);
        tables[0].should.be.equal('admin');
        tables[1].should.be.equal('water');
        geopackage.getFeatureDaoWithTableName('admin', function(err, featureDao) {
          featureDao.getCount(function(err, count) {
            count.should.be.equal(1364);
            geopackage.getFeatureDaoWithTableName('water', function(err, featureDao) {
              featureDao.getCount(function(err, count) {
                count.should.be.equal(18);
                done();
              });
            });
          });
        });
      });
    });
  });

  it('should convert the test pbf tile', function(done) {
    this.timeout(0);
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'example.gpkg'));
    } catch (e) {}

    PBFToGeoPackage.convert({
      pbf: path.join(__dirname, 'fixtures', 'example.pbf'),
      geopackage: path.join(__dirname, 'fixtures', 'tmp', 'example.gpkg'),
      tileCenter: [0,0],
      zoom: 0
    }, function(status, callback) {
      console.log('status', status);
      callback();
    }, function(err, geopackage) {
      should.not.exist(err);
      should.exist(geopackage);
      geopackage.getFeatureTables(function(err, tables) {
        tables.length.should.be.equal(2);
        tables[0].should.be.equal('admin');
        tables[1].should.be.equal('water');
        geopackage.getFeatureDaoWithTableName('admin', function(err, featureDao) {
          featureDao.getCount(function(err, count) {
            count.should.be.equal(1364);
            geopackage.getFeatureDaoWithTableName('water', function(err, featureDao) {
              featureDao.getCount(function(err, count) {
                count.should.be.equal(18);
                done();
              });
            });
          });
        });
      });
    });
  });

  it('should convert the test pbf tile into a table called test', function(done) {
    this.timeout(0);
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'example.gpkg'));
    } catch (e) {}

    PBFToGeoPackage.convert({
      pbf: path.join(__dirname, 'fixtures', 'example.pbf'),
      geopackage: path.join(__dirname, 'fixtures', 'tmp', 'example.gpkg'),
      tableName: 'test'
    }, function(status, callback) {
      console.log('status', status);
      callback();
    }, function(err, geopackage) {
      should.not.exist(err);
      should.exist(geopackage);
      geopackage.getFeatureTables(function(err, tables) {
        tables.length.should.be.equal(1);
        tables[0].should.be.equal('test');
        geopackage.getFeatureDaoWithTableName('test', function(err, featureDao) {
          featureDao.getCount(function(err, count) {
            count.should.be.equal(6);
            done();
          });
        });
      });
    });
  });

  it('should convert the test pbf tile into a table called test then add it again to the same table', function(done) {
    this.timeout(0);
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'example.gpkg'));
    } catch (e) {}

    PBFToGeoPackage.convert({
      pbf: path.join(__dirname, 'fixtures', 'example.pbf'),
      geopackage: path.join(__dirname, 'fixtures', 'tmp', 'example.gpkg'),
      tableName: 'test'
    }, function(status, callback) {
      console.log('status', status);
      callback();
    }, function(err, geopackage) {
      should.not.exist(err);
      should.exist(geopackage);
      geopackage.getFeatureTables(function(err, tables) {
        tables.length.should.be.equal(1);
        tables[0].should.be.equal('test');
        geopackage.getFeatureDaoWithTableName('test', function(err, featureDao) {
          featureDao.getCount(function(err, count) {
            count.should.be.equal(9864);
            PBFToGeoPackage.convert({
              pbf: path.join(__dirname, 'fixtures', 'example.pbf'),
              geopackage: path.join(__dirname, 'fixtures', 'tmp', 'example.gpkg'),
              append: true,
              tableName: 'test'
            }, function(status, callback) {
              console.log('status', status);
              callback();
            }, function(err, geopackage) {
              should.not.exist(err);
              should.exist(geopackage);
              geopackage.getFeatureTables(function(err, tables) {
                tables.length.should.be.equal(1);
                tables[0].should.be.equal('test');
                geopackage.getFeatureDaoWithTableName('test', function(err, featureDao) {
                  featureDao.getCount(function(err, count) {
                    count.should.be.equal(19728);
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

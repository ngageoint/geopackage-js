var CSVToGeoPackage = require('../index').CSVToGeoPackage;

var path = require('path')
  , fs = require('fs')
  , should = require('chai').should();

describe('CSV to GeoPackage tests', function() {

  it('should convert the natural earth 110m file', function() {
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', '110m-admin-0-countries.gpkg'));
    } catch (e) {}

    const converter = new CSVToGeoPackage();

    return converter.convert({
      csv:path.join(__dirname, 'fixtures', '110m-admin-0-countries.csv'),
      geoPackage:path.join(__dirname, 'fixtures', 'tmp', '110m-admin-0-countries.gpkg'),
      delimiter: ';'
    }, function(status) {
      return Promise.resolve();
    })
    .then(function(geopackage) {
      should.exist(geopackage);
      var tables = geopackage.getFeatureTables();
      tables.length.should.be.equal(1);
      tables[0].should.be.equal('110m-admin-0-countries');
      var featureDao = geopackage.getFeatureDao('110m-admin-0-countries');
      var count = featureDao.getCount();
      count.should.be.equal(286);
    });
  });

  it('should convert the natural earth 110m file with no progress block', function() {
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', '110m-admin-0-countries.gpkg'));
    } catch (e) {}

    const converter = new CSVToGeoPackage();

    return converter.convert({
      csv:path.join(__dirname, 'fixtures', '110m-admin-0-countries.csv'),
      geoPackage:path.join(__dirname, 'fixtures', 'tmp', '110m-admin-0-countries.gpkg'),
      delimiter: ';'
    })
    .then(function(geopackage) {
      should.exist(geopackage);
      var tables = geopackage.getFeatureTables();
      tables.length.should.be.equal(1);
      tables[0].should.be.equal('110m-admin-0-countries');
      var featureDao = geopackage.getFeatureDao('110m-admin-0-countries');
      var count = featureDao.getCount();
      count.should.be.equal(286);
    });
  });

  it('should convert the variations file', function() {
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'variations.gpkg'));
    } catch (e) {}

    const converter = new CSVToGeoPackage();

    return converter.convert({
      csv:path.join(__dirname, 'fixtures', 'variations.csv'),
      geoPackage:path.join(__dirname, 'fixtures', 'tmp', 'variations.gpkg'),
      delimiter: ';',
      newline: '\n'
    }, function(status) {
      return Promise.resolve();
    })
    .then(function(geopackage) {
      should.exist(geopackage);
      var tables = geopackage.getFeatureTables();
      tables.length.should.be.equal(1);
      tables[0].should.be.equal('variations');
      var featureDao = geopackage.getFeatureDao('variations');
      var count = featureDao.getCount();
      count.should.be.equal(6);
      let all = featureDao.queryForAll();
      for (var i = 0; i < all.length; i++) {
        should.exist(all[i].geometry);
      }
    });
  });

  it('should convert the variations file with lowercase wkt', function() {
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'variations2.gpkg'));
    } catch (e) {}

    const converter = new CSVToGeoPackage();

    return converter.convert({
      csv:path.join(__dirname, 'fixtures', 'variations2.csv'),
      geoPackage:path.join(__dirname, 'fixtures', 'tmp', 'variations2.gpkg'),
      // delimiter: ';',
      newline: '\n'
    }, function(status) {
      return Promise.resolve();
    })
    .then(function(geopackage) {
      should.exist(geopackage);
      var tables = geopackage.getFeatureTables();
      tables.length.should.be.equal(1);
      tables[0].should.be.equal('variations2');
      var featureDao = geopackage.getFeatureDao('variations2');
      var count = featureDao.getCount();
      count.should.be.equal(2);
      let all = featureDao.queryForAll();
      for (var i = 0; i < all.length; i++) {
        should.exist(all[i].geometry);
      }
    });
  });

  it('should work even if no csv was passed in', function() {
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'variations2.gpkg'));
    } catch (e) {}

    const converter = new CSVToGeoPackage();

    return converter.convert({
      geoPackage:path.join(__dirname, 'fixtures', 'tmp', 'variations2.gpkg'),
      // delimiter: ';',
      newline: '\n'
    })
    .then(function(geopackage) {
      should.exist(geopackage);
      var tables = geopackage.getFeatureTables();
      tables.length.should.be.equal(1);
      tables[0].should.be.equal('features');
      var featureDao = geopackage.getFeatureDao('features');
      var count = featureDao.getCount();
      count.should.be.equal(0);
    });
  });

  it('should convert the geojson', function(done) {
    fs.readFile(path.join(__dirname, 'fixtures', '110m-admin-0-countries.csv'), 'utf8', function(err, data) {
      const converter = new CSVToGeoPackage();

      converter.convert({
        csvData:data,
        delimiter: ';'
      })
      .then(function(geopackage) {
        var tables = geopackage.getFeatureTables();
        tables.length.should.be.equal(1);
        tables[0].should.be.equal('features');
        var featureDao = geopackage.getFeatureDao('features');
        var count = featureDao.getCount();
        count.should.be.equal(286);
      })
      .then(function() {
        done();
      });
    });
  });

  it('should convert the natural earth 110m file and add the layer twice', function() {
    fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', '110m-admin-0-countries.gpkg'));
    const converter = new CSVToGeoPackage();

    return converter.convert({
      csv:path.join(__dirname, 'fixtures', '110m-admin-0-countries.csv'),
      geoPackage:path.join(__dirname, 'fixtures', 'tmp', '110m-admin-0-countries.gpkg'),
      delimiter: ';'
    }, function(status) {
      return Promise.resolve();
    })
    .then(function(geopackage) {
      should.exist(geopackage);
      var tables = geopackage.getFeatureTables();
      tables.length.should.be.equal(1);
      tables[0].should.be.equal('110m-admin-0-countries');
      var featureDao = geopackage.getFeatureDao('110m-admin-0-countries');
      var count = featureDao.getCount();
      count.should.be.equal(286);
      return geopackage;
    })
    .then(function(geopackage) {
      return converter.addLayer({
        csv:path.join(__dirname, 'fixtures', '110m-admin-0-countries.csv'),
        geoPackage:path.join(__dirname, 'fixtures', 'tmp', '110m-admin-0-countries.gpkg'),
        delimiter: ';'
      }, function(status) {
        return Promise.resolve();
      })
      .then(function() {
        return geopackage;
      });
    })
    .then(function(geopackage) {
      should.exist(geopackage);
      var tables = geopackage.getFeatureTables();
      tables.length.should.be.equal(2);
      tables[0].should.be.equal('110m-admin-0-countries');
      tables[1].should.be.equal('110m-admin-0-countries_1');
      var featureDao = geopackage.getFeatureDao('110m-admin-0-countries');
      var count = featureDao.getCount();
      count.should.be.equal(286);
    });
  });

  it('should convert the natural earth 110m file and refuse to create it again without the append flag', function() {
    try {
    fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg'));
    } catch (e){}
    fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', '110m-admin-0-countries.gpkg'));
    const converter = new CSVToGeoPackage();

    return converter.convert({
      csv:path.join(__dirname, 'fixtures', '110m-admin-0-countries.csv'),
      geoPackage:path.join(__dirname, 'fixtures', 'tmp', '110m-admin-0-countries.gpkg'),
      delimiter: ';'
    }, function(status) {
      return Promise.resolve();
    })
    .then(function(geopackage) {
      should.exist(geopackage);
      var tables = geopackage.getFeatureTables();
      tables.length.should.be.equal(1);
      tables[0].should.be.equal('110m-admin-0-countries');
      var featureDao = geopackage.getFeatureDao('110m-admin-0-countries');
      var count = featureDao.getCount();
      count.should.be.equal(286);
      return geopackage;
    })
    .then(function(geopackage) {
      return converter.convert({
        csv:path.join(__dirname, 'fixtures', '110m-admin-0-countries.csv'),
        geoPackage:path.join(__dirname, 'fixtures', 'tmp', '110m-admin-0-countries.gpkg'),
        delimiter: ';'
      }, function(status) {
        return Promise.resolve();
      })
      .then(function() {
        should.fail('Should have thrown an error');
      })
      .catch(function(error) {
        should.exist(error);
      })
    });
  });

  it('should convert the natural earth 110m file and add the layer twice using the geopackage object the second time', function() {
    fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', '110m-admin-0-countries.gpkg'));
    const converter = new CSVToGeoPackage();

    return converter.convert({
      csv:path.join(__dirname, 'fixtures', '110m-admin-0-countries.csv'),
      geoPackage:path.join(__dirname, 'fixtures', 'tmp', '110m-admin-0-countries.gpkg'),
      delimiter: ';'
    }, function(status) {
      return Promise.resolve();
    })
    .then(function(geopackage) {
      should.exist(geopackage);
      var tables = geopackage.getFeatureTables();
      tables.length.should.be.equal(1);
      tables[0].should.be.equal('110m-admin-0-countries');
      var featureDao = geopackage.getFeatureDao('110m-admin-0-countries');
      var count = featureDao.getCount();
      count.should.be.equal(286);
      return geopackage;
    })
    .then(function(geopackage) {
      return converter.addLayer({
        csv:path.join(__dirname, 'fixtures', '110m-admin-0-countries.csv'),
        geoPackage:geopackage,
        delimiter: ';'
      }, function(status) {
        return Promise.resolve();
      });
    })
    .then(function(geopackage) {
      should.exist(geopackage);
      var tables = geopackage.getFeatureTables();
      tables.length.should.be.equal(2);
      tables[0].should.be.equal('110m-admin-0-countries');
      tables[1].should.be.equal('110m-admin-0-countries_1');
      var featureDao = geopackage.getFeatureDao('110m-admin-0-countries_1');
      var count = featureDao.getCount();
      count.should.be.equal(286);
    });
  });

  it('should convert the natural earth 110m file and add the layer twice using the geopackage object the second time with no progress block', function() {
    fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', '110m-admin-0-countries.gpkg'));
    const converter = new CSVToGeoPackage();

    return converter.convert({
      csv:path.join(__dirname, 'fixtures', '110m-admin-0-countries.csv'),
      geoPackage:path.join(__dirname, 'fixtures', 'tmp', '110m-admin-0-countries.gpkg'),
      delimiter: ';'
    }, function(status) {
      return Promise.resolve();
    })
    .then(function(geopackage) {
      should.exist(geopackage);
      var tables = geopackage.getFeatureTables();
      tables.length.should.be.equal(1);
      tables[0].should.be.equal('110m-admin-0-countries');
      var featureDao = geopackage.getFeatureDao('110m-admin-0-countries');
      var count = featureDao.getCount();
      count.should.be.equal(286);
      return geopackage;
    })
    .then(function(geopackage) {
      return converter.addLayer({
        csv:path.join(__dirname, 'fixtures', '110m-admin-0-countries.csv'),
        geoPackage:geopackage,
        delimiter: ';'
      });
    })
    .then(function(geopackage) {
      should.exist(geopackage);
      var tables = geopackage.getFeatureTables();
      tables.length.should.be.equal(2);
      tables[0].should.be.equal('110m-admin-0-countries');
      tables[1].should.be.equal('110m-admin-0-countries_1');
      var featureDao = geopackage.getFeatureDao('110m-admin-0-countries_1');
      var count = featureDao.getCount();
      count.should.be.equal(286);
    });
  });


  it('should convert the natural earth 110m file and add read it out as geojson', function() {
    fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', '110m-admin-0-countries.gpkg'));
    const converter = new CSVToGeoPackage();

    return converter.convert({
      csv:path.join(__dirname, 'fixtures', '110m-admin-0-countries.csv'),
      geoPackage:path.join(__dirname, 'fixtures', 'tmp', '110m-admin-0-countries.gpkg'),
      delimiter: ';'
    }, function(status) {
      return Promise.resolve();
    })
    .then(function(geopackage) {
      should.exist(geopackage);
      var tables = geopackage.getFeatureTables();
      tables.length.should.be.equal(1);
      tables[0].should.be.equal('110m-admin-0-countries');
      var featureDao = geopackage.getFeatureDao('110m-admin-0-countries');
      var count = featureDao.getCount();
      count.should.be.equal(286);

      converter.extract(geopackage, '110m-admin-0-countries')
      .then(function(csv) {
        csv.split(/\r\n|\r|\n/).length.should.be.equal(288);
      })
    });
  });

});

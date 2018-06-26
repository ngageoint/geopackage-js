var DataColumnsDao = require('../../../lib/dataColumns').DataColumnsDao
  , DataColumns = require('../../../lib/dataColumns').DataColumns
  , DataColumnConstraintsDao = require('../../../lib/dataColumnConstraints').DataColumnConstraintsDao
  , DataColumnConstraints = require('../../../lib/dataColumnConstraints').DataColumnConstraints
  , GeoPackageConnection = require('../../../lib/db/geoPackageConnection')
  , TableCreator = require('../../../lib/db/tableCreator')
  , path = require('path')
  , fs = require('fs')
  , should = require('chai').should();

describe('Data Columns tests', function() {

  var connection;

  var originalFilename = path.join(__dirname, '..', '..', 'fixtures', 'rivers.gpkg');
  var filename = path.join(__dirname, '..', '..', 'fixtures', 'tmp', 'rivers.gpkg');

  function copyGeopackage(orignal, copy, callback) {
    if (typeof(process) !== 'undefined' && process.version) {
      var fsExtra = require('fs-extra');
      fsExtra.copy(originalFilename, filename, callback);
    } else {
      filename = originalFilename;
      callback();
    }
  }

  beforeEach('create the GeoPackage connection', function(done) {
    copyGeopackage(originalFilename, filename, function(err) {
      GeoPackageConnection.connect(filename, function(err, geoPackageConnection) {
        connection = geoPackageConnection;
        should.exist(connection);
        done();
      });
    });
  });

  afterEach('should close the geopackage', function(done) {
    connection.close();
    if (typeof(process) !== 'undefined' && process.version) {
      fs.unlink(filename, done);
    } else {
      done();
    }
  });

  it('should get the data column for property_0', function(done) {
    var dc = new DataColumnsDao(connection);
    dc.getDataColumns('FEATURESriversds', 'property_0', function(err, dataColumn) {
      dataColumn.should.be.deep.equal({
        table_name: 'FEATURESriversds',
        column_name: 'property_0',
        name: 'Scalerank',
        title: 'Scalerank',
        description: 'Scalerank',
        mime_type: null,
        constraint_name: null
      });
      done();
    });
  });

  it('should get the contents for the data column for property_0', function(done) {
    var dc = new DataColumnsDao(connection);
    dc.getDataColumns('FEATURESriversds', 'property_0', function(err, dataColumn) {
      dc.getContents(dataColumn, function(err, contents) {
        contents.should.be.deep.equal({
          table_name: 'FEATURESriversds',
          data_type: 'features',
          identifier: 'FEATURESriversds',
          description: null,
          last_change: '2015-12-04T15:28:59.122Z',
          min_x: -20037508.342789244,
          min_y: -19971868.88040857,
          max_x: 20037508.342789244,
          max_y: 19971868.880408563,
          srs_id: 3857
        });
        done();
      });
    });
  });

  it('should get the data column for geom', function(done) {
    var dc = new DataColumnsDao(connection);
    dc.getDataColumns('FEATURESriversds', 'geom', function(err, dataColumn) {
      should.not.exist(err);
      should.not.exist(dataColumn);
      done();
    });
  });

  it('should create a data column', function(done) {
    var dao = new DataColumnsDao(connection);
    var dc = new DataColumns();
    dc.table_name = 'FEATURESriversds';
    dc.column_name = 'test';
    dc.name = 'Test Name';
    dc.title = 'Test';
    dc.description = 'Test Description';
    dc.mime_type = 'text/html';
    dc.constraint_name = 'test constraint';
    dao.create(dc, function(err, result){
      if (err) return done(err);
      dao.getDataColumns('FEATURESriversds', 'test', function(err, dataColumn) {
        dataColumn.should.be.deep.equal({
          table_name: 'FEATURESriversds',
          column_name: 'test',
          name: 'Test Name',
          title: 'Test',
          description: 'Test Description',
          mime_type: 'text/html',
          constraint_name: 'test constraint'
        });
        done();
      });
    });
  });

  it('should query by the constraint name to retrieve a data column', function(done) {
    var dao = new DataColumnsDao(connection);
    var dc = new DataColumns();
    dc.table_name = 'FEATURESriversds';
    dc.column_name = 'test';
    dc.name = 'Test Name';
    dc.title = 'Test';
    dc.description = 'Test Description';
    dc.mime_type = 'text/html';
    dc.constraint_name = 'test constraint';
    dao.create(dc, function(err, result){
      if (err) return done(err);
      dao.queryByConstraintName('test constraint', function(err, dataColumn, rowDone) {
        dataColumn.should.be.deep.equal({
          table_name: 'FEATURESriversds',
          column_name: 'test',
          name: 'Test Name',
          title: 'Test',
          description: 'Test Description',
          mime_type: 'text/html',
          constraint_name: 'test constraint'
        });
        rowDone();
      }, done);
    });
  });

  it('should create a data column constraint', function(done) {
    var tc = new TableCreator(connection);
    tc.createDataColumnConstraints(function() {
      var dao = new DataColumnConstraintsDao(connection);
      var dc = new DataColumnConstraints();
      dc.constraint_name = 'test constraint';
      dc.constraint_type = 'range';
      dc.value = 'NULL';
      dc.min = 5;
      dc.min_is_inclusive = true;
      dc.max = 6;
      dc.max_is_inclusive = true;
      dc.description = 'constraint description';

      dao.create(dc, function(err, result) {
        dao.queryByConstraintName('test constraint', function(err, dataColumnConstraint, rowDone) {
          dataColumnConstraint.should.be.deep.equal({
            constraint_name: 'test constraint',
            constraint_type: 'range',
            value: 'NULL',
            min: 5,
            min_is_inclusive: 1,
            max: 6,
            max_is_inclusive: 1,
            description: 'constraint description'
          });
          rowDone();
        }, done);
      });
    });
  });

  it('should create a data column constraint and query unique', function(done) {
    var tc = new TableCreator(connection);
    tc.createDataColumnConstraints(function() {
      var dao = new DataColumnConstraintsDao(connection);
      var dc = new DataColumnConstraints();
      dc.constraint_name = 'test constraint';
      dc.constraint_type = 'range';
      dc.value = 'NULL';
      dc.min = 5;
      dc.min_is_inclusive = true;
      dc.max = 6;
      dc.max_is_inclusive = true;
      dc.description = 'constraint description';

      dao.create(dc, function(err, result) {
        dao.queryUnique('test constraint', 'range', 'NULL', function(err, dataColumnConstraint) {
          should.not.exist(err);
          dataColumnConstraint.should.be.deep.equal({
            constraint_name: 'test constraint',
            constraint_type: 'range',
            value: 'NULL',
            min: 5,
            min_is_inclusive: 1,
            max: 6,
            max_is_inclusive: 1,
            description: 'constraint description'
          });
          done();
        });
      });
    });
  });

});

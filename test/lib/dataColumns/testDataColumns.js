import { default as testSetup } from '../../fixtures/testSetup'

var DataColumns = require('../../../lib/dataColumns/dataColumns').DataColumns
  , DataColumnConstraints = require('../../../lib/dataColumnConstraints/dataColumnConstraints').DataColumnConstraints
  , TableCreator = require('../../../lib/db/tableCreator').TableCreator
  , DataColumnsDao = require('../../../lib/dataColumns/dataColumnsDao').DataColumnsDao
  , DataColumnConstraintsDao = require('../../../lib/dataColumnConstraints/dataColumnConstraintsDao').DataColumnConstraintsDao
  , Contents = require('../../../lib/core/contents/contents').Contents
  , path = require('path')
  , should = require('chai').should();

describe('Data Columns tests', function() {

  var geoPackage;

  var originalFilename = path.join(__dirname, '..', '..', 'fixtures', 'rivers.gpkg');
  var filename;

  beforeEach('create the GeoPackage connection', async function() {
    filename = path.join(__dirname, '..', '..', 'fixtures', 'tmp', testSetup.createTempName());
    // @ts-ignore
    let result = await copyAndOpenGeopackage(originalFilename);
    filename = result.path;
    geoPackage = result.geopackage;
  });

  afterEach('should close the geopackage', async function() {
    geoPackage.close();
    await testSetup.deleteGeoPackage(filename);
  });

  it('should get the data column for property_0', function() {
    var dc = new DataColumnsDao(geoPackage);
    var dataColumn = dc.getDataColumns('FEATURESriversds', 'property_0');
    dataColumn.should.be.deep.equal({
      table_name: 'FEATURESriversds',
      column_name: 'property_0',
      name: 'Scalerank',
      title: 'Scalerank',
      description: 'Scalerank',
      mime_type: null,
      constraint_name: null
    });
  });

  it('should get the contents for the data column for property_0', function() {
    var dc = new DataColumnsDao(geoPackage);
    var dataColumn = dc.getDataColumns('FEATURESriversds', 'property_0');
    var contents = dc.getContents(dataColumn);
    let expected = new Contents();
    expected.table_name = 'FEATURESriversds';
    expected.data_type = 'features';
    expected.identifier = 'FEATURESriversds';
    expected.description = null;
    expected.last_change = '2015-12-04T15:28:59.122Z';
    expected.min_x = -20037508.342789244;
    expected.min_y = -19971868.88040857;
    expected.max_x = 20037508.342789244;
    expected.max_y = 19971868.880408563;
    expected.srs_id = 3857;
    contents.should.be.deep.equal(expected);
  });

  it('should get the data column for geom', function() {
    var dc = new DataColumnsDao(geoPackage);
    var dataColumn = dc.getDataColumns('FEATURESriversds', 'geom');
    should.not.exist(dataColumn);
  });

  it('should create a data column', function() {
    var dao = new DataColumnsDao(geoPackage);
    var dc = new DataColumns();
    dc.table_name = 'FEATURESriversds';
    dc.column_name = 'test';
    dc.name = 'Test Name';
    dc.title = 'Test';
    dc.description = 'Test Description';
    dc.mime_type = 'text/html';
    dc.constraint_name = 'test constraint';
    var result = dao.create(dc);
    should.exist(result);
    var dataColumn = dao.getDataColumns('FEATURESriversds', 'test');
    dataColumn.should.be.deep.equal({
      table_name: 'FEATURESriversds',
      column_name: 'test',
      name: 'Test Name',
      title: 'Test',
      description: 'Test Description',
      mime_type: 'text/html',
      constraint_name: 'test constraint'
    });
  });

  it('should query by the constraint name to retrieve a data column', function() {
    var dao = new DataColumnsDao(geoPackage);
    var dc = new DataColumns();
    dc.table_name = 'FEATURESriversds';
    dc.column_name = 'test';
    dc.name = 'Test Name';
    dc.title = 'Test';
    dc.description = 'Test Description';
    dc.mime_type = 'text/html';
    dc.constraint_name = 'test constraint';
    var result = dao.create(dc);
    should.exist(result);
    for (var dataColumn of dao.queryByConstraintName('test constraint')) {
      dataColumn.should.be.deep.equal({
        table_name: 'FEATURESriversds',
        column_name: 'test',
        name: 'Test Name',
        title: 'Test',
        description: 'Test Description',
        mime_type: 'text/html',
        constraint_name: 'test constraint'
      });
    }
  });

  it('should create a data column constraint', function() {
    var tc = new TableCreator(geoPackage);
    tc.createDataColumnConstraints();
    var dao = new DataColumnConstraintsDao(geoPackage);
    var dc = new DataColumnConstraints();
    dc.constraint_name = 'test constraint';
    dc.constraint_type = 'range';
    dc.value = 'NULL';
    dc.min = 5;
    dc.min_is_inclusive = true;
    dc.max = 6;
    dc.max_is_inclusive = true;
    dc.description = 'constraint description';
    var resutl = dao.create(dc);
    for (var dataColumnConstraint of dao.queryByConstraintName('test constraint')) {
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
    }
  });

  it('should create a data column constraint and query unique', function() {
    var tc = new TableCreator(geoPackage);
    tc.createDataColumnConstraints();
    var dao = new DataColumnConstraintsDao(geoPackage);
    var dc = new DataColumnConstraints();
    dc.constraint_name = 'test constraint';
    dc.constraint_type = 'range';
    dc.value = 'NULL';
    dc.min = 5;
    dc.min_is_inclusive = true;
    dc.max = 6;
    dc.max_is_inclusive = true;
    dc.description = 'constraint description';
    var result = dao.create(dc);
    var dataColumnConstraint = dao.queryUnique('test constraint', 'range', 'NULL');
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
  });
});

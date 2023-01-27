import { default as testSetup } from '../../testSetup';
import { ContentsDataType } from '../../../lib/contents/contentsDataType';
import { DataColumnConstraintType } from '../../../lib/extension/schema/constraints/dataColumnConstraintType';

var DataColumns = require('../../../lib/extension/schema/columns/dataColumns').DataColumns,
  DataColumnConstraints =
    require('../../../lib/extension/schema/constraints/dataColumnConstraints').DataColumnConstraints,
  GeoPackageTableCreator = require('../../../lib/db/geoPackageTableCreator').GeoPackageTableCreator,
  DataColumnsDao = require('../../../lib/extension/schema/columns/dataColumnsDao').DataColumnsDao,
  DataColumnConstraintsDao =
    require('../../../lib/extension/schema/constraints/dataColumnConstraintsDao').DataColumnConstraintsDao,
  path = require('path'),
  should = require('chai').should();

describe('Data Columns tests', function () {
  var geoPackage;

  var originalFilename = path.join(__dirname, '..', '..', 'fixtures', 'rivers.gpkg');
  var filename;

  beforeEach('create the GeoPackage connection', async function () {
    filename = path.join(__dirname, '..', '..', 'fixtures', 'tmp', testSetup.createTempName());
    let result = await copyAndOpenGeopackage(originalFilename);
    filename = result.path;
    geoPackage = result.geoPackage;
  });

  afterEach('should close the geoPackage', async function () {
    geoPackage.close();
    await testSetup.deleteGeoPackage(filename);
  });

  it('should get the data column for property_0', function () {
    var dc = new DataColumnsDao(geoPackage);
    var dataColumn = dc.getDataColumn('FEATURESriversds', 'property_0');
    dataColumn.getTableName().should.be.equal('FEATURESriversds');
    dataColumn.getColumnName().should.be.equal('property_0');
    dataColumn.getName().should.be.equal('Scalerank');
    dataColumn.getTitle().should.be.equal('Scalerank');
    dataColumn.getDescription().should.be.equal('Scalerank');
    should.not.exist(dataColumn.getMimeType());
    should.not.exist(dataColumn.getConstraintName());
  });

  it('should get the contents for the data column for property_0', function () {
    var dc = new DataColumnsDao(geoPackage);
    var dataColumn = dc.getDataColumn('FEATURESriversds', 'property_0');
    var contents = dc.getContents(dataColumn);
    contents.getTableName().should.be.equal('FEATURESriversds');
    contents.getDataType().should.be.equal(ContentsDataType.FEATURES);
    contents.getIdentifier().should.be.equal('FEATURESriversds');
    contents.getLastChange().toISOString().should.be.equal('2015-12-04T15:28:59.122Z');
    contents.getMinX().should.be.equal(-20037508.342789244);
    contents.getMinY().should.be.equal(-19971868.88040857);
    contents.getMaxX().should.be.equal(20037508.342789244);
    contents.getMaxY().should.be.equal(19971868.880408563);
    contents.getSrsId().should.be.equal(3857);
    should.not.exist(contents.getDescription());
  });

  it('should get the data column for geom', function () {
    var dc = new DataColumnsDao(geoPackage);
    var dataColumn = dc.getDataColumn('FEATURESriversds', 'geom');
    should.not.exist(dataColumn);
  });

  it('should create a data column', function () {
    var dao = new DataColumnsDao(geoPackage);
    var dc = new DataColumns();
    dc.setTableName('FEATURESriversds');
    dc.setColumnName('test');
    dc.setName('Test Name');
    dc.setTitle('Test');
    dc.setDescription('Test Description');
    dc.setMimeType('text/html');
    dc.setConstraintName('test constraint');
    var result = dao.create(dc);
    should.exist(result);
    var dataColumn = dao.getDataColumn('FEATURESriversds', 'test');

    dataColumn.getTableName().should.be.equal('FEATURESriversds');
    dataColumn.getColumnName().should.be.equal('test');
    dataColumn.getName().should.be.equal('Test Name');
    dataColumn.getTitle().should.be.equal('Test');
    dataColumn.getDescription().should.be.equal('Test Description');
    dataColumn.getMimeType().should.be.equal('text/html');
    dataColumn.getConstraintName().should.be.equal('test constraint');
  });

  it('should query by the constraint name to retrieve a data column', function () {
    var dao = new DataColumnsDao(geoPackage);
    var dc = new DataColumns();
    dc.setTableName('FEATURESriversds');
    dc.setColumnName('test');
    dc.setName('Test Name');
    dc.setTitle('Test');
    dc.setDescription('Test Description');
    dc.setMimeType('text/html');
    dc.setConstraintName('test constraint');
    var result = dao.create(dc);
    should.exist(result);
    for (var dataColumn of dao.queryByConstraintName('test constraint')) {
      dataColumn.getTableName().should.be.equal('FEATURESriversds');
      dataColumn.getColumnName().should.be.equal('test');
      dataColumn.getName().should.be.equal('Test Name');
      dataColumn.getTitle().should.be.equal('Test');
      dataColumn.getDescription().should.be.equal('Test Description');
      dataColumn.getMimeType().should.be.equal('text/html');
      dataColumn.getConstraintName().should.be.equal('test constraint');
    }
  });

  it('should create a data column constraint', function () {
    var tc = new GeoPackageTableCreator(geoPackage);
    tc.createDataColumnConstraints();
    var dao = new DataColumnConstraintsDao(geoPackage);
    var dc = new DataColumnConstraints();
    dc.setConstraintName('test constraint');
    dc.setConstraintType(DataColumnConstraintType.RANGE);
    dc.setMin(5);
    dc.setMinIsInclusive(true);
    dc.setMax(6);
    dc.setMaxIsInclusive(true);
    dc.setDescription('constraint description');
    dao.create(dc);
    for (var dataColumnConstraint of dao.queryByConstraintName('test constraint')) {
      dataColumnConstraint.getConstraintName().should.be.equal('test constraint');
      dataColumnConstraint.getConstraintType().should.be.equal(DataColumnConstraintType.RANGE);
      should.not.exist(dataColumnConstraint.getValue());
      dataColumnConstraint.getMin().should.be.equal(5);
      dataColumnConstraint.getMinIsInclusive().should.be.equal(1);
      dataColumnConstraint.getMax().should.be.equal(6);
      dataColumnConstraint.getMaxIsInclusive().should.be.equal(1);
      dataColumnConstraint.getDescription().should.be.equal('constraint description');
    }
  });

  it('should create a data column constraint and query unique', function () {
    try {
      var tc = new GeoPackageTableCreator(geoPackage);
      tc.createDataColumnConstraints();
      var dao = new DataColumnConstraintsDao(geoPackage);
      var dc = new DataColumnConstraints();
      dc.setConstraintName('test constraint');
      dc.setConstraintType(DataColumnConstraintType.RANGE);
      dc.setMin(5);
      dc.setMinIsInclusive(true);
      dc.setMax(6);
      dc.setMaxIsInclusive(true);
      dc.setDescription('constraint description');
      dao.create(dc);
      var dataColumnConstraint = dao.queryUnique(
        'test constraint',
        DataColumnConstraintType.nameFromType(DataColumnConstraintType.RANGE),
        null,
      );
      dataColumnConstraint.getConstraintName().should.be.equal('test constraint');
      dataColumnConstraint.getConstraintType().should.be.equal(DataColumnConstraintType.RANGE);
      should.not.exist(dataColumnConstraint.getValue());
      dataColumnConstraint.getMin().should.be.equal(5);
      dataColumnConstraint.getMinIsInclusive().should.be.equal(1);
      dataColumnConstraint.getMax().should.be.equal(6);
      dataColumnConstraint.getMaxIsInclusive().should.be.equal(1);
      dataColumnConstraint.getDescription().should.be.equal('constraint description');
    } catch (e) {
      console.error(e);
    }
  });
});

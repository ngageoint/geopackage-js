import { default as testSetup } from '../../../testSetup';
import { MetadataScopeType } from '../../../../lib/extension/metadata/metadataScopeType';
import { ReferenceScopeType } from '../../../../lib/extension/metadata/reference/referenceScopeType';

var should = require('chai').should(),
  MetadataReference = require('../../../../lib/extension/metadata/reference/metadataReference').MetadataReference,
  Metadata = require('../../../../lib/extension/metadata/metadata').Metadata,
  Verification = require('../../../verification');

describe('Metadata Reference tests', function () {
  var testGeoPackage;
  var geoPackage;

  beforeEach(async function () {
    let created = await testSetup.createTmpGeoPackage();
    testGeoPackage = created.path;
    geoPackage = created.geoPackage;
  });

  afterEach(async function () {
    try {
      geoPackage.close();
      await testSetup.deleteGeoPackage(testGeoPackage);
    } catch (e) {}
  });

  it('should create metadata and reference', function () {
    geoPackage.createMetadataTable();
    geoPackage.createMetadataReferenceTable();
    Verification.verifyMetadataReference(geoPackage).should.be.equal(true);
    Verification.verifyMetadata(geoPackage).should.be.equal(true);

    var metadataDao = geoPackage.getMetadataDao();
    var metadataReferenceDao = geoPackage.getMetadataReferenceDao();

    var metadata1 = new Metadata();
    metadata1.setId(1);
    metadata1.setMetadataScopeType(MetadataScopeType.DATASET);
    metadata1.setStandardUri('TEST_URI_1');
    metadata1.setMimeType('text/xml');
    metadata1.setMetadata('TEST METDATA 1');

    var metadata2 = new Metadata();
    metadata2.setId(2);
    metadata2.setMetadataScopeType(MetadataScopeType.FEATURE_TYPE);
    metadata2.setStandardUri('TEST_URI_2');
    metadata2.setMimeType('text/xml');
    metadata2.setMetadata('TEST METDATA 2');

    var metadata3 = new Metadata();
    metadata3.setId(3);
    metadata3.setMetadataScopeType(MetadataScopeType.TILE);
    metadata3.setStandardUri('TEST_URI_3');
    metadata3.setMimeType('text/xml');
    metadata3.setMetadata('TEST METDATA 3');

    [metadata1, metadata2, metadata3].forEach((metadata) => {
      var result = metadataDao.create(metadata);
      result.should.be.equal(metadata.getId());
    });

    var ref1 = new MetadataReference();
    ref1.setReferenceScopeType(ReferenceScopeType.GEOPACKAGE);
    ref1.setTimestamp(new Date());
    ref1.setMetadata(metadata1);

    var ref2 = new MetadataReference();
    ref2.setReferenceScopeType(ReferenceScopeType.TABLE);
    ref2.setTableName('TEST_TABLE_NAME_2');
    ref2.setTimestamp(new Date());
    ref2.setMetadata(metadata2);
    ref2.setParentMetadata(metadata1);

    [ref1, ref2].forEach((ref) => {
      metadataReferenceDao.create(ref);
    });
  });

  it('should create metadata and reference with a parent and then remove it', function () {
    geoPackage.createMetadataTable();
    geoPackage.createMetadataReferenceTable();
    Verification.verifyMetadataReference(geoPackage).should.be.equal(true);
    Verification.verifyMetadata(geoPackage).should.be.equal(true);

    var metadataDao = geoPackage.getMetadataDao();
    var metadataReferenceDao = geoPackage.getMetadataReferenceDao();

    var metadata1 = new Metadata();
    metadata1.setId(1);
    metadata1.setMetadataScopeType(MetadataScopeType.DATASET);
    metadata1.setStandardUri('TEST_URI_1');
    metadata1.setMimeType('text/xml');
    metadata1.setMetadata('TEST METDATA 1');

    var metadata2 = new Metadata();
    metadata2.setId(2);
    metadata2.setMetadataScopeType(MetadataScopeType.FEATURE_TYPE);
    metadata2.setStandardUri('TEST_URI_2');
    metadata2.setMimeType('text/xml');
    metadata2.setMetadata('TEST METDATA 2');

    [metadata1, metadata2].forEach(function (metadata) {
      var result = metadataDao.create(metadata);
      result.should.be.equal(metadata.id);
    });

    var ref = new MetadataReference();
    ref.setReferenceScopeType(ReferenceScopeType.TABLE);
    ref.setTableName('TEST_TABLE_NAME_2');
    ref.setTimestamp(new Date());
    ref.setMetadata(metadata2);
    ref.setParentMetadata(metadata1);
    metadataReferenceDao.create(ref);
    var count = 0;
    for (var row of metadataReferenceDao.queryByMetadataParent(metadata1.id)) {
      count++;
    }
    count.should.be.equal(1);
    metadataReferenceDao.removeMetadataParent(metadata1.id);
    var countAfter = 0;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (var row of metadataReferenceDao.queryByMetadataParent(metadata1.id)) {
      countAfter++;
    }
    countAfter.should.be.equal(0);
  });

  it('should query for metadatareference by metadata and parent', function () {
    geoPackage.createMetadataTable();
    geoPackage.createMetadataReferenceTable();
    Verification.verifyMetadataReference(geoPackage).should.be.equal(true);
    Verification.verifyMetadata(geoPackage).should.be.equal(true);

    var metadataDao = geoPackage.metadataDao;
    var metadataReferenceDao = geoPackage.metadataReferenceDao;

    var metadata1 = new Metadata();
    metadata1.setId(1);
    metadata1.setMetadataScopeType(MetadataScopeType.DATASET);
    metadata1.setStandardUri('TEST_URI_1');
    metadata1.setMimeType('text/xml');
    metadata1.setMetadata('TEST METDATA 1');

    var metadata2 = new Metadata();
    metadata2.setId(2);
    metadata2.setMetadataScopeType(MetadataScopeType.FEATURE_TYPE);
    metadata2.setStandardUri('TEST_URI_2');
    metadata2.setMimeType('text/xml');
    metadata2.setMetadata('TEST METDATA 2');

    var metadata3 = new Metadata();
    metadata3.setId(3);
    metadata3.setMetadataScopeType(MetadataScopeType.TILE);
    metadata3.setStandardUri('TEST_URI_3');
    metadata3.setMimeType('text/xml');
    metadata3.setMetadata('TEST METDATA 3');

    [metadata1, metadata2, metadata3].forEach(function (metadata) {
      var result = metadataDao.create(metadata);
      result.should.be.equal(metadata.getId());
    });

    var ref1 = new MetadataReference();
    ref1.setReferenceScopeType(ReferenceScopeType.GEOPACKAGE);
    ref1.setTimestamp(new Date());
    ref1.setMetadata(metadata1);
    ref1.getMdFileId().should.be.equal(metadata1.getId());
    should.not.exist(ref1.getTableName());
    should.not.exist(ref1.getColumnName());
    should.not.exist(ref1.getRowIdValue());

    var ref2 = new MetadataReference();
    ref2.setReferenceScopeType(ReferenceScopeType.TABLE);
    ref2.setTableName('TEST_TABLE_NAME_2');
    ref2.setTimestamp(new Date());
    ref2.setMetadata(metadata2);
    ref2.setParentMetadata(metadata1);

    should.not.exist(ref2.getColumnName());
    should.not.exist(ref2.getRowIdValue());
    ref2.getMdParentId().should.be.equal(metadata1.getId());

    var ref3 = new MetadataReference();
    ref3.setReferenceScopeType(ReferenceScopeType.ROW);
    ref3.setTimestamp(new Date());
    ref3.setMetadata();
    ref3.setParentMetadata();
    ref3.getMdFileId().should.be.equal(-1);
    ref3.getMdParentId().should.be.equal(-1);
    should.not.exist(ref3.getColumnName());

    var ref4 = new MetadataReference();
    ref4.setReferenceScopeType(ReferenceScopeType.COLUMN);
    ref4.setTimestamp(new Date());
    ref4.setMetadata(metadata1);

    should.not.exist(ref4.getRowIdValue());

    [ref1, ref2].forEach(function (ref) {
      metadataReferenceDao.create(ref);
    });

    for (var row of metadataReferenceDao.queryByMetadataAndParent(metadata2.getId(), metadata1.getId())) {
      const metadataReference = metadataReferenceDao.createObject(row);
      metadataReference.getTableName().should.be.equal('TEST_TABLE_NAME_2');
      metadataReference.getMdFileId().should.be.equal(metadata2.getId());
      metadataReference.getMdParentId().should.be.equal(metadata1.getId());
    }
  });

  it('should query for metadatareference by metadata', function () {
    geoPackage.createMetadataTable();
    geoPackage.createMetadataReferenceTable();
    Verification.verifyMetadataReference(geoPackage).should.be.equal(true);
    Verification.verifyMetadata(geoPackage).should.be.equal(true);

    var metadataDao = geoPackage.getMetadataDao();
    var metadataReferenceDao = geoPackage.getMetadataReferenceDao();

    var metadata1 = new Metadata();
    metadata1.setId(1);
    metadata1.setMetadataScopeType(MetadataScopeType.DATASET);
    metadata1.setStandardUri('TEST_URI_1');
    metadata1.setMimeType('text/xml');
    metadata1.setMetadata('TEST METDATA 1');

    var metadata2 = new Metadata();
    metadata2.setId(2);
    metadata2.setMetadataScopeType(MetadataScopeType.FEATURE_TYPE);
    metadata2.setStandardUri('TEST_URI_2');
    metadata2.setMimeType('text/xml');
    metadata2.setMetadata('TEST METDATA 2');

    var metadata3 = new Metadata();
    metadata3.setId(3);
    metadata3.setMetadataScopeType(MetadataScopeType.TILE);
    metadata3.setStandardUri('TEST_URI_3');
    metadata3.setMimeType('text/xml');
    metadata3.setMetadata('TEST METDATA 3');

    [metadata1, metadata2, metadata3].forEach(function (metadata) {
      var result = metadataDao.create(metadata);
      result.should.be.equal(metadata.getId());
    });

    var ref1 = new MetadataReference();
    ref1.setReferenceScopeType(ReferenceScopeType.GEOPACKAGE);
    ref1.setTimestamp(new Date());
    ref1.setMetadata(metadata2);

    var ref2 = new MetadataReference();
    ref2.setReferenceScopeType(ReferenceScopeType.TABLE);
    ref2.setTableName('TEST_TABLE_NAME_2');
    ref2.setTimestamp(new Date());
    ref2.setMetadata(metadata2);
    ref2.setParentMetadata(metadata1);

    [ref1, ref2].forEach(function (ref) {
      metadataReferenceDao.create(ref);
    });
    var count = 0;
    for (var row of metadataReferenceDao.queryByMetadata(metadata2.getId())) {
      const metadataReference = metadataReferenceDao.createObject(row);
      metadataReference.getMdFileId().should.be.equal(metadata2.getId());
      count++;
    }

    count.should.be.equal(2);
  });
});

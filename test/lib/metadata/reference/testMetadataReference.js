var fs = require('fs')
  , should = require('chai').should()
  , path = require('path')
  , async = require('async')
  , MetadataReference = require('../../../../lib/metadata/reference').MetadataReference
  , Metadata = require('../../../../lib/metadata').Metadata
  , GeoPackage = require('../../../../lib/geoPackage')
  , TableCreator = require('../../../../lib/db/tableCreator')
  , Verification = require('../../../fixtures/verification')
  , testSetup = require('../../../fixtures/testSetup');

describe('Metadata Reference tests', function() {
  var testGeoPackage = path.join(__dirname, '..', 'tmp', 'test.gpkg');
  var geopackage;

  beforeEach(function(done) {
    testSetup.deleteGeoPackage(testGeoPackage, function() {
      testSetup.createGeoPackage(testGeoPackage, function(err, gp) {
        geopackage = gp;
        done();
      });
    });
  });

  afterEach(function(done) {
    geopackage.close();
    testSetup.deleteGeoPackage(testGeoPackage, done);
  });

  it('should create metadata and reference', function(done) {

    geopackage.createMetadataTable(function(err, result) {
      geopackage.createMetadataReferenceTable(function(err, result) {
        Verification.verifyMetadataReference(geopackage, function(err, result) {
          should.not.exist(err);
          Verification.verifyMetadata(geopackage, function(err, result) {
            should.not.exist(err);

            var metadataDao = geopackage.getMetadataDao();
            var metadataReferenceDao = geopackage.getMetadataReferenceDao();

            var metadata1 = new Metadata();
            metadata1.id = 1;
            metadata1.md_scope = Metadata.DATASET;
            metadata1.md_standard_uri = "TEST_URI_1";
            metadata1.mime_type = 'text/xml';
            metadata1.metadata = 'TEST METDATA 1';

            var metadata2 = new Metadata();
            metadata2.id = 2;
            metadata2.md_scope = Metadata.FEATURE_TYPE;
            metadata2.md_standard_uri = "TEST_URI_2";
            metadata2.mime_type = 'text/xml';
            metadata2.metadata = 'TEST METDATA 2';

            var metadata3 = new Metadata();
            metadata3.id = 3;
            metadata3.md_scope = Metadata.TILE;
            metadata3.md_standard_uri = "TEST_URI_3";
            metadata3.mime_type = 'text/xml';
            metadata3.metadata = 'TEST METDATA 3';

            async.eachSeries([metadata1, metadata2, metadata3], function(metadata, done) {
              metadataDao.create(metadata, function(err, result) {
                should.not.exist(err);
                result.should.be.equal(metadata.id);
                done();
              });
            }, function(err) {
              var ref1 = new MetadataReference();
              ref1.setReferenceScopeType(MetadataReference.GEOPACKAGE);
              ref1.timestamp = new Date();
              ref1.setMetadata(metadata1);

              var ref2 = new MetadataReference();
              ref2.setReferenceScopeType(MetadataReference.TABLE);
              ref2.table_name = 'TEST_TABLE_NAME_2';
              ref2.timestamp = new Date();
              ref2.setMetadata(metadata2);
              ref2.setParentMetadata(metadata1);

              async.eachSeries([ref1, ref2], function(ref, done) {
                metadataReferenceDao.create(ref, function(err, result) {
                  should.not.exist(err);
                  done();
                });
              }, done);
            });
          });
        });
      });
    });
  });

  it('should create metadata and reference with a parent and then remove it', function(done) {

    geopackage.createMetadataTable(function(err, result) {
      geopackage.createMetadataReferenceTable(function(err, result) {
        Verification.verifyMetadataReference(geopackage, function(err, result) {
          should.not.exist(err);
          Verification.verifyMetadata(geopackage, function(err, result) {
            should.not.exist(err);

            var metadataDao = geopackage.getMetadataDao();
            var metadataReferenceDao = geopackage.getMetadataReferenceDao();

            var metadata1 = new Metadata();
            metadata1.id = 1;
            metadata1.md_scope = Metadata.DATASET;
            metadata1.md_standard_uri = "TEST_URI_1";
            metadata1.mime_type = 'text/xml';
            metadata1.metadata = 'TEST METDATA 1';

            var metadata2 = new Metadata();
            metadata2.id = 2;
            metadata2.md_scope = Metadata.FEATURE_TYPE;
            metadata2.md_standard_uri = "TEST_URI_2";
            metadata2.mime_type = 'text/xml';
            metadata2.metadata = 'TEST METDATA 2';

            async.eachSeries([metadata1, metadata2], function(metadata, done) {
              metadataDao.create(metadata, function(err, result) {
                should.not.exist(err);
                result.should.be.equal(metadata.id);
                done();
              });
            }, function(err) {
              var ref = new MetadataReference();
              ref.setReferenceScopeType(MetadataReference.TABLE);
              ref.table_name = 'TEST_TABLE_NAME_2';
              ref.timestamp = new Date();
              ref.setMetadata(metadata2);
              ref.setParentMetadata(metadata1);

              metadataReferenceDao.create(ref, function(err, result) {
                should.not.exist(err);
                var count = 0;
                metadataReferenceDao.queryByMetadataParent(metadata1.id, function(err, row, rowDone) {
                  count++;
                  rowDone();
                }, function(err) {
                  count.should.be.equal(1);
                  metadataReferenceDao.removeMetadataParent(metadata1.id, function(err, result) {
                    var count = 0;
                    metadataReferenceDao.queryByMetadataParent(metadata1.id, function(err, row, rowDone) {
                      count++;
                      rowDone();
                    }, function() {
                      count.should.be.equal(0);
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

  it('should query for metadatareference by metadata and parent', function(done) {

    geopackage.createMetadataTable(function(err, result) {
      geopackage.createMetadataReferenceTable(function(err, result) {
        Verification.verifyMetadataReference(geopackage, function(err, result) {
          should.not.exist(err);
          Verification.verifyMetadata(geopackage, function(err, result) {
            should.not.exist(err);

            var metadataDao = geopackage.getMetadataDao();
            var metadataReferenceDao = geopackage.getMetadataReferenceDao();

            var metadata1 = new Metadata();
            metadata1.id = 1;
            metadata1.md_scope = Metadata.DATASET;
            metadata1.md_standard_uri = "TEST_URI_1";
            metadata1.mime_type = 'text/xml';
            metadata1.metadata = 'TEST METDATA 1';

            var metadata2 = new Metadata();
            metadata2.id = 2;
            metadata2.md_scope = Metadata.FEATURE_TYPE;
            metadata2.md_standard_uri = "TEST_URI_2";
            metadata2.mime_type = 'text/xml';
            metadata2.metadata = 'TEST METDATA 2';

            var metadata3 = new Metadata();
            metadata3.id = 3;
            metadata3.md_scope = Metadata.TILE;
            metadata3.md_standard_uri = "TEST_URI_3";
            metadata3.mime_type = 'text/xml';
            metadata3.metadata = 'TEST METDATA 3';

            async.eachSeries([metadata1, metadata2, metadata3], function(metadata, done) {
              metadataDao.create(metadata, function(err, result) {
                should.not.exist(err);
                result.should.be.equal(metadata.id);
                done();
              });
            }, function(err) {
              var ref1 = new MetadataReference();
              ref1.setReferenceScopeType(MetadataReference.GEOPACKAGE);
              ref1.timestamp = new Date();
              ref1.setMetadata(metadata1);

              var ref2 = new MetadataReference();
              ref2.setReferenceScopeType(MetadataReference.TABLE);
              ref2.table_name = 'TEST_TABLE_NAME_2';
              ref2.timestamp = new Date();
              ref2.setMetadata(metadata2);
              ref2.setParentMetadata(metadata1);

              async.eachSeries([ref1, ref2], function(ref, done) {
                metadataReferenceDao.create(ref, function(err, result) {
                  should.not.exist(err);
                  done();
                });
              }, function() {
                metadataReferenceDao.queryByMetadataAndParent(metadata2.id, metadata1.id, function(err, row, rowDone) {
                  should.not.exist(err);
                  row.table_name.should.be.equal('TEST_TABLE_NAME_2');
                  row.md_file_id.should.be.equal(metadata2.id);
                  row.md_parent_id.should.be.equal(metadata1.id);
                  rowDone();
                }, function() {
                  done();
                });
              });
            });
          });
        });
      });
    });
  });

  it('should query for metadatareference by metadata', function(done) {

    geopackage.createMetadataTable(function(err, result) {
      geopackage.createMetadataReferenceTable(function(err, result) {
        Verification.verifyMetadataReference(geopackage, function(err, result) {
          should.not.exist(err);
          Verification.verifyMetadata(geopackage, function(err, result) {
            should.not.exist(err);

            var metadataDao = geopackage.getMetadataDao();
            var metadataReferenceDao = geopackage.getMetadataReferenceDao();

            var metadata1 = new Metadata();
            metadata1.id = 1;
            metadata1.md_scope = Metadata.DATASET;
            metadata1.md_standard_uri = "TEST_URI_1";
            metadata1.mime_type = 'text/xml';
            metadata1.metadata = 'TEST METDATA 1';

            var metadata2 = new Metadata();
            metadata2.id = 2;
            metadata2.md_scope = Metadata.FEATURE_TYPE;
            metadata2.md_standard_uri = "TEST_URI_2";
            metadata2.mime_type = 'text/xml';
            metadata2.metadata = 'TEST METDATA 2';

            var metadata3 = new Metadata();
            metadata3.id = 3;
            metadata3.md_scope = Metadata.TILE;
            metadata3.md_standard_uri = "TEST_URI_3";
            metadata3.mime_type = 'text/xml';
            metadata3.metadata = 'TEST METDATA 3';

            async.eachSeries([metadata1, metadata2, metadata3], function(metadata, done) {
              metadataDao.create(metadata, function(err, result) {
                should.not.exist(err);
                result.should.be.equal(metadata.id);
                done();
              });
            }, function(err) {
              var ref1 = new MetadataReference();
              ref1.setReferenceScopeType(MetadataReference.GEOPACKAGE);
              ref1.timestamp = new Date();
              ref1.setMetadata(metadata2);

              var ref2 = new MetadataReference();
              ref2.setReferenceScopeType(MetadataReference.TABLE);
              ref2.table_name = 'TEST_TABLE_NAME_2';
              ref2.timestamp = new Date();
              ref2.setMetadata(metadata2);
              ref2.setParentMetadata(metadata1);

              async.eachSeries([ref1, ref2], function(ref, done) {
                metadataReferenceDao.create(ref, function(err, result) {
                  should.not.exist(err);
                  done();
                });
              }, function() {
                var count = 0;
                metadataReferenceDao.queryByMetadata(metadata2.id, function(err, row, rowDone) {
                  count++;
                  should.not.exist(err);
                  row.md_file_id.should.be.equal(metadata2.id);
                  rowDone();
                }, function() {
                  count.should.be.equal(2);
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

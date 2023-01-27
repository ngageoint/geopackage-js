import { UserRow } from '../../../../lib/user/userRow';
import { GeoPackageDataType } from '../../../../lib/db/geoPackageDataType';
import { UserCustomTable } from '../../../../lib/user/custom/userCustomTable';
import { UserCustomColumn } from '../../../../lib/user/custom/userCustomColumn';

var DublinCoreMetadata = require('../../../../lib/extension/related/dublin/dublinCoreMetadata').DublinCoreMetadata,
  DublinCoreType = require('../../../../lib/extension/related/dublin/dublinCoreType').DublinCoreType,
  should = require('chai').should();

describe('Dublin Core tests', function () {
  it('from name', function () {
    DublinCoreType.fromName('format').should.be.equal(DublinCoreType.FORMAT);
    DublinCoreType.fromName('identifier').should.be.equal(DublinCoreType.IDENTIFIER);
    DublinCoreType.fromName('date').should.be.equal(DublinCoreType.DATE);
    DublinCoreType.fromName('source').should.be.equal(DublinCoreType.SOURCE);
    DublinCoreType.fromName('title').should.be.equal(DublinCoreType.TITLE);
    DublinCoreType.fromName('description').should.be.equal(DublinCoreType.DESCRIPTION);
    DublinCoreType.fromName('content_type').should.be.equal(DublinCoreType.FORMAT);
    DublinCoreType.fromName('id').should.be.equal(DublinCoreType.IDENTIFIER);
  });

  it('has column', function () {
    class MockUserTable extends UserCustomTable {
      hasColumn(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type').should.be.equal(true);
        if (name === 'identifier') {
          return true;
        }
        if (name === 'format') {
          return false;
        }
        if (name === 'content_type') {
          return false;
        }
      }
    }
    var fakeTable = new MockUserTable('table', []);
    DublinCoreMetadata.hasColumn(fakeTable, DublinCoreType.IDENTIFIER).should.be.equal(true);
    DublinCoreMetadata.hasColumn(fakeTable, DublinCoreType.FORMAT).should.be.equal(false);
  });

  it('has synonym column', function () {
    class MockUserTable extends UserCustomTable {
      hasColumn(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type' || name === 'source').should.be.equal(
          true,
        );
        if (name === 'identifier') {
          return true;
        }
        if (name === 'format') {
          return false;
        }
        if (name === 'content_type') {
          return true;
        }
        return false;
      }
    }
    var fakeTable = new MockUserTable('table', []);

    DublinCoreMetadata.hasColumn(fakeTable, DublinCoreType.IDENTIFIER).should.be.equal(true);
    DublinCoreMetadata.hasColumn(fakeTable, DublinCoreType.FORMAT).should.be.equal(true);
    DublinCoreMetadata.hasColumn(fakeTable, DublinCoreType.SOURCE).should.be.equal(false);
  });

  it('get column', function () {
    try {
      class MockUserTable extends UserCustomTable {
        getColumn(name) {
          (name === 'identifier' || name === 'format' || name === 'content_type').should.be.equal(true);
          if (name === 'identifier') {
            return UserCustomColumn.createColumn('identifier', GeoPackageDataType.INTEGER);
          }
          if (name === 'format') {
            return;
          }
          if (name === 'content_type') {
            return;
          }
        }
        hasColumn(name) {
          (name === 'identifier' || name === 'format' || name === 'content_type').should.be.equal(true);
          if (name === 'identifier') {
            return true;
          }
          if (name === 'format') {
            return false;
          }
          if (name === 'content_type') {
            return false;
          }
        }
      }
      var fakeTable = new MockUserTable('table', []);
      should.exist(DublinCoreMetadata.getColumn(fakeTable, DublinCoreType.IDENTIFIER));
      should.not.exist(DublinCoreMetadata.getColumn(fakeTable, DublinCoreType.FORMAT));
    } catch (e) {
      console.error(e);
    }
  });

  it('get synonym column', function () {
    class MockUserTable extends UserCustomTable {
      getColumn(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type' || name === 'source').should.be.equal(
          true,
        );
        if (name === 'identifier') {
          return UserCustomColumn.createColumn('identifier', GeoPackageDataType.INTEGER);
        }
        if (name === 'format') {
          return;
        }
        if (name === 'content_type') {
          return UserCustomColumn.createColumn('identifier', GeoPackageDataType.TEXT);
        }
      }
      hasColumn(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type' || name === 'source').should.be.equal(
          true,
        );
        if (name === 'identifier') {
          return true;
        }
        if (name === 'format') {
          return false;
        }
        if (name === 'content_type') {
          return true;
        }
      }
    }
    var fakeTable = new MockUserTable('table', []);
    should.exist(DublinCoreMetadata.getColumn(fakeTable, DublinCoreType.IDENTIFIER));
    should.exist(DublinCoreMetadata.getColumn(fakeTable, DublinCoreType.FORMAT));
    should.not.exist(DublinCoreMetadata.getColumn(fakeTable, DublinCoreType.SOURCE));
  });

  it('set value', function () {
    class MockUserRow extends UserRow {
      setValue(name, value) {
        (name === 'identifier' || name === 'format' || name === 'content_type').should.be.equal(true);
        if (name === 'identifier') {
          value.should.be.equal('identifier');
        } else {
          should.fail(name, 'identifier');
        }
      }
      getColumn(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type').should.be.equal(true);
        if (name === 'identifier') {
          return UserCustomColumn.createColumn('identifier', GeoPackageDataType.INTEGER);
        }
      }
      hasColumn(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type').should.be.equal(true);
        if (name === 'identifier') {
          return true;
        }
      }
    }
    class MockUserTable extends UserCustomTable {
      getColumn(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type' || name === 'source').should.be.equal(
          true,
        );
        if (name === 'identifier') {
          return UserCustomColumn.createColumn('identifier', GeoPackageDataType.INTEGER);
        }
        if (name === 'format') {
          return;
        }
        if (name === 'content_type') {
          return UserCustomColumn.createColumn('identifier', GeoPackageDataType.TEXT);
        }
        return;
      }
      hasColumn(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type' || name === 'source').should.be.equal(
          true,
        );
        if (name === 'identifier') {
          return true;
        }
        if (name === 'format') {
          return false;
        }
        if (name === 'content_type') {
          return true;
        }
      }
    }
    var fakeTable = new MockUserTable('table', []);
    var fakeRow = new MockUserRow(fakeTable);

    DublinCoreMetadata.setValue(fakeRow, DublinCoreType.IDENTIFIER, 'identifier');
  });

  it('set synonym value', function () {
    class MockUserRow extends UserRow {
      setValue(name, value) {
        (name === 'identifier' || name === 'format' || name === 'content_type').should.be.equal(true);
        if (name === 'content_type') {
          value.should.be.equal('format');
        } else {
          should.fail(name, 'content_type');
        }
      }
      getColumn(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type').should.be.equal(true);
        if (name === 'identifier') {
          return UserCustomColumn.createColumn('identifier', GeoPackageDataType.INTEGER);
        }
        if (name === 'format') {
          return;
        }
        if (name === 'content_type') {
          return UserCustomColumn.createColumn('content_type', GeoPackageDataType.TEXT);
        }
      }
      hasColumn(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type').should.be.equal(true);
        if (name === 'identifier') {
          return true;
        }
        if (name === 'format') {
          return false;
        }
        if (name === 'content_type') {
          return true;
        }
      }
    }
    class MockUserTable extends UserCustomTable {
      getColumn(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type' || name === 'source').should.be.equal(
          true,
        );
        if (name === 'identifier') {
          return UserCustomColumn.createColumn('identifier', GeoPackageDataType.INTEGER);
        }
        if (name === 'format') {
          return;
        }
        if (name === 'content_type') {
          return UserCustomColumn.createColumn('content_type', GeoPackageDataType.TEXT);
        }
        return;
      }
      hasColumn(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type' || name === 'source').should.be.equal(
          true,
        );
        if (name === 'identifier') {
          return true;
        }
        if (name === 'format') {
          return false;
        }
        if (name === 'content_type') {
          return true;
        }
      }
    }
    var fakeTable = new MockUserTable('table', []);
    var fakeRow = new MockUserRow(fakeTable);

    DublinCoreMetadata.setValue(fakeRow, DublinCoreType.FORMAT, 'format');
  });

  it('get value', function () {
    class MockUserRow extends UserRow {
      getValue(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type').should.be.equal(true);
        if (name === 'identifier') {
          return 'identifier';
        } else {
          should.fail(name, 'identifier');
        }
      }
      getColumn(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type').should.be.equal(true);
        if (name === 'identifier') {
          return UserCustomColumn.createColumn('identifier', GeoPackageDataType.INTEGER);
        }
      }
      hasColumn(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type').should.be.equal(true);
        if (name === 'identifier') {
          return true;
        }
      }
    }
    class MockUserTable extends UserCustomTable {
      hasColumn(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type').should.be.equal(true);
        if (name === 'identifier') {
          return true;
        }
        if (name === 'format') {
          return false;
        }
        if (name === 'content_type') {
          return false;
        }
      }
      getColumn(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type').should.be.equal(true);
        if (name === 'identifier') {
          return UserCustomColumn.createColumn('identifier', GeoPackageDataType.INTEGER);
        }
      }
    }
    var fakeTable = new MockUserTable('table', []);
    var fakeRow = new MockUserRow(fakeTable);
    DublinCoreMetadata.getValue(fakeRow, DublinCoreType.IDENTIFIER).should.be.equal('identifier');
  });

  it('get synonym value', function () {
    class MockUserRow extends UserRow {
      getValue(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type').should.be.equal(true);
        if (name === 'format') {
          return 'format';
        } else {
          should.fail(name, 'content_type');
        }
      }
      getColumn(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type').should.be.equal(true);
        if (name === 'identifier') {
          return UserCustomColumn.createColumn('identifier', GeoPackageDataType.INTEGER);
        }
        if (name === 'format') {
          return;
        }
        if (name === 'content_type') {
          return UserCustomColumn.createColumn('content_type', GeoPackageDataType.TEXT);
        }
      }
      hasColumn(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type').should.be.equal(true);
        if (name === 'identifier') {
          return true;
        }
        if (name === 'format') {
          return false;
        }
        if (name === 'content_type') {
          return true;
        }
      }
    }
    class MockUserTable extends UserCustomTable {
      hasColumn(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type').should.be.equal(true);
        if (name === 'identifier') {
          return true;
        }
        if (name === 'format') {
          return true;
        }
        if (name === 'content_type') {
          return false;
        }
      }
      getColumn(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type').should.be.equal(true);
        if (name === 'format') {
          return UserCustomColumn.createColumn('format', GeoPackageDataType.TEXT);
        }
      }
    }
    var fakeTable = new MockUserTable('table', []);
    var fakeRow = new MockUserRow(fakeTable);
    DublinCoreMetadata.getValue(fakeRow, DublinCoreType.FORMAT).should.be.equal('format');
  });
});

import {UserTable} from '../../../../lib/user/userTable';
import {UserColumn} from '../../../../lib/user/userColumn';
import {UserRow} from '../../../../lib/user/userRow';
import { DataTypes } from '../../../../lib/db/dataTypes';

var DublinCoreMetadata = require('../../../../lib/extension/relatedTables/dublinCoreMetadata').DublinCoreMetadata
  , DublinCoreType = require('../../../../lib/extension/relatedTables/dublinCoreType').DublinCoreType
  , should = require('chai').should();

describe('Dublin Core tests', function() {

  it('from name', function() {
    DublinCoreType.fromName('format').should.be.equal(DublinCoreType.FORMAT);
    DublinCoreType.fromName('identifier').should.be.equal(DublinCoreType.IDENTIFIER);
    DublinCoreType.fromName('date').should.be.equal(DublinCoreType.DATE);
    DublinCoreType.fromName('source').should.be.equal(DublinCoreType.SOURCE);
    DublinCoreType.fromName('title').should.be.equal(DublinCoreType.TITLE);
    DublinCoreType.fromName('description').should.be.equal(DublinCoreType.DESCRIPTION);
    DublinCoreType.fromName('content_type').should.be.equal(DublinCoreType.FORMAT);
    DublinCoreType.fromName('id').should.be.equal(DublinCoreType.IDENTIFIER);
  });

  it('has column', function() {
    class MockUserTable extends UserTable {
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

  it('has synonym column', function() {
    class MockUserTable extends UserTable {
      hasColumn(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type' || name === 'source').should.be.equal(true);
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

  it('get column', function() {
    class MockUserTable extends UserTable {
      getColumnWithColumnName(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type').should.be.equal(true);
        if (name === 'identifier') {
          return new UserColumn(0, 'identifier', DataTypes.INTEGER);
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
  });

  it('get synonym column', function() {
    class MockUserTable extends UserTable {
      getColumnWithColumnName(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type' || name === 'source').should.be.equal(true);
        if (name === 'identifier') {
          return new UserColumn(0, 'identifier', DataTypes.INTEGER);
        }
        if (name === 'format') {
          return;
        }
        if (name === 'content_type') {
          return new UserColumn(0, 'identifier', DataTypes.TEXT);
        }
        return;
      }
      hasColumn(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type' || name === 'source').should.be.equal(true);
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
    };
    var fakeTable = new MockUserTable('table', []);
    should.exist(DublinCoreMetadata.getColumn(fakeTable, DublinCoreType.IDENTIFIER));
    should.exist(DublinCoreMetadata.getColumn(fakeTable, DublinCoreType.FORMAT))
    should.not.exist(DublinCoreMetadata.getColumn(fakeTable, DublinCoreType.SOURCE));
  });

  it('set value', function() {
    class MockUserRow extends UserRow {
      setValueWithColumnName(name, value) {
        (name === 'identifier' || name === 'format' || name === 'content_type').should.be.equal(true);
        if (name === 'identifier') {
          value.should.be.equal('identifier');
        } else {
          should.fail(name, 'identifier');
        }
      }
      getColumnWithColumnName(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type').should.be.equal(true);
        if (name === 'identifier') {
          return new UserColumn(0, 'identifier', DataTypes.INTEGER);
        }
      }
      hasColumn(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type').should.be.equal(true);
        if (name === 'identifier') {
          return true;
        }
      }
    };
    class MockUserTable extends UserTable {
      getColumnWithColumnName(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type' || name === 'source').should.be.equal(true);
        if (name === 'identifier') {
          return new UserColumn(0, 'identifier', DataTypes.INTEGER);
        }
        if (name === 'format') {
          return;
        }
        if (name === 'content_type') {
          return new UserColumn(0, 'identifier', DataTypes.TEXT);
        }
        return;
      }
      hasColumn(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type' || name === 'source').should.be.equal(true);
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
    };
    var fakeTable = new MockUserTable('table', []);
    var fakeRow = new MockUserRow(fakeTable)

    DublinCoreMetadata.setValue(fakeRow, DublinCoreType.IDENTIFIER, 'identifier');
  });

  it('set synonym value', function() {
    class MockUserRow extends UserRow {
      setValueWithColumnName(name, value) {
        (name === 'identifier' || name === 'format' || name === 'content_type').should.be.equal(true);
        if (name === 'content_type') {
          value.should.be.equal('format');
        }
        else {
          should.fail(name, 'content_type');
        }
      }
      getColumnWithColumnName(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type').should.be.equal(true);
        if (name === 'identifier') {
          return new UserColumn(0, 'identifier', DataTypes.INTEGER);
        }
        if (name === 'format') {
          return;
        }
        if (name === 'content_type') {
          return new UserColumn(0, 'content_type', DataTypes.TEXT);
        }
      }
      hasColumn(columnNanameme) {
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
    class MockUserTable extends UserTable {
      getColumnWithColumnName(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type' || name === 'source').should.be.equal(true);
        if (name === 'identifier') {
          return new UserColumn(0, 'identifier', DataTypes.INTEGER);
        }
        if (name === 'format') {
          return;
        }
        if (name === 'content_type') {
          return new UserColumn(0, 'content_type', DataTypes.TEXT);
        }
        return;
      }
      hasColumn(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type' || name === 'source').should.be.equal(true);
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
    };
    var fakeTable = new MockUserTable('table', []);
    var fakeRow = new MockUserRow(fakeTable)

    DublinCoreMetadata.setValue(fakeRow, DublinCoreType.FORMAT, 'format');
  });

  it('get value', function() {
    class MockUserRow extends UserRow {
      getValueWithColumnName(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type').should.be.equal(true);
        if (name === 'identifier') {
          return 'identifier';
        } else {
          should.fail(name, 'identifier');
        }
      }
      getColumnWithColumnName(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type').should.be.equal(true);
        if (name === 'identifier') {
          return new UserColumn(0, 'identifier', DataTypes.INTEGER);
        }
      }
      hasColumn(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type').should.be.equal(true);
        if (name === 'identifier') {
          return true;
        }
      }
    };
    class MockUserTable extends UserTable {
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
      getColumnWithColumnName(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type').should.be.equal(true);
        if (name === 'identifier') {
          return new UserColumn(0, 'identifier', DataTypes.INTEGER);
        }
      }
    }
    var fakeTable = new MockUserTable('table', [])
    var fakeRow = new MockUserRow(fakeTable);
    DublinCoreMetadata.getValue(fakeRow, DublinCoreType.IDENTIFIER).should.be.equal('identifier');
  });

  it('get synonym value', function() {
    class MockUserRow extends UserRow {
      getValueWithColumnName(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type').should.be.equal(true);
        if (name === 'format') {
          return 'format';
        }
        else {
          should.fail(name, 'content_type');
        }
      }
      getColumnWithColumnName(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type').should.be.equal(true);
        if (name === 'identifier') {
          return new UserColumn(0, 'identifier', DataTypes.INTEGER);
        }
        if (name === 'format') {
          return;
        }
        if (name === 'content_type') {
          return new UserColumn(0, 'content_type', DataTypes.TEXT);
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
    };
    class MockUserTable extends UserTable {
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
      getColumnWithColumnName(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type').should.be.equal(true);
        if (name === 'format') {
          return new UserColumn(0, 'format', DataTypes.TEXT);
        }
      }
    }
    var fakeTable = new MockUserTable('table', []);
    var fakeRow = new MockUserRow(fakeTable);
    DublinCoreMetadata.getValue(fakeRow, DublinCoreType.FORMAT).should.be.equal('format');
  });
});

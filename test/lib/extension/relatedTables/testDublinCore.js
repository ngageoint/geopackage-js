var DublinCoreMetadata = require('../../../../lib/extension/relatedTables/dublinCoreMetadata')
  , DublinCoreType = require('../../../../lib/extension/relatedTables/dublinCoreType')
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
    var fakeTable = {
      hasColumn: function(name) {
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
    };
    DublinCoreMetadata.hasColumn(fakeTable, DublinCoreType.IDENTIFIER).should.be.equal(true);
    DublinCoreMetadata.hasColumn(fakeTable, DublinCoreType.FORMAT).should.be.equal(false);
  });

  it('has synonym column', function() {
    var fakeTable = {
      hasColumn: function(name) {
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
    };
    DublinCoreMetadata.hasColumn(fakeTable, DublinCoreType.IDENTIFIER).should.be.equal(true);
    DublinCoreMetadata.hasColumn(fakeTable, DublinCoreType.FORMAT).should.be.equal(true);
    DublinCoreMetadata.hasColumn(fakeTable, DublinCoreType.SOURCE).should.be.equal(false);
  });

  it('get column', function() {
    var fakeTable = {
      getColumnWithColumnName: function(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type').should.be.equal(true);
        if (name === 'identifier') {
          return {};
        }
        if (name === 'format') {
          return;
        }
        if (name === 'content_type') {
          return;
        }
      },
      hasColumn: function(name) {
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
    };
    should.exist(DublinCoreMetadata.getColumn(fakeTable, DublinCoreType.IDENTIFIER));
    should.not.exist(DublinCoreMetadata.getColumn(fakeTable, DublinCoreType.FORMAT));
  });

  it('get synonym column', function() {
    var fakeTable = {
      getColumnWithColumnName: function(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type' || name === 'source').should.be.equal(true);
        if (name === 'identifier') {
          return {};
        }
        if (name === 'format') {
          return;
        }
        if (name === 'content_type') {
          return {};
        }
        return;
      },
      hasColumn: function(name) {
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
    should.exist(DublinCoreMetadata.getColumn(fakeTable, DublinCoreType.IDENTIFIER));
    should.exist(DublinCoreMetadata.getColumn(fakeTable, DublinCoreType.FORMAT))
    should.not.exist(DublinCoreMetadata.getColumn(fakeTable, DublinCoreType.SOURCE));
  });

  it('set value', function() {
    var fakeTable = {
      setValueWithColumnName: function(name, value) {
        (name === 'identifier' || name === 'format' || name === 'content_type').should.be.equal(true);
        if (name === 'identifier') {
          value.should.be.equal('identifier');
        } else {
          should.fail();
        }
      },
      getColumnWithColumnName: function(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type').should.be.equal(true);
        if (name === 'identifier') {
          return {name: 'identifier'};
        }
      },
      hasColumn: function(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type').should.be.equal(true);
        if (name === 'identifier') {
          return true;
        }
      }
    };
    DublinCoreMetadata.setValue(fakeTable, DublinCoreType.IDENTIFIER, 'identifier');
  });

  it('set synonym value', function() {
    var fakeTable = {
      setValueWithColumnName: function(name, value) {
        (name === 'identifier' || name === 'format' || name === 'content_type').should.be.equal(true);
        if (name === 'content_type') {
          value.should.be.equal('format');
        }
        else {
          should.fail();
        }
      },
      getColumnWithColumnName: function(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type').should.be.equal(true);
        if (name === 'identifier') {
          return {name: 'identifier'};
        }
        if (name === 'format') {
          return;
        }
        if (name === 'content_type') {
          return {name: 'content_type'};
        }
      },
      hasColumn: function(name) {
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
    DublinCoreMetadata.setValue(fakeTable, DublinCoreType.FORMAT, 'format');
  });

  it('get value', function() {
    var fakeTable = {
      getValueWithColumnName: function(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type').should.be.equal(true);
        if (name === 'identifier') {
          return 'identifier';
        } else {
          should.fail();
        }
      },
      getColumnWithColumnName: function(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type').should.be.equal(true);
        if (name === 'identifier') {
          return {name: 'identifier'};
        }
      },
      hasColumn: function(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type').should.be.equal(true);
        if (name === 'identifier') {
          return true;
        }
      }
    };
    DublinCoreMetadata.getValue(fakeTable, DublinCoreType.IDENTIFIER).should.be.equal('identifier');
  });

  it('get synonym value', function() {
    var fakeTable = {
      getValueWithColumnName: function(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type').should.be.equal(true);
        if (name === 'content_type') {
          return 'format';
        }
        else {
          should.fail();
        }
      },
      getColumnWithColumnName: function(name) {
        (name === 'identifier' || name === 'format' || name === 'content_type').should.be.equal(true);
        if (name === 'identifier') {
          return {name: 'identifier'};
        }
        if (name === 'format') {
          return;
        }
        if (name === 'content_type') {
          return {name: 'content_type'};
        }
      },
      hasColumn: function(name) {
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
    DublinCoreMetadata.getValue(fakeTable, DublinCoreType.FORMAT).should.be.equal('format');
  });
});

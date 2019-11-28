import GeoPackage from '../../../lib/geoPackage';

var fs = require('fs')
  , should = require('chai').should()
  , path = require('path')
  // , GeoPackage = require('../../../lib/geoPackage')
  , Metadata = require('../../../lib/metadata/metadata')
  , MetadataDao = require('../../../lib/metadata/metadataDao');

describe('Metadata tests', function() {

  it('should create a Metadata object', function() {
    var md = new MetadataDao(new GeoPackage(null, null, null));
    var metadata = md.createObject();
    should.exist(metadata.getScopeInformation);
  });

  it('should test getting scope information', function() {
    var m1 = new Metadata();
    var info;
    info = m1.getScopeInformation(Metadata.UNDEFINED);
    info.name.should.be.equal(Metadata.UNDEFINED);
    info.code.should.be.equal('NA');
    info.definition.should.be.equal('Metadata information scope is undefined');

    info = m1.getScopeInformation(Metadata.FIELD_SESSION);
    info.name.should.be.equal(Metadata.FIELD_SESSION);
    info.code.should.be.equal('012');
    info.definition.should.be.equal('Information applies to the field session');

    info = m1.getScopeInformation(Metadata.COLLECTION_SESSION);
    info.name.should.be.equal(Metadata.COLLECTION_SESSION);
    info.code.should.be.equal('004');
    info.definition.should.be.equal('Information applies to the collection session');

    info = m1.getScopeInformation(Metadata.SERIES);
    info.name.should.be.equal(Metadata.SERIES);
    info.code.should.be.equal('006');
    info.definition.should.be.equal('Information applies to the (dataset) series');

    info = m1.getScopeInformation(Metadata.DATASET);
    info.name.should.be.equal(Metadata.DATASET);
    info.code.should.be.equal('005');
    info.definition.should.be.equal('Information applies to the (geographic feature) dataset');

    info = m1.getScopeInformation(Metadata.FEATURE_TYPE);
    info.name.should.be.equal(Metadata.FEATURE_TYPE);
    info.code.should.be.equal('010');
    info.definition.should.be.equal('Information applies to a feature type (class)');

    info = m1.getScopeInformation(Metadata.FEATURE);
    info.name.should.be.equal(Metadata.FEATURE);
    info.code.should.be.equal('009');
    info.definition.should.be.equal('Information applies to a feature (instance)');

    info = m1.getScopeInformation(Metadata.ATTRIBUTE_TYPE);
    info.name.should.be.equal(Metadata.ATTRIBUTE_TYPE);
    info.code.should.be.equal('002');
    info.definition.should.be.equal('Information applies to the attribute class');

    info = m1.getScopeInformation(Metadata.ATTRIBUTE);
    info.name.should.be.equal(Metadata.ATTRIBUTE);
    info.code.should.be.equal('001');
    info.definition.should.be.equal('Information applies to the characteristic of a feature (instance)');

    info = m1.getScopeInformation(Metadata.TILE);
    info.name.should.be.equal(Metadata.TILE);
    info.code.should.be.equal('016');
    info.definition.should.be.equal('Information applies to a tile, a spatial subset of geographic data');

    info = m1.getScopeInformation(Metadata.MODEL);
    info.name.should.be.equal(Metadata.MODEL);
    info.code.should.be.equal('015');
    info.definition.should.be.equal('Information applies to a copy or imitation of an existing or hypothetical object');

    info = m1.getScopeInformation(Metadata.CATALOG);
    info.name.should.be.equal(Metadata.CATALOG);
    info.code.should.be.equal('NA');
    info.definition.should.be.equal('Metadata applies to a feature catalog');

    info = m1.getScopeInformation(Metadata.SCHEMA);
    info.name.should.be.equal(Metadata.SCHEMA);
    info.code.should.be.equal('NA');
    info.definition.should.be.equal('Metadata applies to an application schema');

    info = m1.getScopeInformation(Metadata.TAXONOMY);
    info.name.should.be.equal(Metadata.TAXONOMY);
    info.code.should.be.equal('NA');
    info.definition.should.be.equal('Metadata applies to a taxonomy or knowledge system');

    info = m1.getScopeInformation(Metadata.SOFTWARE);
    info.name.should.be.equal(Metadata.SOFTWARE);
    info.code.should.be.equal('013');
    info.definition.should.be.equal('Information applies to a computer program or routine');

    info = m1.getScopeInformation(Metadata.SERVICE);
    info.name.should.be.equal(Metadata.SERVICE);
    info.code.should.be.equal('014');
    info.definition.should.be.equal('Information applies to a capability which a service provider entity makes available to a service user entity through a set of interfaces that define a behaviour, such as a use case');

    info = m1.getScopeInformation(Metadata.COLLECTION_HARDWARE);
    info.name.should.be.equal(Metadata.COLLECTION_HARDWARE);
    info.code.should.be.equal('003');
    info.definition.should.be.equal('Information applies to the collection hardware class');

    info = m1.getScopeInformation(Metadata.NON_GEOGRAPHIC_DATASET);
    info.name.should.be.equal(Metadata.NON_GEOGRAPHIC_DATASET);
    info.code.should.be.equal('007');
    info.definition.should.be.equal('Information applies to non-geographic data');

    info = m1.getScopeInformation(Metadata.DIMENSION_GROUP);
    info.name.should.be.equal(Metadata.DIMENSION_GROUP);
    info.code.should.be.equal('008');
    info.definition.should.be.equal('Information applies to a dimension group');
  });
});

import { GeoPackage } from '../../../lib/geoPackage';
import { MetadataScopeType } from '../../../lib/extension/metadata/metadataScopeType';

var should = require('chai').should(),
  MetadataDao = require('../../../lib/extension/metadata/metadataDao').MetadataDao;

describe('Metadata tests', function () {
  it('should create a Metadata object', function () {
    var md = new MetadataDao(new GeoPackage(null, null, null));
    var metadata = md.createObject();
    should.exist(metadata);
  });

  it('should test getting scope information', function () {
    var info;
    info = MetadataScopeType.getScopeInformation(MetadataScopeType.UNDEFINED);
    info.name.should.be.equal(MetadataScopeType.UNDEFINED);
    info.code.should.be.equal('NA');
    info.definition.should.be.equal('Metadata information scope is undefined');

    info = MetadataScopeType.getScopeInformation(MetadataScopeType.FIELD_SESSION);
    info.name.should.be.equal(MetadataScopeType.FIELD_SESSION);
    info.code.should.be.equal('012');
    info.definition.should.be.equal('Information applies to the field session');

    info = MetadataScopeType.getScopeInformation(MetadataScopeType.COLLECTION_SESSION);
    info.name.should.be.equal(MetadataScopeType.COLLECTION_SESSION);
    info.code.should.be.equal('004');
    info.definition.should.be.equal('Information applies to the collection session');

    info = MetadataScopeType.getScopeInformation(MetadataScopeType.SERIES);
    info.name.should.be.equal(MetadataScopeType.SERIES);
    info.code.should.be.equal('006');
    info.definition.should.be.equal('Information applies to the (dataset) series');

    info = MetadataScopeType.getScopeInformation(MetadataScopeType.DATASET);
    info.name.should.be.equal(MetadataScopeType.DATASET);
    info.code.should.be.equal('005');
    info.definition.should.be.equal('Information applies to the (geographic feature) dataset');

    info = MetadataScopeType.getScopeInformation(MetadataScopeType.FEATURE_TYPE);
    info.name.should.be.equal(MetadataScopeType.FEATURE_TYPE);
    info.code.should.be.equal('010');
    info.definition.should.be.equal('Information applies to a feature type (class)');

    info = MetadataScopeType.getScopeInformation(MetadataScopeType.FEATURE);
    info.name.should.be.equal(MetadataScopeType.FEATURE);
    info.code.should.be.equal('009');
    info.definition.should.be.equal('Information applies to a feature (instance)');

    info = MetadataScopeType.getScopeInformation(MetadataScopeType.ATTRIBUTE_TYPE);
    info.name.should.be.equal(MetadataScopeType.ATTRIBUTE_TYPE);
    info.code.should.be.equal('002');
    info.definition.should.be.equal('Information applies to the attribute class');

    info = MetadataScopeType.getScopeInformation(MetadataScopeType.ATTRIBUTE);
    info.name.should.be.equal(MetadataScopeType.ATTRIBUTE);
    info.code.should.be.equal('001');
    info.definition.should.be.equal('Information applies to the characteristic of a feature (instance)');

    info = MetadataScopeType.getScopeInformation(MetadataScopeType.TILE);
    info.name.should.be.equal(MetadataScopeType.TILE);
    info.code.should.be.equal('016');
    info.definition.should.be.equal('Information applies to a tile, a spatial subset of geographic data');

    info = MetadataScopeType.getScopeInformation(MetadataScopeType.MODEL);
    info.name.should.be.equal(MetadataScopeType.MODEL);
    info.code.should.be.equal('015');
    info.definition.should.be.equal('Information applies to a copy or imitation of an existing or hypothetical object');

    info = MetadataScopeType.getScopeInformation(MetadataScopeType.CATALOG);
    info.name.should.be.equal(MetadataScopeType.CATALOG);
    info.code.should.be.equal('NA');
    info.definition.should.be.equal('Metadata applies to a feature catalog');

    info = MetadataScopeType.getScopeInformation(MetadataScopeType.SCHEMA);
    info.name.should.be.equal(MetadataScopeType.SCHEMA);
    info.code.should.be.equal('NA');
    info.definition.should.be.equal('Metadata applies to an application schema');

    info = MetadataScopeType.getScopeInformation(MetadataScopeType.TAXONOMY);
    info.name.should.be.equal(MetadataScopeType.TAXONOMY);
    info.code.should.be.equal('NA');
    info.definition.should.be.equal('Metadata applies to a taxonomy or knowledge system');

    info = MetadataScopeType.getScopeInformation(MetadataScopeType.SOFTWARE);
    info.name.should.be.equal(MetadataScopeType.SOFTWARE);
    info.code.should.be.equal('013');
    info.definition.should.be.equal('Information applies to a computer program or routine');

    info = MetadataScopeType.getScopeInformation(MetadataScopeType.SERVICE);
    info.name.should.be.equal(MetadataScopeType.SERVICE);
    info.code.should.be.equal('014');
    info.definition.should.be.equal(
      'Information applies to a capability which a service provider entity makes available to a service user entity through a set of interfaces that define a behaviour, such as a use case',
    );

    info = MetadataScopeType.getScopeInformation(MetadataScopeType.COLLECTION_HARDWARE);
    info.name.should.be.equal(MetadataScopeType.COLLECTION_HARDWARE);
    info.code.should.be.equal('003');
    info.definition.should.be.equal('Information applies to the collection hardware class');

    info = MetadataScopeType.getScopeInformation(MetadataScopeType.NON_GEOGRAPHIC_DATASET);
    info.name.should.be.equal(MetadataScopeType.NON_GEOGRAPHIC_DATASET);
    info.code.should.be.equal('007');
    info.definition.should.be.equal('Information applies to non-geographic data');

    info = MetadataScopeType.getScopeInformation(MetadataScopeType.DIMENSION_GROUP);
    info.name.should.be.equal(MetadataScopeType.DIMENSION_GROUP);
    info.code.should.be.equal('008');
    info.definition.should.be.equal('Information applies to a dimension group');
  });
});

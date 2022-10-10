import { Extensions } from "../../../lib/extension/extensions";

describe('GeoPackage Extension tests', function() {

  it('should create an extension', function() {
    var extension = new Extensions();
    extension.setExtensionName('author', 'name');
    extension.extension_name.should.be.equal('author_name');
  });

});

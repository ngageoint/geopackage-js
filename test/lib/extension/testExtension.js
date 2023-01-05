import { Extensions } from "../../../lib/extension/extensions";

describe('GeoPackage Extension tests', function() {

  it('should create an extension', function() {
    var extension = new Extensions();
    extension.buildAndSetExtensionName('author', 'name');
    extension.getExtensionName().should.be.equal('author_name');
  });

});

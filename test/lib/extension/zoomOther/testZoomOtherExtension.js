import { ZoomOtherExtension } from "../../../../lib/extension/zoomOtherExtension";
import { GeoPackageConstants } from "../../../../lib/geoPackageConstants";
import { TileTable } from "../../../../lib/tiles/user/tileTable";
import { Extensions } from "../../../../lib/extension/extensions";
const should = require('chai').should();

describe('ZoomOtherExtension tests', function() {

  var testGeoPackage;
  var geoPackage;

  beforeEach(async function() {
    let created = await testSetup.createTmpGeoPackage();
    testGeoPackage = created.path;
    geoPackage = created.geoPackage;
  });

  afterEach(async function() {
    geoPackage.close();
    await testSetup.deleteGeoPackage(testGeoPackage);
  });


  it('should test the zoom other extension', function() {
    const zoomOtherExtension = new ZoomOtherExtension(geoPackage);

    const tableName = "table";

    const extension = zoomOtherExtension.getOrCreate(tableName);
    should.exist(extension);
    zoomOtherExtension.has(tableName).should.be.true;
    ZoomOtherExtension.EXTENSION_NAME.should.be.equal(extension.extensionName)
    GeoPackageConstants.EXTENSION_AUTHOR.should.be.equal(extension.author)
    ZoomOtherExtension.NAME.should.be.equal(ZoomOtherExtension.getExtensionNameNoAuthor(extension.extensionName));
    tableName.should.be.equal(extension.getTableName());
    TileTable.COLUMN_TILE_DATA.should.be.equal(extension.column_name);
    Extensions.READ_WRITE.should.be.equal(extension.scope);
    ZoomOtherExtension.DEFINITION.should.be.equal(extension.definition);

    geoPackage.getExtensionManager().deleteTableExtensions(tableName);
    zoomOtherExtension.has(tableName).should.be.false;
  });

});

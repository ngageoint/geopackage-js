import { default as testSetup } from '../../../testSetup';
import { ZoomOtherExtension } from '../../../../lib/extension/zoomOtherExtension';
import { GeoPackageConstants } from '../../../../lib/geoPackageConstants';
import { TileTable } from '../../../../lib/tiles/user/tileTable';
import { ExtensionScopeType } from '../../../../lib/extension/extensionScopeType';
const should = require('chai').should();

describe('ZoomOtherExtension tests', function () {
  var geoPackagePath;
  var geoPackage;

  beforeEach(async function () {
    let created = await testSetup.createTmpGeoPackage();
    geoPackagePath = created.path;
    geoPackage = created.geoPackage;
  });

  afterEach(async function () {
    geoPackage.close();
    await testSetup.deleteGeoPackage(geoPackagePath);
  });

  it('should test the zoom other extension', function () {
    const zoomOtherExtension = new ZoomOtherExtension(geoPackage);

    const tableName = 'table';

    const extension = zoomOtherExtension.getOrCreate(tableName);
    should.exist(extension);
    zoomOtherExtension.has(tableName).should.be.true;
    ZoomOtherExtension.EXTENSION_NAME.should.be.equal(extension.getExtensionName());
    GeoPackageConstants.EXTENSION_AUTHOR.should.be.equal(extension.getAuthor());
    ZoomOtherExtension.NAME.should.be.equal(extension.getExtensionNameNoAuthor());
    tableName.should.be.equal(extension.getTableName());
    TileTable.COLUMN_TILE_DATA.should.be.equal(extension.getColumnName());
    ExtensionScopeType.READ_WRITE.should.be.equal(extension.getScope());
    ZoomOtherExtension.DEFINITION.should.be.equal(extension.getDefinition());

    geoPackage.getExtensionManager().deleteTableExtensions(tableName);
    zoomOtherExtension.has(tableName).should.be.false;
  });
});

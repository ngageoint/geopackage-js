import { BoundingBox } from './lib/boundingBox';
import { ClosestFeature, GeoPackage } from './lib/geoPackage';
import { ContentsDao } from './lib/contents/contentsDao';
import { ContentsIdDao } from './lib/extension/nga/contents/contentsIdDao';
import { Constraint } from './lib/db/table/constraint';
import { Constraints } from './lib/db/table/constraints';
import { ConstraintType } from './lib/db/table/constraintType';
import { CrsWktExtension } from './lib/extension/crsWktExtension';
import { DataColumnConstraints } from './lib/extension/schema/constraints/dataColumnConstraints';
import { DataColumnConstraintsDao } from './lib/extension/schema/constraints/dataColumnConstraintsDao';
import { DataColumns } from './lib/extension/schema/columns/dataColumns';
import { GeoPackageDataType } from './lib/db/geoPackageDataType';
import { DataColumnsDao } from './lib/extension/schema/columns/dataColumnsDao';
import { DublinCoreMetadata } from './lib/extension/related/dublin/dublinCoreMetadata';
import { DublinCoreType } from './lib/extension/related/dublin/dublinCoreType';
import { Extensions } from './lib/extension/extensions';
import { FeatureColumn } from './lib/features/user/featureColumn';
import { FeatureDrawType } from './lib/tiles/features/featureDrawType';
import { FeaturePaint } from './lib/tiles/features/featurePaint';
import { FeatureStyle } from './lib/extension/nga/style/featureStyle';
import { FeatureStyleExtension } from './lib/extension/nga/style/featureStyleExtension';
import { FeatureStyles } from './lib/extension/nga/style/featureStyles';
import { FeatureTable } from './lib/features/user/featureTable';
import { FeatureTableIndex } from './lib/extension/nga/index/featureTableIndex';
import { FeatureTableReader } from './lib/features/user/featureTableReader';
import { FeatureTableStyles } from './lib/extension/nga/style/featureTableStyles';
import { FeatureTiles } from './lib/tiles/features';
import { GeometryColumns } from './lib/features/columns/geometryColumns';
import { GeometryColumnsDao } from './lib/features/columns/geometryColumnsDao';
import { GeoPackageGeometryData } from './lib/geom/geoPackageGeometryData';
import { GeoPackageManager } from './lib/GeoPackageManager';
import { GeoPackageConnection } from './lib/db/geoPackageConnection';
import { GeoPackageTileRetriever } from './lib/tiles/retriever';
import { GeoPackageValidate } from './lib/validate/geoPackageValidate';
import { IconCache } from './lib/extension/nga/style/iconCache';
import { Icons } from './lib/extension/nga/style/icons';
import { IconTable } from './lib/extension/nga/style/iconTable';
import { ImageUtils } from './lib/tiles/imageUtils';
import { MediaTable } from './lib/extension/related/media/mediaTable';
import { Metadata } from './lib/extension/metadata/metadata';
import { MetadataDao } from './lib/extension/metadata/metadataDao';
import { MetadataExtension } from './lib/extension/metadata/metadataExtension';
import { MetadataReference } from './lib/extension/metadata/reference/metadataReference';
import { NumberFeaturesTile } from './lib/tiles/features/custom/numberFeaturesTile';
import { OptionBuilder } from './lib/optionBuilder';
import { Paint } from './lib/tiles/features/paint';
import { Projection } from './lib/projection/projection';
import { ProjectionConstants } from './lib/projection/projectionConstants';
import { RelatedTablesExtension } from './lib/extension/related';
import { RTreeIndex } from './lib/extension/rtree/rTreeIndexExtension';
import { RTreeIndexDao } from './lib/extension/rtree/rtreeIndexDao';
import { SchemaExtension } from './lib/extension/schema';
import { ShadedFeaturesTile } from './lib/tiles/features/custom/shadedFeaturesTile';
import { SimpleAttributesTable } from './lib/extension/related/simple/simpleAttributesTable';
import { SpatialReferenceSystem } from './lib/srs/spatialReferenceSystem';
import { SqliteQueryBuilder } from './lib/db/sqliteQueryBuilder';
import { StyleMappingTable } from './lib/extension/nga/style/styleMappingTable';
import { Styles } from './lib/extension/nga/style/styles';
import { StyleTable } from './lib/extension/nga/style/styleTable';
import { GeoPackageTableCreator } from './lib/db/tableCreator';
import { TileBoundingBoxUtils } from './lib/tiles/tileBoundingBoxUtils';
import { TileColumn } from './lib/tiles/user/tileColumn';
import { TileMatrix } from './lib/tiles/matrix/tileMatrix';
import { TileMatrixSet } from './lib/tiles/matrixset/tileMatrixSet';
import { TileScaling } from './lib/extension/nga/scale/tileScaling';
import { TileScalingType } from './lib/extension/nga/scale/tileScalingType';
import { TileTable } from './lib/tiles/user/tileTable';
import { TileUtilities } from './lib/tiles/creator/tileUtilities';
import { UserColumn } from './lib/user/userColumn';
import { UserDao } from './lib/user/userDao';
import { UserMappingTable } from './lib/extension/related/userMappingTable';
import { UserRow } from './lib/user/userRow';
import { UserTable } from './lib/user/userTable';
import { UserTableReader } from './lib/user/userTableReader';
import { WebPExtension } from './lib/extension/webPExtension';
import { WKB } from './lib/wkb';
import { DBAdapter } from './lib/db/dbAdapter';
import { SqliteAdapter } from './lib/db/sqliteAdapter';
import { SqljsAdapter } from './lib/db/sqljsAdapter';
import { TileCreator } from './lib/tiles/creator/tileCreator';
import { Canvas } from './lib/canvas/canvas';
import { CanvasAdapter } from './lib/canvas/canvasAdapter';
import { CanvasKitCanvasAdapter } from './lib/canvas/canvasKitCanvasAdapter';
import { OffscreenCanvasAdapter } from './lib/canvas/offscreenCanvasAdapter';
import { HtmlCanvasAdapter } from './lib/canvas/htmlCanvasAdapter';
import { Context } from './lib/context/context';
import { PropertiesExtension } from './lib/extension/nga/properties/propertiesExtension';
import { PropertiesManager } from './lib/extension/nga/properties/propertiesManager';
import { PropertyNames } from './lib/extension/nga/properties/propertyNames';
import { FeatureTileTableLinker } from './lib/extension/nga/link/featureTileTableLinker';
import { FeatureTileLink } from './lib/extension/nga/link/featureTileLink';
import { FeatureTileLinkDao } from './lib/extension/nga/link/featureTileLinkDao';
import { FeatureTileLinkKey } from './lib/extension/nga/link/featureTileLinkKey';

Context.setupDefaultContext();

const setSqljsWasmLocateFile = SqljsAdapter.setSqljsWasmLocateFile;
const setCanvasKitWasmLocateFile = CanvasKitCanvasAdapter.setCanvasKitWasmLocateFile;

export {
  BoundingBox,
  Canvas,
  CanvasAdapter,
  CanvasKitCanvasAdapter,
  ClosestFeature,
  ContentsDao,
  ContentsIdDao,
  Constraint,
  Constraints,
  ConstraintType,
  Context,
  CrsWktExtension,
  DataColumnConstraints,
  DataColumnConstraintsDao,
  DataColumns,
  DataColumnsDao,
  DBAdapter,
  DublinCoreMetadata,
  DublinCoreType,
  Extensions,
  FeatureColumn,
  FeatureDrawType,
  FeaturePaint,
  FeatureStyle,
  FeatureStyleExtension,
  FeatureStyles,
  FeatureTable,
  FeatureTableIndex,
  FeatureTableReader,
  FeatureTableStyles,
  FeatureTileLink,
  FeatureTileLinkDao,
  FeatureTileLinkKey,
  FeatureTiles,
  FeatureTileTableLinker,
  GeometryColumns,
  GeometryColumnsDao,
  GeoPackageGeometryData,
  GeoPackage,
  GeoPackageConnection,
  GeoPackageDataType,
  GeoPackageTileRetriever,
  GeoPackageManager,
  GeoPackageValidate,
  HtmlCanvasAdapter,
  IconCache,
  Icons,
  IconTable,
  ImageUtils,
  MediaTable,
  Metadata,
  MetadataDao,
  MetadataExtension,
  MetadataReference,
  NumberFeaturesTile,
  OffscreenCanvasAdapter,
  OptionBuilder,
  Paint,
  Projection,
  ProjectionConstants,
  PropertiesExtension,
  PropertiesManager,
  PropertyNames,
  RelatedTablesExtension,
  RTreeIndex,
  RTreeIndexDao,
  setCanvasKitWasmLocateFile,
  setSqljsWasmLocateFile,
  SchemaExtension,
  ShadedFeaturesTile,
  SimpleAttributesTable,
  SpatialReferenceSystem,
  SqliteAdapter,
  SqliteQueryBuilder,
  StyleMappingTable,
  SqljsAdapter,
  Styles,
  StyleTable,
  GeoPackageTableCreator,
  TileCreator,
  TileBoundingBoxUtils,
  TileColumn,
  TileMatrix,
  TileMatrixSet,
  TileScaling,
  TileScalingType,
  TileTable,
  TileUtilities,
  UserColumn,
  UserDao,
  UserMappingTable,
  UserRow,
  UserTable,
  UserTableReader,
  WebPExtension,
  WKB,
};

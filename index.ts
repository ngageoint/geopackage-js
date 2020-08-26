import proj4Defs from './lib/proj4Defs';

import { CrsWktExtension } from './lib/extension/crsWkt';
import { GeoPackageConnection } from './lib/db/geoPackageConnection';
import { WebPExtension } from './lib/extension/webp';
import { RTreeIndex } from './lib/extension/rtree/rtreeIndex';
import { MetadataExtension } from './lib/extension/metadata';
import { DataColumnsDao } from './lib/dataColumns/dataColumnsDao';
import { MediaTable } from './lib/extension/relatedTables/mediaTable';
import { UserMappingTable } from './lib/extension/relatedTables/userMappingTable';
import { DataColumnConstraintsDao } from './lib/dataColumnConstraints/dataColumnConstraintsDao';
import { FeatureColumn } from './lib/features/user/featureColumn';
import { UserColumn } from './lib/user/userColumn';
import { TileColumn } from './lib/tiles/user/tileColumn';
import { DataColumns } from './lib/dataColumns/dataColumns';
import { GeoPackageDataType } from './lib/db/geoPackageDataType';
import { SchemaExtension } from './lib/extension/schema';
import { GeometryColumns } from './lib/features/columns/geometryColumns';
import { MetadataReference } from './lib/metadata/reference/metadataReference';
import { GeometryData } from './lib/geom/geometryData';
import { TableCreator } from './lib/db/tableCreator';
import { DublinCoreType } from './lib/extension/relatedTables/dublinCoreType';
import { BoundingBox } from './lib/boundingBox';
import { GeoPackageAPI } from './lib/api';
import { Metadata } from './lib/metadata/metadata';
import { FeatureTableStyles } from './lib/extension/style/featureTableStyles';
import { TileScaling } from './lib/extension/scale/tileScaling';
import { TileScalingType } from './lib/extension/scale/tileScalingType';
import { FeatureTiles } from './lib/tiles/features';
import { NumberFeaturesTile } from './lib/tiles/features/custom/numberFeaturesTile';
import { ShadedFeaturesTile } from './lib/tiles/features/custom/shadedFeaturesTile';
import { GeoPackageTileRetriever } from './lib/tiles/retriever';
import TileUtilities from './lib/tiles/creator/tileUtilities';
import { ClosestFeature, GeoPackage } from './lib/geoPackage';
import { ContentsDao } from './lib/core/contents/contentsDao';
import { TileMatrixSet } from './lib/tiles/matrixset/tileMatrixSet';
import { TileMatrix } from './lib/tiles/matrix/tileMatrix';
import { TileBoundingBoxUtils } from './lib/tiles/tileBoundingBoxUtils';
import { GeometryType } from './lib/features/user/geometryType';
import { Constraints } from './lib/db/table/constraints';
import { Constraint } from './lib/db/table/constraint';

export {
  proj4Defs,
  GeoPackageAPI,
  GeoPackage,
  GeoPackageTileRetriever,
  GeoPackageConnection,
  TableCreator,
  MediaTable,
  UserMappingTable,
  DublinCoreType,
  TileColumn,
  TileUtilities,
  FeatureColumn,
  UserColumn,
  GeometryColumns,
  GeometryData,
  DataColumns,
  Metadata,
  MetadataReference,
  RTreeIndex,
  CrsWktExtension,
  SchemaExtension,
  MetadataExtension,
  WebPExtension,
  DataColumnsDao,
  DataColumnConstraintsDao,
  FeatureTableStyles,
  FeatureTiles,
  NumberFeaturesTile,
  ShadedFeaturesTile,
  BoundingBox,
  GeoPackageDataType,
  ClosestFeature,
  TileScaling,
  TileScalingType,
  ContentsDao,
  TileMatrixSet,
  TileMatrix,
  TileBoundingBoxUtils,
  GeometryType,
  Constraints,
  Constraint,
};

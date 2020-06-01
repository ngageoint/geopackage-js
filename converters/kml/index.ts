import {
  GeoPackage,
  GeoPackageAPI,
  FeatureColumn,
  GeometryColumns,
  DataTypes,
  BoundingBox,
} from '@ngageoint/geopackage';
import fs from 'fs';
import path from 'path';
import bbox from '@turf/bbox';

const xmlStream = require('xml-stream');

export interface KMLConverterOptions {
  append?: boolean;
  geoPackage?: GeoPackage | string;
  srsNumber?: number;
 tableName?: string;
  geoJson?: any;
}

export class KMLToGeoPackage {
  constructor(private options?: KMLToGeoPackage) {}

  async convertKMLToGeoPackage(
    kml: any, 
    geopackage: GeoPackage,
    tableName: string
  ): Promise<GeoPackage> {
    console.log("Hello")
  }

  async
  
}

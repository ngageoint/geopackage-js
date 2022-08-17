import { ProjectionConstants } from '@ngageoint/projections-js';

export class SpatialReferenceSystemConstants {
  public static readonly WEB_MERCATOR_SRS_ID = ProjectionConstants.EPSG_WEB_MERCATOR;
  public static readonly WORLD_GEODETIC_SYSTEM_SRS_ID = ProjectionConstants.EPSG_WORLD_GEODETIC_SYSTEM;
  public static readonly UNDEFINED_CARTESIAN_SRS_ID = ProjectionConstants.UNDEFINED_CARTESIAN;
  public static readonly UNDEFINED_GEOGRAPHIC_SRS_ID = ProjectionConstants.UNDEFINED_GEOGRAPHIC;
  public static readonly WGS84_3D_SRS_ID = 4979;
  public static readonly WEB_MERCATOR_DEFINITION_12_063 =
    'PROJCS["WGS 84 / Pseudo-Mercator",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]],PROJECTION["Mercator_1SP"],PARAMETER["central_meridian",0],PARAMETER["scale_factor",1],PARAMETER["false_easting",0],PARAMETER["false_northing",0],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AXIS["X",EAST],AXIS["Y",NORTH],EXTENSION["PROJ4","+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs"],AUTHORITY["EPSG","3857"]]';
  public static readonly WORLD_GEODETIC_DEFINITION_12_063 =
    'GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]]';
  public static readonly UNDEFINED_CARTESIAN_DEFINITION_12_063 = 'undefined';
  public static readonly UNDEFINED_GEOGRAPHIC_DEFINITION_12_063 = 'undefined';
  public static readonly WGS84_3D_DEFINITION_12_063 = 'GEOGCS["WGS 84",DATUM["World Geodetic System 1984",SPHEROID["WGS 84",6378137.0,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0.0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.017453292519943295],AXIS["Geodetic latitude",NORTH],AXIS["Geodetic longitude",EAST],AXIS["Ellipsoidal height",UP],AUTHORITY["EPSG","4979"]]';
}

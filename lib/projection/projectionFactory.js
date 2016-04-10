/**
 * ProjectionFactory module.
 * @module projection/projectionFactory
 */

//NSString * const GPKG_PROJ_TO_METER_PATTERN = @"\\+to_meter=(\\S+)";

var projections = {};
/**
 * Get the projection with the epsg number
 * @param  {Number} epsg epsg code
 */
module.exports.getProjection = function(epsg) {
  var projection = projections[epsg];
  if(!projection) {

  }

  // if(projections == nil){
  //     projections = [[NSMutableDictionary alloc] init];
  // }
  //
  // GPKGProjection * projection = [projections objectForKey:epsg];
  //
  // if(projection == nil){
  //
  //     NSString * parameters = [GPKGProjectionRetriever getProjectionWithNumber:epsg];
  //
  //     projPJ crs = pj_init_plus([parameters UTF8String]);
  //     if(crs == nil){
  //         [NSException raise:@"Projection Creation Failed" format:@"Failed to create projection for EPSG %@ with parameters: '%@'. Error: %d", epsg, parameters, pj_errno];
  //     }
  //
  //     NSDecimalNumber * toMeters = [self getToMetersFromParameters:parameters];
  //
  //     projection = [[GPKGProjection alloc] initWithEpsg:epsg andCrs:crs andToMeters:toMeters];
  //
  //     [projections setObject:projection forKey:epsg];
  // }

  return projection;
}

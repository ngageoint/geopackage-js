/**
 * Subset of Tags that a KML File can have.
 * Defined as const to prevent spelling/capitalization issues.
 */

/**
 * Notes:
 * If a Tag's name starts with a capital letter then it can have tags within it.
 * If a Tag's name starts with a lower case letter then it can only have a primitive type within it.
 */
// TAGS

// High Level Descriptions

/**
 * ### Not Currently Supported
 * Distance of the camera from the earth's surface, in meters.
 * Interpreted according to the Camera's <altitudeMode> or <gx:altitudeMode>.
 */
export const ALTITUDE_TAG = 'altitude';

/**
 * How linestring or polygons work.
 * Any altitude value should be accompanied by an <altitudeMode> element, which tells Google Earth how to read the altitude value. Altitudes can be measured:
 *
 * from the surface of the Earth (relativeToGround), above sea level (absolute),
 * or from the bottom of major bodies of water (relativeToSeaFloor).
 * It can also be ignored (clampToGround and clampToSeaFloor)
 *
 * https://developers.google.com/kml/documentation/altitudemode
 */
export const ALTITUDE_MODE_TAG = 'altitudeMode';

/**
 * Specifies how the description balloon for placemarks is drawn. The <bgColor>, if specified, is used as the background color of the balloon. See <Feature> for a diagram illustrating how the default description balloon appears in Google Earth.
 */
export const BALLOON_STYLE_TAG = 'BalloonStyle';

/**
 * ### Not Supported
 *
 * Defines the virtual camera that views the scene. This element defines the position of the camera relative to the Earth's surface as well as the viewing direction of the camera. The camera position is defined by <longitude>, <latitude>, <altitude>, and either <altitudeMode> or <gx:altitudeMode>. The viewing direction of the camera is defined by <heading>, <tilt>, and <roll>. <Camera> can be a child element of any Feature or of <NetworkLinkControl>. A parent element cannot contain both a <Camera> and a <LookAt> at the same time.
 *
 * <Camera> provides full six-degrees-of-freedom control over the view, so you can position the Camera in space and then rotate it around the X, Y, and Z axes. Most importantly, you can tilt the camera view so that you're looking above the horizon into the sky.
 *
 * <Camera> can also contain a TimePrimitive (<gx:TimeSpan> or <gx:TimeStamp>). Time values in Camera affect historical imagery, sunlight, and the display of time-stamped features. For more information, read Time with AbstractViews in the Time and Animation chapter of the Developer's Guide.
 *
 * #### Defining a View
 * Within a Feature or <NetworkLinkControl>, use either a <Camera> or a <LookAt> object (but not both in the same object). The <Camera> object defines the viewpoint in terms of the viewer's position and orientation. The <Camera> object allows you to specify a view that is not on the Earth's surface. The <LookAt> object defines the viewpoint in terms of what is being viewed. The <LookAt> object is more limited in scope than <Camera> and generally requires that the view direction intersect the Earth's surface.
 *
 * The following diagram shows the X, Y, and Z axes, which are attached to the virtual camera.
 *
 * The X axis points toward the right of the camera and is called the right vector.
 *
 * The Y axis defines the "up" direction relative to the screen and is called the up vector.
 *
 * The Z axis points from the center of the screen toward the eye point. The camera looks down the −Z axis, which is called the view vector.
 */
export const CAMERA_TAG = 'Camera';

/**
 * Color and opacity (alpha) values are expressed in hexadecimal notation.
 * The range of values for any one color is 0 to 255 (00 to ff).
 * For alpha, 00 is fully transparent and ff is fully opaque.
 * The order of expression is aabbggrr, where aa=alpha (00 to ff);
 * bb=blue (00 to ff); gg=green (00 to ff); rr=red (00 to ff).
 * For example, if you want to apply a blue color with 50 percent opacity to an overlay,
 * you would specify the following:
 * <color>7fff0000</color>, where alpha=0x7f, blue=0xff, green=0x00, and red=0x00.
 */
export const COLOR_TAG = 'color';

/**
 * ### A Document is a container for features and styles.
 *
 * This element is required if your KML file uses shared styles. It is recommended that you use shared styles, which require the following steps:
 * Define all Styles in a Document. Assign a unique ID to each Style.
 * Within a given Feature or StyleMap, reference the Style's ID using a <styleUrl> element.
 * Note that shared styles are not inherited by the Features in the Document.
 * Each Feature must explicitly reference the styles it uses in a <styleUrl> element.
 * For a Style that applies to a Document (such as ListStyle), the Document itself must explicitly reference the <styleUrl>.
 *
 * https://developers.google.com/kml/documentation/kmlreference#document
 */
export const DOCUMENT_TAG = 'Document';

/**
 * ### A Folder is used to arrange other Features hierarchically
 * (Folders, Placemarks, NetworkLinks, or Overlays).
 * A Feature is visible only if it and all its ancestors are visible.
 */
export const FOLDER_TAG = 'Folder';

/**
 * This element draws an image overlay draped onto the terrain.
 *
 * The <href> child of <Icon> specifies the image to be used as the overlay.
 * This file can be either on a local file system or on a web server.
 * If this element is omitted or contains no <href>, a rectangle is drawn using the color and LatLonBox bounds defined by the ground overlay.
 *
 * https://developers.google.com/kml/documentation/kmlreference#geometry
 */
export const GROUND_OVERLAY_TAG = 'GroundOverlay';

/**
 * ### Defines an image associated with an Icon style or overlay.
 *
 * The required <href> child element defines the location of the image to be used as the overlay or as the icon for the placemark.
 * This location can either be on a local file system or a remote web server.
 *
 * https://developers.google.com/kml/documentation/kmlreference#icon
 */
export const ICON_TAG = 'Icon';

/**
 * The root element of a KML file. This element is required.
 * It follows the xml declaration at the beginning of the file.
 * The hint attribute is used as a signal to Google Earth to display the file as celestial data.
 *
 * The <kml> element may also include the namespace for any external XML schemas that are referenced within the file.
 *
 * A basic <kml> element contains 0 or 1 Feature and 0 or 1 NetworkLinkControl:
 */
export const KML_TAG = 'kml';

/**
 * Specifies how the <name> of a Feature is drawn in the 3D viewer. A custom color, color mode, and scale for the label (name) can be specified.
 */
export const LABEL_STYLE_TAG = 'LabelStyle';

/**
 * ### Defines a connected set of line segments.
 * Use <LineStyle> to specify the color, color mode, and width of the line.
 * When a LineString is extruded, the line is extended to the ground, forming a polygon that looks somewhat like a wall or fence.
 * For extruded LineStrings, the line itself uses the current LineStyle, and the extrusion uses the current PolyStyle. See the KML Tutorial for examples of LineStrings (or paths).
 *
 * https://developers.google.com/kml/documentation/kmlreference#linestring
 */
export const LINE_STRING_TAG = 'LineString';

/**
 * ### Specifies the drawing style (color, color mode, and line width) for all line geometry.
 *
 * Line geometry includes the outlines of outlined polygons and the extruded "tether" of Placemark icons (if extrusion is enabled).
 *
 * https://developers.google.com/kml/documentation/kmlreference#linestyle
 */
export const LINE_STYLE_TAG = 'LineStyle';

/**
 * <Link> specifies the location of any of the following:

KML files fetched by network links
Image files used in any Overlay (the <Icon> element specifies the image in an Overlay; <Icon> has the same fields as <Link>)
Model files used in the <Model> element
The file is conditionally loaded and refreshed, depending on the refresh parameters supplied here. Two different sets of refresh parameters can be specified: one set is based on time (<refreshMode> and <refreshInterval>) and one is based on the current "camera" view (<viewRefreshMode> and <viewRefreshTime>). In addition, Link specifies whether to scale the bounding box parameters that are sent to the server (<viewBoundScale> and provides a set of optional viewing parameters that can be sent to the server (<viewFormat>) as well as a set of optional parameters containing version and language information.

When a file is fetched, the URL that is sent to the server is composed of three pieces of information:

the href (Hypertext Reference) that specifies the file to load.
an arbitrary format string that is created from (a) parameters that you specify in the <viewFormat> element or (b) bounding box parameters (this is the default and is used if no <viewFormat> element is included in the file).
a second format string that is specified in the <httpQuery> element.
If the file specified in <href> is a local file, the <viewFormat> and <httpQuery> elements are not used.

The <Link> element replaces the <Url> element of <NetworkLink> contained in earlier KML releases and adds functionality for the <Region> element (introduced in KML 2.1). In Google Earth releases 3.0 and earlier, the <Link> element is ignored.
 */
export const LINK_TAG = 'Link';

/**
 * Specifies how a Feature is displayed in the list view. The list view is a hierarchy of containers and children; in Google Earth, this is the Places panel.
 */
export const LIST_STYLE_TAG = 'ListStyle';

/**
 * Not Supported
 * Defines a virtual camera that is associated with any element derived from Feature. The LookAt element positions the "camera" in relation to the object that is being viewed. In Google Earth, the view "flies to" this LookAt viewpoint when the user double-clicks an item in the Places panel or double-clicks an icon in the 3D viewer.
 */
export const LOOK_AT_TAG = 'LookAt';

/**
 * A 3D object described in a COLLADA file (referenced in the <Link> tag). COLLADA files have a .dae file extension. Models are created in their own coordinate space and then located, positioned, and scaled in Google Earth. See the "Topics in KML" page on Models for more detail.

Google Earth supports the COLLADA common profile, with the following exceptions:

Google Earth supports only triangles and lines as primitive types. The maximum number of triangles allowed is 21845.
Google Earth does not support animation or skinning.
Google Earth does not support external geometry references.
 */
export const MODEL_TAG = 'Model';

/**
 * ### A container for zero or more geometry primitives associated with the same feature.
 *
 * https://developers.google.com/kml/documentation/kmlreference#multigeometry
 */
export const MULTI_GEOMETRY_TAG = 'MultiGeometry';

/**
 * A href (url) to a separate KML file that is added as part of the current KML.
 * Used to provide dynamic data into the KML.
 */
export const NETWORK_LINK_TAG = 'NetworkLink';

/**
 * Controls the behavior of files fetched by a <NetworkLink>.
 */
export const NETWORK_LINK_CONTROL_TAG = 'NetworkLinkControl';

/**
 * The <PhotoOverlay> element allows you to geographically locate a photograph on the Earth and to specify viewing parameters for this PhotoOverlay. The PhotoOverlay can be a simple 2D rectangle, a partial or full cylinder, or a sphere (for spherical panoramas). The overlay is placed at the specified location and oriented toward the viewpoint.
 *
 * Because <PhotoOverlay> is derived from <Feature>, it can contain one of the two elements derived from <AbstractView>—either <Camera> or <LookAt>. The Camera (or LookAt) specifies a viewpoint and a viewing direction (also referred to as a view vector). The PhotoOverlay is positioned in relation to the viewpoint. Specifically, the plane of a 2D rectangular image is orthogonal (at right angles to) the view vector. The normal of this plane—that is, its front, which is the part with the photo—is oriented toward the viewpoint.
 *
 * The URL for the PhotoOverlay image is specified in the <Icon> tag, which is inherited from <Overlay>. The <Icon> tag must contain an <href> element that specifies the image file to use for the PhotoOverlay. In the case of a very large image, the <href> is a special URL that indexes into a pyramid of images of varying resolutions (see ImagePyramid).
 */
export const PHOTO_OVERLAY_TAG = 'PhotoOverlay';

/**
 * ### A Placemark is a Feature with an associated Geometry.
 * In Google Earth, a Placemark appears as a list item in the Places panel.
 * A Placemark with a Point has an icon associated with it that marks a point on the Earth in the 3D viewer.
 * (In the Google Earth 3D viewer, a Point Placemark is the only object you can click or roll over.
 *  Other Geometry objects do not have an icon in the 3D viewer.
 *  To give the user something to click in the 3D viewer, you would need to create a MultiGeometry object that contains both a Point and the other Geometry object.)
 *
 * https://developers.google.com/kml/documentation/kmlreference#placemark
 */
export const PLACEMARK_TAG = 'Placemark';

/**
 * A geographic location defined by longitude, latitude, and (optional) altitude. When a Point is contained by a Placemark, the point itself determines the position of the Placemark's name and icon. When a Point is extruded, it is connected to the ground with a line. This "tether" uses the current LineStyle.
 */
export const POINT_TAG = 'Point';

/**
 * A Polygon is defined by an outer boundary and 0 or more inner boundaries. The boundaries, in turn, are defined by LinearRings. When a Polygon is extruded, its boundaries are connected to the ground to form additional polygons, which gives the appearance of a building or a box. Extruded Polygons use <PolyStyle> for their color, color mode, and fill.

The <coordinates> for polygons must be specified in counterclockwise order. Polygons follow the "right-hand rule," which states that if you place the fingers of your right hand in the direction in which the coordinates are specified, your thumb points in the general direction of the geometric normal for the polygon. (In 3D graphics, the geometric normal is used for lighting and points away from the front face of the polygon.) Since Google Earth fills only the front face of polygons, you will achieve the desired effect only when the coordinates are specified in the proper order. Otherwise, the polygon will be gray.
 */
export const POLYGON_TAG = 'Polygon';

/**
 * ### Specifies the drawing style for all polygons
 *
 * including polygon extrusions (which look like the walls of buildings) and line extrusions (which look like solid fences).
 *
 * https://developers.google.com/kml/documentation/kmlreference#polystyle
 */
export const POLY_STYLE_TAG = 'PolyStyle';

/**
 * A region contains a bounding box (<LatLonAltBox>) that describes an area of interest defined by geographic coordinates and altitudes. In addition, a Region contains an LOD (level of detail) extent (<Lod>) that defines a validity range of the associated Region in terms of projected screen size. A Region is said to be "active" when the bounding box is within the user's view and the LOD requirements are met. Objects associated with a Region are drawn only when the Region is active. When the <viewRefreshMode> is onRegion, the Link or Icon is loaded only when the Region is active. See the "Topics in KML" page on Regions for more details. In a Container or NetworkLink hierarchy, this calculation uses the Region that is the closest ancestor in the hierarchy.
 */
export const REGION_TAG = 'Region';

/**
 * Specifies a custom KML schema that is used to add custom data to KML Features. The "id" attribute is required and must be unique within the KML file. <Schema> is always a child of <Document>.
 */
export const SCHEMA_TAG = 'Schema';

/**
 * This element draws an image overlay fixed to the screen. Sample uses for ScreenOverlays are compasses, logos, and heads-up displays. ScreenOverlay sizing is determined by the <size> element. Positioning of the overlay is handled by mapping a point in the image specified by <overlayXY> to a point on the screen specified by <screenXY>. Then the image is rotated by <rotation> degrees about a point relative to the screen specified by <rotationXY>.
 *
 * The <href> child of <Icon> specifies the image to be used as the overlay. This file can be either on a local file system or on a web server. If this element is omitted or contains no <href>, a rectangle is drawn using the color and size defined by the screen overlay.
 */
export const SCREEN_OVERLAY_TAG = 'ScreenOverlay';

/**
 * ### A Style defines an addressable style group
 *
 * that can be referenced by StyleMaps and Features.
 * Styles affect how Geometry is presented in the 3D viewer and how Features appear in the Places panel of the List view.
 * Shared styles are collected in a <Document> and must have an id defined for them so that they can be referenced by the individual Features that use them.
 *
 * Use an id to refer to the style from a <styleUrl>.
 *
 * https://developers.google.com/kml/documentation/kmlreference#style
 */
export const STYLE_TAG = 'Style';

/**
 * ### A <StyleMap> maps between two different Styles.
 *
 * Typically a <StyleMap> element is used to provide separate normal and highlighted styles for a placemark, so that the highlighted version appears when the user mouses over the icon in Google Earth.
 *
 * https://developers.google.com/kml/documentation/kmlreference#stylemap
 */
export const STYLE_MAP_TAG = 'StyleMap';

/**
 * ### URL of a <Style> or <StyleMap> defined in a Document.
 *
 * If the style is in the same file, use a # reference.
 *
 * If the style is defined in an external file, use a full URL along with # referencing
 *
 * https://developers.google.com/kml/documentation/kmlreference#styleurl
 */
export const STYLE_URL_TAG = 'styleUrl';

/**
 * Represents an extent in time bounded by begin and end dateTimes.
 *
 * If <begin> or <end> is missing, then that end of the period is unbounded (see Example below).
 *
 * The dateTime is defined according to XML Schema time (see XML Schema Part 2: Datatypes Second Edition). The value can be expressed as yyyy-mm-ddThh:mm:ss.ssszzzzzz, where T is the separator between the date and the time, and the time zone is either Z (for UTC) or zzzzzz, which represents ±hh:mm in relation to UTC. Additionally, the value can be expressed as a date only. See <TimeStamp> for examples.
 */
export const TIME_SPAN_TAG = 'TimeSpan';

/**
 * Represents a single moment in time. This is a simple element and contains no children. Its value is a dateTime, specified in XML time (see XML Schema Part 2: Datatypes Second Edition). The precision of the TimeStamp is dictated by the dateTime value in the <when> element.
 */
export const TIME_STAMP_TAG = 'TimeStamp';

/**
 * Note: This element was deprecated in KML Release 2.1 and is replaced by <Link>, which provides the additional functionality of Regions. The <Url> tag will still work in Google Earth, but use of the newer <Link> tag is encouraged.
 *
 * Use this element to set the location of the link to the KML file, to define the refresh options for the server and viewer changes, and to populate a variable to return useful client information to the server.
 */
export const URL_TAG = 'Url';

// Usage Level Descriptions
export const ADDRESS_TAG = 'address';
export const ADDRESS_DETAILS_TAG = 'AddressDetails';
export const ATOM_AUTHOR_TAG = 'atom:author';
export const ATOM_LINK_TAG = 'atom:link';
export const BEGIN_TAG = 'begin';
export const BG_COLOR_TAG = 'bgColor';
export const BOTTOM_FOV_TAG = 'bottomFov';
export const CHANGE_TAG = 'Change';
export const COLOR_MODE_TAG = 'colorMode';
export const COLOR_STYLE_TAG = 'ColorStyle';
export const COOKIE_TAG = 'cookie';
export const COORDINATES_TAG = 'coordinates';
export const CREATE_TAG = 'Create';
export const DATA_TAG = 'Data';
export const DELETE_TAG = 'Delete'
export const DESCRIPTION_TAG = 'description';
export const DISPLAY_MODE_TAG = 'displayMode';
export const DISPLAY_NAME_TAG = 'displayName';
export const DRAW_ORDER_TAG = 'drawOrder';
export const EAST_TAG = 'east';
export const END_TAG = 'end';
export const EXPIRES_TAG = 'expires';
export const EXTENDED_DATA_TAG = 'ExtendedData';
export const EXTRUDE_TAG = 'extrude';
export const FLY_TO_VIEW_TAG = 'flyToView';
export const GEOM_COLOR_TAG = 'geomColor';
export const GRID_ORIGIN_TAG = 'gridOrigin';
export const HEADING_TAG = 'heading';
export const HOTSPOT_TAG = 'hotSpot';
export const HREF_TAG = 'href';
export const HTTP_QUERY_TAG = 'httpQuery';
export const IMAGE_PYRAMID_TAG = 'ImagePyramid';
export const INNER_BOUNDARY_TAG = 'innerBoundaryIs';
export const ITEM_ICON_HREF = 'href';
export const ITEM_ICON_TAG = 'itemIcon';
export const KEY_TAG = 'key';
export const LAT_LON_ALT_BOX_TAG = 'LatLonAltBox';
export const LAT_LON_BOX_TAG = 'LatLonBox';
export const LATITUDE_TAG = 'latitude';
export const LEFT_FOV_TAG = 'leftFov';
export const LEVEL_OF_DETAIL_TAG = 'Lod';
export const LINK_DESCRIPTION_TAG = 'linkDescription';
export const LINK_NAME_TAG = 'linkName';
export const LINK_SNIPPET_TAG = 'linkSnippet';
export const LIST_ITEM_TYPE_TAG = 'listItemType';
export const LONGITUDE_TAG = 'longitude';
export const MAX_ALTITUDE_TAG = 'maxAltitude';
export const MAX_FADE_EXTENT = 'maxFadeExtent';
export const MAX_HEIGHT_TAG = 'maxHeight';
export const MAX_LOD_PIXELS_TAG = 'maxLodPixels';
export const MAX_SESSION_LENGTH_TAG = 'maxSessionLength';
export const MAX_WIDTH_TAG = 'maxWidth';
export const MESSAGE_TAG = 'message';
export const META_DATA_TAG = 'Metadata';
export const MIN_ALTITUDE_TAG = 'minAltitude';
export const MIN_FADE_EXTENT = 'minFadeExtent';
export const MIN_LOD_PIXELS_TAG = 'minLodPixels';
export const MIN_REFRESH_PERIOD_TAG = 'minRefreshPeriod';
export const NAME_TAG = 'name';
export const NEAR_TAG = 'near';
export const NORTH_TAG = 'north';
export const OPEN_TAG = 'open';
export const OPTION_TAG = 'option';
export const ORIENTATION_TAG = 'Orientation';
export const OUTER_BOUNDARY_TAG = 'outerBoundaryIs';
export const PAIR_TAG = 'Pair';
export const PHONE_NUMBER_TAG = 'phoneNumber';
export const REFRESH_INTERVAL_TAG = 'viewRefreshMode';
export const REFRESH_MODE_TAG = 'refreshMode';
export const REFRESH_VISIBILITY_TAG = 'refreshVisibility';
export const RIGHT_FOV_TAG = 'rightFov';
export const ROLL_TAG = 'roll';
export const ROTATION_TAG = 'rotation';
export const SCALE_TAG = 'scale';
export const SCHEMA_DATA_TAG = 'SchemaData';
export const SHAPE_TAG = 'shape';
export const SIMPLE_DATA_TAG = 'SimpleData';
export const SIMPLE_FIELD_TAG = 'SimpleField';
export const SNIPPET_TAG = 'Snippet';
export const SOUTH_TAG = 'south';
export const STATE_TAG = 'state';
export const TARGET_HREF_TAG = 'targetHref';
export const TESSELLATE_TAG = 'tessellate';
export const TEXT_COLOR_TAG = 'textColor';
export const TEXT_TAG = 'text';
export const TILE_SIZE_TAG = 'tileSize';
export const TILT_TAG = 'tilt';
export const TOP_FOV_TAG = 'topFov';
export const UPDATE_TAG = 'Update';
export const VALUE_TAG = 'value';
export const VIEW_BOUND_SCALE_TAG = 'viewBoundScale';
export const VIEW_FORMAT_TAG = 'viewFormat';
export const VIEW_REFRESH_TIME_TAG = 'viewRefreshTime';
export const VIEW_VOLUME_TAG = 'ViewVolume';
export const VISIBILITY_TAG = 'visibility';
export const WEST_TAG = 'west';
export const WHEN_TAG = 'when';
export const WIDTH_TAG = 'width';
export const XAL_ADDRESS_DETAILS_TAG = 'xal:AddressDetails';

// Redefined
export const LIST_STYLE_BG_COLOR = BG_COLOR_TAG;
export const LOD_TAG = LEVEL_OF_DETAIL_TAG;

// Google Extended Descriptions

/**
 * How linestring or polygons work.
 * Any altitude value should be accompanied by an <altitudeMode> element, which tells Google Earth how to read the altitude value. Altitudes can be measured:
 *
 * from the surface of the Earth (relativeToGround), above sea level (absolute),
 * or from the bottom of major bodies of water (relativeToSeaFloor).
 * It can also be ignored (clampToGround and clampToSeaFloor)
 *
 * https://developers.google.com/kml/documentation/altitudemode
 */
export const GX_ALTITUDE_MODE_TAG = 'gx:altitudeMode';

export const GX_ALTITUDE_OFFSET_TAG = 'gx:altitudeOffset';
export const GX_ANGLES_TAG = 'gx:angles';
export const GX_ANIMATED_UPDATE_TAG = 'gx:AnimatedUpdate';
export const GX_BALLOON_VISIBILITY_TAG = 'gx:balloonVisibility';
export const GX_COORD_TAG = 'gx:coord';
export const GX_DELAY_START_TAG = 'gx:delayedStart';
export const GX_DURATION_TAG = 'gx:duration';
export const GX_FLY_TO_TAG = 'gx:FlyTo';
export const GX_FLY_TO_MODE_TAG = 'gx:FlyToMode';
export const GX_H_TAG = 'gx:h';
export const GX_HORIZ_FOV_TAG = 'gx:horizFov';
export const GX_HORIZONTAL_FOV_TAG = GX_HORIZ_FOV_TAG;
export const GX_LABEL_VISIBILITY_TAG = 'gx:labelVisibility';
export const GX_LAT_LON_QUAD_TAG = 'gx:LatLonQuad';
export const GX_MULTI_TRACK_TAG = 'gx:MultiTrack';
export const GX_OUTER_COLOR_TAG = 'gx:outerColor';
export const GX_OUTER_WIDTH_TAG = 'gx:outerWidth';
export const GX_PHYSICAL_WIDTH_TAG = 'gx:physicalWidth';
export const GX_PLAYLIST_TAG = 'gx:Playlist';
export const GX_SOUND_CUE = 'gx:SoundCue';
export const GX_TIME_SPAN_TAG = 'gx:TimeSpan';
export const GX_TIME_STAMP_TAG = 'gx:TimeStamp';
export const GX_TOUR_TAG = 'gx:Tour';
export const GX_TRACK_TAG = 'gx:Track';
export const GX_VIEWER_OPTIONS_TAG = 'gx:ViewerOptions';
export const GX_W_TAG = 'gx:w';
export const GX_WAIT_TAG = 'gx:wait';
export const GX_X_TAG = 'gx:x';
export const GX_Y_TAG = 'gx:y';

// Descriptors

export const MAX_LINES_DESCRIPTOR = 'maxLines';
export const X_COMPONENT_DESCRIPTOR = 'x';
export const X_UNITS_DESCRIPTOR = 'xunits';
export const Y_COMPONENT_DESCRIPTOR = 'y';
export const Y_UNITS_DESCRIPTOR = 'yunits';

// Selectors XML Stream

export const XML_STREAM_CHILDREN_SELECTOR = '$children';
export const XML_STREAM_NAME_SELECTOR = '$name';
export const XML_STREAM_TEXT_SELECTOR = '$text';

// Type collections
// Enums
export enum SIMPLE_FIELD_TYPES {
  string = 'string',
  int = 'int',
  uint = 'uint',
  short = 'short',
  ushort = 'ushort',
  float = 'float',
  double = 'double',
  bool = 'bool',
}
export enum SHAPE_TYPES {
  rectangle = 'rectangle',
  cylinder = 'cylinder',
  sphere = 'sphere',
}
export enum ALTITUDE_MODES {
  absolute = 'absolute',
  clampToGround = 'clampToGround',
  clampToSeaFloor = 'clampToSeaFloor',
  relativeToGround = 'relativeToGround',
  relativeToSeaFloor = 'relativeToSeaFloor',
}
export enum DISPLAY_MODES {
  default = 'default',
  hide = 'hide',
}

export enum OPTIONS_NAME {
  streetview = 'streetview',
  historicalimagery = 'historicalimagery',
  sunlight = 'sunlight',
  groundnavigation = 'groundnavigation',
}
export enum COLOR_MODES {
  normal = 'normal',
  random = 'random',
}

/**
 * This is an abstract element and cannot be used directly in a KML file. The following diagram shows how some of a Feature's elements appear in Google Earth.
 */
export const FEATURE_TAGS = {
  Document: DOCUMENT_TAG,
  Folder: FOLDER_TAG,
  NetworkLink: NETWORK_LINK_TAG,
  Placemark: PLACEMARK_TAG,
  GroundOverlay: GROUND_OVERLAY_TAG,
  PhotoOverlay: PHOTO_OVERLAY_TAG,
  ScreenOverlay: SCREEN_OVERLAY_TAG,
};

/**
 * This is an abstract element and cannot be used directly in a KML file. This element is extended by the <Camera> and <LookAt> elements.
 */
export const ABSTRACT_VIEW_TAGS = {
  Camera: CAMERA_TAG,
  LookAt: LOOK_AT_TAG,
};
export const TIME_PRIMITIVE_TAGS = {
  TimeStamp: TIME_STAMP_TAG,
  TimeSpan: TIME_SPAN_TAG,
};
export const ABSTRACT_VIEW_CHILDREN_TAGS = {
  TimePrimitive: TIME_PRIMITIVE_TAGS,
  'gx:ViewerOptions': GX_VIEWER_OPTIONS_TAG,
};

/**
 * This is an abstract element and cannot be used directly in a KML file. It is the base type for the <Style> and <StyleMap> elements. The StyleMap element selects a style based on the current mode of the Placemark. An element derived from StyleSelector is uniquely identified by its id and its url.
 */
export const STYLE_SELECTOR_TAGS = {
  Style: STYLE_TAG,
  StyleMap: STYLE_MAP_TAG,
};

export const REGION_CHILDREN_TAGS = {
  LatLonAltBox: LAT_LON_BOX_TAG,
  Lod: LEVEL_OF_DETAIL_TAG,
};

export const LAT_LON_ALT_BOX_CHILDREN_TAGS = {
  /**
   * Possible values for <altitudeMode> are clampToGround, relativeToGround, and absolute. Possible values for <gx:altitudeMode> are clampToSeaFloor and relativeToSeaFloor. Also see <LatLonBox>.
   */
  altitudeMode: ALTITUDE_MODE_TAG,
  /**
   * Possible values for <altitudeMode> are clampToGround, relativeToGround, and absolute. Possible values for <gx:altitudeMode> are clampToSeaFloor and relativeToSeaFloor. Also see <LatLonBox>.
   */
  'gx:altitudeMode': GX_ALTITUDE_MODE_TAG,
  /**
   * Specified in meters (and is affected by the altitude mode specification).
   */
  minAltitude: MIN_ALTITUDE_TAG,
  /**
   * Specified in meters (and is affected by the altitude mode specification).
   */
  maxAltitude: MAX_ALTITUDE_TAG,
  /**
   * (required) Specifies the latitude of the north edge of the bounding box, in decimal degrees from 0 to ±90.
   */
  north: NORTH_TAG,
  /**
   * (required) Specifies the latitude of the south edge of the bounding box, in decimal degrees from 0 to ±90.
   */
  south: SOUTH_TAG,
  /**
   * (required) Specifies the longitude of the east edge of the bounding box, in decimal degrees from 0 to ±180.
   */
  east: EAST_TAG,
  /**
   * (required) Specifies the longitude of the west edge of the bounding box, in decimal degrees from 0 to ±180.
   */
  west: WEST_TAG,
};

/**
 * Lod is an abbreviation for Level of Detail. <Lod> describes the size of the projected region on the screen that is required in order for the region to be considered "active." Also specifies the size of the pixel ramp used for fading in (from transparent to opaque) and fading out (from opaque to transparent). See diagram below for a visual representation of these parameters.
 */
export const LOD_CHILDREN_TAGS = {
  /**
   * (required) Defines a square in screen space, with sides of the specified value in pixels. For example, 128 defines a square of 128 x 128 pixels. The region's bounding box must be larger than this square (and smaller than the maxLodPixels square) in order for the Region to be active.
   */
  minLodPixels: MIN_LOD_PIXELS_TAG,
  /**
   * Measurement in screen pixels that represents the maximum limit of the visibility range for a given Region. A value of −1, the default, indicates "active to infinite size."
   */
  maxLodPixels: MAX_LOD_PIXELS_TAG,
  /**
   * Distance over which the geometry fades, from fully opaque to fully transparent. This ramp value, expressed in screen pixels, is applied at the minimum end of the LOD (visibility) limits.
   */
  minFadeExtent: MIN_FADE_EXTENT,
  /**
   * Distance over which the geometry fades, from fully transparent to fully opaque. This ramp value, expressed in screen pixels, is applied at the maximum end of the LOD (visibility) limits.
   */
  maxFadeExtent: MAX_FADE_EXTENT,
};

export const FEATURE_CHILDREN_TAGS = {
  /**
   * User-defined text displayed in the 3D viewer as the label for the object (for example, for a Placemark, Folder, or NetworkLink).
   */
  name: NAME_TAG,
  /**
   * Boolean value. Specifies whether the feature is drawn in the 3D viewer when it is initially loaded. In order for a feature to be visible, the <visibility> tag of all its ancestors must also be set to 1. In the Google Earth List View, each Feature has a checkbox that allows the user to control visibility of the Feature.
   */
  visibility: VISIBILITY_TAG,
  /**
   * Boolean value. Specifies whether a Document or Folder appears closed or open when first loaded into the Places panel. 0=collapsed (the default), 1=expanded. See also <ListStyle>. This element applies only to Document, Folder, and NetworkLink.
   */
  open: OPEN_TAG,
  /**
   * KML 2.2 supports new elements for including data about the author and related website in your KML file. This information is displayed in geo search results, both in Earth browsers such as Google Earth, and in other applications such as Google Maps. The ascription elements used in KML are as follows:

atom:author element - parent element for atom:name
atom:name element - the name of the author
atom:link element - contains the href attribute
href attribute - URL of the web page containing the KML/KMZ file
These elements are defined in the Atom Syndication Format. The complete specification is found at http://atompub.org. (see the sample that follows).

The <atom:author> element is the parent element for <atom:name>, which specifies the author of the KML feature.
   */
  'atom:author': ATOM_AUTHOR_TAG,
  /**
   * Specifies the URL of the website containing this KML or KMZ file. Be sure to include the namespace for this element in any KML file that uses it: xmlns:atom="http://www.w3.org/2005/Atom" (see the sample that follows).
   */
  'atom:link': ATOM_LINK_TAG,
  /**
   * A string value representing an unstructured address written as a standard street, city, state address, and/or as a postal code. You can use the <address> tag to specify the location of a point instead of using latitude and longitude coordinates. (However, if a <Point> is provided, it takes precedence over the <address>.) To find out which locales are supported for this tag in Google Earth, go to the Google Maps Help.
   */
  address: ADDRESS_TAG,
  /**
   * A structured address, formatted as xAL, or eXtensible Address Language, an international standard for address formatting. <xal:AddressDetails> is used by KML for geocoding in Google Maps only. For details, see the Google Maps API documentation. Currently, Google Earth does not use this element; use <address> instead. Be sure to include the namespace for this element in any KML file that uses it: xmlns:xal="urn:oasis:names:tc:ciq:xsdschema:xAL:2.0"
   */
  'xal:AddressDetails': XAL_ADDRESS_DETAILS_TAG,
  /**
   * A string value representing a telephone number. This element is used by Google Maps Mobile only. The industry standard for Java-enabled cellular phones is RFC2806.
   * For more information, see http://www.ietf.org/rfc /rfc2806.txt.
   */
  phoneNumber: PHONE_NUMBER_TAG,
  /**
   * A short description of the feature. In Google Earth, this description is displayed in the Places panel under the name of the feature. If a Snippet is not supplied, the first two lines of the <description> are used. In Google Earth, if a Placemark contains both a description and a Snippet, the <Snippet> appears beneath the Placemark in the Places panel, and the <description> appears in the Placemark's description balloon. This tag does not support HTML markup. <Snippet> has a maxLines attribute, an integer that specifies the maximum number of lines to display.
   */
  Snippet: SNIPPET_TAG,
  /**
   * User-supplied content that appears in the description balloon.

The supported content for the <description> element changed from Google Earth 4.3 to 5.0. Specific information for each version is listed out below, followed by information common to both.

Google Earth 5.0

Google Earth 5.0 (and later) supports plain text content, as well as full HTML and JavaScript, within description balloons. Contents of the description tag are rendered by the WebKit open source web browser engine, and are displayed as they would be in any WebKit-based browser.

General restrictions

Links to local files are generally not allowed. This prevents malicious code from damaging your system or accessing your data. Should you wish to allow access to your local filesystem, select Preferences > Allow access to local files and personal data. Links to image files on the local filesystem are always allowed, if contained within an <img> tag.

Content that has been compressed into a KMZ file can be accessed, even if on the local filesystem.

Cookies are enabled, but for the purposes of the same-origin policy, local content does not share a domain with any other content (including other local content).

HTML

HTML is mostly rendered as it would be in any WebKit browser.

Targets are ignored when included in HTML written directly into the KML; all such links are opened as if the target is set to _blank. Any specified targets are ignored.

HTML that is contained in an iFrame, however, or dynamically generated with JavaScript or DHTML, will use target="_self" as the default. Other targets can be specified and are supported.

The contents of KMZ files, local anchor links, and ;flyto methods cannot be targeted from HTML contained within an iFrame.

If the user specifies width="100%" for the width of an iFrame, then the iFrame's width will be dependent on all the other content in the balloon—it should essentially be ignored while calculating layout size. This rule applies to any other block element inside the balloon as well.

JavaScript

Most JavaScript is supported. Dialog boxes can not be created - functions such as alert() and prompt() will not be displayed. They will, however, be written to the system console, as will other errors and exceptions.

CSS

CSS is allowed. As with CSS in a regular web browser, CSS can be used to style text, page elements, and to control the size and appearance of the description balloon.

Google Earth 4.3

The <description> element supports plain text as well as a subset of HTML formatting elements, including tables (see KML example below). It does not support other web-based technology, such as dynamic page markup (PHP, JSP, ASP), scripting languages (VBScript, Javascript), nor application languages (Java, Python). In Google Earth release 4.2, video is supported. (See Example below.)

Common information

If your description contains no HTML markup, Google Earth attempts to format it, replacing newlines with <br> and wrapping URLs with anchor tags. A valid URL string for the World Wide Web is automatically converted to a hyperlink to that URL (e.g., http://www.google.com). Consequently, you do not need to surround a URL with the <a href="http://.."></a> tags in order to achieve a simple link.

When using HTML to create a hyperlink around a specific word, or when including images in the HTML, you must use HTML entity references or the CDATA element to escape angle brackets, apostrophes, and other special characters. The CDATA element tells the XML parser to ignore special characters used within the brackets. This element takes the form of:

<![CDATA[
  special characters here
]]> 

If you prefer not to use the CDATA element, you can use entity references to replace all the special characters.

<description>
  <![CDATA[
This is an image
<img src="icon.jpg">
  ]]>
</description>

Other Behavior Specified Through Use of the <a> Element

KML supports the use of two attributes within the <a> element: href and type.

The anchor element <a> contains an href attribute that specifies a URL.

If the href is a KML file and has a .kml or .kmz file extension, Google Earth loads that file directly when the user clicks it. If the URL ends with an extension not known to Google Earth (for example, .html), the URL is sent to the browser.

The href can be a fragment URL (that is, a URL with a # sign followed by a KML identifier). When the user clicks a link that includes a fragment URL, by default the browser flies to the Feature whose ID matches the fragment. If the Feature has a LookAt or Camera element, the Feature is viewed from the specified viewpoint.

The behavior can be further specified by appending one of the following three strings to the fragment URL:

;flyto (default) - fly to the Feature
;balloon - open the Feature's balloon but do not fly to the Feature
;balloonFlyto - open the Feature's balloon and fly to the Feature
For example, the following code indicates to open the file CraftsFairs.kml, fly to the Placemark whose ID is "Albuquerque," and open its balloon:

<description>
  <![CDATA[ 
    <a href="http://myServer.com/CraftsFairs.kml#Albuquerque;balloonFlyto">
      One of the Best Art Shows in the West</a>
  ]]>
</description> 

The type attribute is used within the <a> element when the href does not end in .kml or .kmz, but the reference needs to be interpreted in the context of KML. Specify the following:

type="application/vnd.google-earth.kml+xml" 

For example, the following URL uses the type attribute to notify Google Earth that it should attempt to load the file, even though the file extension is .php:

<a href="myserver.com/cgi-bin/generate-kml.php#placemark123"
   type="application/vnd.google-earth.kml+xml">
   */
  description: DESCRIPTION_TAG,
  /**
   * Defines a viewpoint associated with any element derived from Feature. See <Camera> and <LookAt>.
   */
  AbstractView: ABSTRACT_VIEW_TAGS,
  /**
   * Associates this Feature with a period of time (<TimeSpan>) or a point in time (<TimeStamp>).
   */
  TimePrimitive: TIME_PRIMITIVE_TAGS,
  /**
   * URL of a <Style> or <StyleMap> defined in a Document. If the style is in the same file, use a # reference. If the style is defined in an external file, use a full URL along with # referencing.
   */
  styleUrl: STYLE_URL_TAG,
  /**
   * One or more Styles and StyleMaps can be defined to customize the appearance of any element derived from Feature or of the Geometry in a Placemark. (See <BalloonStyle>, <ListStyle>, <StyleSelector>, and the styles derived from <ColorStyle>.) A style defined within a Feature is called an "inline style" and applies only to the Feature that contains it. A style defined as the child of a <Document> is called a "shared style." A shared style must have an id defined for it. This id is referenced by one or more Features within the <Document>. In cases where a style element is defined both in a shared style and in an inline style for a Feature—that is, a Folder, GroundOverlay, NetworkLink, Placemark, or ScreenOverlay—the value for the Feature's inline style takes precedence over the value for the shared style.
   */
  StyleSelector: STYLE_SELECTOR_TAGS,
  /**
   * Features and geometry associated with a Region are drawn only when the Region is active. See <Region>.
   */
  Region: REGION_TAG,
  /**
   * Deprecated us ExtendedData
   */
  Metadata: META_DATA_TAG,
  /**
   * Allows you to add custom data to a KML file. This data can be (1) data that references an external XML schema, (2) untyped data/value pairs, or (3) typed data. A given KML Feature can contain a combination of these types of custom data.
   */
  ExtendedData: EXTENDED_DATA_TAG,
};

/**
 * A Document is a container for features and styles. This element is required if your KML file uses shared styles. It is recommended that you use shared styles, which require the following steps:

Define all Styles in a Document. Assign a unique ID to each Style.
Within a given Feature or StyleMap, reference the Style's ID using a <styleUrl> element.
Note that shared styles are not inherited by the Features in the Document.

Each Feature must explicitly reference the styles it uses in a <styleUrl> element. For a Style that applies to a Document (such as ListStyle), the Document itself must explicitly reference the <styleUrl>. For example:
 */
export const DOCUMENT_CHILDREN_TAGS = {
  inheritedFeatureElements: FEATURE_CHILDREN_TAGS,
  /**
   * 0 or more elements derived from <Schema>
   */
  schemaElements: SCHEMA_TAG,
  /**
   * 0 or more elements derived from <Feature>
   */
  featureElements: FEATURE_TAGS,
};

/**
 * A Folder is used to arrange other Features hierarchically (Folders, Placemarks, NetworkLinks, or Overlays). A Feature is visible only if it and all its ancestors are visible.
 */
export const FOLDER_CHILDREN_TAGS = {
  inheritedFeatureElements: FEATURE_CHILDREN_TAGS,
  /**
   * 0 or more Feature elements
   */
  featureElements: FEATURE_TAGS,
};

/**
 * References a KML file or KMZ archive on a local or remote network.
 * Use the <Link> element to specify the location of the KML file.
 * Within that element, you can define the refresh options for updating the file, based on time and camera change.
 * NetworkLinks can be used in combination with Regions to handle very large datasets efficiently.
 */
export const NETWORK_LINK_CHILDREN_TAGS = {
  inheritedFeatureElements: FEATURE_CHILDREN_TAGS,
  /**
   * Boolean value. A value of 0 leaves the visibility of features within the control of the Google Earth user.
   * Set the value to 1 to reset the visibility of features each time the NetworkLink is refreshed.
   * For example, suppose a Placemark within the linked KML file has <visibility> set to 1 and the NetworkLink has <refreshVisibility> set to 1.
   * When the file is first loaded into Google Earth, the user can clear the check box next to the item to turn off display in the 3D viewer.
   * However, when the NetworkLink is refreshed, the Placemark will be made visible again, since its original visibility state was TRUE.
   */
  refreshVisibility: REFRESH_VISIBILITY_TAG,
  /**
   * Boolean value.
   * A value of 1 causes Google Earth to fly to the view of the LookAt or Camera in the NetworkLinkControl (if it exists).
   * If the NetworkLinkControl does not contain an AbstractView element, Google Earth flies to the LookAt or Camera element in the Feature child within the <kml> element in the refreshed file.
   * If the <kml> element does not have a LookAt or Camera specified, the view is unchanged.
   * For example, Google Earth would fly to the <LookAt> view of the parent Document, not the <LookAt> of the Placemarks contained within the Document.
   */
  flyToView: FLY_TO_VIEW_TAG,
  /**
   * Required
   */
  Link: LINK_TAG,
  Url: URL_TAG,
};

export const OVERLAY_TAGS = {
  GroundOverlay: GROUND_OVERLAY_TAG,
  ScreenOverlay: SCREEN_OVERLAY_TAG,
  PhotoOverlay: PHOTO_OVERLAY_TAG,
};

/**
 * This is an abstract element and cannot be used directly in a KML file.
 * <Overlay> is the base type for image overlays drawn on the planet surface or on the screen.
 * <Icon> specifies the image to use and can be configured to reload images based on a timer or by camera changes.
 * This element also includes specifications for stacking order of multiple overlays and for adding color and transparency values to the base image.
 */
export const OVERLAY_TAGS_CHILDREN_TAGS = {
  inheritedFeatureElements: FEATURE_CHILDREN_TAGS,
  /**
   * Color values are expressed in hexadecimal notation, including opacity (alpha) values.
   *
   * The order of expression is alpha, blue, green, red (aabbggrr).
   * The range of values for any one color is 0 to 255 (00 to ff). For opacity, 00 is fully transparent and ff is fully opaque.
   * For example, if you want to apply a blue color with 50 percent opacity to an overlay, you would specify the following: <color>7fff0000</color>
   *
   * Note: The <geomColor> element has been deprecated. Use <color> instead.
   */
  color: COLOR_TAG,

  /**
   * Note: The <geomColor> element has been deprecated. Use <color> instead.
   */
  geomColor: GEOM_COLOR_TAG,
  /**
   * This element defines the stacking order for the images in overlapping overlays.
   * Overlays with higher <drawOrder> values are drawn on top of overlays with lower <drawOrder> values
   */
  drawOrder: DRAW_ORDER_TAG,
  /**
   * Defines the image associated with the Overlay.
   *
   * The <href> element defines the location of the image to be used as the Overlay.
   * This location can be either on a local file system or on a web server.
   * If this element is omitted or contains no <href>, a rectangle is drawn using the color and size defined by the ground or screen overlay.
   */
  Icon: ICON_TAG,
};

export const GROUND_OVERLAY_CHILDREN_TAGS = {
  inheritedOverlayElement: OVERLAY_TAGS_CHILDREN_TAGS,
  /**
   * Specifies the distance above the earth's surface, in meters, and is interpreted according to the altitude mode.
   */
  altitude: ALTITUDE_TAG,
  /**
   * ### Specifies how the <altitude>is interpreted. Possible values are
   *
   * clampToGround - (default) Indicates to ignore the altitude specification and drape the overlay over the terrain.
   *
   * absolute - Sets the altitude of the overlay relative to sea level, regardless of the actual elevation of the terrain beneath the element. For example, if you set the altitude of an overlay to 10 meters with an absolute altitude mode, the overlay will appear to be at ground level if the terrain beneath is also 10 meters above sea level. If the terrain is 3 meters above sea level, the overlay will appear elevated above the terrain by 7 meters.
   */
  altitudeMode: ALTITUDE_MODE_TAG,
  /**
   * A KML extension in the Google extension namespace, allowing altitudes relative to the sea floor. Values are:
   *
   * relativeToSeaFloor - Interprets the <altitude> as a value in meters above the sea floor. If the point is above land rather than sea, the <altitude> will be interpreted as being above the ground.
   *
   * clampToSeaFloor - The <altitude> specification is ignored, and the overlay will be draped over the sea floor. If the point is on land rather than at sea, the overlay will be positioned on the ground.
   */
  'gx:altitudeMode': GX_ALTITUDE_MODE_TAG,
  LatLonBox: LAT_LON_BOX_TAG,
  'gx:LatLonQuad': GX_LAT_LON_QUAD_TAG,
};

/**
 * Placemarks Tags can have one of these tags.
 * Geometry tag is an abstract element and cannot be used directly in a KML file.
 * It provides a placeholder object for all derived Geometry objects.
 *
 * https://developers.google.com/kml/documentation/kmlreference#geometry
 */
export const GEOMETRY_TAGS = {
  POINT: POINT_TAG,
  LINESTRING: LINE_STRING_TAG,
  POLYGON: POLYGON_TAG,
  MULTIGEOMETRY: 'MultiGeometry',
  MODEL: 'Model',
};

/**
 * The <PhotoOverlay> element allows you to geographically locate a photograph on the Earth and to specify viewing parameters for this PhotoOverlay.
 * The PhotoOverlay can be a simple 2D rectangle, a partial or full cylinder, or a sphere (for spherical panoramas).
 * The overlay is placed at the specified location and oriented toward the viewpoint.
 *
 * Because <PhotoOverlay> is derived from <Feature>, it can contain one of the two elements derived from <AbstractView>—either <Camera> or <LookAt>.
 * The Camera (or LookAt) specifies a viewpoint and a viewing direction (also referred to as a view vector).
 * The PhotoOverlay is positioned in relation to the viewpoint.
 * Specifically, the plane of a 2D rectangular image is orthogonal (at right angles to) the view vector.
 * The normal of this plane—that is, its front, which is the part with the photo—is oriented toward the viewpoint.
 *
 * The URL for the PhotoOverlay image is specified in the <Icon> tag, which is inherited from <Overlay>.
 * The <Icon> tag must contain an <href> element that specifies the image file to use for the PhotoOverlay.
 * In the case of a very large image, the <href> is a special URL that indexes into a pyramid of images of varying resolutions (see ImagePyramid).
 */
export const PHOTO_OVERLAY_CHILDREN_TAGS = {
  inheritedOverlayElement: OVERLAY_TAGS_CHILDREN_TAGS,
  /**
   * Adjusts how the photo is placed inside the field of view.
   * This element is useful if your photo has been rotated and deviates slightly from a desired horizontal view.
   */
  rotation: ROTATION_TAG,
  /**
   * Defines how much of the current scene is visible.
   * Specifying the field of view is analogous to specifying the lens opening in a physical camera.
   * A small field of view, like a telephoto lens, focuses on a small part of the scene.
   * A large field of view, like a wide-angle lens, focuses on a large part of the scene.
   *
   * The field of view for a PhotoOverlay is defined by four planes, each of which is specified by an angle relative to the view vector.
   * These four planes define the top, bottom, left, and right sides of the field of view, which has the shape of a truncated pyramid.
   */
  ViewVolume: VIEW_VOLUME_TAG,
  /**
   * For very large images, you'll need to construct an image pyramid, which is a hierarchical set of images, each of which is an increasingly lower resolution version of the original image.
   * Each image in the pyramid is subdivided into tiles, so that only the portions in view need to be loaded.
   * Google Earth calculates the current viewpoint and loads the tiles that are appropriate to the user's distance from the image.
   * As the viewpoint moves closer to the PhotoOverlay, Google Earth loads higher resolution tiles.
   * Since all the pixels in the original image can't be viewed on the screen at once, this preprocessing allows Google Earth to achieve maximum performance because it loads only the portions of the image that are in view, and only the pixel details that can be discerned by the user at the current viewpoint.
   *
   * When you specify an image pyramid, you also modify the <href> in the <Icon> element to include specifications for which tiles to load.
   */
  ImagePyramid: IMAGE_PYRAMID_TAG,
  /**
   * The <Point> element acts as a <Point> inside a <Placemark> element.
   * It draws an icon to mark the position of the PhotoOverlay.
   * The icon drawn is specified by the <styleUrl> and <StyleSelector> fields, just as it is for <Placemark>.
   */
  Point: POINT_TAG,
  /**
   * The PhotoOverlay is projected onto the <shape>. The <shape> can be one of the following:
   *
   * rectangle (default) - for an ordinary photo
   *
   * cylinder - for panoramas, which can be either partial or full cylinders
   *
   * sphere - for spherical panoramas
   */
  shape: SHAPE_TAG,
};

export const VIEW_VOLUME_CHILDREN_TAG = {
  /**
   * Angle, in degrees, between the camera's viewing direction and the left side of the view volume.
   */
  leftFov: LEFT_FOV_TAG,
  /**
   * Angle, in degrees, between the camera's viewing direction and the right side of the view volume.
   */
  rightFov: RIGHT_FOV_TAG,
  /**
   * Angle, in degrees, between the camera's viewing direction and the bottom side of the view volume.
   */
  bottomFov: BOTTOM_FOV_TAG,
  /**
   * Angle, in degrees, between the camera's viewing direction and the top side of the view volume.
   */
  topFov: TOP_FOV_TAG,
  /**
   * Measurement in meters along the viewing direction from the camera viewpoint to the PhotoOverlay shape.
   */
  near: NEAR_TAG,
};

export const IMAGE_PYRAMID_CHILDREN_TAGS = {
  /**
   * Size of the tiles, in pixels. Tiles must be square, and <tileSize> must be a power of 2.
   * A tile size of 256 (the default) or 512 is recommended.
   * The original image is divided into tiles of this size, at varying resolutions.
   */
  tileSize: TILE_SIZE_TAG,
  /**
   * Width in pixels of the original image.
   */
  maxWidth: MAX_WIDTH_TAG,
  /**
   * Height in pixels of the original image.
   */
  maxHeight: MAX_HEIGHT_TAG,
  /**
   * Specifies where to begin numbering the tiles in each layer of the pyramid.
   * A value of lowerLeft specifies that row 1, column 1 of each layer is in the bottom left corner of the grid.
   */
  gridOrigin: GRID_ORIGIN_TAG,
};

/**
 * This element draws an image overlay fixed to the screen.
 * Sample uses for ScreenOverlays are compasses, logos, and heads-up displays.
 * ScreenOverlay sizing is determined by the <size> element.
 * Positioning of the overlay is handled by mapping a point in the image specified by <overlayXY> to a point on the screen specified by <screenXY>.
 * Then the image is rotated by <rotation> degrees about a point relative to the screen specified by <rotationXY>.
 *
 * The <href> child of <Icon> specifies the image to be used as the overlay.
 * This file can be either on a local file system or on a web server.
 * If this element is omitted or contains no <href>, a rectangle is drawn using the color and size defined by the screen overlay.
 */
export const SCREEN_OVERLAY_CHILDREN_TAGS = {
  inheritedOverlayElement: OVERLAY_TAGS_CHILDREN_TAGS,
  /**
   * Specifies a point on (or outside of) the overlay image that is mapped to the screen coordinate (<screenXY>). It requires x and y values, and the units for those values.
   *
   * The x and y values can be specified in three different ways: as pixels ("pixels"), as fractions of the image ("fraction"), or as inset pixels ("insetPixels"), which is an offset in pixels from the upper right corner of the image. The x and y positions can be specified in different ways—for example, x can be in pixels and y can be a fraction. The origin of the coordinate system is in the lower left corner of the image.
   *
   * x - Either the number of pixels, a fractional component of the image, or a pixel inset indicating the x component of a point on the overlay image.
   *
   * y - Either the number of pixels, a fractional component of the image, or a pixel inset indicating the y component of a point on the overlay image.
   *
   * xunits - Units in which the x value is specified. A value of "fraction" indicates the x value is a fraction of the image. A value of "pixels" indicates the x value in pixels. A value of "insetPixels" indicates the indent from the right edge of the image.
   *
   * yunits - Units in which the y value is specified. A value of "fraction" indicates the y value is a fraction of the image. A value of "pixels" indicates the y value in pixels. A value of "insetPixels" indicates the indent from the top edge of the image.
   */
  overlayXY: 'overlayXY',
  /**
   * Specifies a point relative to the screen origin that the overlay image is mapped to. The x and y values can be specified in three different ways: as pixels ("pixels"), as fractions of the screen ("fraction"), or as inset pixels ("insetPixels"), which is an offset in pixels from the upper right corner of the screen. The x and y positions can be specified in different ways—for example, x can be in pixels and y can be a fraction. The origin of the coordinate system is in the lower left corner of the screen.
   *
   * x - Either the number of pixels, a fractional component of the screen, or a pixel inset indicating the x component of a point on the screen.
   *
   * y - Either the number of pixels, a fractional component of the screen, or a pixel inset indicating the y component of a point on the screen.
   *
   * xunits - Units in which the x value is specified. A value of "fraction" indicates the x value is a fraction of the screen. A value of "pixels" indicates the x value in pixels. A value of "insetPixels" indicates the indent from the right edge of the screen.
   *
   * yunits - Units in which the y value is specified. A value of fraction indicates the y value is a fraction of the screen. A value of "pixels" indicates the y value in pixels. A value of "insetPixels" indicates the indent from the top edge of the screen.
   */
  screenXY: 'screenXY',
  /**
   * Point relative to the screen about which the screen overlay is rotated.
   */
  rotationXY: 'rotationXY',
  /**
   * Specifies the size of the image for the screen overlay, as follows:
   *
   * A value of −1 indicates to use the native dimension
   *
   * A value of 0 indicates to maintain the aspect ratio
   *
   * A value of n sets the value of the dimension
   */
  size: 'size',
  /**
   * Indicates the angle of rotation of the parent object.
   * A value of 0 means no rotation.
   * The value is an angle in degrees counterclockwise starting from north.
   * Use ±180 to indicate the rotation of the parent object from 0. The center of the <rotation>, if not (.5,.5), is specified in <rotationXY>.
   */
  rotation: ROTATION_TAG,
};
/**
 * Within Style tags these defined how different parts of the geometry should look like.
 */
export const STYLE_TYPE_TAGS = {
  /**
   * Not Currently supported
   */
  BALLOON_STYLE: BALLOON_STYLE_TAG,

  ICON_STYLE: ICON_TAG,

  /**
   * Not Currently supported
   */
  LABEL_STYLE: LABEL_STYLE_TAG,

  LINE_STYLE: LINE_STYLE_TAG,
  /**
   * Not Currently supported
   */
  LIST_STYLE: LIST_STYLE_TAG,

  POLY_STYLE: POLY_STYLE_TAG,
};
/**
 * The <gx:x>, <gx:y>, <gx:w>, and <gx:h> elements are used to select one icon from an image that contains multiple icons (often referred to as an icon palette.
 */
export const ICON_PALLET_SELECTOR = {
  /**
   * If the <href> specifies an icon palette, these elements identify the offsets, in pixels, from the lower-left corner of the icon palette.If no values are specified for x and y, the lower left corner of the icon palette is assumed to be the lower-left corner of the icon to use.
   */
  X_POSITION: GX_X_TAG,
  /**
   * If the <href> specifies an icon palette, these elements identify the offsets, in pixels, from the lower-left corner of the icon palette.If no values are specified for x and y, the lower left corner of the icon palette is assumed to be the lower-left corner of the icon to use.
   */
  Y_POSITION: GX_Y_TAG,
  /**
   * If the <href> specifies an icon palette, these elements specify the width (<gx:w>) and height (<gx:h>), in pixels, of the icon to use.
   */
  WIDTH: GX_W_TAG,
  /**
   * If the <href> specifies an icon palette, these elements specify the width (<gx:w>) and height (<gx:h>), in pixels, of the icon to use.
   */
  HEIGHT: GX_H_TAG,
};

/**
 * Define the location of the Icon's anchor
 */
export const HOTSPOT_TAG_DESCRIPTORS = {
  /**
   * xunits - Units in which the x value is specified. A value of fraction indicates the x value is a fraction of the icon. A value of pixels indicates the x value in pixels. A value of insetPixels indicates the indent from the right edge of the icon.
   */
  X_UNITS_DESCRIPTOR: X_UNITS_DESCRIPTOR,
  /**
   * yunits - Units in which the y value is specified. A value of fraction indicates the y value is a fraction of the icon. A value of pixels indicates the y value in pixels. A value of insetPixels indicates the indent from the top edge of the icon.
   */
  Y_UNITS_DESCRIPTOR: Y_UNITS_DESCRIPTOR,
  /**
   * x - Either the number of pixels, a fractional component of the icon, or a pixel inset indicating the x component of a point on the icon.
   */
  X_COMPONENT_DESCRIPTOR: X_COMPONENT_DESCRIPTOR,
  /**
   * y - Either the number of pixels, a fractional component of the icon, or a pixel inset indicating the y component of a point on the icon.
   */
  Y_COMPONENT_DESCRIPTOR: Y_COMPONENT_DESCRIPTOR,
};

export const ITEM_TO_SEARCH_WITHIN = [GEOMETRY_TAGS.LINESTRING, GEOMETRY_TAGS.POINT, GEOMETRY_TAGS.POLYGON];

export const INNER_ITEMS_TO_IGNORE = [COORDINATES_TAG, OUTER_BOUNDARY_TAG, INNER_BOUNDARY_TAG];

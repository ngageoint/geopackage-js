import { SpatialReferenceSystemDao } from '../core/srs/spatialReferenceSystemDao';

// eslint-disable-next-line no-unused-vars
import { UserTable } from '../user/userTable';
import { DataTypes } from './dataTypes';
import { GeoPackage } from '../geoPackage';
import { GeoPackageConnection } from './geoPackageConnection';

type TableCreatorScripts =
  | 'spatial_reference_system'
  | 'contents'
  | 'geometry_columns'
  | 'tile_matrix_set'
  | 'tile_matrix'
  | 'data_columns'
  | 'data_column_constraints'
  | 'metadata'
  | 'metadata_reference'
  | 'extensions'
  | 'table_index'
  | 'geometry_index'
  | 'feature_tile_link'
  | 'extended_relations'
  | 'contents_id';

/**
 * `TableCreator` provides methods for creating the various standard tables in
 * a GeoPackage database.
 *
 * @class
 * @param {module:geoPackage~GeoPackage} geopackage GeoPackage object
 */
export class TableCreator {
  geopackage: GeoPackage;
  connection: GeoPackageConnection;
  constructor(geopackage: GeoPackage) {
    this.geopackage = geopackage;
    this.connection = geopackage.database;
  }
  /**
   * Creates all required tables and Spatial Reference Systems, in addition to EPSG:3857
   * @return {Promise<Boolean>}
   */
  async createRequired(): Promise<boolean> {
    const dao = new SpatialReferenceSystemDao(this.geopackage);
    await Promise.all([this.createSpatialReferenceSystem(), this.createContents()]);
    // Create the required Spatial Reference Systems (spec Requirement 11)
    dao.createUndefinedGeographic();
    dao.createWgs84();
    dao.createUndefinedCartesian();
    // not required but very common
    dao.createWebMercator();
    return true;
  }
  /**
   * Creates the spatial reference system tables
   * @return {Promise<Boolean>}
   */
  createSpatialReferenceSystem(): Promise<boolean> {
    return this.createTable('spatial_reference_system');
  }
  /**
   * Creates the contents tables
   * @return {Promise<Boolean>}
   */
  createContents(): Promise<boolean> {
    return this.createTable('contents');
  }
  /**
   * Creates the geometry columns tables
   * @return {Promise<Boolean>}
   */
  createGeometryColumns(): Promise<boolean> {
    return this.createTable('geometry_columns');
  }
  /**
   * Creates the tile matrix set tables
   * @return {Promise<Boolean>}
   */
  createTileMatrixSet(): Promise<boolean> {
    return this.createTable('tile_matrix_set');
  }
  /**
   * Creates the tile matrix tables
   * @return {Promise<Boolean>}
   */
  createTileMatrix(): Promise<boolean> {
    return this.createTable('tile_matrix');
  }
  /**
   * Creates the data columns tables
   * @return {Promise<Boolean>}
   */
  createDataColumns(): Promise<boolean> {
    return this.createTable('data_columns');
  }
  /**
   * Creates the data column constraints tables
   * @return {Promise<Boolean>}
   */
  createDataColumnConstraints(): Promise<boolean> {
    return this.createTable('data_column_constraints');
  }
  /**
   * Creates the metadata tables
   * @return {Promise<Boolean>}
   */
  createMetadata(): Promise<boolean> {
    return this.createTable('metadata');
  }
  /**
   * Creates the metadata reference tables
   * @return {Promise<Boolean>}
   */
  createMetadataReference(): Promise<boolean> {
    return this.createTable('metadata_reference');
  }
  /**
   * Creates the extensions tables
   * @return {Promise<Boolean>}
   */
  createExtensions(): Promise<boolean> {
    return this.createTable('extensions');
  }
  /**
   * Creates the table index tables
   * @return {Promise<Boolean>}
   */
  createTableIndex(): Promise<boolean> {
    return this.createTable('table_index');
  }
  /**
   * Creates the geometry index tables
   * @return {Promise<Boolean>}
   */
  createGeometryIndex(): Promise<boolean> {
    return this.createTable('geometry_index');
  }
  /**
   * Creates the feature tile link tables
   * @return {Promise<Boolean>}
   */
  createFeatureTileLink(): Promise<boolean> {
    return this.createTable('feature_tile_link');
  }
  /**
   * Creates the extended relations tables
   * @return {Promise<Boolean>}
   */
  createExtendedRelations(): Promise<boolean> {
    return this.createTable('extended_relations');
  }
  /**
   * Creates the contentsId tables
   * @return {Promise<Boolean>}
   */
  createContentsId(): Promise<boolean> {
    return this.createTable('contents_id');
  }
  /**
   * Creates all tables necessary for the specified table creation script name in the GeoPackage
   * @param  {string} creationScriptName creation scripts to run
   * @return {Promise<Boolean>}
   */
  async createTable(creationScriptName: TableCreatorScripts): Promise<boolean> {
    let success = true;
    const scripts = TableCreator.tableCreationScripts[creationScriptName];
    for (let i = 0; i < scripts.length; i++) {
      const sql = scripts[i];
      try {
        success = success && !!this.connection.run(sql);
      } catch (error) {
        if (error.message.indexOf('already exists') === -1) {
          throw error;
        }
      }
    }
    return success;
  }
  /**
   * Create the given user table.
   *
   * @param {UserTable} userTable user table to create
   * @return {object} the result of {@link module:db/geoPackageConnection~GeoPackageConnection#run}
   * @throws {Error} if the table already exists
   */
  createUserTable(userTable: UserTable): { lastInsertRowid: number; changes: number } {
    const connection = this.connection;
    const result = connection.tableExists(userTable.table_name);
    if (result) {
      throw new Error('Table already exists and cannot be created: ' + userTable.table_name);
    }
    let check = '';
    let sql = "create table '" + userTable.table_name + "' (";
    for (let i = 0; i < userTable.columns.length; i++) {
      const tc = userTable.columns[i];
      if (i) {
        sql += ', ';
      }
      sql += "\n'" + tc.name + "' " + tc.getTypeName();
      if (tc.max !== null && tc.max !== undefined) {
        sql += '(' + tc.max + ')';
        if (check.length) {
          check += ' AND\n';
        }
        check += '\tlength("' + tc.name + '") <= ' + tc.max;
      }
      if (tc.notNull) {
        sql += ' not null';
      }
      if (tc.primaryKey) {
        sql += ' primary key autoincrement';
      }
      if (tc.defaultValue) {
        if (tc.dataType === DataTypes.TEXT) {
          sql += " default '" + tc.defaultValue + "'";
        } else {
          sql += ' default ' + tc.defaultValue;
        }
      }
    }
    for (let i = 0; i < userTable.uniqueConstraints.length; i++) {
      const uniqueConstraint = userTable.uniqueConstraints[i];
      sql += ',\n unique (';
      for (let j = 0; j < uniqueConstraint.columns.length; j++) {
        const uniqueColumn = uniqueConstraint.columns[j];
        if (j) {
          sql += ', ';
        }
        sql += uniqueColumn.name;
      }
      sql += ')';
    }
    if (check.length) {
      sql += '\nCHECK(\n' + check + '\n)';
    }
    sql += '\n);';
    return connection.run(sql);
  }

  static readonly tableCreationScripts = {
    spatial_reference_system: [
      'CREATE TABLE gpkg_spatial_ref_sys (' +
        '  srs_name TEXT NOT NULL,' +
        '  srs_id INTEGER NOT NULL PRIMARY KEY,' +
        '  organization TEXT NOT NULL,' +
        '  organization_coordsys_id INTEGER NOT NULL,' +
        '  definition  TEXT NOT NULL,' +
        '  description TEXT,' +
        '  definition_12_063 TEXT NOT NULL DEFAULT "undefined"' +
        ')',

      'CREATE VIEW st_spatial_ref_sys AS' +
        ' SELECT' +
        '   srs_name,' +
        '   srs_id,' +
        '   organization,' +
        '   organization_coordsys_id,' +
        '   definition,' +
        '   description' +
        ' FROM gpkg_spatial_ref_sys',

      'CREATE VIEW spatial_ref_sys AS' +
        ' SELECT' +
        '   srs_id AS srid,' +
        '   organization AS auth_name,' +
        '   organization_coordsys_id AS auth_srid,' +
        '   definition AS srtext' +
        ' FROM gpkg_spatial_ref_sys',
    ],
    contents: [
      'CREATE TABLE gpkg_contents (' +
        ' table_name TEXT NOT NULL PRIMARY KEY,' +
        ' data_type TEXT NOT NULL,' +
        ' identifier TEXT UNIQUE,' +
        " description TEXT DEFAULT ''," +
        " last_change DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))," +
        ' min_x DOUBLE,' +
        ' min_y DOUBLE,' +
        ' max_x DOUBLE,' +
        ' max_y DOUBLE,' +
        ' srs_id INTEGER,' +
        ' CONSTRAINT fk_gc_r_srs_id FOREIGN KEY (srs_id) REFERENCES gpkg_spatial_ref_sys(srs_id)' +
        ')',
    ],
    geometry_columns: [
      'CREATE TABLE gpkg_geometry_columns (' +
        '  table_name TEXT NOT NULL,' +
        '  column_name TEXT NOT NULL,' +
        '  geometry_type_name TEXT NOT NULL,' +
        '  srs_id INTEGER NOT NULL,' +
        '  z TINYINT NOT NULL,' +
        '  m TINYINT NOT NULL,' +
        '  CONSTRAINT pk_geom_cols PRIMARY KEY (table_name, column_name),' +
        '  CONSTRAINT uk_gc_table_name UNIQUE (table_name),' +
        '  CONSTRAINT fk_gc_tn FOREIGN KEY (table_name) REFERENCES gpkg_contents(table_name),' +
        '  CONSTRAINT fk_gc_srs FOREIGN KEY (srs_id) REFERENCES gpkg_spatial_ref_sys (srs_id)' +
        ')',

      'CREATE VIEW st_geometry_columns AS' +
        '  SELECT' +
        '    table_name,' +
        '    column_name,' +
        "    'ST_' || geometry_type_name AS geometry_type_name," +
        '    g.srs_id,' +
        '    srs_name' +
        '  FROM gpkg_geometry_columns as g JOIN gpkg_spatial_ref_sys AS s' +
        '  WHERE g.srs_id = s.srs_id',

      'CREATE VIEW geometry_columns AS' +
        '  SELECT' +
        '    table_name AS f_table_name,' +
        '    column_name AS f_geometry_column,' +
        '    (CASE geometry_type_name' +
        '    	WHEN "GEOMETRY" THEN 0' +
        '    	WHEN "POINT" THEN 1' +
        '    	WHEN "LINESTRING" THEN 2' +
        '    	WHEN "POLYGON" THEN 3' +
        '    	WHEN "MULTIPOINT" THEN 4' +
        '    	WHEN "MULTILINESTRING" THEN 5' +
        '    	WHEN "MULTIPOLYGON" THEN 6' +
        '    	WHEN "GEOMETRYCOLLECTION" THEN 7' +
        '    	WHEN "CIRCULARSTRING" THEN 8' +
        '    	WHEN "COMPOUNDCURVE" THEN 9' +
        '    	WHEN "CURVEPOLYGON" THEN 10' +
        '    	WHEN "MULTICURVE" THEN 11' +
        '    	WHEN "MULTISURFACE" THEN 12' +
        '    	WHEN "CURVE" THEN 13' +
        '    	WHEN "SURFACE" THEN 14' +
        '    	WHEN "POLYHEDRALSURFACE" THEN 15' +
        '    	WHEN "TIN" THEN 16' +
        '    	WHEN "TRIANGLE" THEN 17' +
        '    	ELSE 0 END) AS geometry_type,' +
        '    2 + (CASE z WHEN 1 THEN 1 WHEN 2 THEN 1 ELSE 0 END) + (CASE m WHEN 1 THEN 1 WHEN 2 THEN 1 ELSE 0 END) AS coord_dimension,' +
        '    srs_id AS srid' +
        '  FROM gpkg_geometry_columns',
    ],
    tile_matrix_set: [
      'CREATE TABLE gpkg_tile_matrix_set (' +
        '  table_name TEXT NOT NULL PRIMARY KEY,' +
        '  srs_id INTEGER NOT NULL,' +
        '  min_x DOUBLE NOT NULL,' +
        '  min_y DOUBLE NOT NULL,' +
        '  max_x DOUBLE NOT NULL,' +
        '  max_y DOUBLE NOT NULL,' +
        '  CONSTRAINT fk_gtms_table_name FOREIGN KEY (table_name) REFERENCES gpkg_contents(table_name),' +
        '  CONSTRAINT fk_gtms_srs FOREIGN KEY (srs_id) REFERENCES gpkg_spatial_ref_sys (srs_id)' +
        ')',
    ],
    tile_matrix: [
      'CREATE TABLE gpkg_tile_matrix (' +
        '  table_name TEXT NOT NULL,' +
        '  zoom_level INTEGER NOT NULL,' +
        '  matrix_width INTEGER NOT NULL,' +
        '  matrix_height INTEGER NOT NULL,' +
        '  tile_width INTEGER NOT NULL,' +
        '  tile_height INTEGER NOT NULL,' +
        '  pixel_x_size DOUBLE NOT NULL,' +
        '  pixel_y_size DOUBLE NOT NULL,' +
        '  CONSTRAINT pk_ttm PRIMARY KEY (table_name, zoom_level),' +
        '  CONSTRAINT fk_tmm_table_name FOREIGN KEY (table_name) REFERENCES gpkg_contents(table_name)' +
        ')',

      "CREATE TRIGGER 'gpkg_tile_matrix_zoom_level_insert'" +
        "BEFORE INSERT ON 'gpkg_tile_matrix'" +
        'FOR EACH ROW BEGIN ' +
        "SELECT RAISE(ABORT, 'insert on table ''gpkg_tile_matrix'' violates constraint: zoom_level cannot be less than 0')" +
        'WHERE (NEW.zoom_level < 0);' +
        'END',

      "CREATE TRIGGER 'gpkg_tile_matrix_zoom_level_update'" +
        "BEFORE UPDATE of zoom_level ON 'gpkg_tile_matrix'" +
        'FOR EACH ROW BEGIN ' +
        "SELECT RAISE(ABORT, 'update on table ''gpkg_tile_matrix'' violates constraint: zoom_level cannot be less than 0')" +
        'WHERE (NEW.zoom_level < 0);' +
        'END',

      "CREATE TRIGGER 'gpkg_tile_matrix_matrix_width_insert'" +
        "BEFORE INSERT ON 'gpkg_tile_matrix'" +
        'FOR EACH ROW BEGIN ' +
        "SELECT RAISE(ABORT, 'insert on table ''gpkg_tile_matrix'' violates constraint: matrix_width cannot be less than 1')" +
        'WHERE (NEW.matrix_width < 1);' +
        'END',

      "CREATE TRIGGER 'gpkg_tile_matrix_matrix_width_update'" +
        "BEFORE UPDATE OF matrix_width ON 'gpkg_tile_matrix'" +
        'FOR EACH ROW BEGIN ' +
        "SELECT RAISE(ABORT, 'update on table ''gpkg_tile_matrix'' violates constraint: matrix_width cannot be less than 1')" +
        'WHERE (NEW.matrix_width < 1);' +
        'END',

      "CREATE TRIGGER 'gpkg_tile_matrix_matrix_height_insert'" +
        "BEFORE INSERT ON 'gpkg_tile_matrix'" +
        'FOR EACH ROW BEGIN ' +
        "SELECT RAISE(ABORT, 'insert on table ''gpkg_tile_matrix'' violates constraint: matrix_height cannot be less than 1')" +
        'WHERE (NEW.matrix_height < 1);' +
        'END',

      "CREATE TRIGGER 'gpkg_tile_matrix_matrix_height_update'" +
        "BEFORE UPDATE OF matrix_height ON 'gpkg_tile_matrix'" +
        'FOR EACH ROW BEGIN ' +
        "SELECT RAISE(ABORT, 'update on table ''gpkg_tile_matrix'' violates constraint: matrix_height cannot be less than 1')" +
        'WHERE (NEW.matrix_height < 1);' +
        'END',

      "CREATE TRIGGER 'gpkg_tile_matrix_pixel_x_size_insert'" +
        "BEFORE INSERT ON 'gpkg_tile_matrix'" +
        'FOR EACH ROW BEGIN ' +
        "SELECT RAISE(ABORT, 'insert on table ''gpkg_tile_matrix'' violates constraint: pixel_x_size must be greater than 0')" +
        'WHERE NOT (NEW.pixel_x_size > 0);' +
        'END',

      "CREATE TRIGGER 'gpkg_tile_matrix_pixel_x_size_update'" +
        "BEFORE UPDATE OF pixel_x_size ON 'gpkg_tile_matrix'" +
        'FOR EACH ROW BEGIN ' +
        "SELECT RAISE(ABORT, 'update on table ''gpkg_tile_matrix'' violates constraint: pixel_x_size must be greater than 0')" +
        'WHERE NOT (NEW.pixel_x_size > 0);' +
        'END',

      "CREATE TRIGGER 'gpkg_tile_matrix_pixel_y_size_insert'" +
        "BEFORE INSERT ON 'gpkg_tile_matrix'" +
        'FOR EACH ROW BEGIN ' +
        "SELECT RAISE(ABORT, 'insert on table ''gpkg_tile_matrix'' violates constraint: pixel_y_size must be greater than 0')" +
        'WHERE NOT (NEW.pixel_y_size > 0);' +
        'END',

      "CREATE TRIGGER 'gpkg_tile_matrix_pixel_y_size_update'" +
        "BEFORE UPDATE OF pixel_y_size ON 'gpkg_tile_matrix'" +
        'FOR EACH ROW BEGIN ' +
        "SELECT RAISE(ABORT, 'update on table ''gpkg_tile_matrix'' violates constraint: pixel_y_size must be greater than 0')" +
        'WHERE NOT (NEW.pixel_y_size > 0);' +
        'END',
    ],
    data_columns: [
      'CREATE TABLE gpkg_data_columns (' +
        '  table_name TEXT NOT NULL,' +
        '  column_name TEXT NOT NULL,' +
        '  name TEXT,' +
        '  title TEXT,' +
        '  description TEXT,' +
        '  mime_type TEXT,' +
        '  constraint_name TEXT,' +
        '  CONSTRAINT pk_gdc PRIMARY KEY (table_name, column_name),' +
        '  CONSTRAINT fk_gdc_tn FOREIGN KEY (table_name) REFERENCES gpkg_contents(table_name)' +
        ')',
    ],
    data_column_constraints: [
      'CREATE TABLE gpkg_data_column_constraints (' +
        '  constraint_name TEXT NOT NULL,' +
        '  constraint_type TEXT NOT NULL, /* "range" | "enum" | "glob" */' +
        '  value TEXT,' +
        '  min NUMERIC,' +
        '  min_is_inclusive BOOLEAN, /* 0 = false, 1 = true */' +
        '  max NUMERIC,' +
        '  max_is_inclusive BOOLEAN, /* 0 = false, 1 = true */' +
        '  description TEXT,' +
        '  CONSTRAINT gdcc_ntv UNIQUE (constraint_name, constraint_type, value)' +
        ')',
    ],
    metadata: [
      'CREATE TABLE gpkg_metadata (' +
        '  id INTEGER CONSTRAINT m_pk PRIMARY KEY ASC NOT NULL UNIQUE,' +
        '  md_scope TEXT NOT NULL DEFAULT "dataset",' +
        '  md_standard_uri TEXT NOT NULL,' +
        '  mime_type TEXT NOT NULL DEFAULT "text/xml",' +
        '  metadata TEXT NOT NULL' +
        ')',

      "CREATE TRIGGER 'gpkg_metadata_md_scope_insert' " +
        "BEFORE INSERT ON 'gpkg_metadata' " +
        'FOR EACH ROW BEGIN ' +
        "SELECT RAISE(ABORT, 'insert on table gpkg_metadata violates " +
        'constraint: md_scope must be one of undefined | fieldSession | ' +
        'collectionSession | series | dataset | featureType | feature | ' +
        'attributeType | attribute | tile | model | catalogue | schema | ' +
        'taxonomy software | service | collectionHardware | ' +
        "nonGeographicDataset | dimensionGroup') " +
        'WHERE NOT(NEW.md_scope IN ' +
        "('undefined','fieldSession','collectionSession','series','dataset', " +
        "'featureType','feature','attributeType','attribute','tile','model', " +
        "'catalogue','schema','taxonomy','software','service', " +
        "'collectionHardware','nonGeographicDataset','dimensionGroup')); " +
        'END',

      "CREATE TRIGGER 'gpkg_metadata_md_scope_update' " +
        "BEFORE UPDATE OF 'md_scope' ON 'gpkg_metadata' " +
        'FOR EACH ROW BEGIN ' +
        "SELECT RAISE(ABORT, 'update on table gpkg_metadata violates " +
        'constraint: md_scope must be one of undefined | fieldSession | ' +
        'collectionSession | series | dataset | featureType | feature | ' +
        'attributeType | attribute | tile | model | catalogue | schema | ' +
        'taxonomy software | service | collectionHardware | ' +
        "nonGeographicDataset | dimensionGroup') " +
        'WHERE NOT(NEW.md_scope IN ' +
        "('undefined','fieldSession','collectionSession','series','dataset', " +
        "'featureType','feature','attributeType','attribute','tile','model', " +
        "'catalogue','schema','taxonomy','software','service', " +
        "'collectionHardware','nonGeographicDataset','dimensionGroup')); " +
        'END',
    ],
    metadata_reference: [
      'CREATE TABLE gpkg_metadata_reference (' +
        '  reference_scope TEXT NOT NULL,' +
        '  table_name TEXT,' +
        '  column_name TEXT,' +
        '  row_id_value INTEGER,' +
        "  timestamp DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))," +
        '  md_file_id INTEGER NOT NULL,' +
        '  md_parent_id INTEGER,' +
        '  CONSTRAINT crmr_mfi_fk FOREIGN KEY (md_file_id) REFERENCES gpkg_metadata(id),' +
        '  CONSTRAINT crmr_mpi_fk FOREIGN KEY (md_parent_id) REFERENCES gpkg_metadata(id)' +
        ')',

      "CREATE TRIGGER 'gpkg_metadata_reference_reference_scope_insert' " +
        "BEFORE INSERT ON 'gpkg_metadata_reference' " +
        'FOR EACH ROW BEGIN ' +
        "SELECT RAISE(ABORT, 'insert on table gpkg_metadata_reference " +
        'violates constraint: reference_scope must be one of "geopackage", ' +
        'table", "column", "row", "row/col"\') ' +
        'WHERE NOT NEW.reference_scope IN ' +
        "('geopackage','table','column','row','row/col'); " +
        'END',

      "CREATE TRIGGER 'gpkg_metadata_reference_reference_scope_update' " +
        "BEFORE UPDATE OF 'reference_scope' ON 'gpkg_metadata_reference' " +
        'FOR EACH ROW BEGIN ' +
        "SELECT RAISE(ABORT, 'update on table gpkg_metadata_reference " +
        'violates constraint: referrence_scope must be one of "geopackage", ' +
        '"table", "column", "row", "row/col"\') ' +
        'WHERE NOT NEW.reference_scope IN ' +
        "('geopackage','table','column','row','row/col'); " +
        'END',

      "CREATE TRIGGER 'gpkg_metadata_reference_column_name_insert' " +
        "BEFORE INSERT ON 'gpkg_metadata_reference' " +
        'FOR EACH ROW BEGIN ' +
        "SELECT RAISE(ABORT, 'insert on table gpkg_metadata_reference " +
        'violates constraint: column name must be NULL when reference_scope ' +
        'is "geopackage", "table" or "row"\') ' +
        "WHERE (NEW.reference_scope IN ('geopackage','table','row') " +
        'AND NEW.column_name IS NOT NULL); ' +
        "SELECT RAISE(ABORT, 'insert on table gpkg_metadata_reference " +
        'violates constraint: column name must be defined for the specified ' +
        'table when reference_scope is "column" or "row/col"\') ' +
        "WHERE (NEW.reference_scope IN ('column','row/col') " +
        'AND NOT NEW.table_name IN ( ' +
        "SELECT name FROM SQLITE_MASTER WHERE type = 'table' " +
        'AND name = NEW.table_name ' +
        "AND sql LIKE ('%' || NEW.column_name || '%'))); " +
        'END',

      "CREATE TRIGGER 'gpkg_metadata_reference_column_name_update' " +
        "BEFORE UPDATE OF column_name ON 'gpkg_metadata_reference' " +
        'FOR EACH ROW BEGIN ' +
        "SELECT RAISE(ABORT, 'update on table gpkg_metadata_reference " +
        'violates constraint: column name must be NULL when reference_scope ' +
        'is "geopackage", "table" or "row"\') ' +
        "WHERE (NEW.reference_scope IN ('geopackage','table','row') " +
        'AND NEW.column_nameIS NOT NULL); ' +
        "SELECT RAISE(ABORT, 'update on table gpkg_metadata_reference " +
        'violates constraint: column name must be defined for the specified ' +
        'table when reference_scope is "column" or "row/col"\') ' +
        "WHERE (NEW.reference_scope IN ('column','row/col') " +
        'AND NOT NEW.table_name IN ( ' +
        "SELECT name FROM SQLITE_MASTER WHERE type = 'table' " +
        'AND name = NEW.table_name ' +
        "AND sql LIKE ('%' || NEW.column_name || '%'))); " +
        'END',

      "CREATE TRIGGER 'gpkg_metadata_reference_row_id_value_insert' " +
        "BEFORE INSERT ON 'gpkg_metadata_reference' " +
        'FOR EACH ROW BEGIN ' +
        "SELECT RAISE(ABORT, 'insert on table gpkg_metadata_reference " +
        'violates constraint: row_id_value must be NULL when reference_scope ' +
        'is "geopackage", "table" or "column"\') ' +
        "WHERE NEW.reference_scope IN ('geopackage','table','column') " +
        'AND NEW.row_id_value IS NOT NULL; ' +
        'END ',

      "CREATE TRIGGER 'gpkg_metadata_reference_row_id_value_update' " +
        "BEFORE UPDATE OF 'row_id_value' ON 'gpkg_metadata_reference' " +
        'FOR EACH ROW BEGIN ' +
        "SELECT RAISE(ABORT, 'update on table gpkg_metadata_reference " +
        'violates constraint: row_id_value must be NULL when reference_scope ' +
        'is "geopackage", "table" or "column"\') ' +
        "WHERE NEW.reference_scope IN ('geopackage','table','column') " +
        'AND NEW.row_id_value IS NOT NULL; ' +
        'END',

      "CREATE TRIGGER 'gpkg_metadata_reference_timestamp_insert' " +
        "BEFORE INSERT ON 'gpkg_metadata_reference' " +
        'FOR EACH ROW BEGIN ' +
        "SELECT RAISE(ABORT, 'insert on table gpkg_metadata_reference " +
        'violates constraint: timestamp must be a valid time in ISO 8601 ' +
        '"yyyy-mm-ddThh:mm:ss.cccZ" form\') ' +
        'WHERE NOT (NEW.timestamp GLOB ' +
        "'[1-2][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9].[0-9][0-9][0-9]Z' " +
        "AND strftime('%s',NEW.timestamp) NOT NULL); " +
        'END',

      "CREATE TRIGGER 'gpkg_metadata_reference_timestamp_update' " +
        "BEFORE UPDATE OF 'timestamp' ON 'gpkg_metadata_reference' " +
        'FOR EACH ROW BEGIN ' +
        "SELECT RAISE(ABORT, 'update on table gpkg_metadata_reference " +
        'violates constraint: timestamp must be a valid time in ISO 8601 ' +
        '"yyyy-mm-ddThh:mm:ss.cccZ" form\') ' +
        'WHERE NOT (NEW.timestamp GLOB ' +
        "'[1-2][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9].[0-9][0-9][0-9]Z' " +
        "AND strftime('%s',NEW.timestamp) NOT NULL); " +
        'END ',
    ],
    extensions: [
      'CREATE TABLE gpkg_extensions (' +
        '  table_name TEXT,' +
        '  column_name TEXT,' +
        '  extension_name TEXT NOT NULL,' +
        '  definition TEXT NOT NULL,' +
        '  scope TEXT NOT NULL,' +
        '  CONSTRAINT ge_tce UNIQUE (table_name, column_name, extension_name)' +
        ')',
    ],
    table_index: [
      'CREATE TABLE nga_table_index (' + '  table_name TEXT NOT NULL PRIMARY KEY,' + '  last_indexed DATETIME' + ')',
    ],
    geometry_index: [
      'CREATE TABLE nga_geometry_index (' +
        '  table_name TEXT NOT NULL,' +
        '  geom_id INTEGER NOT NULL,' +
        '  min_x DOUBLE NOT NULL,' +
        '  max_x DOUBLE NOT NULL,' +
        '  min_y DOUBLE NOT NULL,' +
        '  max_y DOUBLE NOT NULL,' +
        '  min_z DOUBLE,' +
        '  max_z DOUBLE,' +
        '  min_m DOUBLE,' +
        '  max_m DOUBLE,' +
        '  CONSTRAINT pk_ngi PRIMARY KEY (table_name, geom_id),' +
        '  CONSTRAINT fk_ngi_nti_tn FOREIGN KEY (table_name) REFERENCES nga_table_index(table_name)' +
        ')',
    ],
    feature_tile_link: [
      'CREATE TABLE nga_feature_tile_link (' +
        '  feature_table_name TEXT NOT NULL,' +
        '  tile_table_name TEXT NOT NULL,' +
        '  CONSTRAINT pk_nftl PRIMARY KEY (feature_table_name, tile_table_name)' +
        ')',
    ],
    extended_relations: [
      'CREATE TABLE gpkgext_relations (' +
        '  id INTEGER PRIMARY KEY AUTOINCREMENT,' +
        '  base_table_name TEXT NOT NULL,' +
        "  base_primary_column TEXT NOT NULL DEFAULT 'id'," +
        '  related_table_name TEXT NOT NULL,' +
        "  related_primary_column TEXT NOT NULL DEFAULT 'id'," +
        '  relation_name TEXT NOT NULL,' +
        '  mapping_table_name TEXT NOT NULL UNIQUE' +
        ')',
    ],
    contents_id: [
      'CREATE TABLE nga_contents_id (' +
        '  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,' +
        '  table_name TEXT NOT NULL,' +
        '  CONSTRAINT uk_nci_table_name UNIQUE (table_name),' +
        '  CONSTRAINT fk_nci_gc_tn FOREIGN KEY (table_name) REFERENCES gpkg_contents(table_name)' +
        ')',
    ],
  };
}

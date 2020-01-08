import GeoPackage from "../../geoPackage";
import BaseExtension from '../baseExtension';
import Extension from '../extension';
import {RTreeIndexDao} from './rtreeIndexDao'
import {FeatureDao} from '../../features/user/featureDao'
import EnvelopeBuilder from '../../geom/envelopeBuilder'
import { GeometryData } from '../../geom/geometryData'
/**
 * RTreeIndex extension
 * @class RTreeIndex
 * @extends BaseExtension
 * @param {module:geoPackage~GeoPackage} geoPackage The GeoPackage object
 */
export default class RTreeIndex extends BaseExtension {
  tableName: string;
  primaryKeyColumn: string;
  columnName: string;
  featureCount: number;
  rtreeIndexDao: RTreeIndexDao;
  extensionExists: boolean;
  constructor(geoPackage: GeoPackage, featureDao: FeatureDao) {
    super(geoPackage);
    this.extensionName = Extension.buildExtensionName(RTreeIndexDao.EXTENSION_RTREE_INDEX_AUTHOR, RTreeIndexDao.EXTENSION_RTREE_INDEX_NAME_NO_AUTHOR);
    this.extensionDefinition = RTreeIndexDao.EXTENSION_RTREE_INDEX_DEFINITION;
    this.tableName = featureDao.table_name;
    this.primaryKeyColumn = featureDao.idColumns[0];
    this.columnName = featureDao.getGeometryColumnName();
    this.featureCount = featureDao.count();
    this.rtreeIndexDao = new RTreeIndexDao(geoPackage, featureDao);
    this.extensionExists = this.hasExtension(this.extensionName, this.tableName, this.columnName);
  }
  getRTreeIndexExtension(): Extension[] {
    return this.getExtension(this.extensionName, this.tableName, this.columnName);
  }
  async getOrCreateExtension(): Promise<Extension> {
    return this.getOrCreate(this.extensionName, this.tableName, this.columnName, this.extensionDefinition, Extension.WRITE_ONLY);
  }
  /**
   * 
   * @param {Function} [progress] progress function
   * @returns {Promise}
   */
  async create(progress?: Function): Promise<Extension[]> {
    let safeProgress = progress || function () { };
    if (this.extensionExists) {
      return this.getRTreeIndexExtension();
    }
    await this.getOrCreate(this.extensionName, this.tableName, this.columnName, RTreeIndexDao.EXTENSION_RTREE_INDEX_DEFINITION, Extension.WRITE_ONLY)
    this.createAllFunctions();
    this.createRTreeIndex();
    safeProgress({
      description: 'Creating Feature Index',
      count: 0,
      totalCount: this.featureCount,
      layer: this.tableName
    });
    this.loadRTreeIndex();
    this.createAllTriggers();
    return this.getRTreeIndexExtension();
  }
  createAllTriggers() {
    var insertTrigger = 'CREATE TRIGGER rtree_' + this.tableName + '_' + this.columnName + '_insert AFTER INSERT ON ' + this.tableName +
      '  WHEN (new.' + this.columnName + ' NOT NULL AND NOT ST_IsEmpty(NEW.' + this.columnName + ')) ' +
      'BEGIN ' +
      '  INSERT OR REPLACE INTO rtree_' + this.tableName + '_' + this.columnName + ' VALUES (' +
      '    NEW.' + this.primaryKeyColumn + ',' +
      '    ST_MinX(NEW.' + this.columnName + '), ST_MaxX(NEW.' + this.columnName + '), ' +
      '    ST_MinY(NEW.' + this.columnName + '), ST_MaxY(NEW.' + this.columnName + ') ' +
      '  ); ' +
      'END;';
    var update1Trigger = 'CREATE TRIGGER rtree_' + this.tableName + '_' + this.columnName + '_update1 AFTER UPDATE OF ' + this.columnName + ' ON ' + this.tableName +
      '  WHEN OLD.' + this.primaryKeyColumn + ' = NEW.' + this.primaryKeyColumn + ' AND ' +
      '     (NEW.' + this.columnName + ' NOTNULL AND NOT ST_IsEmpty(NEW.' + this.columnName + ')) ' +
      'BEGIN ' +
      '  INSERT OR REPLACE INTO rtree_' + this.tableName + '_' + this.columnName + ' VALUES (' +
      '    NEW.' + this.primaryKeyColumn + ',' +
      '    ST_MinX(NEW.' + this.columnName + '), ST_MaxX(NEW.' + this.columnName + '), ' +
      '    ST_MinY(NEW.' + this.columnName + '), ST_MaxY(NEW.' + this.columnName + ') ' +
      '  ); ' +
      'END;';
    var update2Trigger = 'CREATE TRIGGER rtree_' + this.tableName + '_' + this.columnName + '_update2 AFTER UPDATE OF ' + this.columnName + ' ON ' + this.tableName +
      '  WHEN OLD.' + this.primaryKeyColumn + ' = NEW.' + this.primaryKeyColumn + ' AND ' +
      '       (NEW.' + this.columnName + ' ISNULL OR ST_IsEmpty(NEW.' + this.columnName + ')) ' +
      'BEGIN ' +
      '  DELETE FROM rtree_' + this.tableName + '_' + this.columnName + ' WHERE id = OLD.' + this.primaryKeyColumn + '; ' +
      'END;';
    var update3Trigger = 'CREATE TRIGGER rtree_' + this.tableName + '_' + this.columnName + '_update3 AFTER UPDATE OF ' + this.columnName + ' ON ' + this.tableName +
      '  WHEN OLD.' + this.primaryKeyColumn + ' != NEW.' + this.primaryKeyColumn + ' AND ' +
      '       (NEW.' + this.columnName + ' NOTNULL AND NOT ST_IsEmpty(NEW.' + this.columnName + ')) ' +
      'BEGIN ' +
      '  DELETE FROM rtree_' + this.tableName + '_' + this.columnName + ' WHERE id = OLD.' + this.primaryKeyColumn + '; ' +
      '  INSERT OR REPLACE INTO rtree_' + this.tableName + '_' + this.columnName + ' VALUES (' +
      '    NEW.' + this.primaryKeyColumn + ', ' +
      '    ST_MinX(NEW.' + this.columnName + '), ST_MaxX(NEW.' + this.columnName + '), ' +
      '    ST_MinY(NEW.' + this.columnName + '), ST_MaxY(NEW.' + this.columnName + ')' +
      '  ); ' +
      'END;';
    var update4Trigger = 'CREATE TRIGGER rtree_' + this.tableName + '_' + this.columnName + '_update4 AFTER UPDATE ON ' + this.tableName +
      '  WHEN OLD.' + this.primaryKeyColumn + ' != NEW.' + this.primaryKeyColumn + ' AND ' +
      '       (NEW.' + this.columnName + ' ISNULL OR ST_IsEmpty(NEW.' + this.columnName + ')) ' +
      'BEGIN ' +
      '  DELETE FROM rtree_' + this.tableName + '_' + this.columnName + ' WHERE id IN (OLD.' + this.primaryKeyColumn + ', NEW.' + this.primaryKeyColumn + '); ' +
      'END;';
    var deleteTrigger = 'CREATE TRIGGER rtree_' + this.tableName + '_' + this.columnName + '_delete AFTER DELETE ON ' + this.tableName +
      '  WHEN old.' + this.columnName + ' NOT NULL ' +
      'BEGIN' +
      '  DELETE FROM rtree_' + this.tableName + '_' + this.columnName + ' WHERE id = OLD.' + this.primaryKeyColumn + '; ' +
      'END;';
    this.connection.run(insertTrigger);
    this.connection.run(update1Trigger);
    this.connection.run(update2Trigger);
    this.connection.run(update3Trigger);
    this.connection.run(update4Trigger);
    this.connection.run(deleteTrigger);
  }
  loadRTreeIndex() {
    return this.connection.run('INSERT OR REPLACE INTO rtree_' + this.tableName + '_' + this.columnName + ' SELECT ' + this.primaryKeyColumn + ', st_minx(' + this.columnName + '), st_maxx(' + this.columnName + '), st_miny(' + this.columnName + '), st_maxy(' + this.columnName + ') FROM ' + this.tableName);
  }
  createRTreeIndex() {
    return this.connection.run('CREATE VIRTUAL TABLE rtree_' + this.tableName + '_' + this.columnName + ' USING rtree(id, minx, maxx, miny, maxy)');
  }
  createAllFunctions() {
    this.createMinXFunction();
    this.createMaxXFunction();
    this.createMinYFunction();
    this.createMaxYFunction();
    this.createIsEmptyFunction();
  }
  createMinXFunction() {
    this.connection.registerFunction('ST_MinX', function (buffer) {
      var geom = new GeometryData(buffer);
      var envelope = geom.envelope;
      if (!envelope) {
        envelope = EnvelopeBuilder.buildEnvelopeWithGeometry(geom.geometry);
      }
      return envelope.minX;
    });
  }
  createMinYFunction() {
    this.connection.registerFunction('ST_MinY', function (buffer) {
      var geom = new GeometryData(buffer);
      var envelope = geom.envelope;
      if (!envelope) {
        envelope = EnvelopeBuilder.buildEnvelopeWithGeometry(geom.geometry);
      }
      return envelope.minY;
    });
  }
  createMaxXFunction() {
    this.connection.registerFunction('ST_MaxX', function (buffer) {
      var geom = new GeometryData(buffer);
      var envelope = geom.envelope;
      if (!envelope) {
        envelope = EnvelopeBuilder.buildEnvelopeWithGeometry(geom.geometry);
      }
      return envelope.maxX;
    });
  }
  createMaxYFunction() {
    this.connection.registerFunction('ST_MaxY', function (buffer) {
      var geom = new GeometryData(buffer);
      var envelope = geom.envelope;
      if (!envelope) {
        envelope = EnvelopeBuilder.buildEnvelopeWithGeometry(geom.geometry);
      }
      return envelope.maxY;
    });
  }
  createIsEmptyFunction() {
    this.connection.registerFunction('ST_IsEmpty', function (buffer) {
      var geom = new GeometryData(buffer);
      return !geom || geom.empty || !geom.geometry;
    });
  }
}

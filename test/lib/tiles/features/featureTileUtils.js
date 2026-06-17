/**
 * Feature Tile Utils
 */
import { BoundingBox } from '../../../../lib/boundingBox';
import { GeometryColumns } from '../../../../lib/features/columns/geometryColumns';
import { ProjectionConstants } from '@ngageoint/projections-js';
import { GeometryType, LineString, Point, Polygon } from '@ngageoint/simple-features-js';
import { TableColumnKey } from '../../../../lib/db/tableColumnKey';
import { FeatureTableMetadata } from '../../../../lib/features/user/featureTableMetadata';
import { FeatureTiles } from '../../../../lib/tiles/features/featureTiles';
import { FeatureTilePointIcon } from '../../../../lib/tiles/features/featureTilePointIcon';
import { GeoPackageGeometryData } from '../../../../lib/geom/geoPackageGeometryData';
import { Canvas } from '../../../../lib/canvas/canvas';

export class FeatureTileUtils {
  static TABLE_NAME = 'feature_tiles';

  /**
   * Create feature dao
   * @param geoPackage GeoPackage
   * @return feature dao
   */
  static createFeatureDao(geoPackage) {
    const boundingBox = BoundingBox.worldWGS84();
    const geometryColumns = new GeometryColumns();
    geometryColumns.setId(new TableColumnKey(FeatureTileUtils.TABLE_NAME, 'geom'));
    geometryColumns.setGeometryType(GeometryType.GEOMETRY);
    geometryColumns.setZ(0);
    geometryColumns.setM(0);
    geometryColumns.setSrsId(ProjectionConstants.EPSG_WORLD_GEODETIC_SYSTEM);
    geoPackage.createFeatureTableWithMetadata(FeatureTableMetadata.create(geometryColumns, boundingBox));
    return geoPackage.getFeatureDao(FeatureTileUtils.TABLE_NAME);
  }

  /**
   * Insert features
   *
   * @param geoPackage
   * @param featureDao
   * @return number of features
   */
  static insertFeatures(geoPackage, featureDao) {
    let count = 0;

    count += 5;
    FeatureTileUtils.insertPoint(featureDao, 0, 0);
    FeatureTileUtils.insertPoint(featureDao, 0, ProjectionConstants.WEB_MERCATOR_MAX_LAT_RANGE - 1);
    FeatureTileUtils.insertPoint(featureDao, 0, ProjectionConstants.WEB_MERCATOR_MIN_LAT_RANGE + 1);
    FeatureTileUtils.insertPoint(featureDao, -179, 0);
    FeatureTileUtils.insertPoint(featureDao, 179, 0);

    count += 4;
    FeatureTileUtils.insertFourPoints(featureDao, 179, ProjectionConstants.WEB_MERCATOR_MAX_LAT_RANGE - 1);
    count += 4;
    FeatureTileUtils.insertFourPoints(featureDao, 90, 45);

    count += 4;
    FeatureTileUtils.insertFourLines(featureDao, [
      [135.0, 67.5],
      [90.0, 45.0],
      [135.0, 45.0],
    ]);

    count += 4;
    FeatureTileUtils.insertFourPolygons(featureDao, [
      [
        [60.0, 35.0],
        [65.0, 15.0],
        [15.0, 20.0],
        [20.0, 40.0],
      ],
      [
        [50.0, 30.0],
        [48.0, 22.0],
        [30.0, 23.0],
        [25.0, 34.0],
      ],
    ]);

    FeatureTileUtils.updateLastChange(geoPackage, featureDao);

    return count;
  }

  /**
   * Create a new feature tiles
   *
   * @param geoPackage
   * @param featureDao
   * @param useIcon
   *            true to use an icon instead of the default point
   * @return feature tiles
   */
  static async createFeatureTiles(geoPackage, featureDao, useIcon) {
    const featureTiles = new FeatureTiles(geoPackage, featureDao);

    if (useIcon) {
      const gpImage = await Canvas.createImage(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEgAAABICAQAAAD/5HvMAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAACYktHRAD/h4/MvwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAsNJREFUaN7tmc9LVFEUxz9DM9m4ciGCP9oUSG5KLDBaGPkHFARJRSFmszVatIzIxejOyk2ktAiCYYzKRRHSD1zUNssRkSCQNuk4jouxocHxtjDFcO55M+/e92aC+d7t+9734b3z3jn3HKiqqqoqVzV0M8gk86TIkSPFPC+5yxlq/Ic5wThrKM1K84jj/sF0MKVF2b3e0O49TC2j5IvCUSg2uMcBL3GOkCgaZnt9pdUrnFOsloyjUKxw0hucdVc4CkWGTvsva9U1ztZTarUbygkjHIXii83wHjXGUShG7P138laANjhmB2jKCo5C8dpOklAWV4c50LjjTZaJESVKjKTjtQ/NM/qaeIOf9BLcuTpEH0vi9avsNwPqdkgLjXscTcyKni4zoEHx6TQW9DSzLLjumAFNClv3al39guu5GdC8EMpBrSskhPecGVBKu3FM9MW1vqQZUE67cVT0DWl9v82AfrkEGtb6cmZAP1y+sgmtL2UG9FmIhZAQ1CvCv8tIceED7tO6IoLrmRnQLWHrJZoKelrEnHbbDOi0mAZmaS6AMyd6us2AwsJ3tvV77N8VSyEiDhk/S61pvn/hWFIkiTPEMBNCKG+vV+b10FWrBVqfOVAdWWs4WepsFLFPrAE9tXVmtQXUhSXNWMGZsXdQvGwF6Io9oH18M8b5LhR0LtRvDHTNbvcjyIIRzoLd5wNw3gjoghctq4+ucT5509LrZNMVzqb9/lnx5/xC67F3Xdh64Vikr6HrvWwMR0oGuu5t4zzA+5JwPnjfyz9UQnt4ncN+zDoGigYa8Gf4EuBtUTjvCPg1D2oh7YiT5qCf87IeR6Aev0d4YyLOmP8zxbBwIEwQpgxqI6OZ/bRRJl0qCHSRMurBHpz7lFVBpv/BmbZfGZaqBhZ3cBZpoALU/je4MxylQnSOPHnOUkG6yQ2qqqqq/0J/AIdZ9snhPLKlAAAAAElFTkSuQmCC',
      );
      const pointIcon = new FeatureTilePointIcon(gpImage);
      pointIcon.pinIconCenter();
      featureTiles.setPointIcon(pointIcon);
    } else {
      featureTiles.setPointColor('#0000FFFF');
    }

    featureTiles.setLineColor('#00FF00FF');

    featureTiles.setPolygonColor('#FF0000FF');

    featureTiles.setFillPolygon(true);
    featureTiles.setPolygonFillColor('#FF000050');

    featureTiles.calculateDrawOverlap();

    return featureTiles;
  }

  static insertFourPoints(featureDao, x, y) {
    FeatureTileUtils.insertPoint(featureDao, x, y);
    FeatureTileUtils.insertPoint(featureDao, x, -1 * y);
    FeatureTileUtils.insertPoint(featureDao, -1 * x, y);
    FeatureTileUtils.insertPoint(featureDao, -1 * x, -1 * y);
  }

  static insertFourLines(featureDao, points) {
    FeatureTileUtils.insertLine(featureDao, FeatureTileUtils.convertPoints(points, false, false));
    FeatureTileUtils.insertLine(featureDao, FeatureTileUtils.convertPoints(points, true, false));
    FeatureTileUtils.insertLine(featureDao, FeatureTileUtils.convertPoints(points, false, true));
    FeatureTileUtils.insertLine(featureDao, FeatureTileUtils.convertPoints(points, true, true));
  }

  static insertFourPolygons(featureDao, points) {
    FeatureTileUtils.insertPolygon(featureDao, FeatureTileUtils.convertPointsArray(false, false, points));
    FeatureTileUtils.insertPolygon(featureDao, FeatureTileUtils.convertPointsArray(true, false, points));
    FeatureTileUtils.insertPolygon(featureDao, FeatureTileUtils.convertPointsArray(false, true, points));
    FeatureTileUtils.insertPolygon(featureDao, FeatureTileUtils.convertPointsArray(true, true, points));
  }

  static convertPoints(points, negativeX, negativeY) {
    const newPoints = [];
    for (let i = 0; i < points.length; i++) {
      newPoints.push([negativeX ? points[i][0] * -1 : points[i][0], negativeY ? points[i][1] * -1 : points[i][1]]);
    }
    return newPoints;
  }

  static convertPointsArray(negativeX, negativeY, points) {
    const newPoints = [];
    for (let i = 0; i < points.length; i++) {
      newPoints.push(FeatureTileUtils.convertPoints(points[i], negativeX, negativeY));
    }

    return newPoints;
  }

  static insertPoint(featureDao, x, y) {
    const featureRow = featureDao.newRow();
    FeatureTileUtils.setPoint(featureRow, x, y);
    return featureDao.insert(featureRow);
  }

  static setPoint(featureRow, x, y) {
    const geomData = GeoPackageGeometryData.createWithSrsId(4326, new Point(x, y));
    featureRow.setGeometry(geomData);
  }

  static insertLine(featureDao, points) {
    const featureRow = featureDao.newRow();
    const geomData = GeoPackageGeometryData.createWithSrsId(4326, FeatureTileUtils.getLineString(points));
    featureRow.setGeometry(geomData);
    return featureDao.insert(featureRow);
  }

  static getLineString(points) {
    const lineString = new LineString(false, false);
    for (let i = 0; i < points.length; i++) {
      const point = new Point(false, false, points[i][0], points[i][1]);
      lineString.addPoint(point);
    }
    return lineString;
  }

  static insertPolygon(featureDao, points) {
    const featureRow = featureDao.newRow();
    const polygon = new Polygon();
    const geomData = GeoPackageGeometryData.createWithSrsId(4326, polygon);
    for (const ring of points) {
      const lineString = FeatureTileUtils.getLineString(ring);
      polygon.addRing(lineString);
    }
    featureRow.setGeometry(geomData);
    return featureDao.insert(featureRow);
  }

  static updateLastChange(geoPackage, featureDao) {
    const contents = featureDao.getContents();
    contents.setLastChange(new Date());
    const contentsDao = geoPackage.getContentsDao();
    contentsDao.update(contents);
  }
}

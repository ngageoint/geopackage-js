/**
 * @memberOf module:extension/scale
 * @class TileScaling
 */
import { TileScalingType } from './tileScalingType';

/**
 * Tile Scaling object, for scaling tiles from nearby zoom levels for missing
 * @constructor
 */
export class TileScaling {
  /**
   * Table name column
   * @member {String}
   */
  table_name: string;
  /**
   * scalingType field name
   * @member {String}
   */
  scaling_type: string;
  /**
   * zoomIn field name
   * @member {Number}
   */
  zoom_in: number;
  /**
   * zoomOut field name
   * @member {Number}
   */
  zoom_out: number;

  isZoomIn(): boolean {
    return (this.zoom_in == null || this.zoom_in > 0) && this.scaling_type != null && this.scaling_type != TileScalingType.OUT;
  }

  isZoomOut(): boolean {
    return (this.zoom_out == null || this.zoom_out > 0) && this.scaling_type != null && this.scaling_type != TileScalingType.IN;
  }
}

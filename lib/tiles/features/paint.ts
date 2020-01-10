/**
 * Paint module.
 * @module tiles/features
 */
export class Paint {
  color: string = '#000000FF';
  strokeWidth: number = 1.0;

  constructor() {
    
  }
  /**
   * Get the color
   * @returns {String} color String color in the format #RRGGBB or #RRGGBBAA
   */
  getColor(): string {
    return this.color;
  }
  /**
   * Get the color
   * @returns {String} color
   */
  getColorRGBA(): string {
    // assumes color is in the format #RRGGBB or #RRGGBBAA
    var red = parseInt(this.color.substr(1, 2), 16);
    var green = parseInt(this.color.substr(3, 2), 16);
    var blue = parseInt(this.color.substr(5, 2), 16);
    var alpha = 1.0;
    if (this.color.length > 7) {
      alpha = parseInt(this.color.substr(7, 2), 16) / 255;
    }
    return 'rgba(' + red + ',' + green + ',' + blue + ',' + alpha + ')';
  }
  /**
   * Set the color
   * @param {String} color String color in the format #RRGGBB or #RRGGBBAA
   */
  setColor(color: string) {
    this.color = color;
  }
  /**
   * Get the stroke width
   * @returns {Number} strokeWidth width in pixels
   */
  getStrokeWidth(): number {
    return this.strokeWidth;
  }
  /**
   * Set the stroke width
   * @param {Number} strokeWidth width in pixels
   */
  setStrokeWidth(strokeWidth: number) {
    this.strokeWidth = strokeWidth;
  }
}
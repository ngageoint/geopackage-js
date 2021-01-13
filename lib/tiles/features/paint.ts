/**
 * Paint module.
 * @module tiles/features
 */
export class Paint {
  _color = '#000000FF';
  _strokeWidth = 1.0;

  /**
   * Get the color
   * @returns {String} color String color in the format #RRGGBB or #RRGGBBAA
   */
  get color(): string {
    return this._color;
  }
  /**
   * Set the color
   * @param {String} color String color in the format #RRGGBB or #RRGGBBAA
   */
  set color(color: string) {
    this._color = color;
  }
  /**
   * Get the color
   * @returns {String} color
   */
  get colorRGBA(): string {
    // assumes color is in the format #RRGGBB or #RRGGBBAA
    const red = parseInt(this.color.substr(1, 2), 16);
    const green = parseInt(this.color.substr(3, 2), 16);
    const blue = parseInt(this.color.substr(5, 2), 16);
    let alpha = 1.0;
    if (this.color.length > 7) {
      alpha = parseInt(this.color.substr(7, 2), 16) / 255;
    }
    return 'rgba(' + red + ',' + green + ',' + blue + ',' + alpha + ')';
  }
  /**
   * Get the stroke width
   * @returns {Number} strokeWidth width in pixels
   */
  get strokeWidth(): number {
    return this._strokeWidth;
  }
  /**
   * Set the stroke width
   * @param {Number} strokeWidth width in pixels
   */
  set strokeWidth(strokeWidth: number) {
    this._strokeWidth = strokeWidth;
  }
}

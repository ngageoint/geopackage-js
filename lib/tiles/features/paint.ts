/**
 * Paint module.
 * @module tiles/features
 */
export class Paint {
  private color = '#000000FF';
  private strokeWidth = 1.0;

  /**
   * Get the color
   * @returns {String} color String color in the format #RRGGBB or #RRGGBBAA
   */
  getColor(): string {
    return this.color;
  }
  /**
   * Set the color
   * @param {String} color String color in the format #RRGGBB or #RRGGBBAA
   */
  setColor(color: string): void {
    this.color = color;
  }
  /**
   * Get the color
   * @returns {String} color
   */
  getColorRGBA(): string {
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
  getStrokeWidth(): number {
    return this.strokeWidth;
  }
  /**
   * Set the stroke width
   * @param {Number} strokeWidth width in pixels
   */
  setStrokeWidth(strokeWidth: number): void {
    this.strokeWidth = strokeWidth;
  }
}

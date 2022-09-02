/**
 * Tile image rectangle with integer dimensions
 */
export class ImageRectangle {
  /**
   * Left pixel
   */
  private left: number;

  /**
   * Right pixel
   */
  private right: number;

  /**
   * Top pixel
   */
  private top: number;

  /**
   * Bottom pixel
   */
  private bottom: number;

  /**
   * Constructor
   * @param left left pixel
   * @param top top pixel
   * @param right right pixel
   * @param bottom bottom pixel
   */
  public constructor(left: number, top: number, right: number, bottom: number) {
    this.left = left;
    this.top = top;
    this.right = right;
    this.bottom = bottom;
  }

  /**
   * Get the left
   * @return left
   */
  public getLeft(): number {
    return this.left;
  }

  /**
   * Get the right
   * @return right
   */
  public getRight(): number {
    return this.right;
  }

  /**
   * Get the top
   * @return top
   */
  public getTop(): number {
    return this.top;
  }

  /**
   * Get the bottom
   * @return bottom
   */
  public getBottom(): number {
    return this.bottom;
  }

  /**
   * Check if the rectangle is valid
   * @return true if valid
   */
  public isValid(): boolean {
    return this.left < this.right && this.top < this.bottom;
  }

  /**
   * Check if the rectangle is valid allowing empty ranges
   * @return valid
   */
  public isValidAllowEmpty(): boolean {
    return this.left <= this.right && this.top <= this.bottom;
  }

  /**
   * Round the floating point rectangle to an integer rectangle
   * @return image rectangle
   */
  public round(): ImageRectangle {
    return new ImageRectangle(
      Math.round(this.left),
      Math.round(this.top),
      Math.round(this.right),
      Math.round(this.bottom),
    );
  }

  /**
   * {@inheritDoc}
   */
  public equals(obj: ImageRectangle): boolean {
    return (
      obj != null &&
      this.left === obj.getLeft() &&
      this.right === obj.getRight() &&
      this.top === obj.getTop() &&
      this.bottom === obj.getBottom()
    );
  }
}

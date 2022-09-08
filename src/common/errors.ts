export class PathNotExists extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, PathNotExists.prototype);
  }
}

export class InvalidS3 extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, InvalidS3.prototype);
  }
}

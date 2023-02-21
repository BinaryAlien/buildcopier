import { AxiosError } from "axios";

export class ConversionError extends Error {
  public readonly source: ConversionErrorSource;

  constructor(source: ConversionErrorSource, message: string) {
    super(message);

    this.name = "ConversionError";
    this.source = source;

    // https://github.com/Microsoft/TypeScript-wiki/blob/main/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, ConversionError.prototype);
  }

  static input(message: string) {
    return new ConversionError(ConversionErrorSource.Input, message);
  }

  static network(error: any, message: string) {
    if (error instanceof Error) {
      if (
        error instanceof AxiosError &&
        error.response &&
        error.response.status !== 200
      ) {
        message =
          message + `${error.response.status} ${error.response.statusText}`;
      } else {
        message = message + error.message;
      }
    } else {
      message = message + error;
    }
    return new ConversionError(ConversionErrorSource.Network, message);
  }

  static scraper(message: string) {
    return new ConversionError(ConversionErrorSource.Scraper, message);
  }
}

export enum ConversionErrorSource {
  Input,
  Network,
  Scraper,
}

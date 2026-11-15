/**
 * An error with an HTTP status whose message is safe to send to the client.
 * Throw it from a controller or service; errorHandler turns it into a response.
 */
export class HttpError extends Error {
  constructor(status, message, details = undefined) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.details = details;
  }
}

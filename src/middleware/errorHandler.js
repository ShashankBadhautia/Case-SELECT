import { HttpError } from "../utils/httpError.js";

export function notFound(_req, res) {
  res.status(404).json({ error: "Not found" });
}

export function errorHandler(error, _req, res, _next) {
  if (error instanceof HttpError) {
    res.status(error.status).json({ message: error.message, ...error.details });
    return;
  }

  console.error(error);
  res.status(500).json({ error: "Internal server error" });
}

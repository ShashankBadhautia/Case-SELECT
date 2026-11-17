import { config } from "../config/index.js";

/**
 * Rejects browser requests whose Origin is neither an allowed API origin nor
 * this server's own origin.
 *
 * The developer SQL IDE is served by this same app, so its requests carry
 * `Origin: http://<host>`; those are allowed by comparing against the Host
 * header. Game-frontend requests carry one of the configured CORS origins.
 * Non-browser clients send no Origin and are not affected.
 *
 * CORS already blocks disallowed origins in the browser; this is defence in
 * depth for clients that do not enforce CORS.
 */
export function originGuard(req, res, next) {
  const origin = req.get("origin");
  if (!origin) return next();

  if (config.corsOrigins.includes(origin)) return next();

  const host = req.get("host");
  if (host && (origin === `http://${host}` || origin === `https://${host}`)) {
    return next();
  }

  return res.status(403).json({ error: "Origin not allowed" });
}

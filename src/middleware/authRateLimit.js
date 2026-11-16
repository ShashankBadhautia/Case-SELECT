import { rateLimit } from "express-rate-limit";

import { config } from "../config/index.js";

const base = {
  standardHeaders: "draft-7",
  legacyHeaders: false,
  // Allow tests and local tooling to exercise the API without a shared
  // in-memory counter getting in the way.
  skip: () => !config.authRateLimit.enabled,
};

/**
 * Login attempts are the brute-force target. Keyed by IP, which is fine for
 * the current single-instance deployment; put the app behind one trusted
 * proxy (and set `trust proxy`) if it is ever scaled out.
 */
export const loginRateLimiter = rateLimit({
  ...base,
  windowMs: config.authRateLimit.windowMs,
  limit: config.authRateLimit.loginMax,
  message: { error: "Too many sign-in attempts. Try again later." },
});

/** Registration is cheaper to abuse for spam, so it gets its own budget. */
export const registerRateLimiter = rateLimit({
  ...base,
  windowMs: config.authRateLimit.windowMs,
  limit: config.authRateLimit.registerMax,
  message: { error: "Too many registration attempts. Try again later." },
});

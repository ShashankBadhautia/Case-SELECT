import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_MODE_ALIASES = {
  prisma: "prisma",
  postgres: "prisma",
  postgresql: "prisma",
  pg: "prisma",
  real: "prisma",
};

/** Modes that used to select the optional SQLite dummy database, now removed. */
const REMOVED_DB_MODES = new Set(["dummy", "sqlite"]);

/**
 * Resolves DB_MODE to a known database mode. Throws on an unrecognised value
 * rather than defaulting, so a typo can never silently point the IDE at the
 * wrong database. An unset or blank value falls back to the default (prisma).
 */
function resolveDatabaseMode(raw) {
  const value = (raw ?? "").trim().toLowerCase();
  if (value === "") {
    return "prisma";
  }
  if (REMOVED_DB_MODES.has(value)) {
    throw new Error(
      `DB_MODE=${value} was removed: the SQLite dummy database no longer exists. ` +
        `The IDE talks to PostgreSQL only — set DB_MODE=prisma or unset it entirely.`,
    );
  }
  const mode = DB_MODE_ALIASES[value];
  if (!mode) {
    throw new Error(
      `Invalid DB_MODE "${raw}". Valid values: prisma (PostgreSQL). ` +
        `Accepted aliases: ${Object.keys(DB_MODE_ALIASES).join(", ")}.`,
    );
  }
  return mode;
}

/** Splits CORS_ORIGIN (comma separated) into the list sent to the CORS middleware. */
function resolveCorsOrigins(raw) {
  const value = raw ?? "";
  const origins = value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (origins.includes("*")) {
    // A wildcard cannot be combined with credentialed cookies; browsers reject
    // `Access-Control-Allow-Origin: *` for requests that send a cookie.
    throw new Error("CORS_ORIGIN=* is not allowed: the API uses credentialed session cookies.");
  }
  return origins.length > 0 ? origins : ["http://localhost:5173"];
}

function resolveSessionSecret(isProduction) {
  const secret = process.env.SESSION_SECRET?.trim();
  if (secret) return secret;
  if (isProduction) {
    // Refuse to boot a production server with an ephemeral secret: every
    // restart would invalidate every session and the value would be guessable.
    throw new Error("SESSION_SECRET must be set to a long random value in production.");
  }
  const generated = randomBytes(32).toString("hex");
  console.warn(
    "SESSION_SECRET is not set; using an ephemeral development secret. " +
      "Set SESSION_SECRET to keep sessions across restarts.",
  );
  return generated;
}

function resolveCookieSameSite(raw) {
  const value = (raw ?? "").trim().toLowerCase();
  if (value === "") return "lax";
  if (!["lax", "strict", "none"].includes(value)) {
    throw new Error(`Invalid COOKIE_SAME_SITE "${raw}". Valid values: lax, strict, none.`);
  }
  return value;
}

function resolveCookieSecure(raw, isProduction) {
  if (raw === undefined || raw.trim() === "") return isProduction;
  const value = raw.trim().toLowerCase();
  if (value !== "true" && value !== "false") {
    throw new Error(`Invalid COOKIE_SECURE "${raw}". Use true or false.`);
  }
  return value === "true";
}

const isProduction = process.env.NODE_ENV === "production";

export const config = {
  port: Number(process.env.PORT ?? 3000),

  isProduction,

  // Origins allowed to call the API cross-origin. CORS_ORIGIN may be a
  // comma-separated list. Credentials are enabled, so the browser will only
  // send the session cookie to these origins.
  corsOrigins: resolveCorsOrigins(process.env.CORS_ORIGIN),

  /**
   * Which database the SQL IDE talks to. "prisma" is currently the only mode:
   * the application's real database via the main Prisma schema (default).
   */
  dbMode: resolveDatabaseMode(process.env.DB_MODE),

  // Connection string for the real database (prisma mode). Set DATABASE_URL to
  // your PostgreSQL connection string — see database.md.
  databaseUrl: process.env.DATABASE_URL ?? "",

  // ── Sessions ──────────────────────────────────────────
  // Sessions are stored in PostgreSQL (connect-pg-simple), never in memory.
  sessionSecret: resolveSessionSecret(isProduction),
  sessionTtlMs: Number(process.env.SESSION_TTL_HOURS ?? 168) * 60 * 60 * 1000,
  sessionCookieName: "caseSelect.sid",
  cookieSameSite: resolveCookieSameSite(process.env.COOKIE_SAME_SITE),
  cookieSecure: resolveCookieSecure(process.env.COOKIE_SECURE, isProduction),

  // Login/registration brute-force protection.
  authRateLimit: {
    enabled: process.env.DISABLE_AUTH_RATE_LIMIT !== "true",
    windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
    loginMax: Number(process.env.AUTH_RATE_LIMIT_LOGIN_MAX ?? 20),
    registerMax: Number(process.env.AUTH_RATE_LIMIT_REGISTER_MAX ?? 30),
  },

  // Paths are resolved relative to the project root (one level up from src/).
  paths: {
    root: path.join(__dirname, "..", ".."),
    views: path.join(__dirname, "..", "views"),
    public: path.join(__dirname, "..", "..", "public"),
  },
};

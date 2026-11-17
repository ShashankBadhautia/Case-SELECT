import session from "express-session";
import connectPgSimple from "connect-pg-simple";

import { config } from "../config/index.js";
import { getPool } from "../db/prisma.js";

const PgStore = connectPgSimple(session);

/**
 * Persistent session store backed by PostgreSQL. The table is created on
 * first use; it is intentionally not part of the Prisma schema because
 * connect-pg-simple owns its shape.
 *
 * Exported so tests (and graceful shutdown) can close it.
 */
export const sessionStore = new PgStore({
  pool: getPool(),
  tableName: "session",
  createTableIfMissing: true,
  // Expire rows in the background; the timer is unref'd so it never holds the
  // process open.
  pruneSessionInterval: 60 * 60,
});

export const sessionMiddleware = session({
  store: sessionStore,
  name: config.sessionCookieName,
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    sameSite: config.cookieSameSite,
    secure: config.cookieSecure,
    maxAge: config.sessionTtlMs,
    path: "/",
  },
});

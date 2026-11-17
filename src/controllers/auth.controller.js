import {
  createUser,
  getUserById,
  validateRegistration,
  verifyCredentials,
} from "../services/auth.service.js";
import { config } from "../config/index.js";
import { sessionUserId } from "../utils/session.js";
import { HttpError } from "../utils/httpError.js";

/** Generic message for every failed sign-in, so accounts cannot be probed. */
const INVALID_CREDENTIALS = "Invalid username or password.";

/**
 * Starts a fresh session for `user` after a privilege change, so an existing
 * session can never be upgraded in place (session fixation).
 */
function startSession(req, user) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) return reject(error);
      req.session.userId = user.id;
      req.session.save((saveError) => (saveError ? reject(saveError) : resolve()));
    });
  });
}

export async function register(req, res) {
  const { username, email, password, confirmPassword } = req.body ?? {};

  const fields = validateRegistration({ username, email, password, confirmPassword });
  if (Object.keys(fields).length > 0) {
    throw new HttpError(400, "Please fix the highlighted fields.", { fields });
  }

  const user = await createUser({ username, email, password });
  await startSession(req, user);
  res.status(201).json({ user });
}

export async function login(req, res) {
  const body = req.body ?? {};
  const identifier = body.identifier ?? body.username ?? body.email;

  if (typeof identifier !== "string" || identifier.trim() === "" || typeof body.password !== "string" || body.password === "") {
    throw new HttpError(400, "Username/email and password are required.");
  }

  const user = await verifyCredentials(identifier, body.password);
  if (!user) throw new HttpError(401, INVALID_CREDENTIALS);

  await startSession(req, user);
  res.json({ user });
}

export function logout(req, res) {
  if (!req.session) {
    res.json({ ok: true });
    return;
  }

  req.session.destroy((error) => {
    if (error) {
      res.status(500).json({ error: "Could not log out." });
      return;
    }
    res.clearCookie(config.sessionCookieName, { path: "/" });
    res.json({ ok: true });
  });
}

export async function me(req, res) {
  const id = sessionUserId(req);
  const user = id ? await getUserById(id) : null;
  if (!user) throw new HttpError(401, "Not authenticated.");

  // Explicit allow-list: never spread the Prisma row, so a future schema
  // change cannot accidentally expose the password hash.
  res.json({
    user: { id: user.id, username: user.username, email: user.email },
  });
}

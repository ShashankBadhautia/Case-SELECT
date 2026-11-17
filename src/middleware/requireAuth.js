import { getUserById } from "../services/auth.service.js";
import { sessionUserId } from "../utils/session.js";

/**
 * Requires a signed-in user. Loads the account from the database on every
 * request rather than trusting the session payload, so a deleted account or a
 * tampered session cannot keep a stale identity alive.
 *
 * Adds `req.user` = { id, username, email } (never the password hash).
 */
export async function requireAuth(req, res, next) {
  try {
    const id = sessionUserId(req);
    const user = id ? await getUserById(id) : null;

    if (!user) {
      // Drop a session that points at a missing account.
      if (req.session) {
        await new Promise((resolve) => req.session.destroy(() => resolve()));
      }
      res.status(401).json({ error: "Authentication required." });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

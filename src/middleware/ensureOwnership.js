import { HttpError } from "../utils/httpError.js";

/**
 * Ensures the user id in the URL (`:userId`, or `:id` on /api/users/:id/...)
 * belongs to the signed-in user. The session, not the URL, is the source of
 * truth: changing the id in a request can only ever yield 403.
 */
export function ensureOwnUser(req, _res, next) {
  const raw = req.params.userId ?? req.params.id;
  const requestedId = Number(raw);

  if (!Number.isInteger(requestedId) || requestedId <= 0) {
    next(new HttpError(400, "User id must be a positive integer"));
    return;
  }

  if (!req.user || requestedId !== req.user.id) {
    next(new HttpError(403, "You do not have access to that player's progress."));
    return;
  }

  next();
}

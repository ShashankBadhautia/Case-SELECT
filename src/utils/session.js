/** Reads the authenticated user's id off the session, or null. */
export function sessionUserId(req) {
  const id = req.session?.userId;
  return Number.isInteger(id) && id > 0 ? id : null;
}

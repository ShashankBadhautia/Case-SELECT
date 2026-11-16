import argon2 from "argon2";

import { getPrisma } from "../db/prisma.js";
import { HttpError } from "../utils/httpError.js";

/**
 * Registration, credential checking and account lookup. The HTTP layer is in
 * auth.controller.js; the session itself lives on req.session and is managed
 * by middleware/session.js.
 *
 * Only the fields below are ever returned to clients. `password` (an Argon2id
 * hash) is selected explicitly where it is needed and never serialised.
 */
export const PUBLIC_USER = { id: true, username: true, email: true };

const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,32}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 200;

/**
 * Validates registration input. Returns a map of field name -> message,
 * empty when every field is acceptable. Shared shape with the frontend's
 * client-side checks, but the server is the authority.
 */
export function validateRegistration({ username, email, password, confirmPassword }) {
  const fields = {};

  if (typeof username !== "string" || !USERNAME_PATTERN.test(username)) {
    fields.username = "Username must be 3-32 letters, numbers or underscores.";
  }

  if (typeof email !== "string" || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    fields.email = "Enter a valid email address.";
  }

  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    fields.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  } else if (password.length > MAX_PASSWORD_LENGTH) {
    fields.password = `Password must be at most ${MAX_PASSWORD_LENGTH} characters.`;
  }

  if (confirmPassword !== undefined && confirmPassword !== password) {
    fields.confirmPassword = "Passwords do not match.";
  }

  return fields;
}

/** Creates a user with an Argon2id hash. Throws 409 on a unique conflict. */
export async function createUser({ username, email, password }) {
  const prisma = await getPrisma();

  // Friendly field-level errors. The database unique constraint below is the
  // real guard (two concurrent requests can both pass this check).
  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
    select: { username: true, email: true },
  });
  if (existing) {
    const fields = {};
    if (existing.username === username) fields.username = "That username is taken.";
    if (existing.email === email) fields.email = "That email is already registered.";
    throw new HttpError(409, "Unable to create that account.", { fields });
  }

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  try {
    return await prisma.user.create({
      data: { username, email, password: passwordHash },
      select: PUBLIC_USER,
    });
  } catch (error) {
    if (error?.code === "P2002") {
      // Lost a race with another registration; report without probing which
      // of the two fields collided.
      throw new HttpError(409, "That username or email is already in use.");
    }
    throw error;
  }
}

/**
 * Verifies a username-or-email + password pair.
 *
 * Returns the public user on success, or null. The caller turns null into a
 * single generic 401 so the response never reveals whether an account exists.
 * When there is no matching user (or the account has no credential) we still
 * spend an Argon2id operation so the timing does not leak the difference.
 */
export async function verifyCredentials(identifier, password) {
  const prisma = await getPrisma();
  const id = typeof identifier === "string" ? identifier.trim() : "";

  const user = id
    ? await prisma.user.findFirst({
        where: { OR: [{ username: id }, { email: id }] },
        select: { ...PUBLIC_USER, password: true },
      })
    : null;

  let matches = false;
  if (user?.password) {
    try {
      matches = await argon2.verify(user.password, password);
    } catch {
      matches = false;
    }
  } else {
    // Equal-work dummy operation; the result is discarded.
    await argon2.hash(password, { type: argon2.argon2id }).catch(() => {});
  }

  if (!user || !matches) return null;
  const { password: _password, ...publicUser } = user;
  return publicUser;
}

/** Loads the currently signed-in user, or null. */
export async function getUserById(id) {
  const prisma = await getPrisma();
  const user = await prisma.user.findUnique({
    where: { id },
    select: PUBLIC_USER,
  });
  return user ?? null;
}

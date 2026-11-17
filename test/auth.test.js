import { after, before, test } from "node:test";
import { strict as assert } from "node:assert";

import { getPool, getPrisma } from "../src/db/prisma.js";
import { Client, startServer, uniqueName } from "./helpers/server.js";

/**
 * End-to-end authentication and authorisation tests against the real app and
 * the real database. Every test user is created with a unique name and removed
 * afterwards; the seeded "detective" row and case content are never modified.
 */

let server;
const createdUsernames = [];

before(async () => {
  server = await startServer();
});

after(async () => {
  const prisma = await getPrisma();
  if (createdUsernames.length > 0) {
    await prisma.user.deleteMany({ where: { username: { in: createdUsernames } } });
  }
  await prisma.$disconnect();
  await getPool().end();
  await server?.close();
});

const PASSWORD = "a-strong-password";

async function register({ username = uniqueName(), email = `${username}@example.test`, password = PASSWORD }) {
  createdUsernames.push(username);
  const client = new Client(server.baseUrl);
  const result = await client.post("/api/auth/register", {
    username,
    email,
    password,
    confirmPassword: password,
  });
  return { client, ...result };
}

test("registration creates an account, hashes the password and starts a session", async () => {
  const username = uniqueName();
  const { res, payload, client } = await register({ username });

  assert.equal(res.status, 201);
  assert.equal(payload.user.username, username);
  assert.ok(payload.user.id);
  assert.equal("password" in payload.user, false, "response must not carry the password");

  const setCookie = res.headers.getSetCookie?.().join("; ") ?? "";
  assert.match(setCookie, /caseSelect\.sid=/, "session cookie is set");
  assert.match(setCookie, /HttpOnly/, "cookie is HttpOnly");
  assert.match(setCookie, /SameSite=Lax/, "cookie is SameSite=Lax");

  const prisma = await getPrisma();
  const row = await prisma.user.findUnique({ where: { username }, select: { password: true } });
  assert.match(row.password, /^\$argon2id\$/, "stored credential is an Argon2id hash");

  const me = await client.get("/api/auth/me");
  assert.equal(me.res.status, 200);
  assert.equal(me.payload.user.username, username);
  assert.equal("password" in me.payload.user, false);
});

test("duplicate username and duplicate email are rejected with 409", async () => {
  const username = uniqueName();
  const email = `${username}@example.test`;
  await register({ username, email });

  const sameName = await new Client(server.baseUrl).post("/api/auth/register", {
    username,
    email: `${uniqueName()}@example.test`,
    password: PASSWORD,
    confirmPassword: PASSWORD,
  });
  assert.equal(sameName.res.status, 409);
  assert.match(sameName.payload.fields.username, /taken/i);

  const sameEmail = await new Client(server.baseUrl).post("/api/auth/register", {
    username: uniqueName(),
    email,
    password: PASSWORD,
    confirmPassword: PASSWORD,
  });
  assert.equal(sameEmail.res.status, 409);
  assert.match(sameEmail.payload.fields.email, /already registered/i);
});

test("registration validates username, email, password and confirmation", async () => {
  const base = { username: uniqueName(), email: `${uniqueName()}@example.test`, password: PASSWORD };

  const cases = [
    { ...base, username: "ab", expect: "username" },
    { ...base, email: "not-an-email", expect: "email" },
    { ...base, password: "short", confirmPassword: "short", expect: "password" },
    { ...base, confirmPassword: "different-password", expect: "confirmPassword" },
  ];

  for (const payload of cases) {
    const { res, payload: body } = await new Client(server.baseUrl).post("/api/auth/register", payload);
    assert.equal(res.status, 400, `expected 400 for ${payload.expect}`);
    assert.ok(body.fields?.[payload.expect], `expected a ${payload.expect} error`);
  }
});

test("login works with either the username or the email", async () => {
  const username = uniqueName();
  const email = `${username}@example.test`;
  await register({ username, email });

  for (const identifier of [username, email]) {
    const client = new Client(server.baseUrl);
    const { res, payload } = await client.post("/api/auth/login", { identifier, password: PASSWORD });
    assert.equal(res.status, 200, `login by ${identifier}`);
    assert.equal(payload.user.username, username);

    const me = await client.get("/api/auth/me");
    assert.equal(me.res.status, 200);
  }
});

test("failed logins return one generic 401 and never reveal the account", async () => {
  const username = uniqueName();
  await register({ username });

  const wrongPassword = await new Client(server.baseUrl).post("/api/auth/login", {
    identifier: username,
    password: "wrong-password",
  });
  const unknownAccount = await new Client(server.baseUrl).post("/api/auth/login", {
    identifier: uniqueName("ghost"),
    password: "wrong-password",
  });
  const missingFields = await new Client(server.baseUrl).post("/api/auth/login", { identifier: username });

  assert.equal(wrongPassword.res.status, 401);
  assert.equal(unknownAccount.res.status, 401);
  assert.equal(wrongPassword.payload.message, unknownAccount.payload.message);
  assert.equal(missingFields.res.status, 400);
});

test("the legacy demo player has no credential and cannot log in", async () => {
  const prisma = await getPrisma();
  const detective = await prisma.user.findUnique({
    where: { username: "detective" },
    select: { id: true, username: true, password: true },
  });
  assert.ok(detective, "detective still exists");
  assert.equal(detective.password, null, "legacy placeholder password was cleared");

  const login = await new Client(server.baseUrl).post("/api/auth/login", {
    identifier: "detective",
    password: "not-a-real-hash",
  });
  assert.equal(login.res.status, 401);
});

test("logout destroys the server session and clears the cookie", async () => {
  const { client } = await register({});

  const before = await client.get("/api/auth/me");
  assert.equal(before.res.status, 200);

  const out = await client.post("/api/auth/logout");
  assert.equal(out.res.status, 200);
  assert.match(out.res.headers.getSetCookie?.().join("; ") ?? "", /caseSelect\.sid=/);

  const after = await client.get("/api/auth/me");
  assert.equal(after.res.status, 401, "session no longer authenticates");
});

test("player routes require a session", async () => {
  const { payload } = await register({});
  const userId = payload.user.id;
  const anon = new Client(server.baseUrl);

  const progress = await anon.get(`/api/users/${userId}/progress`);
  const session = await anon.get(`/api/users/${userId}/cases/C001/session`);
  const dialogue = await anon.post(`/api/users/${userId}/cases/C001/session/dialogue`, { sequenceId: 1 });

  assert.equal(progress.res.status, 401);
  assert.equal(session.res.status, 401);
  assert.equal(dialogue.res.status, 401);
});

test("a signed-in user cannot reach another player's progress by changing the id", async () => {
  const alice = await register({});
  const bob = await register({});

  const own = await alice.client.get(`/api/users/${alice.payload.user.id}/progress`);
  assert.equal(own.res.status, 200);

  const foreignProgress = await alice.client.get(`/api/users/${bob.payload.user.id}/progress`);
  const foreignSession = await alice.client.get(`/api/users/${bob.payload.user.id}/cases/C001/session`);
  const foreignAction = await alice.client.post(`/api/users/${bob.payload.user.id}/cases/C001/session/dialogue`, {
    sequenceId: 1,
  });

  assert.equal(foreignProgress.res.status, 403);
  assert.equal(foreignSession.res.status, 403);
  assert.equal(foreignAction.res.status, 403);

  // Bob's progress must be untouched by Alice's rejected request.
  const bobProgress = await bob.client.get(`/api/users/${bob.payload.user.id}/progress`);
  assert.equal(bobProgress.res.status, 200);
  assert.deepEqual(bobProgress.payload, []);
});

test("an authenticated player can still progress a case, and progress survives logout/login", async () => {
  const { client, payload } = await register({});
  const userId = payload.user.id;

  const first = await client.get(`/api/users/${userId}/cases/C001/session`);
  assert.equal(first.res.status, 200);
  assert.equal(first.payload.progress.currentStep.sequenceId, 1);
  assert.equal(first.payload.progress.currentStep.type, "DIALOGUE");

  const completed = await client.post(`/api/users/${userId}/cases/C001/session/dialogue`, { sequenceId: 1 });
  assert.equal(completed.res.status, 200);
  assert.equal(completed.payload.progress.currentStep.sequenceId, 2);

  // A brand-new session (logout then login) sees the same progress.
  await client.post("/api/auth/logout");
  const again = new Client(server.baseUrl);
  const login = await again.post("/api/auth/login", {
    identifier: payload.user.username,
    password: PASSWORD,
  });
  assert.equal(login.res.status, 200);

  const resumed = await again.get(`/api/users/${userId}/cases/C001/session`);
  assert.equal(resumed.res.status, 200);
  assert.equal(resumed.payload.progress.currentStep.sequenceId, 2);
});

test("CORS allows the configured frontend origin and carries credentials", async () => {
  const allowed = await fetch(`${server.baseUrl}/api/auth/me`, {
    headers: { Origin: "http://localhost:5173" },
  });
  assert.equal(allowed.headers.get("access-control-allow-origin"), "http://localhost:5173");
  assert.equal(allowed.headers.get("access-control-allow-credentials"), "true");

  const denied = await fetch(`${server.baseUrl}/api/auth/me`, {
    headers: { Origin: "http://evil.example" },
  });
  assert.equal(denied.headers.get("access-control-allow-origin"), null);
});

test("a disallowed Origin is rejected on state-changing requests", async () => {
  const direct = await fetch(`${server.baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "http://evil.example" },
    body: JSON.stringify({ identifier: "x", password: "y" }),
  });
  const payload = await direct.json();
  assert.equal(direct.status, 403);
  assert.match(payload.error, /origin/i);
});

test("the developer SQL IDE and public case list stay reachable without a game session", async () => {
  const anon = new Client(server.baseUrl);

  const cases = await anon.get("/api/cases");
  assert.equal(cases.res.status, 200);
  assert.ok(Array.isArray(cases.payload));

  const ideStatus = await anon.get("/api/ide/status");
  assert.equal(ideStatus.res.status, 200);

  // The username lookup is public and non-sensitive (id + username only).
  const lookup = await anon.get("/api/users/by-username/detective");
  assert.equal(lookup.res.status, 200);
  assert.equal(lookup.payload.username, "detective");
  assert.equal("password" in lookup.payload, false);
});

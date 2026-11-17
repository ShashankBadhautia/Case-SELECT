# Case-SELECT

A 2D pixel-art detective game. You walk through a crime scene, question
witnesses, and crack the case by writing SQL against the case records.

The design doc's game loop: enter a location, explore it, talk to people, find
clues, then answer the open question with a query. A right answer adds
evidence and unlocks the next place to go.
 
| Piece | Stack | Port |
| --- | --- | --- |
| Backend API and developer SQL IDE | Express 5, Prisma 7, PostgreSQL | `3000` |
| Game | React 19, Phaser 4, Vite 8 | `5173` |

## Quick start

Requires Node.js 22.18+ (Prisma 7's generated client is TypeScript that Node
loads natively) and a PostgreSQL database.

```bash
npm install
cp .env.example .env            # set DATABASE_URL
npm run db:generate
npx prisma migrate deploy       # create the tables
node prisma/seed.js             # case C001 + the "detective" player
npm run dev                     # backend on :3000

cd frontend
npm install
cp .env.example .env
npm run dev                     # game on :5173
```

Open <http://localhost:5173> and register an account; your case progress is
saved to it. (Set `SESSION_SECRET` in `.env` if you want sessions to survive a
backend restart.)

Controls: WASD or arrow keys to walk, E or Space to talk, inspect or use a
terminal, C for the case file, Esc for the menu. In a terminal, Ctrl/⌘ + Enter
runs the query.

## How a case works

A case is a numbered list of steps. Each step happens at a location and is
either a **dialogue** (talk to an NPC) or a **query** (answer a question at that
location's records terminal). The server owns progression:

- The player can enter the case's start location plus the location of every
  step they have reached. Doors to anywhere else stay locked.
- Finishing a dialogue or answering a query moves the player to the next step.
- Answers are graded on the server. A query stores `answerValues` (values that
  must appear together in one result row) and `maxRows` (so `SELECT *` on a
  whole table does not count). Players can write the query however they like.
- Answering a query reveals its evidence and unlock message. Finishing the last
  step closes the case.

Case C001, "The Murderer Is Not a Suspect", is the doc's "Case Select 000":
20 steps, 8 queries, 8 pieces of evidence. Its content lives in
[`prisma/data/caseC001.js`](prisma/data/caseC001.js), including notes on what
was added to the doc so it plays end to end.

## Authentication

Players register and sign in. The server keeps the session in PostgreSQL
(`connect-pg-simple`) and sends it as an HttpOnly cookie; there is no
`VITE_PLAYER_USERNAME` any more. The player is whoever the session says they
are, and every player route checks that the `:userId` in the URL belongs to
that session — changing the id in a request returns 403.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Create an account and start a session |
| `POST` | `/api/auth/login` | Sign in with username or email |
| `POST` | `/api/auth/logout` | Destroy the session and clear the cookie |
| `GET` | `/api/auth/me` | The signed-in player (id, username, email) |

- Passwords are Argon2id hashes. `users.password` is `NULL` for legacy rows
  (the seeded `detective`), so no default credential is ever assigned and
  those accounts cannot sign in.
- Every failed sign-in returns the same generic `401`, so accounts cannot be
  probed. Registration reports a duplicate username or email as `409`.
- Login and registration are rate limited per IP.
- The cookie is `caseSelect.sid`: HttpOnly, `SameSite=Lax`, `Secure` in
  production, `SESSION_TTL_HOURS` long (7 days by default). SameSite=Lax plus
  the JSON-only API and an Origin allow-list is the CSRF defence; set
  `COOKIE_SAMESITE`/`COOKIE_SECURE` if the game and API live on different
  sites.
- The developer SQL IDE (`/api/ide/*`) is **not** behind player auth. It keeps
  its own Connect/Disconnect and full database access.

## Player SQL safety

Queries typed in the game go through
[`src/services/playerSql.service.js`](src/services/playerSql.service.js): one
`SELECT` or `WITH` statement, no `pg_*` or `information_schema`, every table
read (checked with `EXPLAIN`) must be one of the case's investigation tables,
and it runs in a read-only transaction with a 3 second timeout. The `users`
table is therefore out of reach from the game.

## API

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/cases` | Case list with description, difficulty and step count |
| `GET` | `/api/cases/:id` | One case |
| `GET` | `/api/cases/:id/steps` | Full step list (answers left out) |
| `POST` | `/api/cases/:id/sql` | Run SQL against the case records, ungraded |
| `GET` | `/api/users/by-username/:username` | Look up a player (public, non-sensitive) |
| `GET` | `/api/users/:id/progress` | A player's status in each case — **requires the session's own id** |
| `GET` | `/api/users/:userId/cases/:caseId/session` | Case, locations, NPCs, tables and the player's progress — **requires the session's own id** |
| `POST` | `/api/users/:userId/cases/:caseId/session/dialogue` | `{ sequenceId }`: finish the current dialogue step |
| `POST` | `/api/users/:userId/cases/:caseId/session/answer` | `{ sequenceId, sql }`: answer the current query step |
| `PUT` | `/api/users/:userId/cases/:caseId/session/location` | `{ locationId }`: move to an unlocked location |
| `DELETE` | `/api/users/:userId/cases/:caseId/session` | Restart the case |
| `GET` | `/api/dialogues/:id`, `/api/locations/:id`, `/api/locations/:id/npcs` | Lookups |
| `POST` | `/api/queries/:id/execute` | Older ungraded runner, kept for compatibility |

Session actions name the step they complete. If it is not the player's current
step the server answers `409` with the real progress, so a double click never
skips a step. Requests for another player's id are rejected with `401` (no
session) or `403` (someone else's).

## Project structure

```
prisma/
  schema.prisma, migrations/
  data/caseC001.js          case content (story, steps, queries, investigation data)
  seed.js                   loads every case file, creates the demo player
src/                        backend (Express, MVC)
  db/prisma.js              shared Prisma client and pg pool
  services/
    auth.service.js         registration, Argon2id credentials, lookups
    caseProgression.js      pure game rules (unit tested)
    caseSession.service.js  loads a playthrough, applies player actions
    grading.js              decides if a result answers a question
    playerSql.service.js    guarded runner for player SQL
  middleware/
    session.js              PostgreSQL session store (connect-pg-simple)
    requireAuth.js          401 unless the session names a user
    ensureOwnership.js      403 unless the URL's user id is the session's
    originGuard.js          rejects disallowed Origin headers
    authRateLimit.js        login/registration rate limits
  controllers/ routes/ utils/ views/ (SQL IDE)
  controllers/auth.controller.js, routes/auth.routes.js
frontend/src/
  auth/                     AuthProvider + useAuth (HttpOnly session cookie)
  pages/                    TitleScreen, LoginPage, RegisterPage, GamePage
  game/                     Phaser: scenes, world layouts, tiles, characters
  ui/                       React overlays: dialogue, terminal, case file, HUD
  hooks/ api/ styles/
test/                       backend unit + HTTP integration tests (node --test)
```

See [`frontend/README.md`](frontend/README.md) for how the game is put
together and how to add locations, NPCs and cases.

## Environment variables

Backend (`.env`):

| Variable | Default | Description |
| --- | --- | --- |
| `DATABASE_URL` | none | PostgreSQL connection string |
| `PORT` | `3000` | Backend port |
| `CORS_ORIGIN` | `http://localhost:5173` | Origin(s) allowed to call the API (comma-separated) |
| `DB_MODE` | `prisma` | SQL IDE database mode (PostgreSQL only) |
| `SESSION_SECRET` | dev-generated | Session signing secret; **required in production** |
| `SESSION_TTL_HOURS` | `168` | Session lifetime (7 days) |
| `COOKIE_SAME_SITE` | `lax` | `lax`, `strict` or `none` |
| `COOKIE_SECURE` | `true` in production | Send the cookie only over HTTPS |
| `DISABLE_AUTH_RATE_LIMIT` | `false` | Set `true` to turn off login/registration limits |
| `AUTH_RATE_LIMIT_LOGIN_MAX` | `20` | Login attempts allowed per window, per IP |
| `AUTH_RATE_LIMIT_REGISTER_MAX` | `30` | Registration attempts allowed per window, per IP |

Frontend (`frontend/.env`):

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:3000` | Backend origin |
| `VITE_PORT` | `5173` | Dev server port |

The player is whoever the session cookie belongs to; there is no player name
to configure.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Backend with file watching |
| `npm start` | Backend |
| `npm test` | Backend tests |
| `npm run db:generate` | Regenerate the Prisma client |
| `node prisma/seed.js` | Reset case content and all progress (users are kept) |
| `cd frontend && npm run dev` | Game dev server |
| `cd frontend && npm run build` | Production build to `frontend/dist` |
| `cd frontend && npm run lint` | ESLint |

## Art

Tiles and characters are Kenney.nl packs released under CC0. See
[`frontend/public/assets/CREDITS.md`](frontend/public/assets/CREDITS.md).

## Developer SQL IDE

A standalone database workbench for developers, served by the backend at
`http://localhost:3000/`. It is separate from the game's records terminal and
has full access to the database. Provides:

- A syntax-highlighted editor (`Ctrl`/`⌘` + `Enter` to run)
- A terminal for `\commands`
- A schema explorer
- A results table with error feedback
- Explicit `Connect` / `Disconnect`

The IDE reaches the database only through a provider interface
(`src/models/databaseProvider.js`), so changing databases is configuration, not
code.

### Multiple statements

Paste several statements at once; each runs in order and gets its own result
block. Execution stops at the first failure, and the error names the statement.

```sql
SELECT * FROM cases;
SELECT * FROM guests;
```

Statement splitting understands SQL, so semicolons inside string literals,
quoted identifiers, `$$` bodies and comments are not mistaken for breaks.

### Transactions

`BEGIN`, `COMMIT`, `ROLLBACK`, `SAVEPOINT`, `ROLLBACK TO SAVEPOINT` and
`RELEASE` work, in one submission or across several. The provider pins its pool
to a single connection so transaction control applies reliably.

```sql
BEGIN;
UPDATE cases SET "caseName" = 'Renamed' WHERE id = 'C001';
ROLLBACK;   -- change discarded
```

> `INSERT`/`UPDATE`/`DELETE` report `0 row(s)`: the raw query API returns no
> result set for them, so affected-row counts are unavailable.

### Terminal commands

| Command | Effect |
| --- | --- |
| `\connect` | Connect to the configured database |
| `\disconnect` | Disconnect |
| `\status` | Show connection status |
| `\dt` | List all tables |
| `\d <table>` | Describe a table's columns |
| `\history` | Show executed query history |
| `\help` | List available commands |
| `\clear` | Clear the terminal |

### Writing SQL against Prisma models

Prisma maps camelCase model fields to camelCase PostgreSQL columns, so raw SQL
must quote them:

```sql
-- lowercase / snake_case columns need no quotes
SELECT guest_id, guest_name FROM guests WHERE is_suspect = true;

-- camelCase Prisma columns must be quoted
SELECT "caseName" FROM cases WHERE id = 'C001';
```

See [`database.md`](database.md) for full connection and provider details.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| "Can't reach the case server" | Start the backend, or fix `VITE_API_BASE_URL` |
| `Player "detective" not found` | Run `node prisma/seed.js` |
| CORS error in the console | Set `CORS_ORIGIN` to the game's origin |
| Prisma client errors | `npm run db:generate` |
| Tables missing | `npx prisma migrate deploy` |
| Frontend refuses to start on :5173 | Port busy: free it or set `VITE_PORT` and `CORS_ORIGIN` |

Open work is listed in [SUGGESTED_IMPROVEMENTS.md](SUGGESTED_IMPROVEMENTS.md).

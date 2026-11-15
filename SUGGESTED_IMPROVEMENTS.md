# Suggested improvements

Open work, roughly in priority order.

Done since the dashboard version of this list: case description and difficulty
are stored, answers are graded on the server, progress and location are saved,
hints are served with each question, and the final query replaces the separate
culprit form.

## 1. A database role for player SQL

Player queries are restricted in code (single SELECT, `EXPLAIN` table
allowlist, read-only transaction, timeout). A dedicated PostgreSQL role with
`SELECT` granted on the investigation tables only, used by
`playerSql.service.js` through its own connection string, would enforce the
same rule in the database itself. This matters most on a superuser
connection, where functions like `pg_read_file` exist; the code blocks `pg_*`
names but a role would make that unnecessary.

## 2. Authentication

There is no login. Every browser plays as `VITE_PLAYER_USERNAME`, resolved
through `GET /api/users/by-username/:username`, and the session routes trust
the user id in the URL. Add sessions or tokens, take the user from the
request, and drop the username lookup. The design doc's flow (intro for
logged-out players, case files once logged in) fits the title screen as is.

## 3. Case availability

Every case with steps is playable. If cases should unlock in order, store the
rule on the case (for example `requiresCaseId`) and have `GET /api/cases`
return `locked` for the current player.

## 4. Player stats

Level, XP, queries run and similar numbers need columns on `User` (or a stats
table) and the rules that update them.

## 5. Detective notes

A per-case notes field the player can type into from the case file, stored on
`UserProgress` or its own table.

## 6. Story text for scenes

Inspectable objects in `frontend/src/game/world/layouts` carry short flavour
lines written alongside the layouts. If the content team wants to own them,
move them into a table keyed by case and location.

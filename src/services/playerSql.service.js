import { getPool } from "../db/prisma.js";
import { HttpError } from "../utils/httpError.js";
import { splitSqlStatements } from "../utils/sqlStatements.js";

/**
 * Runs SQL typed by a player inside the game.
 *
 * Guards, in order:
 *   1. exactly one statement, and it must be a SELECT (or WITH ... SELECT)
 *   2. no system catalogs or pg_* functions
 *   3. EXPLAIN lists every table the query would read; each must be one of
 *      the case's investigation tables (so `users` and its password hashes
 *      stay out of reach)
 *   4. the query runs in a READ ONLY transaction with a statement timeout,
 *      then rolls back
 *
 * A dedicated database role with SELECT on the investigation tables only
 * would be a stronger guarantee; see SUGGESTED_IMPROVEMENTS.md.
 */

const STATEMENT_TIMEOUT_MS = 3000;
const MAX_DISPLAY_ROWS = 200;

/** A problem with the player's SQL (400). Its message is safe to show the player. */
export class PlayerSqlError extends HttpError {
  constructor(message) {
    super(400, message);
    this.name = "PlayerSqlError";
  }
}

function stripLeadingComments(sql) {
  return sql.replace(/^(\s+|--[^\n]*\n?|\/\*[\s\S]*?\*\/)+/, "");
}

/** Returns the single statement in `sql`, or throws PlayerSqlError. */
export function validatePlayerSql(sql) {
  if (typeof sql !== "string" || sql.trim() === "") {
    throw new PlayerSqlError("Write a query first.");
  }

  const statements = splitSqlStatements(sql).filter((s) => s.trim() !== "");
  if (statements.length !== 1) {
    throw new PlayerSqlError("Run one query at a time.");
  }

  const statement = statements[0].trim();
  const firstWord = stripLeadingComments(statement).split(/\s|\(/, 1)[0].toUpperCase();
  if (firstWord !== "SELECT" && firstWord !== "WITH") {
    throw new PlayerSqlError("Detectives only read the records: use SELECT.");
  }

  if (/\bpg_\w+|\binformation_schema\b/i.test(statement)) {
    throw new PlayerSqlError("Stick to the case records. System tables are off limits.");
  }

  return statement;
}

/** Collects every "Relation Name" in an EXPLAIN (FORMAT JSON) plan tree. */
export function relationsInPlan(plan, found = new Set()) {
  if (Array.isArray(plan)) {
    plan.forEach((node) => relationsInPlan(node, found));
  } else if (plan && typeof plan === "object") {
    if (typeof plan["Relation Name"] === "string") {
      found.add(plan["Relation Name"]);
    }
    Object.values(plan).forEach((value) => relationsInPlan(value, found));
  }
  return found;
}

function toJsonValue(value) {
  if (typeof value === "bigint") return Number(value);
  if (value instanceof Date) return value.toISOString();
  return value ?? null;
}

/** Turns a pg Postgres error into a message for the player, or rethrows. */
function explainDatabaseError(error) {
  // Postgres errors carry a SQLSTATE code; anything else is a server fault.
  if (typeof error?.code !== "string") throw error;
  if (error.code === "57014") {
    throw new PlayerSqlError("That query took too long. Try narrowing it down.");
  }
  throw new PlayerSqlError(error.message);
}

/**
 * Runs one player SELECT against the investigation tables.
 *
 * @param {string} sql
 * @param {string[]} allowedTables table names the query may read
 * @returns {Promise<{ columns: string[], rows: unknown[][], rowCount: number, truncated: boolean }>}
 *   rows are arrays (one value per column), so duplicate column names survive.
 */
export async function runPlayerQuery(sql, allowedTables) {
  const statement = validatePlayerSql(sql);
  const allowed = new Set(allowedTables);
  const client = await getPool().connect();

  try {
    await client.query("BEGIN READ ONLY");
    await client.query(`SET LOCAL statement_timeout = ${STATEMENT_TIMEOUT_MS}`);

    let result;
    try {
      const explained = await client.query(`EXPLAIN (FORMAT JSON) ${statement}`);
      const blocked = [...relationsInPlan(explained.rows[0]["QUERY PLAN"])].filter(
        (table) => !allowed.has(table),
      );
      if (blocked.length > 0) {
        throw new PlayerSqlError(
          `"${blocked[0]}" is not part of this case's records.`,
        );
      }

      result = await client.query({ text: statement, rowMode: "array" });
    } catch (error) {
      if (error instanceof PlayerSqlError) throw error;
      explainDatabaseError(error);
    }

    const rows = result.rows.map((row) => row.map(toJsonValue));
    return {
      columns: result.fields.map((field) => field.name),
      rows,
      rowCount: rows.length,
      truncated: rows.length > MAX_DISPLAY_ROWS,
    };
  } finally {
    await client.query("ROLLBACK").catch(() => {});
    client.release();
  }
}

/** Trims a result for display without changing what was graded. */
export function forDisplay(result) {
  return { ...result, rows: result.rows.slice(0, MAX_DISPLAY_ROWS) };
}

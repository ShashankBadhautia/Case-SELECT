/**
 * Decides whether a player's query result answers a case question.
 *
 * A query's answer is described by data, not by a reference SQL string:
 *   answerValues  values that must all appear together in one result row
 *   maxRows       optional upper bound on the number of rows returned
 *
 * Comparing values instead of whole result sets lets players write the query
 * their own way (SELECT *, a JOIN, different column order) while maxRows stops
 * "dump the whole table" from counting as an answer.
 */

/** Cell values compare as trimmed, lower-cased text: 50000 matches "50000". */
export function normalizeValue(value) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().toLowerCase();
  return String(value).trim().toLowerCase();
}

function rowContainsAll(row, expected) {
  const cells = new Set(Object.values(row).map(normalizeValue));
  return expected.every((value) => cells.has(value));
}

/**
 * @param {object[]} rows    result rows as plain objects (column -> value)
 * @param {{ answerValues: string[], maxRows?: number | null }} answer
 * @returns {{ correct: boolean, reason: "correct" | "empty" | "too_many_rows" | "no_match" }}
 */
export function gradeResult(rows, { answerValues, maxRows }) {
  if (!Array.isArray(answerValues) || answerValues.length === 0) {
    throw new Error("Query has no answerValues; it cannot be graded");
  }

  if (rows.length === 0) {
    return { correct: false, reason: "empty" };
  }

  if (maxRows != null && rows.length > maxRows) {
    return { correct: false, reason: "too_many_rows" };
  }

  const expected = answerValues.map(normalizeValue);
  const correct = rows.some((row) => rowContainsAll(row, expected));

  return { correct, reason: correct ? "correct" : "no_match" };
}

/** Player-facing feedback for each grading outcome. */
export const GRADE_FEEDBACK = {
  correct: "That's it. The records back you up.",
  empty: "Your query returned no rows. Check your filters.",
  too_many_rows: "Too many rows to prove anything. Narrow your query down.",
  no_match: "These records don't answer the question yet. Look again.",
};

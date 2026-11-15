import {
  answerQuery,
  completeDialogue,
  exploreQuery,
  getSession,
  moveToLocation,
  resetSession,
} from "../services/caseSession.service.js";
import { HttpError } from "../utils/httpError.js";

/**
 * HTTP layer for playing a case. Parses and validates input, then hands off
 * to caseSession.service.js, which owns the rules. Errors (HttpError) are
 * turned into responses by middleware/errorHandler.js.
 */

function parseUserId(req) {
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new HttpError(400, "User id must be a positive integer");
  }
  return userId;
}

function requireField(body, field) {
  const value = body?.[field];
  if (value === undefined || value === null || value === "") {
    throw new HttpError(400, `"${field}" is required`);
  }
  return value;
}

export async function getCaseSession(req, res) {
  res.json(await getSession(parseUserId(req), req.params.caseId));
}

export async function postDialogueComplete(req, res) {
  const sequenceId = requireField(req.body, "sequenceId");
  res.json(await completeDialogue(parseUserId(req), req.params.caseId, sequenceId));
}

export async function postQueryAnswer(req, res) {
  const sequenceId = requireField(req.body, "sequenceId");
  const sql = requireField(req.body, "sql");
  res.json(await answerQuery(parseUserId(req), req.params.caseId, sequenceId, sql));
}

export async function putLocation(req, res) {
  const locationId = requireField(req.body, "locationId");
  res.json(await moveToLocation(parseUserId(req), req.params.caseId, locationId));
}

export async function deleteCaseSession(req, res) {
  res.json(await resetSession(parseUserId(req), req.params.caseId));
}

export async function postExploreQuery(req, res) {
  const sql = requireField(req.body, "sql");
  res.json(await exploreQuery(req.params.id, sql));
}

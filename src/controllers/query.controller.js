import { getPrisma } from "../db/prisma.js";
import { exploreQuery } from "../services/caseSession.service.js";
import { HttpError } from "../utils/httpError.js";

/**
 * POST /api/queries/:id/execute runs a player SELECT in the case that owns
 * query :id. Kept for older clients; it does not grade. The game answers
 * queries through POST /api/users/:userId/cases/:caseId/session/answer.
 */
export const executeQuery = async (req, res) => {
  const { sql } = req.body ?? {};
  if (!sql) throw new HttpError(400, "SQL query is required");

  const prisma = await getPrisma();
  const query = await prisma.query.findUnique({
    where: { id: req.params.id },
    select: { caseId: true },
  });
  if (!query) throw new HttpError(404, "Query not found");

  res.json({ queryId: req.params.id, ...(await exploreQuery(query.caseId, sql)) });
};

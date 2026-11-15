import { getPrisma } from "../db/prisma.js";
import { HttpError } from "../utils/httpError.js";

/** Lists every case with its step count, for the title screen's case files. */
export const getCases = async (_req, res) => {
  const prisma = await getPrisma();
  const cases = await prisma.case.findMany({
    orderBy: { id: "asc" },
    include: { _count: { select: { steps: true } } },
  });

  res.json(cases.map(({ _count, ...rest }) => ({ ...rest, stepCount: _count.steps })));
};

export const getCase = async (req, res) => {
  const prisma = await getPrisma();
  const gameCase = await prisma.case.findUnique({ where: { id: req.params.id } });
  if (!gameCase) throw new HttpError(404, "Case not found");

  res.json(gameCase);
};

/**
 * The full case flow. Query answers (queryOutput, answerValues, maxRows) are
 * left out: a player could otherwise read them from the network tab.
 */
export const getCaseSteps = async (req, res) => {
  const prisma = await getPrisma();
  const steps = await prisma.caseProgress.findMany({
    where: { caseId: req.params.id },
    orderBy: { sequenceId: "asc" },
    include: {
      dialogue: { include: { npc: true } },
      evidence: true,
      location: true,
      query: {
        select: { id: true, caseId: true, title: true, question: true, difficulty: true, hint: true },
      },
    },
  });

  res.json(steps);
};

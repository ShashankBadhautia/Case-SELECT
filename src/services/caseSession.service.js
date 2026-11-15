import { getPool, getPrisma } from "../db/prisma.js";
import { HttpError } from "../utils/httpError.js";
import {
  STATUS,
  STEP_TYPE,
  buildProgress,
  currentStep,
  positionAfter,
  stepType,
  unlockedLocationIds,
} from "./caseProgression.js";
import { GRADE_FEEDBACK, gradeResult } from "./grading.js";
import { forDisplay, runPlayerQuery } from "./playerSql.service.js";

/**
 * A player's playthrough of one case: loading it, and the three things a
 * player can do (finish a dialogue, answer a query, walk to a location).
 *
 * The server owns progression. The client reports what the player did, and
 * every action names the step it completes; a stale or repeated request gets
 * a 409 carrying the real progress instead of skipping a step.
 */

const STEP_INCLUDE = {
  dialogue: { include: { npc: true } },
  query: { include: { evidences: true } },
  location: true,
};

async function loadCaseData(caseId) {
  const prisma = await getPrisma();
  const caseData = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      steps: { orderBy: { sequenceId: "asc" }, include: STEP_INCLUDE },
      queryTables: { include: { table: true } },
      startLocation: true,
    },
  });

  if (!caseData) throw new HttpError(404, `Case ${caseId} not found`);
  if (caseData.steps.length === 0) {
    throw new HttpError(409, `Case ${caseId} has no steps yet`);
  }
  return caseData;
}

async function loadPosition(userId, caseId) {
  const prisma = await getPrisma();

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) throw new HttpError(404, `Player ${userId} not found`);

  return prisma.userProgress.findUnique({ where: { userId_caseId: { userId, caseId } } });
}

async function savePosition(userId, caseId, fields) {
  const prisma = await getPrisma();
  return prisma.userProgress.upsert({
    where: { userId_caseId: { userId, caseId } },
    create: { userId, caseId, ...fields },
    update: fields,
  });
}

function investigationTableNames(caseData) {
  return caseData.queryTables.map(({ table }) => table.tableName);
}

/** Columns of each investigation table, for the in-game schema browser. */
async function describeTables(caseData) {
  const names = investigationTableNames(caseData);
  const { rows } = await getPool().query(
    `SELECT table_name, column_name, data_type
       FROM information_schema.columns
      WHERE table_schema = current_schema() AND table_name = ANY($1)
      ORDER BY table_name, ordinal_position`,
    [names],
  );

  return caseData.queryTables.map(({ table }) => ({
    name: table.tableName,
    displayName: table.displayName ?? table.tableName,
    description: table.description,
    columns: rows
      .filter((row) => row.table_name === table.tableName)
      .map((row) => ({ name: row.column_name, type: row.data_type })),
  }));
}

/** Locations and NPCs that appear anywhere in the case, for building scenes. */
function caseWorld(caseData) {
  const locations = new Map();
  if (caseData.startLocation) locations.set(caseData.startLocation.id, caseData.startLocation);

  const npcs = new Map();
  for (const step of caseData.steps) {
    if (step.location) locations.set(step.location.id, step.location);

    const dialogue = step.dialogue;
    if (dialogue && !npcs.has(dialogue.npcId)) {
      npcs.set(dialogue.npcId, {
        id: dialogue.npc.id,
        npcName: dialogue.npc.npcName,
        role: dialogue.npc.role,
        // NPCs stand where they first speak in this case.
        locationId: dialogue.locationId ?? step.locationId,
      });
    }
  }

  return {
    locations: [...locations.values()].map(({ id, locationName, description }) => ({
      id,
      locationName,
      description,
    })),
    npcs: [...npcs.values()],
  };
}

/** Throws 409 unless `sequenceId` is the player's current step of `type`. */
function requireCurrentStep(caseData, position, sequenceId, type) {
  const step = currentStep(caseData, position);

  if (!step || step.sequenceId !== Number(sequenceId) || stepType(step) !== type) {
    throw new HttpError(409, "That step is not the current one.", {
      progress: buildProgress(caseData, position),
    });
  }
  return step;
}

export async function getSession(userId, caseId) {
  const caseData = await loadCaseData(caseId);
  const position = await loadPosition(userId, caseId);

  return {
    case: {
      id: caseData.id,
      caseName: caseData.caseName,
      description: caseData.description,
      difficulty: caseData.difficulty,
      startLocationId: caseData.startLocationId,
    },
    ...caseWorld(caseData),
    tables: await describeTables(caseData),
    progress: buildProgress(caseData, position),
  };
}

/** The player finished reading a dialogue step. */
export async function completeDialogue(userId, caseId, sequenceId) {
  const caseData = await loadCaseData(caseId);
  const position = await loadPosition(userId, caseId);
  const step = requireCurrentStep(caseData, position, sequenceId, STEP_TYPE.DIALOGUE);

  const saved = await savePosition(userId, caseId, {
    ...positionAfter(caseData, step),
    locationId: position?.locationId ?? step.locationId,
  });

  return { progress: buildProgress(caseData, saved) };
}

/** The player submitted SQL as the answer to the current query step. */
export async function answerQuery(userId, caseId, sequenceId, sql) {
  const caseData = await loadCaseData(caseId);
  const position = await loadPosition(userId, caseId);
  const step = requireCurrentStep(caseData, position, sequenceId, STEP_TYPE.QUERY);

  const result = await runPlayerQuery(sql, investigationTableNames(caseData));
  const grade = gradeResult(result.rows, step.query);

  if (!grade.correct) {
    return {
      correct: false,
      feedback: GRADE_FEEDBACK[grade.reason],
      result: forDisplay(result),
      progress: buildProgress(caseData, position),
    };
  }

  const saved = await savePosition(userId, caseId, {
    ...positionAfter(caseData, step),
    locationId: position?.locationId ?? step.locationId,
  });

  return {
    correct: true,
    feedback: GRADE_FEEDBACK.correct,
    answer: step.query.queryOutput,
    unlockMessage: step.query.unlockMessage,
    evidence: step.query.evidences.map(({ id, evidenceName, description }) => ({
      id,
      evidenceName,
      description,
    })),
    result: forDisplay(result),
    progress: buildProgress(caseData, saved),
  };
}

/** The player walked into another location. */
export async function moveToLocation(userId, caseId, locationId) {
  const caseData = await loadCaseData(caseId);
  const position = await loadPosition(userId, caseId);

  if (!unlockedLocationIds(caseData, position).includes(locationId)) {
    throw new HttpError(403, "You have no reason to go there yet.");
  }

  const fields = position
    ? { locationId }
    : { locationId, status: STATUS.IN_PROGRESS, sequenceId: caseData.steps[0].sequenceId };
  const saved = await savePosition(userId, caseId, fields);

  return { progress: buildProgress(caseData, saved) };
}

/** Forgets the player's progress so the case starts over. */
export async function resetSession(userId, caseId) {
  const caseData = await loadCaseData(caseId);
  await loadPosition(userId, caseId);

  const prisma = await getPrisma();
  await prisma.userProgress.deleteMany({ where: { userId, caseId } });

  return { progress: buildProgress(caseData, null) };
}

/** Free-form SQL from a case terminal: shows results, grades nothing. */
export async function exploreQuery(caseId, sql) {
  const caseData = await loadCaseData(caseId);
  return forDisplay(await runPlayerQuery(sql, investigationTableNames(caseData)));
}

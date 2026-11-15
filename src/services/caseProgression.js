/**
 * Pure game rules for moving through a case. No database access here, so the
 * rules can be unit-tested with plain objects (see test/caseProgression.test.js).
 *
 * Vocabulary:
 *   step      one CaseProgress row: a DIALOGUE (talk to an NPC) or a QUERY
 *             (answer a question with SQL), at a location, in sequence order
 *   position  the player's saved UserProgress row, or null if not started
 *
 * `caseData` is a case loaded with its steps (see loadCaseData in
 * caseSession.service.js): steps are ordered by sequenceId and include
 * `dialogue.npc` and `query.evidences`.
 */

export const STEP_TYPE = Object.freeze({ DIALOGUE: "DIALOGUE", QUERY: "QUERY" });

export const STATUS = Object.freeze({
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
});

export function stepType(step) {
  return step.queryId ? STEP_TYPE.QUERY : STEP_TYPE.DIALOGUE;
}

/** The step the player must complete next, or null once the case is solved. */
export function currentStep(caseData, position) {
  if (position?.status === STATUS.COMPLETED) return null;
  const sequenceId = position?.sequenceId ?? caseData.steps[0]?.sequenceId;
  return caseData.steps.find((step) => step.sequenceId === sequenceId) ?? null;
}

/** Steps the player has finished, in order. */
export function completedSteps(caseData, position) {
  const current = currentStep(caseData, position);
  if (!current) {
    return position?.status === STATUS.COMPLETED ? caseData.steps : [];
  }
  return caseData.steps.filter((step) => step.sequenceId < current.sequenceId);
}

/** Where the player is after finishing `step`: the next step, or completed. */
export function positionAfter(caseData, step) {
  const next = caseData.steps.find((s) => s.sequenceId > step.sequenceId);
  return next
    ? { status: STATUS.IN_PROGRESS, sequenceId: next.sequenceId }
    : { status: STATUS.COMPLETED, sequenceId: null };
}

/**
 * Locations the player may enter: where the case starts, plus every location
 * of a step they have reached. Answering a query correctly therefore unlocks
 * the location of the step after it, as the design doc's game loop describes.
 */
export function unlockedLocationIds(caseData, position) {
  const reached = [...completedSteps(caseData, position)];
  const current = currentStep(caseData, position);
  if (current) reached.push(current);

  const ids = new Set();
  if (caseData.startLocationId) ids.add(caseData.startLocationId);
  for (const step of reached) {
    if (step.locationId) ids.add(step.locationId);
  }
  return [...ids];
}

/** Evidence uncovered by the queries the player has already answered. */
export function discoveredEvidence(caseData, position) {
  return completedSteps(caseData, position)
    .flatMap((step) => step.query?.evidences ?? [])
    .map(({ id, evidenceName, description }) => ({ id, evidenceName, description }));
}

/** The last line each NPC said, so talking to them again repeats it. */
export function lastLinesByNpc(caseData, position) {
  const lines = {};
  for (const step of completedSteps(caseData, position)) {
    const dialogue = step.dialogue;
    if (dialogue?.dialoguesList?.length) {
      lines[dialogue.npcId] = dialogue.dialoguesList.at(-1);
    }
  }
  return lines;
}

/** A step as the player may see it: never includes answers. */
export function toPublicStep(step) {
  if (!step) return null;

  const base = {
    sequenceId: step.sequenceId,
    type: stepType(step),
    locationId: step.locationId,
  };

  if (base.type === STEP_TYPE.QUERY) {
    const { id, title, question, difficulty, hint } = step.query;
    return { ...base, query: { id, title, question, difficulty, hint } };
  }

  return { ...base, npcId: step.dialogue.npcId, lines: step.dialogue.dialoguesList };
}

/** Everything the client needs to know about the player's place in a case. */
export function buildProgress(caseData, position) {
  const step = currentStep(caseData, position);
  const unlocked = unlockedLocationIds(caseData, position);
  const savedLocation = position?.locationId;

  return {
    status: position?.status ?? STATUS.NOT_STARTED,
    totalSteps: caseData.steps.length,
    completedSteps: completedSteps(caseData, position).length,
    locationId:
      savedLocation && unlocked.includes(savedLocation)
        ? savedLocation
        : (caseData.startLocationId ?? step?.locationId ?? null),
    unlockedLocationIds: unlocked,
    currentStep: toPublicStep(step),
    evidence: discoveredEvidence(caseData, position),
    npcLastLines: lastLinesByNpc(caseData, position),
  };
}

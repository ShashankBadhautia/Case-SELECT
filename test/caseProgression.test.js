import { strict as assert } from "node:assert";
import { test } from "node:test";

import {
  STATUS,
  buildProgress,
  currentStep,
  positionAfter,
  unlockedLocationIds,
} from "../src/services/caseProgression.js";

/** A three-step case: a dialogue, a query in another room, a closing dialogue. */
const caseData = {
  id: "C900",
  startLocationId: "L-street",
  steps: [
    {
      sequenceId: 1,
      locationId: "L-lobby",
      dialogueId: "D1",
      queryId: null,
      dialogue: { npcId: "N1", dialoguesList: ["Welcome, detective."] },
    },
    {
      sequenceId: 2,
      locationId: "L-kitchen",
      dialogueId: null,
      queryId: "Q1",
      query: {
        id: "Q1",
        title: "Who cooked?",
        question: "Which chef was on shift?",
        difficulty: "Easy",
        hint: "Check the rota.",
        queryOutput: "Ana",
        answerValues: ["Ana"],
        maxRows: 1,
        evidences: [{ id: "EV1", evidenceName: "Rota", description: "Ana was on shift." }],
      },
    },
    {
      sequenceId: 3,
      locationId: "L-lobby",
      dialogueId: "D2",
      queryId: null,
      dialogue: { npcId: "N1", dialoguesList: ["So it was Ana."] },
    },
  ],
};

const at = (sequenceId) => ({ status: STATUS.IN_PROGRESS, sequenceId, locationId: null });
const done = { status: STATUS.COMPLETED, sequenceId: null, locationId: null };

test("a new player starts at the first step, in the start location", () => {
  const progress = buildProgress(caseData, null);

  assert.equal(progress.status, STATUS.NOT_STARTED);
  assert.equal(progress.currentStep.sequenceId, 1);
  assert.equal(progress.locationId, "L-street");
  assert.deepEqual(progress.unlockedLocationIds, ["L-street", "L-lobby"]);
});

test("reaching a step unlocks its location", () => {
  assert.deepEqual(unlockedLocationIds(caseData, at(2)), ["L-street", "L-lobby", "L-kitchen"]);
});

test("query steps never expose the answer", () => {
  const step = buildProgress(caseData, at(2)).currentStep;

  assert.equal(step.type, "QUERY");
  assert.deepEqual(Object.keys(step.query).sort(), ["difficulty", "hint", "id", "question", "title"]);
});

test("answering a query reveals its evidence", () => {
  assert.deepEqual(buildProgress(caseData, at(2)).evidence, []);
  assert.deepEqual(buildProgress(caseData, at(3)).evidence.map((e) => e.id), ["EV1"]);
});

test("finishing the last step completes the case", () => {
  assert.deepEqual(positionAfter(caseData, caseData.steps[0]), {
    status: STATUS.IN_PROGRESS,
    sequenceId: 2,
  });
  assert.deepEqual(positionAfter(caseData, caseData.steps[2]), {
    status: STATUS.COMPLETED,
    sequenceId: null,
  });

  const progress = buildProgress(caseData, done);
  assert.equal(currentStep(caseData, done), null);
  assert.equal(progress.currentStep, null);
  assert.equal(progress.completedSteps, 3);
});

test("NPCs repeat their last line once spoken to", () => {
  assert.deepEqual(buildProgress(caseData, at(2)).npcLastLines, { N1: "Welcome, detective." });
  assert.deepEqual(buildProgress(caseData, done).npcLastLines, { N1: "So it was Ana." });
});

test("a saved location that is no longer unlocked falls back to the start", () => {
  const progress = buildProgress(caseData, { ...at(1), locationId: "L-kitchen" });
  assert.equal(progress.locationId, "L-street");
});

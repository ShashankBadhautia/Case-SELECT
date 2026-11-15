import { strict as assert } from "node:assert";
import { test } from "node:test";

import { gradeResult, normalizeValue } from "../src/services/grading.js";

const answer = (answerValues, maxRows = null) => ({ answerValues, maxRows });

test("values compare as trimmed, case-insensitive text", () => {
  assert.equal(normalizeValue("  Mushroom Risotto "), "mushroom risotto");
  assert.equal(normalizeValue(50000), "50000");
  assert.equal(normalizeValue(null), "");
});

test("a row containing the answer is correct", () => {
  const rows = [["O001", "G001", "Mushroom Risotto", "19:42", "W003"]];
  assert.deepEqual(gradeResult(rows, answer(["mushroom risotto"], 1)), {
    correct: true,
    reason: "correct",
  });
});

test("object rows work the same as array rows", () => {
  const rows = [{ dish: "Mushroom Risotto" }];
  assert.equal(gradeResult(rows, answer(["Mushroom Risotto"])).correct, true);
});

test("numbers match their text form", () => {
  assert.equal(gradeResult([["P003", "B009", "B003", 50000]], answer(["50000"], 1)).correct, true);
});

test("every answer value must sit in the same row", () => {
  const rows = [
    ["K003", "E003", "Entered Kitchen", "19:44"],
    ["K007", "E001", "Collected Grilled Salmon", "19:44"],
  ];
  assert.equal(gradeResult(rows, answer(["Entered Kitchen", "19:44"], 3)).correct, true);

  const split = [
    ["K001", "E001", "Entered Kitchen", "19:25"],
    ["K007", "E001", "Collected Grilled Salmon", "19:44"],
  ];
  assert.deepEqual(gradeResult(split, answer(["Entered Kitchen", "19:44"], 3)), {
    correct: false,
    reason: "no_match",
  });
});

test("dumping more rows than maxRows is not an answer", () => {
  const rows = Array.from({ length: 10 }, (_, i) => [`O00${i}`, "Mushroom Risotto"]);
  assert.deepEqual(gradeResult(rows, answer(["Mushroom Risotto"], 1)), {
    correct: false,
    reason: "too_many_rows",
  });
});

test("an empty result is reported as empty", () => {
  assert.deepEqual(gradeResult([], answer(["B009"])), { correct: false, reason: "empty" });
});

test("a query without answer values cannot be graded", () => {
  assert.throws(() => gradeResult([["x"]], answer([])), /no answerValues/);
});

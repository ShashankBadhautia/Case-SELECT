import express from "express";

import {
  deleteCaseSession,
  getCaseSession,
  postDialogueComplete,
  postQueryAnswer,
  putLocation,
} from "../controllers/caseSession.controller.js";
import { getUserByUsername, getUserProgress } from "../controllers/user.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { ensureOwnUser } from "../middleware/ensureOwnership.js";

const router = express.Router();

// Public: resolves a username to a non-sensitive id. Kept for older clients;
// the game takes its identity from the session instead.
router.get("/by-username/:username", getUserByUsername);

// Everything below is the signed-in player's own data. The id in the URL is
// checked against the session, so it cannot be used to reach another player.
router.get("/:id/progress", requireAuth, ensureOwnUser, getUserProgress);

// A player's playthrough of one case.
router.get("/:userId/cases/:caseId/session", requireAuth, ensureOwnUser, getCaseSession);
router.delete("/:userId/cases/:caseId/session", requireAuth, ensureOwnUser, deleteCaseSession);
router.post("/:userId/cases/:caseId/session/dialogue", requireAuth, ensureOwnUser, postDialogueComplete);
router.post("/:userId/cases/:caseId/session/answer", requireAuth, ensureOwnUser, postQueryAnswer);
router.put("/:userId/cases/:caseId/session/location", requireAuth, ensureOwnUser, putLocation);

export default router;

import express from "express";

import {
  deleteCaseSession,
  getCaseSession,
  postDialogueComplete,
  postQueryAnswer,
  putLocation,
} from "../controllers/caseSession.controller.js";
import { getUserByUsername, getUserProgress } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/by-username/:username", getUserByUsername);
router.get("/:id/progress", getUserProgress);

// A player's playthrough of one case.
router.get("/:userId/cases/:caseId/session", getCaseSession);
router.delete("/:userId/cases/:caseId/session", deleteCaseSession);
router.post("/:userId/cases/:caseId/session/dialogue", postDialogueComplete);
router.post("/:userId/cases/:caseId/session/answer", postQueryAnswer);
router.put("/:userId/cases/:caseId/session/location", putLocation);

export default router;

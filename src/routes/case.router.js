import express from "express";

import { getCase, getCaseSteps, getCases } from "../controllers/case.controller.js";
import { postExploreQuery } from "../controllers/caseSession.controller.js";

const router = express.Router();

router.get("/", getCases);
router.get("/:id/steps", getCaseSteps);
router.post("/:id/sql", postExploreQuery);
router.get("/:id", getCase);

export default router;

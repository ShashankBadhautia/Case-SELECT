import { Router } from "express";

import {
  login,
  logout,
  me,
  register,
} from "../controllers/auth.controller.js";
import { loginRateLimiter, registerRateLimiter } from "../middleware/authRateLimit.js";

const router = Router();

router.post("/register", registerRateLimiter, register);
router.post("/login", loginRateLimiter, login);
router.post("/logout", logout);
router.get("/me", me);

export default router;

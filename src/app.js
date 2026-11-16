import express from "express";
import cors from "cors";
import { config } from "./config/index.js";
import routes from "./routes/index.js";
import caseRouter from "./routes/case.router.js";
import dialogueRouter from "./routes/dialogue.router.js";
import locationRouter from "./routes/location.router.js";
import queryRouter from "./routes/query.router.js";
import userRouter from "./routes/user.router.js";
import authRouter from "./routes/auth.routes.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { originGuard } from "./middleware/originGuard.js";
import { sessionMiddleware } from "./middleware/session.js";

const app = express();

app.use(cors({ origin: config.corsOrigins, credentials: true }));

app.use(express.json({ limit: "1mb" }));

app.use(originGuard);

app.use(sessionMiddleware);

app.use(express.static(config.paths.public));

app.use("/views", express.static(config.paths.views));

app.use("/api/auth", authRouter);

app.use(routes);

app.use("/api/cases", caseRouter);
app.use("/api/dialogues", dialogueRouter);
app.use("/api/locations", locationRouter);
app.use("/api/queries", queryRouter);
app.use("/api/users", userRouter);

app.get("/", (_req, res) => {
  res.sendFile("index.html", { root: config.paths.views });
});

app.use(notFound);

app.use(errorHandler);

export default app;

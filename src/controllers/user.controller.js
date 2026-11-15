import { getPrisma } from "../db/prisma.js";
import { HttpError } from "../utils/httpError.js";

/**
 * Looks a player up by username. The app has no login yet, so the frontend
 * resolves its configured player this way; real authentication would replace
 * this (see SUGGESTED_IMPROVEMENTS.md).
 */
export const getUserByUsername = async (req, res) => {
  const prisma = await getPrisma();
  const user = await prisma.user.findUnique({
    where: { username: req.params.username },
    select: { id: true, username: true },
  });
  if (!user) throw new HttpError(404, `Player "${req.params.username}" not found. Run the seed.`);

  res.json(user);
};

/**
 * A player's progress rows, one per case they have started. A case with no
 * row has not been started.
 */
export const getUserProgress = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new HttpError(400, "User id must be an integer");

  const prisma = await getPrisma();
  const progress = await prisma.userProgress.findMany({
    where: { userId: id },
    orderBy: { caseId: "asc" },
    include: { location: true },
  });

  res.json(
    progress.map(({ location, ...rest }) => ({
      ...rest,
      locationName: location?.locationName ?? null,
    })),
  );
};

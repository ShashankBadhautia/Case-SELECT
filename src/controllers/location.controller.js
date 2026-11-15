import { getPrisma } from "../db/prisma.js";
import { HttpError } from "../utils/httpError.js";

export const getLocation = async (req, res) => {
  const prisma = await getPrisma();
  const location = await prisma.location.findUnique({ where: { id: req.params.id } });
  if (!location) throw new HttpError(404, "Location not found");

  res.json(location);
};

/** NPCs who have dialogue at this location, in any case. */
export const getLocationNpcs = async (req, res) => {
  const prisma = await getPrisma();
  const dialogues = await prisma.dialogue.findMany({
    where: { locationId: req.params.id },
    include: { npc: true },
  });

  const unique = new Map(dialogues.map(({ npc }) => [npc.id, npc]));
  res.json([...unique.values()]);
};

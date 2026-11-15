import { getPrisma } from "../db/prisma.js";
import { HttpError } from "../utils/httpError.js";

export const getDialogue = async (req, res) => {
  const prisma = await getPrisma();
  const dialogue = await prisma.dialogue.findUnique({
    where: { id: req.params.id },
    include: { npc: true, location: true },
  });
  if (!dialogue) throw new HttpError(404, "Dialogue not found");

  res.json(dialogue);
};

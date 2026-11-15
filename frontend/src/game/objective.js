import { getLayout } from "./world/layouts/index.js";

/**
 * Turns the server's current step into what the HUD says and where the
 * objective markers go. Pure presentation: the step itself comes from the API.
 */

export function locationName(session, locationId) {
  return session.locations.find((l) => l.id === locationId)?.locationName ?? locationId;
}

export function npcById(session, npcId) {
  return session.npcs.find((npc) => npc.id === npcId) ?? { id: npcId, npcName: "Stranger" };
}

export function describeObjective(session, progress) {
  const step = progress.currentStep;
  if (!step) return "Case closed.";

  const where = locationName(session, step.locationId);
  if (step.type === "DIALOGUE") {
    return `Talk to ${npcById(session, step.npcId).npcName} (${where})`;
  }

  const terminal = getLayout(step.locationId).terminal?.label ?? "records terminal";
  return `Solve "${step.query.title}" at the ${terminal.toLowerCase()} (${where})`;
}

/** Markers for the location the player is standing in. */
export function markersFor(progress, locationId) {
  const step = progress.currentStep;
  if (!step || step.locationId !== locationId) return { npcIds: [], terminal: false };

  return step.type === "DIALOGUE"
    ? { npcIds: [step.npcId], terminal: false }
    : { npcIds: [], terminal: true };
}

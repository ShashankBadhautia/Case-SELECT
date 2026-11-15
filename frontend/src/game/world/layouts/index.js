import L001 from "./L001.js";
import L002 from "./L002.js";
import L003 from "./L003.js";
import L004 from "./L004.js";
import L005 from "./L005.js";
import L006 from "./L006.js";

/** Every location the game can draw, by database id. */
export const LAYOUTS = Object.freeze(
  Object.fromEntries([L001, L002, L003, L004, L005, L006].map((layout) => [layout.id, layout])),
);

export function getLayout(locationId) {
  const layout = LAYOUTS[locationId];
  if (!layout) throw new Error(`No layout for location ${locationId}. Add one in world/layouts.`);
  return layout;
}

/**
 * Character looks, built by stacking layers from the Kenney roguelike
 * characters sheet: body, trousers, shoes, top, hair (bottom to top).
 *
 * To give a new NPC a look, add a recipe and map their id in NPC_LOOKS.
 * NPCs without a mapping fall back to FALLBACK_LOOK.
 */

const SKIN = { light: 0, tan: 54, brown: 108 };
const TROUSERS = { black: 3, teal: 219, purple: 381, green: 435 };
const SHOES = { black: 4, teal: 220, purple: 382, green: 436 };
const TOP = {
  greyCoat: 284,
  blackSuit: 502,
  whiteShirt: 226,
  purpleDress: 15,
  tealBlouse: 11,
  beigeJacket: 280,
  orangeShirt: 7,
};
const HAIR = { brownShort: 19, brownLong: 20, blackShort: 239, blackLong: 240, blonde: 235 };

export const LOOKS = Object.freeze({
  detective: [SKIN.light, TROUSERS.black, SHOES.black, TOP.greyCoat, HAIR.brownShort],
  manager: [SKIN.tan, TROUSERS.black, SHOES.black, TOP.blackSuit, HAIR.blackShort],
  waiter: [SKIN.brown, TROUSERS.black, SHOES.black, TOP.whiteShirt, HAIR.blackShort],
  guestPurple: [SKIN.tan, TROUSERS.purple, SHOES.purple, TOP.purpleDress, HAIR.blackLong],
  politician: [SKIN.light, TROUSERS.teal, SHOES.teal, TOP.tealBlouse, HAIR.brownLong],
  assistant: [SKIN.tan, TROUSERS.black, SHOES.black, TOP.beigeJacket, HAIR.blackLong],
  stranger: [SKIN.tan, TROUSERS.green, SHOES.green, TOP.orangeShirt, HAIR.blonde],
});

/** Which look each NPC (by database id) wears. */
export const NPC_LOOKS = Object.freeze({
  N001: "manager", // Rahul Sen
  N002: "waiter", // Rohan Mehra
  N003: "guestPurple", // Priya Menon
  N004: "politician", // Neha Kapoor
  N005: "assistant", // Sana Mirza
});

export const PLAYER_LOOK = "detective";
export const FALLBACK_LOOK = "stranger";

/** Texture key a look is baked into by BootScene. */
export const lookTextureKey = (look) => `look:${look}`;

export function textureForNpc(npcId) {
  return lookTextureKey(NPC_LOOKS[npcId] ?? FALLBACK_LOOK);
}

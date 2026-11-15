/**
 * Spritesheets used by the game. All are Kenney.nl packs released under CC0
 * (public domain); see public/assets/CREDITS.md.
 *
 * Every sheet is a grid of 16x16 tiles with 1px spacing. A frame number is
 * row * columns + column, counting from the top-left tile.
 */

export const TILE = 16;

export const SHEETS = Object.freeze({
  rpg: { key: "rpg", url: "/assets/kenney/roguelike-rpg.png", columns: 57 },
  indoor: { key: "indoor", url: "/assets/kenney/roguelike-indoors.png", columns: 27 },
  city: { key: "city", url: "/assets/kenney/roguelike-modern-city.png", columns: 37 },
  people: { key: "people", url: "/assets/kenney/roguelike-characters.png", columns: 54 },
});

export const SHEET_FRAME_CONFIG = { frameWidth: TILE, frameHeight: TILE, spacing: 1 };

/**
 * Named tiles and props. Layouts refer to these names, never to raw frame
 * numbers, so a room reads like a floor plan.
 *
 * A prop is { sheet, frames, solid, raised }:
 *   frames  rows of frame numbers; [[a, b], [c, d]] is a 2x2 prop
 *   solid   "all"  the whole footprint blocks movement
 *           "base" only the bottom row blocks, so the player can stand
 *                  "behind" tall things like fridges and lamps
 *           false  decoration you can walk over (rugs, floor marks)
 *   raised  true for small things that sit on furniture (papers, books):
 *           drawn above the furniture, and never blocking
 */

/** Floors: one frame from the rpg sheet, repeated. */
export const FLOORS = Object.freeze({
  parquet: 233,
  planks: 122,
  stone: 120,
  cream: 121,
  brick: 119,
});

/**
 * Wall sets on the rpg sheet. The beige, grey and blue sets share a layout,
 * offset by 7 columns each.
 */
const WALL_BASE = {
  topLeft: 700,
  top: 698,
  topRight: 701,
  side: 756,
  bottomLeft: 757,
  bottom: 698,
  bottomRight: 758,
  faceUpper: 873,
  faceLower: 868,
};

function wallSet(columnOffset) {
  return Object.fromEntries(
    Object.entries(WALL_BASE).map(([part, frame]) => [part, frame + columnOffset]),
  );
}

export const WALLS = Object.freeze({
  beige: wallSet(0),
  grey: wallSet(7),
  blue: wallSet(14),
});

const prop = (sheet, frames, solid = "all") => ({ sheet, frames, solid, raised: false });
const onFurniture = (sheet, frames) => ({ sheet, frames, solid: false, raised: true });

export const PROPS = Object.freeze({
  // ── Doors and windows (sit in the 2-tile wall face) ──
  door: prop("rpg", [[32], [89]], false),
  doorWindow: prop("rpg", [[33], [90]], false),
  doubleDoor: prop("rpg", [[317, 318], [374, 375]], false),
  windowArched: prop("rpg", [[158], [215]], false),
  windowTall: prop("rpg", [[40], [97]], false),

  // ── Dining ──
  tableLongRed: prop("indoor", [[243, 244, 245], [270, 271, 272]]),
  tableLongGreen: prop("indoor", [[250, 251, 252], [277, 278, 279]]),
  tableOvalRed: prop("indoor", [[246, 247], [273, 274]]),
  tableSmall: prop("indoor", [[7]]),
  tableSquare: prop("indoor", [[58, 59], [85, 86]]),
  chairFacingDown: prop("indoor", [[54]]),
  chairFacingUp: prop("indoor", [[55]]),
  chairFacingRight: prop("indoor", [[56]]),
  chairFacingLeft: prop("indoor", [[57]]),
  candelabra: prop("indoor", [[19]]),
  piano: prop("indoor", [[239, 240], [266, 267]]),

  // ── Bar / front of house ──
  barStool: prop("indoor", [[7]]),

  // ── Kitchen ──
  counter: prop("indoor", [[324]]),
  counterDrawers: prop("indoor", [[325]]),
  counterVent: prop("indoor", [[328]]),
  counterBottles: prop("indoor", [[329]]),
  counterPlates: prop("indoor", [[331]]),
  sink: prop("indoor", [[332]]),
  stove: prop("indoor", [[392]]),
  oven: prop("indoor", [[419]]),
  fridge: prop("indoor", [[416], [443]], "base"),
  grill: prop("indoor", [[446, 447], [473, 474]], "base"),
  prepTable: prop("indoor", [[413, 414, 415]]),

  // ── Office ──
  desk: prop("indoor", [[0, 1, 2], [27, 28, 29]]),
  deskSmall: prop("indoor", [[58, 59], [85, 86]]),
  bookshelf: prop("rpg", [[727], [841]], "base"),
  wardrobe: prop("rpg", [[199], [256]], "base"),
  cabinet: prop("rpg", [[313, 314], [370, 371]], "base"),
  drawers: prop("rpg", [[308, 309]]),
  safe: prop("rpg", [[425]]),
  armchair: prop("indoor", [[189]]),
  papers: onFurniture("rpg", [[896]]),
  scroll: onFurniture("rpg", [[899]]),
  openBook: onFurniture("rpg", [[905]]),
  inkwell: onFurniture("rpg", [[900]]),

  // ── Decoration ──
  plant: prop("indoor", [[16]]),
  plantTall: prop("indoor", [[17]]),
  lamp: prop("indoor", [[127], [154]], "base"),
  painting: prop("indoor", [[370]], false),
  paintingWide: prop("indoor", [[371, 372]], false),
  mirror: prop("indoor", [[400], [427]], false),
  clock: prop("rpg", [[482]], false),
  rugTeal: prop("indoor", [[394, 395, 396]], false),
  rugOrange: prop("indoor", [[421, 422, 423]], false),
  rugGreen: prop("indoor", [[448, 449, 450]], false),

  // ── Records terminal: where the player writes SQL ──
  terminal: prop("city", [[579], [616]], "base"),

  // ── Outdoors (city sheet) ──
  awning: prop("city", [[360]], false),
  glassDoor: prop("city", [[800, 801], [837, 838]], false),
  shopWindow: prop("city", [[582], [619]], false),
  carGreen: prop("city", [[623, 624, 625], [660, 661, 662]]),
  carGrey: prop("city", [[771, 772, 773], [808, 809, 810]]),
  carOrange: prop("city", [[919, 920, 921], [956, 957, 958]]),
  tree: prop("city", [[401], [438]], "base"),
  treeRound: prop("city", [[403], [440]], "base"),
  bush: prop("city", [[512]]),
  trashCan: prop("city", [[496]]),
  hydrant: prop("city", [[533]]),
  cone: prop("city", [[680]]),
  parkingSign: prop("city", [[901]], false),
  manhole: prop("city", [[897]], false),
});

/** Ground tiles for outdoor scenes (city sheet). */
export const GROUND = Object.freeze({
  asphalt: 898,
  sidewalk: 703,
  grass: 888,
  bayTopLeft: 792,
  bayTopRight: 793,
  bayLeft: 829,
  bayRight: 830,
  bayBottomLeft: 866,
  bayBottomRight: 867,
});

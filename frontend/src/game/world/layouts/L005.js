/** Parking Area: outside the diner, where the detective arrives. */

const COLS = 22;
const ROWS = 14;

export default {
  id: "L005",
  size: { cols: COLS, rows: ROWS },
  ground: [
    { sheet: "city", frame: 898, rect: [0, 0, COLS, ROWS] }, // asphalt
    { sheet: "city", frame: 260, rect: [0, 0, COLS, 4] }, // the diner's brick front
    { sheet: "city", frame: 149, rect: [0, 0, COLS, 1] }, // roof trim
    { sheet: "city", frame: 703, rect: [0, 4, COLS, 2] }, // sidewalk
    { sheet: "city", frame: 888, rect: [0, 6, 2, ROWS - 6] }, // grass verges
    { sheet: "city", frame: 888, rect: [COLS - 2, 6, 2, ROWS - 6] },
  ],
  blocked: [[0, 0, COLS, 4]], // the building itself
  props: [
    { prop: "awning", x: 0, y: 1, repeatX: COLS },
    { prop: "glassDoor", x: 10, y: 2 },
    { prop: "shopWindow", x: 3, y: 2 },
    { prop: "shopWindow", x: 6, y: 2 },
    { prop: "shopWindow", x: 14, y: 2 },
    { prop: "shopWindow", x: 17, y: 2 },
    { prop: "plantTall", x: 9, y: 4 },
    { prop: "plantTall", x: 12, y: 4 },
    { prop: "hydrant", x: 3, y: 5 },
    { prop: "trashCan", x: 18, y: 5 },
    { prop: "tree", x: 0, y: 7 },
    { prop: "tree", x: 0, y: 11 },
    { prop: "treeRound", x: 20, y: 7 },
    { prop: "treeRound", x: 20, y: 11 },
    { prop: "carGrey", x: 3, y: 8 },
    { prop: "carGreen", x: 15, y: 8 },
    { prop: "carOrange", x: 15, y: 11 },
    { prop: "parkingSign", x: 10, y: 12 },
    { prop: "cone", x: 8, y: 9 },
  ],
  // The sidewalk in front of the glass doors; walk up into them to enter.
  doors: [{ to: "L001", x: 10, y: 4, w: 2, h: 1, enter: "up" }],
  spawn: { x: 10, y: 11 },
  inspect: [
    { x: 3, y: 8, w: 3, h: 2, title: "Grey sedan", text: "One of the guests' cars. Nobody has driven home yet." },
    { x: 15, y: 8, w: 3, h: 2, title: "Green hatchback", text: "Parked in a hurry, half across the line." },
  ],
};

/** Main Dining Hall: the private dinner, where Vikram collapsed. */
export default {
  id: "L002",
  size: { cols: 22, rows: 13 },
  room: { walls: "beige", floor: "parquet" },
  props: [
    { prop: "windowArched", x: 3, y: 1 },
    { prop: "windowArched", x: 7, y: 1 },
    { prop: "windowArched", x: 14, y: 1 },
    { prop: "mirror", x: 11, y: 1 },
    { prop: "candelabra", x: 2, y: 3 },
    { prop: "candelabra", x: 19, y: 3 },
    { prop: "piano", x: 2, y: 9 },

    // The long table, guests seated on both sides.
    { prop: "tableLongRed", x: 8, y: 6 },
    { prop: "tableLongRed", x: 11, y: 6 },
    { prop: "chairFacingDown", x: 8, y: 5 },
    { prop: "chairFacingDown", x: 10, y: 5 },
    { prop: "chairFacingDown", x: 12, y: 5 },
    { prop: "chairFacingUp", x: 8, y: 8 },
    { prop: "chairFacingUp", x: 10, y: 8 },
    { prop: "chairFacingUp", x: 12, y: 8 },
    { prop: "chairFacingRight", x: 7, y: 6 },
    { prop: "chairFacingLeft", x: 14, y: 6 },

    { prop: "plantTall", x: 19, y: 10 },
    { prop: "plant", x: 6, y: 10 },
  ],
  doors: [
    { to: "L003", x: 18, side: "top" },
    { to: "L001", x: 10, w: 2, side: "bottom" },
  ],
  npcSpots: {
    N003: { x: 5, y: 6 }, // Priya, by the windows
    N004: { x: 16, y: 8 }, // Neha, apart from the others
  },
  spawn: { x: 10, y: 10 },
  inspect: [
    {
      x: 10, y: 6, w: 2, h: 1,
      title: "Centre of the table",
      text: "Vikram's seat. His plate is still here: a few spoonfuls of risotto, gone cold.",
    },
    { x: 2, y: 9, w: 2, h: 2, title: "Piano", text: "Nobody was playing when it happened." },
  ],
};

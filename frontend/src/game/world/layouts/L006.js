/** Vikram's Office: his business dealings. */
export default {
  id: "L006",
  size: { cols: 16, rows: 11 },
  room: { walls: "blue", floor: "parquet" },
  props: [
    { prop: "windowArched", x: 4, y: 1 },
    { prop: "windowArched", x: 11, y: 1 },
    { prop: "paintingWide", x: 7, y: 1 },
    { prop: "bookshelf", x: 1, y: 3 },
    { prop: "bookshelf", x: 2, y: 3 },
    { prop: "bookshelf", x: 14, y: 3 },
    { prop: "rugTeal", x: 6, y: 8 },
    { prop: "armchair", x: 7, y: 4 },
    { prop: "desk", x: 6, y: 5 },
    { prop: "scroll", x: 6, y: 5 },
    { prop: "papers", x: 8, y: 6 },
    { prop: "safe", x: 13, y: 8 },
    { prop: "lamp", x: 1, y: 8 },
    { prop: "plantTall", x: 14, y: 9 },
  ],
  doors: [{ to: "L001", x: 8, side: "bottom" }],
  terminal: { x: 10, y: 3, label: "Vikram's computer" },
  npcSpots: {
    N005: { x: 4, y: 7 }, // Sana, his assistant
  },
  spawn: { x: 8, y: 8 },
  inspect: [
    { x: 6, y: 5, w: 3, h: 2, title: "Vikram's desk", text: "Contracts, signed by two partners. One signature is Vikram's." },
    { x: 13, y: 8, w: 1, h: 1, title: "Safe", text: "Locked. Whatever matters tonight is in the records, not in here." },
  ],
};

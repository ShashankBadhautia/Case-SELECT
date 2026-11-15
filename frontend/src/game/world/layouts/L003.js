/** Main Kitchen: restricted, where meals were prepared and plated. */
export default {
  id: "L003",
  size: { cols: 18, rows: 12 },
  room: { walls: "grey", floor: "stone" },
  props: [
    { prop: "windowTall", x: 12, y: 1 },
    { prop: "fridge", x: 1, y: 3 },
    { prop: "fridge", x: 2, y: 3 },
    { prop: "counter", x: 3, y: 4 },
    { prop: "sink", x: 4, y: 4 },
    { prop: "counterDrawers", x: 5, y: 4 },
    { prop: "stove", x: 6, y: 4 },
    { prop: "stove", x: 7, y: 4 },
    { prop: "oven", x: 8, y: 4 },
    { prop: "counterVent", x: 9, y: 4 },
    { prop: "counter", x: 10, y: 4 },
    { prop: "grill", x: 15, y: 3 },

    // Plating area, in the middle of the room.
    { prop: "prepTable", x: 6, y: 7 },
    { prop: "counterPlates", x: 9, y: 7 },
    { prop: "counter", x: 10, y: 7 },
    { prop: "counterBottles", x: 1, y: 9 },
    { prop: "counter", x: 1, y: 10 },
  ],
  doors: [{ to: "L002", x: 9, side: "bottom" }],
  terminal: { x: 13, y: 3, label: "Kitchen log screen" },
  spawn: { x: 9, y: 9 },
  inspect: [
    { x: 6, y: 7, w: 3, h: 1, title: "Plating area", text: "Every dish passes through here before it reaches a table." },
    { x: 6, y: 4, w: 3, h: 1, title: "Stoves", text: "Wiped down already. Someone has been tidying." },
  ],
};

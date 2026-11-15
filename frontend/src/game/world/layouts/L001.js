/**
 * The Red Lantern Diner, front of house. The hub: doors lead to the dining
 * hall, the staff office, Vikram's office and back out to the parking area.
 */
export default {
  id: "L001",
  size: { cols: 20, rows: 12 },
  room: { walls: "beige", floor: "brick" },
  props: [
    { prop: "windowArched", x: 6, y: 1 },
    { prop: "paintingWide", x: 12, y: 1 },
    { prop: "clock", x: 14, y: 1 },
    // The bar, with stools in front of it.
    { prop: "counterBottles", x: 1, y: 7 },
    { prop: "counter", x: 2, y: 7 },
    { prop: "counterPlates", x: 3, y: 7 },
    { prop: "counter", x: 4, y: 7 },
    { prop: "counterBottles", x: 1, y: 3 },
    { prop: "counterPlates", x: 2, y: 3 },
    { prop: "barStool", x: 2, y: 8 },
    { prop: "barStool", x: 4, y: 8 },
    { prop: "rugOrange", x: 8, y: 7 },
    { prop: "rugOrange", x: 8, y: 8 },
    { prop: "tableSmall", x: 14, y: 6 },
    { prop: "chairFacingRight", x: 13, y: 6 },
    { prop: "chairFacingLeft", x: 15, y: 6 },
    { prop: "tableSmall", x: 14, y: 9 },
    { prop: "chairFacingRight", x: 13, y: 9 },
    { prop: "chairFacingLeft", x: 15, y: 9 },
    { prop: "plantTall", x: 18, y: 3 },
    { prop: "plant", x: 1, y: 10 },
    { prop: "plant", x: 18, y: 10 },
  ],
  doors: [
    { to: "L004", x: 3, side: "top" },
    { to: "L002", x: 9, w: 2, side: "top" },
    { to: "L006", x: 16, side: "top" },
    { to: "L005", x: 9, w: 2, side: "bottom" },
  ],
  terminal: { x: 4, y: 3, label: "Order terminal" },
  npcSpots: {
    N001: { x: 10, y: 5 }, // Rahul, the manager, meets you at the door
    N002: { x: 6, y: 8 }, // Rohan, by the bar
  },
  spawn: { x: 9, y: 9 },
  inspect: [
    { x: 1, y: 7, w: 4, h: 1, title: "Bar", text: "Glasses half-full. The evening stopped mid-pour." },
    { x: 1, y: 3, w: 2, h: 1, title: "Back counter", text: "Order slips are kept on the terminal now, not on paper." },
  ],
};

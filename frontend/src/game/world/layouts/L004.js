/** Staff Office: employee records and the diner's finances. */
export default {
  id: "L004",
  size: { cols: 14, rows: 11 },
  room: { walls: "beige", floor: "planks" },
  props: [
    { prop: "windowTall", x: 9, y: 1 },
    { prop: "clock", x: 6, y: 1 },
    { prop: "cabinet", x: 1, y: 3 },
    { prop: "drawers", x: 1, y: 6 },
    { prop: "bookshelf", x: 11, y: 3 },
    { prop: "bookshelf", x: 12, y: 3 },
    { prop: "chairFacingDown", x: 7, y: 5 },
    { prop: "desk", x: 6, y: 6 },
    { prop: "papers", x: 6, y: 6 },
    { prop: "inkwell", x: 8, y: 6 },
    { prop: "openBook", x: 7, y: 7 },
    { prop: "plant", x: 1, y: 9 },
  ],
  doors: [{ to: "L001", x: 7, side: "bottom" }],
  terminal: { x: 4, y: 3, label: "Accounts computer" },
  spawn: { x: 7, y: 8 },
  inspect: [
    { x: 1, y: 3, w: 2, h: 2, title: "Cabinet", text: "Employee files and bank details for payroll." },
    { x: 6, y: 6, w: 3, h: 2, title: "Ledger", text: "The diner's accounts. The real records are on the computer." },
  ],
};

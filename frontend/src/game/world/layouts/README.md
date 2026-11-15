# Location layouts

One file per location id. A layout says **where things are**; the database
says **what happens** (who speaks, which query is asked). Story content never
goes here.

Coordinates are in tiles (16px), `x` from the left, `y` from the top.

```js
export default {
  id: "L004",
  size: { cols: 14, rows: 11 },     // includes the walls
  room: { walls: "beige", floor: "planks" }, // or `ground` for outdoor scenes
  props: [{ prop: "desk", x: 5, y: 4 }],      // names from ../tiles.js
  doors: [{ to: "L001", x: 7, side: "bottom" }],
  terminal: { x: 2, y: 3, label: "Staff records" }, // where SQL questions are solved
  npcSpots: { N001: { x: 9, y: 6 } },          // NPC id -> standing tile
  spawn: { x: 7, y: 8 },                        // first visit / fallback
  inspect: [{ x: 5, y: 4, title: "Desk", text: "..." }],
};
```

Room conventions (`room` layouts):

- Row 0 is the top edge, rows 1–2 are the wall face, the floor starts at row 3.
- `side: "top"` doors sit in the wall face; `side: "bottom"` doors open the
  bottom edge. The player walks into a door to use it.
- Outdoor doors give the trigger zone and direction explicitly:
  `{ to, x, y, w, h, enter: "up" }`.
- Wall decorations (`windowArched`, `painting`, ...) go at `y: 1`.

Register new layouts in `index.js`.

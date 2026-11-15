import { SHEETS, TILE } from "./assets.js";
import { FLOORS, PROPS, WALLS } from "./tiles.js";

/**
 * Turns a layout (see layouts/README.md) into a flat description of the
 * scene: what to draw, which tiles block movement, and where the doors,
 * terminal and inspectable spots are. LocationScene draws the result.
 *
 * Kept free of Phaser so the layout rules are easy to read and change.
 */

const rect = (x, y, w = 1, h = 1) => ({ x, y, w, h });

/** Ground paints and blocked tiles for a walled room. */
function roomShell(layout) {
  const { cols, rows } = layout.size;
  const walls = WALLS[layout.room.walls];
  const floor = FLOORS[layout.room.floor];
  const paint = (frame, r) => ({ sheet: "rpg", frame, rect: [r.x, r.y, r.w, r.h] });
  const last = { x: cols - 1, y: rows - 1 };

  const ground = [
    paint(floor, rect(1, 3, cols - 2, rows - 4)),
    paint(walls.top, rect(1, 0, cols - 2)),
    paint(walls.faceUpper, rect(1, 1, cols - 2)),
    paint(walls.faceLower, rect(1, 2, cols - 2)),
    paint(walls.side, rect(0, 1, 1, rows - 2)),
    paint(walls.side, rect(last.x, 1, 1, rows - 2)),
    paint(walls.bottom, rect(1, last.y, cols - 2)),
    paint(walls.topLeft, rect(0, 0)),
    paint(walls.topRight, rect(last.x, 0)),
    paint(walls.bottomLeft, rect(0, last.y)),
    paint(walls.bottomRight, rect(last.x, last.y)),
  ];

  const blocked = [
    [0, 0, cols, 3], // top edge and wall face
    [0, 0, 1, rows], // left
    [last.x, 0, 1, rows], // right
    [0, last.y, cols, 1], // bottom
  ];

  return { ground, blocked, floor };
}

/**
 * Resolves a door: the zone that triggers it, the direction the player must
 * be walking (`enter`) to go through, what to draw, and where the player
 * appears when they arrive through it. `side` doors are shorthand for rooms.
 *
 * Doors in the top wall stay solid: the zone is the floor tile in front, and
 * walking up into the door uses it. Doors in the bottom wall are a gap.
 */
function resolveDoor(door, layout) {
  const w = door.w ?? 1;

  if (door.side === "top") {
    return {
      to: door.to,
      enter: "up",
      zone: rect(door.x, 3, w, 1),
      prop: { prop: w === 2 ? "doubleDoor" : "door", x: door.x, y: 1 },
      spawn: { x: door.x + w / 2, y: 3.9 },
    };
  }

  if (door.side === "bottom") {
    const y = layout.size.rows - 1;
    return {
      to: door.to,
      enter: "down",
      zone: rect(door.x, y, w, 1),
      opening: rect(door.x, y, w, 1),
      floorGap: true,
      spawn: { x: door.x + w / 2, y: y - 0.4 },
    };
  }

  const h = door.h ?? 1;
  return {
    to: door.to,
    enter: door.enter ?? "up",
    zone: rect(door.x, door.y, w, h),
    spawn: door.spawn ?? { x: door.x + w / 2, y: door.y + h - 0.1 },
  };
}

/** Expands `repeatX` props into one entry per copy. */
function expandProps(props) {
  return props.flatMap((entry) =>
    Array.from({ length: entry.repeatX ?? 1 }, (_, i) => ({ ...entry, x: entry.x + i })),
  );
}

function propFootprint(entry) {
  const def = PROPS[entry.prop];
  if (!def) throw new Error(`Unknown prop "${entry.prop}". Add it to world/tiles.js.`);

  const h = def.frames.length;
  const w = def.frames[0].length;
  return { def, w, h };
}

export function buildLocation(layout) {
  const { cols, rows } = layout.size;
  const shell = layout.room ? roomShell(layout) : { ground: [], blocked: [], floor: null };

  const ground = [...shell.ground, ...(layout.ground ?? [])];
  const blocked = Array.from({ length: rows }, () => new Array(cols).fill(false));
  const block = ([x, y, w, h], value = true) => {
    for (let ty = y; ty < y + h; ty += 1) {
      for (let tx = x; tx < x + w; tx += 1) {
        if (blocked[ty]?.[tx] !== undefined) blocked[ty][tx] = value;
      }
    }
  };

  [...shell.blocked, ...(layout.blocked ?? [])].forEach((r) => block(r));

  const doors = (layout.doors ?? []).map((door) => resolveDoor(door, layout));
  const props = expandProps(layout.props ?? []);

  for (const door of doors) {
    if (door.prop) props.push(door.prop);
    if (door.opening) {
      const { x, y, w, h } = door.opening;
      block([x, y, w, h], false);
      if (door.floorGap && shell.floor) {
        ground.push({ sheet: "rpg", frame: shell.floor, rect: [x, y, w, h] });
      }
    }
  }

  let terminal = null;
  if (layout.terminal) {
    const { x, y, label } = layout.terminal;
    props.push({ prop: "terminal", x, y });
    terminal = { label, spot: { x: x + 0.5, y: y + 2 } };
  }

  const sprites = [];
  for (const entry of props) {
    const { def, w, h } = propFootprint(entry);

    // Solid things sort with the characters by their base; rugs and wall
    // decorations always stay behind. Raised items sit just above their furniture.
    const sortY = def.raised ? entry.y + h + 0.5 : def.solid ? entry.y + h : 0;
    def.frames.forEach((row, dy) =>
      row.forEach((frame, dx) => {
        sprites.push({
          sheet: SHEETS[def.sheet].key,
          frame,
          x: entry.x + dx,
          y: entry.y + dy,
          sortY,
        });
      }),
    );

    if (def.solid === "all") block([entry.x, entry.y, w, h]);
    if (def.solid === "base") block([entry.x, entry.y + h - 1, w, 1]);
  }

  return {
    id: layout.id,
    size: { cols, rows, width: cols * TILE, height: rows * TILE },
    ground,
    sprites,
    blocked,
    doors,
    terminal,
    npcSpots: layout.npcSpots ?? {},
    spawn: layout.spawn,
    inspect: (layout.inspect ?? []).map(({ x, y, w = 1, h = 1, title, text }) => ({
      title,
      text,
      spot: { x: x + w / 2, y: y + h / 2 },
      area: rect(x, y, w, h),
    })),
  };
}

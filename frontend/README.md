# Case-SELECT game frontend

React draws the menus and overlays. Phaser draws the world. The backend decides
what every action means.

```
src/
  pages/
    TitleScreen.jsx      logo, detective intro, case files
    GamePage.jsx         one case: Phaser underneath, overlays on top
  game/
    PhaserGame.jsx       mounts Phaser, passes it the location to draw
    bridge.js            the only channel between React and Phaser (events)
    objective.js         turns the current step into HUD text and markers
    scenes/
      BootScene.js       loads the sheets, bakes character textures
      LocationScene.js   draws a location, moves the player, reports interactions
    world/
      assets.js          spritesheet list
      tiles.js           named tiles and props (frame numbers live only here)
      characters.js      character looks and which NPC wears which
      buildLocation.js   turns a layout into tiles, collision, doors, hotspots
      layouts/           one file per location (see layouts/README.md)
  ui/                    dialogue box, SQL terminal, case file, HUD, menus
  hooks/                 useCaseSession (server state), usePlayer, keyboard helpers
  api/client.js          one function per backend route
  styles/                tokens.css (palette, fonts), base, title, game
```

## How a frame of play flows

1. `LocationScene` notices the player pressed E next to Rohan and emits
   `TALK { npcId: "N002" }` on the bridge.
2. `GamePage` checks the server's current step. If it is Rohan's line, it opens
   the dialogue box; otherwise Rohan repeats what he said last.
3. When the line is read, `useCaseSession` posts it to the server and gets the
   new progress back. The HUD, markers and unlocked doors all derive from it.

Phaser never reads game state and React never touches sprites.

## Adding things

**A location.** Add `game/world/layouts/L007.js` and register it in
`layouts/index.js`. Coordinates are tiles; props are names from `tiles.js`.
The location itself (name, description) comes from the database.

**A prop.** Find the frame numbers on the sheet (row × columns + column) and
add a named entry to `PROPS` in `tiles.js`.

**An NPC.** Their name and lines come from the database. Pick a look in
`characters.js` (`NPC_LOOKS`) and a standing spot in the layout's `npcSpots`.

**A case.** Write `prisma/data/<case>.js` shaped like `caseC001.js`, add it to
`CASES` in `prisma/seed.js`, and make sure every location it uses has a layout.

## Scripts

```bash
npm run dev       # dev server on :5173
npm run build     # production build in dist/
npm run lint
```

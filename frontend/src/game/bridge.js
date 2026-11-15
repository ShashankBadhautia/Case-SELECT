import Phaser from "phaser";

/**
 * The only channel between React and Phaser.
 *
 * Phaser draws the world and reports what the player touches (EVENTS from the
 * scene). React owns the game state and the menus, and tells the scene what
 * to show (EVENTS to the scene). Neither side imports the other.
 */

export const bridge = new Phaser.Events.EventEmitter();

export const EVENTS = Object.freeze({
  // React -> Phaser
  SHOW_WORLD: "world:show", // { locationId, npcs, markers, fromLocationId }
  SET_MARKERS: "world:markers", // { npcIds: string[], terminal: boolean }
  LOCK_INPUT: "input:lock", // boolean: true while a menu or dialogue is open

  // Phaser -> React
  READY: "scene:ready",
  FOCUS: "player:focus", // { kind: "npc"|"terminal"|"inspect"|"door", id, to, label } or null
  TALK: "player:talk", // { npcId }
  USE_TERMINAL: "player:terminal", // { locationId }
  INSPECT: "player:inspect", // { title, text }
  WALK_TO: "player:walk-to", // { locationId }
});

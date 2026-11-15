import Phaser from "phaser";

import { EVENTS, bridge } from "../bridge.js";
import { SHEETS, SHEET_FRAME_CONFIG, TILE } from "../world/assets.js";
import { LOOKS, lookTextureKey } from "../world/characters.js";
import { MARKER, bakePixelArt } from "../world/pixelArt.js";

/**
 * Loads every sheet once, then bakes the textures that are assembled at
 * runtime: one per character look, and the objective marker.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  preload() {
    for (const sheet of Object.values(SHEETS)) {
      this.load.spritesheet(sheet.key, sheet.url, SHEET_FRAME_CONFIG);
    }
  }

  create() {
    for (const [look, layers] of Object.entries(LOOKS)) {
      const texture = this.textures.addDynamicTexture(lookTextureKey(look), TILE, TILE);
      layers.forEach((frame) => texture.stamp(SHEETS.people.key, frame, TILE / 2, TILE / 2));
      texture.render();
    }

    bakePixelArt(this, "marker", MARKER);

    this.game.registry.set("booted", true);
    bridge.emit(EVENTS.READY);
  }
}

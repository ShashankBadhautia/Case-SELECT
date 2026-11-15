/**
 * Small sprites drawn as text, one character per pixel. `.` is transparent;
 * every other character is looked up in the palette.
 */

const PALETTE = {
  k: 0x1a1410, // outline
  y: 0xffd23f, // marker yellow
  o: 0xe6a800, // marker shade
  w: 0xfff1d0, // highlight
};

/** Bouncing "!" shown over the NPC or terminal the objective points at. */
export const MARKER = [
  ".kkkk.",
  "kywyyk",
  "kyyyok",
  "kyyyok",
  "kyyyok",
  ".kyok.",
  ".kyok.",
  "..kk..",
  ".kkkk.",
  ".kyok.",
  ".kkkk.",
];

/** Bakes ASCII pixel art into a texture under `key`. */
export function bakePixelArt(scene, key, art, palette = PALETTE) {
  const graphics = scene.make.graphics({ x: 0, y: 0 }, false);

  art.forEach((line, y) => {
    [...line].forEach((char, x) => {
      if (char === ".") return;
      graphics.fillStyle(palette[char], 1);
      graphics.fillRect(x, y, 1, 1);
    });
  });

  graphics.generateTexture(key, art[0].length, art.length);
  graphics.destroy();
}

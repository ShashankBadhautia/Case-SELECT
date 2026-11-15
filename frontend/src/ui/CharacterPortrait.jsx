import { SHEETS, TILE } from "../game/world/assets.js";
import { FALLBACK_LOOK, LOOKS, NPC_LOOKS } from "../game/world/characters.js";

const SPACING = 1;

/**
 * A character drawn with CSS from the same sprite layers the game uses, so
 * dialogue portraits always match the sprite walking around the room.
 */
export function CharacterPortrait({ npcId, look, scale = 5 }) {
  const layers = LOOKS[look ?? NPC_LOOKS[npcId] ?? FALLBACK_LOOK];
  const size = TILE * scale;

  return (
    <div className="portrait" style={{ width: size, height: size }} aria-hidden="true">
      {layers.map((frame, index) => {
        const col = frame % SHEETS.people.columns;
        const row = Math.floor(frame / SHEETS.people.columns);
        return (
          <div
            key={`${frame}-${index}`}
            className="portrait__layer"
            style={{
              backgroundImage: `url(${SHEETS.people.url})`,
              backgroundSize: `${(TILE + SPACING) * SHEETS.people.columns * scale}px auto`,
              backgroundPosition: `${-col * (TILE + SPACING) * scale}px ${-row * (TILE + SPACING) * scale}px`,
            }}
          />
        );
      })}
    </div>
  );
}

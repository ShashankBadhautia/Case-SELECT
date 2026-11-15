import { useKeyDown } from "../hooks/useKeyDown.js";
import { useTypewriter } from "../hooks/useTypewriter.js";
import { CharacterPortrait } from "./CharacterPortrait.jsx";

/**
 * The speech panel at the bottom of the screen. Shows one line at a time;
 * E / Space / Enter (or a click) finishes the line, then advances.
 *
 * `speaker` is { npcId, name, role } for a character, or { name } for a note.
 */
export function DialogueBox({ speaker, text, onAdvance, busy = false, hint }) {
  const [visible, done, skip] = useTypewriter(text);

  const advance = () => {
    if (busy) return;
    if (done) onAdvance();
    else skip();
  };

  useKeyDown(["e", "E", " ", "Enter"], (event) => {
    event.preventDefault();
    advance();
  });

  return (
    <div className="dialogue" role="dialog" aria-label={`${speaker.name} says`} onClick={advance}>
      {speaker.npcId && (
        <div className="dialogue__portrait">
          <CharacterPortrait npcId={speaker.npcId} />
        </div>
      )}
      <div className="dialogue__body">
        <p className="dialogue__name">
          {speaker.name}
          {speaker.role && <span className="dialogue__role">{speaker.role}</span>}
        </p>
        <p className="dialogue__text">{visible}</p>
        {hint && done && <p className="dialogue__hint">{hint}</p>}
      </div>
      <span className={`dialogue__next ${done && !busy ? "is-ready" : ""}`} aria-hidden="true">
        ▼
      </span>
    </div>
  );
}

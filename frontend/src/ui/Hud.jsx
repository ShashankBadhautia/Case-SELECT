/**
 * Always-on overlay: where you are, what to do next, and what the key under
 * your thumb will do. Purely presentational.
 */
export function Hud({ caseName, location, objective, prompt, onOpenCaseFile, onOpenMenu }) {
  return (
    <div className="hud">
      <div className="hud__top">
        <div className="hud__where panel panel--thin">
          <span className="hud__case">{caseName}</span>
          <span className="hud__location">{location}</span>
        </div>
        {/* Keyed on the text so the highlight animation replays for each new lead. */}
        <div key={objective} className="hud__objective panel panel--thin" aria-live="polite">
          <span className="hud__label">Lead</span>
          {objective}
        </div>
        <div className="hud__buttons">
          <button type="button" className="btn btn--small" onClick={onOpenCaseFile}>
            Case file <kbd>C</kbd>
          </button>
          <button type="button" className="btn btn--small" onClick={onOpenMenu}>
            Menu <kbd>Esc</kbd>
          </button>
        </div>
      </div>

      {prompt && (
        <div className={`hud__prompt panel panel--thin ${prompt.locked ? "is-locked" : ""}`}>
          {prompt.key && <kbd>{prompt.key}</kbd>}
          {prompt.text}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";

import { useKeyDown } from "../hooks/useKeyDown.js";

/** Esc menu: resume, restart the case, or go back to the title screen. */
export function PauseMenu({ onResume, onRestart, onQuit }) {
  const [confirming, setConfirming] = useState(false);

  useKeyDown(["Escape"], (event) => {
    event.preventDefault();
    onResume();
  });

  return (
    <div className="overlay" role="dialog" aria-label="Paused">
      <section className="menu panel">
        <h2>Paused</h2>
        {confirming ? (
          <>
            <p>Restart the case? Your evidence and progress will be lost.</p>
            <button type="button" className="btn btn--danger" onClick={onRestart} autoFocus>
              Yes, start over
            </button>
            <button type="button" className="btn" onClick={() => setConfirming(false)}>
              Keep playing
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn btn--primary" onClick={onResume} autoFocus>
              Resume
            </button>
            <button type="button" className="btn" onClick={() => setConfirming(true)}>
              Restart case
            </button>
            <button type="button" className="btn" onClick={onQuit}>
              Title screen
            </button>
          </>
        )}
        <dl className="controls">
          <dt>WASD / Arrows</dt>
          <dd>Walk</dd>
          <dt>E / Space</dt>
          <dd>Talk, inspect, use terminal</dd>
          <dt>C</dt>
          <dd>Case file</dd>
          <dt>Esc</dt>
          <dd>Menu</dd>
        </dl>
      </section>
    </div>
  );
}

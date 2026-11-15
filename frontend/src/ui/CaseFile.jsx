import { useKeyDown } from "../hooks/useKeyDown.js";
import { describeObjective, locationName } from "../game/objective.js";

/** The detective's notebook: the brief, the current lead and the evidence so far. */
export function CaseFile({ session, progress, onClose }) {
  useKeyDown(["Escape", "Tab", "c", "C"], (event) => {
    event.preventDefault();
    onClose();
  });

  const percent = Math.round((progress.completedSteps / progress.totalSteps) * 100);

  return (
    <div className="overlay" role="dialog" aria-label="Case file">
      <section className="casefile panel">
        <header className="casefile__header">
          <div>
            <p className="eyebrow">Case file {session.case.id}</p>
            <h2>{session.case.caseName}</h2>
          </div>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Close <kbd>C</kbd>
          </button>
        </header>

        <p className="casefile__brief">{session.case.description}</p>

        <div className="casefile__progress">
          <div className="meter" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
            <div className="meter__fill" style={{ width: `${percent}%` }} />
          </div>
          <span>
            {progress.completedSteps}/{progress.totalSteps} steps
          </span>
        </div>

        <h3>Current lead</h3>
        <p className="casefile__lead">{describeObjective(session, progress)}</p>

        <h3>Evidence ({progress.evidence.length})</h3>
        {progress.evidence.length === 0 ? (
          <p className="muted">Nothing yet. Answer questions at the records terminals to collect evidence.</p>
        ) : (
          <ol className="evidence-list">
            {progress.evidence.map((item) => (
              <li key={item.id} className="evidence-card">
                <strong>{item.evidenceName}</strong>
                <p>{item.description}</p>
              </li>
            ))}
          </ol>
        )}

        <h3>Places you can go</h3>
        <ul className="chips">
          {progress.unlockedLocationIds.map((id) => (
            <li key={id} className="chip">
              {locationName(session, id)}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

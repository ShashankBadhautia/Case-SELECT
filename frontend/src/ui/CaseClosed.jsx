/** Shown once the last step is done. */
export function CaseClosed({ session, progress, onReplay, onQuit }) {
  const finalEvidence = progress.evidence.at(-1);

  return (
    <div className="overlay overlay--solid" role="dialog" aria-label="Case closed">
      <section className="closed panel">
        <p className="eyebrow">Case {session.case.id}</p>
        <h2 className="closed__stamp">Case closed</h2>
        <h3>{session.case.caseName}</h3>
        {finalEvidence && <p className="closed__verdict">{finalEvidence.description}</p>}

        <ol className="evidence-list evidence-list--compact">
          {progress.evidence.map((item) => (
            <li key={item.id}>
              <strong>{item.evidenceName}</strong>: {item.description}
            </li>
          ))}
        </ol>

        <div className="closed__actions">
          <button type="button" className="btn btn--primary" onClick={onQuit} autoFocus>
            Back to case files
          </button>
          <button type="button" className="btn" onClick={onReplay}>
            Play again
          </button>
        </div>
      </section>
    </div>
  );
}

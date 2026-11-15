import { useState } from "react";

import { useKeyDown } from "../hooks/useKeyDown.js";
import { ResultTable } from "./ResultTable.jsx";

const STARTER_SQL = "-- Write a SELECT query, then press Run (Ctrl/⌘ + Enter)\n";

/**
 * The records terminal. With a `question` it grades the player's query;
 * without one it is a free search over the case's tables.
 *
 * Props:
 *   title     terminal name shown in the header
 *   question  { title, question, difficulty, hint } or null
 *   tables    [{ name, displayName, description, columns }]
 *   onRun     async (sql) => { result, correct?, feedback?, answer?, unlockMessage?, evidence? };
 *             throws an error whose message is safe to show the player
 *   onSolved  called with the success response when the player continues
 *   onClose   leave the terminal
 */
export function SqlTerminal({ title, question, tables, onRun, onSolved, onClose }) {
  const [sql, setSql] = useState(STARTER_SQL);
  const [running, setRunning] = useState(false);
  const [outcome, setOutcome] = useState(null); // { kind: "result"|"error", ... }
  const [showHint, setShowHint] = useState(false);
  const [openTable, setOpenTable] = useState(null);

  const solved = outcome?.response?.correct === true;

  const run = async () => {
    if (running || solved) return;
    setRunning(true);
    try {
      const response = await onRun(sql);
      setOutcome({ kind: "result", response });
    } catch (error) {
      setOutcome({ kind: "error", message: error.message });
    } finally {
      setRunning(false);
    }
  };

  useKeyDown(["Escape"], (event) => {
    event.preventDefault();
    if (!running) onClose();
  });

  const onEditorKeyDown = (event) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      run();
    }
  };

  const response = outcome?.response;
  const result = response?.result;

  return (
    <div className="overlay" role="dialog" aria-label={title}>
      <section className="terminal panel">
        <header className="terminal__header">
          <h2>{title}</h2>
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={running}>
            Close <kbd>Esc</kbd>
          </button>
        </header>

        <div className="terminal__layout">
          <aside className="terminal__tables" aria-label="Case records">
            <h3>Records</h3>
            <ul>
              {tables.map((table) => (
                <li key={table.name}>
                  <button
                    type="button"
                    className="terminal__table"
                    aria-expanded={openTable === table.name}
                    onClick={() => setOpenTable(openTable === table.name ? null : table.name)}
                  >
                    <span>{table.displayName}</span>
                    <code>{table.name}</code>
                  </button>
                  {openTable === table.name && (
                    <div className="terminal__columns">
                      <p>{table.description}</p>
                      <ul>
                        {table.columns.map((column) => (
                          <li key={column.name}>
                            <code>{column.name}</code> <span>{column.type}</span>
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        className="btn btn--small"
                        onClick={() => setSql(`SELECT * FROM ${table.name} LIMIT 10;`)}
                      >
                        Peek at rows
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </aside>

          <div className="terminal__main">
            {question ? (
              <div className="question">
                <p className="question__meta">
                  <span className={`badge badge--${(question.difficulty ?? "").toLowerCase()}`}>
                    {question.difficulty}
                  </span>
                  Open question
                </p>
                <h3 className="question__title">{question.title}</h3>
                <p className="question__text">{question.question}</p>
                {question.hint &&
                  (showHint ? (
                    <p className="question__hint">Hint: {question.hint}</p>
                  ) : (
                    <button type="button" className="btn btn--small btn--ghost" onClick={() => setShowHint(true)}>
                      Show hint
                    </button>
                  ))}
              </div>
            ) : (
              <div className="question question--free">
                <h3 className="question__title">Free search</h3>
                <p className="question__text">
                  No open question at this terminal. Explore the records; nothing you run here is graded.
                </p>
              </div>
            )}

            <label className="editor">
              <span className="sr-only">SQL query</span>
              <textarea
                value={sql}
                onChange={(event) => setSql(event.target.value)}
                onKeyDown={onEditorKeyDown}
                spellCheck={false}
                autoFocus
                rows={6}
                disabled={solved}
              />
            </label>

            <div className="terminal__actions">
              <button type="button" className="btn btn--primary" onClick={run} disabled={running || solved}>
                {running ? "Running…" : question ? "Run as answer" : "Run"}
              </button>
              {response && "correct" in response && !response.correct && (
                <p className="feedback feedback--wrong" role="status">{response.feedback}</p>
              )}
              {outcome?.kind === "error" && (
                <p className="feedback feedback--error" role="alert">{outcome.message}</p>
              )}
            </div>

            {solved && (
              <div className="solved" role="status">
                <p className="solved__answer">
                  Answer: <strong>{response.answer}</strong>
                </p>
                <p className="solved__unlock">{response.unlockMessage}</p>
                {response.evidence.map((item) => (
                  <div className="evidence-card" key={item.id}>
                    <span className="evidence-card__label">Evidence found</span>
                    <strong>{item.evidenceName}</strong>
                    <p>{item.description}</p>
                  </div>
                ))}
                <button type="button" className="btn btn--primary" onClick={() => onSolved(response)} autoFocus>
                  Continue
                </button>
              </div>
            )}

            {result && <ResultTable result={result} />}
          </div>
        </div>
      </section>
    </div>
  );
}

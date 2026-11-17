import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api } from "../api/client.js";
import { useAuth } from "../auth/useAuth.js";
import { useTypewriter } from "../hooks/useTypewriter.js";
import { CharacterPortrait } from "../ui/CharacterPortrait.jsx";

const INTRO = "Every crime leaves a record. Every record can be queried. Pick a case file, detective.";

const STATUS_LABEL = {
  NOT_STARTED: "New",
  IN_PROGRESS: "In progress",
  COMPLETED: "Solved",
};

/**
 * Opening screen: the logo, the detective's introduction and the case files.
 * Signed-out visitors see the intro and a sign-in prompt; a signed-in player
 * sees their case files with per-case progress. A case without steps is shown
 * as "coming soon" and cannot be opened.
 */
export function TitleScreen() {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useAuth();
  const [cases, setCases] = useState(null);
  const [error, setError] = useState(null);
  const [intro, introDone, skipIntro] = useTypewriter(INTRO);

  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;

    Promise.all([api.cases.list(), api.players.progress(user.id)])
      .then(([caseList, progressRows]) => {
        if (cancelled) return;
        const statusByCase = Object.fromEntries(progressRows.map((row) => [row.caseId, row.status]));
        setCases(caseList.map((c) => ({ ...c, status: statusByCase[c.id] ?? "NOT_STARTED" })));
      })
      .catch((err) => !cancelled && setError(err));

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (authLoading) {
    return (
      <main className="screen screen--center">
        <p className="loading">Checking your badge…</p>
      </main>
    );
  }

  return (
    <main className="screen title-screen" onClick={skipIntro}>
      <div className="title-screen__glow" aria-hidden="true" />

      <header className="logo">
        <p className="logo__kicker">A detective game solved in SQL</p>
        <h1 className="logo__title">
          CASE<span className="logo__colon">:</span>SELECT
        </h1>
      </header>

      {user && (
        <div className="title-screen__account">
          <span>
            Signed in as <strong>{user.username}</strong>
          </span>
          <button type="button" className="btn btn--small" onClick={logout}>
            Log out
          </button>
        </div>
      )}

      <section className="intro panel">
        <CharacterPortrait look="detective" scale={6} />
        <p className="intro__text">
          {intro}
          {!introDone && <span className="caret" aria-hidden="true" />}
        </p>
      </section>

      {!user && (
        <section className="panel auth-panel">
          <h2>Your case files are waiting</h2>
          <p className="muted">Sign in to pick up your investigation where you left it.</p>
          <div className="auth-panel__actions">
            <Link className="btn btn--primary" to="/login">
              Log in
            </Link>
            <Link className="btn" to="/register">
              Create account
            </Link>
          </div>
        </section>
      )}

      {user && (
        <section className="casefiles" aria-label="Case files">
          {error && (
            <p className="panel message message--error">
              {error.message}
            </p>
          )}
          {!error && !cases && <p className="loading">Pulling case files…</p>}
          {cases?.map((c) => {
            const playable = c.stepCount > 0;
            return (
              <article key={c.id} className={`casecard panel ${playable ? "" : "is-disabled"}`}>
                <header className="casecard__header">
                  <span className="casecard__id">{c.id}</span>
                  {c.difficulty && (
                    <span className={`badge badge--${c.difficulty.toLowerCase()}`}>{c.difficulty}</span>
                  )}
                  {playable && <span className={`status status--${c.status.toLowerCase()}`}>{STATUS_LABEL[c.status]}</span>}
                </header>
                <h2 className="casecard__title">{c.caseName}</h2>
                <p className="casecard__description">{c.description ?? "Details sealed until the case opens."}</p>
                <button
                  type="button"
                  className="btn btn--primary"
                  disabled={!playable}
                  onClick={() => navigate(`/case/${encodeURIComponent(c.id)}`)}
                >
                  {!playable ? "Coming soon" : c.status === "NOT_STARTED" ? "Take the case" : c.status === "COMPLETED" ? "Review case" : "Continue"}
                </button>
              </article>
            );
          })}
        </section>
      )}

      <footer className="title-screen__footer">
        WASD / Arrows to walk · E to interact · C for the case file · Esc for the menu
      </footer>
    </main>
  );
}

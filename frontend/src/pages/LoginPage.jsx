import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/useAuth.js";

/**
 * Sign-in screen. The identifier field accepts either a username or an email;
 * the server answers failed attempts with one generic message.
 */
export function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (loading) {
    return (
      <main className="screen screen--center">
        <p className="loading">Checking your badge…</p>
      </main>
    );
  }

  if (user) return <Navigate to="/" replace />;

  const onSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(identifier.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="screen screen--center auth-screen">
      <section className="panel auth">
        <p className="eyebrow">Case:SELECT</p>
        <h1>Sign in, detective</h1>

        <form className="auth__form" onSubmit={onSubmit}>
          <label className="auth__field">
            <span>Username or email</span>
            <input
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              autoComplete="username"
              autoFocus
              required
            />
          </label>

          <label className="auth__field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error && (
            <p className="panel message message--error auth__error" role="alert">
              {error}
            </p>
          )}

          <button className="btn btn--primary" type="submit" disabled={busy}>
            {busy ? "Checking…" : "Log in"}
          </button>
        </form>

        <p className="auth__alt">
          New here? <Link to="/register">Create an account</Link>
        </p>

        <Link className="btn btn--ghost btn--small auth__back" to="/">
          Back to main screen
        </Link>
      </section>
    </main>
  );
}

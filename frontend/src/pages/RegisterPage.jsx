import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/useAuth.js";

const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,32}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Client-side checks, mirroring the server's rules. The server is the authority. */
function validate({ username, email, password, confirmPassword }) {
  const fields = {};
  if (!USERNAME_PATTERN.test(username)) {
    fields.username = "Username must be 3-32 letters, numbers or underscores.";
  }
  if (!EMAIL_PATTERN.test(email)) {
    fields.email = "Enter a valid email address.";
  }
  if (password.length < 8) {
    fields.password = "Password must be at least 8 characters.";
  }
  if (confirmPassword !== password) {
    fields.confirmPassword = "Passwords do not match.";
  }
  return fields;
}

/**
 * Registration screen. On success the server starts a session, so there is no
 * separate "log in" step.
 */
export function RegisterPage() {
  const { user, loading, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [fields, setFields] = useState({});
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

  const update = (name) => (event) => {
    setForm((current) => ({ ...current, [name]: event.target.value }));
    setFields((current) => ({ ...current, [name]: undefined }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    const problems = validate(form);
    if (Object.keys(problems).length > 0) {
      setFields(problems);
      return;
    }

    setBusy(true);
    try {
      await register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
      if (err.body?.fields) setFields(err.body.fields);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="screen screen--center auth-screen">
      <section className="panel auth">
        <p className="eyebrow">Case:SELECT</p>
        <h1>Open an account</h1>

        <form className="auth__form" onSubmit={onSubmit}>
          <label className="auth__field">
            <span>Username</span>
            <input
              value={form.username}
              onChange={update("username")}
              autoComplete="username"
              autoFocus
              required
            />
            {fields.username && <span className="auth__hint">{fields.username}</span>}
          </label>

          <label className="auth__field">
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={update("email")}
              autoComplete="email"
              required
            />
            {fields.email && <span className="auth__hint">{fields.email}</span>}
          </label>

          <label className="auth__field">
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={update("password")}
              autoComplete="new-password"
              required
            />
            {fields.password && <span className="auth__hint">{fields.password}</span>}
          </label>

          <label className="auth__field">
            <span>Confirm password</span>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={update("confirmPassword")}
              autoComplete="new-password"
              required
            />
            {fields.confirmPassword && <span className="auth__hint">{fields.confirmPassword}</span>}
          </label>

          {error && (
            <p className="panel message message--error auth__error" role="alert">
              {error}
            </p>
          )}

          <button className="btn btn--primary" type="submit" disabled={busy}>
            {busy ? "Creating…" : "Register"}
          </button>
        </form>

        <p className="auth__alt">
          Already have an account? <Link to="/login">Log in</Link>
        </p>

        <Link className="btn btn--ghost btn--small auth__back" to="/">
          Back to main screen
        </Link>
      </section>
    </main>
  );
}

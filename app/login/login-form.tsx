"use client";

import { FormEvent, useState } from "react";

export function LoginForm({ message }: { message?: string }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(message ?? "");
  const [resetMessage, setResetMessage] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const form = new FormData();
      form.set("email", email);
      form.set("password", password);
      if (mode === "signup") form.set("name", name);

      const response = await fetch(`/api/auth/password/${mode}`, {
        method: "POST",
        body: form
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error ?? "Authentication failed.");
      }

      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  async function onResetSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResetMessage("");
    setResetLoading(true);

    try {
      const form = new FormData();
      form.set("email", resetEmail || email);

      const response = await fetch("/api/auth/password/reset", {
        method: "POST",
        body: form
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error ?? "Password reset failed.");
      }

      setResetMessage(payload.message ?? "Password reset request received.");
    } catch (err) {
      setResetMessage(err instanceof Error ? err.message : "Password reset failed.");
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <>
      <section className="siteLoginPanel">
        <div className="loginModeTabs" aria-label="Login mode">
        <button className={mode === "login" ? "selected" : ""} type="button" onClick={() => setMode("login")}>
          Log in
        </button>
          <button className={mode === "signup" ? "selected" : ""} type="button" onClick={() => setMode("signup")}>
            Sign up
          </button>
        </div>

        <a className="googleLoginButton" href="/api/auth/google/start">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z" />
          </svg>
          <span>Continue with Google</span>
        </a>

        <div className="loginDivider">
          <span>or</span>
        </div>

        <form className="emailLoginForm" onSubmit={onSubmit}>
          {mode === "signup" ? (
            <label htmlFor="signupName">
              Name
              <input
                id="signupName"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.currentTarget.value)}
              />
            </label>
          ) : null}
          <label htmlFor="loginEmail">
            Email
            <input
              id="loginEmail"
              autoComplete="email"
              inputMode="email"
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
            />
          </label>
          <label htmlFor="loginPassword">
            Password
            <input
              id="loginPassword"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.currentTarget.value)}
            />
          </label>
          {error ? <p className="loginError">{error}</p> : null}
          <button disabled={loading} type="submit">
            {loading ? "Working..." : mode === "signup" ? "Create account" : "Log in"}
          </button>
        </form>
      </section>

      <section className="forgotPasswordPanel">
        <button type="button" onClick={() => setResetOpen((current) => !current)}>
          Forgot password?
        </button>
        {resetOpen ? (
          <form onSubmit={onResetSubmit}>
            <label htmlFor="resetEmail">
              Email
              <input
                id="resetEmail"
                autoComplete="email"
                inputMode="email"
                required
                type="email"
                value={resetEmail || email}
                onChange={(event) => setResetEmail(event.currentTarget.value)}
              />
            </label>
            <button disabled={resetLoading} type="submit">
              {resetLoading ? "Sending..." : "Send reset request"}
            </button>
          </form>
        ) : null}
        {resetMessage ? <p>{resetMessage}</p> : null}
      </section>
    </>
  );
}

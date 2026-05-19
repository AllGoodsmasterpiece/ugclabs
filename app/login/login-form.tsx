"use client";

import { FormEvent, useState } from "react";

export function LoginForm({ message }: { message?: string }) {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(message ?? "");
  const [loading, setLoading] = useState(false);

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

  return (
    <section className="siteLoginPanel">
      <div className="loginModeTabs" aria-label="Login mode">
        <button className={mode === "signup" ? "selected" : ""} type="button" onClick={() => setMode("signup")}>
          Sign up
        </button>
        <button className={mode === "login" ? "selected" : ""} type="button" onClick={() => setMode("login")}>
          Log in
        </button>
      </div>

      <a className="googleLoginButton" href="/api/auth/google/start">
        Continue with Google
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
  );
}

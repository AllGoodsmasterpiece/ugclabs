"use client";

import { FormEvent, useState } from "react";
import { MarketingPageShell } from "../site-pages";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const form = new FormData();
      form.set("password", password);
      const response = await fetch("/api/access", { method: "POST", body: form });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error ?? "Access failed.");
      }

      window.location.href = "/";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Access failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <MarketingPageShell
      eyebrow="Login"
      title="Private MVP access."
      description="Use the access password to open the studio. Full user login comes after billing and credit controls."
      selected="login"
    >
      <form className="siteLoginPanel" onSubmit={onSubmit}>
        <label htmlFor="loginPassword">Access password</label>
        <input
          id="loginPassword"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.currentTarget.value)}
        />
        {message ? <p>{message}</p> : null}
        <button disabled={loading || !password} type="submit">
          {loading ? "Checking..." : "Open studio"}
        </button>
      </form>
    </MarketingPageShell>
  );
}

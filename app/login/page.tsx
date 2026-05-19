import { MarketingPageShell } from "../site-pages";

const errorMessages: Record<string, string> = {
  google_not_configured: "Google OAuth is not configured yet.",
  invalid_oauth_state: "Login session expired. Try again.",
  google_email_unverified: "Use a verified Google account.",
  google_token_failed: "Google login failed. Try again."
};

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const message = params?.error ? errorMessages[params.error] ?? "Google login failed. Try again." : "";

  return (
    <MarketingPageShell
      eyebrow="Login"
      title="Sign in to UGCDay."
      description="Use Google login to manage your account, subscription, credits, assets, and generated videos."
      selected="login"
    >
      <section className="siteLoginPanel">
        <div>
          <span>Google account</span>
          <h2>Continue with Google</h2>
          <p>Studio access is available only for accounts with an active subscription. The master account bypasses billing.</p>
        </div>
        {message ? <p className="loginError">{message}</p> : null}
        <a className="googleLoginButton" href="/api/auth/google/start">
          Continue with Google
        </a>
      </section>
    </MarketingPageShell>
  );
}

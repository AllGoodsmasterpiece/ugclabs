import { LoginForm } from "./login-form";
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
      title="Sign in or create an account."
      description="Use Google or email signup. Studio is visible to everyone, but generation requires login and an active subscription."
      selected="login"
    >
      <LoginForm message={message} />
    </MarketingPageShell>
  );
}

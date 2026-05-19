import { cookies } from "next/headers";
import { readSessionFromCookieStore, sessionCookieName } from "@/lib/auth";
import { InfoGrid, MarketingPageShell } from "../site-pages";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await readSessionFromCookieStore(await cookies());
  const planLabel = session?.master ? "Master account" : session?.subscribed ? "Active subscription" : "Subscription required";
  const billingLabel = session?.subscribed ? "Enabled" : "Not active";

  return (
    <MarketingPageShell
      eyebrow="Profile"
      title="Account, credits, assets, and models."
      description="Manage your login, billing state, reusable assets, creator models, and multi-account setup."
      selected="profile"
    >
      <section className="profileSummaryGrid">
        <article>
          <span>Account</span>
          <strong>{session?.name || session?.email || "Google user"}</strong>
          <p>{session?.email ?? "Signed in with Google."}</p>
        </article>
        <article>
          <span>Billing</span>
          <strong>{billingLabel}</strong>
          <p>{session?.subscribed ? "Studio generation is available." : "Choose a plan before using UGC Studio."}</p>
        </article>
        <article>
          <span>Plan</span>
          <strong>{planLabel}</strong>
          <p>{session?.master ? "Master access bypasses billing until Paddle is connected." : "Paddle billing will attach here."}</p>
        </article>
      </section>

      <section className="profileActions">
        {!session?.subscribed ? <a href="/pricing">View pricing</a> : <a href="/">Open UGC Studio</a>}
        <a href="/api/auth/logout">Logout</a>
      </section>

      <InfoGrid
        items={[
          {
            title: "Assets",
            body: "Saved product images, source videos, generated outputs, and reusable source layers.",
            meta: "Library"
          },
          {
            title: "Models",
            body: "Shared creator image, per-account creator images, and auto-generated creator mode.",
            meta: "Creator control"
          },
          {
            title: "Multi-account",
            body: "Future workspace for TikTok, Instagram, shop, and client account routing.",
            meta: "Scale"
          },
          {
            title: "Credits",
            body: "Track generation limits by video length, variant count, retries, and model cost.",
            meta: "Cost guard"
          }
        ]}
      />
    </MarketingPageShell>
  );
}

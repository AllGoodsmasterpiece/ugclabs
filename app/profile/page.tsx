import { InfoGrid, MarketingPageShell } from "../site-pages";

export default function ProfilePage() {
  return (
    <MarketingPageShell
      eyebrow="Profile"
      title="Account, credits, assets, and models."
      description="This page is the operating dashboard for billing, usage, reusable assets, creator models, and multi-account setup."
    >
      <section className="profileSummaryGrid">
        <article>
          <span>Credits</span>
          <strong>Private MVP</strong>
          <p>Manual credit control until billing automation is connected.</p>
        </article>
        <article>
          <span>Billing</span>
          <strong>Not connected</strong>
          <p>Stripe or Lemon Squeezy can be wired after pricing is fixed.</p>
        </article>
        <article>
          <span>Plan</span>
          <strong>Operator</strong>
          <p>Owner-only access remains active for launch preparation.</p>
        </article>
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

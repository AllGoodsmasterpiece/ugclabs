import { InfoGrid, MarketingPageShell } from "../site-pages";

const plans = [
  {
    title: "Starter",
    body: "For validating products, hooks, and UGC angles before scaling ad volume.",
    meta: "$49 / month"
  },
  {
    title: "Growth",
    body: "More monthly credits, saved assets, history reuse, and faster format testing.",
    meta: "$149 / month"
  },
  {
    title: "Studio",
    body: "For teams running multiple products, creators, accounts, and repeat UGC campaigns.",
    meta: "Custom"
  }
];

export default function PricingPage() {
  return (
    <MarketingPageShell
      eyebrow="Pricing"
      title="Credits built for UGC testing."
      description="Keep the public pricing simple now, then connect billing and credit limits when account auth is ready."
      selected="pricing"
    >
      <InfoGrid items={plans} />
      <section className="siteCallout">
        <h2>Current MVP rule</h2>
        <p>The generator stays password locked until usage limits, billing, and account roles are wired.</p>
        <a href="/login">Request access</a>
      </section>
    </MarketingPageShell>
  );
}

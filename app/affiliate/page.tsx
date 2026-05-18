import { InfoGrid, MarketingPageShell } from "../site-pages";

export default function AffiliatePage() {
  return (
    <MarketingPageShell
      eyebrow="Affiliate"
      title="Earn 30% from referred company revenue."
      description="UGCDay can support a simple partner program for creators, agencies, and operators who bring paying customers."
    >
      <InfoGrid
        items={[
          {
            title: "30% revenue share",
            body: "Affiliate partners receive 30% of company revenue from qualified referred customers.",
            meta: "Core offer"
          },
          {
            title: "Best partners",
            body: "UGC creators, performance marketers, ecommerce operators, and agency owners."
          },
          {
            title: "MVP tracking",
            body: "Early referrals can be tracked manually, then moved into a proper affiliate dashboard."
          }
        ]}
      />
      <section className="siteCallout">
        <h2>Partner positioning</h2>
        <p>Bring stores that need ad volume. UGCDay handles fast UGC variation generation.</p>
      </section>
    </MarketingPageShell>
  );
}

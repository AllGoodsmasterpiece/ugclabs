import { MarketingPageShell } from "../site-pages";

const steps = [
  {
    title: "Apply to join",
    body: "Tell us who you create for, where your audience lives, and how you plan to introduce UGCDay."
  },
  {
    title: "Share your link",
    body: "Approved partners get a trackable link for creators, ecommerce operators, agencies, and paid social teams."
  },
  {
    title: "Earn recurring revenue",
    body: "Get paid when referred customers subscribe and keep using UGCDay for UGC ad variation testing."
  }
];

export default function AffiliatePage() {
  return (
    <MarketingPageShell
      eyebrow="Affiliate program"
      title="Earn from every UGC creator you bring in."
      description="Partner with UGCDay and introduce ecommerce teams to faster product video testing without filming, editing, or hiring creators for every variation."
      selected="studio"
    >
      <section className="affiliateHeroPanel">
        <div>
          <span>Partner offer</span>
          <h2>30% revenue share for qualified referrals.</h2>
          <p>
            Built for UGC creators, performance marketers, ecommerce operators, and agencies that already speak to brands hungry for more ad creatives.
          </p>
        </div>
        <a href="mailto:partners@ugcday.com?subject=UGCDay affiliate application">Apply now</a>
      </section>

      <section className="affiliateSteps" aria-label="How the affiliate program works">
        <div className="affiliateSectionHeader">
          <span>How it works</span>
          <h2>Three steps from application to payout.</h2>
        </div>
        <div className="affiliateStepGrid">
          {steps.map((step, index) => (
            <article key={step.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="affiliateFinalCta">
        <span>Ready to partner?</span>
        <h2>Bring stores that need more UGC ad volume.</h2>
        <p>UGCDay handles the product-to-video workflow. You bring the customers who need fresh creative every month.</p>
        <a href="mailto:partners@ugcday.com?subject=UGCDay affiliate application">Apply now</a>
      </section>
    </MarketingPageShell>
  );
}

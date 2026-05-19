import { MarketingPageShell } from "../site-pages";
import { PricingPlans } from "./pricing-plans";

export default function PricingPage() {
  return (
    <MarketingPageShell
      eyebrow="Pricing"
      title="Plans built for high-volume UGC testing."
      description="Choose a monthly credit pack, generate UGC ad variants, and scale the formats that start getting traction."
      selected="pricing"
    >
      <PricingPlans />

      <section className="pricingExplainer" aria-label="Credit rules">
        <div>
          <span>Credit system</span>
          <h2>Simple usage math.</h2>
        </div>
        <dl>
          <div>
            <dt>5-sec video</dt>
            <dd>50 credits</dd>
          </div>
          <div>
            <dt>10-sec video</dt>
            <dd>100 credits</dd>
          </div>
          <div>
            <dt>15-sec video</dt>
            <dd>150 credits</dd>
          </div>
        </dl>
      </section>
    </MarketingPageShell>
  );
}

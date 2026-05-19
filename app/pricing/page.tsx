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
    </MarketingPageShell>
  );
}

import { MarketingPageShell } from "../site-pages";

const pricingPlans = [
  {
    name: "Starter",
    price: "$19",
    credits: "700 credits",
    videos: "Up to 7 x 10-sec videos/month",
    batch: "Generate up to 7 videos at once",
    badge: "Start testing",
    featured: false
  },
  {
    name: "Pro",
    price: "$49",
    credits: "1,800 credits",
    videos: "Up to 18 x 10-sec videos/month",
    batch: "Generate up to 18 videos at once",
    badge: "Best for creators",
    featured: true
  },
  {
    name: "Ultra",
    price: "$99",
    credits: "4,000 credits",
    videos: "Up to 40 x 10-sec videos/month",
    batch: "Generate up to 30 videos at once",
    badge: "Lower credit price",
    featured: false
  },
  {
    name: "Agency",
    price: "$199",
    credits: "9,000 credits",
    videos: "Up to 90 x 10-sec videos/month",
    batch: "Generate up to 30 videos at once",
    badge: "Lowest credit price",
    featured: false
  }
];

const includedFeatures = [
  "All video formats",
  "Product image to UGC video generation",
  "Creator/model modes",
  "Saved generation history",
  "Commercial-ready vertical outputs"
];

export default function PricingPage() {
  return (
    <MarketingPageShell
      eyebrow="Pricing"
      title="Plans built for high-volume UGC testing."
      description="Choose a monthly credit pack, generate UGC ad variants, and scale the formats that start getting traction."
      selected="pricing"
    >
      <section className="pricingGrid" aria-label="UGCDay pricing plans">
        {pricingPlans.map((plan) => (
          <article className={plan.featured ? "pricingCard featured" : "pricingCard"} key={plan.name}>
            <div className="pricingCardTop">
              <span>{plan.badge}</span>
              <h2>{plan.name}</h2>
              <p>
                <strong>{plan.price}</strong>
                <em>/month</em>
              </p>
            </div>
            <div className="pricingCreditBlock">
              <strong>{plan.credits}</strong>
              <span>{plan.videos}</span>
            </div>
            <ul>
              {includedFeatures.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
              <li>{plan.batch}</li>
            </ul>
            <a href="/login">Get started</a>
          </article>
        ))}
      </section>

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

"use client";

import { useState } from "react";

type BillingPeriod = "monthly" | "yearly";

const pricingPlans = [
  {
    name: "Starter",
    monthlyPrice: 19,
    yearlyPrice: 190,
    credits: "700 credits",
    videos: "Up to 7 x 10-sec videos/month",
    batch: "Generate up to 7 videos at once",
    badge: "Start testing",
    featured: false
  },
  {
    name: "Pro",
    monthlyPrice: 49,
    yearlyPrice: 490,
    credits: "1,800 credits",
    videos: "Up to 18 x 10-sec videos/month",
    batch: "Generate up to 18 videos at once",
    badge: "Best for creators",
    featured: true
  },
  {
    name: "Ultra",
    monthlyPrice: 99,
    yearlyPrice: 990,
    credits: "4,000 credits",
    videos: "Up to 40 x 10-sec videos/month",
    batch: "Generate up to 30 videos at once",
    badge: "Lower credit price",
    featured: false
  },
  {
    name: "Agency",
    monthlyPrice: 199,
    yearlyPrice: 1990,
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

export function PricingPlans() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const yearly = billingPeriod === "yearly";

  return (
    <>
      <div className="pricingBillingToggle" aria-label="Billing period">
        <button
          className={!yearly ? "selected" : ""}
          type="button"
          aria-pressed={!yearly}
          onClick={() => setBillingPeriod("monthly")}
        >
          Monthly
        </button>
        <button
          className={yearly ? "selected" : ""}
          type="button"
          aria-pressed={yearly}
          onClick={() => setBillingPeriod("yearly")}
        >
          Yearly
          <span>Save 2 months</span>
        </button>
      </div>

      <section className="pricingGrid" aria-label="UGCDay pricing plans">
        {pricingPlans.map((plan) => {
          const displayPrice = yearly ? plan.yearlyPrice : plan.monthlyPrice;
          const effectiveMonthly = (plan.yearlyPrice / 12).toFixed(2);

          return (
            <article className={plan.featured ? "pricingCard featured" : "pricingCard"} key={plan.name}>
              <div className="pricingCardTop">
                <span>{plan.badge}</span>
                <h2>{plan.name}</h2>
                <p>
                  <strong>${displayPrice}</strong>
                  <em>{yearly ? "/year" : "/month"}</em>
                </p>
                {yearly ? <small>2 months free. ${effectiveMonthly}/month effective.</small> : null}
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
          );
        })}
      </section>
    </>
  );
}

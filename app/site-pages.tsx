import { AppSidebar } from "./app-sidebar";
import type { ReactNode } from "react";

type InfoCard = {
  title: string;
  body: string;
  meta?: string;
};

type SidebarSection = "studio" | "pricing" | "login" | "history" | "profile";

export function MarketingPageShell({
  eyebrow,
  title,
  description,
  children,
  selected = "studio"
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  selected?: SidebarSection;
}) {
  return (
    <main className="studioShell siteWithSidebar">
      <AppSidebar selected={selected} />
      <div className="studioMain siteMainWithSidebar">
        <section className="sitePageHero">
          <span>{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </section>

        {children}
        <SiteFooter />
      </div>
    </main>
  );
}

export function SiteFooter() {
  return (
    <footer className="siteFooter sitePageFooter">
      <div>
        <img alt="UGCDay" src="/ugcday-wordmark.png" />
        <p>More UGC. Faster growth. No editing. Just click</p>
      </div>
      <nav aria-label="Footer">
        <a href="/pricing">Pricing</a>
        <a href="/history">History</a>
        <a href="/profile">Profile</a>
        <a href="/policy">Policy</a>
        <a href="/affiliate">Affiliate</a>
      </nav>
    </footer>
  );
}

export function InfoGrid({ items }: { items: InfoCard[] }) {
  return (
    <section className="siteInfoGrid">
      {items.map((item) => (
        <article className="siteInfoCard" key={item.title}>
          {item.meta ? <span>{item.meta}</span> : null}
          <h2>{item.title}</h2>
          <p>{item.body}</p>
        </article>
      ))}
    </section>
  );
}

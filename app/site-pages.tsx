type InfoCard = {
  title: string;
  body: string;
  meta?: string;
};

export function MarketingPageShell({
  eyebrow,
  title,
  description,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="sitePageShell">
      <header className="sitePageTop">
        <a className="sitePageLogo" href="/">
          <img alt="UGCDay" src="/ugcday-wordmark.png" />
        </a>
        <nav aria-label="Primary">
          <a href="/">Studio</a>
          <a href="/pricing">Pricing</a>
          <a href="/login">Login</a>
        </nav>
      </header>

      <section className="sitePageHero">
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </section>

      {children}
      <SiteFooter />
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
import type { ReactNode } from "react";

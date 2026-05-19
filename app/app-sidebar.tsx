"use client";

import { useEffect, useState, type ReactNode } from "react";

type SidebarSection = "studio" | "pricing" | "login" | "history";
type SidebarSelectedSection = SidebarSection | "profile";

type HistoryItem = {
  jobId: string;
  title: string;
  createdAt: string;
  formatName: string;
  styleName: string;
  videoCount: number;
  thumbnailUrl?: string;
};

function mergeHistoryItems(...groups: HistoryItem[][]) {
  return groups
    .flat()
    .filter((item) => item.jobId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter((item, index, items) => items.findIndex((candidate) => candidate.jobId === item.jobId) === index)
    .slice(0, 24);
}

function formatHistoryDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Saved job";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function historyTitle(item: HistoryItem) {
  return item.title?.trim() || item.formatName || "Untitled generation";
}

function SidebarIcon({ name }: { name: SidebarSection }) {
  const paths: Record<SidebarSection, ReactNode> = {
    studio: (
      <>
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="16" rx="1" />
      </>
    ),
    pricing: (
      <>
        <rect width="20" height="14" x="2" y="5" rx="2" />
        <path d="M2 10h20" />
      </>
    ),
    login: (
      <>
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <path d="m10 17 5-5-5-5" />
        <path d="M15 12H3" />
      </>
    ),
    history: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 3v6h6" />
        <path d="M12 7v5l3 2" />
      </>
    )
  };

  return (
    <svg className="sidebarNavIcon" aria-hidden="true" viewBox="0 0 24 24">
      {paths[name]}
    </svg>
  );
}

export function AppSidebar({
  selected,
  historyItems
}: {
  selected: SidebarSelectedSection;
  historyItems?: HistoryItem[];
}) {
  const [historyOpen, setHistoryOpen] = useState(selected === "history");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const displayHistory = historyItems ? mergeHistoryItems(historyItems, history) : history;

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      let localItems: HistoryItem[] = [];

      try {
        const saved = window.localStorage.getItem("ugclabs.projectHistory");
        if (saved) localItems = JSON.parse(saved) as HistoryItem[];
      } catch {
        localItems = [];
      }

      try {
        const response = await fetch("/api/product-focus/history");
        const payload = await response.json() as { items?: HistoryItem[] };
        const next = mergeHistoryItems(response.ok ? payload.items ?? [] : [], localItems);
        if (!cancelled) setHistory(next);
      } catch {
        if (!cancelled) setHistory(localItems);
      }
    }

    void loadHistory();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <aside className="projectSidebar" aria-label="UGCDay navigation">
      <div className="sidebarBrand">
        <a href="/" aria-label="UGCDay studio">
          <img className="sidebarWordmark" alt="UGCDay" src="/ugcday-wordmark.png" />
        </a>
      </div>
      <nav className="sidebarNav" aria-label="Studio navigation">
        <a className={selected === "studio" ? "sidebarNavItem selected" : "sidebarNavItem"} href="/">
          <SidebarIcon name="studio" />
          <span>Studio</span>
        </a>
        <a className={selected === "pricing" ? "sidebarNavItem selected" : "sidebarNavItem"} href="/pricing">
          <SidebarIcon name="pricing" />
          <span>Pricing</span>
        </a>
        <a className={selected === "login" ? "sidebarNavItem selected" : "sidebarNavItem"} href="/login">
          <SidebarIcon name="login" />
          <span>Login</span>
        </a>
        <div className="sidebarHistoryMenu">
          <button
            className={selected === "history" ? "sidebarNavItem historyToggle selected" : "sidebarNavItem historyToggle"}
            type="button"
            aria-expanded={historyOpen}
            onClick={() => setHistoryOpen((current) => !current)}
          >
            <SidebarIcon name="history" />
            <span>History</span>
            <em>{displayHistory.length}</em>
            <svg className="sidebarChevron" aria-hidden="true" viewBox="0 0 24 24">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          {historyOpen ? (
            <ul className="projectHistoryList" aria-label="Saved generations">
              <li>
                <a className="historyCard allHistoryCard" href="/history">
                  <span className="historyThumb historyAllThumb" aria-hidden="true">
                    <SidebarIcon name="history" />
                  </span>
                  <span className="historyMeta">
                    <strong>All generations</strong>
                    <span>Open full history page</span>
                  </span>
                </a>
              </li>
              {displayHistory.length ? (
                displayHistory.map((item) => (
                  <li key={item.jobId}>
                    <a className="historyCard" href={`/history?jobId=${encodeURIComponent(item.jobId)}`}>
                      <span className="historyThumb">
                        {item.thumbnailUrl ? <video muted playsInline preload="metadata" src={item.thumbnailUrl} /> : null}
                      </span>
                      <span className="historyMeta">
                        <strong>{historyTitle(item)}</strong>
                        <span>{formatHistoryDate(item.createdAt)} / {item.videoCount} videos</span>
                      </span>
                    </a>
                  </li>
                ))
              ) : (
                <li className="sidebarEmpty">No generation history yet.</li>
              )}
            </ul>
          ) : null}
        </div>
      </nav>
    </aside>
  );
}

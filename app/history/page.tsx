"use client";

import { useEffect, useMemo, useState } from "react";

type GeneratedVideo = {
  index: number;
  hook: string;
  script: string;
  generationPrompt: string;
  playbackUrl?: string;
  sourceUrl?: string;
  status: "completed" | "partial" | "failed";
  error?: string;
};

type GenerateResponse = {
  jobId: string;
  analysis?: Record<string, unknown>;
  intent?: Record<string, unknown>;
  assetBinding?: Record<string, unknown>;
  assetProfiles?: Record<string, unknown>;
  videos: GeneratedVideo[];
  warnings?: string[];
};

type HistoryItem = {
  jobId: string;
  title: string;
  createdAt: string;
  formatName: string;
  styleName: string;
  videoCount: number;
  thumbnailUrl?: string;
  result?: GenerateResponse;
};

type ActivePreview = {
  title: string;
  url: string;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function statusOf(item: HistoryItem) {
  const videos = item.result?.videos ?? [];
  if (!videos.length) return "Saved";
  if (videos.every((video) => video.status === "completed")) return "Complete";
  if (videos.some((video) => video.status === "failed")) return "Partial";
  return "Ready";
}

function mergeItems(remote: HistoryItem[], local: HistoryItem[]) {
  return [...remote, ...local]
    .filter((item) => item.jobId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter((item, index, items) => items.findIndex((candidate) => candidate.jobId === item.jobId) === index)
    .slice(0, 100);
}

function compactSource(result: GenerateResponse | undefined) {
  if (!result) return "Source is not loaded yet.";

  return JSON.stringify(
    {
      jobId: result.jobId,
      analysis: result.analysis,
      intent: result.intent,
      assetBinding: result.assetBinding,
      assetProfiles: result.assetProfiles,
      variants: result.videos.map((video) => ({
        index: video.index,
        status: video.status,
        hook: video.hook,
        script: video.script,
        generationPrompt: video.generationPrompt,
        sourceUrl: video.sourceUrl,
        playbackUrl: video.playbackUrl
      })),
      warnings: result.warnings
    },
    null,
    2
  );
}

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [activePreview, setActivePreview] = useState<ActivePreview | null>(null);
  const [sourceItem, setSourceItem] = useState<HistoryItem | null>(null);
  const [error, setError] = useState("");

  const totalVideos = useMemo(
    () => items.reduce((sum, item) => sum + (item.result?.videos.length || item.videoCount || 0), 0),
    [items]
  );

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
        const payload = await response.json() as { items?: HistoryItem[]; error?: string };
        const merged = mergeItems(response.ok ? payload.items ?? [] : [], localItems);
        const hydrated = await hydrateHistory(merged);

        if (!cancelled) setItems(hydrated);
      } catch (err) {
        if (!cancelled) {
          setItems(localItems);
          setError(err instanceof Error ? err.message : "History could not load.");
        }
      }
    }

    void loadHistory();
    return () => {
      cancelled = true;
    };
  }, []);

  async function hydrateHistory(nextItems: HistoryItem[]) {
    const hydrated = await Promise.all(
      nextItems.map(async (item) => {
        if (item.result?.videos?.length) return item;

        try {
          const response = await fetch(`/api/product-focus/generate?jobId=${encodeURIComponent(item.jobId)}`);
          if (!response.ok) return item;
          const result = await response.json() as GenerateResponse;
          return { ...item, result, videoCount: result.videos.length };
        } catch {
          return item;
        }
      })
    );

    return hydrated;
  }

  return (
    <main className="historyVaultPage">
      <aside className="historyVaultSidebar" aria-label="History navigation">
        <a className="historyVaultLogo" href="/">
          <img alt="UGCDay" src="/ugcday-wordmark.png" />
        </a>
        <nav>
          <a href="/">Studio</a>
          <a className="selected" href="/history">History</a>
          <a href="/pricing">Pricing</a>
          <a href="/profile">Profile</a>
        </nav>
      </aside>

      <section className="historyVaultMain">
        <header className="historyVaultHero">
          <div>
            <span>Generation history</span>
            <h1>Saved UGC outputs</h1>
            <p>Preview every generated variant, inspect source layers, and download videos from previous runs.</p>
          </div>
          <div className="historyVaultStats">
            <strong>{items.length}</strong>
            <span>jobs</span>
            <strong>{totalVideos}</strong>
            <span>videos</span>
          </div>
        </header>

        {error ? <p className="historyVaultNotice">{error}</p> : null}

        <div className="historyJobList">
          {items.length ? (
            items.map((item) => {
              const videos = item.result?.videos ?? [];
              const fallbackUrl = item.thumbnailUrl ?? "";

              return (
                <article className="historyJobCard" key={item.jobId}>
                  <div className="historyJobTop">
                    <div>
                      <span>{formatDate(item.createdAt)}</span>
                      <h2>{item.title}</h2>
                      <p>{item.formatName} / {item.styleName}</p>
                    </div>
                    <div className="historyJobBadges">
                      <span>{videos.length || item.videoCount} videos</span>
                      <strong>{statusOf(item)}</strong>
                    </div>
                  </div>

                  <div className="historyVariantGrid">
                    {videos.length ? (
                      videos.map((video) => {
                        const url = video.playbackUrl || video.sourceUrl || "";
                        return (
                          <article className="historyVariantCard" key={`${item.jobId}-${video.index}`}>
                            <button
                              className="historyVariantPreview"
                              disabled={!url}
                              type="button"
                              onClick={() => url && setActivePreview({ title: video.hook || `Variant ${video.index}`, url })}
                            >
                              {url ? <video muted playsInline preload="metadata" src={url} /> : <span>No video</span>}
                              <em>Preview</em>
                            </button>
                            <div className="historyVariantMeta">
                              <span>Variant {video.index}</span>
                              <strong>{video.hook || "Generated video"}</strong>
                              <p>{video.status}</p>
                            </div>
                            <div className="historyVariantActions">
                              <button type="button" onClick={() => setSourceItem(item)}>Source</button>
                              {url ? <a href={url} download>Download</a> : <span>Download</span>}
                            </div>
                          </article>
                        );
                      })
                    ) : (
                      <article className="historyVariantCard placeholder">
                        <button
                          className="historyVariantPreview"
                          disabled={!fallbackUrl}
                          type="button"
                          onClick={() => fallbackUrl && setActivePreview({ title: item.title, url: fallbackUrl })}
                        >
                          {fallbackUrl ? <video muted playsInline preload="metadata" src={fallbackUrl} /> : <span>No preview</span>}
                          <em>Preview</em>
                        </button>
                        <div className="historyVariantMeta">
                          <span>Saved job</span>
                          <strong>Detailed variants are still loading or unavailable.</strong>
                          <p>{statusOf(item)}</p>
                        </div>
                        <div className="historyVariantActions">
                          <button type="button" onClick={() => setSourceItem(item)}>Source</button>
                          {fallbackUrl ? <a href={fallbackUrl} download>Download</a> : <span>Download</span>}
                        </div>
                      </article>
                    )}
                  </div>
                </article>
              );
            })
          ) : (
            <div className="historyVaultEmpty">
              <strong>No generation history yet.</strong>
              <p>Generated videos will appear here after your first run.</p>
              <a href="/">Open studio</a>
            </div>
          )}
        </div>
      </section>

      {activePreview ? (
        <div className="historyPreviewModal" role="dialog" aria-modal="true" onClick={() => setActivePreview(null)}>
          <div className="historyPreviewPanel" onClick={(event) => event.stopPropagation()}>
            <button type="button" aria-label="Close preview" onClick={() => setActivePreview(null)}>x</button>
            <video controls autoPlay playsInline src={activePreview.url} />
            <strong>{activePreview.title}</strong>
          </div>
        </div>
      ) : null}

      {sourceItem ? (
        <div className="historyPreviewModal sourceModal" role="dialog" aria-modal="true" onClick={() => setSourceItem(null)}>
          <div className="historySourcePanel" onClick={(event) => event.stopPropagation()}>
            <div>
              <span>Source</span>
              <h2>{sourceItem.title}</h2>
              <button type="button" aria-label="Close source" onClick={() => setSourceItem(null)}>x</button>
            </div>
            <pre>{compactSource(sourceItem.result)}</pre>
          </div>
        </div>
      ) : null}
    </main>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { AppSidebar } from "../app-sidebar";

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
  inputSnapshot?: Record<string, unknown>;
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
      inputSnapshot: result.inputSnapshot,
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

function snapshotText(snapshot: Record<string, unknown> | undefined, key: string, fallback = "Not provided") {
  const value = snapshot?.[key];
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function sourceSettings(snapshot: Record<string, unknown> | undefined) {
  if (!snapshot) return "No input snapshot stored for this older job.";
  return [
    snapshotText(snapshot, "generationMode"),
    snapshotText(snapshot, "subFormatName"),
    `${snapshotText(snapshot, "durationSeconds")}s`,
    `${snapshotText(snapshot, "variantCount")} variants`
  ].filter(Boolean).join(" / ");
}

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [activePreview, setActivePreview] = useState<ActivePreview | null>(null);
  const [sourceItem, setSourceItem] = useState<HistoryItem | null>(null);
  const [error, setError] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");

  const totalVideos = useMemo(
    () => items.reduce((sum, item) => sum + (item.result?.videos.length || item.videoCount || 0), 0),
    [items]
  );
  const displayItems = useMemo(() => {
    if (!selectedJobId) return items;
    return [...items].sort((a, b) => {
      if (a.jobId === selectedJobId) return -1;
      if (b.jobId === selectedJobId) return 1;
      return 0;
    });
  }, [items, selectedJobId]);

  useEffect(() => {
    setSelectedJobId(new URLSearchParams(window.location.search).get("jobId") ?? "");
  }, []);

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
    <main className="studioShell historyVaultPage">
      <AppSidebar selected="history" />
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
          {displayItems.length ? (
            displayItems.map((item) => {
              const videos = item.result?.videos ?? [];
              const fallbackUrl = item.thumbnailUrl ?? "";

              return (
                <article className={item.jobId === selectedJobId ? "historyJobCard selected" : "historyJobCard"} key={item.jobId}>
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
            <section className="historySourceInputs">
              <span>Actual input</span>
              <dl>
                <div>
                  <dt>Product</dt>
                  <dd>{snapshotText(sourceItem.result?.inputSnapshot, "productName")}</dd>
                </div>
                <div>
                  <dt>User prompt</dt>
                  <dd>{snapshotText(sourceItem.result?.inputSnapshot, "productFeatureNotes")}</dd>
                </div>
                <div>
                  <dt>Settings</dt>
                  <dd>{sourceSettings(sourceItem.result?.inputSnapshot)}</dd>
                </div>
                <div>
                  <dt>Uploaded source</dt>
                  <dd>{snapshotText(sourceItem.result?.inputSnapshot, "referenceVideoFileName", "No reference video")}</dd>
                </div>
              </dl>
            </section>
            <pre>{compactSource(sourceItem.result)}</pre>
          </div>
        </div>
      ) : null}
    </main>
  );
}

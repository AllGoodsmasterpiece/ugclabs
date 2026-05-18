"use client";

import { useEffect, useState } from "react";
import { MarketingPageShell } from "../site-pages";

type HistoryItem = {
  jobId: string;
  title: string;
  createdAt: string;
  formatName: string;
  styleName: string;
  videoCount: number;
  thumbnailUrl?: string;
  result?: {
    videos?: Array<{
      playbackUrl?: string;
      sourceUrl?: string;
      status: "completed" | "partial" | "failed";
    }>;
  };
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

function downloadUrl(item: HistoryItem) {
  return item.result?.videos?.find((video) => video.playbackUrl || video.sourceUrl)?.playbackUrl
    ?? item.result?.videos?.find((video) => video.playbackUrl || video.sourceUrl)?.sourceUrl
    ?? item.thumbnailUrl
    ?? "";
}

function mergeItems(remote: HistoryItem[], local: HistoryItem[]) {
  return [...remote, ...local]
    .filter((item) => item.jobId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter((item, index, items) => items.findIndex((candidate) => candidate.jobId === item.jobId) === index)
    .slice(0, 100);
}

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [error, setError] = useState("");

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
        if (!response.ok) throw new Error(payload.error ?? "History is locked.");
        if (!cancelled) setItems(mergeItems(payload.items ?? [], localItems));
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

  return (
    <MarketingPageShell
      eyebrow="History"
      title="Every generated job in one table."
      description="Review creation date, format, thumbnail, video count, status, source, and download links."
    >
      {error ? <p className="siteInlineNotice">{error}</p> : null}
      <section className="historyPageTable" aria-label="Generation history">
        <div className="historyPageHead">
          <span>Date</span>
          <span>Format</span>
          <span>Thumbnail</span>
          <span>Count</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        {items.length ? (
          items.map((item) => {
            const href = downloadUrl(item);
            return (
              <article className="historyPageRow" key={item.jobId}>
                <div>
                  <strong>{item.title}</strong>
                  <span>{formatDate(item.createdAt)}</span>
                </div>
                <div>
                  <strong>{item.formatName}</strong>
                  <span>{item.styleName}</span>
                </div>
                <div className="historyPageThumb">
                  {item.thumbnailUrl ? <video muted playsInline preload="metadata" src={item.thumbnailUrl} /> : null}
                </div>
                <strong>{item.videoCount}</strong>
                <span className="historyStatus">{statusOf(item)}</span>
                <div className="historyPageActions">
                  <a href={`/?jobId=${encodeURIComponent(item.jobId)}#results`}>Open</a>
                  <a href={`/?jobId=${encodeURIComponent(item.jobId)}#results`}>Source</a>
                  {href ? <a href={href} download>Download</a> : <span>Download</span>}
                </div>
              </article>
            );
          })
        ) : (
          <div className="historyPageEmpty">No generation history yet.</div>
        )}
      </section>
    </MarketingPageShell>
  );
}

"use client";

import { useMemo, useRef, useState } from "react";
import { videoFormats, type VideoFormatId } from "@/lib/video-formats";

type GeneratedVideo = {
  index: number;
  accountName?: string;
  hook: string;
  script: string;
  generationPrompt: string;
  playbackUrl?: string;
  sourceUrl?: string;
  audioMode?: "native_audio";
  status: "completed" | "partial" | "failed";
  error?: string;
};

type GenerateResponse = {
  jobId: string;
  analysis: Record<string, unknown>;
  intent?: Record<string, unknown>;
  assetBinding?: Record<string, unknown>;
  assetProfiles?: Record<string, unknown>;
  videos: GeneratedVideo[];
  warnings: string[];
};

type StarterPreviewResponse = {
  jobId: string;
  starterImageUrl: string;
  referenceFrameUrl?: string;
  warnings: string[];
};

const generationModeOptions = [
  {
    id: "fast_ugc",
    title: "Fast UGC",
    description: "No reference video. Build from product, model, and selected format.",
    badge: "Lowest cost"
  },
  {
    id: "reference_match",
    title: "Reference Match",
    description: "Use a reference clip for scene style, pacing, framing, and motion.",
    badge: "Style match"
  },
  {
    id: "winning_ad_remix",
    title: "Winning Ad Remix",
    description: "Preserve hook, cut order, reveal timing, proof shot, and CTA structure.",
    badge: "Pro"
  }
] as const;

type GenerationMode = (typeof generationModeOptions)[number]["id"];

const modelModeOptions = [
  {
    id: "auto_generated",
    label: "Auto creator",
    description: "No model image. Fastest, but creator may vary."
  },
  {
    id: "shared_model",
    label: "One model for all videos",
    description: "Upload one model image and keep the same creator."
  },
  {
    id: "per_account_models",
    label: "Model per account",
    description: "Upload one model image per account."
  }
] as const;

const referenceProductModeOptions = [
  {
    id: "replace_product",
    title: "Replace product",
    description: "Reference flow, uploaded product.",
    available: true
  },
  {
    id: "same_product",
    title: "Same product",
    description: "Reference product and uploaded product match.",
    available: true
  }
] as const;

export default function Home() {
  const formRef = useRef<HTMLFormElement>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [starterLoading, setStarterLoading] = useState(false);
  const [starterPreview, setStarterPreview] = useState<StarterPreviewResponse | null>(null);
  const [starterApproved, setStarterApproved] = useState(false);
  const [generationMode, setGenerationMode] = useState<GenerationMode>("fast_ugc");
  const [selectedFormatId, setSelectedFormatId] = useState<VideoFormatId>("ugc_beauty_product");
  const [duration, setDuration] = useState(10);
  const [count, setCount] = useState(3);
  const [modelMode, setModelMode] = useState<(typeof modelModeOptions)[number]["id"]>("auto_generated");
  const [referenceProductMode, setReferenceProductMode] =
    useState<(typeof referenceProductModeOptions)[number]["id"]>("replace_product");
  const [modelAccountCount, setModelAccountCount] = useState(2);
  const [referenceFileName, setReferenceFileName] = useState("");
  const [productFileName, setProductFileName] = useState("");
  const [sharedModelFileName, setSharedModelFileName] = useState("");
  const [accountModelFileNames, setAccountModelFileNames] = useState<string[]>(Array(6).fill(""));

  const selectedFormat = useMemo(
    () => videoFormats.find((format) => format.id === selectedFormatId) ?? videoFormats[0],
    [selectedFormatId]
  );
  const requiresStarterApproval = modelMode !== "auto_generated";
  const requiresReferenceVideo = generationMode !== "fast_ugc";
  const estimatedVideoCost = duration * count * 0.168;
  const estimatedStarterCost = requiresStarterApproval ? 0.063 : 0;
  const estimatedApiCost = Math.max(0.1, estimatedVideoCost + estimatedStarterCost);
  const selectedReferenceProductMode = referenceProductModeOptions.find(
    (option) => option.id === referenceProductMode
  ) ?? referenceProductModeOptions[0];

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const clientJobId = createClientJobId();
    form.set("clientJobId", clientJobId);
    form.set("runMode", "video");
    form.set("generationMode", generationMode);

    if (starterPreview && starterApproved) {
      form.set("approvedStarterJobId", starterPreview.jobId);
    }

    try {
      const response = await fetch("/api/product-focus/generate", {
        method: "POST",
        body: form
      });

      const payload = await readJsonResponse(response, "Generation failed");

      if (!response.ok) {
        throw new Error(payload.error ?? "Generation failed");
      }

      setResult(payload);
    } catch (err) {
      const recovered = await recoverGeneratedResult(clientJobId);

      if (recovered) {
        setResult(recovered);
        setError("");
        return;
      }

      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function onStarterPreview() {
    setError("");
    setResult(null);
    setStarterPreview(null);
    setStarterApproved(false);

    if (!formRef.current) {
      setError("Form is not ready.");
      return;
    }

    const form = new FormData(formRef.current);
    form.set("clientJobId", createClientJobId());
    form.set("runMode", "starter");
    form.set("generationMode", generationMode);
    setStarterLoading(true);

    try {
      const response = await fetch("/api/product-focus/generate", {
        method: "POST",
        body: form
      });
      const payload = await readJsonResponse(response, "Starter preview failed");

      if (!response.ok) {
        throw new Error(payload.error ?? "Starter preview failed");
      }

      setStarterPreview(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Starter preview failed");
    } finally {
      setStarterLoading(false);
    }
  }

  async function readJsonResponse(response: Response, fallback: string) {
    const text = await response.text();

    if (!text.trim()) {
      return {
        error: `${fallback} with status ${response.status}. Empty server response.`
      };
    }

    try {
      return JSON.parse(text);
    } catch {
      return {
        error: `${fallback} with status ${response.status}: ${text.slice(0, 300)}`
      };
    }
  }

  function invalidateStarterPreview() {
    setStarterPreview(null);
    setStarterApproved(false);
  }

  return (
    <main className="appShell">
      <header className="topBar">
        <div className="brandMark">
          <span className="brandDot" />
          <span>UGCLabs</span>
        </div>
        <nav className="topNav" aria-label="Product sections">
          <a href="#generate">Generate</a>
          <a href="#formats">Formats</a>
          <a href="#results">Results</a>
        </nav>
        <div className="topStatus">Internal MVP</div>
      </header>

      <section className="strategyPanel" id="generate">
        <div className="panelHeader">
          <div>
            <p className="eyebrow">Generation mode</p>
            <h2>Choose how much structure to copy</h2>
          </div>
          <span className="modeBadge">
            {generationModeOptions.find((option) => option.id === generationMode)?.title}
          </span>
        </div>
        <ModePicker
          items={generationModeOptions}
          selected={generationMode}
          onChange={(id) => {
            setGenerationMode(id);
            invalidateStarterPreview();
          }}
        />
      </section>

      <section className="workspace">
        <form className="generatorPanel" ref={formRef} onSubmit={onSubmit}>
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Generator</p>
              <h2>Create a short-form pack</h2>
            </div>
            <span className="modeBadge">fal Kling</span>
          </div>

          <div className="uploadGrid">
            <label className="uploadCard" htmlFor="referenceVideo">
              <span>Reference video</span>
              <strong>{referenceFileName || (requiresReferenceVideo ? "Upload source video" : "Optional")}</strong>
              <em>{requiresReferenceVideo ? "Camera flow, pacing, product proof" : "Only for match/remix modes"}</em>
              <input
                id="referenceVideo"
                name="referenceVideo"
                type="file"
                accept="video/*"
                required={requiresReferenceVideo}
                onChange={(event) => {
                  setReferenceFileName(event.currentTarget.files?.[0]?.name ?? "");
                  invalidateStarterPreview();
                }}
              />
            </label>

            <label className="uploadCard" htmlFor="productImage">
              <span>Product image</span>
              <strong>{productFileName || "Upload product image"}</strong>
              <em>Shape, color, label, material lock</em>
              <input
                id="productImage"
                name="productImage"
                type="file"
                accept="image/*"
                required
                onChange={(event) => {
                  setProductFileName(event.currentTarget.files?.[0]?.name ?? "");
                  invalidateStarterPreview();
                }}
              />
            </label>

            <label className="uploadCard optional" htmlFor="sharedCreatorImage">
              <span>Shared model</span>
              <strong>{sharedModelFileName || "Optional model image"}</strong>
              <em>Creator reference</em>
              <input
                id="sharedCreatorImage"
                name="sharedCreatorImage"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const fileName = event.currentTarget.files?.[0]?.name ?? "";
                  setSharedModelFileName(fileName);
                  if (fileName) setModelMode("shared_model");
                  invalidateStarterPreview();
                }}
              />
            </label>
          </div>

          <input name="videoFormat" type="hidden" value={selectedFormatId} />
          <input name="generationMode" type="hidden" value={generationMode} />
          <input name="referenceProductMode" type="hidden" value={referenceProductMode} />
          <input name="tone" type="hidden" value="TikTok native" />
          <input name="productUrl" type="hidden" value="" />
          <input
            name="approvedStarterJobId"
            type="hidden"
            value={starterApproved && starterPreview ? starterPreview.jobId : ""}
          />

          <div className="sectionBlock" id="formats">
            <div className="miniHeader">
              <h3>Video format</h3>
              <p>{selectedFormat.name}: {selectedFormat.shortDescription}</p>
            </div>
            <div className="formatGrid">
              {videoFormats.map((format) => (
                <button
                  className={format.id === selectedFormatId ? "formatCard selected" : "formatCard"}
                  key={format.id}
                  title={format.promptIntent}
                  type="button"
                  onClick={() => setSelectedFormatId(format.id)}
                >
                  <span>{format.name}</span>
                </button>
              ))}
            </div>
          </div>

          {requiresReferenceVideo ? (
            <div className="sectionBlock compactBlock">
              <SegmentedOption
                items={referenceProductModeOptions}
                label="Reference product mode"
                selected={referenceProductMode}
                onChange={(id) =>
                  setReferenceProductMode(id as (typeof referenceProductModeOptions)[number]["id"])
                }
              />
            </div>
          ) : null}

          <div className="field">
            <label htmlFor="productName">Product name</label>
            <input id="productName" name="productName" placeholder="e.g. STANLEY tumbler" required />
          </div>

          <div className="field">
            <label htmlFor="modelMode">Model assignment</label>
            <select
              id="modelMode"
              name="modelMode"
              value={modelMode}
              onChange={(event) => {
                setModelMode(event.currentTarget.value as (typeof modelModeOptions)[number]["id"]);
                invalidateStarterPreview();
              }}
            >
              {modelModeOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label} - {option.description}
                </option>
              ))}
            </select>
          </div>

          {modelMode === "per_account_models" ? (
            <div className="accountModels">
              <div className="field compact">
                <label htmlFor="modelAccountCount">Account count</label>
                <select
                  id="modelAccountCount"
                  name="modelAccountCount"
                  value={modelAccountCount}
                  onChange={(event) => setModelAccountCount(Number(event.currentTarget.value))}
                >
                  {[2, 3, 4, 5, 6].map((value) => (
                    <option key={value} value={value}>
                      {value} accounts
                    </option>
                  ))}
                </select>
              </div>
              <div className="accountModelRows">
                {Array.from({ length: modelAccountCount }, (_, index) => (
                  <div className="accountModelRow" key={index}>
                    <input
                      name={`accountName${index}`}
                      placeholder={`Account ${index + 1}`}
                      aria-label={`Account ${index + 1} name`}
                    />
                    <label htmlFor={`accountCreatorImage${index}`}>
                      <span>{accountModelFileNames[index] || "Upload model image"}</span>
                      <input
                        id={`accountCreatorImage${index}`}
                        name={`accountCreatorImage${index}`}
                        type="file"
                        accept="image/*"
                        required
                        onChange={(event) => {
                          const next = [...accountModelFileNames];
                          next[index] = event.currentTarget.files?.[0]?.name ?? "";
                          setAccountModelFileNames(next);
                          invalidateStarterPreview();
                        }}
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="gridThree">
            <div className="field">
              <label htmlFor="duration">Length</label>
              <select
                id="duration"
                name="duration"
                value={duration}
                onChange={(event) => setDuration(Number(event.currentTarget.value))}
              >
                <option value="5">5 seconds</option>
                <option value="10">10 seconds</option>
                <option value="15">15 seconds</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="count">Variants</label>
              <select
                id="count"
                name="count"
                value={count}
                onChange={(event) => setCount(Number(event.currentTarget.value))}
              >
                {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="costPanel">
            <div>
              <span>Run estimate</span>
              <strong>{count} variant{count > 1 ? "s" : ""} x {duration}s</strong>
              <p>
                Rough quality-first spend estimate: about ${estimatedApiCost.toFixed(2)}
                {requiresStarterApproval ? " including one medium starter preview" : ""} before retries.
              </p>
            </div>
            <p className="draftNote">
              {requiresReferenceVideo
                ? "Reference video is analyzed only; generation uses image elements and native audio."
                : "Fast UGC skips video analysis and uses product analysis, format rules, and native audio."}
            </p>
          </div>

          {requiresStarterApproval ? (
            <div className="starterPanel">
              <div className="starterHeader">
                <div>
                  <span>Quality gate</span>
                  <strong>Approve the starter frame before video generation</strong>
                </div>
                <button
                  className="secondaryButton"
                  disabled={starterLoading || loading}
                  type="button"
                  onClick={onStarterPreview}
                >
                  {starterLoading ? "Creating starter..." : "Create starter preview"}
                </button>
              </div>

              {starterPreview ? (
                <div className="starterReview">
                  <img alt="Generated starter frame preview" src={starterPreview.starterImageUrl} />
                  <label className="qualityConfirm">
                    <input
                      checked={starterApproved}
                      type="checkbox"
                      onChange={(event) => setStarterApproved(event.currentTarget.checked)}
                    />
                    <span>Starter frame matches the uploaded model, product, and reference scene.</span>
                  </label>
                </div>
              ) : (
                <p className="mutedText">
                  This creates a lower-cost first-frame preview using the model, product, and reference scene before spending on video.
                </p>
              )}
            </div>
          ) : null}

          <button
            className="primaryButton"
            disabled={loading || starterLoading || (requiresStarterApproval && !starterApproved)}
            type="submit"
          >
            {loading
              ? "Generating..."
              : requiresStarterApproval && !starterApproved
                ? "Approve starter before video"
                : "Generate test videos"}
          </button>
        </form>
      </section>

      {error ? <div className="errorBox">{error}</div> : null}

      <section className="results" id="results">
        <div className="sectionHeader">
          <div>
            <p className="eyebrow">Output review</p>
            <h2>{result ? "Generated outputs" : "Results will appear here"}</h2>
          </div>
          {result ? <span className="jobBadge">Job {result.jobId}</span> : null}
        </div>

        {!result ? (
          <div className="emptyState">
            <strong>No active result yet.</strong>
            <p>Run a test job to review videos, final prompts, analysis, and provider errors.</p>
          </div>
        ) : (
          <>
            {result.warnings.length ? (
              <div className="warningBox">
                {result.warnings.map((warning) => (
                  <p key={warning}>{warning}</p>
                ))}
              </div>
            ) : null}

            {result.intent || result.assetBinding ? (
              <details className="analysisBox">
                <summary>Intent / asset binding</summary>
                <pre>{JSON.stringify({ intent: result.intent, assetBinding: result.assetBinding }, null, 2)}</pre>
              </details>
            ) : null}

            <details className="analysisBox">
              <summary>Reference analysis</summary>
              <pre>{JSON.stringify(result.analysis, null, 2)}</pre>
            </details>

            {result.assetProfiles ? (
              <details className="analysisBox">
                <summary>Asset profiles / product analysis</summary>
                <pre>{JSON.stringify(result.assetProfiles, null, 2)}</pre>
              </details>
            ) : null}

            <div className="videoGrid">
              {result.videos.map((video) => (
                <article className="videoCard" key={video.index}>
                  <div className="cardTop">
                    <span>Variant {video.index}</span>
                    <strong className={video.status}>{video.status}</strong>
                  </div>
                  {(video.accountName || video.audioMode) ? (
                    <p className="metaLine">
                      {[video.accountName, video.audioMode].filter(Boolean).join(" / ")}
                    </p>
                  ) : null}
                  <h3>{video.hook}</h3>
                  <p>{video.script}</p>
                  {video.playbackUrl || video.sourceUrl ? (
                    <video
                      controls
                      playsInline
                      preload="metadata"
                      src={video.playbackUrl ?? video.sourceUrl}
                    />
                  ) : (
                    <div className="missingVideo">No video URL returned for this variant.</div>
                  )}
                  <div className="links">
                    {video.playbackUrl ? <a href={video.playbackUrl}>Preview MP4</a> : null}
                    {video.sourceUrl ? <a href={video.sourceUrl}>Source</a> : null}
                  </div>
                  {video.error ? <p className="inlineError">{video.error}</p> : null}
                  <details className="promptDetails">
                    <summary>Generation prompt</summary>
                    <p>{video.generationPrompt}</p>
                  </details>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function createClientJobId(): string {
  const randomPart = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  return randomPart.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12);
}

async function recoverGeneratedResult(jobId: string): Promise<GenerateResponse | null> {
  for (let attempt = 0; attempt < 24; attempt += 1) {
    if (attempt > 0) {
      await sleep(5000);
    }

    const response = await fetch(`/api/product-focus/generate?jobId=${encodeURIComponent(jobId)}`);

    if (response.ok) {
      return response.json() as Promise<GenerateResponse>;
    }

    if (response.status !== 404) {
      return null;
    }
  }

  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ModePicker({
  items,
  selected,
  onChange
}: {
  items: typeof generationModeOptions;
  selected: GenerationMode;
  onChange: (id: GenerationMode) => void;
}) {
  return (
    <div className="modeGrid">
      {items.map((item) => (
        <button
          className={selected === item.id ? "modeButton selected" : "modeButton"}
          key={item.id}
          title={item.description}
          type="button"
          onClick={() => onChange(item.id)}
        >
          <strong>{item.title}</strong>
          <span>{item.badge}</span>
        </button>
      ))}
    </div>
  );
}

function SegmentedOption({
  items,
  label,
  selected,
  onChange
}: {
  items: ReadonlyArray<{ id: string; title: string; description: string; available: boolean }>;
  label: string;
  selected: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="segmentBlock">
      <span>{label}</span>
      <div className="segmentGrid">
        {items.map((item) => (
          <button
            className={selected === item.id ? "segmentButton selected" : "segmentButton"}
            disabled={!item.available}
            key={item.id}
            type="button"
            onClick={() => item.available && onChange(item.id)}
          >
            <strong>
              {item.title}
              {!item.available ? <small>Next</small> : null}
            </strong>
            <em>{item.description}</em>
          </button>
        ))}
      </div>
    </div>
  );
}

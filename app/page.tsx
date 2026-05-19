"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent,
  type ReactNode
} from "react";
import {
  videoFormatGroups,
  type CreativeTypeId,
  type VideoFormatId
} from "@/lib/video-formats";
import { AppSidebar } from "./app-sidebar";

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
  inputSnapshot?: Record<string, unknown>;
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

type ProjectHistoryItem = {
  jobId: string;
  title: string;
  createdAt: string;
  formatName: string;
  styleName: string;
  videoCount: number;
  thumbnailUrl?: string;
  result?: GenerateResponse;
};

type SavedProductAsset = {
  id: string;
  name: string;
  fileName?: string;
  imageDataUrl?: string;
  featureNotes?: string;
  analysisMode: "auto" | "guided";
  createdAt: string;
};

type ActiveVideoModal = {
  title: string;
  subtitle?: string;
  url: string;
};

type ComposerSelectOption = {
  value: string;
  label: string;
  title?: string;
};

const subFormatTemplateStyleMap: Record<string, string> = {
  beauty_review: "review_demo",
  beauty_before_after: "performance_proof",
  beauty_grwm: "real_use_result",
  beauty_makeup_hacks: "texture_proof",
  beauty_skincare_routine: "texture_proof",
  beauty_half_face: "performance_proof",
  beauty_comparison: "performance_proof",
  electronics_unboxing: "sensory_unboxing",
  accessories_unboxing: "sensory_unboxing",
  kids_unboxing_review: "sensory_unboxing",
  food_asmr_texture: "asmr_detail",
  accessories_detail_breakdown: "detail_discovery",
  electronics_feature_breakdown: "detail_discovery"
};

function templateStyleForSubFormat(subFormatId: string): string {
  return subFormatTemplateStyleMap[subFormatId] ?? "auto";
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function valueText(value: unknown, fallback = "Not available yet."): string {
  if (typeof value === "string" && value.trim()) return value;
  if (Array.isArray(value) && value.length) return value.map((item) => valueText(item, "")).filter(Boolean).join(" / ");
  return fallback;
}

function pathValue(source: unknown, path: string[]) {
  return path.reduce<unknown>((current, key) => asRecord(current)?.[key], source);
}

function snapshotText(snapshot: Record<string, unknown> | undefined, key: string, fallback = "Not provided") {
  const value = snapshot?.[key];
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function mergeHistoryItems(...groups: ProjectHistoryItem[][]) {
  return groups
    .flat()
    .filter((item) => item.jobId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter((item, index, items) => items.findIndex((candidate) => candidate.jobId === item.jobId) === index)
    .slice(0, 100);
}

function stripHistoryResults(items: ProjectHistoryItem[]) {
  return items.map(({ result: _result, ...item }) => item);
}

function ComposerSelect({
  id,
  value,
  options,
  onChange
}: {
  id: string;
  value: string;
  options: ComposerSelectOption[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function onButtonKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }

    if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
      event.preventDefault();
      setOpen((current) => !current);
    }
  }

  return (
    <div className={open ? "composerSelect open" : "composerSelect"} ref={rootRef}>
      <button
        aria-controls={`${id}Menu`}
        aria-expanded={open}
        className="composerSelectButton"
        id={id}
        title={selectedOption?.title}
        type="button"
        onClick={() => setOpen((current) => !current)}
        onKeyDown={onButtonKeyDown}
      >
        <span>{selectedOption?.label ?? "Select"}</span>
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <path d="m5 7 5 5 5-5" />
        </svg>
      </button>
      {open ? (
        <div className="composerSelectMenu" id={`${id}Menu`} role="listbox">
          {options.map((option) => (
            <button
              aria-selected={option.value === value}
              className={option.value === value ? "composerSelectOption selected" : "composerSelectOption"}
              key={option.value}
              role="option"
              title={option.title}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function englishOnlyText(value: string) {
  return value.replace(/[^\x20-\x7E]/g, "").replace(/\s{2,}/g, " ");
}

function playCardVideo(event: MouseEvent<HTMLElement>) {
  const video = event.currentTarget.querySelector("video");
  if (!video) return;
  video.muted = true;
  void video.play().catch(() => {
    // Browsers can still reject hover playback while media metadata is loading.
  });
}

function pauseCardVideo(event: MouseEvent<HTMLElement>, reset = false) {
  const video = event.currentTarget.querySelector("video");
  if (!video) return;
  video.pause();
  if (reset) video.currentTime = 0;
}

type SidebarIconName = "studio" | "history" | "pricing" | "login";

function SidebarIcon({ name }: { name: SidebarIconName }) {
  const paths: Record<SidebarIconName, ReactNode> = {
    studio: (
      <>
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="16" rx="1" />
      </>
    ),
    history: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 3v6h6" />
        <path d="M12 7v5l3 2" />
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
    )
  };

  return (
    <svg className="sidebarNavIcon" aria-hidden="true" viewBox="0 0 24 24">
      {paths[name]}
    </svg>
  );
}

type GalleryVideoCard = {
  title: string;
  subtitle: string;
  videoUrl: string;
  previewVideoUrl: string;
  posterUrl?: string;
};

function showcaseUrl(filename: string) {
  return `/showcase/${filename}`;
}

function showcasePreviewUrl(filename: string) {
  return `/showcase/preview/${filename}`;
}

const formatReferenceCards: GalleryVideoCard[] = [
  { title: "UGC", subtitle: "Review", videoUrl: showcasePreviewUrl("8c088aec-fal-kling-1.mp4"), previewVideoUrl: showcasePreviewUrl("8c088aec-fal-kling-1.mp4"), posterUrl: showcaseUrl("8c088aec-fal-kling-1.jpg") },
  { title: "Unboxing", subtitle: "Reveal", videoUrl: showcasePreviewUrl("0bd56b9be1b9-fal-kling-1.mp4"), previewVideoUrl: showcasePreviewUrl("0bd56b9be1b9-fal-kling-1.mp4"), posterUrl: showcaseUrl("0bd56b9be1b9-fal-kling-1.jpg") },
  { title: "Tutorial", subtitle: "Step demo", videoUrl: showcasePreviewUrl("b74228c4be2c-fal-kling-1.mp4"), previewVideoUrl: showcasePreviewUrl("b74228c4be2c-fal-kling-1.mp4"), posterUrl: showcaseUrl("b74228c4be2c-fal-kling-1.jpg") },
  { title: "Product Only", subtitle: "B-roll", videoUrl: showcasePreviewUrl("b9a121525ce0-fal-kling-1.mp4"), previewVideoUrl: showcasePreviewUrl("b9a121525ce0-fal-kling-1.mp4"), posterUrl: showcaseUrl("b9a121525ce0-fal-kling-1.jpg") },
  { title: "Before & After", subtitle: "Comparison", videoUrl: showcasePreviewUrl("b69c58dba608-fal-kling-1.mp4"), previewVideoUrl: showcasePreviewUrl("b69c58dba608-fal-kling-1.mp4"), posterUrl: showcaseUrl("b69c58dba608-fal-kling-1.jpg") },
  { title: "UGC Virtual Try On", subtitle: "Fit", videoUrl: showcasePreviewUrl("bf27b4235a30-fal-kling-1.mp4"), previewVideoUrl: showcasePreviewUrl("bf27b4235a30-fal-kling-1.mp4"), posterUrl: showcaseUrl("bf27b4235a30-fal-kling-1.jpg") },
  { title: "App UGC", subtitle: "Creator + screen", videoUrl: showcasePreviewUrl("d23297e7-fal-kling-1.mp4"), previewVideoUrl: showcasePreviewUrl("d23297e7-fal-kling-1.mp4"), posterUrl: showcaseUrl("d23297e7-fal-kling-1.jpg") },
  { title: "Reference Match", subtitle: "Motion match", videoUrl: showcasePreviewUrl("145c567c-fal-kling-1.mp4"), previewVideoUrl: showcasePreviewUrl("145c567c-fal-kling-1.mp4"), posterUrl: showcaseUrl("145c567c-fal-kling-1.jpg") },
  { title: "Winning Ad Remix", subtitle: "Ad structure", videoUrl: showcasePreviewUrl("379975b5-fal-kling-1.mp4"), previewVideoUrl: showcasePreviewUrl("379975b5-fal-kling-1.mp4"), posterUrl: showcaseUrl("379975b5-fal-kling-1.jpg") },
  { title: "ASMR Detail", subtitle: "Close detail", videoUrl: showcasePreviewUrl("ee663ca62084-fal-kling-1.mp4"), previewVideoUrl: showcasePreviewUrl("ee663ca62084-fal-kling-1.mp4"), posterUrl: showcaseUrl("ee663ca62084-fal-kling-1.jpg") },
  { title: "Performance Proof", subtitle: "Use proof", videoUrl: showcasePreviewUrl("4e7353eb85f4-fal-kling-1.mp4"), previewVideoUrl: showcasePreviewUrl("4e7353eb85f4-fal-kling-1.mp4"), posterUrl: showcaseUrl("4e7353eb85f4-fal-kling-1.jpg") },
  { title: "Lifestyle UGC", subtitle: "Daily use", videoUrl: showcasePreviewUrl("0f003c3c6a91-fal-kling-1.mp4"), previewVideoUrl: showcasePreviewUrl("0f003c3c6a91-fal-kling-1.mp4"), posterUrl: showcaseUrl("0f003c3c6a91-fal-kling-1.jpg") }
];

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

export default function Home() {
  const formRef = useRef<HTMLFormElement>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [starterLoading, setStarterLoading] = useState(false);
  const [starterPreview, setStarterPreview] = useState<StarterPreviewResponse | null>(null);
  const [starterApproved, setStarterApproved] = useState(false);
  const [activeVideoModal, setActiveVideoModal] = useState<ActiveVideoModal | null>(null);
  const [layerPreviewOpen, setLayerPreviewOpen] = useState(false);
  const [generationMode, setGenerationMode] = useState<GenerationMode>("fast_ugc");
  const [selectedCreativeType, setSelectedCreativeType] = useState<CreativeTypeId>("model_product");
  const [selectedSubFormatId, setSelectedSubFormatId] = useState("beauty_personal_care");
  const [selectedTemplateId, setSelectedTemplateId] = useState("beauty_review");
  const [duration, setDuration] = useState(10);
  const [count, setCount] = useState(3);
  const [modelMode, setModelMode] = useState<(typeof modelModeOptions)[number]["id"]>("auto_generated");
  const [modelAccountCount, setModelAccountCount] = useState(2);
  const [referenceFileName, setReferenceFileName] = useState("");
  const [productName, setProductName] = useState("");
  const [productFeatureNotes, setProductFeatureNotes] = useState("");
  const [productFeatureItems, setProductFeatureItems] = useState<string[]>([]);
  const [productFeatureDraft, setProductFeatureDraft] = useState("");
  const [productAnalysisMode, setProductAnalysisMode] = useState<"auto" | "guided">("auto");
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [creatorModalOpen, setCreatorModalOpen] = useState(false);
  const [productFileName, setProductFileName] = useState("");
  const [sharedModelFileName, setSharedModelFileName] = useState("");
  const [referencePreviewUrl, setReferencePreviewUrl] = useState("");
  const [productPreviewUrl, setProductPreviewUrl] = useState("");
  const [productImageDataUrl, setProductImageDataUrl] = useState("");
  const [sharedModelPreviewUrl, setSharedModelPreviewUrl] = useState("");
  const [accountModelFileNames, setAccountModelFileNames] = useState<string[]>(Array(6).fill(""));
  const [projectHistory, setProjectHistory] = useState<ProjectHistoryItem[]>([]);
  const [savedProducts, setSavedProducts] = useState<SavedProductAsset[]>([]);
  const [resultsOpen, setResultsOpen] = useState(false);

  const selectedFormatGroup = useMemo(
    () => videoFormatGroups.find((group) => group.id === selectedCreativeType) ?? videoFormatGroups[0],
    [selectedCreativeType]
  );
  const selectedSubFormat = useMemo(
    () =>
      selectedFormatGroup.subFormats.find((format) => format.id === selectedSubFormatId)
      ?? selectedFormatGroup.subFormats[0],
    [selectedFormatGroup, selectedSubFormatId]
  );
  const selectedTemplate = useMemo(
    () =>
      selectedSubFormat.templates.find((template) => template.id === selectedTemplateId)
      ?? selectedSubFormat.templates[0],
    [selectedSubFormat, selectedTemplateId]
  );
  const selectedFormatId: VideoFormatId = selectedTemplate.videoFormat;
  const selectedUgcTemplateStyle = templateStyleForSubFormat(selectedTemplate.id);
  const requiresStarterApproval = modelMode !== "auto_generated";
  const requiresReferenceVideo = generationMode !== "fast_ugc";
  const estimatedVideoCost = duration * count * 0.168;
  const estimatedStarterCost = requiresStarterApproval ? 0.063 : 0;
  const estimatedApiCost = Math.max(0.1, estimatedVideoCost + estimatedStarterCost);
  const selectedGenerationModeOption = generationModeOptions.find((option) => option.id === generationMode)
    ?? generationModeOptions[0];
  const creatorSummary = modelMode === "auto_generated"
    ? "Auto creator"
    : modelMode === "shared_model"
      ? sharedModelFileName || "One creator"
      : `${modelAccountCount} account creators`;
  const guidedProductNotes = productFeatureItems.map((item) => item.trim()).filter(Boolean).join("\n");
  const activeProductFeatureNotes = productAnalysisMode === "guided" ? guidedProductNotes : "";
  const outputVideos = result?.videos.slice(0, 30) ?? [];
  const generationComplete = outputVideos.length > 0 && outputVideos.every((video) => video.status === "completed");

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      let localItems: ProjectHistoryItem[] = [];

      try {
        const saved = window.localStorage.getItem("ugclabs.projectHistory");
        if (saved) localItems = JSON.parse(saved) as ProjectHistoryItem[];
      } catch {
        localItems = [];
      }

      try {
        const response = await fetch("/api/product-focus/history");
        const payload = await response.json() as { items?: ProjectHistoryItem[] };
        const next = mergeHistoryItems(payload.items ?? [], localItems);

        if (!cancelled) {
          setProjectHistory(next);
          window.localStorage.setItem("ugclabs.projectHistory", JSON.stringify(stripHistoryResults(next)));
        }
      } catch {
        if (!cancelled) setProjectHistory(localItems);
      }
    }

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("ugclabs.projectHistory", JSON.stringify(stripHistoryResults(projectHistory)));
    } catch {
      // History persistence is best-effort; server history still keeps completed jobs.
    }
  }, [projectHistory]);

  useEffect(() => {
    if (!activeVideoModal) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setActiveVideoModal(null);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeVideoModal]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("ugclabs.savedProducts");
      if (saved) {
        setSavedProducts(JSON.parse(saved) as SavedProductAsset[]);
      }
    } catch {
      setSavedProducts([]);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const jobId = params.get("jobId");

    if (!jobId) return;

    void loadResultByJobId(jobId, "Recovered job");
  }, []);

  useEffect(() => {
    return () => {
      if (referencePreviewUrl) URL.revokeObjectURL(referencePreviewUrl);
    };
  }, [referencePreviewUrl]);

  useEffect(() => {
    return () => {
      if (productPreviewUrl.startsWith("blob:")) URL.revokeObjectURL(productPreviewUrl);
    };
  }, [productPreviewUrl]);

  useEffect(() => {
    return () => {
      if (sharedModelPreviewUrl) URL.revokeObjectURL(sharedModelPreviewUrl);
    };
  }, [sharedModelPreviewUrl]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const allowed = await ensureGenerationAccess();
    if (!allowed) return;

    setError("");
    setResult(null);
    setResultsOpen(false);
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const clientJobId = createClientJobId();
    ensureProductName(form);
    const productLabel = String(form.get("productName") || productFileName || "Untitled product").trim();
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

      if (response.status === 401) {
        window.location.href = "/login?next=%2F";
        return;
      }

      if (response.status === 402) {
        window.location.href = "/pricing?subscription=required";
        return;
      }

      if (!response.ok) {
        throw new Error(payload.error ?? "Generation failed");
      }

      rememberResult(payload, productLabel);
    } catch (err) {
      const recovered = await recoverGeneratedResult(clientJobId);

      if (recovered) {
        rememberResult(recovered, productLabel);
        setError("");
        return;
      }

      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function onStarterPreview() {
    const allowed = await ensureGenerationAccess();
    if (!allowed) return;

    setError("");
    setResult(null);
    setResultsOpen(false);
    setStarterPreview(null);
    setStarterApproved(false);

    if (!formRef.current) {
      setError("Form is not ready.");
      return;
    }

    const form = new FormData(formRef.current);
    ensureProductName(form);
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

      if (response.status === 401) {
        window.location.href = "/login?next=%2F";
        return;
      }

      if (response.status === 402) {
        window.location.href = "/pricing?subscription=required";
        return;
      }

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

  async function ensureGenerationAccess() {
    try {
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      const payload = await response.json() as { authenticated?: boolean; subscribed?: boolean };

      if (!payload.authenticated) {
        window.location.href = "/login?next=%2F";
        return false;
      }

      if (!payload.subscribed) {
        window.location.href = "/pricing?subscription=required";
        return false;
      }

      return true;
    } catch {
      window.location.href = "/login?next=%2F";
      return false;
    }
  }

  function invalidateStarterPreview() {
    setStarterPreview(null);
    setStarterApproved(false);
  }

  function updatePreviewUrl(
    file: File | undefined,
    setPreviewUrl: React.Dispatch<React.SetStateAction<string>>
  ) {
    const nextUrl = file ? URL.createObjectURL(file) : "";
    setPreviewUrl((previousUrl) => {
      if (previousUrl) URL.revokeObjectURL(previousUrl);
      return nextUrl;
    });
  }

  function readProductImage(file: File | undefined) {
    setProductImageDataUrl("");

    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setProductImageDataUrl(typeof reader.result === "string" ? reader.result : "");
    };
    reader.readAsDataURL(file);
  }

  function ensureProductName(form: FormData) {
    const currentName = String(form.get("productName") || "").trim();

    if (currentName) return;

    const fallbackName = productFileName
      ? productFileName.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").trim()
      : "uploaded product";

    form.set("productName", fallbackName || "uploaded product");
  }

  function addProductFeature() {
    const nextFeature = englishOnlyText(productFeatureDraft).trim();

    if (!nextFeature) return;

    setProductFeatureItems((previous) => [...previous, nextFeature]);
    setProductFeatureDraft("");
    setProductAnalysisMode("guided");
    invalidateStarterPreview();
  }

  function updateProductFeature(index: number, value: string) {
    setProductFeatureItems((previous) =>
      previous.map((item, itemIndex) => (itemIndex === index ? englishOnlyText(value) : item))
    );
    setProductAnalysisMode("guided");
    invalidateStarterPreview();
  }

  function removeProductFeature(index: number) {
    setProductFeatureItems((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
    invalidateStarterPreview();
  }

  function saveProductAsset() {
    const savedName = (productName || productFileName.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ")).trim();
    const item: SavedProductAsset = {
      id: `product-${Date.now()}`,
      name: savedName || "Untitled product",
      fileName: productFileName,
      imageDataUrl: productImageDataUrl,
      featureNotes: activeProductFeatureNotes,
      analysisMode: productAnalysisMode,
      createdAt: new Date().toISOString()
    };

    setProductName(item.name);
    setProductFeatureNotes(item.featureNotes ?? "");
    setSavedProducts((previous) => {
      const next = [item, ...previous.filter((product) => product.name !== item.name)].slice(0, 18);

      try {
        window.localStorage.setItem("ugclabs.savedProducts", JSON.stringify(next));
      } catch {
        // Product asset persistence is best-effort; the active product remains usable.
      }

      return next;
    });
    setProductModalOpen(false);
  }

  function selectSavedProduct(product: SavedProductAsset) {
    setProductName(product.name);
    setProductFileName(product.fileName ?? "");
    setProductImageDataUrl(product.imageDataUrl ?? "");
    setProductPreviewUrl((previousUrl) => {
      if (previousUrl.startsWith("blob:")) URL.revokeObjectURL(previousUrl);
      return product.imageDataUrl ?? "";
    });
    setProductAnalysisMode(product.analysisMode);
    const englishNotes = englishOnlyText(product.featureNotes ?? "");
    setProductFeatureNotes(englishNotes);
    setProductFeatureItems(englishNotes.split(/\r?\n/).map((item) => item.trim()).filter(Boolean));
    invalidateStarterPreview();
  }

  function rememberResult(payload: GenerateResponse, productLabel: string) {
    setResult(payload);
    setResultsOpen(true);

    const item: ProjectHistoryItem = {
      jobId: payload.jobId,
      title: productLabel || "Untitled product",
      createdAt: new Date().toISOString(),
      formatName: selectedTemplate.name,
      styleName: selectedGenerationModeOption.title,
      videoCount: payload.videos.length,
      thumbnailUrl: payload.videos.find((video) => video.playbackUrl || video.sourceUrl)?.playbackUrl
        ?? payload.videos.find((video) => video.playbackUrl || video.sourceUrl)?.sourceUrl,
      result: payload
    };

    setProjectHistory((previous) => {
      const next = [item, ...previous.filter((entry) => entry.jobId !== payload.jobId)].slice(0, 24);

      try {
        window.localStorage.setItem(
          "ugclabs.projectHistory",
          JSON.stringify(stripHistoryResults(next))
        );
      } catch {
        // History persistence is best-effort; generation results should not fail because of storage.
      }

      return next;
    });
  }

  async function loadResultByJobId(jobId: string, errorLabel: string): Promise<GenerateResponse | null> {
    setError("");

    try {
      const response = await fetch(`/api/product-focus/generate?jobId=${encodeURIComponent(jobId)}`);
      const payload = await readJsonResponse(response, errorLabel);

      if (!response.ok) {
        throw new Error(payload.error ?? errorLabel);
      }

      setResult(payload);
      setResultsOpen(true);
      return payload;
    } catch (err) {
      setError(err instanceof Error ? err.message : errorLabel);
      return null;
    }
  }

  return (
    <main className="studioShell">
      <AppSidebar selected="studio" historyItems={projectHistory} />

      <div className="studioMain">
      <div className="floatingTopActions" aria-label="Account shortcuts">
        <a className="floatingAssetButton" href="/profile#assets">
          <span aria-hidden="true">Assets</span>
        </a>
        <a className="floatingProfileButton" href="/profile" aria-label="Profile">
          <img alt="" src="/ugc-logo-icon.png" />
        </a>
      </div>

      <section className="studioHero" id="generate">
        <div>
          <h1 className="heroTitle">
            <span>Drop in a video. Generate</span>
            <img className="heroUgcWordmark" alt="UGC" src="/ugc-wordmark.png" />
            <span>ads.</span>
          </h1>
          <p className="studioHeroSubcopy">Turn one reference video into endless UGC variations.</p>
          <p className="studioHeroTagline">
            <span>More UGC. Faster growth. No editing. Just click</span>
            <img className="taglineClickIcon" alt="" src="/just-click-icon.png" />
          </p>
        </div>
      </section>

      <section className="workspace">
        <form className="generatorPanel composerDeck" ref={formRef} onSubmit={onSubmit}>
          <div className="composerTypeRail" aria-label="Generation mode">
            {generationModeOptions.map((option) => (
              <button
                className={option.id === generationMode ? "typeRailButton selected" : "typeRailButton"}
                key={option.id}
                title={option.description}
                type="button"
                onClick={() => {
                  setGenerationMode(option.id);
                  invalidateStarterPreview();
                }}
              >
                <span>{option.title}</span>
              </button>
            ))}
          </div>
          <div className="panelHeader">
            <div className="panelActions" />
          </div>

          <input name="videoFormat" type="hidden" value={selectedFormatId} />
          <input name="subFormatId" type="hidden" value={selectedTemplate.id} />
          <input name="subFormatName" type="hidden" value={selectedTemplate.name} />
          <input name="ugcTemplateStyle" type="hidden" value={selectedUgcTemplateStyle} />
          <input name="generationMode" type="hidden" value={generationMode} />
          <input name="duration" type="hidden" value={duration} />
          <input name="count" type="hidden" value={count} />
          <input name="referenceProductMode" type="hidden" value="replace_product" />
          <input name="tone" type="hidden" value="TikTok native" />
          <input name="productImageDataUrl" type="hidden" value={productImageDataUrl} />
          <input name="productFeatureNotes" type="hidden" value={activeProductFeatureNotes} />
          <input
            name="approvedStarterJobId"
            type="hidden"
            value={starterApproved && starterPreview ? starterPreview.jobId : ""}
          />

          <div className="sectionBlock" id="formats">
            <div className="formatActionRow">
              <div className="composerControlGrid">
                <div className="field compactControl">
                  <span className="controlLabel">
                    <span>Creative format</span>
                    <span className="infoTooltip" tabIndex={0} aria-label={selectedFormatGroup.explanation}>
                      i
                      <span role="tooltip">{selectedFormatGroup.explanation}</span>
                    </span>
                  </span>
                  <ComposerSelect
                    id="creativeTypeSelect"
                    value={selectedCreativeType}
                    options={videoFormatGroups.map((group) => ({
                      value: group.id,
                      label: group.name,
                      title: group.explanation
                    }))}
                    onChange={(value) => {
                      const nextType = value as CreativeTypeId;
                      const nextGroup = videoFormatGroups.find((group) => group.id === nextType) ?? videoFormatGroups[0];
                      const nextSubFormat = nextGroup.subFormats[0];
                      setSelectedCreativeType(nextType);
                      setSelectedSubFormatId(nextSubFormat?.id ?? "beauty_personal_care");
                      setSelectedTemplateId(nextSubFormat?.templates[0]?.id ?? "beauty_review");
                      invalidateStarterPreview();
                    }}
                  />
                </div>
                <div className="field compactControl">
                  <span className="controlLabel">
                    <span>Sub format</span>
                    <span className="infoTooltip" tabIndex={0} aria-label={selectedSubFormat.explanation}>
                      i
                      <span role="tooltip">{selectedSubFormat.explanation}</span>
                    </span>
                  </span>
                  <ComposerSelect
                    id="subFormatSelect"
                    value={selectedSubFormat.id}
                    options={selectedFormatGroup.subFormats.map((format) => ({
                      value: format.id,
                      label: format.name,
                      title: format.explanation
                    }))}
                    onChange={(value) => {
                      const nextSubFormat = selectedFormatGroup.subFormats.find((format) => format.id === value)
                        ?? selectedFormatGroup.subFormats[0];
                      setSelectedSubFormatId(nextSubFormat.id);
                      setSelectedTemplateId(nextSubFormat.templates[0]?.id ?? "beauty_review");
                      invalidateStarterPreview();
                    }}
                  />
                </div>
                <div className="field compactControl">
                  <span className="controlLabel">
                    <span>Template</span>
                    <span className="infoTooltip" tabIndex={0} aria-label={selectedTemplate.explanation}>
                      i
                      <span role="tooltip">{selectedTemplate.explanation}</span>
                    </span>
                  </span>
                  <ComposerSelect
                    id="templateSelect"
                    value={selectedTemplate.id}
                    options={selectedSubFormat.templates.map((template) => ({
                      value: template.id,
                      label: template.name,
                      title: template.explanation
                    }))}
                    onChange={(value) => {
                      setSelectedTemplateId(value);
                      invalidateStarterPreview();
                    }}
                  />
                </div>
              </div>

              <div className="gridThree runControls">
                <div className="field">
                  <span className="controlLabel">Length</span>
                  <ComposerSelect
                    id="duration"
                    value={String(duration)}
                    options={[
                      { value: "5", label: "5 seconds" },
                      { value: "10", label: "10 seconds" },
                      { value: "15", label: "15 seconds" }
                    ]}
                    onChange={(value) => setDuration(Number(value))}
                  />
                </div>
                <div className="field">
                  <span className="controlLabel">Variants</span>
                  <ComposerSelect
                    id="count"
                    value={String(count)}
                    options={Array.from({ length: 10 }, (_, index) => {
                      const nextValue = String(index + 1);
                      return { value: nextValue, label: nextValue };
                    })}
                    onChange={(value) => setCount(Number(value))}
                  />
                </div>
              </div>

              <button
                className="primaryButton deckGenerateButton"
                disabled={loading || starterLoading || (requiresStarterApproval && !starterApproved)}
                type="submit"
              >
                {loading
                  ? "Generating..."
                  : requiresStarterApproval && !starterApproved
                    ? "Approve starter"
                    : (
                      <>
                        <span>Generate</span>
                        <img className="generateButtonIcon" alt="" src="/generate-bolt-icon.png" />
                      </>
                    )}
              </button>
            </div>

            <div className="subFormatPanel">
              <div className="formatInfoPanel">
                <div>
                  <span>What it makes</span>
                  <strong>{selectedTemplate.explanation}</strong>
                </div>
                <div>
                  <span>Best for</span>
                  <p>{selectedTemplate.bestFor.join(" / ")}</p>
                </div>
                <div>
                  <span>Assets</span>
                  <p>{selectedTemplate.assetNotes.join(" / ")}</p>
                </div>
                <div>
                  <span>Watch out</span>
                  <p>{selectedTemplate.caution}</p>
                </div>
                <div>
                  <span>Hook</span>
                  <p>{selectedTemplate.hookStructure}</p>
                </div>
                <div>
                  <span>Screen</span>
                  <p>{selectedTemplate.visualDirection}</p>
                </div>
                <div>
                  <span>Dialogue</span>
                  <p>{selectedTemplate.dialogueDirection}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="uploadGrid">
            <label
              className={referencePreviewUrl ? "uploadCard referenceAsset hasPreview" : "uploadCard referenceAsset"}
              htmlFor="referenceVideo"
            >
              {referencePreviewUrl ? (
                <video className="assetPreviewMedia" muted playsInline preload="metadata" src={referencePreviewUrl} />
              ) : null}
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
                  const file = event.currentTarget.files?.[0];
                  setReferenceFileName(file?.name ?? "");
                  updatePreviewUrl(file, setReferencePreviewUrl);
                  invalidateStarterPreview();
                }}
              />
            </label>

            <button
              className={productPreviewUrl ? "uploadCard productAsset hasPreview" : "uploadCard productAsset"}
              type="button"
              onClick={() => setProductModalOpen(true)}
            >
              {productPreviewUrl ? (
                <img className="assetPreviewMedia" alt="" src={productPreviewUrl} />
              ) : null}
              <span>Product image</span>
              <strong>{productName || productFileName || "Add product"}</strong>
              <em>Shape, color, label, material lock</em>
            </button>

            <button
              className={
                sharedModelPreviewUrl && modelMode === "shared_model"
                  ? "uploadCard optional modelAsset hasPreview"
                  : "uploadCard optional modelAsset"
              }
              type="button"
              onClick={() => setCreatorModalOpen(true)}
            >
              {sharedModelPreviewUrl && modelMode === "shared_model" ? (
                <img className="assetPreviewMedia" alt="" src={sharedModelPreviewUrl} />
              ) : null}
              <span>Creator</span>
              <strong>{creatorSummary}</strong>
              <em>Model and account assignment</em>
            </button>

            <button className="analysisPreviewPanel" type="button" onClick={() => setLayerPreviewOpen(true)}>
              <span className="analysisPreviewSummary">
                <span>Layer preview</span>
                <strong>{result ? "View source layers" : "Generation plan"}</strong>
                <em>{result ? "Open analysis, prompt layers, and variant plan" : "Generate to see analysis and layers here."}</em>
              </span>
            </button>
          </div>

          <div className={productModalOpen ? "productModal open" : "productModal"} aria-hidden={!productModalOpen}>
            <div className="productModalPanel" role="dialog" aria-modal="true" aria-labelledby="productModalTitle">
              <div className="productModalTop">
                <div className="productModalTabs" aria-label="Asset type">
                  <button className="selected" type="button">Product</button>
                  <button disabled type="button">App</button>
                </div>
                <button className="modalCloseButton" type="button" onClick={() => setProductModalOpen(false)}>
                  x
                </button>
              </div>
              <div className="productModalHero">
                <div>
                  <p className="eyebrow">Product asset</p>
                  <h2 id="productModalTitle">Add your product</h2>
                  <p>Upload the product image and add optional selling/use notes for the product analysis layer.</p>
                </div>
                <label className={productPreviewUrl ? "productImageDrop hasPreview" : "productImageDrop"} htmlFor="productImage">
                  {productPreviewUrl ? <img alt="" src={productPreviewUrl} /> : <span>Upload image</span>}
                  <input
                    id="productImage"
                    name="productImage"
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0];
                      setProductFileName(file?.name ?? "");
                      updatePreviewUrl(file, setProductPreviewUrl);
                      readProductImage(file);
                      invalidateStarterPreview();
                    }}
                  />
                </label>
              </div>
              <div className="productModalFields">
                <label className="field" htmlFor="productName">
                  <span>Product name</span>
                  <input
                    id="productName"
                    name="productName"
                    placeholder="e.g. STANLEY tumbler"
                    value={productName}
                    onChange={(event) => {
                      setProductName(event.currentTarget.value);
                      invalidateStarterPreview();
                    }}
                  />
                </label>
                <div className="field productModeField">
                  <span>Product analysis</span>
                  <div className="productModeToggle">
                    <label>
                      <input
                        checked={productAnalysisMode === "auto"}
                        name="productAnalysisMode"
                        type="radio"
                        value="auto"
                        onChange={() => setProductAnalysisMode("auto")}
                      />
                      Auto
                    </label>
                    <label>
                      <input
                        checked={productAnalysisMode === "guided"}
                        name="productAnalysisMode"
                        type="radio"
                        value="guided"
                        onChange={() => setProductAnalysisMode("guided")}
                      />
                      Guided
                    </label>
                  </div>
                </div>
                {productAnalysisMode === "guided" ? (
                  <div className="field productFeatureField">
                    <span>Product functions</span>
                    <div className="productFeatureList">
                      {productFeatureItems.map((item, index) => (
                        <div className="productFeatureRow" key={`${index}-${item}`}>
                        <input
                          aria-label={`Product function ${index + 1}`}
                          placeholder="English only, e.g. leak-resistant lid"
                          value={item}
                          onChange={(event) => updateProductFeature(index, event.currentTarget.value)}
                        />
                          <button type="button" onClick={() => removeProductFeature(index)}>
                            Remove
                          </button>
                        </div>
                      ))}
                      <div className="productFeatureRow addFeatureRow">
                        <input
                          aria-label="New product function"
                          placeholder="English only. Add one product function or usage detail"
                          value={productFeatureDraft}
                          onChange={(event) => setProductFeatureDraft(englishOnlyText(event.currentTarget.value))}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              addProductFeature();
                            }
                          }}
                        />
                        <button type="button" onClick={addProductFeature}>
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
                <div className="savedProductSection">
                  <div className="savedProductHeader">
                    <span>Saved products</span>
                    <small>Reuse a product asset</small>
                  </div>
                  {savedProducts.length ? (
                    <div className="savedProductGrid">
                      {savedProducts.map((product) => (
                        <button
                          className="savedProductCard"
                          key={product.id}
                          type="button"
                          onClick={() => selectSavedProduct(product)}
                        >
                          <span className="savedProductThumb">
                            {product.imageDataUrl ? <img alt="" src={product.imageDataUrl} /> : null}
                          </span>
                          <strong>{product.name}</strong>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="savedProductEmpty">Saved products will appear here.</p>
                  )}
                </div>
              </div>
              <div className="productModalActions">
                <button className="secondaryButton" type="button" onClick={() => setProductModalOpen(false)}>
                  Cancel
                </button>
                <button className="primaryButton" type="button" onClick={saveProductAsset}>
                  Save product
                </button>
              </div>
            </div>
          </div>

          <div className={creatorModalOpen ? "productModal creatorModal open" : "productModal creatorModal"} aria-hidden={!creatorModalOpen}>
            <div className="productModalPanel" role="dialog" aria-modal="true" aria-labelledby="creatorModalTitle">
              <div className="productModalTop">
                <div className="productModalTabs" aria-label="Creator setup type">
                  <button className="selected" type="button">Creator</button>
                  <button disabled type="button">Accounts</button>
                </div>
                <button className="modalCloseButton" type="button" onClick={() => setCreatorModalOpen(false)}>
                  x
                </button>
              </div>
              <div className="productModalHero">
                <div>
                  <p className="eyebrow">Creator asset</p>
                  <h2 id="creatorModalTitle">Set creators</h2>
                  <p>Choose whether this pack uses generated creators, one shared model image, or separate creator images per account.</p>
                </div>
                <div className={sharedModelPreviewUrl ? "creatorHeroPreview hasPreview" : "creatorHeroPreview"}>
                  {sharedModelPreviewUrl ? <img alt="" src={sharedModelPreviewUrl} /> : <span>{creatorSummary}</span>}
                </div>
              </div>
              <div className="creatorModeCards">
                {modelModeOptions.map((option) => (
                  <label className={modelMode === option.id ? "creatorModeCard selected" : "creatorModeCard"} key={option.id}>
                    <input
                      checked={modelMode === option.id}
                      name="modelMode"
                      type="radio"
                      value={option.id}
                      onChange={() => {
                        setModelMode(option.id);
                        invalidateStarterPreview();
                      }}
                    />
                    <strong>{option.label}</strong>
                    <span>{option.description}</span>
                  </label>
                ))}
              </div>

              {modelMode === "shared_model" ? (
                <div className="creatorModalSection">
                  <label className={sharedModelPreviewUrl ? "creatorUploadDrop hasPreview" : "creatorUploadDrop"} htmlFor="sharedCreatorImage">
                    {sharedModelPreviewUrl ? <img alt="" src={sharedModelPreviewUrl} /> : <span>Upload creator image</span>}
                    <input
                      id="sharedCreatorImage"
                      name="sharedCreatorImage"
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.currentTarget.files?.[0];
                        setSharedModelFileName(file?.name ?? "");
                        updatePreviewUrl(file, setSharedModelPreviewUrl);
                        if (file) setModelMode("shared_model");
                        invalidateStarterPreview();
                      }}
                    />
                  </label>
                  <p>Use one creator identity for every generated variant and account.</p>
                </div>
              ) : null}

              {modelMode === "per_account_models" ? (
                <div className="accountModels creatorAccountModels">
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

              {modelMode === "auto_generated" ? (
                <div className="creatorModalSection creatorAutoNote">
                  <strong>No creator upload needed.</strong>
                  <p>UGCLabs will generate a creator from the selected format and product context. Identity may vary across variants.</p>
                </div>
              ) : null}

              <div className="productModalActions">
                <button className="secondaryButton" type="button" onClick={() => setCreatorModalOpen(false)}>
                  Cancel
                </button>
                <button className="primaryButton" type="button" onClick={() => setCreatorModalOpen(false)}>
                  Save creator
                </button>
              </div>
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

      <section className="results gallerySection" id="results">
        <div className="sectionHeader resultsHeader">
          <div>
            <h2>
              <button
                className="sectionTitle sectionTitleButton"
                type="button"
                aria-expanded={resultsOpen}
                onClick={() => {
                  setResultsOpen((open) => !open);
                }}
              >
                <img className="sectionTitleIcon" alt="" src="/ugc-logo-icon.png" />
                <span>Generated videos</span>
                <svg
                  className="sectionToggleChevron"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.45"
                  viewBox="0 0 24 24"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            </h2>
          </div>
          {generationComplete ? <span className="completeBadge resultsStatus">Complete</span> : null}
        </div>

        {resultsOpen && !result ? (
          <div className="emptyState galleryEmptyState">
            <strong>No active result yet.</strong>
            <p>Run a test job to review generated videos in a 6-column output grid.</p>
          </div>
        ) : null}

        {result && resultsOpen ? (
          <>
            <div className="mediaGalleryGrid outputVideoGrid">
              {outputVideos.map((video) => (
                <article
                  className="mediaGalleryCard outputVideoCard"
                  key={video.index}
                  onMouseEnter={playCardVideo}
                  onMouseLeave={(event) => pauseCardVideo(event)}
                >
                  {video.playbackUrl || video.sourceUrl ? (
                    <video
                      muted
                      playsInline
                      preload="metadata"
                      src={video.playbackUrl ?? video.sourceUrl}
                      onClick={() =>
                        setActiveVideoModal({
                          title: video.hook || `Variant ${video.index}`,
                          subtitle: `Variant ${video.index}`,
                          url: video.playbackUrl ?? video.sourceUrl ?? ""
                        })
                      }
                    />
                  ) : (
                    <div className="missingVideo">No video URL returned for this variant.</div>
                  )}
                  <div className="mediaCardOverlay">
                    <span>Variant {video.index}</span>
                    <strong>{video.hook || "Generated video"}</strong>
                    <em className={video.status}>{video.status}</em>
                  </div>
                  <div className="mediaCardLinks">
                    {video.playbackUrl || video.sourceUrl ? (
                      <button
                        type="button"
                        onClick={() =>
                          setActiveVideoModal({
                            title: video.hook || `Variant ${video.index}`,
                            subtitle: `Variant ${video.index}`,
                            url: video.playbackUrl ?? video.sourceUrl ?? ""
                          })
                        }
                      >
                        Preview
                      </button>
                    ) : null}
                    {video.sourceUrl ? <a href={video.sourceUrl} download>Download</a> : null}
                  </div>
                  {video.error ? <p className="inlineError">{video.error}</p> : null}
                </article>
              ))}
            </div>

            <details className="analysisBox diagnosticsPanel">
              <summary>Run diagnostics</summary>
              {result.warnings.length ? (
                <div className="warningBox">
                  {result.warnings.map((warning) => (
                    <p key={warning}>{warning}</p>
                  ))}
                </div>
              ) : null}
              {result.intent || result.assetBinding ? (
                <pre>{JSON.stringify({ intent: result.intent, assetBinding: result.assetBinding }, null, 2)}</pre>
              ) : null}
              <pre>{JSON.stringify({ referenceAnalysis: result.analysis, assetProfiles: result.assetProfiles }, null, 2)}</pre>
              <details className="promptDetails">
                <summary>Generation prompts</summary>
                {outputVideos.map((video) => (
                  <p key={video.index}><strong>Variant {video.index}:</strong> {video.generationPrompt}</p>
                ))}
              </details>
            </details>
          </>
        ) : null}
      </section>

      <section className="formatReferenceSection gallerySection" aria-labelledby="formatReferenceTitle">
        <div className="sectionHeader centeredSectionHeader">
          <div>
            <h2 className="sectionTitle" id="formatReferenceTitle">
              <img className="sectionTitleIcon" alt="" src="/format-play-icon.png" />
              <span>Generate across formats</span>
            </h2>
          </div>
        </div>
        <div className="mediaGalleryGrid referenceVideoGrid">
          {formatReferenceCards.slice(0, 30).map((card) => (
            <ReferenceVideoCard
              card={card}
              key={`${card.title}-${card.videoUrl}`}
              onOpen={() =>
                setActiveVideoModal({
                  title: card.title,
                  subtitle: card.subtitle,
                  url: card.videoUrl
                })
              }
            />
          ))}
        </div>
      </section>
      {activeVideoModal ? (
        <div
          className="videoLightbox"
          role="dialog"
          aria-modal="true"
          aria-label={activeVideoModal.title}
          onClick={() => setActiveVideoModal(null)}
        >
          <div className="videoLightboxPanel" onClick={(event) => event.stopPropagation()}>
            <button
              className="videoLightboxClose"
              type="button"
              aria-label="Close video"
              onClick={() => setActiveVideoModal(null)}
            >
              x
            </button>
            <video controls autoPlay playsInline src={activeVideoModal.url} />
            <div className="videoLightboxMeta">
              <strong>{activeVideoModal.title}</strong>
              {activeVideoModal.subtitle ? <span>{activeVideoModal.subtitle}</span> : null}
            </div>
          </div>
        </div>
      ) : null}
      {layerPreviewOpen ? (
        <div
          className="layerPreviewModal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="layerPreviewTitle"
          onClick={() => setLayerPreviewOpen(false)}
        >
          <div className="layerPreviewPanel" onClick={(event) => event.stopPropagation()}>
            <div className="layerPreviewTop">
              <div>
                <span>Source layers</span>
                <h2 id="layerPreviewTitle">Generation source</h2>
              </div>
              <button
                className="modalCloseButton"
                type="button"
                aria-label="Close layer preview"
                onClick={() => setLayerPreviewOpen(false)}
              >
                x
              </button>
            </div>
            <LayerPreviewContent result={result} videos={outputVideos} />
          </div>
        </div>
      ) : null}
      <footer className="siteFooter">
        <div>
          <img alt="UGCDay" src="/ugcday-wordmark.png" />
          <p>Drop in a reference video and turn it into reusable UGC ad variations.</p>
        </div>
        <nav aria-label="Footer">
          <a href="/pricing">Pricing</a>
          <a href="/history">History</a>
          <a href="/profile">Profile</a>
          <a href="/policy">Policy</a>
          <a href="/affiliate">Affiliate</a>
        </nav>
      </footer>
      </div>
    </main>
  );
}

function LayerPreviewContent({
  result,
  videos
}: {
  result: GenerateResponse | null;
  videos: GeneratedVideo[];
}) {
  if (!result) {
    return (
      <div className="layerPreviewEmpty">
        <strong>Generate to see analysis and layers here.</strong>
        <p>After generation, this source view will summarize product analysis, reference motion, prompt layers, and variant plans.</p>
      </div>
    );
  }

  const productProfile = pathValue(result, ["assetProfiles", "product"]);
  const referenceProfile = pathValue(result, ["assetProfiles", "referenceVideo"]);
  const creatorProfile = pathValue(result, ["assetProfiles", "creator"]);
  const productUnderstanding = pathValue(productProfile, ["productUnderstanding"]);
  const starterComposition = pathValue(productUnderstanding, ["starterComposition"]);
  const physicalUseModel = pathValue(productUnderstanding, ["physicalUseModel"]);
  const tags = pathValue(result, ["assetBinding", "generationTags"]);
  const inputSnapshot = result.inputSnapshot;

  return (
    <div className="layerPreviewBody">
      <section>
        <span>Actual input</span>
        <p>{snapshotText(inputSnapshot, "productFeatureNotes", "No custom product prompt was provided.")}</p>
        <dl>
          <div>
            <dt>Product</dt>
            <dd>{snapshotText(inputSnapshot, "productName")}</dd>
          </div>
          <div>
            <dt>Format</dt>
            <dd>{snapshotText(inputSnapshot, "subFormatName")}</dd>
          </div>
          <div>
            <dt>Duration</dt>
            <dd>{snapshotText(inputSnapshot, "durationSeconds")} seconds</dd>
          </div>
        </dl>
      </section>

      <section>
        <span>Product analysis</span>
        <p>{valueText(pathValue(productProfile, ["description"]))}</p>
        <dl>
          <div>
            <dt>Use case</dt>
            <dd>{valueText(pathValue(productUnderstanding, ["primaryUseCase"]))}</dd>
          </div>
          <div>
            <dt>Interaction</dt>
            <dd>{valueText(pathValue(physicalUseModel, ["primaryInteraction"]))}</dd>
          </div>
          <div>
            <dt>Visual lock</dt>
            <dd>{valueText(pathValue(productProfile, ["keyDetails"]))}</dd>
          </div>
        </dl>
      </section>

      <section>
        <span>Reference motion</span>
        <p>{valueText(pathValue(result, ["analysis", "structureSummary"]))}</p>
        <dl>
          <div>
            <dt>Scene</dt>
            <dd>{valueText(pathValue(result, ["analysis", "sceneSummary"]))}</dd>
          </div>
          <div>
            <dt>Pacing</dt>
            <dd>{valueText(pathValue(result, ["analysis", "pacingNotes"]))}</dd>
          </div>
          <div>
            <dt>Reference asset</dt>
            <dd>{valueText(pathValue(referenceProfile, ["description"]))}</dd>
          </div>
        </dl>
      </section>

      <section>
        <span>Starter frame</span>
        <p>{valueText(pathValue(starterComposition, ["starterFrameBrief"]))}</p>
        <dl>
          <div>
            <dt>Placement</dt>
            <dd>{valueText(pathValue(starterComposition, ["naturalPlacement"]))}</dd>
          </div>
          <div>
            <dt>Camera</dt>
            <dd>{valueText(pathValue(starterComposition, ["cameraFraming"]))}</dd>
          </div>
          <div>
            <dt>Creator</dt>
            <dd>{valueText(pathValue(creatorProfile, ["description"]), "Auto creator generated from product and format context.")}</dd>
          </div>
        </dl>
      </section>

      <section>
        <span>Prompt layer</span>
        <p>{valueText(pathValue(result, ["assetBinding", "referenceVideoHandling"]))}</p>
        <dl>
          <div>
            <dt>Product tag</dt>
            <dd>{valueText(pathValue(tags, ["product"]))}</dd>
          </div>
          <div>
            <dt>Creator tag</dt>
            <dd>{valueText(pathValue(tags, ["avatar"]))}</dd>
          </div>
          <div>
            <dt>Video tag</dt>
            <dd>{valueText(pathValue(tags, ["video"]))}</dd>
          </div>
        </dl>
      </section>

      <section className="layerVariantSection">
        <span>Variant plans</span>
        <div className="layerVariantList">
          {videos.map((video) => (
            <article key={video.index}>
              <strong>Variant {video.index}</strong>
              <p>{video.hook || "Generated video"}</p>
              <em>{video.generationPrompt || "Prompt source unavailable for this recovered job."}</em>
            </article>
          ))}
        </div>
      </section>
    </div>
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

function ReferenceVideoCard({
  card,
  onOpen
}: {
  card: GalleryVideoCard;
  onOpen: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hovered, setHovered] = useState(false);
  const [ready, setReady] = useState(false);

  function playPreview() {
    setHovered(true);
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    void video.play().catch(() => {
      setReady(false);
    });
  }

  function stopPreview() {
    setHovered(false);
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    video.currentTime = 0;
  }

  return (
    <article
      aria-label={`${card.title} ${card.subtitle}`}
      className={`mediaGalleryCard referenceVideoCard${hovered ? " hovering" : ""}${ready ? " videoReady" : ""}`}
      onClick={onOpen}
      onMouseEnter={playPreview}
      onMouseLeave={stopPreview}
    >
      {card.posterUrl ? (
        <img
          alt=""
          className="referencePoster"
          draggable={false}
          loading="eager"
          src={card.posterUrl}
        />
      ) : null}
      <video
        ref={videoRef}
        className="referenceHoverVideo"
        loop
        muted
        playsInline
        poster={card.posterUrl}
        preload="auto"
        src={card.previewVideoUrl}
        onCanPlay={() => setReady(true)}
        onLoadedData={() => setReady(true)}
      />
      <div className="mediaCardOverlay">
        <span>{card.title}</span>
        <strong>{card.subtitle}</strong>
      </div>
    </article>
  );
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

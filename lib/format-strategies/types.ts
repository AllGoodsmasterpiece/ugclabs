import type { VideoFormatId } from "../video-formats";

export type RendererRoute = "fal_kling" | "creatomate" | "hybrid";

export type StarterPolicy =
  | "creator_product_scene"
  | "product_only_scene"
  | "screen_demo_scene"
  | "template_first"
  | "evidence_based_scene";

export type FormatStrategy = {
  id: Exclude<VideoFormatId, "ugc_beauty_product">;
  directorName: string;
  layerPurpose: string;
  priority: string[];
  starterPolicy: StarterPolicy;
  renderer: RendererRoute;
  eligibilityRules: string[];
  requiredBeats: string[];
  plannerRules: string[];
  dialogueRules: string[];
  safetyRules: string[];
  avoidRules: string[];
  promptFrame: string;
};

import type { FormatStrategy } from "./types";

export const appSplitDemoStrategy: FormatStrategy = {
  id: "app_split_demo",
  directorName: "Split Screen Template Director",
  layerPurpose:
    "Route app demo structure toward a fixed screen/template composition with optional creator reaction as a separate layer.",
  priority: [
    "real app screen accuracy",
    "template layout",
    "tap, zoom, cursor, or callout timing",
    "creator reaction as optional top layer",
    "reference hook and pacing"
  ],
  starterPolicy: "template_first",
  renderer: "creatomate",
  eligibilityRules: [
    "Requires an app screen, website screen, dashboard image, or demo recording for accurate output.",
    "If creator reaction is requested, generate or use it as a separate layer above the fixed app screen."
  ],
  requiredBeats: [
    "fixed app or website screen remains readable",
    "show one highlighted workflow action",
    "show one zoom, tap indicator, cursor, or callout",
    "optional creator reaction stays separate from the app screen",
    "end with feature result or CTA"
  ],
  plannerRules: [
    "Do not ask Kling to invent the full app interface.",
    "Produce script, captions, and timing suitable for a Creatomate template.",
    "Reference video informs hook pacing and reaction timing, not the exact app UI."
  ],
  dialogueRules: [
    "Dialogue should be short and screen-specific.",
    "Use feature/workflow language, not physical product verbs."
  ],
  safetyRules: [
    "Do not invent UI data, analytics, reviews, or financial results.",
    "Do not obscure or alter user-provided app screen assets."
  ],
  avoidRules: [
    "do not generate fake app screens as the source of truth",
    "do not use product-handheld poses",
    "do not let model identity compete with screen readability"
  ],
  promptFrame:
    "Create a split-screen app demo plan for a template renderer: fixed app screen below or beside, optional creator reaction above, synchronized captions and tap/zoom callouts."
};

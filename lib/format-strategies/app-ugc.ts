import type { FormatStrategy } from "./types";

export const appUgcStrategy: FormatStrategy = {
  id: "app_ugc",
  directorName: "Screen Flow Director",
  layerPurpose:
    "Treat the app, website, screen, or software workflow as the product proof while using creator reaction only as support.",
  priority: [
    "screen/interface proof",
    "workflow clarity",
    "creator reaction when useful",
    "caption or spoken hook",
    "reference pacing and framing"
  ],
  starterPolicy: "screen_demo_scene",
  renderer: "hybrid",
  eligibilityRules: [
    "Best when the uploaded product asset is an app screenshot, website screenshot, dashboard image, or screen recording frame.",
    "If no screen/interface asset exists, ask for one before promising accurate App UGC."
  ],
  requiredBeats: [
    "show app or website screen in the first second",
    "show one tap, scroll, cursor, or workflow action",
    "show one interface result or benefit proof",
    "include creator reaction only if it does not cover the screen"
  ],
  plannerRules: [
    "Do not hallucinate exact UI screens that were not provided.",
    "Keep app UI as the proof; creator is secondary.",
    "Use reference gestures as screen pointing, tapping, scrolling, or reacting."
  ],
  dialogueRules: [
    "Dialogue must describe the actual screen workflow or benefit.",
    "Avoid generic product-review lines that do not match software."
  ],
  safetyRules: [
    "Do not invent metrics, revenue, users, charts, or dashboard data.",
    "Do not imply the app can perform unprovided regulated or high-stakes functions."
  ],
  avoidRules: [
    "do not cover the screen with the creator's face or hands",
    "do not generate fake UI text as factual product UI",
    "do not treat software like a physical handheld product"
  ],
  promptFrame:
    "Create a reference-matched app UGC scene where the screen workflow is visible and the creator reacts to or explains the interface without obscuring it."
};

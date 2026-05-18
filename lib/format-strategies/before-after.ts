import type { FormatStrategy } from "./types";

export const beforeAfterStrategy: FormatStrategy = {
  id: "before_after",
  directorName: "Comparison Safety Director",
  layerPurpose:
    "Structure before/use/after comparison while limiting claims to evidence and visually supportable contrast.",
  priority: [
    "provided evidence",
    "claim safety",
    "clear comparison structure",
    "product visibility",
    "reference pacing and transition style"
  ],
  starterPolicy: "evidence_based_scene",
  renderer: "hybrid",
  eligibilityRules: [
    "Best when before/after evidence, result image, or clear workflow state is provided.",
    "If evidence is missing, use setup versus result-view language instead of claiming real transformation."
  ],
  requiredBeats: [
    "show before/setup state",
    "show product use or workflow interaction",
    "show after/result-view state",
    "keep the product or interface connected to the comparison",
    "use cautious wording when evidence is not explicit"
  ],
  plannerRules: [
    "Do not invent measurable transformation.",
    "Reference transition style can be used, but claims must come from provided assets or visible output.",
    "If evidence is weak, frame as visual contrast, routine result, or workflow comparison."
  ],
  dialogueRules: [
    "Use cautious comparison language.",
    "Avoid guaranteed, medical, body, income, or performance claims unless directly provided and allowed."
  ],
  safetyRules: [
    "No fake before/after proof.",
    "No medical, body transformation, financial, or guaranteed improvement claims.",
    "No quantified result unless the user provides evidence."
  ],
  avoidRules: [
    "do not exaggerate transformation",
    "do not imply clinical proof",
    "do not invent before or after states that are not supported"
  ],
  promptFrame:
    "Create a reference-matched comparison video with safe before/use/after structure and only visually supportable claims."
};

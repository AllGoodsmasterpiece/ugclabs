import type { FormatStrategy } from "./types";

export const tryOnStrategy: FormatStrategy = {
  id: "ugc_virtual_try_on",
  directorName: "Fit Director",
  layerPurpose:
    "Use reference motion to show fitting, wearing, styling, pairing, or application only when the product category supports it.",
  priority: [
    "product wearability or application fit",
    "model identity preservation",
    "fit area visibility",
    "product detail preservation",
    "reference motion and camera"
  ],
  starterPolicy: "creator_product_scene",
  renderer: "fal_kling",
  eligibilityRules: [
    "Best for apparel, accessories, beauty, wearable items, eyewear, jewelry, bags, shoes, and styling products.",
    "For appliances, software, furniture, or non-wearable objects, block or downgrade to UGC/Tutorial/Product Only."
  ],
  requiredBeats: [
    "show product before or near fit area",
    "show wearing, applying, pairing, styling, or fit interaction",
    "show final fit/result clearly",
    "keep model face/body identity stable",
    "show product detail close enough to verify uploaded asset"
  ],
  plannerRules: [
    "Only use try-on language if the product is wearable, applicable, or styleable.",
    "Do not force non-wearable products onto the body.",
    "Use Product Use Director to choose the correct fit area."
  ],
  dialogueRules: [
    "Dialogue must mention fit, styling, feel, application, or look only when category-correct.",
    "Avoid product-category-wrong verbs."
  ],
  safetyRules: [
    "Avoid body-shaming, guaranteed body transformation, or medical claims.",
    "Do not alter model identity or body in a misleading way."
  ],
  avoidRules: [
    "do not use Try On for non-wearable products",
    "do not hide the fit area",
    "do not change the uploaded model's face identity"
  ],
  promptFrame:
    "Create a reference-matched try-on video where the uploaded product is worn, applied, paired, or styled only if the product category supports that interaction."
};

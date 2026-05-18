import type { FormatStrategy } from "./types";

export const tryOnStrategy: FormatStrategy = {
  id: "ugc_virtual_try_on",
  directorName: "Fit Director",
  layerPurpose:
    "Use reference motion to show fitting, wearing, styling, pairing, or beauty application only when the product category physically supports try-on behavior.",
  priority: [
    "try-on eligibility from Product Analysis and physicalUseModel",
    "correct fit/application area",
    "model identity preservation",
    "product detail preservation",
    "before-to-after visual clarity",
    "reference motion and camera only when compatible"
  ],
  starterPolicy: "creator_product_scene",
  renderer: "fal_kling",
  eligibilityRules: [
    "Allowed when Product Analysis says the item is apparel, shoes, eyewear, jewelry, bag, wearable accessory, beauty, makeup, skincare, hair, nail, fragrance, or another item that is worn, applied, fitted, paired, or styled on/near the creator.",
    "Allowed when physicalUseModel interactionModel or naturalUseSequence clearly includes wear, try on, fit, style, pair, apply, swatch, blend, place on body, or show on the intended fit area.",
    "Block before starter generation when the product is an appliance, kitchen item, furniture, app/software/screen workflow, tool, device, container, drinkware, food, or any item that cannot be worn/applied/styled."
  ],
  requiredBeats: [
    "open with the product visible near the correct fit/application area",
    "show the pre-fit/pre-application state briefly when useful",
    "show the exact wearing, applying, pairing, styling, swatching, or fitting action",
    "show final on-body/on-face/on-hair/on-hand result clearly",
    "keep model face/body identity stable and avoid changing body shape",
    "show a detail close-up that verifies the uploaded product asset"
  ],
  plannerRules: [
    "Only use try-on language if the product is wearable, applicable, or styleable according to Product Analysis.",
    "Use Product Use Director and physicalUseModel to choose the fit/application area: face, lips, eyes, hair, hands, wrist, ears, neck, torso, legs, feet, bag/shoulder, or full outfit.",
    "Translate reference motions into fit/application motions; do not copy source-product motions that conflict with the target product.",
    "For beauty/skincare/makeup, show controlled application or swatch rather than treating the item like clothing.",
    "For apparel/accessories, show wearing/styling/adjusting rather than generic product holding.",
    "Do not force non-wearable products onto the body."
  ],
  dialogueRules: [
    "Dialogue must mention fit, styling, look, shade, texture, application, pairing, or feel only when category-correct.",
    "Use Product use rules and physicalUseModel terms; avoid product-category-wrong verbs.",
    "Do not make body transformation, medical, or guaranteed attractiveness claims."
  ],
  safetyRules: [
    "Avoid body-shaming, guaranteed body transformation, or medical claims.",
    "Do not alter model identity or body in a misleading way.",
    "For skincare/beauty, do not imply clinical results or permanent transformation.",
    "For apparel, avoid unrealistic body reshaping, impossible fabric behavior, or size claims not visible."
  ],
  avoidRules: [
    "do not use Try On for non-wearable products",
    "do not hide the fit area",
    "do not change the uploaded model's face identity",
    "do not show only a held product without final worn/applied/styled proof",
    "do not invent a different garment, shade, accessory, logo, or pattern than the uploaded product"
  ],
  promptFrame:
    "Create a reference-matched UGC virtual try-on where the uploaded product is first shown near the correct fit/application area, then worn, applied, paired, swatched, or styled, ending on a clear final fit/result proof."
};

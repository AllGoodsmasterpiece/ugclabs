export type VideoFormatId =
  | "ugc_virtual_try_on"
  | "ugc_beauty_product"
  | "tutorial"
  | "unboxing"
  | "product_only"
  | "app_ugc"
  | "app_split_demo"
  | "before_after";

export type VideoFormat = {
  id: VideoFormatId;
  name: string;
  shortDescription: string;
  promptIntent: string;
};

export type CreativeTypeId = "model_product";

export type VideoTemplate = {
  id: string;
  name: string;
  videoFormat: VideoFormatId;
  shortDescription: string;
  explanation: string;
  assetNotes: string[];
  bestFor: string[];
  caution: string;
  hookStructure: string;
  visualDirection: string;
  dialogueDirection: string;
  creativeTypeId: CreativeTypeId;
  creativeTypeName: string;
  categoryId: string;
  categoryName: string;
};

export type VideoSubFormat = {
  id: string;
  name: string;
  shortDescription: string;
  explanation: string;
  assetNotes: string[];
  bestFor: string[];
  caution: string;
  templates: VideoTemplate[];
};

export type VideoFormatGroup = {
  id: CreativeTypeId;
  name: string;
  shortDescription: string;
  explanation: string;
  subFormats: VideoSubFormat[];
};

export type UgcTemplateStyle = {
  id: string;
  name: string;
  shortDescription: string;
  appliesTo: VideoFormatId[];
  explanation: string;
  promptBias: string[];
  avoid: string[];
  previewVideo?: string;
  previewPoster?: string;
};

export const videoFormats: VideoFormat[] = [
  {
    id: "ugc_beauty_product",
    name: "UGC",
    shortDescription: "Realistic social media videos for beauty and product use",
    promptIntent:
      "A realistic creator-led social video where a person applies, uses, or reacts to the product."
  },
  {
    id: "tutorial",
    name: "Tutorial",
    shortDescription: "Step-by-step tutorials",
    promptIntent:
      "A short step-by-step demonstration showing how to use the product or achieve a result."
  },
  {
    id: "unboxing",
    name: "Unboxing",
    shortDescription: "High-quality unboxing",
    promptIntent:
      "Hands open packaging, reveal the product, inspect details, and create a first-impression moment."
  },
  {
    id: "product_only",
    name: "Product Only",
    shortDescription: "Product-only B-roll without a visible creator",
    promptIntent:
      "A product-only commercial B-roll clip with close-ups, texture shots, product movement, and no visible creator."
  },
  {
    id: "app_ugc",
    name: "App UGC",
    shortDescription: "Creator-led app or web service review",
    promptIntent:
      "A realistic creator-led UGC video for an app or web service, showing the app on a laptop or phone while the creator reacts, points, or explains the core benefit."
  },
  {
    id: "app_split_demo",
    name: "App Split Demo",
    shortDescription: "Creator plus app or web demo split-screen",
    promptIntent:
      "A split-screen short where a creator reaction or hook appears alongside an app interface, web dashboard, software workflow, chart, or product demo."
  },
  {
    id: "before_after",
    name: "Before & After",
    shortDescription: "Before and after comparison",
    promptIntent:
      "A clear transformation or comparison video showing the state before use and the improved state after use."
  }
];

export const ugcTemplateStyles: UgcTemplateStyle[] = [
  {
    id: "auto",
    name: "Auto match",
    shortDescription: "Let the planner choose",
    appliesTo: ["ugc_beauty_product", "tutorial", "unboxing", "before_after"],
    explanation:
      "Use the selected sub format, Product Analysis, and reference video to choose the most natural UGC style.",
    promptBias: [],
    avoid: []
  },
  {
    id: "sensory_unboxing",
    name: "Sensory Unboxing",
    shortDescription: "Packaging, material, reveal",
    appliesTo: ["unboxing", "ugc_beauty_product"],
    explanation:
      "Focus on tactile packaging, material feel, slow reveal, close detail, and first-impression reaction.",
    promptBias: ["package opening", "material texture", "slow reveal", "first touch", "close detail proof"],
    avoid: ["do not skip the reveal", "do not invent exact packaging if not provided"],
    previewVideo: "/template-previews/sensory-unboxing.mp4",
    previewPoster: "/template-previews/sensory-unboxing.jpg"
  },
  {
    id: "detail_discovery",
    name: "Detail Discovery",
    shortDescription: "Small details and reaction",
    appliesTo: ["ugc_beauty_product", "unboxing", "tutorial"],
    explanation:
      "The creator discovers and reacts to a specific product detail such as texture, finish, logo, cutout, handle, applicator, or design feature.",
    promptBias: ["detail close-up", "creator noticing a feature", "pointing or tapping the detail", "short surprised reaction"],
    avoid: ["do not make the detail generic", "do not hide the feature being discussed"],
    previewVideo: "/template-previews/detail-discovery.mp4",
    previewPoster: "/template-previews/detail-discovery.jpg"
  },
  {
    id: "performance_proof",
    name: "Performance Proof",
    shortDescription: "Use-feel and visible proof",
    appliesTo: ["ugc_beauty_product", "tutorial", "before_after"],
    explanation:
      "Show a concrete use moment that proves performance, feel, fit, handling, finish, or visible result without unsupported claims.",
    promptBias: ["actual use moment", "hands-on proof", "visible result", "before/use/result rhythm"],
    avoid: ["do not make unsupported performance claims", "do not use vague praise without proof"],
    previewVideo: "/template-previews/performance-proof.mp4",
    previewPoster: "/template-previews/performance-proof.jpg"
  },
  {
    id: "texture_proof",
    name: "Texture Proof",
    shortDescription: "Texture, application, finish",
    appliesTo: ["ugc_beauty_product", "tutorial", "before_after"],
    explanation:
      "Best for skincare, beauty, makeup, hair, or material products where texture, application, absorption, swatch, or finish is the proof.",
    promptBias: ["macro texture close-up", "controlled application", "swatch or fingertip proof", "finish/result shot"],
    avoid: ["do not show product leaking from invalid parts", "do not claim medical or permanent results"],
    previewVideo: "/template-previews/texture-proof.mp4",
    previewPoster: "/template-previews/texture-proof.jpg"
  },
  {
    id: "asmr_detail",
    name: "ASMR Detail",
    shortDescription: "Visual satisfaction, close-ups",
    appliesTo: ["ugc_beauty_product", "unboxing", "product_only"],
    explanation:
      "Create visually satisfying close-ups with precise hand movement, texture, taps, opening, smooth motion, and minimal talking.",
    promptBias: ["macro close-up", "slow hand movement", "visual satisfaction", "clean product detail", "minimal dialogue"],
    avoid: ["do not overdo face reaction", "do not rush the detail shots"],
    previewVideo: "/template-previews/asmr-detail.mp4",
    previewPoster: "/template-previews/asmr-detail.jpg"
  },
  {
    id: "real_use_result",
    name: "Real Use Result",
    shortDescription: "Use it, show result",
    appliesTo: ["ugc_beauty_product", "tutorial", "before_after"],
    explanation:
      "Show the creator actually using the product and ending on a visible result, finish, setup, or solved state.",
    promptBias: ["real use action", "result reveal", "product remains visible", "creator reaction tied to result"],
    avoid: ["do not skip the use action", "do not show only a static product pose"],
    previewVideo: "/template-previews/real-use-result.mp4",
    previewPoster: "/template-previews/real-use-result.jpg"
  },
  {
    id: "lifestyle_recommendation",
    name: "Lifestyle Recommendation",
    shortDescription: "Daily use and recommendation",
    appliesTo: ["ugc_beauty_product"],
    explanation:
      "A casual everyday recommendation that shows where the product fits into the creator's routine or lifestyle.",
    promptBias: ["natural daily setting", "creator recommendation", "quick product proof", "native social pacing"],
    avoid: ["do not turn it into a formal commercial", "do not make it step-by-step unless needed"],
    previewVideo: "/template-previews/lifestyle-recommendation.mp4",
    previewPoster: "/template-previews/lifestyle-recommendation.jpg"
  },
  {
    id: "review_demo",
    name: "Review + Demo",
    shortDescription: "Opinion plus demonstration",
    appliesTo: ["ugc_beauty_product", "tutorial"],
    explanation:
      "Blend a creator recommendation with one concrete demo action, so the clip has both opinion and product proof.",
    promptBias: ["hook opinion", "one demo action", "proof close-up", "short closing recommendation"],
    avoid: ["do not make it only talking", "do not make the demo unrelated to the claim"],
    previewVideo: "/template-previews/review-demo.mp4",
    previewPoster: "/template-previews/review-demo.jpg"
  }
];

export function getUgcTemplateStyle(id: string | undefined): UgcTemplateStyle | undefined {
  if (!id || id === "auto") {
    return undefined;
  }

  return ugcTemplateStyles.find((style) => style.id === id);
}

const legacyVideoFormatGroups = [
  {
    id: "ugc",
    name: "UGC",
    shortDescription: "Creator-led videos",
    explanation:
      "Creator-led videos where a person recommends, explains, opens, or compares the product in a native social style.",
    subFormats: [
      {
        id: "ugc_review",
        name: "Review",
        videoFormat: "ugc_beauty_product",
        shortDescription: "Recommendation, reaction, and one proof moment",
        explanation:
          "A creator recommends the product with a quick hook, natural reaction, one visible proof moment, and a short closing line.",
        assetNotes: ["Product image", "Model image optional", "Reference video optional in Fast UGC, required in Reference Match"],
        bestFor: ["Beauty", "lifestyle products", "gadgets", "drinkware", "home items"],
        caution: "Best when the goal is why the creator likes it, not a full step-by-step lesson."
      },
      {
        id: "ugc_review_demo",
        name: "Review + Demo",
        videoFormat: "ugc_beauty_product",
        shortDescription: "Opinion plus one concrete product proof",
        explanation:
          "A creator gives a natural recommendation, then immediately backs it up with one clear demo action or visible proof moment.",
        assetNotes: ["Product image", "Model image optional", "Reference video optional in Fast UGC, required in Reference Match"],
        bestFor: ["Beauty", "gadgets", "home items", "drinkware", "daily-use products"],
        caution: "Avoid talking-only praise; the demo action must match the product's real function."
      },
      {
        id: "ugc_detail_discovery",
        name: "Detail Discovery",
        videoFormat: "ugc_beauty_product",
        shortDescription: "Creator notices and shows a product detail",
        explanation:
          "A creator discovers a specific feature such as texture, finish, logo, cutout, handle, applicator, control, or design detail.",
        assetNotes: ["Product image with visible detail", "Model image optional", "Reference video can guide pointing or close-up motion"],
        bestFor: ["Design-led products", "beauty packaging", "gadgets", "accessories", "premium details"],
        caution: "Do not invent a detail that is not visible in the uploaded product image."
      },
      {
        id: "ugc_lifestyle",
        name: "Lifestyle",
        videoFormat: "ugc_beauty_product",
        shortDescription: "Daily-use recommendation",
        explanation:
          "A casual everyday recommendation showing where the product fits into the creator's routine, bag, desk, bathroom, kitchen, or lifestyle.",
        assetNotes: ["Product image", "Model image optional", "Reference video can guide setting and pace"],
        bestFor: ["Daily-use products", "beauty", "home", "wellness", "accessories"],
        caution: "Keep it native and casual; avoid turning the scene into a formal commercial."
      },
      {
        id: "ugc_performance_proof",
        name: "Performance Proof",
        videoFormat: "ugc_beauty_product",
        shortDescription: "Use moment and visible proof",
        explanation:
          "A creator shows a concrete use moment that proves feel, fit, handling, finish, setup, or a visible result without overclaiming.",
        assetNotes: ["Product image", "Product function notes help", "Reference video can guide the proof action"],
        bestFor: ["Tools", "beauty", "drinkware", "cleaning", "setup/result products"],
        caution: "No unsupported performance claims, medical claims, or guaranteed results."
      },
      {
        id: "ugc_texture_proof",
        name: "Texture Proof",
        videoFormat: "tutorial",
        shortDescription: "Texture, application, finish",
        explanation:
          "A close-up product-use clip focused on texture, application, swatch, absorption, finish, grip, surface, or material proof.",
        assetNotes: ["Product image", "Model or hands", "Feature notes are useful for application rules"],
        bestFor: ["Skincare", "makeup", "hair", "materials", "food texture", "surface detail"],
        caution: "Do not claim clinical, permanent, or impossible results."
      },
      {
        id: "ugc_asmr_detail",
        name: "ASMR Detail",
        videoFormat: "ugc_beauty_product",
        shortDescription: "Visual satisfaction and close-ups",
        explanation:
          "A satisfying close-up sequence with precise hand movement, taps, opening, texture, smooth movement, and minimal talking.",
        assetNotes: ["Product image", "Reference video can guide hand rhythm", "Model face is optional"],
        bestFor: ["Packaging", "beauty", "gadgets", "accessories", "detail-heavy products"],
        caution: "Avoid excessive face reaction; keep product detail as the hero."
      },
      {
        id: "ugc_tutorial",
        name: "Tutorial",
        videoFormat: "tutorial",
        shortDescription: "Setup, steps, proof, and result",
        explanation:
          "A creator shows how to use the product in order, turning the reference motion into setup, first action, operation, proof, and result.",
        assetNotes: ["Product image", "Model or hands", "Reference video with a useful action is recommended"],
        bestFor: ["Skincare routines", "kitchen products", "tools", "setup/use products", "apps with simple workflows"],
        caution: "The clip should teach how to use it; avoid generic face-only testimonial footage."
      },
      {
        id: "ugc_unboxing",
        name: "Unboxing Reveal",
        videoFormat: "unboxing",
        shortDescription: "Open, reveal, inspect, and first impression",
        explanation:
          "A creator opens packaging or stages a reveal, then inspects the product and gives a first-impression reaction.",
        assetNotes: ["Product image", "Packaging image or reference packaging helps", "Reference opening/reveal motion is recommended"],
        bestFor: ["Packaged products", "gifts", "beauty boxes", "gadgets", "premium-feel products"],
        caution: "If packaging is not provided, treat it as a reveal or first impression instead of inventing exact packaging."
      },
      {
        id: "ugc_before_after",
        name: "Before & After",
        videoFormat: "before_after",
        shortDescription: "Creator-led before/use/after contrast",
        explanation:
          "A creator shows a before state, uses the product, then shows a safe and visually supportable after/result state.",
        assetNotes: ["Product image", "Before/after evidence is strongly recommended", "Model image optional"],
        bestFor: ["Beauty", "cleaning", "workflow improvements", "visible setup/result products"],
        caution: "No unsupported transformation, medical, body, or guaranteed-result claims."
      }
    ]
  },
  {
    id: "product_demo",
    name: "Product Demo",
    shortDescription: "Product-led videos",
    explanation:
      "Product-led videos where the product itself is the hero and creator presence is reduced or removed.",
    subFormats: [
      {
        id: "product_only",
        name: "Product Only",
        videoFormat: "product_only",
        shortDescription: "B-roll, macro detail, surface movement",
        explanation:
          "A product-only commercial-style clip with close-ups, detail proof, lighting, controlled movement, and no visible talking-head creator.",
        assetNotes: ["Product image", "Model image not needed", "Reference video can guide camera style"],
        bestFor: ["Packaging", "premium product shots", "detail-heavy products", "simple catalog-style ads"],
        caution: "If a model image is uploaded, this format should still avoid visible creator scenes."
      }
    ]
  },
  {
    id: "app_screen",
    name: "App / Screen",
    shortDescription: "Screen-led videos",
    explanation:
      "Screen-led videos for apps, websites, dashboards, software workflows, and template-based screen demos.",
    subFormats: [
      {
        id: "app_ugc",
        name: "App UGC",
        videoFormat: "app_ugc",
        shortDescription: "Creator explains or reacts to an app workflow",
        explanation:
          "A creator-led app video where the screen workflow is the proof and the creator reacts, points, or explains without covering the interface.",
        assetNotes: ["App screenshot or screen asset recommended", "Model image optional", "Reference video can guide pacing"],
        bestFor: ["Mobile apps", "SaaS", "web tools", "simple dashboard workflows"],
        caution: "Do not rely on generated video to invent accurate UI text or dashboard data."
      },
      {
        id: "app_split_demo",
        name: "Split Demo",
        videoFormat: "app_split_demo",
        shortDescription: "Creator layer plus fixed app screen",
        explanation:
          "A split-screen structure where the app screen stays readable and captions, taps, zooms, or creator reaction support the demo.",
        assetNotes: ["Real app screen asset required for production quality", "Creator layer optional", "Best suited to template rendering later"],
        bestFor: ["SaaS demos", "mobile app walkthroughs", "feature callouts", "dashboard proof"],
        caution: "This should eventually route to Creatomate/template rendering rather than pure video generation."
      }
    ]
  },
  {
    id: "comparison",
    name: "Comparison",
    shortDescription: "Evidence-led videos",
    explanation:
      "Comparison-led videos where the structure is proof, contrast, before/after, or problem-to-solution rather than creator personality.",
    subFormats: [
      {
        id: "comparison_before_after",
        name: "Before & After",
        videoFormat: "before_after",
        shortDescription: "Evidence-first before/use/after comparison",
        explanation:
          "A comparison-focused before/after video using visual evidence, labels, split views, or result states. Creator is optional.",
        assetNotes: ["Before/after evidence strongly recommended", "Product image", "Reference video can guide pacing or transition style"],
        bestFor: ["Visible results", "cleaning", "beauty with evidence", "workflow comparison", "problem-solution ads"],
        caution: "No fake proof, medical claims, income claims, or quantified results without evidence."
      }
    ]
  }
];

type TemplateSeed = {
  id: string;
  name: string;
  videoFormat?: VideoFormatId;
  hookStructure?: string;
  visualDirection?: string;
  dialogueDirection?: string;
};

const modelProductCreativeType = {
  id: "model_product" as const,
  name: "Model + product"
};

function template(
  category: Pick<VideoSubFormat, "id" | "name" | "assetNotes" | "bestFor" | "caution">,
  seed: TemplateSeed
): VideoTemplate {
  const hookStructure = seed.hookStructure
    ?? `Open with a clear ${seed.name} hook, then move into product proof.`;
  const visualDirection = seed.visualDirection
    ?? `Stage the creator and product in a native social scene for ${category.name}.`;
  const dialogueDirection = seed.dialogueDirection
    ?? `Keep the line natural and specific to the product benefit.`;

  return {
    id: seed.id,
    name: seed.name,
    videoFormat: seed.videoFormat ?? inferVideoFormat(seed.name),
    shortDescription: `${category.name} template`,
    explanation: [
      `${seed.name} for ${category.name}.`,
      `Hook: ${hookStructure}`,
      `Screen: ${visualDirection}`,
      `Dialogue: ${dialogueDirection}`
    ].join("\n"),
    assetNotes: category.assetNotes,
    bestFor: category.bestFor,
    caution: category.caution,
    hookStructure,
    visualDirection,
    dialogueDirection,
    creativeTypeId: modelProductCreativeType.id,
    creativeTypeName: modelProductCreativeType.name,
    categoryId: category.id,
    categoryName: category.name
  };
}

function inferVideoFormat(name: string): VideoFormatId {
  const normalized = name.toLowerCase();

  if (normalized.includes("unboxing") || normalized.includes("haul")) return "unboxing";
  if (normalized.includes("before") || normalized.includes("after") || normalized.includes("comparison")) {
    return "before_after";
  }
  if (normalized.includes("demo") || normalized.includes("routine") || normalized.includes("step")) return "tutorial";
  if (normalized.includes("app") || normalized.includes("screen")) return "app_ugc";

  return "ugc_beauty_product";
}

function category(
  id: string,
  name: string,
  shortDescription: string,
  seeds: TemplateSeed[],
  options: Pick<VideoSubFormat, "assetNotes" | "bestFor" | "caution">
): VideoSubFormat {
  const base = {
    id,
    name,
    shortDescription,
    explanation: `${name} template family from the Ugcday format sheet.`,
    ...options
  };

  return {
    ...base,
    templates: seeds.map((seed) => template(base, seed))
  };
}

export const videoFormatGroups: VideoFormatGroup[] = [
  {
    id: modelProductCreativeType.id,
    name: modelProductCreativeType.name,
    shortDescription: "Creator with visible product",
    explanation:
      "Model-led product videos organized by product category, then template. The selected template injects hook, screen direction, and dialogue direction into the planner.",
    subFormats: [
      category(
        "beauty_personal_care",
        "Beauty & Personal Care",
        "Beauty, skincare, makeup, and personal care UGC",
        [
          { id: "beauty_review", name: "Review" },
          { id: "beauty_before_after", name: "Before&After", videoFormat: "before_after" },
          { id: "beauty_grwm", name: "GRWM", videoFormat: "tutorial" },
          { id: "beauty_makeup_hacks", name: "Make up hacks", videoFormat: "tutorial" },
          { id: "beauty_skincare_routine", name: "skincare routine", videoFormat: "tutorial" },
          { id: "beauty_half_face", name: "half face", videoFormat: "before_after" },
          { id: "beauty_comparison", name: "comparison", videoFormat: "before_after" }
        ],
        {
          assetNotes: ["Product image", "Creator image optional", "Reference video optional in Fast UGC"],
          bestFor: ["Skincare", "makeup", "hair", "beauty tools", "personal care"],
          caution: "Avoid unsupported medical, clinical, permanent, or body-result claims."
        }
      ),
      category(
        "womenswear",
        "Womenswear",
        "Fashion try-on, styling, and outfit transformation",
        [
          { id: "womenswear_grwm", name: "GRWM", videoFormat: "tutorial" },
          { id: "womenswear_fit_check", name: "Fit Check / OOTD" },
          { id: "womenswear_try_on_haul", name: "Try-on Haul", videoFormat: "unboxing" },
          { id: "womenswear_outfit_transition", name: "Outfit Transition", videoFormat: "before_after" },
          { id: "womenswear_supersize_look", name: "Supersize the Look / Styling Hacks", videoFormat: "tutorial" },
          { id: "womenswear_unboxing_try_on", name: "Unboxing + Try-on", videoFormat: "unboxing" },
          { id: "womenswear_micro_trends", name: "Micro-Trends & Fashion Aesthetic Definitions" },
          { id: "womenswear_celebrity_dupes", name: "Celebrity Style Dupes & Outfit Recreations" },
          { id: "womenswear_before_after", name: "Before -> After Outfit Transition", videoFormat: "before_after" },
          { id: "womenswear_problem_solution", name: "Problem-Solution Styling", videoFormat: "before_after" }
        ],
        {
          assetNotes: ["Product image", "Full-body creator reference helps", "Reference motion helps for transitions"],
          bestFor: ["Tops", "dresses", "sets", "outerwear", "fashion brands"],
          caution: "Keep garment shape and product details grounded in the uploaded asset."
        }
      ),
      category(
        "wellness",
        "Health & Wellness",
        "Routine, explainer, and wellness journey formats",
        [
          { id: "wellness_expert_tip", name: "Educational Explainer / Expert Tip", videoFormat: "tutorial" },
          { id: "wellness_day_in_life", name: "Real Wellness Routine / Day in the Life", videoFormat: "tutorial" },
          { id: "wellness_myth_busting", name: "Myth-Busting / Did You Know?" },
          { id: "wellness_journey", name: "Authentic Wellness Journey / Before & After", videoFormat: "before_after" },
          { id: "wellness_product_demo", name: "Product Demo / Multi-Angle Routine Test", videoFormat: "tutorial" },
          { id: "wellness_problem_routine", name: "Problem-solving routine", videoFormat: "tutorial" },
          { id: "wellness_supplement_demo", name: "Drink / supplement demo", videoFormat: "tutorial" },
          { id: "wellness_morning_night", name: "Morning / night wellness routine", videoFormat: "tutorial" },
          { id: "wellness_7day_review", name: "Honest review / 7-day test", videoFormat: "before_after" }
        ],
        {
          assetNotes: ["Product image", "Routine context", "Reference video for use action"],
          bestFor: ["Supplements", "wellness drinks", "fitness accessories", "self-care products"],
          caution: "Avoid diagnosis, treatment, guaranteed health outcomes, or medical claims."
        }
      ),
      category(
        "consumer_electronics",
        "Consumer Electronics",
        "Gadget reveal, feature demo, and problem-solution ads",
        [
          { id: "electronics_unboxing", name: "Unboxing", videoFormat: "unboxing" },
          { id: "electronics_music_showcase", name: "Popular Music Product Showcase" },
          { id: "electronics_problem_solution", name: "Problem/Solution", videoFormat: "before_after" },
          { id: "electronics_feature_breakdown", name: "Product Details / Feature Breakdown", videoFormat: "tutorial" },
          { id: "electronics_custom_function", name: "Surprise / Customizable Function", videoFormat: "tutorial" }
        ],
        {
          assetNotes: ["Product image", "Feature notes recommended", "Screen or device asset if relevant"],
          bestFor: ["Gadgets", "phone accessories", "speakers", "home tech", "smart devices"],
          caution: "Do not invent precise UI, specs, or features that were not supplied."
        }
      ),
      category(
        "sports_outdoors",
        "Sports & Outdoors",
        "Workout, outdoor, and real-use proof templates",
        [
          { id: "sports_step_demo", name: "Step-by-Step Product Demo", videoFormat: "tutorial" },
          { id: "sports_feature_breakdown", name: "Multi-Angle Feature Breakdown", videoFormat: "tutorial" },
          { id: "sports_problem_solution", name: "Problem -> Solution Demo", videoFormat: "before_after" },
          { id: "sports_workout_routine", name: "Workout Routine / Use-in-Action", videoFormat: "tutorial" },
          { id: "sports_outdoor_test", name: "Outdoor Adventure / Real Environment Test" }
        ],
        {
          assetNotes: ["Product image", "Use environment", "Reference action helps"],
          bestFor: ["Fitness gear", "outdoor accessories", "bags", "bottles", "exercise tools"],
          caution: "Keep movement realistic and avoid unsafe or exaggerated performance claims."
        }
      ),
      category(
        "kids_maternity",
        "Kids & Maternity",
        "Parent-led product solution and safety-comfort formats",
        [
          { id: "kids_parent_solution", name: "Parent Problem -> Product Solution", videoFormat: "before_after" },
          { id: "kids_safety_comfort", name: "Safety & Comfort Feature Demo", videoFormat: "tutorial" },
          { id: "kids_learning_play", name: "Learning / Sensory Play Demo", videoFormat: "tutorial" },
          { id: "kids_mom_routine", name: "Mom Routine / Day in the Life", videoFormat: "tutorial" },
          { id: "kids_unboxing_review", name: "Unboxing + Real Parent Review", videoFormat: "unboxing" }
        ],
        {
          assetNotes: ["Product image", "Parent/guardian scene", "Feature notes are important"],
          bestFor: ["Baby products", "maternity goods", "toys", "learning products", "family lifestyle"],
          caution: "Avoid showing risky child handling or making unsupported safety guarantees."
        }
      ),
      category(
        "home_living",
        "Home & Living",
        "Home solution, demo, makeover, and reset routines",
        [
          { id: "home_problem_solution", name: "Problem -> Home Solution", videoFormat: "before_after" },
          { id: "home_step_demo", name: "Step-by-Step Product Demo", videoFormat: "tutorial" },
          { id: "home_feature_breakdown", name: "Multi-Angle Feature Breakdown", videoFormat: "tutorial" },
          { id: "home_room_makeover", name: "Room Makeover / Before & After", videoFormat: "before_after" },
          { id: "home_sunday_reset", name: "Sunday Reset / Cleaning & Organizing Routine", videoFormat: "tutorial" }
        ],
        {
          assetNotes: ["Product image", "Room or surface context", "Before/result evidence helps"],
          bestFor: ["Kitchen", "cleaning", "decor", "organization", "home tools"],
          caution: "Do not fake unrealistic room transformations without reference evidence."
        }
      ),
      category(
        "food_beverage",
        "Food & Beverage",
        "Taste, texture, haul, and social snack moments",
        [
          { id: "food_taste_test", name: "Taste Test / First Bite Reaction" },
          { id: "food_asmr_texture", name: "ASMR / Texture Close-up", videoFormat: "tutorial" },
          { id: "food_snack_haul", name: "Snack Haul / Drink Haul", videoFormat: "unboxing" },
          { id: "food_viral_hack", name: "Weird Combo / Viral Food Hack", videoFormat: "tutorial" },
          { id: "food_social_snack", name: "Social Snack Moment" }
        ],
        {
          assetNotes: ["Product image", "Serving context", "Texture/use notes help"],
          bestFor: ["Snacks", "drinks", "packaged food", "functional beverages", "desserts"],
          caution: "Avoid nutrition, weight-loss, or health claims unless explicitly supported."
        }
      ),
      category(
        "accessories",
        "Accessories",
        "Styling, detail, upgrade, and gifting scenarios",
        [
          { id: "accessories_ootd", name: "OOTD / Styling Guide", videoFormat: "tutorial" },
          { id: "accessories_unboxing", name: "Unboxing + First Impression", videoFormat: "unboxing" },
          { id: "accessories_detail_breakdown", name: "Multi-Angle Detail / Feature Breakdown", videoFormat: "tutorial" },
          { id: "accessories_before_after", name: "Before & After Accessory Upgrade", videoFormat: "before_after" },
          { id: "accessories_gift", name: "Gift Scenario / Perfect Gift" }
        ],
        {
          assetNotes: ["Product image", "Creator styling context", "Macro detail reference helps"],
          bestFor: ["Bags", "jewelry", "phone cases", "hats", "small fashion goods"],
          caution: "Preserve scale and material; do not make the accessory look like a different product."
        }
      ),
      category(
        "app_promotion",
        "App Promotion / App Install",
        "App demo and screen-led creator formats",
        [
          { id: "app_problem_solution", name: "Problem -> App Solution", videoFormat: "app_ugc" },
          { id: "app_screen_walkthrough", name: "App Demo / Screen Recording Walkthrough", videoFormat: "app_split_demo" },
          { id: "app_result_reveal", name: "Before -> After Result Reveal", videoFormat: "before_after" },
          { id: "app_creator_review", name: "Creator POV / I Found This App Review", videoFormat: "app_ugc" },
          { id: "app_trend_use_case", name: "Trend / Meme App Use Case", videoFormat: "app_ugc" },
          { id: "app_split_reaction", name: "Split-Screen App Reaction Demo", videoFormat: "app_split_demo" }
        ],
        {
          assetNotes: ["Real app screen asset", "Creator image optional", "Reference motion for taps or reactions"],
          bestFor: ["Mobile apps", "SaaS", "AI tools", "marketplaces", "consumer apps"],
          caution: "For production-quality UI text, route to template or screen rendering instead of inventing screens."
        }
      )
    ]
  }
];

export function getVideoFormat(id: string): VideoFormat {
  return videoFormats.find((format) => format.id === id) ?? videoFormats[0];
}

export function getVideoSubFormat(id: string | undefined): VideoTemplate | undefined {
  if (!id) return undefined;

  return videoFormatGroups
    .flatMap((group) => group.subFormats)
    .flatMap((format) => format.templates)
    .find((template) => template.id === id);
}

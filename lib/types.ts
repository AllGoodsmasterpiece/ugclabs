import type { VideoFormatId } from "./video-formats";

export type AssetKind = "product" | "avatar" | "reference_video";

export type ProductUnderstanding = {
  productType: string;
  productCategory: string;
  starterComposition: StarterComposition;
  physicalUseModel: ProductPhysicalUseModel;
  primaryUseCase: string;
  naturalUseEnvironments: string[];
  typicalUserActions: string[];
  functionalBenefitsToDemonstrate: string[];
  visualProofDetails: string[];
  copyAngles: string[];
  allowedActionVerbs: string[];
  forbiddenActionVerbs: string[];
  proofWords: string[];
  firstSecondVisualPriority: string;
  uncertaintyNotes: string[];
};

export type ProductPhysicalUseModel = {
  physicalForm: string;
  interactionModel: string;
  activationOrAccessPoint: string;
  outputOrEffectSource: string;
  validInteractionPoints: string[];
  invalidInteractionPoints: string[];
  requiredPreconditions: string[];
  naturalUseSequence: string[];
  failureModesToAvoid: string[];
  plannerDirective: string;
};

export type StarterComposition = {
  productScale: string;
  naturalPlacement: string;
  creatorPosition: string;
  primaryInteraction: string;
  cameraFraming: string;
  badPoses: string[];
  starterFrameBrief: string;
};

export type ProductVisualLock = {
  silhouette: string;
  cameraCutoutOrKeyShape: string;
  textAndLogoPlacement: string[];
  graphicElementPlacement: string[];
  colorMaterialRules: string[];
  frontViewReferenceQuality: string;
  preservationPrompt: string;
  backgroundRemovalNotes: string[];
};

export type AssetProfile = {
  id: string;
  kind: AssetKind;
  token: string;
  label: string;
  promptNounPhrase: string;
  description: string;
  keyDetails: string[];
  visibleText?: string[];
  colors?: string[];
  dimensions?: {
    width: number;
    height: number;
  };
  sizeBytes: number;
  mimeType: string;
  qualityWarnings: string[];
  analysisProvider: "openai" | "fallback";
  productUnderstanding?: ProductUnderstanding;
  productVisualLock?: ProductVisualLock;
};

export type ProductFocusInput = {
  generationMode: "fast_ugc" | "reference_match" | "winning_ad_remix";
  videoFormat: VideoFormatId;
  productName: string;
  productUrl: string;
  productImageProvided: boolean;
  modelMode: "auto_generated" | "shared_model" | "per_account_models";
  creatorMode: "auto" | "model_reference" | "new_creator" | "hand_only";
  creatorReferenceProvided: boolean;
  referenceProductMode: "same_product" | "replace_product";
  audioMode: "native_audio";
  tone: string;
  duration: 5 | 10 | 15;
  count: number;
  productAssetProfile?: AssetProfile;
  creatorAssetProfile?: AssetProfile;
  referenceVideoAssetProfile?: AssetProfile;
};

export type ReferenceAnalysis = {
  format: VideoFormatId;
  productCategory?: string;
  visualStyle?: string;
  sceneSummary?: string[];
  structureSummary?: string;
  shotPlan?: ReferenceShot[];
  motionChoreography?: MotionBeat[];
  earliestClearProductMoment?: string;
  bestProductProofShot?: string;
  productExposureMoments?: string[];
  hookPatterns?: string[];
  pacingNotes?: string;
  avoid?: string[];
};

export type MotionBeat = {
  start: string;
  end: string;
  cameraDistance: string;
  handAction: string;
  faceAction: string;
  productVisibilityRule: string;
  mustKeepVisible: string[];
  dialogueBeat: string;
};

export type ReferenceShot = {
  start: string;
  end: string;
  cameraFraming: string;
  productPosition: string;
  productScale: string;
  handOrCreatorAction: string;
  cameraMotion: string;
  dialogueOrExpression: string;
  preserveForGeneration: string;
};

export type CreativePlan = {
  index: number;
  hook: string;
  voiceoverScript: string;
  generationPrompt: string;
  caption: string;
};

export type ResolvedIntent = {
  productMode: {
    id: ProductFocusInput["referenceProductMode"];
    label: string;
    instruction: string;
  };
  videoFormat: {
    id: VideoFormatId;
    name: string;
    intent: string;
    creatorPolicy: string;
    productPolicy: string;
    shotRules: string[];
    avoid: string[];
  };
  productUse: {
    productType: string;
    primaryUseCase: string;
    naturalUseEnvironments: string[];
    typicalUserActions: string[];
    visualProofDetails: string[];
    copyAngles: string[];
    allowedActionVerbs: string[];
    forbiddenActionVerbs: string[];
    proofWords: string[];
    firstSecondPriority: string;
    preservationPriorities: string[];
    avoid: string[];
  };
};

export type AssetBindingDebug = {
  internalTokens: {
    product: string;
    avatar?: string;
    video: string;
  };
  generationTags: {
    product: string;
    avatar?: string;
    video: string;
  };
  elementOrder: string[];
  referenceVideoHandling: string;
};

export type GeneratedVideo = {
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

export type PipelineResult = {
  jobId: string;
  analysis: ReferenceAnalysis;
  intent?: ResolvedIntent;
  assetBinding?: AssetBindingDebug;
  assetProfiles?: {
    product?: AssetProfile;
    creator?: AssetProfile;
    referenceVideo?: AssetProfile;
  };
  videos: GeneratedVideo[];
  warnings: string[];
};

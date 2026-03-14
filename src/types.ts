export type BrandStage = 
  | 'market-analysis' 
  | 'brand-story' 
  | 'formula-design'
  | 'visual-identity' 
  | 'packaging-design' 
  | 'marketing-video';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ProjectSnapshot {
  timestamp: number;
  name: string;
  targetAudience: string;
  salesChannels: string;
  salesRegions: string;
  painPoints: string;
  coreValues: string;
  marketAnalysis?: ChatMessage[];
  brandStory?: ChatMessage[];
  formulaDesign?: ChatMessage[];
  visualIdentity?: ChatMessage[];
  visualIdentityImage?: string;
  packagingDesign?: ChatMessage[];
  packagingImage?: string;
  productionSpecs?: string;
  productionDielineImage?: string;
  marketingVideoUrl?: string;
}

export interface BrandProject {
  name: string;
  targetAudience: string;
  salesChannels: string;
  salesRegions: string;
  painPoints: string;
  coreValues: string;

  // History tracking - array of full project snapshots
  history: ProjectSnapshot[];

  marketAnalysis?: ChatMessage[];
  brandStory?: ChatMessage[];
  formulaDesign?: ChatMessage[];
  visualIdentity?: ChatMessage[];
  visualIdentityImage?: string;
  packagingDesign?: ChatMessage[];
  packagingImage?: string;
  packagingReferenceImage?: string;
  productionSpecs?: string;
  productionDielineImage?: string;
  marketingVideoUrl?: string;
  marketingVideoReferenceImage?: string;
}

declare global {
  interface Window {
    __jubeauty_api_keys__?: {
      doubaoApiKey: string;
      geminiApiKey: string;
      openaiApiKey: string;
    };
  }
}

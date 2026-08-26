export interface AiImageGenerationRequest {
  prompt: string;
  negativePrompt?: string;
  references?: string[];
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3';
  width?: number;
  height?: number;
  seed?: number;
  steps?: number;
  cfgScale?: number;
  style?: string;
  metadata?: Record<string, any>;
}

export interface AiImageEditRequest {
  inputImageUrl: string;
  prompt: string;
  negativePrompt?: string;
  strength?: number;
  maskImageUrl?: string;
  metadata?: Record<string, any>;
}

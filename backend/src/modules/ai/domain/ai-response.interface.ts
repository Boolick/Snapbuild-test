export interface AiImageResponse {
  imageUrl: string;
  promptUsed: string;
  negativePromptUsed?: string;
  referencesUsed?: string[];
  provider: string;
  model: string;
  generationDurationMs: number;
  width: number;
  height: number;
  seed?: number;
  metadata?: Record<string, any>;
}

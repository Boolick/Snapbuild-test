export interface PresetParameters {
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3';
  style?: string;
  steps?: number;
  cfgScale?: number;
  seed?: number;
  [key: string]: unknown;
}

export class Preset {
  id: string;
  name: string;
  description: string;
  mainPrompt: string;
  negativePrompt: string;
  references: string[];
  thumbnailUrl?: string;
  defaultParams?: PresetParameters;
  createdAt: string;
  updatedAt: string;

  constructor(partial: Partial<Preset>) {
    Object.assign(this, partial);
    this.createdAt = this.createdAt || new Date().toISOString();
    this.updatedAt = this.updatedAt || new Date().toISOString();
    this.references = this.references || [];
    this.defaultParams = this.defaultParams || { aspectRatio: '1:1' };
  }
}

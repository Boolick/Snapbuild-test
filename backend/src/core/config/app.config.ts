import { registerAs } from '@nestjs/config';

export interface AppConfig {
  nodeEnv: string;
  port: number;
  corsOrigins: string[];
  aiProvider: 'mock' | 'gemini' | 'google' | 'openai' | 'stability' | 'replicate' | 'auto';
  geminiApiKey?: string;
  openaiApiKey?: string;
  stabilityApiKey?: string;
  replicateApiToken?: string;
  mockAiDelayMs: number;
}

const sanitizeKey = (key?: string): string | undefined => {
  if (!key) {
    return undefined;
  }
  const trimmed = key.trim().replace(/^["']|["']$/g, '');
  return trimmed.length > 0 ? trimmed : undefined;
};

export const appConfig = registerAs('app', (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim()),
  aiProvider: (process.env.AI_PROVIDER as AppConfig['aiProvider']) || 'auto',
  geminiApiKey: sanitizeKey(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY),
  openaiApiKey: sanitizeKey(process.env.OPENAI_API_KEY),
  stabilityApiKey: sanitizeKey(process.env.STABILITY_API_KEY),
  replicateApiToken: sanitizeKey(process.env.REPLICATE_API_TOKEN),
  mockAiDelayMs: parseInt(process.env.MOCK_AI_DELAY_MS || '1500', 10),
}));

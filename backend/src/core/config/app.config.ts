import { registerAs } from '@nestjs/config';

export interface AppConfig {
  nodeEnv: string;
  port: number;
  corsOrigins: string[];
  aiProvider: 'mock' | 'openai' | 'stability' | 'replicate';
  openaiApiKey?: string;
  stabilityApiKey?: string;
  replicateApiToken?: string;
  mockAiDelayMs: number;
}

export const appConfig = registerAs(
  'app',
  (): AppConfig => ({
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '4000', 10),
    corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000')
      .split(',')
      .map((origin) => origin.trim()),
    aiProvider: (process.env.AI_PROVIDER as any) || 'mock',
    openaiApiKey: process.env.OPENAI_API_KEY,
    stabilityApiKey: process.env.STABILITY_API_KEY,
    replicateApiToken: process.env.REPLICATE_API_TOKEN,
    mockAiDelayMs: parseInt(process.env.MOCK_AI_DELAY_MS || '1500', 10),
  }),
);

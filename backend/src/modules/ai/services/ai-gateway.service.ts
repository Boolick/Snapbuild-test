import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImageGenerationProvider } from '../ports/ai-provider.interface';
import { MockAiAdapter } from '../adapters/mock-ai.adapter';
import { GoogleGeminiAdapter } from '../adapters/google-gemini.adapter';
import { OpenAiDalleAdapter } from '../adapters/openai-dalle.adapter';
import { StabilityAiAdapter } from '../adapters/stability-ai.adapter';
import { ReplicateAdapter } from '../adapters/replicate.adapter';
import { AiImageGenerationRequest, AiImageEditRequest } from '../domain/ai-request.interface';
import { AiImageResponse } from '../domain/ai-response.interface';

@Injectable()
export class AiGatewayService {
  private readonly logger = new Logger(AiGatewayService.name);
  private activeProvider: ImageGenerationProvider;

  constructor(
    private readonly configService: ConfigService,
    private readonly mockAiAdapter: MockAiAdapter,
  ) {
    this.initProvider();
  }

  private initProvider(): void {
    const providerType = (this.configService.get<string>('app.aiProvider') || 'auto').toLowerCase();
    const geminiKey = this.configService.get<string>('app.geminiApiKey');
    const openaiKey = this.configService.get<string>('app.openaiApiKey');
    const stabilityKey = this.configService.get<string>('app.stabilityApiKey');
    const replicateToken = this.configService.get<string>('app.replicateApiToken');

    this.logger.log(`Initializing AI Gateway (configured: "${providerType}")...`);

    switch (providerType) {
      case 'gemini':
      case 'google':
        if (geminiKey) {
          this.activeProvider = new GoogleGeminiAdapter(geminiKey);
        } else {
          this.logger.warn('GEMINI_API_KEY not found. Falling back to MockAiAdapter.');
          this.activeProvider = this.mockAiAdapter;
        }
        break;

      case 'openai':
        if (openaiKey) {
          this.activeProvider = new OpenAiDalleAdapter(openaiKey);
        } else {
          this.logger.warn('OPENAI_API_KEY not found. Falling back to MockAiAdapter.');
          this.activeProvider = this.mockAiAdapter;
        }
        break;

      case 'stability':
        if (stabilityKey) {
          this.activeProvider = new StabilityAiAdapter(stabilityKey);
        } else {
          this.logger.warn('STABILITY_API_KEY not found. Falling back to MockAiAdapter.');
          this.activeProvider = this.mockAiAdapter;
        }
        break;

      case 'replicate':
        if (replicateToken) {
          this.activeProvider = new ReplicateAdapter(replicateToken);
        } else {
          this.logger.warn('REPLICATE_API_TOKEN not found. Falling back to MockAiAdapter.');
          this.activeProvider = this.mockAiAdapter;
        }
        break;

      case 'mock':
        this.activeProvider = this.mockAiAdapter;
        break;

      case 'auto':
      default:
        // Smart Auto-Detection: Automatically use whichever API key is configured
        if (geminiKey) {
          this.logger.log('Auto-detected GEMINI_API_KEY: using Google Gemini AI Engine.');
          this.activeProvider = new GoogleGeminiAdapter(geminiKey);
        } else if (openaiKey) {
          this.logger.log('Auto-detected OPENAI_API_KEY: using OpenAI DALL-E 3.');
          this.activeProvider = new OpenAiDalleAdapter(openaiKey);
        } else if (stabilityKey) {
          this.logger.log('Auto-detected STABILITY_API_KEY: using Stability AI.');
          this.activeProvider = new StabilityAiAdapter(stabilityKey);
        } else if (replicateToken) {
          this.logger.log('Auto-detected REPLICATE_API_TOKEN: using Replicate.');
          this.activeProvider = new ReplicateAdapter(replicateToken);
        } else {
          this.logger.log('No external AI API keys detected. Using offline MockAiAdapter.');
          this.activeProvider = this.mockAiAdapter;
        }
        break;
    }

    this.logger.log(`Active AI Provider is set to: [${this.activeProvider.providerName}]`);
  }

  getActiveProviderName(): string {
    return this.activeProvider.providerName;
  }

  async generateImage(request: AiImageGenerationRequest): Promise<AiImageResponse> {
    try {
      return await this.activeProvider.generateImage(request);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Primary provider [${this.activeProvider.providerName}] failed: ${errMsg}`);

      // Fallback to Mock provider if primary provider failed due to missing API key or network/rate limit
      if (this.activeProvider !== this.mockAiAdapter) {
        this.logger.warn('Falling back to MockAiAdapter to guarantee pipeline continuation...');
        return await this.mockAiAdapter.generateImage(request);
      }

      throw error;
    }
  }

  async editImage(request: AiImageEditRequest): Promise<AiImageResponse> {
    try {
      return await this.activeProvider.editImage(request);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Edit image failed on [${this.activeProvider.providerName}]: ${errMsg}`);
      if (this.activeProvider !== this.mockAiAdapter) {
        return await this.mockAiAdapter.editImage(request);
      }
      throw error;
    }
  }
}

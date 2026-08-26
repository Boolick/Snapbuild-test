import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImageGenerationProvider } from '../ports/ai-provider.interface';
import { MockAiAdapter } from '../adapters/mock-ai.adapter';
import { OpenAiDalleAdapter } from '../adapters/openai-dalle.adapter';
import { StabilityAiAdapter } from '../adapters/stability-ai.adapter';
import { ReplicateAdapter } from '../adapters/replicate.adapter';
import {
  AiImageGenerationRequest,
  AiImageEditRequest,
} from '../domain/ai-request.interface';
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
    const providerType =
      this.configService.get<string>('app.aiProvider') || 'mock';
    const openaiKey = this.configService.get<string>('app.openaiApiKey');
    const stabilityKey = this.configService.get<string>('app.stabilityApiKey');
    const replicateToken = this.configService.get<string>(
      'app.replicateApiToken',
    );

    this.logger.log(`Initializing AI Gateway with target: "${providerType}"`);

    switch (providerType.toLowerCase()) {
      case 'openai':
        if (openaiKey) {
          this.activeProvider = new OpenAiDalleAdapter(openaiKey);
        } else {
          this.logger.warn(
            'OPENAI_API_KEY not found. Falling back to MockAiAdapter.',
          );
          this.activeProvider = this.mockAiAdapter;
        }
        break;

      case 'stability':
        if (stabilityKey) {
          this.activeProvider = new StabilityAiAdapter(stabilityKey);
        } else {
          this.logger.warn(
            'STABILITY_API_KEY not found. Falling back to MockAiAdapter.',
          );
          this.activeProvider = this.mockAiAdapter;
        }
        break;

      case 'replicate':
        if (replicateToken) {
          this.activeProvider = new ReplicateAdapter(replicateToken);
        } else {
          this.logger.warn(
            'REPLICATE_API_TOKEN not found. Falling back to MockAiAdapter.',
          );
          this.activeProvider = this.mockAiAdapter;
        }
        break;

      case 'mock':
      default:
        this.activeProvider = this.mockAiAdapter;
        break;
    }

    this.logger.log(
      `Active AI Provider is set to: [${this.activeProvider.providerName}]`,
    );
  }

  getActiveProviderName(): string {
    return this.activeProvider.providerName;
  }

  async generateImage(
    request: AiImageGenerationRequest,
  ): Promise<AiImageResponse> {
    try {
      return await this.activeProvider.generateImage(request);
    } catch (error: any) {
      this.logger.error(
        `Primary provider [${this.activeProvider.providerName}] failed: ${error.message}`,
      );

      // Fallback to Mock provider if primary provider failed due to missing API key or network/rate limit
      if (this.activeProvider !== this.mockAiAdapter) {
        this.logger.warn(
          'Falling back to MockAiAdapter to guarantee pipeline continuation...',
        );
        return await this.mockAiAdapter.generateImage(request);
      }

      throw error;
    }
  }

  async editImage(request: AiImageEditRequest): Promise<AiImageResponse> {
    try {
      return await this.activeProvider.editImage(request);
    } catch (error: any) {
      this.logger.error(
        `Edit image failed on [${this.activeProvider.providerName}]: ${error.message}`,
      );
      if (this.activeProvider !== this.mockAiAdapter) {
        return await this.mockAiAdapter.editImage(request);
      }
      throw error;
    }
  }
}

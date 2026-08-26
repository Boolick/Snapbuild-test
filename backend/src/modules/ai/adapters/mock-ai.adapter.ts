import { Injectable, Logger } from '@nestjs/common';
import { ImageGenerationProvider } from '../ports/ai-provider.interface';
import {
  AiImageGenerationRequest,
  AiImageEditRequest,
} from '../domain/ai-request.interface';
import { AiImageResponse } from '../domain/ai-response.interface';

@Injectable()
export class MockAiAdapter implements ImageGenerationProvider {
  readonly providerName = 'mock-ai-engine';
  private readonly logger = new Logger(MockAiAdapter.name);

  private readonly curatedGallery: { keywords: string[]; url: string }[] = [
    {
      keywords: ['3d', 'render', 'clay', 'isometric', 'premium'],
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1024&q=80',
    },
    {
      keywords: ['cyberpunk', 'neon', 'city', 'night', 'futuristic'],
      url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1024&q=80',
    },
    {
      keywords: ['anime', 'fantasy', 'ghibli', 'landscape', 'cloud'],
      url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1024&q=80',
    },
    {
      keywords: ['portrait', 'photo', 'studio', 'face', 'human', 'person'],
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1024&q=80',
    },
    {
      keywords: ['minimal', 'vector', 'flat', 'illustration', 'geometric'],
      url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=1024&q=80',
    },
    {
      keywords: ['cat', 'animal', 'kitten', 'pet'],
      url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1024&q=80',
    },
    {
      keywords: ['robot', 'cyborg', 'mech', 'technology', 'ai'],
      url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1024&q=80',
    },
  ];

  async generateImage(
    request: AiImageGenerationRequest,
  ): Promise<AiImageResponse> {
    const startTime = Date.now();
    const delay = request.metadata?.delayMs || 1500;

    this.logger.log(
      `[Mock AI] Starting generation for prompt: "${request.prompt}" (Simulated delay: ${delay}ms)`,
    );

    // Intentional failure trigger for testing error handling & retry
    if (request.prompt.toLowerCase().includes('#fail')) {
      await this.sleep(800);
      throw new Error(
        'Simulated AI Provider Failure: API rate limit exceeded or content violation (#fail trigger).',
      );
    }

    await this.sleep(delay);

    const imageUrl = this.resolveImageUrl(request.prompt, request.aspectRatio);
    const duration = Date.now() - startTime;

    return {
      imageUrl,
      promptUsed: request.prompt,
      negativePromptUsed: request.negativePrompt,
      referencesUsed: request.references,
      provider: this.providerName,
      model: 'mock-diffusion-v2.5',
      generationDurationMs: duration,
      width: request.aspectRatio === '16:9' ? 1024 : 768,
      height:
        request.aspectRatio === '16:9'
          ? 576
          : request.aspectRatio === '9:16'
            ? 1024
            : 768,
      seed: request.seed || Math.floor(Math.random() * 1000000),
      metadata: {
        presetId: request.metadata?.presetId,
        presetName: request.metadata?.presetName,
        style: request.style,
      },
    };
  }

  async editImage(request: AiImageEditRequest): Promise<AiImageResponse> {
    const startTime = Date.now();
    const delay = request.metadata?.delayMs || 1800;

    this.logger.log(
      `[Mock AI] Starting image edit for prompt: "${request.prompt}" on source: ${request.inputImageUrl}`,
    );

    if (request.prompt.toLowerCase().includes('#fail')) {
      await this.sleep(800);
      throw new Error(
        'Simulated AI Image Edit Failure: Inpainting model crashed.',
      );
    }

    await this.sleep(delay);

    // Provide a modified variant or styled result
    const imageUrl = this.resolveImageUrl(
      `edited ${request.prompt}`,
      '1:1',
    );
    const duration = Date.now() - startTime;

    return {
      imageUrl,
      promptUsed: request.prompt,
      negativePromptUsed: request.negativePrompt,
      provider: this.providerName,
      model: 'mock-inpaint-v1.0',
      generationDurationMs: duration,
      width: 768,
      height: 768,
      metadata: {
        sourceImageUrl: request.inputImageUrl,
        strength: request.strength || 0.75,
      },
    };
  }

  private resolveImageUrl(prompt: string, aspectRatio?: string): string {
    const lower = prompt.toLowerCase();

    for (const item of this.curatedGallery) {
      if (item.keywords.some((kw) => lower.includes(kw))) {
        return item.url;
      }
    }

    // Default aesthetic fallback
    return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1024&q=80';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

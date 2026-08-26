import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ImageGenerationProvider } from '../ports/ai-provider.interface';
import {
  AiImageGenerationRequest,
  AiImageEditRequest,
} from '../domain/ai-request.interface';
import { AiImageResponse } from '../domain/ai-response.interface';

@Injectable()
export class ReplicateAdapter implements ImageGenerationProvider {
  readonly providerName = 'replicate-flux';
  private readonly logger = new Logger(ReplicateAdapter.name);

  constructor(private readonly apiToken?: string) {}

  async generateImage(
    request: AiImageGenerationRequest,
  ): Promise<AiImageResponse> {
    if (!this.apiToken) {
      throw new Error('Replicate API Token is missing');
    }

    const startTime = Date.now();
    this.logger.log(`Calling Replicate API with prompt: "${request.prompt}"`);

    try {
      // Trigger prediction
      const response = await axios.post(
        'https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions',
        {
          input: {
            prompt: request.prompt,
            aspect_ratio: request.aspectRatio || '1:1',
            num_outputs: 1,
            output_format: 'webp',
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
            Prefer: 'wait',
          },
          timeout: 70000,
        },
      );

      const output = response.data.output;
      const imageUrl = Array.isArray(output) ? output[0] : output;
      const duration = Date.now() - startTime;

      return {
        imageUrl,
        promptUsed: request.prompt,
        negativePromptUsed: request.negativePrompt,
        provider: this.providerName,
        model: 'flux-schnell',
        generationDurationMs: duration,
        width: 1024,
        height: 1024,
      };
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.detail ||
        error.message ||
        'Replicate generation failed';
      throw new Error(`Replicate Error: ${errorMsg}`);
    }
  }

  async editImage(request: AiImageEditRequest): Promise<AiImageResponse> {
    return this.generateImage({
      prompt: request.prompt,
    });
  }
}

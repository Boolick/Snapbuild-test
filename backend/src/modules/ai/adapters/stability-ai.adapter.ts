import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ImageGenerationProvider } from '../ports/ai-provider.interface';
import { AiImageGenerationRequest, AiImageEditRequest } from '../domain/ai-request.interface';
import { AiImageResponse } from '../domain/ai-response.interface';

@Injectable()
export class StabilityAiAdapter implements ImageGenerationProvider {
  readonly providerName = 'stability-ai-sdxl';
  private readonly logger = new Logger(StabilityAiAdapter.name);

  constructor(private readonly apiKey?: string) {}

  async generateImage(request: AiImageGenerationRequest): Promise<AiImageResponse> {
    if (!this.apiKey) {
      throw new Error('Stability AI API Key is missing');
    }

    const startTime = Date.now();
    const prompts = [{ text: request.prompt, weight: 1 }];
    if (request.negativePrompt) {
      prompts.push({ text: request.negativePrompt, weight: -1 });
    }

    const width = request.aspectRatio === '16:9' ? 1344 : 1024;
    const height = request.aspectRatio === '16:9' ? 768 : 1024;

    try {
      const response = await axios.post(
        'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
        {
          text_prompts: prompts,
          cfg_scale: request.cfgScale || 7,
          height,
          width,
          samples: 1,
          steps: request.steps || 30,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          timeout: 60000,
        },
      );

      const base64Image = response.data.artifacts[0].base64;
      const imageUrl = `data:image/png;base64,${base64Image}`;
      const duration = Date.now() - startTime;

      return {
        imageUrl,
        promptUsed: request.prompt,
        negativePromptUsed: request.negativePrompt,
        provider: this.providerName,
        model: 'stable-diffusion-xl-1024-v1-0',
        generationDurationMs: duration,
        width,
        height,
        seed: response.data.artifacts[0].seed,
      };
    } catch (error: unknown) {
      let errorMsg = 'Stability AI error';
      if (axios.isAxiosError(error)) {
        errorMsg = error.response?.data?.message || error.message;
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      throw new Error(`Stability AI Error: ${errorMsg}`);
    }
  }

  async editImage(request: AiImageEditRequest): Promise<AiImageResponse> {
    return this.generateImage({
      prompt: `Edit image: ${request.prompt}`,
      negativePrompt: request.negativePrompt,
    });
  }
}

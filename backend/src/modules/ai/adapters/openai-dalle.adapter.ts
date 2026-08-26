import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ImageGenerationProvider } from '../ports/ai-provider.interface';
import {
  AiImageGenerationRequest,
  AiImageEditRequest,
} from '../domain/ai-request.interface';
import { AiImageResponse } from '../domain/ai-response.interface';

@Injectable()
export class OpenAiDalleAdapter implements ImageGenerationProvider {
  readonly providerName = 'openai-dalle-3';
  private readonly logger = new Logger(OpenAiDalleAdapter.name);

  constructor(private readonly apiKey?: string) {}

  async generateImage(
    request: AiImageGenerationRequest,
  ): Promise<AiImageResponse> {
    if (!this.apiKey) {
      throw new Error(
        'OpenAI API Key is missing. Please configure OPENAI_API_KEY on the backend server.',
      );
    }

    const startTime = Date.now();
    const size =
      request.aspectRatio === '16:9'
        ? '1792x1024'
        : request.aspectRatio === '9:16'
          ? '1024x1792'
          : '1024x1024';

    this.logger.log(`Calling OpenAI DALL-E 3 API with size ${size}...`);

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/images/generations',
        {
          model: 'dall-e-3',
          prompt: request.prompt,
          n: 1,
          size,
          quality: 'standard',
          response_format: 'url',
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        },
      );

      const duration = Date.now() - startTime;
      const imageUrl = response.data.data[0].url;
      const revisedPrompt = response.data.data[0].revised_prompt;

      return {
        imageUrl,
        promptUsed: request.prompt,
        negativePromptUsed: request.negativePrompt,
        referencesUsed: request.references,
        provider: this.providerName,
        model: 'dall-e-3',
        generationDurationMs: duration,
        width: size.startsWith('1792') ? 1792 : 1024,
        height: size.endsWith('1792') ? 1792 : 1024,
        metadata: {
          revisedPrompt,
          presetId: request.metadata?.presetId,
        },
      };
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.error?.message ||
        error.message ||
        'OpenAI DALL-E generation failed';
      this.logger.error(`OpenAI DALL-E Error: ${errorMsg}`);
      throw new Error(`OpenAI DALL-E Error: ${errorMsg}`);
    }
  }

  async editImage(request: AiImageEditRequest): Promise<AiImageResponse> {
    if (!this.apiKey) {
      throw new Error('OpenAI API Key is missing for image editing');
    }

    // DALL-E 2 edit or variation
    const startTime = Date.now();
    try {
      // Fallback or DALL-E edit
      const response = await axios.post(
        'https://api.openai.com/v1/images/generations',
        {
          model: 'dall-e-3',
          prompt: `Variations based on original image: ${request.prompt}`,
          n: 1,
          size: '1024x1024',
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        },
      );

      const duration = Date.now() - startTime;
      return {
        imageUrl: response.data.data[0].url,
        promptUsed: request.prompt,
        provider: this.providerName,
        model: 'dall-e-3',
        generationDurationMs: duration,
        width: 1024,
        height: 1024,
      };
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.error?.message || error.message;
      throw new Error(`OpenAI Image Edit Error: ${errorMsg}`);
    }
  }
}

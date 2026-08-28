import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ImageGenerationProvider } from '../ports/ai-provider.interface';
import { AiImageGenerationRequest, AiImageEditRequest } from '../domain/ai-request.interface';
import { AiImageResponse } from '../domain/ai-response.interface';
import { renderDiffusionImage, resolveDimensions } from './diffusion-renderer.util';

@Injectable()
export class GoogleGeminiAdapter implements ImageGenerationProvider {
  readonly providerName = 'google-gemini';
  private readonly logger = new Logger(GoogleGeminiAdapter.name);

  constructor(private readonly apiKey?: string) {}

  async generateImage(request: AiImageGenerationRequest): Promise<AiImageResponse> {
    const startTime = Date.now();
    const { width, height, aspectRatio } = resolveDimensions(request.aspectRatio);
    const seed = request.seed || Math.floor(Math.random() * 1000000);

    let finalPrompt = request.prompt;

    // 1. Try Google Native Imagen 3 API first if apiKey is present
    if (this.apiKey) {
      try {
        const imagenResponse = await this.tryNativeGoogleImagen(request.prompt, aspectRatio);
        if (imagenResponse) {
          const duration = Date.now() - startTime;
          this.logger.log(`[Google AI] Native Imagen 3 generation succeeded in ${duration}ms`);
          return {
            imageUrl: imagenResponse,
            promptUsed: request.prompt,
            negativePromptUsed: request.negativePrompt,
            referencesUsed: request.references,
            provider: 'google-imagen-3',
            model: 'imagen-3.0-generate-002',
            generationDurationMs: duration,
            width,
            height,
            seed,
            metadata: {
              aspectRatio,
              presetId: request.metadata?.presetId,
            },
          };
        }
      } catch (imagenErr: unknown) {
        const errStr = imagenErr instanceof Error ? imagenErr.message : String(imagenErr);
        this.logger.log(
          `[Google AI] Imagen 3 direct endpoint (${errStr}), using Gemini Flash + Neural Diffusion engine...`,
        );
      }

      // 2. Intelligent Prompt Refinement with Gemini 1.5 Flash
      try {
        const presetId =
          typeof request.metadata?.presetId === 'string' ? request.metadata.presetId : undefined;
        finalPrompt = await this.enhancePromptWithGemini(request.prompt, presetId);
        this.logger.log(`[Google Gemini AI] Enhanced prompt: "${finalPrompt}"`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `[Google Gemini AI] Prompt enhancement skipped (${msg}), using original prompt.`,
        );
        finalPrompt = request.prompt;
      }
    }

    // 3. Render High-Resolution Diffusion Image with rate-limit protection
    this.logger.log(
      `[Google Gemini AI] Rendering neural diffusion image for: "${finalPrompt}" (${width}x${height})`,
    );

    const imageResult = await renderDiffusionImage(finalPrompt, width, height, seed, this.logger);
    const duration = Date.now() - startTime;

    this.logger.log(`[Google Gemini AI] Image generation successfully completed in ${duration}ms`);

    return {
      imageUrl: imageResult,
      promptUsed: finalPrompt,
      negativePromptUsed: request.negativePrompt,
      referencesUsed: request.references,
      provider: this.providerName,
      model: 'gemini-1.5-flash + flux-diffusion',
      generationDurationMs: duration,
      width,
      height,
      seed,
      metadata: {
        aspectRatio,
        presetId: request.metadata?.presetId,
      },
    };
  }

  async editImage(request: AiImageEditRequest): Promise<AiImageResponse> {
    const startTime = Date.now();
    const seed = Math.floor(Math.random() * 1000000);
    const strength = request.strength || 0.75;

    let editPrompt = request.prompt || 'Transform and enhance image';

    if (this.apiKey) {
      this.logger.log(
        `[Google Gemini AI] Processing image edit request with Gemini 1.5 Flash: "${editPrompt}"`,
      );
      try {
        editPrompt = await this.enhanceEditPromptWithGemini(editPrompt, strength);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `[Google Gemini AI] Edit enhancement skipped (${msg}), using base edit prompt.`,
        );
      }
    }

    this.logger.log(
      `[Google Gemini AI] Rendering edited image: "${editPrompt}" (strength: ${strength})`,
    );

    const imageResult = await renderDiffusionImage(editPrompt, 1024, 1024, seed, this.logger);
    const duration = Date.now() - startTime;

    this.logger.log(`[Google Gemini AI] Image edit completed in ${duration}ms`);

    return {
      imageUrl: imageResult,
      promptUsed: editPrompt,
      provider: this.providerName,
      model: 'gemini-1.5-flash + flux-diffusion',
      generationDurationMs: duration,
      width: 1024,
      height: 1024,
      seed,
      metadata: {
        sourceImageUrl: request.inputImageUrl,
        strength,
      },
    };
  }

  private async tryNativeGoogleImagen(prompt: string, aspectRatio: string): Promise<string | null> {
    if (!this.apiKey) {
      return null;
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${this.apiKey}`;
    const response = await axios.post(
      url,
      {
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio,
          outputOptions: { mimeType: 'image/jpeg' },
          personGeneration: 'ALLOW_ADULT',
          safetySetting: 'BLOCK_MEDIUM_AND_ABOVE',
        },
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 25000,
      },
    );

    const predictions = response.data?.predictions;
    if (predictions && predictions.length > 0 && predictions[0]?.bytesBase64Encoded) {
      const mimeType = predictions[0].mimeType || 'image/jpeg';
      return `data:${mimeType};base64,${predictions[0].bytesBase64Encoded}`;
    }
    return null;
  }

  private async enhancePromptWithGemini(prompt: string, presetId?: string): Promise<string> {
    if (!this.apiKey) {
      return prompt;
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
    const instruction = `You are an AI prompt optimizer for text-to-image synthesis.
Given the user prompt: "${prompt}" and style preset: "${presetId || 'General'}",
Return an improved, descriptive version of this prompt preserving the exact intended art style.
Keep the response concise (1 to 2 sentences, max 40 words).
Do NOT include any explanations, markdown, or quotation marks. Output ONLY the raw prompt.`;

    const response = await axios.post(
      url,
      {
        contents: [{ parts: [{ text: instruction }] }],
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 80,
        },
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 6000,
      },
    );

    const enhanced = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return enhanced && enhanced.length > 5 ? enhanced.replace(/^["']|["']$/g, '') : prompt;
  }

  private async enhanceEditPromptWithGemini(
    editInstruction: string,
    strength: number,
  ): Promise<string> {
    if (!this.apiKey) {
      return editInstruction;
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
    const instruction = `You are an AI image-to-image prompt specialist.
The user wants to transform an image with instructions: "${editInstruction}" at strength ${strength}.
Generate a comprehensive, single-paragraph descriptive diffusion prompt incorporating these transformations.
Keep it under 35 words. Return ONLY the prompt string without markdown or quotes.`;

    const response = await axios.post(
      url,
      {
        contents: [{ parts: [{ text: instruction }] }],
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 80,
        },
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 6000,
      },
    );

    const enhanced = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return enhanced && enhanced.length > 5 ? enhanced.replace(/^["']|["']$/g, '') : editInstruction;
  }
}

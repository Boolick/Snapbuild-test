import { Preset } from '../../presets/domain/preset.entity';
import { AiImageGenerationRequest } from './ai-request.interface';

export class PromptRequestBuilder {
  /**
   * Combines user input prompt and optional Preset into a consolidated AI image generation request.
   * Logic:
   * Final Prompt = [User Prompt] + [Preset.mainPrompt] (seamlessly concatenated or blended)
   * Negative Prompt = Preset.negativePrompt + (user negative prompt if provided)
   * References = Preset.references + (additional references if provided)
   */
  static buildRequest(
    userPrompt: string,
    preset?: Preset,
    overrides?: Partial<AiImageGenerationRequest>,
  ): AiImageGenerationRequest {
    const trimmedUserPrompt = (userPrompt || '').trim();

    let combinedPrompt = trimmedUserPrompt;
    let combinedNegativePrompt = overrides?.negativePrompt || '';
    const combinedReferences: string[] = [...(overrides?.references || [])];

    if (preset) {
      if (preset.mainPrompt) {
        if (trimmedUserPrompt) {
          combinedPrompt = `${trimmedUserPrompt}, ${preset.mainPrompt}`;
        } else {
          combinedPrompt = preset.mainPrompt;
        }
      }

      if (preset.negativePrompt) {
        combinedNegativePrompt = combinedNegativePrompt
          ? `${combinedNegativePrompt}, ${preset.negativePrompt}`
          : preset.negativePrompt;
      }

      if (preset.references && preset.references.length > 0) {
        for (const ref of preset.references) {
          if (!combinedReferences.includes(ref)) {
            combinedReferences.push(ref);
          }
        }
      }
    }

    return {
      prompt: combinedPrompt,
      negativePrompt: combinedNegativePrompt || undefined,
      references: combinedReferences.length > 0 ? combinedReferences : undefined,
      aspectRatio: overrides?.aspectRatio || preset?.defaultParams?.aspectRatio || '1:1',
      cfgScale: overrides?.cfgScale || preset?.defaultParams?.cfgScale || 7.0,
      steps: overrides?.steps || preset?.defaultParams?.steps || 30,
      seed: overrides?.seed || preset?.defaultParams?.seed,
      style: overrides?.style || preset?.defaultParams?.style,
      metadata: {
        presetId: preset?.id,
        presetName: preset?.name,
        originalUserPrompt: trimmedUserPrompt,
        ...overrides?.metadata,
      },
    };
  }
}

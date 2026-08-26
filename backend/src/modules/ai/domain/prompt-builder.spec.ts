import { PromptRequestBuilder } from './prompt-builder';
import { Preset } from '../../presets/domain/preset.entity';

describe('PromptRequestBuilder', () => {
  it('should combine user prompt with preset mainPrompt, negativePrompt and references', () => {
    const preset = new Preset({
      id: 'preset-demo',
      name: 'Premium 3D',
      mainPrompt: 'octane render, 3d minimal',
      negativePrompt: 'blurry, noise',
      references: ['https://example.com/ref1.png'],
      defaultParams: { aspectRatio: '16:9' },
    });

    const request = PromptRequestBuilder.buildRequest('a cute cat', preset);

    expect(request.prompt).toBe('a cute cat, octane render, 3d minimal');
    expect(request.negativePrompt).toBe('blurry, noise');
    expect(request.references).toEqual(['https://example.com/ref1.png']);
    expect(request.aspectRatio).toBe('16:9');
    expect(request.metadata?.presetId).toBe('preset-demo');
  });

  it('should handle request without preset gracefully', () => {
    const request = PromptRequestBuilder.buildRequest('simple text query');
    expect(request.prompt).toBe('simple text query');
    expect(request.negativePrompt).toBeUndefined();
    expect(request.aspectRatio).toBe('1:1');
  });
});

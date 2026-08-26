import { Injectable, NotFoundException } from '@nestjs/common';
import { Preset } from '../domain/preset.entity';
import { CreatePresetDto } from '../dto/preset.dto';
import { generateId } from '../../../common/utils/id-generator.util';

@Injectable()
export class PresetsService {
  private readonly presets: Map<string, Preset> = new Map();

  constructor() {
    this.seedDefaultPresets();
  }

  private seedDefaultPresets(): void {
    const defaults: Preset[] = [
      new Preset({
        id: 'preset-premium-3d',
        name: 'Premium 3D',
        description:
          'Clean, studio-lit 3D render with soft ambient occlusion and vibrant materials',
        mainPrompt:
          'premium minimal 3D visual, smooth clay and glass materials, studio soft lighting, isometric view, 8k resolution, octane render masterpiece',
        negativePrompt:
          'clutter, noisy background, photorealistic human, low resolution, artifacts, blurry, bad topology',
        references: [
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600',
          'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=600',
        ],
        thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400',
        defaultParams: {
          aspectRatio: '1:1',
          style: '3d-render',
          cfgScale: 7.5,
          steps: 30,
        },
      }),
      new Preset({
        id: 'preset-cyberpunk-neon',
        name: 'Cyberpunk Neon',
        description: 'Atmospheric futuristic cyberpunk night scene with glowing neon lights',
        mainPrompt:
          'cyberpunk aesthetic, rainy night city, intense neon reflections, volumetric magenta and cyan fog, highly detailed, cinematic lighting, unreal engine 5 render',
        negativePrompt:
          'daylight, sunshine, oversaturated pastel, rustic, cartoon, blurry, low contrast',
        references: [
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600',
          'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600',
        ],
        thumbnailUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400',
        defaultParams: {
          aspectRatio: '16:9',
          style: 'cyberpunk',
          cfgScale: 8.0,
          steps: 35,
        },
      }),
      new Preset({
        id: 'preset-anime-fantasy',
        name: 'Anime Fantasy Studio',
        description: 'Makoto Shinkai / Studio Ghibli inspired vibrant fantasy digital art',
        mainPrompt:
          'anime aesthetic, lush fantasy landscape, glowing particles, vibrant clouds, detailed painted textures, cinematic composition, artstation trending',
        negativePrompt:
          'photorealistic, 3d render, dark, muddy colors, deformed hands, noisy, watermark',
        references: ['https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=400',
        defaultParams: {
          aspectRatio: '16:9',
          style: 'anime',
          cfgScale: 7.0,
          steps: 28,
        },
      }),
      new Preset({
        id: 'preset-photoreal-studio',
        name: 'Photoreal Studio Portrait',
        description:
          'High-end Hasselblad studio photography with dramatic lighting and fine texture',
        mainPrompt:
          'professional commercial studio photography, shot on 85mm lens, f/1.8, softbox lighting, ultra-sharp focus, natural skin texture, masterpiece, 8k raw photo',
        negativePrompt:
          'cgi, 3d render, cartoon, plastic skin, distorted features, overexposed, grainy, blurry',
        references: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
        defaultParams: {
          aspectRatio: '4:3',
          style: 'photorealistic',
          cfgScale: 6.5,
          steps: 40,
        },
      }),
      new Preset({
        id: 'preset-minimal-vector',
        name: 'Minimalist Vector Art',
        description: 'Clean vector illustration with bold flat colors and elegant geometric shapes',
        mainPrompt:
          'minimalist vector illustration, clean lines, flat design, modern color palette, duotone aesthetic, behance award winner, vector art',
        negativePrompt:
          'gradients, photo, 3d, realistic shadows, clutter, noisy texture, complex background',
        references: ['https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=600'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400',
        defaultParams: {
          aspectRatio: '1:1',
          style: 'vector',
          cfgScale: 7.0,
          steps: 25,
        },
      }),
    ];

    for (const preset of defaults) {
      this.presets.set(preset.id, preset);
    }
  }

  findAll(): Preset[] {
    return Array.from(this.presets.values());
  }

  findById(id: string): Preset {
    const preset = this.presets.get(id);
    if (!preset) {
      throw new NotFoundException(`Preset with ID "${id}" not found`);
    }
    return preset;
  }

  create(dto: CreatePresetDto): Preset {
    const id = generateId('preset');
    const preset = new Preset({
      id,
      name: dto.name,
      description: dto.description,
      mainPrompt: dto.mainPrompt,
      negativePrompt: dto.negativePrompt || '',
      references: dto.references || [],
      defaultParams: dto.defaultParams || { aspectRatio: '1:1' },
    });
    this.presets.set(id, preset);
    return preset;
  }
}

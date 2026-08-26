import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsObject } from 'class-validator';

export class PresetDto {
  @ApiProperty({ example: 'preset-premium-3d' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: 'Premium 3D' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'High-end studio 3D render with clean soft lighting' })
  @IsString()
  description: string;

  @ApiProperty({
    example:
      'premium minimal 3D visual, octane render, clean lighting, isometric view, 8k resolution',
  })
  @IsString()
  @IsNotEmpty()
  mainPrompt: string;

  @ApiProperty({
    example: 'clutter, noisy background, photorealistic human, low resolution, artifacts, blurry',
  })
  @IsString()
  negativePrompt: string;

  @ApiProperty({
    example: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400'],
  })
  @IsArray()
  @IsString({ each: true })
  references: string[];

  @ApiPropertyOptional({
    example: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400',
  })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ example: { aspectRatio: '1:1', style: '3d-render' } })
  @IsOptional()
  @IsObject()
  defaultParams?: Record<string, unknown>;
}

export class CreatePresetDto {
  @ApiProperty({ example: 'Cyberpunk Neon' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Futuristic glowing neon aesthetic' })
  @IsString()
  description: string;

  @ApiProperty({
    example: 'cyberpunk style, vibrant neon lights, volumetric fog, sharp focus, octane render',
  })
  @IsString()
  @IsNotEmpty()
  mainPrompt: string;

  @ApiPropertyOptional({ example: 'daylight, cartoon, low quality' })
  @IsOptional()
  @IsString()
  negativePrompt?: string;

  @ApiPropertyOptional({ example: [] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  references?: string[];

  @ApiPropertyOptional({ example: { aspectRatio: '16:9' } })
  @IsOptional()
  @IsObject()
  defaultParams?: Record<string, unknown>;
}

import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PresetsService } from '../services/presets.service';
import { Preset } from '../domain/preset.entity';
import { CreatePresetDto } from '../dto/preset.dto';

@ApiTags('Presets')
@Controller('presets')
export class PresetsController {
  constructor(private readonly presetsService: PresetsService) {}

  @Get()
  @ApiOperation({ summary: 'List all available AI generation presets' })
  @ApiResponse({
    status: 200,
    description: 'Array of presets returned successfully',
  })
  findAll(): Preset[] {
    return this.presetsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get preset by ID' })
  @ApiResponse({ status: 200, description: 'Preset details' })
  @ApiResponse({ status: 404, description: 'Preset not found' })
  findById(@Param('id') id: string): Preset {
    return this.presetsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create custom preset' })
  @ApiResponse({ status: 201, description: 'Preset created' })
  create(@Body() dto: CreatePresetDto): Preset {
    return this.presetsService.create(dto);
  }
}

import { Module } from '@nestjs/common';
import { PresetsService } from './services/presets.service';
import { PresetsController } from './controllers/presets.controller';

@Module({
  controllers: [PresetsController],
  providers: [PresetsService],
  exports: [PresetsService],
})
export class PresetsModule {}

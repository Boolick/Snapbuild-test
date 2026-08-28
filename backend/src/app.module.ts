import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as path from 'path';
import { appConfig } from './core/config/app.config';
import { HealthModule } from './modules/health/health.module';
import { PresetsModule } from './modules/presets/presets.module';
import { WorkflowsModule } from './modules/workflows/workflows.module';
import { AiModule } from './modules/ai/ai.module';
import { RunsModule } from './modules/runs/runs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: [
        path.resolve(process.cwd(), '.env.local'),
        path.resolve(process.cwd(), '.env'),
        path.resolve(process.cwd(), 'backend/.env'),
        path.resolve(__dirname, '../.env'),
        path.resolve(__dirname, '../../.env'),
        path.resolve(__dirname, '../../../backend/.env'),
        '.env.local',
        '.env',
        'backend/.env',
      ],
    }),
    HealthModule,
    PresetsModule,
    WorkflowsModule,
    AiModule,
    RunsModule,
  ],
})
export class AppModule {}

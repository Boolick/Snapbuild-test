import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
      envFilePath: ['.env.local', '.env'],
    }),
    HealthModule,
    PresetsModule,
    WorkflowsModule,
    AiModule,
    RunsModule,
  ],
})
export class AppModule {}

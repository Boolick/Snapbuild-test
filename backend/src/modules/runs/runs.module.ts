import { Module } from '@nestjs/common';
import { RunsController } from './controllers/runs.controller';
import { RunsService } from './services/runs.service';
import { GraphExecutionEngine } from './services/graph-execution.engine';
import { RunEventsService } from './services/run-events.service';
import { NodeExecutor } from './engine/node-executor';
import { WorkflowsModule } from '../workflows/workflows.module';
import { PresetsModule } from '../presets/presets.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [WorkflowsModule, PresetsModule, AiModule],
  controllers: [RunsController],
  providers: [RunsService, GraphExecutionEngine, RunEventsService, NodeExecutor],
  exports: [RunsService, GraphExecutionEngine, RunEventsService],
})
export class RunsModule {}

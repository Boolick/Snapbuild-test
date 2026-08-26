import { Module } from '@nestjs/common';
import { WorkflowsController } from './controllers/workflows.controller';
import { WorkflowsService } from './services/workflows.service';
import { GraphValidatorService } from './services/graph-validator.service';

@Module({
  controllers: [WorkflowsController],
  providers: [WorkflowsService, GraphValidatorService],
  exports: [WorkflowsService, GraphValidatorService],
})
export class WorkflowsModule {}

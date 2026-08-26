import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkflowRunStatus, JobStatus } from '../domain/run-status.enum';

export class NodeJobResponseDto {
  @ApiProperty({ example: 'prompt-1' })
  nodeId: string;

  @ApiProperty({ example: 'prompt' })
  nodeType: string;

  @ApiProperty({ enum: JobStatus, example: JobStatus.SUCCESS })
  status: JobStatus;

  @ApiPropertyOptional({ example: '2026-08-26T14:00:00.000Z' })
  startedAt?: string;

  @ApiPropertyOptional({ example: '2026-08-26T14:00:01.500Z' })
  completedAt?: string;

  @ApiPropertyOptional({ example: 1500 })
  durationMs?: number;

  @ApiPropertyOptional()
  inputs?: Record<string, unknown>;

  @ApiPropertyOptional()
  outputs?: Record<string, unknown>;

  @ApiPropertyOptional()
  error?: string;

  @ApiProperty({ example: 0 })
  retryCount: number;
}

export class RunResponseDto {
  @ApiProperty({ example: 'run_9ab12cd3ef45' })
  id: string;

  @ApiPropertyOptional({ example: 'Scenario 1 Run' })
  workflowName?: string;

  @ApiProperty({ enum: WorkflowRunStatus, example: WorkflowRunStatus.RUNNING })
  status: WorkflowRunStatus;

  @ApiProperty({ example: [['prompt-1'], ['generate-1'], ['result-1']] })
  executionWaves: string[][];

  @ApiProperty({ type: Object })
  jobs: Record<string, NodeJobResponseDto>;

  @ApiPropertyOptional({ example: 3200 })
  totalDurationMs?: number;

  @ApiPropertyOptional()
  error?: string;

  @ApiProperty({ example: '2026-08-26T14:00:00.000Z' })
  createdAt: string;

  @ApiPropertyOptional({ example: '2026-08-26T14:00:03.200Z' })
  completedAt?: string;
}

export class RetryNodeDto {
  @ApiPropertyOptional({ description: 'Optional overrides for node input data' })
  dataOverrides?: Record<string, unknown>;
}

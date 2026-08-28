import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { WorkflowNodeDto, WorkflowEdgeDto } from './create-workflow.dto';
import { WORKFLOW_LIMITS } from '../domain/workflow-limits.constants';

export class ValidateGraphDto {
  @ApiProperty({ type: [WorkflowNodeDto], maxItems: WORKFLOW_LIMITS.MAX_TOTAL_NODES })
  @IsArray()
  @ArrayMaxSize(WORKFLOW_LIMITS.MAX_TOTAL_NODES)
  @ValidateNested({ each: true })
  @Type(() => WorkflowNodeDto)
  nodes: WorkflowNodeDto[];

  @ApiProperty({ type: [WorkflowEdgeDto], maxItems: WORKFLOW_LIMITS.MAX_TOTAL_EDGES })
  @IsArray()
  @ArrayMaxSize(WORKFLOW_LIMITS.MAX_TOTAL_EDGES)
  @ValidateNested({ each: true })
  @Type(() => WorkflowEdgeDto)
  edges: WorkflowEdgeDto[];
}

export class ValidationErrorDetail {
  code:
    | 'CYCLE_DETECTED'
    | 'INCOMPATIBLE_PORTS'
    | 'UNKNOWN_NODE'
    | 'MISSING_REQUIRED_INPUT'
    | 'INVALID_PORT'
    | 'MULTIPLE_INPUTS_TO_PORT'
    | 'LIMIT_EXCEEDED';
  message: string;
  nodeId?: string;
  edgeId?: string;
}

export class ValidateGraphResponseDto {
  isValid: boolean;
  errors: ValidationErrorDetail[];
  warnings: string[];
  executionWaves?: string[][]; // Topological execution plan preview
}

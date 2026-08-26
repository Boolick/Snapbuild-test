import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { WorkflowNodeDto, WorkflowEdgeDto } from './create-workflow.dto';

export class ValidateGraphDto {
  @ApiProperty({ type: [WorkflowNodeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowNodeDto)
  nodes: WorkflowNodeDto[];

  @ApiProperty({ type: [WorkflowEdgeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowEdgeDto)
  edges: WorkflowEdgeDto[];
}

export class ValidationErrorDetail {
  code: 'CYCLE_DETECTED' | 'INCOMPATIBLE_PORTS' | 'UNKNOWN_NODE' | 'MISSING_REQUIRED_INPUT' | 'INVALID_PORT';
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

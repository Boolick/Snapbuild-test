import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, ValidateNested, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { WorkflowNodeDto, WorkflowEdgeDto } from '../../workflows/dto/create-workflow.dto';
import { WORKFLOW_LIMITS } from '../../workflows/domain/workflow-limits.constants';

export class ExecuteWorkflowDto {
  @ApiPropertyOptional({ example: 'My AI Generation Run' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'template-scenario-1' })
  @IsOptional()
  @IsString()
  workflowId?: string;

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

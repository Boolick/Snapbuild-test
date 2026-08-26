import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  WorkflowNodeDto,
  WorkflowEdgeDto,
} from '../../workflows/dto/create-workflow.dto';

export class ExecuteWorkflowDto {
  @ApiPropertyOptional({ example: 'My AI Generation Run' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'template-scenario-1' })
  @IsOptional()
  @IsString()
  workflowId?: string;

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

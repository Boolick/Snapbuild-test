import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { NodeType } from '../domain/port-type.enum';

export class NodePositionDto {
  @ApiProperty({ example: 100 })
  x: number;

  @ApiProperty({ example: 200 })
  y: number;
}

export class WorkflowNodeDto {
  @ApiProperty({ example: 'prompt_1' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ enum: NodeType, example: NodeType.PROMPT })
  @IsEnum(NodeType)
  type: NodeType;

  @ApiProperty({ type: NodePositionDto })
  @IsObject()
  position: NodePositionDto;

  @ApiProperty({ example: { prompt: 'A futuristic city' } })
  @IsObject()
  data: Record<string, unknown>;
}

export class WorkflowEdgeDto {
  @ApiProperty({ example: 'e_prompt1_gen1' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: 'prompt_1' })
  @IsString()
  @IsNotEmpty()
  source: string;

  @ApiPropertyOptional({ example: 'text-out' })
  @IsOptional()
  @IsString()
  sourceHandle?: string;

  @ApiProperty({ example: 'gen_1' })
  @IsString()
  @IsNotEmpty()
  target: string;

  @ApiPropertyOptional({ example: 'text-in' })
  @IsOptional()
  @IsString()
  targetHandle?: string;
}

export class CreateWorkflowDto {
  @ApiProperty({ example: 'Text to Image Pipeline' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Standard text-to-image workflow' })
  @IsOptional()
  @IsString()
  description?: string;

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

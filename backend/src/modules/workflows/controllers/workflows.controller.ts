import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WorkflowsService } from '../services/workflows.service';
import { GraphValidatorService } from '../services/graph-validator.service';
import { ValidateGraphDto, ValidateGraphResponseDto } from '../dto/validate-graph.dto';
import { Workflow } from '../domain/workflow.entity';

@ApiTags('Workflows')
@Controller('workflows')
export class WorkflowsController {
  constructor(
    private readonly workflowsService: WorkflowsService,
    private readonly validatorService: GraphValidatorService,
  ) {}

  @Get('templates')
  @ApiOperation({ summary: 'Get ready-to-run workflow templates (Scenarios 1, 2, 3 Branching)' })
  @ApiResponse({ status: 200, description: 'List of templates' })
  getTemplates(): Workflow[] {
    return this.workflowsService.getTemplates();
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get a specific workflow template by ID' })
  @ApiResponse({ status: 200, description: 'Workflow template' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  getTemplateById(@Param('id') id: string): Workflow {
    return this.workflowsService.getTemplateById(id);
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate workflow graph DAG integrity & port types' })
  @ApiResponse({
    status: 200,
    description: 'Graph validation result with errors or execution preview',
  })
  validateGraph(@Body() dto: ValidateGraphDto): ValidateGraphResponseDto {
    return this.validatorService.validate(dto);
  }
}

import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  Body,
  Sse,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { RunsService } from '../services/runs.service';
import { RunEventsService } from '../services/run-events.service';
import { ExecuteWorkflowDto } from '../dto/execute-workflow.dto';
import { RetryNodeDto } from '../dto/retry-node.dto';
import { WorkflowRun } from '../domain/run.entity';

@ApiTags('Runs')
@Controller('runs')
export class RunsController {
  constructor(
    private readonly runsService: RunsService,
    private readonly eventsService: RunEventsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit a workflow graph for asynchronous DAG execution',
  })
  @ApiResponse({
    status: 201,
    description: 'Workflow run successfully queued and started',
  })
  async createRun(@Body() dto: ExecuteWorkflowDto) {
    const run = await this.runsService.createAndStartRun(dto);
    return {
      runId: run.id,
      workflowName: run.workflowName,
      status: run.status,
      executionWaves: run.executionWaves,
      createdAt: run.createdAt,
      message: `Run successfully initiated. Subscribe to SSE via /api/v1/runs/${run.id}/events`,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List all workflow execution runs' })
  @ApiResponse({ status: 200, description: 'List of past execution runs' })
  listRuns(): WorkflowRun[] {
    return this.runsService.listRuns();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full snapshot of a run and its node job statuses' })
  @ApiResponse({ status: 200, description: 'Workflow run snapshot' })
  @ApiResponse({ status: 404, description: 'Run not found' })
  getRun(@Param('id') id: string): WorkflowRun {
    return this.runsService.getRunById(id);
  }

  @Sse(':id/events')
  @ApiOperation({
    summary: 'Server-Sent Events (SSE) stream for real-time node state transitions',
  })
  @ApiQuery({
    name: 'since',
    required: false,
    description: 'Optional ISO timestamp to only receive events emitted after this time',
  })
  @ApiResponse({
    status: 200,
    description: 'SSE stream (text/event-stream)',
  })
  streamRunEvents(
    @Param('id') id: string,
    @Query('since') since?: string,
  ): Observable<MessageEvent> {
    // Verify run exists
    this.runsService.getRunById(id);
    return this.eventsService.subscribeToRun(id, since);
  }

  @Post(':id/retry/:nodeId')
  @ApiOperation({
    summary: 'Retry a failed node and re-execute downstream dependent nodes',
  })
  @ApiResponse({
    status: 200,
    description: 'Node retry initiated',
  })
  async retryNode(
    @Param('id') runId: string,
    @Param('nodeId') nodeId: string,
    @Body() dto?: RetryNodeDto,
  ) {
    const run = await this.runsService.retryNode(runId, nodeId, dto);
    return {
      runId: run.id,
      retriedNodeId: nodeId,
      status: run.status,
      message: `Node ${nodeId} retry initiated`,
    };
  }
}

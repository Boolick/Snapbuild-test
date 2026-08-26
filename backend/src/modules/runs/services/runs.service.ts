import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { WorkflowRun } from '../domain/run.entity';
import { NodeJob } from '../domain/node-job.entity';
import { JobStatus, WorkflowRunStatus } from '../domain/run-status.enum';
import { ExecuteWorkflowDto } from '../dto/execute-workflow.dto';
import { RetryNodeDto } from '../dto/retry-node.dto';
import { GraphValidatorService } from '../../workflows/services/graph-validator.service';
import { GraphExecutionEngine } from './graph-execution.engine';
import { RunEventsService } from './run-events.service';
import { DagScheduler } from '../engine/dag-scheduler';
import { generateId } from '../../../common/utils/id-generator.util';
import { WorkflowNode } from '../../workflows/domain/node.entity';
import { WorkflowEdge } from '../../workflows/domain/edge.entity';

@Injectable()
export class RunsService {
  private readonly logger = new Logger(RunsService.name);
  private readonly runs: Map<string, WorkflowRun> = new Map();

  constructor(
    private readonly validatorService: GraphValidatorService,
    private readonly executionEngine: GraphExecutionEngine,
    private readonly eventsService: RunEventsService,
  ) {}

  async createAndStartRun(dto: ExecuteWorkflowDto): Promise<WorkflowRun> {
    // 1. Validate DAG and Port types
    const validation = this.validatorService.validate({
      nodes: dto.nodes,
      edges: dto.edges,
    });

    if (!validation.isValid) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Workflow graph validation failed',
        errors: validation.errors,
      });
    }

    const runId = generateId('run');
    const nodes = dto.nodes.map((n) => new WorkflowNode(n));
    const edges = dto.edges.map((e) => new WorkflowEdge(e));

    // 2. Compute execution waves for parallel scheduling
    const executionWaves = DagScheduler.buildExecutionWaves({ nodes, edges });

    // 3. Initialize NodeJobs in QUEUED state
    const jobs: Record<string, NodeJob> = {};
    for (const node of nodes) {
      const job = new NodeJob(node.id, node.type);
      job.status = JobStatus.QUEUED;
      jobs[node.id] = job;
    }

    const run = new WorkflowRun({
      id: runId,
      workflowId: dto.workflowId,
      workflowName: dto.name || 'Custom Workflow Run',
      status: WorkflowRunStatus.QUEUED,
      graph: { nodes, edges },
      executionWaves,
      jobs,
    });

    this.runs.set(runId, run);

    this.eventsService.emit({
      runId,
      type: 'run_queued',
      timestamp: run.createdAt,
      status: WorkflowRunStatus.QUEUED,
      message: `Workflow run ${runId} queued with ${executionWaves.length} wave(s)`,
    });

    // 4. Asynchronously start execution in the background
    setImmediate(() => {
      this.executionEngine.executeRun(run).catch((err) => {
        this.logger.error(`Execution error for run ${runId}: ${err.message}`, err.stack);
      });
    });

    return run;
  }

  getRunById(runId: string): WorkflowRun {
    const run = this.runs.get(runId);
    if (!run) {
      throw new NotFoundException(`Run with ID "${runId}" not found`);
    }
    return run;
  }

  listRuns(): WorkflowRun[] {
    return Array.from(this.runs.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async retryNode(runId: string, nodeId: string, dto?: RetryNodeDto): Promise<WorkflowRun> {
    const run = this.getRunById(runId);

    const targetJob = run.jobs[nodeId];
    if (!targetJob) {
      throw new NotFoundException(`Node "${nodeId}" not found in run "${runId}"`);
    }

    this.logger.log(`Retrying node "${nodeId}" in run "${runId}"...`);

    // 1. Identify all downstream nodes that depend on this node
    const downstreamIds = DagScheduler.getDownstreamNodeIds(nodeId, run.graph.edges);
    const affectedNodeIds = new Set<string>([nodeId, ...downstreamIds]);

    // 2. Reset affected jobs to QUEUED
    for (const id of affectedNodeIds) {
      const job = run.jobs[id];
      if (job) {
        job.status = JobStatus.QUEUED;
        job.startedAt = undefined;
        job.completedAt = undefined;
        job.durationMs = undefined;
        job.error = undefined;
        if (id === nodeId) {
          job.retryCount += 1;
        }
      }
    }

    // 3. Filter execution waves to only execute the affected subtree
    const retryWaves: string[][] = [];
    for (const wave of run.executionWaves) {
      const filteredWave = wave.filter((id) => affectedNodeIds.has(id));
      if (filteredWave.length > 0) {
        retryWaves.push(filteredWave);
      }
    }

    run.status = WorkflowRunStatus.RUNNING;
    run.error = undefined;

    // 4. Asynchronously start re-executing the subtree
    const nodeOverrides = dto?.dataOverrides ? { [nodeId]: dto.dataOverrides } : undefined;

    setImmediate(() => {
      this.executionEngine.executeRun(run, nodeOverrides, retryWaves).catch((err) => {
        this.logger.error(`Retry execution error for run ${runId}: ${err.message}`);
      });
    });

    return run;
  }
}

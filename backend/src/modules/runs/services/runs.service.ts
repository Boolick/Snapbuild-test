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

    const changedNodeIds = new Set<string>();

    // Sync all graph node data if provided from client
    if (dto?.allNodesData) {
      for (const [nId, nData] of Object.entries(dto.allNodesData)) {
        const node = run.graph.nodes.find((n) => n.id === nId);
        if (node) {
          const oldPrompt = typeof node.data.prompt === 'string' ? node.data.prompt : '';
          const newPrompt = typeof nData.prompt === 'string' ? nData.prompt : '';
          if (oldPrompt !== newPrompt) {
            changedNodeIds.add(nId);
          }
          node.data = { ...node.data, ...nData };
        }
        // If it's a prompt node, sync its cached text output so downstream nodes get the updated prompt
        if (node?.type === 'prompt' && typeof nData.prompt === 'string') {
          const text = nData.prompt.trim();
          if (run.jobs[nId]) {
            run.jobs[nId].outputs = { text, 'text-out': text };
          }
        }
      }
    } else if (dto?.dataOverrides) {
      const node = run.graph.nodes.find((n) => n.id === nodeId);
      if (node) {
        node.data = { ...node.data, ...dto.dataOverrides };
        changedNodeIds.add(nodeId);
      }
    }

    // 1. Resolve all affected nodes: target + uncompleted/failed upstream ancestors + all downstream descendants
    const affectedNodeIds = DagScheduler.resolveRetryNodeIds(
      nodeId,
      { nodes: run.graph.nodes, edges: run.graph.edges },
      run.jobs,
      changedNodeIds,
    );

    this.logger.log(
      `[Run ${runId}] Retry for "${nodeId}" scheduled execution for ${affectedNodeIds.size} node(s): [${Array.from(affectedNodeIds).join(', ')}]`,
    );

    // Clear stale terminal failures and event history for retrying nodes
    this.eventsService.resetHistoryForRetry(runId, affectedNodeIds);

    // 2. Reset affected jobs to QUEUED and emit node_queued events
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

        this.eventsService.emit({
          runId: run.id,
          type: 'node_queued',
          timestamp: new Date().toISOString(),
          nodeId: id,
          nodeType: job.nodeType,
          status: JobStatus.QUEUED,
        });
      }
    }

    // 3. Filter execution waves to only execute the affected subtree in topological order
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
    let nodeOverrides: Record<string, Record<string, unknown>> | undefined;
    if (dto?.allNodesData) {
      nodeOverrides = dto.allNodesData;
    } else if (dto?.dataOverrides) {
      nodeOverrides = { [nodeId]: dto.dataOverrides };
    }

    setImmediate(() => {
      this.executionEngine.executeRun(run, nodeOverrides, retryWaves).catch((err) => {
        this.logger.error(`Retry execution error for run ${runId}: ${err.message}`);
      });
    });

    return run;
  }
}

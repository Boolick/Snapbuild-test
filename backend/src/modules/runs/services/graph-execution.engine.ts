import { Injectable, Logger } from '@nestjs/common';
import { WorkflowRun } from '../domain/run.entity';
import { JobStatus, WorkflowRunStatus } from '../domain/run-status.enum';
import { NodeExecutor } from '../engine/node-executor';
import { RunEventsService } from './run-events.service';
import { WorkflowNode } from '../../workflows/domain/node.entity';

@Injectable()
export class GraphExecutionEngine {
  private readonly logger = new Logger(GraphExecutionEngine.name);

  constructor(
    private readonly nodeExecutor: NodeExecutor,
    private readonly eventsService: RunEventsService,
  ) {}

  /**
   * Executes the entire workflow graph wave by wave.
   * Nodes within each wave are executed concurrently in parallel.
   */
  async executeRun(
    run: WorkflowRun,
    nodeDataOverrides?: Record<string, Record<string, unknown>>,
    startFromWaves?: string[][],
  ): Promise<WorkflowRun> {
    const startTime = Date.now();
    run.status = WorkflowRunStatus.RUNNING;
    run.updatedAt = new Date().toISOString();

    this.eventsService.emit({
      runId: run.id,
      type: 'run_started',
      timestamp: new Date().toISOString(),
      status: WorkflowRunStatus.RUNNING,
      message: `Workflow execution started for run ${run.id}`,
    });

    const nodeMap = new Map<string, WorkflowNode>(run.graph.nodes.map((n) => [n.id, n]));
    const waves = startFromWaves || run.executionWaves;

    this.logger.log(
      `[Run ${run.id}] Starting execution of ${waves.length} waves (${run.graph.nodes.length} total nodes)...`,
    );

    let hasErrors = false;

    for (let waveIndex = 0; waveIndex < waves.length; waveIndex++) {
      const currentWave = waves[waveIndex];
      this.logger.log(
        `[Run ${run.id}] Executing Wave ${waveIndex + 1}/${waves.length} with ${currentWave.length} parallel node(s): [${currentWave.join(', ')}]`,
      );

      // Mark all nodes in current wave as running and notify
      for (const nodeId of currentWave) {
        const job = run.jobs[nodeId];
        if (job) {
          job.status = JobStatus.RUNNING;
          job.startedAt = new Date().toISOString();

          this.eventsService.emit({
            runId: run.id,
            type: 'node_started',
            timestamp: job.startedAt,
            nodeId,
            nodeType: job.nodeType,
            status: JobStatus.RUNNING,
          });
        }
      }

      // Execute all nodes in the current wave concurrently in PARALLEL
      const wavePromises = currentWave.map(async (nodeId) => {
        const node = nodeMap.get(nodeId);
        const job = run.jobs[nodeId];
        if (!node || !job) {
          throw new Error(`Node ${nodeId} not found in execution graph`);
        }

        const nodeStartTime = Date.now();

        try {
          // Resolve inputs from upstream edges
          const resolvedInputs = this.resolveUpstreamInputs(nodeId, run);
          job.inputs = resolvedInputs;

          // Execute the node
          const result = await this.nodeExecutor.execute({
            node,
            resolvedInputs,
            dataOverrides: nodeDataOverrides?.[nodeId],
          });

          const nodeDuration = Date.now() - nodeStartTime;
          job.status = JobStatus.SUCCESS;
          job.completedAt = new Date().toISOString();
          job.durationMs = nodeDuration;
          job.outputs = result.outputs;
          job.error = undefined;

          this.eventsService.emit({
            runId: run.id,
            type: 'node_success',
            timestamp: job.completedAt,
            nodeId,
            nodeType: job.nodeType,
            status: JobStatus.SUCCESS,
            data: result.outputs,
          });

          return { nodeId, success: true, outputs: result.outputs };
        } catch (error: unknown) {
          const nodeDuration = Date.now() - nodeStartTime;
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown node execution failure';

          job.status = JobStatus.ERROR;
          job.completedAt = new Date().toISOString();
          job.durationMs = nodeDuration;
          job.error = errorMessage;

          this.logger.error(`[Run ${run.id}] Node "${nodeId}" failed: ${errorMessage}`);

          this.eventsService.emit({
            runId: run.id,
            type: 'node_error',
            timestamp: job.completedAt,
            nodeId,
            nodeType: job.nodeType,
            status: JobStatus.ERROR,
            message: errorMessage,
          });

          return { nodeId, success: false, error: errorMessage };
        }
      });

      // Wait for all parallel jobs in this wave to complete
      const waveResults = await Promise.all(wavePromises);
      const waveFailed = waveResults.some((res) => !res.success);

      if (waveFailed) {
        hasErrors = true;
        this.logger.warn(
          `[Run ${run.id}] Wave ${waveIndex + 1} experienced failures. Stopping downstream dependent waves.`,
        );
        break;
      }
    }

    const totalDuration = Date.now() - startTime;
    run.totalDurationMs = totalDuration;
    run.completedAt = new Date().toISOString();
    run.updatedAt = new Date().toISOString();

    if (hasErrors) {
      run.status = WorkflowRunStatus.FAILED;
      run.error = 'One or more nodes failed during execution';
      this.eventsService.emit({
        runId: run.id,
        type: 'run_failed',
        timestamp: run.completedAt,
        status: WorkflowRunStatus.FAILED,
        message: run.error,
      });
    } else {
      run.status = WorkflowRunStatus.COMPLETED;
      this.eventsService.emit({
        runId: run.id,
        type: 'run_completed',
        timestamp: run.completedAt,
        status: WorkflowRunStatus.COMPLETED,
        message: `Workflow completed successfully in ${totalDuration}ms`,
      });
    }

    return run;
  }

  /**
   * Collects outputs from upstream connected nodes through incoming edges.
   */
  private resolveUpstreamInputs(targetNodeId: string, run: WorkflowRun): Record<string, unknown> {
    const incomingEdges = run.graph.edges.filter((e) => e.target === targetNodeId);
    const resolvedInputs: Record<string, unknown> = {};

    for (const edge of incomingEdges) {
      const sourceJob = run.jobs[edge.source];
      if (!sourceJob || !sourceJob.outputs) {
        continue;
      }

      const sourceHandle = edge.sourceHandle || 'default';
      const targetHandle = edge.targetHandle || 'default';

      // Output value by handle or generic payload
      const outputValue =
        sourceJob.outputs[sourceHandle] !== undefined
          ? sourceJob.outputs[sourceHandle]
          : sourceJob.outputs;

      resolvedInputs[targetHandle] = outputValue;
      if (sourceJob.outputs.text !== undefined) {
        resolvedInputs.text = sourceJob.outputs.text;
      }
      if (sourceJob.outputs.imageUrl !== undefined) {
        resolvedInputs.imageUrl = sourceJob.outputs.imageUrl;
      }
    }

    return resolvedInputs;
  }
}

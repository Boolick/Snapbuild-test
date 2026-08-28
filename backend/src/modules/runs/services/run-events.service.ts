import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable, concat, from } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { RunEventPayload } from '../domain/run-status.enum';

export interface ServerSentEventMessage {
  data: string;
  type?: string;
  id?: string;
  retry?: number;
}

@Injectable()
export class RunEventsService {
  private readonly logger = new Logger(RunEventsService.name);
  private readonly eventStream$ = new Subject<RunEventPayload>();
  private readonly history = new Map<string, RunEventPayload[]>();

  emit(payload: RunEventPayload): void {
    this.logger.debug(
      `[Run ${payload.runId}] Event: ${payload.type} | Node: ${payload.nodeId || 'N/A'} | Status: ${payload.status || 'N/A'}`,
    );

    if (!this.history.has(payload.runId)) {
      this.history.set(payload.runId, []);
    }
    this.history.get(payload.runId)!.push(payload);

    this.eventStream$.next(payload);
  }

  resetHistoryForRetry(runId: string, nodeIdsToReset: Set<string>): void {
    const current = this.history.get(runId);
    if (!current) {
      return;
    }
    // Remove previous terminal run events and old events for nodes being re-executed
    const filtered = current.filter(
      (e) =>
        e.type !== 'run_completed' &&
        e.type !== 'run_failed' &&
        (!e.nodeId || !nodeIdsToReset.has(e.nodeId)),
    );
    this.history.set(runId, filtered);
  }

  subscribeToRun(runId: string, since?: string): Observable<MessageEvent> {
    let historicalEvents = this.history.get(runId) || [];

    if (since) {
      const sinceTime = new Date(since).getTime();
      if (!isNaN(sinceTime)) {
        historicalEvents = historicalEvents.filter(
          (e) => new Date(e.timestamp).getTime() >= sinceTime,
        );
      }
    }

    const historicalMessages: MessageEvent[] = historicalEvents.map((event) => {
      return {
        data: JSON.stringify(event),
        type: event.type,
      } as MessageEvent;
    });

    const live$ = this.eventStream$.asObservable().pipe(
      filter((event) => event.runId === runId),
      filter((event) => {
        if (!since) {
          return true;
        }
        const sinceTime = new Date(since).getTime();
        return isNaN(sinceTime) || new Date(event.timestamp).getTime() >= sinceTime;
      }),
      map((event) => {
        return {
          data: JSON.stringify(event),
          type: event.type,
        } as MessageEvent;
      }),
    );

    return concat(from(historicalMessages), live$);
  }
}

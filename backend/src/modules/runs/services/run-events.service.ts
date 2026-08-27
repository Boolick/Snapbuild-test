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

  subscribeToRun(runId: string): Observable<MessageEvent> {
    const historicalMessages: MessageEvent[] = (this.history.get(runId) || []).map((event) => {
      return {
        data: JSON.stringify(event),
        type: event.type,
      } as MessageEvent;
    });

    const live$ = this.eventStream$.asObservable().pipe(
      filter((event) => event.runId === runId),
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

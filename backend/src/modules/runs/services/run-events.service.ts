import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
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

  emit(payload: RunEventPayload): void {
    this.logger.debug(
      `[Run ${payload.runId}] Event: ${payload.type} | Node: ${payload.nodeId || 'N/A'} | Status: ${payload.status || 'N/A'}`,
    );
    this.eventStream$.next(payload);
  }

  subscribeToRun(runId: string): Observable<MessageEvent> {
    return this.eventStream$.asObservable().pipe(
      filter((event) => event.runId === runId),
      map((event) => {
        return {
          data: JSON.stringify(event),
          type: event.type,
        } as MessageEvent;
      }),
    );
  }
}

import { API_BASE_URL } from '../config/constants';
import { RunEventMessage } from '../types/api';

export interface SseSubscriptionOptions {
  runId: string;
  onEvent: (event: RunEventMessage) => void;
  onError?: (error: unknown) => void;
  onComplete?: () => void;
}

export function subscribeToRunEvents({
  runId,
  onEvent,
  onError,
  onComplete,
}: SseSubscriptionOptions): () => void {
  const url = `${API_BASE_URL}/runs/${runId}/events`;
  const eventSource = new EventSource(url);

  const handleMessage = (event: MessageEvent) => {
    try {
      const data: RunEventMessage = JSON.parse(event.data);
      onEvent(data);

      if (data.type === 'run_completed' || data.type === 'run_failed') {
        if (onComplete) {
          onComplete();
        }
      }
    } catch (err) {
      console.error('Failed to parse SSE message payload:', err, event.data);
    }
  };

  eventSource.onmessage = handleMessage;

  // Listen for specific event types if backend emits custom event names
  const eventTypes = [
    'run_queued',
    'run_started',
    'node_queued',
    'node_started',
    'node_progress',
    'node_success',
    'node_error',
    'run_completed',
    'run_failed',
  ];

  for (const type of eventTypes) {
    eventSource.addEventListener(type, handleMessage as EventListener);
  }

  eventSource.onerror = (err) => {
    console.warn(`SSE connection encountered an issue for run ${runId}`, err);
    if (onError) {
      onError(err);
    }
  };

  return () => {
    eventSource.close();
  };
}

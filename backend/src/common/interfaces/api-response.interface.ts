export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string;
  error?: string | string[];
}

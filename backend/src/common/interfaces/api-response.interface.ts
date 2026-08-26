export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  meta?: Record<string, any>;
}

export interface ApiErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string;
  error?: string | string[];
}

export interface ApiSuccessResponse<TData> {
  data: TData;
  meta: {
    traceId: string;
  };
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  meta: {
    traceId: string;
  };
}

export interface HealthStatus {
  status: 'ok';
  database: 'connected';
}

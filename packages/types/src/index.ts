export interface ApiSuccessResponse<TData> {
  data: TData;
  meta: {
    correlationId: string;
    timestamp: string;
    path: string;
  };
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  meta: {
    correlationId: string;
    timestamp: string;
    path: string;
  };
}

export interface HealthStatus {
  status: 'ok';
  database: 'connected';
}

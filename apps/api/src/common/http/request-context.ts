import type { Request } from 'express';

export type RequestWithContext = Request & { correlationId?: string };

export function requestPath(request: Request): string {
  return `${request.baseUrl}${request.path}`;
}

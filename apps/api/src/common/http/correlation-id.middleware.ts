import { Injectable, type NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Response } from 'express';
import type { RequestWithContext } from './request-context';

export const CORRELATION_ID_HEADER = 'x-correlation-id';
const correlationIdPattern = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(request: RequestWithContext, response: Response, next: NextFunction) {
    const received = request.header(CORRELATION_ID_HEADER);
    const correlationId = received && correlationIdPattern.test(received) ? received : randomUUID();
    request.correlationId = correlationId;
    response.setHeader(CORRELATION_ID_HEADER, correlationId);
    next();
  }
}

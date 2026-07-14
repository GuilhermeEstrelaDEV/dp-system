import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { AppLoggerService } from '../logger/app-logger.service';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request & { id?: string }>();
    const response = httpContext.getResponse<Response>();
    const startedAt = performance.now();
    request.id = request.header('x-request-id') ?? randomUUID();

    return next.handle().pipe(
      tap(() => {
        this.logger.log('HTTP request completed', 'HTTP', {
          method: request.method,
          path: request.url,
          statusCode: response.statusCode,
          durationMs: Math.round(performance.now() - startedAt),
          traceId: request.id,
        });
      }),
    );
  }
}

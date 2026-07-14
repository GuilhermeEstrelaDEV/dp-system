import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Response } from 'express';
import type { RequestWithContext } from '../http/request-context';
import { requestPath } from '../http/request-context';
import { Observable, tap } from 'rxjs';
import { AppLoggerService } from '../logger/app-logger.service';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<RequestWithContext>();
    const response = httpContext.getResponse<Response>();
    const startedAt = performance.now();
    return next.handle().pipe(
      tap(() => {
        this.logger.log('HTTP request completed', 'HTTP', {
          method: request.method,
          path: requestPath(request),
          statusCode: response.statusCode,
          durationMs: Math.round(performance.now() - startedAt),
          correlationId: request.correlationId,
        });
      }),
    );
  }
}

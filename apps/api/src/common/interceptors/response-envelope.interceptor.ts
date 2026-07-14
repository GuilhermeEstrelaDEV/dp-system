import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { RequestWithContext } from '../http/request-context';
import { requestPath } from '../http/request-context';
import { map, type Observable } from 'rxjs';

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithContext>();

    return next.handle().pipe(
      map((data) => ({
        data,
        meta: {
          correlationId: request.correlationId ?? 'unknown',
          timestamp: new Date().toISOString(),
          path: requestPath(request),
        },
      })),
    );
  }
}

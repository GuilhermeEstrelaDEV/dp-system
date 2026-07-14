import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import type { RequestWithContext } from '../http/request-context';
import { requestPath } from '../http/request-context';
import { AppLoggerService } from '../logger/app-logger.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<RequestWithContext>();
    const httpException = exception instanceof HttpException ? exception : undefined;
    const parserStatus =
      typeof exception === 'object' &&
      exception !== null &&
      'status' in exception &&
      typeof exception.status === 'number'
        ? exception.status
        : undefined;
    const status = httpException?.getStatus() ?? parserStatus ?? HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = httpException?.getResponse();
    const message =
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
        ? exceptionResponse.message
        : (httpException?.message ?? 'Internal server error');

    this.logger.error(
      'Unhandled request error',
      exception instanceof Error ? exception.stack : undefined,
      {
        path: requestPath(request),
        status,
        correlationId: request.correlationId,
      },
    );

    response.status(status).json({
      error: {
        code: HttpStatus[status] ?? 'INTERNAL_SERVER_ERROR',
        message:
          status >= 500
            ? 'Internal server error'
            : status === HttpStatus.PAYLOAD_TOO_LARGE
              ? 'Request payload too large'
              : message,
      },
      meta: {
        correlationId: request.correlationId ?? 'unknown',
        timestamp: new Date().toISOString(),
        path: requestPath(request),
      },
    });
  }
}

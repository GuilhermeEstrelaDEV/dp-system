import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppLoggerService } from '../logger/app-logger.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request & { id?: string }>();
    const httpException = exception instanceof HttpException ? exception : undefined;
    const status = httpException?.getStatus() ?? HttpStatus.INTERNAL_SERVER_ERROR;
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
        path: request.url,
        status,
        traceId: request.id,
      },
    );

    response.status(status).json({
      error: {
        code: HttpStatus[status] ?? 'INTERNAL_SERVER_ERROR',
        message,
      },
      meta: {
        traceId: request.id ?? 'unknown',
      },
    });
  }
}

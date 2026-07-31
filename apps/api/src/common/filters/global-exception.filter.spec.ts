import { ArgumentsHost, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import type { Response } from 'express';
import type { RequestWithContext } from '../http/request-context';
import type { AppLoggerService } from '../logger/app-logger.service';
import { GlobalExceptionFilter } from './global-exception.filter';

describe('GlobalExceptionFilter', () => {
  const createHost = () => {
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();
    const response = { status, json } as unknown as Response;
    const request = {
      baseUrl: '/api/v1/auth',
      path: '/context',
      correlationId: 'stabilization-trace',
    } as RequestWithContext;
    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => request,
      }),
    } as ArgumentsHost;
    return { host, status, json };
  };

  it('records expected client rejections without error stacks', () => {
    const logger = { warn: jest.fn(), error: jest.fn() } as unknown as AppLoggerService;
    const { host, status } = createHost();

    new GlobalExceptionFilter(logger).catch(new ForbiddenException('Acesso negado'), host);

    expect(status).toHaveBeenCalledWith(403);
    expect(logger.warn).toHaveBeenCalledWith('Request rejected', 'HTTP', {
      path: '/api/v1/auth/context',
      status: 403,
      correlationId: 'stabilization-trace',
    });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('keeps unexpected server failures at error level with diagnostic trace', () => {
    const logger = { warn: jest.fn(), error: jest.fn() } as unknown as AppLoggerService;
    const { host, status } = createHost();
    const exception = new InternalServerErrorException('failure');

    new GlobalExceptionFilter(logger).catch(exception, host);

    expect(status).toHaveBeenCalledWith(500);
    expect(logger.error).toHaveBeenCalledWith(
      'Unhandled request error',
      expect.any(String),
      expect.objectContaining({ status: 500, correlationId: 'stabilization-trace' }),
    );
    expect(logger.warn).not.toHaveBeenCalled();
  });
});

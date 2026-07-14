import { CorrelationIdMiddleware, CORRELATION_ID_HEADER } from './correlation-id.middleware';
import type { NextFunction, Response } from 'express';
import type { RequestWithContext } from './request-context';

const invoke = (header?: string) => {
  const request = { header: jest.fn().mockReturnValue(header) } as unknown as RequestWithContext;
  const response = { setHeader: jest.fn() } as unknown as Response;
  const next = jest.fn() as unknown as NextFunction;
  new CorrelationIdMiddleware().use(request, response, next);
  return { request, response, next };
};

describe('CorrelationIdMiddleware', () => {
  it('preserves a valid identifier', () =>
    expect(invoke('request-123').request.correlationId).toBe('request-123'));
  it('replaces invalid or absent identifiers', () => {
    expect(invoke('x'.repeat(129)).request.correlationId).not.toBe('x'.repeat(129));
    expect(invoke().response.setHeader).toHaveBeenCalledWith(
      CORRELATION_ID_HEADER,
      expect.any(String),
    );
  });
});

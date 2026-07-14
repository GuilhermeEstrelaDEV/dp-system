import { GracefulShutdownService } from './graceful-shutdown.service';
import type { AppLoggerService } from '../logger/app-logger.service';

describe('GracefulShutdownService', () => {
  it('logs shutdown completion without throwing', () => {
    const logger = { log: jest.fn() } as unknown as AppLoggerService;
    new GracefulShutdownService(logger).onApplicationShutdown('SIGTERM');
    expect(logger.log).toHaveBeenCalledWith('Application shutdown completed', 'Lifecycle', {
      signal: 'SIGTERM',
    });
  });
});

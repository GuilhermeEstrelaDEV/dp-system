import { AppLoggerService } from './app-logger.service';
import type { ConfigService } from '@nestjs/config';

describe('AppLoggerService', () => {
  it('redacts sensitive metadata', () => {
    const write = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    new AppLoggerService({} as ConfigService).log('request', 'HTTP', {
      authorization: 'secret',
      password: 'secret',
      safe: 'value',
    });
    const output = String(write.mock.calls.at(0)?.[0]);
    expect(output).toContain('[REDACTED]');
    expect(output).not.toContain('"secret"');
    write.mockRestore();
  });
});

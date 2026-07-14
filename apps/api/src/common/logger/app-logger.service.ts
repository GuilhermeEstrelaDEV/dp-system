import { Injectable, LoggerService } from '@nestjs/common';

@Injectable()
export class AppLoggerService implements LoggerService {
  log(message: unknown, context?: string, metadata?: Record<string, unknown>) {
    this.write('log', message, context, metadata);
  }

  error(message: unknown, trace?: string, metadata?: Record<string, unknown>) {
    this.write('error', message, undefined, { trace, ...metadata });
  }

  warn(message: unknown, context?: string, metadata?: Record<string, unknown>) {
    this.write('warn', message, context, metadata);
  }

  debug(message: unknown, context?: string, metadata?: Record<string, unknown>) {
    this.write('debug', message, context, metadata);
  }

  verbose(message: unknown, context?: string, metadata?: Record<string, unknown>) {
    this.write('verbose', message, context, metadata);
  }

  private write(
    level: string,
    message: unknown,
    context?: string,
    metadata?: Record<string, unknown>,
  ) {
    process.stdout.write(
      `${JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        message,
        context,
        ...metadata,
      })}\n`,
    );
  }
}

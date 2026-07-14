import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppLoggerService implements LoggerService {
  constructor(private readonly configService: ConfigService) {}
  log(message: unknown, context?: string, metadata?: Record<string, unknown>) {
    this.write('log', message, context, metadata);
  }

  error(message: unknown, trace?: string, metadata?: Record<string, unknown>) {
    const includeTrace = this.configService.get<string>('app.environment') === 'development';
    this.write('error', message, undefined, { ...(includeTrace ? { trace } : {}), ...metadata });
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
        ...(this.redact(metadata) as Record<string, unknown>),
      })}\n`,
    );
  }

  private redact(value: unknown): unknown {
    if (Array.isArray(value)) return value.map((item) => this.redact(item));
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        /password|token|authorization|cookie|secret|bank|account|iban|card|cvv/i.test(key)
          ? '[REDACTED]'
          : this.redact(item),
      ]),
    );
  }
}

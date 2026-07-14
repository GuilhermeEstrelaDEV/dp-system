import { Injectable, type OnApplicationShutdown } from '@nestjs/common';
import { AppLoggerService } from '../logger/app-logger.service';

@Injectable()
export class GracefulShutdownService implements OnApplicationShutdown {
  constructor(private readonly logger: AppLoggerService) {}

  onApplicationShutdown(signal?: string) {
    this.logger.log('Application shutdown completed', 'Lifecycle', { signal });
  }
}

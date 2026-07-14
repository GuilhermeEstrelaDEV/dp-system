import { createApplication } from './app.factory';
import { AppLoggerService } from './common/logger/app-logger.service';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await createApplication();
  const logger = app.get(AppLoggerService);
  const port = app.get(ConfigService).getOrThrow<number>('app.port');
  await app.listen(port);
  logger.log(`API listening on port ${port}`, 'Bootstrap');
}

void bootstrap();

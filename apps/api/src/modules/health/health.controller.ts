import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { HealthService } from './health.service';

@ApiTags('technical')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Verify API and database availability' })
  @ApiOkResponse({ description: 'Technical services are available' })
  async check() {
    return { live: this.healthService.liveness(), ready: await this.healthService.readiness() };
  }

  @Get('live')
  liveness() {
    return this.healthService.liveness();
  }

  @Get('ready')
  async readiness() {
    const readiness = await this.healthService.readiness();
    if (readiness.status === 'error')
      throw new ServiceUnavailableException('Database is unavailable');
    return readiness;
  }
}

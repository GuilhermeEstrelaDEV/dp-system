import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { HealthStatus } from '@dp-system/types';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('technical')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Verify API and database availability' })
  @ApiOkResponse({ description: 'Technical services are available' })
  async check(): Promise<HealthStatus> {
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      status: 'ok',
      database: 'connected',
    };
  }
}

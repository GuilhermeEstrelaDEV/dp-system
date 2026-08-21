import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { TimeManagementController } from './time-management.controller';
import { TimeManagementService } from './time-management.service';
@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TimeManagementController],
  providers: [TimeManagementService],
})
export class TimeManagementModule {}

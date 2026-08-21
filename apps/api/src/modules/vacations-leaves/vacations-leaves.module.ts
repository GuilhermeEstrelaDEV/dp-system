import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { VacationsLeavesController } from './vacations-leaves.controller';
import { VacationsLeavesService } from './vacations-leaves.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [VacationsLeavesController],
  providers: [VacationsLeavesService],
})
export class VacationsLeavesModule {}

import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { VacationsLeavesController } from './vacations-leaves.controller';
import { VacationsLeavesService } from './vacations-leaves.service';

@Module({
  imports: [PrismaModule],
  controllers: [VacationsLeavesController],
  providers: [VacationsLeavesService],
})
export class VacationsLeavesModule {}

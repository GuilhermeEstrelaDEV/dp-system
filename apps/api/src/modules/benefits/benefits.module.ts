import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { BenefitsController } from './benefits.controller';
import { BenefitsService } from './benefits.service';
@Module({
  imports: [PrismaModule],
  controllers: [BenefitsController],
  providers: [BenefitsService],
})
export class BenefitsModule {}

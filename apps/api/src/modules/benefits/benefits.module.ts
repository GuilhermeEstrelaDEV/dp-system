import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { BenefitsController } from './benefits.controller';
import { BenefitsService } from './benefits.service';
@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [BenefitsController],
  providers: [BenefitsService],
})
export class BenefitsModule {}

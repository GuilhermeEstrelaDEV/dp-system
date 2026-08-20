import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { VariableCompensationController } from './variable-compensation.controller';
import { VariableCompensationService } from './variable-compensation.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [VariableCompensationController],
  providers: [VariableCompensationService],
})
export class VariableCompensationModule {}

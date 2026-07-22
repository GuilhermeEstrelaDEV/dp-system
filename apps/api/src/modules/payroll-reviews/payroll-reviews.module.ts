import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PayrollReviewsController } from './payroll-reviews.controller';
import { PayrollReviewsService } from './payroll-reviews.service';

@Module({
  imports: [AuthModule],
  controllers: [PayrollReviewsController],
  providers: [PayrollReviewsService],
})
export class PayrollReviewsModule {}

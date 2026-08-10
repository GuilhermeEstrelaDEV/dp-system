import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { CurrentPrincipal, RequireCapabilities } from '../auth/auth.decorators';
import {
  CreatePayrollReviewFindingDto,
  PayrollReviewDecisionDto,
  PayrollReviewCycleMinimalResponseDto,
  PayrollReviewDetailsMinimalResponseDto,
  PayrollReviewFindingMinimalResponseDto,
  PayrollReviewHistoryMinimalResponseDto,
  ReopenPayrollReviewDto,
  TransitionPayrollReviewFindingDto,
} from './payroll-reviews.dto';
import { PayrollReviewsService } from './payroll-reviews.service';

@ApiTags('payroll-reviews')
@ApiBearerAuth()
@ApiUnauthorizedResponse()
@ApiForbiddenResponse()
@ApiNotFoundResponse()
@Controller()
export class PayrollReviewsController {
  constructor(private readonly service: PayrollReviewsService) {}

  @Post('payroll-runs/:payrollRunId/reviews')
  @ApiCreatedResponse({ type: PayrollReviewCycleMinimalResponseDto })
  @RequireCapabilities('payroll.review.create')
  openCycle(
    @Param('payrollRunId') payrollRunId: string,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.openCycle(payrollRunId, principal);
  }

  @Get('payroll-runs/:payrollRunId/reviews')
  @ApiOkResponse({ type: PayrollReviewDetailsMinimalResponseDto, isArray: true })
  @RequireCapabilities('payroll.review.view')
  listByRun(
    @Param('payrollRunId') payrollRunId: string,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.listByRun(payrollRunId, principal);
  }

  @Get('payroll-reviews/:reviewCycleId')
  @ApiOkResponse({ type: PayrollReviewDetailsMinimalResponseDto })
  @RequireCapabilities('payroll.review.view')
  findCycle(
    @Param('reviewCycleId') reviewCycleId: string,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.findCycle(reviewCycleId, principal);
  }

  @Post('payroll-reviews/:reviewCycleId/findings')
  @ApiCreatedResponse({ type: PayrollReviewFindingMinimalResponseDto })
  @RequireCapabilities('payroll.review.finding.create')
  createFinding(
    @Param('reviewCycleId') reviewCycleId: string,
    @Body() dto: CreatePayrollReviewFindingDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.createFinding(reviewCycleId, dto, principal);
  }

  @Get('payroll-reviews/:reviewCycleId/findings')
  @ApiOkResponse({ type: PayrollReviewFindingMinimalResponseDto, isArray: true })
  @RequireCapabilities('payroll.review.view')
  listFindings(
    @Param('reviewCycleId') reviewCycleId: string,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.listFindings(reviewCycleId, principal);
  }

  @Post('payroll-review-findings/:findingId/resolve')
  @ApiCreatedResponse({ type: PayrollReviewFindingMinimalResponseDto })
  @RequireCapabilities('payroll.review.finding.resolve')
  resolveFinding(
    @Param('findingId') findingId: string,
    @Body() dto: TransitionPayrollReviewFindingDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.resolveFinding(findingId, dto, principal);
  }

  @Post('payroll-review-findings/:findingId/reopen')
  @ApiCreatedResponse({ type: PayrollReviewFindingMinimalResponseDto })
  @RequireCapabilities('payroll.review.finding.reopen')
  reopenFinding(
    @Param('findingId') findingId: string,
    @Body() dto: TransitionPayrollReviewFindingDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.reopenFinding(findingId, dto, principal);
  }

  @Post('payroll-reviews/:reviewCycleId/start')
  @ApiCreatedResponse({ type: PayrollReviewCycleMinimalResponseDto })
  @RequireCapabilities('payroll.review.submit')
  startReview(
    @Param('reviewCycleId') reviewCycleId: string,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.startReview(reviewCycleId, principal);
  }

  @Post('payroll-reviews/:reviewCycleId/submit')
  @ApiCreatedResponse({ type: PayrollReviewCycleMinimalResponseDto })
  @RequireCapabilities('payroll.review.submit')
  submitReview(
    @Param('reviewCycleId') reviewCycleId: string,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.submitReview(reviewCycleId, principal);
  }

  @Post('payroll-reviews/:reviewCycleId/approve')
  @ApiCreatedResponse({ type: PayrollReviewCycleMinimalResponseDto })
  @RequireCapabilities('payroll.review.approve')
  approveReview(
    @Param('reviewCycleId') reviewCycleId: string,
    @Body() dto: PayrollReviewDecisionDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.approveReview(reviewCycleId, dto, principal);
  }

  @Post('payroll-reviews/:reviewCycleId/reject')
  @ApiCreatedResponse({ type: PayrollReviewCycleMinimalResponseDto })
  @RequireCapabilities('payroll.review.reject')
  rejectReview(
    @Param('reviewCycleId') reviewCycleId: string,
    @Body() dto: PayrollReviewDecisionDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.rejectReview(reviewCycleId, dto, principal);
  }

  @Get('payroll-reviews/:reviewCycleId/history')
  @ApiOkResponse({ type: PayrollReviewHistoryMinimalResponseDto })
  @RequireCapabilities('payroll.review.view')
  history(
    @Param('reviewCycleId') reviewCycleId: string,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.history(reviewCycleId, principal);
  }

  @Post('payroll-reviews/:reviewCycleId/close')
  @ApiCreatedResponse({ type: PayrollReviewCycleMinimalResponseDto })
  @RequireCapabilities('payroll.review.close')
  closeReview(
    @Param('reviewCycleId') reviewCycleId: string,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.closeReview(reviewCycleId, principal);
  }

  @Post('payroll-reviews/:reviewCycleId/reopen')
  @ApiCreatedResponse({ type: PayrollReviewCycleMinimalResponseDto })
  @RequireCapabilities('payroll.review.reopen')
  reopenReview(
    @Param('reviewCycleId') reviewCycleId: string,
    @Body() dto: ReopenPayrollReviewDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.reopenReview(reviewCycleId, dto, principal);
  }
}

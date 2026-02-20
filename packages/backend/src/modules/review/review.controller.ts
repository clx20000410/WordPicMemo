import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { CompleteReviewDto } from './dto/complete-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../common/decorators/current-user.decorator';

@ApiTags('Reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get('due')
  @ApiOperation({ summary: 'Get all due reviews for the current user' })
  @ApiResponse({ status: 200, description: 'List of due reviews with word and explanation data' })
  async getDueReviews(@CurrentUser() user: CurrentUserPayload) {
    return this.reviewService.getDueReviews(user.userId);
  }

  @Get('today')
  @ApiOperation({ summary: "Get today's review summary for the current user" })
  @ApiResponse({ status: 200, description: "Today's review summary" })
  async getTodaySummary(@CurrentUser() user: CurrentUserPayload) {
    return this.reviewService.getTodaySummary(user.userId);
  }

  @Get('pending-schedules')
  @ApiOperation({ summary: 'Get all pending/due/overdue review schedules for notification sync' })
  @ApiResponse({ status: 200, description: 'List of pending review schedules' })
  async getPendingSchedules(@CurrentUser() user: CurrentUserPayload) {
    return this.reviewService.getPendingSchedules(user.userId);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete a review' })
  @ApiResponse({ status: 200, description: 'The completed review record' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  @ApiResponse({ status: 400, description: 'Review is not in a completable state' })
  async completeReview(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CompleteReviewDto,
  ) {
    return this.reviewService.completeReview(id, user.userId, dto);
  }
}

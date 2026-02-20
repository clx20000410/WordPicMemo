import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ReviewService } from './review.service';

@Injectable()
export class ReviewCronService {
  private readonly logger = new Logger(ReviewCronService.name);

  constructor(private readonly reviewService: ReviewService) {}

  /**
   * Run every minute: promote pending reviews to 'due' status
   * when their scheduled time has arrived.
   */
  @Cron('* * * * *')
  async handleDueReviews(): Promise<void> {
    const count = await this.reviewService.markDueReviews();
    if (count > 0) {
      this.logger.log(`Marked ${count} review(s) as due`);
    }
  }

  /**
   * Run daily at 3:00 AM: mark reviews that have been 'due' for over
   * 24 hours as 'overdue'.
   */
  @Cron('0 3 * * *')
  async handleOverdueReviews(): Promise<void> {
    const count = await this.reviewService.markOverdueReviews();
    if (count > 0) {
      this.logger.log(`Marked ${count} review(s) as overdue`);
    }
  }
}

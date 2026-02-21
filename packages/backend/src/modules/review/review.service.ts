import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Brackets } from 'typeorm';
import { ReviewSchedule, ReviewStatus } from './review-schedule.entity';
import { Word } from '../words/word.entity';
import { WordExplanation } from '../words/word-explanation.entity';
import { calculateReviewSchedules } from '@wordpicmemo/shared';
import { CompleteReviewDto } from './dto/complete-review.dto';
import { ReviewQueryDto } from './dto/review-query.dto';

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(
    @InjectRepository(ReviewSchedule)
    private readonly reviewScheduleRepository: Repository<ReviewSchedule>,

    @InjectRepository(Word)
    private readonly wordRepository: Repository<Word>,

    @InjectRepository(WordExplanation)
    private readonly wordExplanationRepository: Repository<WordExplanation>,
  ) {}

  /**
   * Create 8 review schedule records for a word based on Ebbinghaus intervals.
   */
  async createSchedules(
    wordId: string,
    userId: string,
  ): Promise<ReviewSchedule[]> {
    const scheduleItems = calculateReviewSchedules(new Date());

    const entities = scheduleItems.map((item) =>
      this.reviewScheduleRepository.create({
        wordId,
        userId,
        stage: item.stage,
        scheduledAt: item.scheduledAt,
        status: ReviewStatus.PENDING,
      }),
    );

    return this.reviewScheduleRepository.save(entities);
  }

  /**
   * Get all due/overdue reviews for a user, joined with word and explanation data.
   */
  async getDueReviews(userId: string): Promise<any[]> {
    const now = new Date();
    const reviews = await this.reviewScheduleRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.word', 'word')
      .leftJoinAndSelect('word.explanation', 'explanation')
      .where('review.userId = :userId', { userId })
      .andWhere(
        new Brackets((subQb) => {
          subQb
            .where('review.status IN (:...dueLike)', {
              dueLike: [ReviewStatus.DUE, ReviewStatus.OVERDUE],
            })
            .orWhere('(review.status = :pending AND review.scheduledAt <= :now)', {
              pending: ReviewStatus.PENDING,
              now,
            });
        }),
      )
      .orderBy('review.scheduledAt', 'ASC')
      .getMany();

    return reviews.map((review) => ({
      review: {
        id: review.id,
        wordId: review.wordId,
        userId: review.userId,
        stage: review.stage,
        scheduledAt: review.scheduledAt,
        completedAt: review.completedAt,
        status: review.status,
        remembered: review.remembered,
        confidence: review.confidence,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      },
      word: review.word
        ? {
            id: review.word.id,
            word: review.word.word,
            language: review.word.language,
          }
        : null,
      explanation: review.word?.explanation
        ? {
            pronunciation: review.word.explanation.pronunciation,
            coreDefinition: review.word.explanation.coreDefinition,
            mnemonicPhrase: review.word.explanation.mnemonicPhrase,
            memoryScene: review.word.explanation.memoryScene,
            imageUrl: review.word.explanation.imageUrl,
          }
        : null,
    }));
  }

  /**
   * Get review schedules for "unreviewed" (due/overdue + time-reached pending)
   * or "reviewed" (completed),
   * optionally filtered by scheduled date.
   */
  async getReviewSchedules(
    userId: string,
    query: ReviewQueryDto,
  ): Promise<any[]> {
    const status = query.status || 'unreviewed';
    const qb = this.reviewScheduleRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.word', 'word')
      .leftJoinAndSelect('word.explanation', 'explanation')
      .where('review.userId = :userId', { userId });

    if (status === 'reviewed') {
      qb.andWhere('review.status = :completed', { completed: ReviewStatus.COMPLETED });
      qb.orderBy('review.completedAt', 'DESC', 'NULLS LAST');
    } else {
      const now = new Date();
      qb.andWhere(
        new Brackets((subQb) => {
          subQb
            .where('review.status IN (:...dueLike)', {
              dueLike: [ReviewStatus.DUE, ReviewStatus.OVERDUE],
            })
            .orWhere('(review.status = :pending AND review.scheduledAt <= :now)', {
              pending: ReviewStatus.PENDING,
              now,
            });
        }),
      );
      qb.orderBy('review.scheduledAt', 'ASC');
    }

    if (query.date) {
      const start = new Date(query.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(query.date);
      end.setHours(23, 59, 59, 999);
      qb.andWhere('review.scheduledAt BETWEEN :start AND :end', { start, end });
    }

    const reviews = await qb.getMany();

    return reviews.map((review) => ({
      review: {
        id: review.id,
        wordId: review.wordId,
        userId: review.userId,
        stage: review.stage,
        scheduledAt: review.scheduledAt,
        completedAt: review.completedAt,
        status: review.status,
        remembered: review.remembered,
        confidence: review.confidence,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      },
      word: review.word
        ? {
            id: review.word.id,
            word: review.word.word,
            language: review.word.language,
          }
        : null,
      explanation: review.word?.explanation
        ? {
            pronunciation: review.word.explanation.pronunciation,
            coreDefinition: review.word.explanation.coreDefinition,
            mnemonicPhrase: review.word.explanation.mnemonicPhrase,
            memoryScene: review.word.explanation.memoryScene,
            imageUrl: review.word.explanation.imageUrl,
          }
        : null,
    }));
  }

  /**
   * Get today's review summary for a user.
   */
  async getTodaySummary(
    userId: string,
  ): Promise<{
    totalDue: number;
    completedToday: number;
    overdueCount: number;
    upcomingToday: number;
  }> {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    // Count reviews that should be considered "due now" (includes reached pending)
    const totalDue = await this.reviewScheduleRepository
      .createQueryBuilder('review')
      .where('review.userId = :userId', { userId })
      .andWhere(
        new Brackets((subQb) => {
          subQb
            .where('review.status = :due', { due: ReviewStatus.DUE })
            .orWhere('(review.status = :pending AND review.scheduledAt <= :now)', {
              pending: ReviewStatus.PENDING,
              now,
            });
        }),
      )
      .getCount();

    // Count reviews completed today
    const completedToday = await this.reviewScheduleRepository.count({
      where: {
        userId,
        status: ReviewStatus.COMPLETED,
        completedAt: Between(startOfToday, endOfToday),
      },
    });

    // Count overdue reviews
    const overdueCount = await this.reviewScheduleRepository.count({
      where: {
        userId,
        status: ReviewStatus.OVERDUE,
      },
    });

    // Count reviews scheduled for rest of today that are still pending
    const upcomingToday = await this.reviewScheduleRepository.count({
      where: {
        userId,
        status: ReviewStatus.PENDING,
        scheduledAt: Between(now, endOfToday),
      },
    });

    return {
      totalDue,
      completedToday,
      overdueCount,
      upcomingToday,
    };
  }

  /**
   * Complete a review: mark it as completed with remembered/confidence data.
   */
  async completeReview(
    reviewId: string,
    userId: string,
    dto: CompleteReviewDto,
  ): Promise<ReviewSchedule> {
    const review = await this.reviewScheduleRepository.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException(`Review with id ${reviewId} not found`);
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You do not have access to this review');
    }

    const now = new Date();
    const pendingReachedReviewTime =
      review.status === ReviewStatus.PENDING && review.scheduledAt <= now;

    if (
      review.status !== ReviewStatus.DUE &&
      review.status !== ReviewStatus.OVERDUE &&
      !pendingReachedReviewTime
    ) {
      throw new BadRequestException(
        `Cannot complete a review with status '${review.status}'. ` +
          `Only 'due', 'overdue', or time-reached 'pending' reviews can be completed.`,
      );
    }

    review.status = ReviewStatus.COMPLETED;
    review.remembered = dto.remembered;
    review.confidence = dto.confidence;
    review.completedAt = new Date();

    return this.reviewScheduleRepository.save(review);
  }

  /**
   * Get all pending/due/overdue review schedules for a user.
   * Used by mobile client to sync local notifications on app startup.
   */
  async getPendingSchedules(
    userId: string,
  ): Promise<
    {
      id: string;
      wordId: string;
      stage: number;
      scheduledAt: Date;
      status: string;
      word: string | null;
    }[]
  > {
    const reviews = await this.reviewScheduleRepository.find({
      where: [
        { userId, status: ReviewStatus.PENDING },
        { userId, status: ReviewStatus.DUE },
        { userId, status: ReviewStatus.OVERDUE },
      ],
      relations: ['word'],
      order: { scheduledAt: 'ASC' },
    });

    return reviews.map((r) => ({
      id: r.id,
      wordId: r.wordId,
      stage: r.stage,
      scheduledAt: r.scheduledAt,
      status: r.status,
      word: r.word?.word ?? null,
    }));
  }

  /**
   * Mark pending reviews whose scheduledAt has passed as 'due'.
   * Returns the count of updated reviews.
   */
  async markDueReviews(): Promise<number> {
    const now = new Date();

    const result = await this.reviewScheduleRepository
      .createQueryBuilder()
      .update(ReviewSchedule)
      .set({ status: ReviewStatus.DUE })
      .where('status = :status', { status: ReviewStatus.PENDING })
      .andWhere('"scheduled_at" <= :now', { now })
      .execute();

    return result.affected ?? 0;
  }

  /**
   * Mark due reviews that are more than 24 hours past their scheduled time as 'overdue'.
   * Returns the count of updated reviews.
   */
  async markOverdueReviews(): Promise<number> {
    const overdueThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const result = await this.reviewScheduleRepository
      .createQueryBuilder()
      .update(ReviewSchedule)
      .set({ status: ReviewStatus.OVERDUE })
      .where('status = :status', { status: ReviewStatus.DUE })
      .andWhere('"scheduled_at" < :threshold', { threshold: overdueThreshold })
      .execute();

    return result.affected ?? 0;
  }
}

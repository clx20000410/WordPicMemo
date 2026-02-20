import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ReviewSchedule } from './review-schedule.entity';
import { Word } from '../words/word.entity';
import { WordExplanation } from '../words/word-explanation.entity';
import { ReviewService } from './review.service';
import { ReviewCronService } from './review.cron';
import { ReviewController } from './review.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReviewSchedule, Word, WordExplanation]),
    ScheduleModule,
  ],
  controllers: [ReviewController],
  providers: [ReviewService, ReviewCronService],
  exports: [ReviewService],
})
export class ReviewModule {}

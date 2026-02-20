import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Word } from './word.entity';
import { WordExplanation } from './word-explanation.entity';
import { WordsService } from './words.service';
import { WordsController } from './words.controller';
import { ReviewModule } from '../review/review.module';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Word, WordExplanation]),
    ReviewModule,
    AIModule,
  ],
  controllers: [WordsController],
  providers: [WordsService],
  exports: [WordsService],
})
export class WordsModule {}

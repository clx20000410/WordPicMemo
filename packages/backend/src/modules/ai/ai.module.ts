import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIConfiguration } from './ai-configuration.entity';
import { WordExplanation } from '../words/word-explanation.entity';
import { Word } from '../words/word.entity';
import { AIAdapterFactory } from './ai-adapter.factory';
import { AIService } from './ai.service';
import { AIConfigService } from './ai-config.service';
import { AIConfigController } from './ai-config.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([AIConfiguration, WordExplanation, Word]),
  ],
  controllers: [AIConfigController],
  providers: [AIAdapterFactory, AIService, AIConfigService],
  exports: [AIService, AIConfigService],
})
export class AIModule {}

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AIConfigService } from './ai-config.service';
import { AIAdapterFactory } from './ai-adapter.factory';
import {
  WordExplanation,
  ExplanationStatus,
  ImageStatus,
} from '../words/word-explanation.entity';
import { Word } from '../words/word.entity';
import { UsersService } from '../users/users.service';
import { DEFAULT_IMAGE_PROMPT_TEMPLATE } from '@wordpicmemo/shared';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);

  constructor(
    private readonly aiConfigService: AIConfigService,
    private readonly adapterFactory: AIAdapterFactory,
    private readonly usersService: UsersService,
    @InjectRepository(WordExplanation)
    private readonly wordExplanationRepo: Repository<WordExplanation>,
    @InjectRepository(Word)
    private readonly wordRepo: Repository<Word>,
  ) {}

  async generateExplanationAsync(
    wordId: string,
    userId: string,
  ): Promise<void> {
    try {
      // 1. Get word by id
      const word = await this.wordRepo.findOne({ where: { id: wordId } });
      if (!word) {
        this.logger.warn(`Word not found: ${wordId}`);
        await this.setExplanationFailed(wordId);
        return;
      }

      // 2. Get active text config for user
      const config = await this.aiConfigService.getActiveConfig(
        userId,
        'text',
      );
      if (!config) {
        this.logger.warn(
          `No active text AI configuration found for user ${userId}`,
        );
        await this.setExplanationFailed(wordId);
        return;
      }

      // 3. Ensure word explanation entity exists and update status to 'generating'
      let explanation = await this.wordExplanationRepo.findOne({
        where: { wordId },
      });

      if (!explanation) {
        explanation = this.wordExplanationRepo.create({
          wordId,
          explanationStatus: ExplanationStatus.GENERATING,
        });
        explanation = await this.wordExplanationRepo.save(explanation);
      } else {
        await this.wordExplanationRepo.update(explanation.id, {
          explanationStatus: ExplanationStatus.GENERATING,
        });
      }

      // 4. Create text adapter via factory (decrypt API key)
      const decryptedKey = this.aiConfigService.decryptApiKey(
        config.apiKeyEnc,
      );
      const adapter = this.adapterFactory.createTextGenerator({
        provider: config.provider,
        responseFormat: config.responseFormat || config.provider,
        apiKey: decryptedKey,
        apiEndpoint: config.apiEndpoint,
        modelName: config.modelName,
      });

      // 5. Call generateExplanation with word and language
      const result = await adapter.generateExplanation({
        word: word.word,
        language: word.language,
      });

      // 6. Update WordExplanation with result, set status to 'completed'
      await this.wordExplanationRepo.update(explanation.id, {
        pronunciation: result.pronunciation,
        wordBreakdown: result.wordBreakdown,
        mnemonicPhrase: result.mnemonicPhrase,
        coreDefinition: result.coreDefinition,
        exampleSentences: result.exampleSentences,
        memoryScene: result.memoryScene,
        imagePrompt: result.imagePrompt,
        explanationStatus: ExplanationStatus.COMPLETED,
      });

      this.logger.log(
        `Explanation generated successfully for word: ${word.word} (${wordId})`,
      );

      // 7. If result has imagePrompt, call generateImageAsync
      if (result.imagePrompt) {
        await this.generateImageAsync(wordId, userId);
      }
    } catch (error) {
      // 8. On error: set status to 'failed', log error with details
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      // Include extra context for API errors (status code, etc.)
      const statusCode = (error as any)?.status || (error as any)?.response?.status;
      const logMsg = statusCode
        ? `[HTTP ${statusCode}] ${errorMessage}`
        : errorMessage;

      this.logger.error(
        `Failed to generate explanation for word ${wordId}: ${logMsg}`,
        error instanceof Error ? error.stack : undefined,
      );

      const explanation = await this.wordExplanationRepo.findOne({
        where: { wordId },
      });
      if (explanation) {
        await this.wordExplanationRepo.update(explanation.id, {
          explanationStatus: ExplanationStatus.FAILED,
        });
      }
    }
  }

  async generateImageAsync(
    wordId: string,
    userId: string,
  ): Promise<void> {
    try {
      // 1. Get word explanation
      const explanation = await this.wordExplanationRepo.findOne({
        where: { wordId },
      });
      if (!explanation || !explanation.imagePrompt) {
        this.logger.warn(
          `No explanation or image prompt found for word ${wordId}`,
        );
        await this.setImageFailed(wordId);
        return;
      }

      // 2. Get active image config for user
      const config = await this.aiConfigService.getActiveConfig(
        userId,
        'image',
      );
      if (!config) {
        this.logger.warn(
          `No active image AI configuration found for user ${userId} — skipping image generation`,
        );
        await this.setImageFailed(wordId);
        return;
      }

      // 3. Update imageStatus to 'generating'
      await this.wordExplanationRepo.update(explanation.id, {
        imageStatus: ImageStatus.GENERATING,
      });

      // 4. Create image adapter via factory
      const decryptedKey = this.aiConfigService.decryptApiKey(
        config.apiKeyEnc,
      );
      const adapter = this.adapterFactory.createImageGenerator({
        provider: config.provider,
        responseFormat: config.responseFormat || config.provider,
        apiKey: decryptedKey,
        apiEndpoint: config.apiEndpoint,
        modelName: config.modelName,
      });

      // 5. Build final prompt: combine user template + word + scene
      const word = await this.wordRepo.findOne({ where: { id: wordId } });
      const settings = await this.usersService.getSettings(userId);
      const template =
        settings.imagePromptTemplate || DEFAULT_IMAGE_PROMPT_TEMPLATE;
      const finalPrompt = `${template}\n\nWord: ${word?.word ?? ''}\nScene: ${explanation.imagePrompt}`;

      // 6. Call generateImage with combined prompt
      const result = await adapter.generateImage({
        prompt: finalPrompt,
      });

      // 6. Update imageUrl and imageStatus to 'completed'
      await this.wordExplanationRepo.update(explanation.id, {
        imageUrl: result.imageUrl,
        imageStatus: ImageStatus.COMPLETED,
      });

      this.logger.log(
        `Image generated successfully for word ${wordId}`,
      );
    } catch (error) {
      // 7. On error: set imageStatus to 'failed', log error with details
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      const statusCode = (error as any)?.status || (error as any)?.response?.status;
      const logMsg = statusCode
        ? `[HTTP ${statusCode}] ${errorMessage}`
        : errorMessage;

      this.logger.error(
        `Failed to generate image for word ${wordId}: ${logMsg}`,
        error instanceof Error ? error.stack : undefined,
      );

      const explanation = await this.wordExplanationRepo.findOne({
        where: { wordId },
      });
      if (explanation) {
        await this.wordExplanationRepo.update(explanation.id, {
          imageStatus: ImageStatus.FAILED,
        });
      }
    }
  }

  /**
   * Helper: mark explanation status as FAILED when generation cannot proceed
   */
  private async setExplanationFailed(wordId: string): Promise<void> {
    const explanation = await this.wordExplanationRepo.findOne({
      where: { wordId },
    });
    if (explanation) {
      await this.wordExplanationRepo.update(explanation.id, {
        explanationStatus: ExplanationStatus.FAILED,
      });
    }
  }

  /**
   * Helper: mark image status as FAILED when generation cannot proceed
   */
  private async setImageFailed(wordId: string): Promise<void> {
    const explanation = await this.wordExplanationRepo.findOne({
      where: { wordId },
    });
    if (explanation) {
      await this.wordExplanationRepo.update(explanation.id, {
        imageStatus: ImageStatus.FAILED,
      });
    }
  }
}

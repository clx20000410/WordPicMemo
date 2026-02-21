import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Word } from './word.entity';
import { WordExplanation, ExplanationStatus, ImageStatus } from './word-explanation.entity';
import { ReviewService } from '../review/review.service';
import { AIService } from '../ai/ai.service';
import { CreateWordDto } from './dto/create-word.dto';
import { CreateNoteDto } from './dto/create-note.dto';
import { WordQueryDto } from './dto/word-query.dto';

@Injectable()
export class WordsService {
  private readonly logger = new Logger(WordsService.name);

  constructor(
    @InjectRepository(Word)
    private readonly wordRepository: Repository<Word>,
    @InjectRepository(WordExplanation)
    private readonly wordExplanationRepository: Repository<WordExplanation>,
    private readonly reviewService: ReviewService,
    private readonly aiService: AIService,
  ) {}

  async createWord(userId: string, dto: CreateWordDto): Promise<Word> {
    // 1. Create the word record
    const word = this.wordRepository.create({
      userId,
      word: dto.word,
      language: dto.language || 'en',
    });
    const savedWord = await this.wordRepository.save(word);

    // 2. Create empty word_explanation record with status 'pending'
    const explanation = this.wordExplanationRepository.create({
      wordId: savedWord.id,
      explanationStatus: ExplanationStatus.PENDING,
      imageStatus: ImageStatus.PENDING,
    });
    const savedExplanation = await this.wordExplanationRepository.save(explanation);

    // 3. Create 8 review schedules
    await this.reviewService.createSchedules(savedWord.id, userId);

    // 4. Fire-and-forget: generate explanation asynchronously
    this.aiService.generateExplanationAsync(savedWord.id, userId).catch((error) => {
      this.logger.error(
        `Failed to generate explanation for word ${savedWord.id}: ${error.message}`,
        error.stack,
      );
    });

    // 5. Return word with explanation
    savedWord.explanation = savedExplanation;
    return savedWord;
  }

  async createNote(userId: string, dto: CreateNoteDto): Promise<Word> {
    const title = dto.title.trim();
    const richContent = dto.content.trim();
    const preview = this.getPreviewText(richContent, 220);
    const normalizedImageDataUrl = dto.imageDataUrl?.trim() || null;

    const noteWord = this.wordRepository.create({
      userId,
      word: title,
      language: 'note',
    });
    const savedWord = await this.wordRepository.save(noteWord);

    const explanation = this.wordExplanationRepository.create({
      wordId: savedWord.id,
      pronunciation: null,
      wordBreakdown: null,
      mnemonicPhrase: null,
      coreDefinition: preview || title,
      exampleSentences: null,
      memoryScene: richContent,
      imagePrompt: null,
      imageUrl: normalizedImageDataUrl,
      imageStatus: ImageStatus.COMPLETED,
      explanationStatus: ExplanationStatus.COMPLETED,
    });
    const savedExplanation = await this.wordExplanationRepository.save(explanation);

    await this.reviewService.createSchedules(savedWord.id, userId);

    savedWord.explanation = savedExplanation;
    return savedWord;
  }

  async getUserWords(
    userId: string,
    query: WordQueryDto,
  ): Promise<{
    items: Word[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.wordRepository
      .createQueryBuilder('word')
      .leftJoinAndSelect('word.explanation', 'explanation')
      .where('word.userId = :userId', { userId });

    // Optional search filter
    if (query.search) {
      qb.andWhere('word.word ILIKE :search', { search: `%${query.search}%` });
    }

    // Optional language filter
    if (query.language) {
      qb.andWhere('word.language = :language', { language: query.language });
    }

    // Optional date filter
    if (query.date) {
      const start = new Date(query.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(query.date);
      end.setHours(23, 59, 59, 999);
      qb.andWhere('word.createdAt BETWEEN :start AND :end', { start, end });
    }

    // Order by createdAt descending
    qb.orderBy('word.createdAt', 'DESC');

    // Pagination
    qb.skip(skip).take(limit);

    const [items, total] = await qb.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getWordById(id: string, userId: string): Promise<Word> {
    const word = await this.wordRepository.findOne({
      where: { id },
      relations: ['explanation'],
    });

    if (!word) {
      throw new NotFoundException(`Word with id "${id}" not found`);
    }

    if (word.userId !== userId) {
      throw new ForbiddenException('You do not have access to this word');
    }

    return word;
  }

  async regenerateExplanation(id: string, userId: string): Promise<void> {
    const word = await this.getWordById(id, userId);

    // Reset explanation status to 'pending'
    await this.wordExplanationRepository.update(
      { wordId: word.id },
      { explanationStatus: ExplanationStatus.PENDING },
    );

    // Fire-and-forget: regenerate explanation asynchronously
    this.aiService.generateExplanationAsync(word.id, userId).catch((error) => {
      this.logger.error(
        `Failed to regenerate explanation for word ${word.id}: ${error.message}`,
        error.stack,
      );
    });
  }

  async regenerateImage(id: string, userId: string): Promise<void> {
    const word = await this.getWordById(id, userId);

    // Reset image status to 'pending'
    await this.wordExplanationRepository.update(
      { wordId: word.id },
      { imageStatus: ImageStatus.PENDING },
    );

    // Fire-and-forget: regenerate image asynchronously
    this.aiService.generateImageAsync(word.id, userId).catch((error) => {
      this.logger.error(
        `Failed to regenerate image for word ${word.id}: ${error.message}`,
        error.stack,
      );
    });
  }

  async deleteWord(id: string, userId: string): Promise<void> {
    const word = await this.getWordById(id, userId);

    // Delete the word (cascade deletes explanation and review_schedules)
    await this.wordRepository.remove(word);

    this.logger.log(`Word ${id} deleted by user ${userId}`);
  }

  private getPreviewText(content: string, limit: number): string {
    const stripped = content
      .replace(/<[^>]*>/g, ' ')
      .replace(/[*_~`>#-]/g, ' ')
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();

    if (!stripped) {
      return '';
    }

    if (stripped.length <= limit) {
      return stripped;
    }

    return `${stripped.slice(0, limit).trim()}...`;
  }
}

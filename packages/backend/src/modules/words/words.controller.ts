import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { WordsService } from './words.service';
import { CreateWordDto } from './dto/create-word.dto';
import { WordQueryDto } from './dto/word-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Words')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('words')
export class WordsController {
  constructor(private readonly wordsService: WordsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new word' })
  @ApiResponse({ status: 201, description: 'Word created successfully' })
  async createWord(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateWordDto,
  ) {
    return this.wordsService.createWord(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user words with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of words' })
  async getUserWords(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: WordQueryDto,
  ) {
    return this.wordsService.getUserWords(user.userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a word by ID' })
  @ApiResponse({ status: 200, description: 'Word details' })
  @ApiResponse({ status: 404, description: 'Word not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getWordById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.wordsService.getWordById(id, user.userId);
  }

  @Post(':id/regenerate')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Regenerate AI explanation for a word' })
  @ApiResponse({ status: 204, description: 'Explanation regeneration started' })
  @ApiResponse({ status: 404, description: 'Word not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async regenerateExplanation(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.wordsService.regenerateExplanation(id, user.userId);
  }

  @Post(':id/regenerate-image')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Regenerate AI image for a word' })
  @ApiResponse({ status: 204, description: 'Image regeneration started' })
  @ApiResponse({ status: 404, description: 'Word not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async regenerateImage(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.wordsService.regenerateImage(id, user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a word' })
  @ApiResponse({ status: 204, description: 'Word deleted successfully' })
  @ApiResponse({ status: 404, description: 'Word not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async deleteWord(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.wordsService.deleteWord(id, user.userId);
  }
}

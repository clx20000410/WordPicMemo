import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../common/decorators/current-user.decorator';
import { AIConfigService } from './ai-config.service';
import { CreateAIConfigDto } from './dto/create-ai-config.dto';
import { UpdateAIConfigDto } from './dto/update-ai-config.dto';

@ApiTags('AI Configurations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai-configs')
export class AIConfigController {
  constructor(private readonly aiConfigService: AIConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Get all AI configurations for the current user' })
  async getAllConfigs(@CurrentUser() user: CurrentUserPayload) {
    return this.aiConfigService.getAllConfigs(user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new AI configuration' })
  async createConfig(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateAIConfigDto,
  ) {
    return this.aiConfigService.createConfig(user.userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an AI configuration' })
  async updateConfig(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateAIConfigDto,
  ) {
    return this.aiConfigService.updateConfig(id, user.userId, dto);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Test an AI configuration connection' })
  async testConfig(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.aiConfigService.testConfig(id, user.userId);
  }
}

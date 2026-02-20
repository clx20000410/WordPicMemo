import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  AIConfiguration,
  AIPurpose,
  AIProvider,
} from './ai-configuration.entity';
import { AIAdapterFactory } from './ai-adapter.factory';
import { CreateAIConfigDto } from './dto/create-ai-config.dto';
import { UpdateAIConfigDto } from './dto/update-ai-config.dto';

const DEFAULT_ENDPOINTS: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  claude: 'https://api.anthropic.com',
  zhipu: 'https://open.bigmodel.cn/api/paas/v4',
  doubao: 'https://ark.cn-beijing.volces.com/api/v3',
  custom: '',
};

@Injectable()
export class AIConfigService {
  private readonly logger = new Logger(AIConfigService.name);
  private readonly encryptionAlgorithm = 'aes-256-cbc';

  constructor(
    @InjectRepository(AIConfiguration)
    private readonly aiConfigRepo: Repository<AIConfiguration>,
    private readonly configService: ConfigService,
    private readonly adapterFactory: AIAdapterFactory,
  ) {}

  async getActiveConfig(
    userId: string,
    purpose: 'text' | 'image',
  ): Promise<AIConfiguration | null> {
    return this.aiConfigRepo.findOne({
      where: {
        userId,
        purpose: purpose as AIPurpose,
        isActive: true,
      },
    });
  }

  async getAllConfigs(userId: string): Promise<AIConfiguration[]> {
    return this.aiConfigRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async createConfig(
    userId: string,
    dto: CreateAIConfigDto,
  ): Promise<AIConfiguration> {
    const provider = dto.provider || 'custom';
    const apiEndpoint =
      dto.apiEndpoint || DEFAULT_ENDPOINTS[provider] || '';

    const config = this.aiConfigRepo.create({
      userId,
      purpose: dto.purpose as AIPurpose,
      provider: provider as AIProvider,
      responseFormat: dto.responseFormat || null,
      apiEndpoint,
      apiKeyEnc: this.encryptApiKey(dto.apiKey),
      modelName: dto.modelName,
      isActive: true,
    });

    return this.aiConfigRepo.save(config);
  }

  async updateConfig(
    id: string,
    userId: string,
    dto: UpdateAIConfigDto,
  ): Promise<AIConfiguration> {
    const config = await this.aiConfigRepo.findOne({
      where: { id, userId },
    });

    if (!config) {
      throw new NotFoundException(
        `AI configuration with id ${id} not found`,
      );
    }

    if (dto.apiEndpoint !== undefined) {
      config.apiEndpoint = dto.apiEndpoint;
    }

    if (dto.apiKey !== undefined) {
      config.apiKeyEnc = this.encryptApiKey(dto.apiKey);
    }

    if (dto.modelName !== undefined) {
      config.modelName = dto.modelName;
    }

    if (dto.isActive !== undefined) {
      config.isActive = dto.isActive;
    }

    if (dto.responseFormat !== undefined) {
      config.responseFormat = dto.responseFormat;
    }

    return this.aiConfigRepo.save(config);
  }

  async testConfig(
    id: string,
    userId: string,
  ): Promise<{ success: boolean; message: string; latencyMs: number }> {
    const config = await this.aiConfigRepo.findOne({
      where: { id, userId },
    });

    if (!config) {
      throw new NotFoundException(
        `AI configuration with id ${id} not found`,
      );
    }

    const decryptedKey = this.decryptApiKey(config.apiKeyEnc);
    const adapterConfig = {
      provider: config.provider,
      responseFormat: config.responseFormat || config.provider,
      apiKey: decryptedKey,
      apiEndpoint: config.apiEndpoint,
      modelName: config.modelName,
    };

    const startTime = Date.now();

    try {
      let success: boolean;

      if (config.purpose === AIPurpose.TEXT) {
        const adapter =
          this.adapterFactory.createTextGenerator(adapterConfig);
        success = await adapter.testConnection();
      } else {
        const adapter =
          this.adapterFactory.createImageGenerator(adapterConfig);
        success = await adapter.testConnection();
      }

      const latencyMs = Date.now() - startTime;

      return {
        success,
        message: success
          ? 'Connection successful'
          : 'Connection test returned empty response',
        latencyMs,
      };
    } catch (error: any) {
      const latencyMs = Date.now() - startTime;

      // Extract meaningful error message from various error formats
      let errorMessage = 'Unknown error';
      if (error?.status && error?.message) {
        // OpenAI SDK error format: { status: 401, message: '...' }
        errorMessage = `HTTP ${error.status}: ${error.message}`;
      } else if (error?.response?.data?.error?.message) {
        // Axios-style nested error
        errorMessage = error.response.data.error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      this.logger.warn(
        `AI config test failed for config ${id}: ${errorMessage}`,
      );

      return {
        success: false,
        message: errorMessage,
        latencyMs,
      };
    }
  }

  encryptApiKey(key: string): string {
    const secret = this.getEncryptionSecret();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      this.encryptionAlgorithm,
      Buffer.from(secret, 'hex'),
      iv,
    );

    let encrypted = cipher.update(key, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return `${iv.toString('hex')}:${encrypted}`;
  }

  decryptApiKey(encrypted: string): string {
    const secret = this.getEncryptionSecret();
    const [ivHex, encryptedData] = encrypted.split(':');

    if (!ivHex || !encryptedData) {
      throw new Error('Invalid encrypted API key format');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(
      this.encryptionAlgorithm,
      Buffer.from(secret, 'hex'),
      iv,
    );

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  private getEncryptionSecret(): string {
    const secret = this.configService.get<string>(
      'AI_KEY_ENCRYPTION_SECRET',
    );

    if (!secret) {
      throw new Error(
        'AI_KEY_ENCRYPTION_SECRET is not configured. ' +
          'Please set a 32-byte hex string (64 hex characters) in your environment.',
      );
    }

    return secret;
  }
}

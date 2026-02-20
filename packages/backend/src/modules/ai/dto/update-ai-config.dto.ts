import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, IsBoolean, IsIn } from 'class-validator';

export class UpdateAIConfigDto {
  @ApiPropertyOptional({
    example: 'https://api.openai.com/v1',
    description: 'API endpoint URL',
  })
  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: false })
  apiEndpoint?: string;

  @ApiPropertyOptional({
    example: 'sk-xxxxxxxxxxxx',
    description: 'API key for the provider',
  })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({
    example: 'gpt-4o',
    description: 'Model name to use',
  })
  @IsOptional()
  @IsString()
  modelName?: string;

  @ApiPropertyOptional({
    example: 'openai',
    description: 'Response format type for parsing API responses',
    enum: ['openai', 'openai-stream', 'claude', 'gemini', 'dall-e'],
  })
  @IsOptional()
  @IsIn(['openai', 'openai-stream', 'claude', 'gemini', 'dall-e'])
  responseFormat?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this configuration is active',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

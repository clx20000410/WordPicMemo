import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsString, IsOptional, IsUrl } from 'class-validator';

export class CreateAIConfigDto {
  @ApiProperty({
    example: 'text',
    description: 'Purpose of the AI configuration',
    enum: ['text', 'image'],
  })
  @IsIn(['text', 'image'])
  purpose: 'text' | 'image';

  @ApiPropertyOptional({
    example: 'custom',
    description: 'AI provider name (optional, defaults to custom)',
    enum: ['openai', 'claude', 'zhipu', 'doubao', 'custom'],
  })
  @IsOptional()
  @IsIn(['openai', 'claude', 'zhipu', 'doubao', 'custom'])
  provider?: 'openai' | 'claude' | 'zhipu' | 'doubao' | 'custom';

  @ApiProperty({
    example: 'openai',
    description: 'Response format type for parsing API responses',
    enum: ['openai', 'openai-stream', 'claude', 'gemini', 'dall-e'],
  })
  @IsIn(['openai', 'openai-stream', 'claude', 'gemini', 'dall-e'])
  responseFormat: 'openai' | 'openai-stream' | 'claude' | 'gemini' | 'dall-e';

  @ApiProperty({
    example: 'https://api.openai.com/v1',
    description: 'API endpoint URL',
  })
  @IsString()
  apiEndpoint: string;

  @ApiProperty({
    example: 'sk-xxxxxxxxxxxx',
    description: 'API key for the provider',
  })
  @IsString()
  apiKey: string;

  @ApiProperty({
    example: 'gpt-4o',
    description: 'Model name to use',
  })
  @IsString()
  modelName: string;
}

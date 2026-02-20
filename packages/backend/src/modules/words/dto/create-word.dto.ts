import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsOptional, IsIn } from 'class-validator';

export class CreateWordDto {
  @ApiProperty({ example: 'ephemeral', description: 'The word to memorize' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  word: string;

  @ApiPropertyOptional({
    example: 'en',
    description: 'Language of the word',
    enum: ['en', 'ja', 'ko', 'fr', 'de', 'es'],
    default: 'en',
  })
  @IsOptional()
  @IsString()
  @IsIn(['en', 'ja', 'ko', 'fr', 'de', 'es'])
  language?: string = 'en';
}

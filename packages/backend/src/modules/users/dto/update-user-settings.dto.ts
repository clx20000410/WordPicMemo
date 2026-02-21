import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateUserSettingsDto {
  @ApiPropertyOptional({
    example:
      'Create a vivid, colorful illustration in a whimsical cartoon style that depicts the following scene related to the English word.',
    description: 'Custom prompt template for image generation',
  })
  @IsOptional()
  @IsString()
  imagePromptTemplate?: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({
    example: '今天学了一个很有意思的概念...',
    description: 'Note text content',
    maxLength: 20000,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(20000)
  content: string;

  @ApiPropertyOptional({
    description: 'Optional uploaded image as data URL',
    example: 'data:image/jpeg;base64,/9j/4AAQSk...',
    maxLength: 8000000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(8000000)
  imageDataUrl?: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({
    example: '产品发布复盘',
    description: 'Note title shown in lists and review cards',
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title: string;

  @ApiProperty({
    example: '## 复盘要点\n- 用户反馈\n- 发布节奏\n\n> 下次优化提醒链路',
    description: 'Rich text content (markdown/plain text/html all accepted)',
    maxLength: 20000,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(20000)
  content: string;

  @ApiPropertyOptional({
    description: 'Optional uploaded image as data URL or remote URL',
    example: 'data:image/jpeg;base64,/9j/4AAQSk...',
    maxLength: 8000000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(8000000)
  imageDataUrl?: string;
}


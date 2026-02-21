import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Matches } from 'class-validator';

export class ReviewQueryDto {
  @ApiPropertyOptional({
    description: 'Review tab filter',
    enum: ['unreviewed', 'reviewed'],
    default: 'unreviewed',
  })
  @IsOptional()
  @IsString()
  @IsIn(['unreviewed', 'reviewed'])
  status?: 'unreviewed' | 'reviewed' = 'unreviewed';

  @ApiPropertyOptional({
    description: 'Filter by scheduled date (YYYY-MM-DD)',
    example: '2026-02-21',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be in YYYY-MM-DD format' })
  date?: string;
}


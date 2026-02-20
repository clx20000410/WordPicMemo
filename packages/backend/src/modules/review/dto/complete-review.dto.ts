import { IsBoolean, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompleteReviewDto {
  @ApiProperty({
    description: 'Whether the user remembered the word',
    example: true,
  })
  @IsBoolean()
  remembered: boolean;

  @ApiProperty({
    description: 'Confidence level from 1 (lowest) to 5 (highest)',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  confidence: number;
}

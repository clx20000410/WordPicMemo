import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: 'User password (min 8 characters)' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'JohnDoe', description: 'User nickname (2-30 characters)' })
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  nickname: string;

  @ApiPropertyOptional({ example: 'Asia/Shanghai', description: 'User timezone (IANA format)' })
  @IsOptional()
  @IsString()
  timezone?: string;
}

import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('settings')
  @ApiOperation({ summary: 'Get current user settings' })
  async getSettings(@CurrentUser() user: CurrentUserPayload) {
    return this.usersService.getSettings(user.userId);
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update current user settings' })
  async updateSettings(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateUserSettingsDto,
  ) {
    return this.usersService.updateSettings(user.userId, dto);
  }
}

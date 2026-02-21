import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import {
  UserSettings,
  DEFAULT_IMAGE_PROMPT_TEMPLATE,
} from '@wordpicmemo/shared';
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async create(data: {
    email: string;
    passwordHash: string;
    nickname: string;
    timezone?: string;
  }): Promise<User> {
    const user = this.usersRepository.create(data);
    return this.usersRepository.save(user);
  }

  async updateProfile(
    id: string,
    data: Partial<{ nickname: string; timezone: string }>,
  ): Promise<User> {
    await this.usersRepository.update(id, data);
    return this.usersRepository.findOneOrFail({ where: { id } });
  }

  async getSettings(userId: string): Promise<UserSettings> {
    const user = await this.usersRepository.findOneOrFail({
      where: { id: userId },
    });
    return {
      imagePromptTemplate:
        user.imagePromptTemplate ?? DEFAULT_IMAGE_PROMPT_TEMPLATE,
    };
  }

  async updateSettings(
    userId: string,
    dto: UpdateUserSettingsDto,
  ): Promise<UserSettings> {
    const updateData: Partial<User> = {};
    if (dto.imagePromptTemplate !== undefined) {
      updateData.imagePromptTemplate = dto.imagePromptTemplate;
    }
    if (Object.keys(updateData).length > 0) {
      await this.usersRepository.update(userId, updateData);
    }
    const user = await this.usersRepository.findOneOrFail({
      where: { id: userId },
    });
    return {
      imagePromptTemplate:
        user.imagePromptTemplate ?? DEFAULT_IMAGE_PROMPT_TEMPLATE,
    };
  }
}

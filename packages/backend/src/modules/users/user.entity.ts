import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Word } from '../words/word.entity';
import { AIConfiguration } from '../ai/ai-configuration.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar' })
  passwordHash: string;

  @Column({ type: 'varchar' })
  nickname: string;

  @Column({ type: 'varchar', default: 'UTC' })
  timezone: string;

  @Column({
    name: 'image_prompt_template',
    type: 'text',
    nullable: true,
    default: null,
  })
  imagePromptTemplate: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => Word, (word) => word.user)
  words: Word[];

  @OneToMany(() => AIConfiguration, (config) => config.user)
  aiConfigurations: AIConfiguration[];
}

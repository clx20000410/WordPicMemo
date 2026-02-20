import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum AIPurpose {
  TEXT = 'text',
  IMAGE = 'image',
}

export enum AIProvider {
  OPENAI = 'openai',
  CLAUDE = 'claude',
  ZHIPU = 'zhipu',
  DOUBAO = 'doubao',
  CUSTOM = 'custom',
}

export enum ResponseFormat {
  OPENAI = 'openai',
  OPENAI_STREAM = 'openai-stream',
  CLAUDE = 'claude',
  GEMINI = 'gemini',
  DALL_E = 'dall-e',
}

@Entity('ai_configurations')
export class AIConfiguration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'enum', enum: AIPurpose })
  purpose: AIPurpose;

  @Column({ type: 'enum', enum: AIProvider, default: AIProvider.CUSTOM })
  provider: AIProvider;

  @Column({ name: 'response_format', type: 'varchar', nullable: true })
  responseFormat: string | null;

  @Column({ name: 'api_endpoint', type: 'varchar' })
  apiEndpoint: string;

  @Column({ name: 'api_key_enc', type: 'varchar' })
  apiKeyEnc: string;

  @Column({ name: 'model_name', type: 'varchar' })
  modelName: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.aiConfigurations)
  @JoinColumn({ name: 'user_id' })
  user: User;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Word } from '../words/word.entity';
import { User } from '../users/user.entity';

export enum ReviewStatus {
  PENDING = 'pending',
  DUE = 'due',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
  SKIPPED = 'skipped',
}

@Entity('review_schedules')
@Index(['userId', 'status', 'scheduledAt'])
export class ReviewSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'word_id', type: 'uuid' })
  wordId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'smallint' })
  stage: number;

  @Column({ name: 'scheduled_at', type: 'timestamp' })
  scheduledAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({
    type: 'enum',
    enum: ReviewStatus,
    default: ReviewStatus.PENDING,
  })
  status: ReviewStatus;

  @Column({ type: 'boolean', nullable: true })
  remembered: boolean | null;

  @Column({ type: 'smallint', nullable: true })
  confidence: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => Word, (word) => word.reviewSchedules)
  @JoinColumn({ name: 'word_id' })
  word: Word;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { WordExplanation } from './word-explanation.entity';
import { ReviewSchedule } from '../review/review-schedule.entity';

@Entity('words')
export class Word {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 100 })
  word: string;

  @Column({ type: 'varchar', length: 5, default: 'en' })
  language: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.words)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToOne(() => WordExplanation, (explanation) => explanation.word, {
    eager: true,
    cascade: true,
    onDelete: 'CASCADE',
  })
  explanation: WordExplanation;

  @OneToMany(() => ReviewSchedule, (schedule) => schedule.word, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  reviewSchedules: ReviewSchedule[];
}

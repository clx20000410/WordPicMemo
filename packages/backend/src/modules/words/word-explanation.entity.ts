import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Word } from './word.entity';

export enum ImageStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum ExplanationStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface WordBreakdownPart {
  part: string;
  meaning: string;
  origin?: string;
}

export interface ExampleSentence {
  en: string;
  zh: string;
}

@Entity('word_explanations')
export class WordExplanation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'word_id', type: 'uuid', unique: true })
  wordId: string;

  @Column({ type: 'varchar', nullable: true })
  pronunciation: string | null;

  @Column({ name: 'word_breakdown', type: 'jsonb', nullable: true })
  wordBreakdown: WordBreakdownPart[] | null;

  @Column({ name: 'mnemonic_phrase', type: 'text', nullable: true })
  mnemonicPhrase: string | null;

  @Column({ name: 'core_definition', type: 'text', nullable: true })
  coreDefinition: string | null;

  @Column({ name: 'example_sentences', type: 'jsonb', nullable: true })
  exampleSentences: ExampleSentence[] | null;

  @Column({ name: 'memory_scene', type: 'text', nullable: true })
  memoryScene: string | null;

  @Column({ name: 'image_prompt', type: 'text', nullable: true })
  imagePrompt: string | null;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl: string | null;

  @Column({
    name: 'image_status',
    type: 'enum',
    enum: ImageStatus,
    default: ImageStatus.PENDING,
  })
  imageStatus: ImageStatus;

  @Column({
    name: 'explanation_status',
    type: 'enum',
    enum: ExplanationStatus,
    default: ExplanationStatus.PENDING,
  })
  explanationStatus: ExplanationStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @OneToOne(() => Word, (word) => word.explanation)
  @JoinColumn({ name: 'word_id' })
  word: Word;
}

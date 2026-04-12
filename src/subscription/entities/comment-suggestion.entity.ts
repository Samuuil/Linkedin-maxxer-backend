import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities';
import { CommentSuggestionStatus } from '../enums';

@Entity('comment_suggestions')
export class CommentSuggestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'linkedin_post_id' })
  linkedinPostId: string;

  @Column({ name: 'linkedin_username' })
  linkedinUsername: string;

  @Column({ name: 'post_description', type: 'text' })
  postDescription: string;

  @Column({ name: 'suggested_comment', type: 'text' })
  suggestedComment: string;

  @Column({
    type: 'enum',
    enum: CommentSuggestionStatus,
    default: CommentSuggestionStatus.PENDING,
  })
  status: CommentSuggestionStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

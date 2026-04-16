import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Exclude()
  @Column({ nullable: true })
  password: string;

  @Column({ name: 'linkedin_username', nullable: true })
  linkedinUsername: string;

  @Column({ name: 'linkedin_sub', unique: true, nullable: true })
  linkedinSub: string;

  @Column({ name: 'push_token', nullable: true })
  pushToken: string | null;

  @Column({ name: 'oficial_token', nullable: true })
  oficialToken: string;

  @Column({ name: 'unofficial_token', nullable: true })
  unofficialToken: string;

  @Column({ name: 'linkedin_email', nullable: true })
  linkedinEmail: string;

  @Exclude()
  @Column({ name: 'linkedin_password', nullable: true })
  linkedinPassword: string;

  @Exclude()
  @Column({ name: 'token_version', default: 0 })
  tokenVersion: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'linkedin_username', nullable: true })
  linkedinUsername: string;

  @Column({ name: 'linkedin_refresh_token', nullable: true })
  linkedinRefreshToken: string;

  @Column({ name: 'linkedin_sub', unique: true, nullable: true })
  linkedinSub: string;

  @Column({ name: 'push_token', nullable: true })
  pushToken: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

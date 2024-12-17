import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { createId } from '@paralleldrive/cuid2';

@Entity('accounts')
export class Accounts {
  @PrimaryColumn()
  id: string = `act_${createId()}`;

  @ManyToOne(() => User, (user) => user.accounts, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user: User;

  @Column({ type: 'varchar', length: 50 })
  type: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  provider: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  provider_account_id: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  refresh_token: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  access_token: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  token_type: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  scope: string;

  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

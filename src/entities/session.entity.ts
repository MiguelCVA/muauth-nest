import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { createId } from '@paralleldrive/cuid2';
import { User } from './user.entity';

@Entity('sessions')
export class Sessions {
  @PrimaryColumn()
  id: string = `sess_${createId()}`;

  @ManyToOne(() => User, (user) => user.sessions, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  user: User;

  @Column()
  session_token: string = `stkn_${createId()}`;

  @Column()
  refresh_token: string = `rtkn_${createId()}`;

  @Column()
  session_token_expires: Date = new Date(Date.now() + 5 * 60 * 1000);

  @Column()
  refresh_token_expires: Date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

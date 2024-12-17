import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { createId } from '@paralleldrive/cuid2';

@Entity('verification_token')
export class VerificationToken {
  @PrimaryColumn()
  id: string = `vt_${createId()}`;

  @Column()
  identifier: string;

  @Column({ unique: true })
  token: string = createId();

  @Column()
  expiresAt: Date = new Date(Date.now() + 5 * 60 * 1000);

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

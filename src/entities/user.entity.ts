import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { createId } from '@paralleldrive/cuid2';
import { Accounts } from './account.entity';
import { Sessions } from './session.entity';

enum ROLE {
  OWNER,
  SUPER_ADMIN,
  ADMIN,
  CLIENT,
}

@Entity('users')
export class User {
  @PrimaryColumn()
  id: string = `usr_${createId()}`;

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone?: string;

  @Column()
  email_verified: boolean = false;

  @Column({
    type: 'enum',
    enum: ROLE,
    default: ROLE.CLIENT,
  })
  role: ROLE;

  @OneToMany(() => Accounts, (accounts) => accounts.user)
  accounts: Accounts[];

  @OneToMany(() => Sessions, (sessions) => sessions.user)
  sessions: Sessions[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

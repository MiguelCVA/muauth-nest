import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { LessThan, Repository } from 'typeorm';
import { Accounts, Sessions, User } from 'src/entities';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { ResendService } from 'nestjs-resend';
import { Env } from 'src/config/env';
import { RedisService } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';
import { createId } from '@paralleldrive/cuid2';
import { Profile as GithubProfile } from 'passport-github2';
import { CreateAuthDto } from './dto/create-auth.dto';
import { JwtService } from '@nestjs/jwt';

type AuthProvider = 'magic-link' | 'oauth' | 'github';

interface AuthenticationResult {
  session_token: string;
  session_token_expires: Date;
  isNewUser: boolean;
}

@Injectable()
export class AuthService {
  private readonly redis: Redis;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Sessions)
    private readonly sessionRepository: Repository<Sessions>,
    @InjectRepository(Accounts)
    private readonly accountRepository: Repository<Accounts>,
    @Inject()
    private readonly env: ConfigService<Env, true>,
    private readonly resendService: ResendService,
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
  ) {
    this.redis = this.redisService.getOrThrow();
  }

  async authenticate(createAuthDto: CreateAuthDto) {
    const { email } = createAuthDto;
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const existingUser = await this.userRepository.findOne({
      where: { email },
      relations: ['accounts'],
    });

    if (existingUser?.accounts?.some((acc) => acc.provider !== 'magic-link')) {
      throw new ConflictException(
        `This email is already registered with a different authentication method. Please sign in using ${existingUser.accounts[0].provider}.`,
      );
    }

    return await this.handleEmailAuthentication(email);
  }

  private async handleEmailAuthentication(email: string) {
    const verificationToken = await this.createVerificationToken(email);
    await this.sendMagicLink(email, verificationToken);
    return { message: 'Magic link sent successfully' };
  }

  private async createVerificationToken(identifier: string): Promise<string> {
    const token = createId();
    const VERIFICATION_TOKEN_EXPIRY = 600;

    await this.redis.set(
      `verification:${token}`,
      identifier,
      'EX',
      VERIFICATION_TOKEN_EXPIRY,
    );

    return token;
  }

  private async sendMagicLink(email: string, token: string): Promise<void> {
    const magicLink = `${this.env.get('FRONTEND_URL')}/verify/${token}`;

    if (this.env.get('NODE_ENV') === 'development') {
      console.log('Magic Link:', magicLink);
      return;
    }

    await this.resendService.emails.send({
      from: this.env.get('MAGIC_EMAIL_FROM'),
      to: email,
      subject: 'Sign in to Your App',
      html: `<p>Click <a href="${magicLink}">here</a> to sign in. This link expires in 10 minutes.</p>`,
    });
  }

  private async findOrCreateUser(
    email: string,
    additionalData: Partial<User> = {},
  ): Promise<{ user: User; isNewUser: boolean }> {
    let user = await this.userRepository.findOne({
      where: { email },
      relations: ['accounts'],
    });

    const isNewUser = !user;

    if (!user) {
      user = this.userRepository.create({
        email,
        ...additionalData,
      });
      user = await this.userRepository.save(user);
    }

    return { user, isNewUser };
  }

  private async linkAccount(
    user: User,
    provider: AuthProvider,
    providerAccountId: string,
    type: string,
  ): Promise<Accounts> {
    const existingAccount = await this.accountRepository.findOne({
      where: {
        provider,
        provider_account_id: providerAccountId,
      },
      relations: ['user'],
    });

    if (existingAccount) {
      if (existingAccount.user.id !== user.id) {
        throw new ConflictException(
          'This account is already linked to a different user',
        );
      }
      return existingAccount;
    }

    const newAccount = this.accountRepository.create({
      user,
      provider,
      type,
      provider_account_id: providerAccountId,
    });

    return await this.accountRepository.save(newAccount);
  }

  private async createUserSession(user: User): Promise<Sessions> {
    await this.sessionRepository.delete({
      user: { id: user.id },
      session_token_expires: LessThan(new Date()),
    });

    const session = this.sessionRepository.create({
      user,
    });

    return this.sessionRepository.save(session);
  }

  async validate(token: string): Promise<AuthenticationResult> {
    const email = await this.redis.getdel(`verification:${token}`);
    if (!email) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    const { user, isNewUser } = await this.findOrCreateUser(email, {
      email_verified: true,
    });

    await this.linkAccount(user, 'magic-link', user.id, 'magic-link');
    const session = await this.createUserSession(user);

    const jwt = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      session_token: session.id,
      session_token_expires: session.session_token_expires,
    });

    return {
      session_token: jwt,
      session_token_expires: session.session_token_expires,
      isNewUser,
    };
  }

  async validateToken(sessionToken: string): Promise<Sessions> {
    const session = await this.sessionRepository.findOne({
      where: { session_token: sessionToken },
      relations: ['user'],
    });

    if (!session) {
      throw new UnauthorizedException('Invalid session token');
    }

    if (new Date(session.session_token_expires) < new Date()) {
      await this.sessionRepository.remove(session);
      throw new UnauthorizedException('Session expired');
    }

    return session;
  }

  async validateSignInFromGithub(
    profile: GithubProfile,
  ): Promise<AuthenticationResult> {
    if (!profile.emails?.length) {
      throw new BadRequestException('Email access is required');
    }

    const email = profile.emails[0].value;
    const [firstName, ...lastNameParts] = profile.displayName?.split(' ') || [
      '',
    ];
    const lastName = lastNameParts.join(' ');

    const { user, isNewUser } = await this.findOrCreateUser(email, {
      email_verified: true,
      firstName,
      lastName,
    });

    await this.linkAccount(user, 'github', profile.id, 'oauth');
    const session = await this.createUserSession(user);

    const jwt = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      session_token: session.id,
      session_token_expires: session.session_token_expires,
    });

    return {
      session_token: jwt,
      session_token_expires: session.session_token_expires,
      isNewUser,
    };
  }
}

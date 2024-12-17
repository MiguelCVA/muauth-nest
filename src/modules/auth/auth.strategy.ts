import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-github2';
import { Env } from 'src/config/env';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    @Inject()
    env: ConfigService<Env, true>,
  ) {
    super({
      clientID: env.get('GITHUB_CLIENT_ID'),
      clientSecret: env.get('GITHUB_CLIENT_SECRET'),
      callbackURL: env.get('GITHUB_CALLBACK_URL'),
      scope: ['user:email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ) {
    if (!profile || !profile.emails?.length) {
      throw new UnauthorizedException('Unable to access GitHub email address');
    }
    return profile;
  }
}

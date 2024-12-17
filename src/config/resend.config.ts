import { ConfigService, registerAs } from '@nestjs/config';
import { Env } from './env';

export const resendConfig = registerAs('resend', () => ({
  apiKey: new ConfigService<Env, true>().get('RESEND_API_KEY'),
}));

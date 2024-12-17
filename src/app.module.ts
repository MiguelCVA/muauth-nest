import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { Env, envSchema } from './config/env';
import { resendConfig } from './config/resend.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResendModule } from 'nestjs-resend';
import { AuthModule } from './modules/auth/auth.module';
import { RedisModule } from '@liaoliaots/nestjs-redis';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),

    ConfigModule.forRoot({
      validate: (env) => envSchema.parse(env),
      load: [resendConfig],
      isGlobal: true,
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      url: new ConfigService<Env, true>().get('DATABASE_URL'),
      entities: [__dirname + '/**/*.entity{.js,.ts}'],
      synchronize: true,
      logging: true,
      autoLoadEntities: true,
    }),

    RedisModule.forRoot({
      config: {
        url: new ConfigService<Env, true>().get('REDIS_URL'),
      },
    }),

    ResendModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        apiKey: configService.get('resend.apiKey'),
      }),
      inject: [ConfigService],
    }),

    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

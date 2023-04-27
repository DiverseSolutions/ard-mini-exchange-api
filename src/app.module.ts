import { Module } from '@nestjs/common';
import type { RedisClientOptions } from 'redis';
import { ConfigModule } from '@nestjs/config';
import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UtilsModule } from './utils/utils.module';
import { HealthModule } from './health/health.module';
import { UserModule } from './user/user.module';
import { MarketModule } from './market/market.module';
import { OrderModule } from './order/order.module';
import { BalanceModule } from './balance/balance.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env'
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '3600s' },
    }),
    CacheModule.register<RedisClientOptions>({
      // @ts-ignore
      store: redisStore,
      host: 'localhost',
      port: 6379,
      password: process.env.REDIS_PWD,
    }),
    AuthModule,
    PrismaModule,
    UtilsModule,
    HealthModule,
    UserModule,
    MarketModule,
    OrderModule,
    BalanceModule,
  ],
  controllers: [],
  providers: [AppService, 
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
],
})
export class AppModule {}

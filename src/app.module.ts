import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
import { CmsModule } from './cms/cms.module';

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
    AuthModule,
    PrismaModule,
    UtilsModule,
    HealthModule,
    UserModule,
    MarketModule,
    OrderModule,
    BalanceModule,
    CmsModule,
  ],
  controllers: [],
  providers: [AppService,
],
})
export class AppModule {}

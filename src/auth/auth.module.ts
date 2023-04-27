import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { RegisterService } from './register/register.service';
import { LoginService } from './login/login.service';
import { UtilsModule } from 'src/utils/utils.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    UtilsModule, 
    ConfigModule.forRoot({
      envFilePath: '.env'
    }), 
    PrismaModule,
    PassportModule.register({
      defaultStrategy: 'jwt'
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '3600s' },
    }),
    UserModule,
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, RegisterService, LoginService, {
    provide: "APP_GUARD",
    useClass: JwtAuthGuard,
  }],
  exports: []
})
export class AuthModule {}

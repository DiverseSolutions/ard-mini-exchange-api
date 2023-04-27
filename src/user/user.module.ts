import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { BalanceModule } from 'src/balance/balance.module';

@Module({
  controllers: [UserController],
  imports: [BalanceModule],
  providers: [],
  exports: [BalanceModule]
})
export class UserModule {}

import { Module } from '@nestjs/common';
import { BalanceService } from './balance.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { BalanceController } from './balance.controller';
import { BalanceLogService } from './balance-log/balance-log.service';

@Module({
  imports: [PrismaModule],
  providers: [BalanceService, BalanceLogService],
  exports: [BalanceService, BalanceLogService],
  controllers: [BalanceController]
})
export class BalanceModule {}

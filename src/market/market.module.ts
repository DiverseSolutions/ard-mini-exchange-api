import { Module } from '@nestjs/common';
import { MarketController } from './market.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [MarketController],
  imports: [PrismaModule]
})
export class MarketModule {}

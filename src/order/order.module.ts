import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { OrderController } from './order.controller';
import { UserModule } from 'src/user/user.module';
import { MarketOrderService } from './market-order/market-order.service';

@Module({
    imports: [PrismaModule, UserModule],
    controllers: [OrderController],
    providers: [MarketOrderService],
})
export class OrderModule {}

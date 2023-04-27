import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MarketOrderDto } from 'src/auth/dto/order-place.dto';

import { MarketOrderService } from './market-order/market-order.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderSide } from 'src/auth/enums/order-side.enum';
import { Prisma } from '@prisma/client';
import { OrderStatus } from 'src/auth/enums/order-status.enum';

@Controller('order')
@ApiTags('Order')
@ApiBearerAuth()
export class OrderController {

    constructor(private readonly marketOrderService: MarketOrderService, private readonly prisma: PrismaService) {

    }

    @Post("/market")
    async order(@Body() request: MarketOrderDto, @Req() req) {
        return await this.marketOrderService.executeOrder(request, req);
    }

    @Get("/history")
    async history(@Req() req) {
        const userId = BigInt(req.user.id)
        const result = await this.prisma.$queryRaw<{
            symbol: string,
            name: string,
            side: OrderSide,
            price: Prisma.Decimal,
            qty: Prisma.Decimal,
            total: Prisma.Decimal,
            created_at: Date,
            status: OrderStatus
        }[]>`select 
        b.symbol,
        b."name",
        o.side,
        o.price,
        o.qty,
        o.total,
        o.created_at,
        o.status 
        from orders o 
        join assets b on b.asset_id = o.base_asset_id
        join assets q on q.asset_id = o.quote_asset_id
        where o.user_id = ${userId}
        order by o.order_id asc`
        const formatted = result.map((o) => ({
            symbol: o.symbol,
            name: o.name,
            side: o.side,
            price: o.price.toNumber(),
            qty: o.qty.toNumber(),
            total: o.total.toNumber(),
            createdAt: o.created_at,
            status: o.status
        }))
        return {
            pagination: {
                total: result.length,
                offset: 0,
                size: result.length,
            },
            data: formatted
        }
    }
}

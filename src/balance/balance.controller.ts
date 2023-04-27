import { Controller, Get, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import BigNumber from 'bignumber.js';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('balance')
@ApiTags("Balance")
@ApiBearerAuth()
export class BalanceController {

    constructor(private readonly prisma: PrismaService) {

    }

    @Get("/all")
    async allBalance(@Req() req) {
        const balances = await this.prisma.$queryRaw<{
            symbol: string,
            name: string,
            balance_avl: Prisma.Decimal,
            balance_hold: Prisma.Decimal,
        }[]>`select
        a.symbol,
        a."name",
        coalesce(ub.balance_avl, 0) as balance_avl,
        coalesce(ub.balance_hold, 0) as balance_hold
        from assets a 
        left join user_balances ub on ub.asset_id = a.asset_id 
        where ub.user_id = ${BigInt(req.user.id)} or ub is null
        order by ub.balance_avl is null asc, ub.balance_avl desc`

        const formatted = balances.map((b) => ({
            symbol: b.symbol,
            name: b.name,
            balanceAvl: b.balance_avl.toNumber(),
            balanceHold: b.balance_hold.toNumber(),
        }))

        return {
            pagination: {
                total: formatted.length,
                size: formatted.length,
                offset: 0,
            },
            data: formatted,
        }
    }

    @Get("/total-mnt")
    async getBalance(@Req() req) {
        const userId = BigInt(req.user.id)
        const totalBalance = await this.prisma.$queryRaw<{
            balance_avl: Prisma.Decimal
        }[]>`select
        sum(coalesce(ub.balance_avl, 0) * coalesce(p.price, 1)) as balance_avl
        from assets a 
        left join user_balances ub on ub.asset_id = a.asset_id
        left join asset_prices p on p.base_asset_id = a.asset_id and (now() >= p.since and (p."until" is null or now() <= p."until"))
        where ub.user_id = ${userId} or ub is null`
        return {
            data: {
                totalMnt: totalBalance?.length ? totalBalance[0].balance_avl?.toNumber() || 0 : 0
            }
        }
    }
}

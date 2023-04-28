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
        const userId = BigInt(req.user.id)
        const balances = await this.prisma.$queryRaw<{
            symbol: string,
            name: string,
            balance_avl: Prisma.Decimal,
            balance_hold: Prisma.Decimal,
        }[]>`select 
        t.symbol,
        t."name",
        t.balance_avl
        from (
            select
            a.symbol,
            a."name",
            coalesce((select ub.balance_avl from user_balances ub where ub.user_id = ${userId} and ub.asset_id = a.asset_id), 0) as "balance_avl"
            from assets a
        ) as t
        order by t.balance_avl desc`

        const formatted = balances.map((b) => ({
            symbol: b.symbol,
            name: b.name,
            balanceAvl: b.balance_avl.toNumber(),
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

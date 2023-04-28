import { Controller, Get, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import BigNumber from 'bignumber.js';
import { AssetType } from 'src/auth/enums/asset-type.enum';
import { Status } from 'src/auth/enums/status.enum';
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
            base_symbol: string,
            name: string,
            type: string,
            balance_avl: Prisma.Decimal,
            balance_hold: Prisma.Decimal,
            quote_profit: Prisma.Decimal,
            balance_mnt: Prisma.Decimal,
        }[]>`select 
        t.user_id,
        t."name",
        t."type",
        t.base_symbol,
        t.quote_symbol,
        t.balance_avl,
        t.balance_avl * t."price_mnt" as "balance_mnt",
        (
        (select sum(o.total) from orders o where o.base_asset_id = t.base_asset_id and o.user_id = t.user_id and o.side = 'sell') - (select sum(o.total) from orders o where o.base_asset_id = t.base_asset_id and o.user_id = t.user_id and o.side = 'buy')
        ) as "quote_profit"
        from (
            select 
            t.user_id,
            t."name",
            t."type",
            t.base_symbol,
            t.quote_symbol,
            t.balance_avl,
            t.base_asset_id,
            (case
                when "interval_price" is null 
                then (
                    select p.price from asset_prices p 
                        where p.base_symbol = t.base_symbol 
                        and p.quote_symbol = t.quote_symbol
                        order by p."until" desc
                        limit 1
                )
                else "interval_price"
                end
            ) as "price_mnt"
            from (
                select
                ub.user_id,
                b."type" as "type",
                b."name" as "name",
                b.symbol as "base_symbol",
                q.symbol as "quote_symbol",
                b.asset_id as "base_asset_id",
                ub.balance_avl,
                (case when b."type" != 'fiat' then (
                    select p2.price 
                    from asset_prices p2 
                    where p2.quote_symbol = q.symbol 
                    and p2.base_symbol = b.symbol 
                    and now() >= p2.since 
                    and now() < p2."until"
                    order by p2."until" desc 
                    limit 1
                ) else 1 end) as "interval_price"
                from 
                user_balances ub 
                join assets b on ub.asset_id = b.asset_id
                join assets q on q.symbol = 'MNT'
                where ub.user_id = ${userId}
            ) as t
        ) as t order by balance_mnt desc`

        const emptyBalanceAssets = await this.prisma.assets.findMany({
            where: {
                symbol: {
                    notIn: balances.map((b) => b.base_symbol)
                },
                type: AssetType.Stock,
                status: Status.Active
            },
            select: {
                symbol: true,
                name: true,
                type: true,
            }
        })

        const formatted = balances.map((b) => ({
            symbol: b.base_symbol,
            name: b.name,
            balanceMnt: b.balance_mnt.toNumber(),
            quoteProfit: b.quote_profit ? b.quote_profit.toNumber() : 0,
            balanceAvl: b.balance_avl.toNumber(),
            type: b.type,
        }))

        emptyBalanceAssets.forEach((eb) => {
            formatted.push({
                symbol: eb.symbol,
                name: eb.name,
                balanceMnt: 0,
                quoteProfit: 0,
                balanceAvl: 0,
                type: eb.type
            })
        })

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
            total_balance_mnt: Prisma.Decimal
        }[]>`select sum(t.balance_mnt) as "total_balance_mnt" from (
            select
            t.balance_avl * t."price_mnt" as "balance_mnt"
            from (
                select
                t.balance_avl,
                (case
                    when "interval_price" is null 
                    then (
                        select p.price from asset_prices p 
                            where p.base_symbol = t.base_symbol 
                            and p.quote_symbol = t.quote_symbol
                            order by p."until" desc
                            limit 1
                    )
                    else "interval_price"
                    end
                ) as "price_mnt"
                from (
                    select
                    ub.user_id,
                    b."type" as "type",
                    b."name" as "name",
                    b.symbol as "base_symbol",
                    q.symbol as "quote_symbol",
                    b.asset_id as "base_asset_id",
                    ub.balance_avl,
                    (case when b."type" != 'fiat' then (
                        select p2.price 
                        from asset_prices p2 
                        where p2.quote_symbol = q.symbol 
                        and p2.base_symbol = b.symbol 
                        and now() >= p2.since 
                        and now() < p2."until"
                        order by p2."until" desc 
                        limit 1
                    ) else 1 end) as "interval_price"
                    from 
                    user_balances ub 
                    join assets b on ub.asset_id = b.asset_id
                    join assets q on q.symbol = 'MNT'
                    where ub.user_id = ${userId}
                ) as t
            ) as t
        ) as t`
        return {
            data: {
                totalMnt: totalBalance?.length ? totalBalance[0].total_balance_mnt?.toNumber() || 0 : 0
            }
        }
    }
}

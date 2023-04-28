import { PrismaService } from 'src/prisma/prisma.service';
import { Controller, Get } from '@nestjs/common';
import BigNumber from 'bignumber.js'
import { ApiTags } from '@nestjs/swagger';
import { Public } from 'src/auth/public.decorator';
import { Prisma } from '@prisma/client';
import * as moment from 'moment';

@Controller('market')
@ApiTags("Market")
export class MarketController {
    constructor(private readonly prisma: PrismaService) {

    }

    @Public()
    @Get("/")
    async assets() {
        const assets = await this.prisma.$queryRaw<{
            symbol: string,
            name: string,
            display_symbol: string,
            price: Prisma.Decimal,
            prev_price: Prisma.Decimal,
        }[]>`select 
        t.symbol,
        t.display_symbol,
        t."name",
        t.prev_price,
        (case when t.interval_price is not null then t.interval_price 
        else (
            select p.price from asset_prices p where p.base_symbol = t.symbol and p.quote_symbol = t.quote_symbol order by p."until" desc offset 0 limit 1
        ) end) as "price"
        from (
            select
            a.symbol as "symbol",
            a.display_symbol,
            q.symbol as "quote_symbol",
            a."name" as "name",
            (select p.price from asset_prices p where p.base_symbol = a.symbol and p.quote_symbol = q.symbol order by p."until" desc offset 1 limit 1) as "prev_price",
            (select p.price from asset_prices p where p.base_symbol = a.symbol and p.quote_symbol = q.symbol and now() >= p.since and now() < p."until" order by p."until" desc limit 1) as "interval_price"
            from assets a
            join assets q on q.symbol = 'MNT'
            where a."type" = 'stock'
        ) as t
        order by t.symbol != 'AARD', t.symbol asc`
        const formatted = assets.map((a) => ({
            symbol: a.symbol,
            name: a.name,
            displaySymbol: a.display_symbol,
            priceMnt: a.price ? a.price.toNumber() : null,
            isOrderEnabled: a.price ? true : false,
            prevPriceMnt: !a.prev_price ? null : a.prev_price.toNumber(),
            changePercent: !a.prev_price || !a.price ? 0 : ((BigNumber(a.price.toNumber()).minus(BigNumber(a.prev_price.toNumber()))).dividedBy(BigNumber(a.prev_price.toNumber()))).times(100).dp(2).toNumber()
        }));

        return {
            pagination: {
                total: assets.length,
                size: assets.length,
                offset: 0,
            },
            data: formatted,
        }
    }
}

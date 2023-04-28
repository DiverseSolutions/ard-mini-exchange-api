import { PrismaService } from 'src/prisma/prisma.service';
import { Controller, Get } from '@nestjs/common';
import BigNumber from 'bignumber.js'
import { ApiTags } from '@nestjs/swagger';
import { Public } from 'src/auth/public.decorator';
import { Prisma } from '@prisma/client';

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
        a.symbol as "symbol",
        a."name" as "name",
        p.price,
        coalesce((select p2.price
            from asset_prices p2 
            where p2.base_symbol = p.base_symbol 
            and p2.quote_symbol = p.quote_symbol 
            and p2.asset_price_id < p.asset_price_id 
            order by p.asset_price_id desc 
            limit 1), p.price) as "prev_price"
        from assets a
        left join asset_prices p on p.base_symbol = a.symbol and (now() >= p.since and now() < p."until")
        left join assets q on q.symbol = p.quote_symbol 
        where a.status = 'active' and a."type" = 'stock' and (q is null or q.symbol = 'MNT')`
        const formatted = assets.map((a) => ({
            symbol: a.symbol,
            name: a.name,
            displaySymbol: a.display_symbol,
            priceMnt: a.price ? a.price.toNumber() : null,
            isOrderEnabled: a.price ? true : false,
            prevPriceMnt: !a.prev_price ? null : a.prev_price.toNumber(),
            changePercent: !a.prev_price ? 0 : ((BigNumber(a.price.toNumber()).minus(BigNumber(a.prev_price.toNumber()))).dividedBy(BigNumber(a.prev_price.toNumber()))).dp(2).toNumber()
        }));

        return {
            pagination: {
                total: assets.length,
                size: assets.length,
                offset: 0,
            },
            data: formatted
        }
    }
}

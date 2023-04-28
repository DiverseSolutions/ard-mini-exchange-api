import { PrismaService } from 'src/prisma/prisma.service';
import { Controller, Get } from '@nestjs/common';
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
        }[]>`select 
        a.symbol as "symbol",
        a."name" as "name",
        p.price
        from assets a
        left join asset_prices p on p.base_asset_id = a.asset_id and (now() >= p.since and (p."until" is null or now() <= p."until"))
        left join assets q on q.asset_id = p.quote_asset_id 
        where a."type" = 'stock' and (q is null or q.symbol = 'MNT')`

        const formatted = assets.map((a) => ({
            symbol: a.symbol,
            name: a.name,
            displaySymbol: a.display_symbol,
            priceMnt: a.price ? a.price.toNumber() : null,
            isOrderEnabled: a.price ? true : false,
            changePercent: 0
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

import { Controller, Get, HttpException, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { maskPhoneNumber } from "mask-phone-number"
import { Public } from 'src/auth/public.decorator';
import { PrismaService } from 'src/prisma/prisma.service';
import { createDirectus, rest, authentication, readPermissions } from '@directus/sdk';

const directus = createDirectus(process.env.DIRECTUS_URL || "https://mini-exchange-cms.ardsec.mn").with(rest()).with(authentication("json"))

@Controller('leader-board')
@ApiTags('leader-board')
export class LeaderBoardController {

    constructor(private readonly prisma: PrismaService) {

    }

    @Public()
    @Get()
    @ApiQuery({
        name: 'revealAccessToken',
        type: String,
        required: false,
    })
    async leaderBoard(@Query('revealAccessToken') revealAccessToken?: string) {
        let isReveal = false;
        if (revealAccessToken) {
            directus.setToken(revealAccessToken);
            try {
                const permList: any[] = await directus.request(readPermissions())
                const perm = permList.find((p) => p.collection === 'users' && p.action == 'read')
                if (perm) {
                    isReveal = true;
                }
            } catch (e) {
                console.error(e);
            }
        }
        const result = await this.prisma.$queryRaw<{
            phone_number: string,
            total_balance_mnt: string,
        }[]>`select t.phone_number, sum(t.balance_mnt)::int as "total_balance_mnt" from (
            select
            t.phone_number,
            t.balance_avl * t."price_mnt" as "balance_mnt"
            from (
                select 
                t.user_id,
                t.phone_number,
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
                    u.phone_number,
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
                    join users u on u.user_id = ub.user_id 
                ) as t
            ) as t
        ) as t
        group by t.phone_number
        order by "total_balance_mnt" desc
        limit 100`

        return {
            data: result.map((r, i) => ({
                rank: i + 1,
                ...r,
                phone_number: isReveal ? r.phone_number : maskPhoneNumber(r.phone_number)
            })),
        }
    }
}

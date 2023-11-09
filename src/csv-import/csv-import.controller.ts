import csvUtils from '@app/lib/utils/csv-utils';
import { createDirectus, rest, authentication, readPermissions } from '@directus/sdk';
import { Body, Controller, HttpException, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/auth/public.decorator';
import { PrismaService } from 'src/prisma/prisma.service';
import * as moment from 'moment';

const directus = createDirectus(process.env.DIRECTUS_URL || "https://mini-exchange-cms.ardsec.mn").with(rest()).with(authentication("json"))

@Controller('csv-import')
@ApiTags('CSV Import')
export class CsvImportController {

    constructor(
        private readonly prisma: PrismaService,
    ) {

    }

    @Public()
    @Post('/asset-prices')
    @ApiConsumes("multipart/form-data")
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                accessToken: { type: 'accessToken' },
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        }
    })
    @UseInterceptors(FileInterceptor('file'))
    async importAssetPrices(@UploadedFile('file') file: Express.Multer.File, @Body() body: any) {
        const accessToken = body.accessToken;
        directus.setToken(accessToken)
        const permList: any[] = await directus.request(readPermissions())
        const perm = permList.find((p) => p.collection === 'asset_prices' && p.action == 'create')
        if (!perm) {
            throw new HttpException({msg: "Permission denied"}, 400)
        }
        const rows = await csvUtils.getCleanObjectsFromBuffer({
            buffer: file.buffer,
        })
        await this.prisma.$transaction(async (tx) => {
            const promises = await Promise.all(rows.map(async (row) => {
                const mSince = moment(row.since, 'YYYY.MM.DD HH:mm:ss')
                const since = mSince.isValid() ? mSince : null;
                const mUntil = moment(row.until, 'YYYY.MM.DD HH:mm:ss')
                const until = mUntil.isValid() ? mUntil : null;
                if (!since) {
                    throw new HttpException({msg: "\"since\" is missing"}, 400)
                }
                await tx.asset_prices.create({
                    data: {
                        base_symbol: row.base_symbol,
                        quote_symbol: row.quote_symbol,
                        price: parseFloat(row.price),
                        since: since.toDate(),
                        until: until.toDate(),
                        created_at: moment().toDate(),
                        status: 'active',
                    }
                })
            }))
        }, {
            timeout: 30000,
        })
        return {
            msg: "Import success"
        }
    }
}

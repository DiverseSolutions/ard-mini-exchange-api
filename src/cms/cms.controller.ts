import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import * as moment from 'moment';
import { Status } from 'src/auth/enums/status.enum';
import { Public } from 'src/auth/public.decorator';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('cms')
@ApiTags('CMS')
export class CmsController {

    constructor(private readonly prisma: PrismaService) {

    }

    @Get('/news')
    @Public()
    async news() {
        const data = await this.prisma.$queryRaw<{
            title: string;
            content: string;
            filename_disk: string;
            date_created: Date,
        }[]>`select 
        n.title,
        n."content",
        f.filename_disk,
        n.since as date_created
        from news n
        left join directus_files f on f.id = n.cover_img 
        where n.since <= now() and now() < n."until" and n.status = 'active' order by n.since desc`
        const formatted = data.map((n) => ({
            title: n.title,
            content: n.content,
            img: `https://mini-exchange-cms.ardsec.mn/assets/${n.filename_disk}`,
            createdAt: n.date_created,
        }))
        return {
            pagination: {
                total: data.length,
                size: data.length,
                offset: 0,
            },
            data: formatted,
        }
    }
}

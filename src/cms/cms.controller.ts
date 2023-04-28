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
            created_at: Date,
        }[]>`select 
        n.title,
        n."content",
        f.filename_disk,
        n.created_at
        from news n
        left join directus_files f on f.id = n.cover_img 
        where n.since <= now() and now() < n."until" and n.status = 'active'`
        const formatted = data.map((n) => ({
            title: n.title,
            content: n.content,
            img: `https://mini-exchange-admin.dsolutions.mn/assets/${n.filename_disk}`,
            created_at: n.created_at,
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

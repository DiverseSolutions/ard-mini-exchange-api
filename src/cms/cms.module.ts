import { Module } from '@nestjs/common';
import { CmsController } from './cms.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CmsController]
})
export class CmsModule {}

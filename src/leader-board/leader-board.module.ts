import { Module } from '@nestjs/common';
import { LeaderBoardController } from './leader-board.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
  controllers: [LeaderBoardController]
})
export class LeaderBoardModule {}

import { Module } from '@nestjs/common';
import { GlobalService } from './global/global.service';

@Module({
  providers: [GlobalService],
  exports: [GlobalService]
})
export class UtilsModule {}

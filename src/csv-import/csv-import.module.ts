import { Module } from '@nestjs/common';
import { CsvImportController } from './csv-import.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CsvImportController]
})
export class CsvImportModule {}

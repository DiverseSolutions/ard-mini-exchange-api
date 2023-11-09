import { Test, TestingModule } from '@nestjs/testing';
import { CsvImportController } from './csv-import.controller';

describe('CsvImportController', () => {
  let controller: CsvImportController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CsvImportController],
    }).compile();

    controller = module.get<CsvImportController>(CsvImportController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

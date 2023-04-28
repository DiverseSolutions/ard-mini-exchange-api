import { Test, TestingModule } from '@nestjs/testing';
import { LeaderBoardController } from './leader-board.controller';

describe('LeaderBoardController', () => {
  let controller: LeaderBoardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeaderBoardController],
    }).compile();

    controller = module.get<LeaderBoardController>(LeaderBoardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

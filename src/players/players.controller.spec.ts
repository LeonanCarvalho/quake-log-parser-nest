import { Test, TestingModule } from '@nestjs/testing';
import { PlayersController } from './players.controller';
import { PlayersService } from './players.service';
import { Player } from '@prisma/client';

describe('PlayersController', () => {
  let controller: PlayersController;

  const mockPlayersService = {
    create: jest.fn((dto): Promise<Player> => Promise.resolve({ id: '1', ...dto })),
    findAll: jest.fn((): Promise<Player[]> => Promise.resolve([])),
    findOne: jest.fn((id: string): Promise<Player> => Promise.resolve({ id, name: 'Test Player' })),
    update: jest.fn().mockResolvedValue({}),
    remove: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlayersController],
      providers: [{ provide: PlayersService, useValue: mockPlayersService }],
    }).compile();

    controller = module.get<PlayersController>(PlayersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a player', async () => {
    const dto = { name: 'Test' };
    await controller.create(dto);
    expect(mockPlayersService.create).toHaveBeenCalledWith(dto);
  });

  it('should find all players', async () => {
    await controller.findAll();
    expect(mockPlayersService.findAll).toHaveBeenCalled();
  });

  it('should find one player by id', async () => {
    await controller.findOne('1');
    expect(mockPlayersService.findOne).toHaveBeenCalledWith('1');
  });

  it('should update a player', async () => {
    const dto = { name: 'Updated' };
    await controller.update('1', dto);
    expect(mockPlayersService.update).toHaveBeenCalledWith('1', dto);
  });

  it('should remove a player', async () => {
    await controller.remove('1');
    expect(mockPlayersService.remove).toHaveBeenCalledWith('1');
  });
});

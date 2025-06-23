import { Test, TestingModule } from '@nestjs/testing';
import { PlayersController } from './players.controller';
import { PlayersService } from './players.service';

describe('PlayersController', () => {
  let controller: PlayersController;

  const mockPlayersService = {
    create: jest.fn((dto) => ({ id: '1', ...dto })),
    findAll: jest.fn(() => []),
    findOne: jest.fn((id) => ({ id, name: 'Test Player' })),
    update: jest.fn((id, dto) => ({ id, ...dto })),
    remove: jest.fn((id) => ({ message: `Player with ID "${id}" successfully removed.` })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlayersController],
      providers: [
        {
          provide: PlayersService,
          useValue: mockPlayersService,
        },
      ],
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
    const dto = { name: 'Updated Test' };
    await controller.update('1', dto);
    expect(mockPlayersService.update).toHaveBeenCalledWith('1', dto);
  });

  it('should remove a player', async () => {
    await controller.remove('1');
    expect(mockPlayersService.remove).toHaveBeenCalledWith('1');
  });
});

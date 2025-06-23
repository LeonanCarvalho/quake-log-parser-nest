import { Test, TestingModule } from '@nestjs/testing';
import { PlayersController } from './players.controller';
import { PlayersService } from './players.service';

describe('PlayersController', () => {
  let controller: PlayersController;
  let service: PlayersService;

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
    service = module.get<PlayersService>(PlayersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a player', () => {
    const dto = { name: 'Test' };
    expect(controller.create(dto)).toEqual({ id: '1', ...dto });
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should find all players', () => {
    controller.findAll();
    expect(service.findAll).toHaveBeenCalled();
  });

  it('should find one player by id', () => {
    controller.findOne('1');
    expect(service.findOne).toHaveBeenCalledWith('1');
  });

  it('should update a player', () => {
    const dto = { name: 'Updated Test' };
    controller.update('1', dto);
    expect(service.update).toHaveBeenCalledWith('1', dto);
  });

  it('should remove a player', () => {
    controller.remove('1');
    expect(service.remove).toHaveBeenCalledWith('1');
  });
});

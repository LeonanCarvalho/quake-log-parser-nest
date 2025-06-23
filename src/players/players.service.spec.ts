import { Test, TestingModule } from '@nestjs/testing';
import { PlayersService } from './players.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

const mockPlayer = { id: '1', name: 'Zeh' };
const mockPlayersList = [mockPlayer, { id: '2', name: 'Dono da Bola' }];

const mockPrismaService = {
  player: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('PlayersService', () => {
  let service: PlayersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlayersService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<PlayersService>(PlayersService);
    service = module.get<PlayersService>(PlayersService);

    jest.clearAllMocks();
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new player successfully', async () => {
      mockPrismaService.player.create.mockResolvedValue(mockPlayer);

      const createDto = { name: 'Zeh' };
      await expect(service.create(createDto)).resolves.toEqual(mockPlayer);
      expect(mockPrismaService.player.create).toHaveBeenCalledWith({ data: createDto });
    });

    it('should throw a ConflictException if player name already exists', async () => {
      const error = new Prisma.PrismaClientKnownRequestError('Player already exists', {
        code: 'P2002',
        clientVersion: 'x.x.x',
        meta: {},
      });
      mockPrismaService.player.create.mockRejectedValue(error);

      await expect(service.create({ name: 'Zeh' })).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return an array of players', async () => {
      mockPrismaService.player.findMany.mockResolvedValue(mockPlayersList);
      await expect(service.findAll()).resolves.toEqual(mockPlayersList);
    });
  });

  describe('findOne', () => {
    it('should return a single player', async () => {
      mockPrismaService.player.findUnique.mockResolvedValue(mockPlayer);
      await expect(service.findOne('1')).resolves.toEqual(mockPlayer);
      expect(mockPrismaService.player.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('should throw a NotFoundException if player does not exist', async () => {
      mockPrismaService.player.findUnique.mockResolvedValue(null);
      await expect(service.findOne('99')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a player successfully', async () => {
      const updateDto = { name: 'Zeh Atualizado' };

      mockPrismaService.player.findUnique.mockResolvedValue(mockPlayer);
      mockPrismaService.player.update.mockResolvedValue({ ...mockPlayer, ...updateDto });

      await expect(service.update('1', updateDto)).resolves.toEqual({
        ...mockPlayer,
        ...updateDto,
      });
      expect(mockPrismaService.player.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateDto,
      });
    });
  });

  describe('remove', () => {
    it('should remove a player successfully', async () => {
      mockPrismaService.player.findUnique.mockResolvedValue(mockPlayer);
      mockPrismaService.player.delete.mockResolvedValue(mockPlayer);

      await expect(service.remove('1')).resolves.toEqual({
        message: 'Player with ID "1" successfully removed.',
      });
      expect(mockPrismaService.player.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });
});

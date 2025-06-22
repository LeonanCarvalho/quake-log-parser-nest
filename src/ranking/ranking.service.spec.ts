import { Test, TestingModule } from '@nestjs/testing';
import { RankingService } from './ranking.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPlayerStats = [
  { playerId: 'player2', _sum: { kills: 20, deaths: 5 } },
  { playerId: 'player1', _sum: { kills: 15, deaths: 2 } },
];

const mockPlayers = [
  { id: 'player1', name: 'Zeh' },
  { id: 'player2', name: 'Manoel' },
];

// Mock completo do PrismaService
const mockPrismaService = {
  playerMatchStats: {
    groupBy: jest.fn().mockResolvedValue(mockPlayerStats),
  },
  player: {
    findMany: jest.fn().mockResolvedValue(mockPlayers),
  },
};

describe('RankingService', () => {
  let service: RankingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RankingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<RankingService>(RankingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getGlobalRanking', () => {
    it('should correctly calculate and sort the global player ranking', async () => {
      const ranking = await service.getGlobalRanking();

      expect(ranking).toEqual([
        { rank: 1, playerName: 'Manoel', totalKills: 20, totalDeaths: 5 },
        { rank: 2, playerName: 'Zeh', totalKills: 15, totalDeaths: 2 },
      ]);

      expect(mockPrismaService.playerMatchStats.groupBy).toHaveBeenCalled();
      expect(mockPrismaService.player.findMany).toHaveBeenCalled();
    });

    it('should return an empty array if there are no stats', async () => {
      mockPrismaService.playerMatchStats.groupBy.mockResolvedValueOnce([]);
      const ranking = await service.getGlobalRanking();
      expect(ranking).toEqual([]);
    });
  });
});

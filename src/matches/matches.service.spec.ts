import { Test, TestingModule } from '@nestjs/testing';
import { MatchesService } from './matches.service';
import { ParserService } from '../parser/parser.service';
import { GameProcessorService, MatchReport } from '../game/game-processor.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MatchesService', () => {
  let service: MatchesService;

  const mockPrismaService = {
    $transaction: jest
      .fn()
      .mockImplementation(
        (callback: (prisma: typeof mockPrismaService) => Promise<any>): Promise<any> => {
          return callback(mockPrismaService);
        },
      ),
    match: { findUnique: jest.fn(), create: jest.fn() },
    player: { findMany: jest.fn().mockResolvedValue([]), createMany: jest.fn() },
  };

  const mockGameProcessorService = {
    clear: jest.fn(() => {}),
    processLine: jest.fn(() => {}),
    // getReports should return an object mapping match ids to MatchReport
    getReports: jest.fn<Record<string, MatchReport>, any>(() => ({})),
    completeProcessing: jest.fn(() => {}),
  };

  const mockParserService = {
    parseLine: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchesService,
        { provide: ParserService, useValue: mockParserService },
        { provide: GameProcessorService, useValue: mockGameProcessorService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<MatchesService>(MatchesService);
    service = module.get<MatchesService>(MatchesService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should process a log file and save the generated reports', async () => {
    const logBuffer = Buffer.from('line1\nline2');
    const fakeReport: MatchReport = {
      total_kills: 1,
      players: ['Player1'],
      kills: { Player1: 1 },
      deaths: { Player1: 0 },
      streaks: { Player1: 1 },
      favoriteWeapons: { Player1: 'M16' },
      awards: { Player1: ['PERFECT_MATCH'] },
    };

    mockGameProcessorService.getReports.mockReturnValue({ match_1: fakeReport });
    mockPrismaService.match.findUnique.mockResolvedValue(null);

    await service.processLogFile(logBuffer);

    expect(mockGameProcessorService.clear).toHaveBeenCalled();
    expect(mockGameProcessorService.processLine).toHaveBeenCalledTimes(2);
    expect(mockGameProcessorService.getReports).toHaveBeenCalled();
    expect(mockPrismaService.$transaction).toHaveBeenCalled();
  });
});

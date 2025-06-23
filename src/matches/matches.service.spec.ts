import { Test, TestingModule } from '@nestjs/testing';
import { MatchesService } from './matches.service';
import { ParserService } from '../parser/parser.service';
import { GameProcessorService } from '../game/game-processor.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MatchesService', () => {
  let service: MatchesService;
  let gameProcessorService: GameProcessorService;

  const mockPrismaService = {
    // A função do callback recebe o próprio mock para simular o 'tx'
    $transaction: jest.fn().mockImplementation(async (callback) => callback(mockPrismaService)),
    match: { findUnique: jest.fn(), create: jest.fn() },
    player: { findUnique: jest.fn(), findMany: jest.fn(), createMany: jest.fn() },
  };

  const mockGameProcessorService = {
    clear: jest.fn(),
    processLine: jest.fn(),
    getReports: jest.fn().mockReturnValue({}),
    completeProcessing: jest.fn(),
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
    gameProcessorService = module.get<GameProcessorService>(GameProcessorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should process a log file and call the processor for each line', async () => {
    const logBuffer = Buffer.from('line1\nline2');
    mockPrismaService.match.findUnique.mockResolvedValue(null);

    await service.processLogFile(logBuffer);

    expect(gameProcessorService.clear).toHaveBeenCalled();
    expect(gameProcessorService.processLine).toHaveBeenCalledTimes(2);
    expect(gameProcessorService.getReports).toHaveBeenCalled();
    expect(mockPrismaService.$transaction).toHaveBeenCalled();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { MatchesService } from './matches.service';
import { ParserService } from '../parser/parser.service';
import { GameProcessorService } from '../game/game-processor.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MatchesService', () => {
  let service: MatchesService;
  let gameProcessorService: GameProcessorService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const mockParserService = {
      parseLine: jest.fn(),
    };
    const mockGameProcessorService = {
      clear: jest.fn(),
      processLine: jest.fn(),
      getReports: jest.fn().mockReturnValue({}),
    };
    const mockPrismaService = {
      $transaction: jest.fn().mockImplementation(async (callback) => {
        return callback({
          match: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn() },
          player: { findMany: jest.fn().mockResolvedValue([]), createMany: jest.fn() },
        });
      }),
    };

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
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

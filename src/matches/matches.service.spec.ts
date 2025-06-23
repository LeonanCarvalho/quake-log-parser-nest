import { Test, TestingModule } from '@nestjs/testing';
import { MatchesService } from './matches.service';
import { ParserService } from '../parser/parser.service';
import { GameProcessorService } from '../game/game-processor.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MatchesService', () => {
  let service: MatchesService;
  const mockPrismaService = {
    $transaction: jest.fn().mockImplementation((callback) => callback(mockPrismaService)),
    player: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      createMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const mockParserService = {
      parseLine: jest.fn(),
    };
    const mockGameProcessorService = {
      clear: jest.fn(),
      processLine: jest.fn(),
      getReports: jest.fn().mockReturnValue({}),
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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ParserService, LogLineType } from './parser.service';
import { time } from 'console';

describe('ParserService', () => {
  let service: ParserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ParserService],
    }).compile();

    service = module.get<ParserService>(ParserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should parse a "New match" line correctly', () => {
    const logLine = '23/04/2019 15:34:22 - New match 11348965 has started';
    const result = service.parseLine(logLine);

    expect(result).toEqual({
      time: '23/04/2019 15:34:22',
      type: LogLineType.MATCH_EVENT,
      payload: {
        matchId: '11348965',
        event: 'started',
      },
    });
  });

  it('should parse a "Match Ended" line with event correctly', () => {
    const logLine = '23/04/2019 15:39:22 - Match 11348965 has ended';
    const result = service.parseLine(logLine);

    expect(result).toEqual({
      time: '23/04/2019 15:39:22',
      type: LogLineType.MATCH_EVENT,
      payload: {
        matchId: '11348965',
        event: 'ended',
      },
    });
  });

  it('should parse a player kill line correctly', () => {
    const logLine = '23/04/2019 15:36:04 - Roman killed Nick using M16';
    const result = service.parseLine(logLine);

    expect(result).toEqual({
      time: '23/04/2019 15:36:04',
      type: LogLineType.KILL,
      payload: {
        killer: 'Roman',
        victim: 'Nick',
        weapon: 'M16',
      },
    });
  });

  it('should parse a world kill line correctly', () => {
    const logLine = '23/04/2019 15:36:33 - <WORLD> killed Nick by DROWN';
    const result = service.parseLine(logLine);

    expect(result).toEqual({
      time: '23/04/2019 15:36:33',
      type: LogLineType.WORLD_KILL,
      payload: {
        killer: '<WORLD>',
        victim: 'Nick',
        cause: 'DROWN',
      },
    });
  });

  it('should return UNKNOWN for unrecognized lines', () => {
    const logLine = '23/04/2019 15:36:04 - Some other log line';
    const result = service.parseLine(logLine);

    expect(result).toEqual({
      type: LogLineType.UNKNOWN,
    });
  });

  it('should return UnparsableLine for corrupted lines', () => {
    const logLine =
      '23/04/2019 15:36:33 - <WORLD> killed Nick b23/04/2019 15:36:04 - New match 11348 23/04/2019 15:36:0';
    const result = service.parseLine(logLine);

    expect(result).toEqual({
      time: expect.any(String),
      type: LogLineType.WORLD_KILL,
      payload: { raw: logLine },
    });
  });
});

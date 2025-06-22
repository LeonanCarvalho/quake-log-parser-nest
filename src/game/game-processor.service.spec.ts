import { GameProcessorService } from './game-processor.service';
import { KillPayload, LogLineType, NewMatchPayload, ParsedLine } from '../parser/parser.service';

describe('GameProcessorService', () => {
  let service: GameProcessorService;

  beforeEach(() => {
    service = new GameProcessorService();
  });

  it('should process a single match and generate a report', () => {
    const lines: ParsedLine[] = [
      {
        type: LogLineType.MATCH_EVENT,
        payload: { matchId: '1', event: 'started' } as NewMatchPayload,
      },
      {
        type: LogLineType.KILL,
        payload: {
          killer: 'Player1',
          victim: 'Player2',
          weapon: 'M16',
        } as KillPayload,
      },
      {
        type: LogLineType.WORLD_KILL,
        payload: {
          victim: 'Player1',
          cause: 'DROWN',
        } as any,
      },
      {
        type: LogLineType.MATCH_EVENT,
        payload: { matchId: '1', event: 'ended' } as NewMatchPayload,
      },
    ];

    lines.forEach((line) => service.processLine(line));
    const reports = service.getReports();

    expect(reports).toHaveProperty('1');
    const matchReport = reports['1'];

    expect(matchReport.total_kills).toBe(2);
    expect(matchReport.players).toEqual(['Player1', 'Player2']);
    expect(matchReport.kills).toEqual({
      Player1: 1,
      Player2: -1, // Player1 killed by WORLD, loses 1 frag
    });
    expect(matchReport.deaths).toEqual({
      Player1: 1,
      Player2: 1,
    });
  });

  it('should handle multiple concurrent matches', () => {
    const lines: ParsedLine[] = [
      // Match 1
      {
        type: LogLineType.MATCH_EVENT,
        payload: { matchId: '1', event: 'started' } as NewMatchPayload,
      },
      {
        type: LogLineType.KILL,
        payload: { killer: 'P1', victim: 'P2', weapon: 'M16' } as KillPayload,
      },
      // Match 2
      {
        type: LogLineType.MATCH_EVENT,
        payload: { matchId: '2', event: 'started' } as NewMatchPayload,
      },
      {
        type: LogLineType.KILL,
        payload: { killer: 'P3', victim: 'P4', weapon: 'AK47' } as KillPayload,
      },
      // Match 1 ends
      {
        type: LogLineType.MATCH_EVENT,
        payload: { matchId: '1', event: 'ended' } as NewMatchPayload,
      },
      // Match 2 ends
      {
        type: LogLineType.MATCH_EVENT,
        payload: { matchId: '2', event: 'ended' } as NewMatchPayload,
      },
    ];

    lines.forEach((line) => service.processLine(line));
    const reports = service.getReports();

    expect(reports).toHaveProperty('1');
    expect(reports).toHaveProperty('2');

    expect(reports['1'].total_kills).toBe(1);
    expect(reports['1'].kills).toEqual({ P1: 1 });

    expect(reports['2'].total_kills).toBe(1);
    expect(reports['2'].kills).toEqual({ P3: 1 });
  });
});

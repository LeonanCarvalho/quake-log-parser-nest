import { GameProcessorService } from './game-processor.service';
import { KillPayload, LogLineType, MatchEventPayload, ParsedLine } from '../parser/parser.service';

describe('GameProcessorService', () => {
  let service: GameProcessorService;

  beforeEach(() => {
    service = new GameProcessorService();
  });

  it('should process a single match and generate a correct report', () => {
    const lines: ParsedLine[] = [
      {
        type: LogLineType.MATCH_EVENT,
        payload: { matchId: '1', event: 'started' } as MatchEventPayload,
      },
      {
        type: LogLineType.KILL,
        payload: { killer: 'Player1', victim: 'Player2', weapon: 'M16' } as KillPayload,
      },
      {
        type: LogLineType.KILL,
        payload: { killer: 'Player1', victim: 'Player3', weapon: 'AK47' } as KillPayload,
      },
      { type: LogLineType.WORLD_KILL, payload: { victim: 'Player1', cause: 'DROWN' } as any },
      {
        type: LogLineType.MATCH_EVENT,
        payload: { matchId: '1', event: 'ended' } as MatchEventPayload,
      },
    ];

    lines.forEach((line) => service.processLine(line));
    const report = service.getReports()['1'];

    expect(report.total_kills).toBe(3);
    expect(report.players).toEqual(['Player1', 'Player2', 'Player3']);

    // Player1: 2 kills, -1 por morte do WORLD = 1 kill.
    expect(report.kills).toEqual({
      Player1: 1,
      Player2: 0,
      Player3: 0,
    });

    expect(report.deaths).toEqual({
      Player1: 1,
      Player2: 1,
      Player3: 1,
    });
  });

  it('should handle multiple matches sequentially in one log file', () => {
    const lines: ParsedLine[] = [
      // Match 1
      {
        type: LogLineType.MATCH_EVENT,
        payload: { matchId: '1', event: 'started' } as MatchEventPayload,
      },
      {
        type: LogLineType.KILL,
        payload: { killer: 'P1', victim: 'P2', weapon: 'M16' } as KillPayload,
      },
      {
        type: LogLineType.MATCH_EVENT,
        payload: { matchId: '1', event: 'ended' } as MatchEventPayload,
      },
      // Match 2
      {
        type: LogLineType.MATCH_EVENT,
        payload: { matchId: '2', event: 'started' } as MatchEventPayload,
      },
      {
        type: LogLineType.KILL,
        payload: { killer: 'P3', victim: 'P4', weapon: 'AK47' } as KillPayload,
      },
      {
        type: LogLineType.MATCH_EVENT,
        payload: { matchId: '2', event: 'ended' } as MatchEventPayload,
      },
    ];

    lines.forEach((line) => service.processLine(line));
    const reports = service.getReports();

    expect(reports['1']).toBeDefined();
    expect(reports['1'].total_kills).toBe(1);
    expect(reports['1'].kills).toEqual({ P1: 1, P2: 0 });

    expect(reports['2']).toBeDefined();
    expect(reports['2'].total_kills).toBe(1);
    expect(reports['2'].kills).toEqual({ P3: 1, P4: 0 });
  });

  // O teste de bônus deve continuar passando com a nova implementação
  describe('Bonus Features', () => {
    it('should correctly calculate max streak and favorite weapon', () => {
      const lines: ParsedLine[] = [
        {
          type: LogLineType.MATCH_EVENT,
          payload: { matchId: 'bonus_match', event: 'started' } as MatchEventPayload,
        },
        {
          type: LogLineType.KILL,
          payload: { killer: 'Player1', victim: 'Player2', weapon: 'M16' } as KillPayload,
        },
        {
          type: LogLineType.KILL,
          payload: { killer: 'Player1', victim: 'Player3', weapon: 'M16' } as KillPayload,
        },
        { type: LogLineType.WORLD_KILL, payload: { victim: 'Player1', cause: 'DROWN' } as any },
        {
          type: LogLineType.KILL,
          payload: { killer: 'Player1', victim: 'Player2', weapon: 'AK47' } as KillPayload,
        },
        {
          type: LogLineType.KILL,
          payload: { killer: 'Player2', victim: 'Player3', weapon: 'Shotgun' } as KillPayload,
        },
        {
          type: LogLineType.MATCH_EVENT,
          payload: { matchId: 'bonus_match', event: 'ended' } as MatchEventPayload,
        },
      ];

      lines.forEach((line) => service.processLine(line));
      const report = service.getReports()['bonus_match'];

      expect(report.streaks['Player1']).toBe(2);
      expect(report.streaks['Player2']).toBe(1);
      expect(report.favoriteWeapons['Player1']).toBe('M16');
      expect(report.favoriteWeapons['Player2']).toBe('Shotgun');
      expect(report.favoriteWeapons['Player3']).toBeUndefined();
    });
  });
});
describe('GameProcessorService - Bonus Features', () => {
  let service: GameProcessorService;

  beforeEach(() => {
    service = new GameProcessorService();
  });

  it('should correctly calculate max streak and favorite weapon', () => {
    const lines: ParsedLine[] = [
      {
        type: LogLineType.MATCH_EVENT,
        payload: { matchId: 'bonus_match', event: 'started' } as MatchEventPayload,
      },
      // Player1 streak
      {
        type: LogLineType.KILL,
        payload: { killer: 'Player1', victim: 'Player2', weapon: 'M16' } as KillPayload,
      },
      {
        type: LogLineType.KILL,
        payload: { killer: 'Player1', victim: 'Player3', weapon: 'M16' } as KillPayload,
      },
      // Player1 morre, zerando o streak
      { type: LogLineType.WORLD_KILL, payload: { victim: 'Player1', cause: 'DROWN' } as any },
      // Player1 nova streak (menor)
      {
        type: LogLineType.KILL,
        payload: { killer: 'Player1', victim: 'Player2', weapon: 'AK47' } as KillPayload,
      },
      // Player2 mata com a shotgun
      {
        type: LogLineType.KILL,
        payload: { killer: 'Player2', victim: 'Player3', weapon: 'Shotgun' } as KillPayload,
      },
      {
        type: LogLineType.MATCH_EVENT,
        payload: { matchId: 'bonus_match', event: 'ended' } as MatchEventPayload,
      },
    ];

    lines.forEach((line) => service.processLine(line));
    const report = service.getReports()['bonus_match'];

    // Validação do relatório final
    expect(report.streaks['Player1']).toBe(2); // O maior streak foi de 2, antes de morrer.
    expect(report.streaks['Player2']).toBe(1);
    expect(report.favoriteWeapons['Player1']).toBe('M16'); // Matou 2x com M16 e 1x com AK47
    expect(report.favoriteWeapons['Player2']).toBe('Shotgun');
    expect(report.favoriteWeapons['Player3']).toBeUndefined(); // Não matou ninguém
  });
});

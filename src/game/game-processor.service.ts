import { Injectable } from '@nestjs/common';
import {
  KillPayload,
  LogLineType,
  MatchEventPayload,
  ParsedLine,
  WorldKillPayload,
} from '../parser/parser.service';

interface MatchState {
  total_kills: number;
  players: Set<string>;
  kills: { [player: string]: number };
  deaths: { [player: string]: number };
  startTime?: string;
  endTime?: string;
}

@Injectable()
export class GameProcessorService {
  private activeMatches: Map<string, MatchState> = new Map();
  private matchReports: { [matchId: string]: any } = {};

  public processLine(parsedLine: ParsedLine): void {
    switch (parsedLine.type) {
      case LogLineType.MATCH_EVENT:
        this.handleMatchEvent(parsedLine.payload as MatchEventPayload, parsedLine.time);
        break;
      case LogLineType.KILL:
        this.handleKill(parsedLine.payload as KillPayload);
        break;
      case LogLineType.WORLD_KILL:
        this.handleWorldKill(parsedLine.payload as WorldKillPayload);
        break;
    }
  }

  public getReports() {
    return this.matchReports;
  }

  public clear(): void {
    this.activeMatches.clear();
    this.matchReports = {};
  }

  private handleMatchEvent(payload: MatchEventPayload, time?: string): void {
    if (payload.event === 'started') {
      this.activeMatches.set(payload.matchId, {
        total_kills: 0,
        players: new Set<string>(),
        kills: {},
        deaths: {},
        startTime: time,
      });
    } else if (payload.event === 'ended') {
      const matchState = this.activeMatches.get(payload.matchId);
      if (matchState) {
        matchState.endTime = time;
        this.matchReports[payload.matchId] = {
          ...matchState,
          players: Array.from(matchState.players),
        };
        this.activeMatches.delete(payload.matchId);
      }
    }
  }

  private handleKill(payload: KillPayload): void {
    // A lógica de pegar o último match ativo é uma heurística baseada no formato do log.
    // Se não houver matches ativos, ignoramos a linha.
    if (this.activeMatches.size === 0) return;
    const matchState = Array.from(this.activeMatches.values()).pop();

    // ADICIONAR ESTA VERIFICAÇÃO
    if (!matchState) return;

    const { killer, victim } = payload;

    this.addPlayer(matchState, killer);
    this.addPlayer(matchState, victim);

    matchState.total_kills++;

    if (killer !== '<WORLD>') {
      matchState.kills[killer] = (matchState.kills[killer] || 0) + 1;
    }

    matchState.deaths[victim] = (matchState.deaths[victim] || 0) + 1;
  }

  private handleWorldKill(payload: WorldKillPayload): void {
    if (this.activeMatches.size === 0) return;
    const matchState = Array.from(this.activeMatches.values()).pop();

    if (!matchState) return;

    const { victim } = payload;
    this.addPlayer(matchState, victim);

    matchState.total_kills++;

    matchState.kills[victim] = (matchState.kills[victim] || 0) - 1;
    matchState.deaths[victim] = (matchState.deaths[victim] || 0) + 1;
  }

  private addPlayer(state: MatchState, playerName: string): void {
    if (!state.players.has(playerName)) {
      state.players.add(playerName);
      state.kills[playerName] = 0;
      state.deaths[playerName] = 0;
    }
  }
}

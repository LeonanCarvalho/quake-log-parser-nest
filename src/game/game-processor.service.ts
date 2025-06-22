import { Injectable, Logger } from '@nestjs/common';
import {
  WorldRune,
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
  streaks: { [player: string]: { current: number; max: number } };
  killsByWeapon: { [player: string]: { [weapon: string]: number } };
}

@Injectable()
export class GameProcessorService {
  private readonly logger = new Logger(GameProcessorService.name);
  private currentMatch: { id: string; state: MatchState } | null = null;
  private matchReports: { [matchId: string]: any } = {};

  public processLine(parsedLine: ParsedLine): void {
    if (parsedLine.type === LogLineType.MATCH_EVENT) {
      this.handleMatchEvent(parsedLine.payload as MatchEventPayload, parsedLine.time);
      return;
    }

    if (!this.currentMatch) {
      this.logger.warn('Received game event without an active match. Skipping line.');
      return;
    }

    switch (parsedLine.type) {
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
    this.currentMatch = null;
    this.matchReports = {};
  }

  private handleMatchEvent(payload: MatchEventPayload, time?: string): void {
    if (payload.event === 'started') {
      if (this.currentMatch) {
        this.logger.warn(
          `Started new match ${payload.matchId} before match ${this.currentMatch.id} ended. Finalizing previous match implicitly.`,
        );
        this.finalizeCurrentMatch();
      }
      this.currentMatch = {
        id: payload.matchId,
        state: {
          total_kills: 0,
          players: new Set(),
          kills: {},
          deaths: {},
          startTime: time,
          streaks: {},
          killsByWeapon: {},
        },
      };
    } else if (payload.event === 'ended') {
      if (this.currentMatch && this.currentMatch.id === payload.matchId) {
        this.currentMatch.state.endTime = time;
        this.finalizeCurrentMatch();
      }
    }
  }

  private finalizeCurrentMatch() {
    if (!this.currentMatch) return;

    const { id, state } = this.currentMatch;

    const finalStreaks = {};
    const favoriteWeapons = {};
    for (const player of state.players) {
      finalStreaks[player] = state.streaks[player]?.max || 0;
      const weapons = state.killsByWeapon[player];
      if (weapons && Object.keys(weapons).length > 0) {
        favoriteWeapons[player] = Object.entries(weapons).sort((a, b) => b[1] - a[1])[0][0];
      }
    }

    this.matchReports[id] = {
      ...state,
      players: Array.from(state.players),
      streaks: finalStreaks,
      favoriteWeapons,
    };

    this.currentMatch = null;
  }

  private addPlayer(playerName: string): void {
    if (playerName === WorldRune || !this.currentMatch) return;
    const { state } = this.currentMatch;
    if (!state.players.has(playerName)) {
      state.players.add(playerName);
      state.kills[playerName] = 0;
      state.deaths[playerName] = 0;
      state.streaks[playerName] = { current: 0, max: 0 };
      state.killsByWeapon[playerName] = {};
    }
  }

  private handleKill(payload: KillPayload): void {
    const { killer, victim, weapon } = payload;
    this.addPlayer(killer);
    this.addPlayer(victim);

    const { state } = this.currentMatch!;
    state.total_kills++;
    state.deaths[victim]++;
    state.streaks[victim].current = 0; // Reset streak for victim

    if (killer !== WorldRune) {
      state.kills[killer]++;
      const killerStreak = state.streaks[killer];
      killerStreak.current++;
      if (killerStreak.current > killerStreak.max) {
        killerStreak.max = killerStreak.current;
      }
      const killerWeapons = state.killsByWeapon[killer];
      killerWeapons[weapon] = (killerWeapons[weapon] || 0) + 1;
    }
  }

  private handleWorldKill(payload: WorldKillPayload): void {
    const { victim } = payload;
    this.addPlayer(victim);

    const { state } = this.currentMatch!;
    state.total_kills++;
    state.deaths[victim]++;
    state.kills[victim]--; // Victim loses a frag
    state.streaks[victim].current = 0; // Reset streak for victim
  }
}

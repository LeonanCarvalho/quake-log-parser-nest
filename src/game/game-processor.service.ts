import { Injectable, Logger, Scope } from '@nestjs/common';
import {
  WorldRune,
  KillPayload,
  LogLineType,
  MatchEventPayload,
  ParsedLine,
  WorldKillPayload,
} from '../parser/parser.service';

interface KillEvent {
  killer: string;
  time: Date;
}

interface MatchState {
  total_kills: number;
  players: Set<string>;
  kills: { [player: string]: number };
  deaths: { [player: string]: number };
  startTime?: string;
  endTime?: string;
  streaks: { [player: string]: { current: number; max: number } };
  killsByWeapon: { [player: string]: { [weapon: string]: number } };
  killLog: KillEvent[];
}

const PlayerLimit = 20;

Injectable({ scope: Scope.REQUEST });
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
        this.handleKill(parsedLine.payload as KillPayload, parsedLine.time);
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
          killLog: [],
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

    const awards = this.calculateAwards(state);

    this.matchReports[id] = {
      ...state,
      players: Array.from(state.players),
      streaks: finalStreaks,
      favoriteWeapons,
      awards,
    };

    this.currentMatch = null;
  }

  private addPlayer(playerName: string): void {
    if (playerName === WorldRune || !this.currentMatch) return;

    const { state } = this.currentMatch;

    if (state.players.has(playerName)) return;

    if (state.players.size >= PlayerLimit) {
      this.logger.warn(`Player limit (${PlayerLimit}) reached. Ignoring new player: ${playerName}`);
      return; // TODO: Check if we want to log this or handle it differently
    }

    state.players.add(playerName);
    state.kills[playerName] = 0;
    state.deaths[playerName] = 0;
    state.streaks[playerName] = { current: 0, max: 0 };
    state.killsByWeapon[playerName] = {};
  }

  private handleKill(payload: KillPayload, time?: string): void {
    const { killer, victim, weapon } = payload;

    this.addPlayer(killer);
    this.addPlayer(victim);

    const { state } = this.currentMatch!;

    if (!state.players.has(victim)) {
      return;
    }

    state.total_kills++;
    state.deaths[victim]++;
    state.streaks[victim].current = 0;

    if (killer !== WorldRune && state.players.has(killer)) {
      state.kills[killer]++;

      const killerStreak = state.streaks[killer];
      killerStreak.current++;
      if (killerStreak.current > killerStreak.max) {
        killerStreak.max = killerStreak.current;
      }

      const killerWeapons = state.killsByWeapon[killer];
      killerWeapons[weapon] = (killerWeapons[weapon] || 0) + 1;

      if (time) {
        state.killLog.push({ killer, time: this.parseLogDate(time) || new Date() });
      }
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

  public completeProcessing(): void {
    this.finalizeCurrentMatch();
  }

  private calculateAwards(state: MatchState): { [player: string]: string[] } {
    const awards: { [player: string]: string[] } = {};
    const playersRanked = Array.from(state.players).sort(
      (a, b) => (state.kills[b] || 0) - (state.kills[a] || 0),
    );
    const winner = playersRanked[0];

    for (const player of state.players) {
      if (
        player === winner &&
        (state.deaths[player] || 0) === 0 &&
        (state.kills[player] || 0) > 0
      ) {
        awards[player] = [...(awards[player] || []), 'PERFECT_MATCH'];
      }

      const playerKills = state.killLog.filter((k) => k.killer === player);
      if (playerKills.length >= 5) {
        for (let i = 0; i <= playerKills.length - 5; i++) {
          const firstKillTime = playerKills[i].time.getTime();
          const fifthKillTime = playerKills[i + 4].time.getTime();
          if ((fifthKillTime - firstKillTime) / 1000 <= 60) {
            awards[player] = [...(awards[player] || []), 'KILLING_SPREE'];
            break;
          }
        }
      }
    }
    return awards;
  }

  private parseLogDate(dateString: string): Date | null {
    if (!dateString) return null;
    const parts = dateString.match(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/);
    if (!parts) return null;
    return new Date(+parts[3], +parts[2] - 1, +parts[1], +parts[4], +parts[5], +parts[6]);
  }
}

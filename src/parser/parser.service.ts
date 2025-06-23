import { Injectable } from '@nestjs/common';

export enum LogLineType {
  MATCH_EVENT,
  KILL,
  WORLD_KILL,
  UNKNOWN,
}

export interface ParsedLine {
  time?: string;
  type: LogLineType | LogLineType.UNKNOWN;
  payload?: MatchEventPayload | KillPayload | WorldKillPayload | UnparsableLine | undefined;
}

export interface MatchEventPayload {
  matchId: string;
  event: string;
}

export interface KillPayload {
  killer: string;
  victim: string;
  weapon: string;
}

export interface WorldKillPayload {
  killer: string;
  victim: string;
  cause: string;
}

export interface UnparsableLine {
  raw: string;
}

export const WorldRune = '<WORLD>';

const MatchEventRegex = /(?:New )?[Mm]atch (\d+) has (started|ended)$/;
const KillRegex = /(.*?) killed (.*?) using (.*)/;
const WorldKillRegex = /<WORLD> killed (.*?) by (.*)/;

@Injectable()
export class ParserService {
  public parseLine(rawLine: string): ParsedLine {
    let parsed: ParsedLine = {
      type: LogLineType.UNKNOWN,
    };

    const line = rawLine.trim();
    if (!line) return parsed;

    parsed.type = this.getLineType(line);
    if (parsed.type === LogLineType.UNKNOWN) {
      return parsed;
    }

    parsed.time = this.getTime(line);
    if (!parsed.time) return parsed;

    const logMessage = this.getLineMessage(line);

    parsed.payload = this.getPayload(parsed.type, logMessage);

    if (!parsed.payload) {
      parsed.payload = { raw: rawLine };
    }

    return parsed;
  }

  private getTime(line: string): string | undefined {
    const timeMatch = line.match(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}/);
    return timeMatch ? timeMatch[0] : undefined;
  }

  private getLineMessage(line: string): string {
    const timeMatch = line.match(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2} - (.*)/);
    return timeMatch ? timeMatch[1].trim() : line;
  }

  private getPayload(
    lineType: LogLineType,
    message: string,
  ): MatchEventPayload | KillPayload | WorldKillPayload | undefined {
    switch (lineType) {
      case LogLineType.MATCH_EVENT:
        return this.parseMatchEvent(message);
      case LogLineType.KILL:
        return this.parseKill(message);
      case LogLineType.WORLD_KILL:
        return this.parseWorldKill(message);
      default:
        return undefined;
    }
  }

  private getLineType(message: string): LogLineType {
    if (MatchEventRegex.test(message)) {
      return LogLineType.MATCH_EVENT;
    }

    if (message.includes(WorldRune + ' killed')) {
      return LogLineType.WORLD_KILL;
    }

    if (KillRegex.test(message)) {
      return LogLineType.KILL;
    }

    // Se não for nenhum dos tipos conhecidos, retornamos UNKNOWN
    return LogLineType.UNKNOWN;
  }

  private parseMatchEvent(message: string): MatchEventPayload | undefined {
    const match = message.match(MatchEventRegex);
    if (!match) return;

    const matchId = match[1];
    const event = match[2];

    return { matchId, event };
  }

  private parseKill(message: string): KillPayload | undefined {
    const match = message.match(KillRegex);

    if (!match) return;

    const [, killer, victim, weapon] = match;
    return { killer, victim, weapon };
  }

  private parseWorldKill(message: string): WorldKillPayload | undefined {
    const match = message.match(WorldKillRegex);

    if (!match) return;

    const [, victim, cause] = match;
    return { killer: WorldRune, victim, cause };
  }
}

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ParserService } from '../parser/parser.service';
import { GameProcessorService } from '../game/game-processor.service';
import { PrismaService } from '../prisma/prisma.service'; // Assumindo um PrismaService
import * as readline from 'readline';
import { Readable } from 'stream';

@Injectable()
export class MatchesService {
  private readonly logger = new Logger(MatchesService.name);

  constructor(
    private readonly parserService: ParserService,
    private readonly gameProcessorService: GameProcessorService,
    private readonly prisma: PrismaService,
  ) {}

  async processLogFile(logBuffer: Buffer) {
    this.gameProcessorService.clear();

    const stream = Readable.from(logBuffer.toString());
    const rl = readline.createInterface({
      input: stream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      const parsedLine = this.parserService.parseLine(line);
      this.gameProcessorService.processLine(parsedLine);
    }

    const reports = this.gameProcessorService.getReports();
    this.logger.log(`Generated ${Object.keys(reports).length} match reports from log file.`);

    // Persistir os relatórios no banco de dados
    return this.saveReports(reports);
  }

  private async saveReports(reports: { [matchId: string]: any }) {
    const savedMatchIds: string[] = [];

    for (const matchId in reports) {
      const report = reports[matchId];

      try {
        const result = await this.prisma.$transaction(async (tx) => {
          const existingMatch = await tx.match.findUnique({ where: { id: matchId } });
          if (existingMatch) {
            this.logger.warn(`Match ${matchId} already exists. Skipping.`);
            return null;
          }

          const playerNamesInMatch = report.players as string[];

          const existingPlayers = await tx.player.findMany({
            where: { name: { in: playerNamesInMatch } },
          });
          const existingPlayerNames = new Set(existingPlayers.map((p) => p.name));

          const newPlayersData = playerNamesInMatch
            .filter((name) => !existingPlayerNames.has(name))
            .map((name) => ({ name }));

          if (newPlayersData.length > 0) {
            await tx.player.createMany({ data: newPlayersData });
          }

          const allPlayersInMatch = await tx.player.findMany({
            where: { name: { in: playerNamesInMatch } },
          });
          const playerMap = new Map(allPlayersInMatch.map((p) => [p.name, p.id]));

          await tx.match.create({
            data: {
              id: matchId,
              totalKills: report.total_kills,
              startTime: report.startTime ? new Date(report.startTime) : new Date(),
              endTime: report.endTime ? new Date(report.endTime) : new Date(),
              players: {
                create: playerNamesInMatch.map((playerName) => ({
                  playerId: playerMap.get(playerName)!,
                  kills: report.kills[playerName] || 0,
                  deaths: report.deaths[playerName] || 0,
                })),
              },
            },
          });

          return matchId;
        });

        if (result) {
          savedMatchIds.push(result);
          this.logger.log(`Transaction for Match ${result} committed successfully.`);
        }
      } catch (error) {
        this.logger.error(`Transaction for Match ${matchId} failed and was rolled back.`, error);
      }
    }

    return {
      message: `${savedMatchIds.length} matches processed and saved.`,
      matchIds: savedMatchIds,
    };
  }

  findAll() {
    return this.prisma.match.findMany({
      include: { players: { include: { player: true } } },
    });
  }

  async getMatchReport(id: string) {
    const match = await this.prisma.match.findUnique({
      where: { id },
      include: {
        players: {
          include: { player: true },
          orderBy: { kills: 'desc' },
        },
      },
    });

    if (!match) {
      throw new NotFoundException(`Match with ID ${id} not found.`);
    }

    // Formatar o ranking
    const ranking = match.players.map((p) => ({
      player: p.player.name,
      kills: p.kills,
      deaths: p.deaths,
    }));

    return {
      match_id: match.id,
      total_kills: match.totalKills,
      ranking,
    };
  }
}

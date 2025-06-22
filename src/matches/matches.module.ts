import { Injectable, NotFoundException } from '@nestjs/common';
import { ParserService } from '../parser/parser.service';
import { GameProcessorService } from '../game/game-processor.service';
import { PrismaService } from '../prisma/prisma.service'; 
import * as readline from 'readline';
import { Readable } from 'stream';

@Injectable()
export class MatchesService {
  // O PrismaService deve ser injetado.
  // Vamos adicioná-lo ao módulo e construtor.
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
    // Aqui você irá persistir os `reports` no banco de dados usando o Prisma.
    // Esta parte da implementação fica como próximo passo.

    return reports;
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

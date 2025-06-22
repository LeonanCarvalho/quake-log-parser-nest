import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GlobalRankingPlayerDto } from './dto/global-ranking-response.dto';

@Injectable()
export class RankingService {
  constructor(private readonly prisma: PrismaService) {}

  async getGlobalRanking(): Promise<GlobalRankingPlayerDto[]> {
    const playerStats = await this.prisma.playerMatchStats.groupBy({
      by: ['playerId'],
      _sum: {
        kills: true,
        deaths: true,
      },
      orderBy: {
        _sum: {
          kills: 'desc',
        },
      },
    });

    if (playerStats.length === 0) {
      return [];
    }

    const playerIds = playerStats.map((p) => p.playerId);
    const players = await this.prisma.player.findMany({
      where: { id: { in: playerIds } },
      select: { id: true, name: true },
    });
    const playerMap = new Map(players.map((p) => [p.id, p.name]));

    return playerStats.map((stat, index) => ({
      rank: index + 1,
      playerName: playerMap.get(stat.playerId)!,
      totalKills: stat._sum.kills || 0,
      totalDeaths: stat._sum.deaths || 0,
    }));
  }
}

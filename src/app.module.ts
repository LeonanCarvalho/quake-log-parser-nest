import { Module } from '@nestjs/common';
import { MatchesModule } from './matches/matches.module';
import { PlayersModule } from './players/players.module';
import { ParserModule } from './parser/parser.module';
import { PrismaModule } from './prisma/prisma.module';
import { GameModule } from './game/game.module';
import { RankingModule } from './ranking/ranking.module';

@Module({
  imports: [PrismaModule, MatchesModule, PlayersModule, ParserModule, GameModule, RankingModule],
})
export class AppModule {}

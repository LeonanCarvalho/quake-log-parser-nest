import { Module } from '@nestjs/common';
// import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ParserModule } from './parser/parser.module';
import { GameModule } from './game/game.module';
import { RankingService } from './ranking/ranking.service';

@Module({
  imports: [PrismaModule, ParserModule, GameModule, RankingService],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}

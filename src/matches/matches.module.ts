import { Module } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { ParserModule } from '../parser/parser.module';
import { GameModule } from '../game/game.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ParserModule, GameModule, PrismaModule],
  controllers: [MatchesController],
  providers: [MatchesService],
})
export class MatchesModule {}

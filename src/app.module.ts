import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MatchesModule } from './matches/matches.module';
import { PlayersModule } from './players/players.module';
import { ParserModule } from './parser/parser.module';

@Module({
  imports: [MatchesModule, PlayersModule, ParserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

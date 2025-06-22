import { Controller, Get } from '@nestjs/common';
import { RankingService } from './ranking.service';
import { GlobalRankingPlayerDto } from './dto/global-ranking-response.dto';

@Controller('ranking')
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  @Get('global')
  async getGlobalRanking(): Promise<GlobalRankingPlayerDto[]> {
    return this.rankingService.getGlobalRanking();
  }
}

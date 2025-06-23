import { Controller, Get } from '@nestjs/common';
import { RankingService } from './ranking.service';
import { GlobalRankingPlayerDto } from './dto/global-ranking-response.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('ranking')
@Controller('ranking')
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  @Get('global')
  @ApiOperation({ summary: 'Busca o ranking global de jogadores agregando todas as partidas.' })
  @ApiResponse({
    status: 200,
    description: 'Ranking global retornado com sucesso.',
    type: [GlobalRankingPlayerDto],
  })
  async getGlobalRanking(): Promise<GlobalRankingPlayerDto[]> {
    return this.rankingService.getGlobalRanking();
  }
}

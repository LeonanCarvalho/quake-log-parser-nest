import { Controller, Get, Post, Param, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiConsumes, ApiOperation, ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { MatchesService } from './matches.service';

@ApiTags('matches')
@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('logFile'))
  @ApiOperation({ summary: 'Processa um arquivo de log de partidas.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Arquivo de log (.txt) a ser processado.',
    schema: {
      type: 'object',
      properties: {
        logFile: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Arquivo processado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Arquivo inválido.' })
  @ApiResponse({ status: 500, description: 'Erro ao processar o arquivo.' })
  uploadLogFile(@UploadedFile() file: Express.Multer.File) {
    return this.matchesService.processLogFile(file.buffer);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as partidas.' })
  @ApiResponse({ status: 200, description: 'Lista de partidas retornada com sucesso.' })
  @ApiResponse({ status: 500, description: 'Erro ao buscar partidas.' })
  findAll() {
    return this.matchesService.findAll();
  }

  @Get(':id/report')
  @ApiOperation({ summary: 'Obtém o relatório de uma partida específica.' })
  @ApiResponse({ status: 200, description: 'Relatório da partida retornado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Partida não encontrada.' })
  @ApiResponse({ status: 500, description: 'Erro ao buscar relatório da partida .' })
  getMatchReport(@Param('id') id: string) {
    return this.matchesService.getMatchReport(id);
  }
}
